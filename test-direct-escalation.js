#!/usr/bin/env bun

/**
 * Тестирование эскалации через личный аккаунт с кликабельными ссылками
 * Отправляет тестовое уведомление менеджеру с inline mention
 */

const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const readline = require('readline');
const fs = require('fs');

// Загружаем переменные окружения
require('dotenv').config();

const apiId = parseInt(process.env.API_ID || '0');
const apiHash = process.env.API_HASH || '';
const phoneNumber = process.env.PHONE_NUMBER || '';
const MANAGER_USERNAME = 'natalylini';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Создает inline mention для пользователя
 */
function createUserMention(userId, userName, offset) {
  return new Api.MessageEntityMentionName({
    offset: offset,
    length: userName.length,
    userId: BigInt(userId)
  });
}

/**
 * Форматирует сообщение с кликабельной ссылкой на клиента
 */
function formatWithMention(clientId, clientName, message) {
  const entities = [];

  let text = `🧪 ТЕСТОВОЕ УВЕДОМЛЕНИЕ\n\n`;
  text += `Это тест системы эскалации с кликабельными ссылками.\n\n`;
  text += `Клиент: `;

  // Сохраняем позицию для mention
  const mentionOffset = text.length;
  text += clientName;

  // Создаем mention entity
  entities.push(createUserMention(clientId, clientName, mentionOffset));

  text += `\nID: ${clientId}\n`;
  text += `Запрос: "${message}"\n\n`;
  text += `👆 Нажмите на имя клиента выше, чтобы открыть чат с ним\n\n`;
  text += `⏰ ${new Date().toLocaleString('ru-RU')}\n`;
  text += `#тест #эскалация`;

  return { text, entities };
}

