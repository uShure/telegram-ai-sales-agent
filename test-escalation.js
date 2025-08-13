#!/usr/bin/env bun

/**
 * Тест системы эскалации
 */

const axios = require('axios');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.NOTIFICATION_BOT_TOKEN;
const MANAGER_CHAT_ID = process.env.MANAGER_CHAT_ID;

async function sendTestNotification() {
  if (!BOT_TOKEN) {
    console.error('❌ Токен бота не настроен в .env');
    return;
  }

  if (!MANAGER_CHAT_ID) {
    console.error('❌ MANAGER_CHAT_ID не настроен');
    console.log('Менеджер должен сначала написать боту /start');
    return;
  }

  const message = `🧪 *ТЕСТОВОЕ УВЕДОМЛЕНИЕ*

Это тестовое сообщение системы эскалации.

Если вы видите это сообщение, значит система работает корректно!

*Клиент:* Тестовый клиент
*Сообщение:* "Хочу оформить заказ на курс"

⏰ ${new Date().toLocaleString('ru-RU')}

#тест #эскалация`;

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: MANAGER_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      }
    );

    if (response.data.ok) {
      console.log('✅ Тестовое уведомление отправлено успешно!');
    } else {
      console.error('❌ Ошибка отправки:', response.data);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

sendTestNotification();
