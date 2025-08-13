#!/usr/bin/env bun

/**
 * Тестирование эскалации через личный аккаунт
 * Отправляет тестовое уведомление менеджеру напрямую от userbot
 */

const { TelegramClient } = require('telegram');
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
  console.log('🚀 Тестирование эскалации через личный аккаунт\n');

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

    // Формируем тестовое сообщение
    const testMessage = `🧪 **ТЕСТОВОЕ УВЕДОМЛЕНИЕ**

Это тестовое сообщение системы эскалации от бота-продажника.

**Клиент:** Анна Петрова
**Username:** @anna_test
**Запрос:** "Хочу купить курс ДНК ЦВЕТА"

Если вы видите это сообщение, значит эскалация через личный аккаунт работает корректно!

⏰ ${new Date().toLocaleString('ru-RU')}

#тест #эскалация`;

    console.log(`\n📤 Отправка тестового сообщения менеджеру @${MANAGER_USERNAME}...`);

    try {
      // Отправляем сообщение
      await client.sendMessage(MANAGER_USERNAME, {
        message: testMessage,
        parseMode: 'markdown'
      });

      console.log('✅ Сообщение успешно отправлено!');
      console.log(`📱 Проверьте личные сообщения с @${MANAGER_USERNAME}`);

    } catch (error) {
      if (error.message.includes('USER_NOT_MUTUAL_CONTACT')) {
        console.log('⚠️ Менеджер не в контактах, пытаемся через поиск...');

        try {
          // Ищем пользователя
          const { Api } = require('telegram');
          const result = await client.invoke(
            new Api.contacts.Search({
              q: MANAGER_USERNAME,
              limit: 1
            })
          );

          if (result.users && result.users.length > 0) {
            const manager = result.users[0];

            await client.sendMessage(manager, {
              message: testMessage,
              parseMode: 'markdown'
            });

            console.log('✅ Сообщение отправлено через поиск!');
          } else {
            console.log('❌ Не удалось найти менеджера');
            console.log('Возможные причины:');
            console.log('1. Неправильный username');
            console.log('2. Приватность настроек менеджера');
            console.log('3. Менеджер заблокировал этот аккаунт');
          }
        } catch (searchError) {
          console.error('❌ Ошибка поиска:', searchError.message);
        }
      } else {
        console.error('❌ Ошибка отправки:', error.message);
      }
    }

    // Тестируем отправку с разными приоритетами
    console.log('\n📊 Хотите протестировать разные типы эскалации? (y/n)');
    const testMore = await question('');

    if (testMore.toLowerCase() === 'y') {
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
          const msg = `${testCase.priority} **ТЕСТ ЭСКАЛАЦИИ**

**Причина:** ${testCase.reason}
**Клиент:** Тестовый клиент
**Сообщение:** "${testCase.message}"

⏰ ${new Date().toLocaleString('ru-RU')}`;

          await client.sendMessage(MANAGER_USERNAME, {
            message: msg,
            parseMode: 'markdown'
          });

          console.log('✅ Отправлено');
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
