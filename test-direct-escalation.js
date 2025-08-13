#!/usr/bin/env bun

/**
 * Тестирование эскалации через личный аккаунт с кнопками
 * Отправляет тестовое уведомление менеджеру с inline кнопками для перехода к клиенту
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
  console.log('🚀 Тестирование эскалации с кнопками для перехода к клиенту\n');

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
    console.log('1. Тест с реальным ID клиента (рабочие кнопки)');
    console.log('2. Тест с вымышленным ID (кнопки не будут работать)');
    console.log('3. Тест с разными приоритетами');
    console.log('4. Тест простого сообщения без кнопок');

    const testType = await question('Выберите (1-4): ');

    if (testType === '1') {
      // Тест с реальным ID
      const testClientId = await question('Введите реальный Telegram ID клиента: ');
      const testClientName = await question('Введите имя клиента: ');
      const testClientUsername = await question('Введите username клиента (без @, или пропустите): ');

      const message = `🔴 ТРЕБУЕТСЯ ПОМОЩЬ МЕНЕДЖЕРА\n\n`;
      message += `📋 Причина: 🛒 Клиент готов оформить заказ\n`;
      message += `👤 Клиент: ${testClientName}\n`;
      message += `🆔 ID: ${testClientId}\n`;

      if (testClientUsername) {
        message += `📱 Username: @${testClientUsername}\n`;
      }

      message += `\n💬 Сообщение клиента:\n"Хочу купить курс ДНК ЦВЕТА"\n\n`;
      message += `⚡ Требуется срочный ответ!\n\n`;
      message += `👇 Используйте кнопки ниже для быстрого перехода к клиенту\n\n`;
      message += `⏰ ${new Date().toLocaleString('ru-RU')}\n`;
      message += `#эскалация #order`;

      // Создаем кнопки
      const buttons = [];

      // Основная кнопка
      buttons.push([{
        text: `💬 Написать ${testClientName}`,
        url: `tg://user?id=${testClientId}`
      }]);

      // Если есть username
      if (testClientUsername) {
        buttons.push([{
          text: `📱 @${testClientUsername}`,
          url: `https://t.me/${testClientUsername}`
        }]);
      }

      // Кнопка срочного ответа
      buttons.push([{
        text: '🚨 Срочно ответить',
        url: `tg://user?id=${testClientId}`
      }]);

      console.log(`\n📤 Отправка тестового сообщения с кнопками...`);

      try {
        await client.sendMessage(MANAGER_USERNAME, {
          message: message,
          buttons: buttons
        });

        console.log('✅ Сообщение с кнопками отправлено!');
        console.log('📱 Проверьте личные сообщения менеджера');
        console.log('🔘 Должны быть видны 2-3 кнопки для перехода к клиенту');

      } catch (error) {
        console.error('❌ Ошибка отправки:', error.message);
      }

    } else if (testType === '2') {
      // Тест с вымышленным ID
      const message = `🟡 ТРЕБУЕТСЯ ПОМОЩЬ МЕНЕДЖЕРА\n\n`;
      message += `📋 Причина: 💳 Вопрос о рассрочке\n`;
      message += `👤 Клиент: Тестовый клиент\n`;
      message += `🆔 ID: 123456789\n`;
      message += `\n💬 Сообщение клиента:\n"Можно ли оплатить в рассрочку?"\n\n`;
      message += `👇 Используйте кнопки ниже для быстрого перехода к клиенту\n\n`;
      message += `⏰ ${new Date().toLocaleString('ru-RU')}\n`;
      message += `#эскалация #installment`;

      const buttons = [[{
        text: '💬 Написать Тестовому клиенту',
        url: 'tg://user?id=123456789'
      }]];

      console.log(`\n📤 Отправка тестового сообщения с вымышленным ID...`);

      await client.sendMessage(MANAGER_USERNAME, {
        message: message,
        buttons: buttons
      });

      console.log('✅ Сообщение отправлено');
      console.log('⚠️ Кнопка не будет работать (вымышленный ID)');

    } else if (testType === '3') {
      // Тест с разными приоритетами
      const testCases = [
        {
          priority: '🔴',
          reason: '🛒 Клиент готов оформить заказ',
          message: 'Хочу купить курс прямо сейчас!',
          clientName: 'Анна Петрова',
          clientId: '186757140'
        },
        {
          priority: '🟡',
          reason: '💳 Вопрос о рассрочке',
          message: 'Можно ли оплатить в рассрочку?',
          clientName: 'Мария Иванова',
          clientId: '987654321'
        },
        {
          priority: '🟢',
          reason: '📋 Запрос программы курса',
          message: 'Пришлите подробную программу',
          clientName: 'Елена Сидорова',
          clientId: '555666777'
        }
      ];

      for (const testCase of testCases) {
        console.log(`\nОтправить тест "${testCase.reason}"? (y/n)`);
        const send = await question('');

        if (send.toLowerCase() === 'y') {
          const msg = `${testCase.priority} ТЕСТ ЭСКАЛАЦИИ\n\n`;
          msg += `📋 Причина: ${testCase.reason}\n`;
          msg += `👤 Клиент: ${testCase.clientName}\n`;
          msg += `🆔 ID: ${testCase.clientId}\n`;
          msg += `\n💬 Сообщение: "${testCase.message}"\n\n`;
          msg += `👇 Используйте кнопку для перехода к клиенту\n\n`;
          msg += `⏰ ${new Date().toLocaleString('ru-RU')}`;

          const buttons = [[{
            text: `💬 Написать ${testCase.clientName}`,
            url: `tg://user?id=${testCase.clientId}`
          }]];

          await client.sendMessage(MANAGER_USERNAME, {
            message: msg,
            buttons: buttons
          });

          console.log('✅ Отправлено с кнопкой');
        }
      }

    } else if (testType === '4') {
      // Тест простого сообщения без кнопок
      const simpleMessage = `🔴 ТРЕБУЕТСЯ ПОМОЩЬ МЕНЕДЖЕРА\n\n`;
      simpleMessage += `📋 Причина: Проблема с доступом к личному кабинету\n`;
      simpleMessage += `👤 Клиент: Ольга Васильева\n`;
      simpleMessage += `🆔 ID для поиска: 111222333\n`;
      simpleMessage += `📱 Можно написать через: @olga_vasileva\n`;
      simpleMessage += `\n💬 Сообщение клиента:\n"Не могу зайти в личный кабинет, забыла пароль"\n\n`;
      simpleMessage += `⚡ Требуется срочный ответ!\n\n`;
      simpleMessage += `🔍 Как найти клиента:\n`;
      simpleMessage += `1. Скопируйте ID: 111222333\n`;
      simpleMessage += `2. Используйте поиск в Telegram\n`;
      simpleMessage += `3. Или найдите по username: @olga_vasileva\n`;
      simpleMessage += `\n⏰ ${new Date().toLocaleString('ru-RU')}\n`;
      simpleMessage += `#эскалация #access`;

      console.log(`\n📤 Отправка простого сообщения без кнопок...`);

      await client.sendMessage(MANAGER_USERNAME, {
        message: simpleMessage
      });

      console.log('✅ Простое сообщение отправлено');
      console.log('📝 Менеджер должен будет найти клиента вручную');
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
