/**
 * Сервис отправки уведомлений менеджеру
 */

import axios from 'axios';
import { database } from '../database/database';

// Конфигурация
const NOTIFICATION_BOT_TOKEN = process.env.NOTIFICATION_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';
const MANAGER_USERNAME = 'natalylini';
const MANAGER_CHAT_ID = process.env.MANAGER_CHAT_ID || ''; // Нужно будет получить через getUpdates

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
 * Отправляет уведомление менеджеру
 */
export async function sendManagerNotification(notification: ManagerNotification): Promise<boolean> {
  try {
    // Проверяем, есть ли токен бота
    if (!NOTIFICATION_BOT_TOKEN) {
      console.error('❌ Токен бота для уведомлений не настроен');
      return false;
    }

    // Если нет chat_id менеджера, пытаемся получить
    let managerChatId = MANAGER_CHAT_ID;
    if (!managerChatId) {
      managerChatId = await getManagerChatId();
      if (!managerChatId) {
        console.error('❌ Не удалось получить chat_id менеджера');
        await saveNotificationForLater(notification);
        return false;
      }
    }

    // Формируем сообщение
    const message = formatNotificationMessage(notification);

    // Отправляем через Telegram Bot API
    const response = await axios.post(
      `https://api.telegram.org/bot${NOTIFICATION_BOT_TOKEN}/sendMessage`,
      {
        chat_id: managerChatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      }
    );

    if (response.data.ok) {
      console.log('✅ Уведомление отправлено менеджеру');

      // Сохраняем в историю эскалаций
      escalationHistory.set(notification.clientId, new Date());

      // Сохраняем в базу данных
      await saveEscalationToDatabase(notification);

      return true;
    } else {
      console.error('❌ Ошибка отправки уведомления:', response.data);
      await saveNotificationForLater(notification);
      return false;
    }

  } catch (error: any) {
    console.error('❌ Ошибка при отправке уведомления менеджеру:', error.message);

    // Сохраняем уведомление для повторной отправки
    await saveNotificationForLater(notification);

    return false;
  }
}

/**
 * Форматирует сообщение для менеджера
 */
function formatNotificationMessage(notification: ManagerNotification): string {
  const priorityEmoji = {
    high: '🔴',
    medium: '🟡',
    low: '🟢'
  };

  const emoji = priorityEmoji[notification.priority];

  let message = `${emoji} *НОВОЕ ОБРАЩЕНИЕ*\n\n`;
  message += `*Причина:* ${notification.reason}\n`;
  message += `*Клиент:* ${notification.clientName}\n`;

  if (notification.clientUsername) {
    message += `*Username:* @${notification.clientUsername}\n`;
  }

  message += `*ID:* \`${notification.clientId}\`\n\n`;
  message += `*Сообщение клиента:*\n"${notification.clientMessage}"\n\n`;

  // Добавляем кнопки быстрых действий для высокого приоритета
  if (notification.priority === 'high') {
    message += `⚡ *Требуется срочный ответ!*\n`;
  }

  message += `\n📅 ${new Date().toLocaleString('ru-RU')}\n`;
  message += `#${notification.category} #priority_${notification.priority}`;

  return message;
}

/**
 * Пытается получить chat_id менеджера через username
 */
async function getManagerChatId(): Promise<string | null> {
  try {
    // Получаем обновления бота
    const response = await axios.get(
      `https://api.telegram.org/bot${NOTIFICATION_BOT_TOKEN}/getUpdates`
    );

    if (response.data.ok && response.data.result) {
      // Ищем сообщения от менеджера
      for (const update of response.data.result) {
        if (update.message && update.message.from) {
          if (update.message.from.username === MANAGER_USERNAME) {
            const chatId = update.message.chat.id.toString();
            console.log(`✅ Найден chat_id менеджера: ${chatId}`);

            // Сохраняем в переменную окружения для будущего использования
            process.env.MANAGER_CHAT_ID = chatId;

            return chatId;
          }
        }
      }
    }

    // Если не нашли, инструкция для менеджера
    console.log(`
⚠️ Chat ID менеджера не найден!

Чтобы получать уведомления, менеджер @${MANAGER_USERNAME} должен:
1. Написать боту любое сообщение
2. После этого бот сможет отправлять уведомления

Альтернатива: добавьте MANAGER_CHAT_ID в .env файл
    `);

    return null;

  } catch (error) {
    console.error('❌ Ошибка получения chat_id:', error);
    return null;
  }
}

/**
 * Сохраняет уведомление для последующей отправки
 */
async function saveNotificationForLater(notification: ManagerNotification): Promise<void> {
  try {
    const notificationData = {
      ...notification,
      timestamp: new Date().toISOString(),
      sent: false
    };

    // Сохраняем в базу данных
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
 * Сохраняет информацию об эскалации в базу данных
 */
async function saveEscalationToDatabase(notification: ManagerNotification): Promise<void> {
  try {
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

  } catch (error) {
    console.error('❌ Ошибка сохранения эскалации в БД:', error);
  }
}

/**
 * Отправляет все отложенные уведомления
 */
export async function sendPendingNotifications(): Promise<void> {
  try {
    const pending = await database.all(`
      SELECT * FROM pending_notifications
      WHERE sent = 0
      ORDER BY created_at ASC
      LIMIT 10
    `);

    for (const row of pending) {
      const notification = JSON.parse(row.data);
      const success = await sendManagerNotification(notification);

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
 * Создает таблицы для системы уведомлений
 */
export async function initializeNotificationTables(): Promise<void> {
  try {
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
export async function sendTestNotification(): Promise<boolean> {
  const testNotification: ManagerNotification = {
    clientName: 'Тестовый клиент',
    clientId: 'test_123',
    clientMessage: 'Это тестовое сообщение для проверки системы уведомлений',
    reason: '🧪 Тестирование системы',
    category: 'test',
    priority: 'low'
  };

  console.log('📤 Отправка тестового уведомления...');
  return await sendManagerNotification(testNotification);
}
