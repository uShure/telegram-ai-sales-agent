#!/usr/bin/env bun

const { Database } = require('bun:sqlite');
const fs = require('fs');

console.log('🔧 Создание базы данных conversations...\n');

// Создаем новую базу
const db = new Database('./conversations.db');

// Создаем таблицу с полной схемой
db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        user_name TEXT,
        user_username TEXT,
        message TEXT,
        is_from_user BOOLEAN,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        first_message_date DATETIME,
        last_message_date DATETIME,
        status TEXT DEFAULT 'new',
        admin_notes TEXT,
        phone TEXT,
        email TEXT,
        course_interest TEXT,
        targetAudience TEXT,
        benefits TEXT,
        curriculum TEXT,
        UNIQUE(user_id, timestamp, message)
    );

    CREATE INDEX IF NOT EXISTS idx_user_id ON conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_timestamp ON conversations(timestamp);
    CREATE INDEX IF NOT EXISTS idx_status ON conversations(status);
    CREATE INDEX IF NOT EXISTS idx_targetAudience ON conversations(targetAudience);
`);

console.log('✅ Таблица conversations создана');

// Создаем таблицы для системы эскалации
db.exec(`
    CREATE TABLE IF NOT EXISTS pending_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        sent BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sent_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS escalations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT NOT NULL,
        client_name TEXT,
        category TEXT,
        reason TEXT,
        priority TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_escalations_client ON escalations(client_id);
    CREATE INDEX IF NOT EXISTS idx_escalations_category ON escalations(category);
    CREATE INDEX IF NOT EXISTS idx_pending_sent ON pending_notifications(sent);
`);

console.log('✅ Таблицы для эскалации созданы');

// Добавляем тестовые данные
const testClients = [
    {
        id: '123456789',
        name: 'Анна Петрова',
        username: 'anna_petrova',
        status: 'interested'
    },
    {
        id: '987654321',
        name: 'Мария Иванова',
        username: 'maria_ivanova',
        status: 'new'
    },
    {
        id: '555666777',
        name: 'Елена Сидорова',
        username: 'elena_sidorova',
        status: 'negotiating'
    }
];

const insertStmt = db.prepare(`
    INSERT INTO conversations (
        user_id, user_name, user_username, message, is_from_user,
        timestamp, first_message_date, last_message_date, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

testClients.forEach((client, index) => {
    const baseTime = new Date();
    const time1 = new Date(baseTime.getTime() - (index * 3600000) - 60000).toISOString();
    const time2 = new Date(baseTime.getTime() - (index * 3600000)).toISOString();

    // Первое сообщение от клиента
    insertStmt.run(
        client.id,
        client.name,
        client.username,
        'Здравствуйте! Хочу узнать о ваших курсах',
        true,
        time1,
        time1,
        time2,
        client.status
    );

    // Ответ от бота
    insertStmt.run(
        client.id,
        client.name,
        client.username,
        'Добрый день! Я Вера из академии SOINTERA. Рада вас приветствовать! Какое направление вас интересует?',
        false,
        time2,
        time1,
        time2,
        client.status
    );
});

console.log('✅ Добавлены тестовые диалоги');

// Копируем в админ-панель
const adminPath = '../telegram-admin-bot';
if (fs.existsSync(adminPath)) {
    if (fs.existsSync(`${adminPath}/conversations.db`)) {
        fs.unlinkSync(`${adminPath}/conversations.db`);
    }
    fs.copyFileSync('./conversations.db', `${adminPath}/conversations.db`);
    console.log('✅ База скопирована в админ-панель');
}

// Статистика
const stats = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as clients,
           COUNT(*) as messages
    FROM conversations
`).get();

console.log('\n📊 Статистика:');
console.log(`   Клиентов: ${stats.clients}`);
console.log(`   Сообщений: ${stats.messages}`);

db.close();

console.log('\n✅ База данных conversations успешно создана!');
