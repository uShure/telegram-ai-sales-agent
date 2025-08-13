#!/usr/bin/env bun

/**
 * Получение chat_id менеджера
 */

const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.NOTIFICATION_BOT_TOKEN;
const MANAGER_USERNAME = 'natalylini';

async function getManagerChatId() {
  if (!BOT_TOKEN) {
    console.error('❌ Токен бота не настроен в .env');
    return;
  }

  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`
    );

    if (response.data.ok && response.data.result) {
      let found = false;

      for (const update of response.data.result) {
        if (update.message && update.message.from) {
          if (update.message.from.username === MANAGER_USERNAME) {
            const chatId = update.message.chat.id;
            console.log('✅ Chat ID менеджера найден: ' + chatId);
            console.log('');
            console.log('Добавьте в .env:');
            console.log('MANAGER_CHAT_ID=' + chatId);
            found = true;
            break;
          }
        }
      }

      if (!found) {
        console.log('❌ Сообщений от @' + MANAGER_USERNAME + ' не найдено');
        console.log('');
        console.log('Попросите менеджера:');
        console.log('1. Найти бота по токену');
        console.log('2. Отправить боту /start');
        console.log('3. Запустить этот скрипт снова');
      }
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

getManagerChatId();
