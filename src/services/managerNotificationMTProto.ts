/**
 * Сервис отправки уведомлений менеджеру через личный аккаунт
 * Использует MTProto API для отправки от имени userbot
 */

import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import dotenv from 'dotenv';

dotenv.config();

// Username менеджера
const MANAGER_USERNAME = 'natalylini';

// История эскалаций для предотвращения спама
const escalationHistory = new Map<string, Date>();

/**
 * Интерфейс уведомления
 */
interface ManagerNotification {
  clientName: string;
  clientId: string;
  clientUsername?: string;
  clientMessage: string;
  reason: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Отправляет уведомление менеджеру через личный аккаунт
 */
export async function sendManagerNotificationDirect(
  client: TelegramClient,
  notification: ManagerNotification
): Promise<boolean> {
  try {
    console.log(`📤 Отправка уведомления менеджеру @${MANAGER_USERNAME}...`);

    // Форматируем сообщение с прямыми ссылками
    const message = formatNotificationMessage(notification);

    // Отправляем сообщение менеджеру напрямую
    try {
      await client.sendMessage(MANAGER_USERNAME, {
        message: message
      });

      console.log('✅ Уведомление отправлено менеджеру через личный аккаунт');
      console.log('   Ссылки на клиента добавлены в текст сообщения');

      // Сохраняем в историю эскалаций
      escalationHistory.set(notification.clientId, new Date());

      // Сохраняем в базу данных
      await saveEscalationToDatabase(notification);

      return true;

    } catch (error: any) {
      if (error.message.includes('USER_NOT_MUTUAL_CONTACT')) {
        console.log('⚠️ Менеджер не в контактах, пытаемся отправить через поиск...');

        // Пытаемся найти пользователя и отправить
        try {
          const result = await client.invoke(
            new Api.contacts.Search({
              q: MANAGER_USERNAME,
              limit: 1
            })
          );

          if (result.users.length > 0) {
            const manager = result.users[0];
            await client.sendMessage(manager, {
              message: message
            });

            console.log('✅ Сообщение отправлено через поиск');
            escalationHistory.set(notification.clientId, new Date());
            return true;
          }
        } catch (searchError) {
          console.error('❌ Не удалось найти менеджера:', searchError);
        }
      }

      throw error;
    }

  } catch (error: any) {
    console.error('❌ Ошибка при отправке уведомления менеджеру:', error.message);

    // Сохраняем уведомление для повторной отправки
    await saveNotificationForLater(notification);
    return false;
  }
}

/**
 * Форматирует сообщение для менеджера с прямыми ссылками
 */
function formatNotificationMessage(notification: ManagerNotification): string {
  const priorityEmoji = {
    high: '🔴',
    medium: '🟡',
    low: '🟢'
  };

  const emoji = priorityEmoji[notification.priority];

  let message = `${emoji} ТРЕБУЕТСЯ ПОМОЩЬ МЕНЕДЖЕРА\n\n`;
  message += `📋 Причина: ${notification.reason}\n`;
  message += `👤 Клиент: ${notification.clientName}\n`;
  message += `🆔 ID: ${notification.clientId}\n`;

  // Добавляем прямые ссылки для связи с клиентом
  message += `\n📱 Связаться с клиентом:\n`;

  if (notification.clientUsername) {
    // Если есть username - даем прямую ссылку
    message += `➤ https://t.me/${notification.clientUsername}\n`;
    message += `➤ @${notification.clientUsername}\n`;
  } else {
    // Если нет username - даем ссылку через ID
    message += `➤ tg://user?id=${notification.clientId}\n`;
    message += `   (нажмите на ссылку выше)\n`;
  }

  message += `\n💬 Сообщение клиента:\n"${notification.clientMessage}"\n\n`;

  if (notification.priority === 'high') {
    message += `⚡ Требуется срочный ответ!\n\n`;
  }

  // Инструкция если ссылки не работают
  message += `📝 Если ссылка не работает:\n`;
  message += `1. Скопируйте ID: ${notification.clientId}\n`;
  message += `2. Используйте поиск в Telegram\n`;
  if (notification.clientUsername) {
    message += `3. Или найдите по username: @${notification.clientUsername}\n`;
  }

  message += `\n⏰ ${new Date().toLocaleString('ru-RU')}\n`;
  message += `#эскалация #${notification.category}`;

  return message;
}

/**
 * Сохраняет информацию об эскалации в базу данных
 */
async function saveEscalationToDatabase(notification: ManagerNotification): Promise<void> {
  try {
    // Импортируем базу данных
    const { database } = await import('../database/database');

    await database.run(`
      INSERT INTO escalations (
        client_id,
        client_name,
        category,
        reason,
        priority,
        message,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      notification.clientId,
      notification.clientName,
      notification.category,
      notification.reason,
      notification.priority,
      notification.clientMessage
    ]);

    console.log('💾 Эскалация сохранена в БД');

  } catch (error) {
    console.error('❌ Ошибка сохранения эскалации в БД:', error);
  }
}

/**
 * Сохраняет уведомление для последующей отправки
 */
async function saveNotificationForLater(notification: ManagerNotification): Promise<void> {
  try {
    const { database } = await import('../database/database');

    const notificationData = {
      ...notification,
      timestamp: new Date().toISOString(),
      sent: false
    };

    await database.run(`
      INSERT INTO pending_notifications (data, created_at)
      VALUES (?, datetime('now'))
    `, JSON.stringify(notificationData));

    console.log('💾 Уведомление сохранено для последующей отправки');

  } catch (error) {
    console.error('❌ Ошибка сохранения уведомления:', error);
  }
}

/**
 * Проверяет, был ли клиент недавно эскалирован
 */
export function wasClientRecentlyEscalated(clientId: string): boolean {
  const lastEscalation = escalationHistory.get(clientId);
  if (!lastEscalation) return false;

  // Не эскалировать чаще чем раз в 30 минут
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return lastEscalation > thirtyMinutesAgo;
}

/**
 * Отправляет отложенные уведомления
 */
export async function sendPendingNotifications(client: TelegramClient): Promise<void> {
  try {
    const { database } = await import('../database/database');

    const pending = await database.all(`
      SELECT * FROM pending_notifications
      WHERE sent = 0
      ORDER BY created_at ASC
      LIMIT 10
    `);

    for (const row of pending) {
      const notification = JSON.parse(row.data);
      const success = await sendManagerNotificationDirect(client, notification);

      if (success) {
        // Помечаем как отправленное
        await database.run(`
          UPDATE pending_notifications
          SET sent = 1, sent_at = datetime('now')
          WHERE id = ?
        `, row.id);
      }
    }

  } catch (error) {
    console.error('❌ Ошибка отправки отложенных уведомлений:', error);
  }
}

/**
 * Инициализирует таблицы для системы уведомлений
 */
export async function initializeNotificationTables(): Promise<void> {
  try {
    const { database } = await import('../database/database');

    // Таблица для отложенных уведомлений
    await database.run(`
      CREATE TABLE IF NOT EXISTS pending_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        sent BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sent_at DATETIME
      )
    `);

    // Таблица истории эскалаций
    await database.run(`
      CREATE TABLE IF NOT EXISTS escalations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT NOT NULL,
        client_name TEXT,
        category TEXT,
        reason TEXT,
        priority TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Таблицы для уведомлений инициализированы');

  } catch (error) {
    console.error('❌ Ошибка создания таблиц уведомлений:', error);
  }
}

/**
 * Отправляет тестовое уведомление менеджеру
 */
export async function sendTestNotification(client: TelegramClient): Promise<boolean> {
  const testNotification: ManagerNotification = {
    clientName: 'Андрей Могучев',
    clientId: '186757140',
    clientUsername: 'aMoguchev',
    clientMessage: 'Хочу оформить заказ через ИП',
    reason: '🧪 Тестирование системы эскалации',
    category: 'test',
    priority: 'high'
  };

  console.log('📤 Отправка тестового уведомления менеджеру...');

  const result = await sendManagerNotificationDirect(client, testNotification);

  if (result) {
    console.log('✅ Тестовое уведомление успешно отправлено!');
    console.log('📱 Проверьте личные сообщения менеджера @' + MANAGER_USERNAME);
    console.log('🔗 В сообщении должны быть кликабельные ссылки на клиента');
  } else {
    console.log('❌ Не удалось отправить тестовое уведомление');
    console.log('Убедитесь, что аккаунт может писать менеджеру');
  }

  return result;
}
