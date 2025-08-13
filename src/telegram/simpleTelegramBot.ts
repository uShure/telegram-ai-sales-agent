import TelegramBot from 'node-telegram-bot-api';
import { AIAgent } from '../ai/aiAgent';
import { conversationManager } from '../database/conversationManager';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN не установлен в .env');
}

export class SimpleTelegramBot {
  private bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(BOT_TOKEN!, { polling: true });
    this.setupHandlers();
  }

  private setupHandlers() {
    // Обработка команды /start
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id.toString() || chatId.toString();
      const userName = msg.from?.first_name || 'Пользователь';

      try {
        // Создаем новый диалог
        const conversationId = await conversationManager.createConversation(
          userId,
          userName,
          msg.from?.username || ''
        );

        await this.bot.sendMessage(
          chatId,
          `Добро пожаловать в SOINTERA! 🎨\n\n` +
          `Я помогу вам выбрать идеальный курс по колористике и парикмахерскому искусству.\n\n` +
          `Расскажите, что вас интересует?`
        );
      } catch (error) {
        console.error('Ошибка при обработке /start:', error);
        await this.bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
      }
    });

    // Обработка всех текстовых сообщений
    this.bot.on('message', async (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;

      const chatId = msg.chat.id;
      const userId = msg.from?.id.toString() || chatId.toString();
      const userName = msg.from?.first_name || 'Пользователь';
      const messageText = msg.text;

      try {
        // Показываем, что бот печатает
        await this.bot.sendChatAction(chatId, 'typing');

        // Получаем или создаем диалог
        let conversationId = await conversationManager.getActiveConversation(userId);

        if (!conversationId) {
          conversationId = await conversationManager.createConversation(
            userId,
            userName,
            msg.from?.username || ''
          );
        }

        // Сохраняем сообщение пользователя
        await conversationManager.addMessage(conversationId, 'user', messageText);

        // Получаем ответ от AI
        const response = await processAIResponse(conversationId, messageText);

        // Отправляем ответ
        await this.bot.sendMessage(chatId, response, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });

        // Сохраняем ответ бота
        await conversationManager.addMessage(conversationId, 'assistant', response);

      } catch (error) {
        console.error('Ошибка при обработке сообщения:', error);
        await this.bot.sendMessage(
          chatId,
          'Извините, произошла ошибка. Попробуйте еще раз.'
        );
      }
    });

    // Обработка callback кнопок (если будут добавлены)
    this.bot.on('callback_query', async (callbackQuery) => {
      const msg = callbackQuery.message;
      const data = callbackQuery.data;

      if (!msg || !data) return;

      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: 'Обрабатываю ваш выбор...'
      });

      // Здесь можно добавить обработку кнопок
    });

    console.log('✅ SimpleTelegramBot handlers настроены');
  }

  async start() {
    console.log('🚀 SimpleTelegramBot запущен!');
    console.log('📱 Бот готов к работе');
  }
}