async function testDirectEscalation() {
  console.log('🚀 Тестирование эскалации с кликабельными ссылками\n');

  // Проверяем конфигурацию
  if (!apiId || !apiHash || !phoneNumber) {
    console.error('❌ Отсутствуют необходимые данные в .env:');
    console.error('   API_ID, API_HASH, PHONE_NUMBER');
    console.error('\nПолучите их на https://my.telegram.org');
    process.exit(1);
  }

  // Загружаем сессию
  let stringSession = '';
  const sessionFile = './anon.session';

  if (fs.existsSync(sessionFile)) {
    try {
      stringSession = fs.readFileSync(sessionFile, 'utf-8').trim();
      console.log('✅ Загружена существующая сессия');
    } catch (error) {
      console.log('⚠️ Не удалось загрузить сессию, потребуется авторизация');
    }
  }

  const client = new TelegramClient(
    new StringSession(stringSession),
    apiId,
    apiHash,
    {
      connectionRetries: 5,
    }
  );

  try {
    console.log('📱 Подключение к Telegram...');
    await client.start({
      phoneNumber: async () => phoneNumber,
      password: async () => await question('Введите пароль 2FA (если есть): '),
      phoneCode: async () => await question('Введите код из Telegram: '),
      onError: (err) => console.error('Ошибка:', err),
    });

    console.log('✅ Успешно подключились к Telegram');

    // Сохраняем сессию
    const newSession = client.session.save();
    if (newSession) {
      fs.writeFileSync(sessionFile, newSession);
      console.log('💾 Сессия сохранена');
    }

    console.log('\n📊 Выберите тип теста:');
    console.log('1. Тест с реальным пользователем (кликабельная ссылка)');
    console.log('2. Тест с вымышленным пользователем');
    console.log('3. Тест с кнопкой');

    const testType = await question('Выберите (1-3): ');

    if (testType === '1') {
      // Тест с реальным пользователем
      const testClientId = await question('Введите ID реального пользователя Telegram: ');
      const testClientName = await question('Введите имя пользователя: ');

      const { text, entities } = formatWithMention(
        testClientId,
        testClientName,
        'Хочу купить курс ДНК ЦВЕТА'
      );

      console.log(`\n📤 Отправка тестового сообщения с inline mention...`);

      try {
        await client.sendMessage(MANAGER_USERNAME, {
          message: text,
          formattingEntities: entities
        });

        console.log('✅ Сообщение с кликабельной ссылкой отправлено!');
        console.log('📱 Проверьте личные сообщения менеджера');
        console.log('👆 Имя клиента должно быть кликабельным');

      } catch (error) {
        console.error('❌ Ошибка отправки:', error.message);
      }

    } else if (testType === '2') {
      // Простой тест без mention
      const simpleMessage = `🧪 ТЕСТОВОЕ УВЕДОМЛЕНИЕ

Клиент: Тестовый клиент
ID: 123456789
Запрос: "Хочу купить курс"

⚠️ Это тест с вымышленным ID, ссылка не будет работать

⏰ ${new Date().toLocaleString('ru-RU')}`;

      console.log(`\n📤 Отправка простого тестового сообщения...`);

      await client.sendMessage(MANAGER_USERNAME, {
        message: simpleMessage
      });

      console.log('✅ Простое сообщение отправлено');

    } else if (testType === '3') {
      // Тест с кнопкой
      const buttonMessage = `🧪 ТЕСТОВОЕ УВЕДОМЛЕНИЕ С КНОПКОЙ

Клиент: Анна Петрова
ID: 123456789
Запрос: "Хочу оформить заказ"

Нажмите кнопку ниже для перехода к клиенту

⏰ ${new Date().toLocaleString('ru-RU')}`;

      const button = [
        [
          new Api.KeyboardButtonUrl({
            text: '💬 Написать клиенту',
            url: 'tg://user?id=123456789'
          })
        ]
      ];

      console.log(`\n📤 Отправка сообщения с кнопкой...`);

      try {
        await client.sendMessage(MANAGER_USERNAME, {
          message: buttonMessage,
          buttons: button
        });

        console.log('✅ Сообщение с кнопкой отправлено!');
        console.log('🔘 Менеджер увидит кнопку для перехода к клиенту');

      } catch (error) {
        console.error('❌ Ошибка отправки с кнопкой:', error.message);
      }
    }

    // Дополнительные тесты
    console.log('\n📊 Хотите протестировать разные приоритеты? (y/n)');
    const testMore = await question('');

    if (testMore.toLowerCase() === 'y') {
      const realClientId = await question('Введите ID реального клиента для тестов: ');
      const realClientName = await question('Введите имя клиента: ');

      const testCases = [
        {
          priority: '🔴',
          reason: '🛒 Клиент готов оформить заказ',
          message: 'Хочу купить курс прямо сейчас!'
        },
        {
          priority: '🟡',
          reason: '💳 Вопрос о рассрочке',
          message: 'Можно ли оплатить в рассрочку?'
        },
        {
          priority: '🟢',
          reason: '📋 Запрос программы курса',
          message: 'Пришлите подробную программу'
        }
      ];

      for (const testCase of testCases) {
        console.log(`\nОтправить тест "${testCase.reason}"? (y/n)`);
        const send = await question('');

        if (send.toLowerCase() === 'y') {
          let msg = `${testCase.priority} ТЕСТ ЭСКАЛАЦИИ\n\n`;
          msg += `Причина: ${testCase.reason}\n`;
          msg += `Клиент: `;

          const offset = msg.length;
          msg += realClientName;

          const entities = [createUserMention(realClientId, realClientName, offset)];

          msg += `\nСообщение: "${testCase.message}"\n\n`;
          msg += `⏰ ${new Date().toLocaleString('ru-RU')}`;

          await client.sendMessage(MANAGER_USERNAME, {
            message: msg,
            formattingEntities: entities
          });

          console.log('✅ Отправлено с кликабельной ссылкой');
        }
      }
    }

  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  } finally {
    console.log('\n👋 Отключение от Telegram...');
    await client.disconnect();
    rl.close();
  }
}

// Запуск
testDirectEscalation().catch(console.error);
