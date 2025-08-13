#!/usr/bin/env bun

/**
 * Настройка системы эскалации к менеджеру
 */

const { Database } = require('bun:sqlite');
const fs = require('fs');
const axios = require('axios');

console.log('🚀 Настройка системы эскалации к менеджеру\n');

// Параметры менеджера
const MANAGER_USERNAME = 'natalylini';
const MANAGER_NAME = 'Наталья';

// 1. Проверяем наличие токена бота
console.log('1️⃣ Проверка конфигурации...');
const envPath = './.env';
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8');
} else {
  console.log('   Создаем .env файл...');
  envContent = '';
}

// Проверяем наличие токена для уведомлений
if (!envContent.includes('NOTIFICATION_BOT_TOKEN')) {
  console.log('   ⚠️  NOTIFICATION_BOT_TOKEN не настроен');
  console.log('   Будет использоваться основной TELEGRAM_BOT_TOKEN');

  if (!envContent.includes('TELEGRAM_BOT_TOKEN')) {
    console.log('   ❌ TELEGRAM_BOT_TOKEN тоже не настроен!');
    console.log('   Добавьте в .env: TELEGRAM_BOT_TOKEN=ваш_токен_бота');
  }
}

// 2. Создаем таблицы для системы эскалации
console.log('\n2️⃣ Создание таблиц в базе данных...');
const db = new Database('./conversations.db');

try {
  // Таблица для отложенных уведомлений
  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      sent BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sent_at DATETIME
    )
  `);

  // Таблица истории эскалаций
  db.exec(`
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

  // Индексы для производительности
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_escalations_client ON escalations(client_id);
    CREATE INDEX IF NOT EXISTS idx_escalations_category ON escalations(category);
    CREATE INDEX IF NOT EXISTS idx_pending_sent ON pending_notifications(sent);
  `);

  console.log('   ✅ Таблицы созданы успешно');

} catch (error) {
  console.error('   ❌ Ошибка создания таблиц:', error.message);
}

// 3. Добавляем конфигурацию менеджера в .env
console.log('\n3️⃣ Настройка параметров менеджера...');

if (!envContent.includes('MANAGER_USERNAME')) {
  envContent += `\n# Настройки эскалации к менеджеру\n`;
  envContent += `MANAGER_USERNAME=${MANAGER_USERNAME}\n`;
  envContent += `MANAGER_NAME=${MANAGER_NAME}\n`;
  envContent += `# MANAGER_CHAT_ID будет получен автоматически после первого сообщения от менеджера\n`;
  envContent += `MANAGER_CHAT_ID=\n`;

  fs.writeFileSync(envPath, envContent);
  console.log('   ✅ Параметры менеджера добавлены в .env');
} else {
  console.log('   ✅ Параметры менеджера уже настроены');
}

// 4. Тестовые примеры сообщений для эскалации
console.log('\n4️⃣ Примеры сообщений, которые вызовут эскалацию:\n');

const examples = [
  { category: 'Оформление заказа', messages: [
    'Хочу оформить заказ',
    'Готова купить курс',
    'Как оплатить?',
    'Беру курс, как записаться?'
  ]},
  { category: 'Лист ожидания', messages: [
    'Запишите меня в лист ожидания',
    'Когда будет следующий поток?',
    'Хочу забронировать место'
  ]},
  { category: 'Проблемы с доступом', messages: [
    'Не могу зайти в личный кабинет',
    'Забыла пароль',
    'Не работает доступ к курсу'
  ]},
  { category: 'Рассрочка', messages: [
    'Можно ли в рассрочку?',
    'Есть оплата частями?',
    'Хочу оплатить в рассрочку'
  ]},
  { category: 'Оплата от ИП/ООО', messages: [
    'Нужно оплатить как ИП',
    'Выставьте счет для ООО',
    'Нужен официальный договор'
  ]},
  { category: 'Срочные вопросы', messages: [
    'Мне срочно нужен менеджер',
    'Позовите живого человека',
    'Это очень важно, нужна помощь'
  ]}
];

examples.forEach(example => {
  console.log(`📌 ${example.category}:`);
  example.messages.forEach(msg => {
    console.log(`   • "${msg}"`);
  });
  console.log('');
});

// 5. Инструкции для менеджера
console.log('5️⃣ ИНСТРУКЦИЯ ДЛЯ МЕНЕДЖЕРА @' + MANAGER_USERNAME + ':\n');
console.log('Чтобы получать уведомления об эскалациях:');
console.log('1. Найдите бота по токену (спросите у администратора)');
console.log('2. Отправьте боту команду /start');
console.log('3. После этого бот сможет отправлять вам уведомления');
console.log('');
console.log('Вы будете получать уведомления когда клиенты:');
console.log('• Готовы оформить заказ');
console.log('• Хотят записаться в лист ожидания');
console.log('• Имеют проблемы с доступом');
console.log('• Интересуются рассрочкой');
console.log('• Хотят оплатить от юридического лица');
console.log('• Имеют срочные вопросы');

// 6. Создаем тестовый скрипт
console.log('\n6️⃣ Создание тестового скрипта...');

const testScript = `#!/usr/bin/env bun

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

  const message = \`🧪 *ТЕСТОВОЕ УВЕДОМЛЕНИЕ*

Это тестовое сообщение системы эскалации.

Если вы видите это сообщение, значит система работает корректно!

*Клиент:* Тестовый клиент
*Сообщение:* "Хочу оформить заказ на курс"

⏰ \${new Date().toLocaleString('ru-RU')}

#тест #эскалация\`;

  try {
    const response = await axios.post(
      \`https://api.telegram.org/bot\${BOT_TOKEN}/sendMessage\`,
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
`;

fs.writeFileSync('./test-escalation.js', testScript);
console.log('   ✅ Создан test-escalation.js');
console.log('   Запустите: bun run test-escalation.js');

// 7. Создаем скрипт для получения chat_id менеджера
const getChatIdScript = `#!/usr/bin/env bun

/**
 * Получение chat_id менеджера
 */

const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.NOTIFICATION_BOT_TOKEN;
const MANAGER_USERNAME = '${MANAGER_USERNAME}';

async function getManagerChatId() {
  if (!BOT_TOKEN) {
    console.error('❌ Токен бота не настроен в .env');
    return;
  }

  try {
    const response = await axios.get(
      \`https://api.telegram.org/bot\${BOT_TOKEN}/getUpdates\`
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
`;

fs.writeFileSync('./get-manager-chat-id.js', getChatIdScript);
console.log('\n7️⃣ Создан get-manager-chat-id.js');
console.log('   Запустите после того, как менеджер напишет боту');

db.close();

console.log('\n' + '='.repeat(60));
console.log('✅ СИСТЕМА ЭСКАЛАЦИИ НАСТРОЕНА!');
console.log('='.repeat(60));
console.log('\nДальнейшие шаги:');
console.log('1. Убедитесь, что в .env есть TELEGRAM_BOT_TOKEN');
console.log('2. Попросите менеджера @' + MANAGER_USERNAME + ' написать боту /start');
console.log('3. Запустите: bun run get-manager-chat-id.js');
console.log('4. Добавьте полученный MANAGER_CHAT_ID в .env');
console.log('5. Протестируйте: bun run test-escalation.js');
console.log('\n✨ После этого бот будет автоматически эскалировать важные запросы!');
