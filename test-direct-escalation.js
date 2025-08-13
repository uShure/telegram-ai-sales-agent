#!/usr/bin/env bun

/**
 * Тестирование эскалации через личный аккаунт с прямыми ссылками
 * Отправляет тестовое уведомление менеджеру с кликабельными ссылками в тексте
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

async function testDirectEscalation() {
  console.log('🚀 Тестирование эскалации с прямыми ссылками на клиента\n');

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
    console.log('1. Клиент с username (например @aMoguchev)');
    console.log('2. Клиент без username (только ID)');
    console.log('3. Тест с разными приоритетами');
    console.log('4. Автоматический тест');

    const testType = await question('Выберите (1-4): ');

    if (testType === '1') {
      // Тест с username
      const testClientName = await question('Введите имя клиента: ');
      const testClientId = await question('Введите Telegram ID клиента: ');
      const testClientUsername = await question('Введите username клиента (без @): ');

      let message = `🔴 ТРЕБУЕТСЯ ПОМОЩЬ МЕНЕДЖЕРА\n\n`;
      message += `📋 Причина: 🛒 Клиент готов оформить заказ\n`;
      message += `👤 Клиент: ${testClientName}\n`;
      message += `🆔 ID: ${testClientId}\n`;
      message += `\n📱 Связаться с клиентом:\n`;
      message += `➤ https://t.me/${testClientUsername}\n`;
      message += `➤ @${testClientUsername}\n`;
      message += `\n💬 Сообщение клиента:\n"Хочу оформить заказ через ИП"\n\n`;
      message += `⚡ Требуется срочный ответ!\n\n`;
      message += `📝 Если ссылка не работает:\n`;
      message += `1. Скопируйте ID: ${testClientId}\n`;
      message += `2. Используйте поиск в Telegram\n`;
      message += `3. Или найдите по username: @${testClientUsername}\n`;
      message += `\n⏰ ${new Date().toLocaleString('ru-RU')}\n`;
      message += `#эскалация #order`;

      console.log(`\n📤 Отправка тестового сообщения с username...`);

      try {
        await client.sendMessage(MANAGER_USERNAME, {
          message: message
        });

        console.log('✅ Сообщение отправлено!');
        console.log('📱 Проверьте личные сообщения менеджера');
        console.log('🔗 Ссылка https://t.me/' + testClientUsername + ' должна быть кликабельной');

      } catch (error) {
        console.error('❌ Ошибка отправки:', error.message);
      }

    } else if (testType === '2') {
      // Тест без username
      const testClientName = await question('Введите имя клиента: ');
      const testClientId = await question('Введите Telegram ID клиента: ');

      let message = `🟡 ТРЕБУЕТСЯ ПОМОЩЬ МЕНЕДЖЕРА\n\n`;
      message += `📋 Причина: 💳 Вопрос о рассрочке\n`;
      message += `👤 Клиент: ${testClientName}\n`;
      message += `🆔 ID: ${testClientId}\n`;
      message += `\n📱 Связаться с клиентом:\n`;
      message += `➤ tg://user?id=${testClientId}\n`;
      message += `   (нажмите на ссылку выше)\n`;
      message += `\n💬 Сообщение клиента:\n"Можно ли оплатить в рассрочку?"\n\n`;
      message += `📝 Если ссылка не работает:\n`;
      message += `1. Скопируйте ID: ${testClientId}\n`;
      message += `2. Используйте поиск в Telegram\n`;
      message += `\n⏰ ${new Date().toLocaleString('ru-RU')}\n`;
      message += `#эскалация #installment`;

      console.log(`\n📤 Отправка тестового сообщения без username...`);

      await client.sendMessage(MANAGER_USERNAME, {
        message: message
      });

      console.log('✅ Сообщение отправлено');
      console.log('🔗 Ссылка tg://user?id=' + testClientId + ' может работать в некоторых клиентах');

    } else if (testType === '3') {
      // Тест с разными приоритетами
      const testCases = [
        {
          priority: '🔴',
          reason: '🛒 Клиент готов оформить заказ',
          message: 'Хочу купить курс прямо сейчас!',
          clientName: 'Андрей Могучев',
          clientId: '186757140',
          clientUsername: 'aMoguchev'
        },
        {
          priority: '🟡',
          reason: '💳 Вопрос о рассрочке',
          message: 'Можно ли оплатить в рассрочку?',
          clientName: 'Мария Иванова',
          clientId: '987654321',
          clientUsername: null
        },
        {
          priority: '🟢',
          reason: '📋 Запрос программы курса',
          message: 'Пришлите подробную программу',
          clientName: 'Елена Сидорова',
          clientId: '555666777',
          clientUsername: 'elena_sid'
        }
      ];

      for (const testCase of testCases) {
        console.log(`\nОтправить тест "${testCase.reason}"? (y/n)`);
        const send = await question('');

        if (send.toLowerCase() === 'y') {
          let msg = `${testCase.priority} ТЕСТ ЭСКАЛАЦИИ\n\n`;
          msg += `📋 Причина: ${testCase.reason}\n`;
          msg += `👤 Клиент: ${testCase.clientName}\n`;
          msg += `🆔 ID: ${testCase.clientId}\n`;
          msg += `\n📱 Связаться с клиентом:\n`;

          if (testCase.clientUsername) {
            msg += `➤ https://t.me/${testCase.clientUsername}\n`;
            msg += `➤ @${testCase.clientUsername}\n`;
          } else {
            msg += `➤ tg://user?id=${testCase.clientId}\n`;
            msg += `   (нажмите на ссылку выше)\n`;
          }

          msg += `\n💬 Сообщение: "${testCase.message}"\n\n`;
          msg += `⏰ ${new Date().toLocaleString('ru-RU')}`;

          await client.sendMessage(MANAGER_USERNAME, {
            message: msg
          });

          console.log('✅ Отправлено');
        }
      }

    } else if (testType === '4') {
      // Автоматический тест с реальными данными
      const autoMessage = `🔴 ТРЕБУЕТСЯ ПОМОЩЬ МЕНЕДЖЕРА\n\n`;
      autoMessage += `📋 Причина: 🛒 Клиент готов оформить заказ\n`;
      autoMessage += `👤 Клиент: Андрей Могучев\n`;
      autoMessage += `🆔 ID: 186757140\n`;
      autoMessage += `\n📱 Связаться с клиентом:\n`;
      autoMessage += `➤ https://t.me/aMoguchev\n`;
      autoMessage += `➤ @aMoguchev\n`;
      autoMessage += `\n💬 Сообщение клиента:\n"хочу оформить заказ через ИП"\n\n`;
      autoMessage += `⚡ Требуется срочный ответ!\n\n`;
      autoMessage += `📝 Если ссылка не работает:\n`;
      autoMessage += `1. Скопируйте ID: 186757140\n`;
      autoMessage += `2. Используйте поиск в Telegram\n`;
      autoMessage += `3. Или найдите по username: @aMoguchev\n`;
      autoMessage += `\n⏰ ${new Date().toLocaleString('ru-RU')}\n`;
      autoMessage += `#эскалация #order`;

      console.log(`\n📤 Отправка автоматического теста с @aMoguchev...`);

      await client.sendMessage(MANAGER_USERNAME, {
        message: autoMessage
      });

      console.log('✅ Сообщение отправлено');
      console.log('🔗 Ссылка https://t.me/aMoguchev должна быть кликабельной');
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
