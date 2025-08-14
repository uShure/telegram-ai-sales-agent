import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";
import { Api } from "telegram";
import input from "input";
import dotenv from "dotenv";
import { database } from "../database/database";
import { AIAgent } from "../ai/aiAgent";
import { coursesDB } from "../database/coursesDB";
import fs from "node:fs";
import path from "node:path";
import { logger } from "../utils/logger";
import { globalRateLimiter } from "../utils/rateLimiter";
import { validateMessage } from "../utils/validator";
import { config } from "../config/env";

dotenv.config();

// Карта для кеширования успешных entity
interface TelegramEntity {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
}

const entityCache = new Map<string, TelegramEntity>();

export class EnhancedTelegramBot {
  private client: TelegramClient;
  private session: StringSession;
  private aiAgent: AIAgent;
  private isRunning = false;
  private processedMessages: Set<number> = new Set();
  private messageCleanupInterval?: NodeJS.Timeout;

  constructor() {
    const sessionFile = path.join(process.cwd(), "sointera_sales_session.txt");
    const savedSession = fs.existsSync(sessionFile)
      ? fs.readFileSync(sessionFile, "utf-8").trim()
      : "";

    this.session = new StringSession(savedSession);
    this.aiAgent = new AIAgent();

    this.client = new TelegramClient(
      this.session,
      config.apiId,
      config.apiHash,
      {
        connectionRetries: 5,
        autoReconnect: true,
        retryDelay: 1000,
      },
    );

    // Очистка processedMessages каждый час для предотвращения утечки памяти
    this.messageCleanupInterval = setInterval(() => {
      if (this.processedMessages.size > 1000) {
        const toKeep = Array.from(this.processedMessages).slice(-500);
        this.processedMessages = new Set(toKeep);
        logger.debug("Cleaned up processed messages cache");
      }
    }, 3600000);
  }

  private saveSession(): void {
    const sessionFile = path.join(process.cwd(), "sointera_sales_session.txt");
    fs.writeFileSync(sessionFile, this.session.save());
    console.log("✅ Сессия сохранена");
  }

  async start(): Promise<void> {
    console.log("🚀 Запуск Enhanced Telegram клиента...");

    await this.client.start({
      phoneNumber: async () =>
        process.env.PHONE_NUMBER ||
        (await input.text("Введите номер телефона: ")),
      password: async () => await input.text("Введите пароль (если есть): "),
      phoneCode: async () => await input.text("Введите код из Telegram: "),
      onError: (err) => console.error("Ошибка:", err),
    });

    console.log("✅ Вы успешно вошли в систему!");
    this.saveSession();

    await database.initialize();
    console.log("✅ База данных диалогов инициализирована");

    // Проверяем доступность базы курсов
    try {
      const coursesCount = await coursesDB.getAllCourses();
      console.log(
        `✅ База курсов подключена: ${coursesCount.length} активных курсов`,
      );
    } catch (error) {
      console.error("⚠️  Ошибка подключения к базе курсов:", error);
    }

    this.client.addEventHandler(
      this.handleNewMessage.bind(this),
      new NewMessage({}),
    );

    this.isRunning = true;
    console.log("✅ Enhanced бот запущен и готов к работе!");
    console.log("💬 Ожидаю входящие сообщения...");

    this.startFollowUpChecker();
  }

  private async resolveEntity(
    message: any,
    senderId: string,
  ): Promise<{
    entity: any | null;
    userName: string;
    userPhone: string;
  }> {
    let entity = null;
    let userName = "Клиент";
    let userPhone = "";

    // Проверяем кеш
    if (entityCache.has(senderId)) {
      console.log("📋 Entity найден в кеше");
      entity = entityCache.get(senderId);
    }

    // Пробуем получить entity из сообщения
    if (!entity && (message.sender || message._sender)) {
      entity = message.sender || message._sender;
      entityCache.set(senderId, entity);
    }

    // Пробуем различные методы получения entity
    if (!entity) {
      const methods = [
        // Метод 1: Через peerId
        async () => await this.client.getEntity(message.peerId),
        // Метод 2: Через userId как строку
        async () => await this.client.getEntity(senderId),
        // Метод 3: Через userId как число
        async () => await this.client.getEntity(Number.parseInt(senderId)),
        // Метод 4: Через getInputEntity
        async () => {
          const input = await this.client.getInputEntity(message.peerId);
          return await this.client.getEntity(input);
        },
        // Метод 5: Через dialogs
        async () => {
          const dialogs = await this.client.getDialogs();
          const dialog = dialogs.find((d) => d.id?.toString() === senderId);
          return dialog?.entity;
        },
      ];

      for (let i = 0; i < methods.length; i++) {
        try {
          console.log(`🔍 Попытка ${i + 1} получить entity...`);
          entity = await methods[i]();
          if (entity) {
            entityCache.set(senderId, entity);
            console.log(`✅ Entity получен методом ${i + 1}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Извлекаем информацию
    if (entity) {
      if ("firstName" in entity) {
        userName = entity.firstName || "Клиент";
        if (entity.lastName) userName += " " + entity.lastName;
      }
      if ("phone" in entity) {
        userPhone = entity.phone || "";
      }
    } else {
      userName = `User${senderId}`;
    }

    return { entity, userName, userPhone };
  }

  private async sendMessageWithFallback(
    message: any,
    senderId: string,
    entity: any,
    responseText: string,
  ): Promise<boolean> {
    const methods = [
      // Метод 1: Через entity с reply
      async () => {
        if (entity) {
          await this.client.sendMessage(entity, {
            message: responseText,
            replyTo: message.id,
          });
          console.log("✅ Отправлено через entity с reply");
          return true;
        }
        return false;
      },

      // Метод 2: Через peerId
      async () => {
        await this.client.sendMessage(message.peerId, {
          message: responseText,
          replyTo: message.id,
        });
        console.log("✅ Отправлено через peerId");
        return true;
      },

      // Метод 3: Через числовой ID
      async () => {
        const id = Number.parseInt(senderId);
        if (!isNaN(id)) {
          await this.client.sendMessage(id, { message: responseText });
          console.log("✅ Отправлено через числовой ID");
          return true;
        }
        return false;
      },

      // Метод 4: Создать диалог и отправить
      async () => {
        // Пытаемся создать/обновить диалог
        await this.client.invoke(
          new Api.messages.GetPeerDialogs({
            peers: [message.peerId],
          }),
        );
        await new Promise((resolve) => setTimeout(resolve, 500));

        await this.client.sendMessage(message.peerId, {
          message: responseText,
        });
        console.log("✅ Отправлено после обновления диалога");
        return true;
      },

      // Метод 5: Через invoke SendMessage API
      async () => {
        const result = await this.client.invoke(
          new Api.messages.SendMessage({
            peer: message.peerId,
            message: responseText,
            randomId: BigInt(Math.floor(Math.random() * 1e15)),
            replyTo: new Api.InputReplyToMessage({
              replyToMsgId: message.id,
            }),
          }),
        );
        console.log("✅ Отправлено через invoke API");
        return true;
      },
    ];

    for (const method of methods) {
      try {
        console.log("📤 Попытка отправки сообщения...");
        const success = await method();
        if (success) return true;
      } catch (e: any) {
        console.log(`❌ Ошибка: ${e.message}`);
        continue;
      }
    }

    return false;
  }

  private async handleNewMessage(event: any): Promise<void> {
    try {
      const message = event.message;

      if (message.out) return;
      if (this.processedMessages.has(message.id)) return;
      this.processedMessages.add(message.id);

      console.log("\n🔍 Получено новое сообщение:");
      console.log(`   ID сообщения: ${message.id}`);
      console.log(`   Текст: ${message.text}`);

      const peer = message.peerId;
      const senderId = peer?.userId?.toString() || peer?.chatId?.toString();

      if (!senderId) {
        console.log("⚠️  Не удалось определить отправителя");
        return;
      }

      // Получаем entity и информацию о пользователе
      const { entity, userName, userPhone } = await this.resolveEntity(
        message,
        senderId,
      );

      console.log(
        `📨 Новое сообщение от ${userName} (ID: ${senderId}): ${message.text}`,
      );
      console.log(`   Entity: ${entity ? "✅" : "❌"}`);
      console.log(`   Телефон: ${userPhone || "неизвестен"}`);

      // Показываем индикатор набора
      try {
        await this.client.invoke(
          new Api.messages.SetTyping({
            peer: peer,
            action: new Api.SendMessageTypingAction(),
          }),
        );
      } catch (e) {
        // Игнорируем
      }

      // База данных
      const conversationId = await database.getOrCreateConversation(
        senderId,
        userName,
        userPhone,
      );

      await database.addMessage(conversationId, "user", message.text);

      const conversation = await database.getFullConversation(senderId);
      if (!conversation) {
        console.log("❌ Не удалось получить историю диалога");
        return;
      }

      // AI ответ
      console.log("🤖 Генерация ответа AI...");
      const aiResponse = await this.aiAgent.generateResponse(
        conversation,
        message.text,
      );

      await database.updateClientStatus(
        conversationId,
        aiResponse.clientStatus,
      );
      if (aiResponse.suggestedProducts.length > 0) {
        await database.updateInterestedProducts(
          conversationId,
          aiResponse.suggestedProducts,
        );
      }

      if (
        aiResponse.shouldScheduleFollowUp &&
        !conversation.followUpScheduled
      ) {
        const followUpDate = new Date();
        followUpDate.setDate(
          followUpDate.getDate() + Number.parseInt(process.env.FOLLOW_UP_DAYS || "3"),
        );
        await database.scheduleFollowUp(conversationId, followUpDate);
        console.log(
          `📅 Запланирован follow-up на ${followUpDate.toLocaleDateString()}`,
        );
      }

      // Имитация набора
      const typingDelay = Math.min(aiResponse.response.length * 20, 3000);
      console.log(`⏱️  Имитация набора текста: ${typingDelay}мс`);
      await new Promise((resolve) => setTimeout(resolve, typingDelay));

      // Отправка ответа
      const sent = await this.sendMessageWithFallback(
        message,
        senderId,
        entity,
        aiResponse.response,
      );

      if (sent) {
        await database.addMessage(
          conversationId,
          "assistant",
          aiResponse.response,
        );
        console.log(`📊 Статус клиента: ${aiResponse.clientStatus}`);
      } else {
        // Отправляем в Избранное
        try {
          await this.client.sendMessage("me", {
            message: `[Авто-ответ не доставлен]\n\nДля: ${userName} (${senderId})\n\nОтвет:\n${aiResponse.response}\n\n⚠️ Требуется ручная отправка первого сообщения.`,
          });
          console.log("📝 Ответ сохранен в Избранное");
        } catch (e) {
          console.error("❌ Не удалось сохранить в Избранное");
        }

        await database.addMessage(
          conversationId,
          "assistant",
          `[НЕ ДОСТАВЛЕНО] ${aiResponse.response}`,
        );
        console.log(
          "\n⚡ Совет: Ответьте пользователю вручную один раз для установки контакта",
        );
      }
    } catch (error: any) {
      console.error("❌ Критическая ошибка:", error.message);
    }
  }

  private async startFollowUpChecker(): Promise<void> {
    setInterval(
      async () => {
        try {
          const pendingFollowUps = await database.getPendingFollowUps();

          for (const { followUp, conversation } of pendingFollowUps) {
            try {
              const fullConversation = await database.getFullConversation(
                conversation.userId,
              );
              if (!fullConversation) continue;

              const followUpMessage =
                await this.aiAgent.generateFollowUpMessage(fullConversation);

              // Пробуем получить entity из кеша
              const entity = entityCache.get(conversation.userId);
              const sent = await this.sendMessageWithFallback(
                { peerId: { userId: conversation.userId } },
                conversation.userId,
                entity,
                followUpMessage,
              );

              if (sent) {
                await database.addMessage(
                  conversation.id!,
                  "assistant",
                  followUpMessage,
                );
                await database.markFollowUpCompleted(followUp.id!);
                console.log(
                  `✅ Follow-up отправлен для ${conversation.userName}`,
                );
              }
            } catch (error) {
              console.error(
                `❌ Ошибка follow-up для ${conversation.userName}:`,
                error,
              );
            }
          }
        } catch (error) {
          console.error("❌ Ошибка при проверке follow-up:", error);
        }
      },
      60 * 60 * 1000,
    );
  }

  async sendProactiveMessage(userId: string, message: string): Promise<void> {
    try {
      const entity = entityCache.get(userId);
      const sent = await this.sendMessageWithFallback(
        { peerId: { userId } },
        userId,
        entity,
        message,
      );

      if (sent) {
        console.log(
          `📤 Проактивное сообщение отправлено пользователю ${userId}`,
        );
      } else {
        console.log(
          `❌ Не удалось отправить проактивное сообщение пользователю ${userId}`,
        );
      }
    } catch (error) {
      console.error("❌ Ошибка при отправке проактивного сообщения:", error);
    }
  }

  async getStats(): Promise<void> {
    const stats = await database.getConversationStats();
    console.log("\n📊 Статистика бота:");
    console.log(`Всего диалогов: ${stats.total}`);
    console.log(`Активных сегодня: ${stats.activeToday}`);
    console.log("\nПо статусам:");
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    console.log(`\n💾 Кешировано entity: ${entityCache.size}`);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    database.close();
    coursesDB.close();
    await this.client.disconnect();
    console.log("👋 Enhanced бот остановлен");
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
