#!/bin/bash

echo "🔧 Исправление поврежденной базы данных..."
echo ""

# Создаем резервную копию поврежденной базы
if [ -f "conversations.db" ]; then
    echo "📦 Создание резервной копии поврежденной базы..."
    mv conversations.db conversations.db.corrupt.backup
fi

# Создаем новую базу данных
echo "🔄 Создание новой базы данных conversations.db..."

cat > create-new-conversations-db.js << 'EOF'
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('conversations.db', (err) => {
    if (err) {
        console.error('❌ Ошибка создания базы данных:', err.message);
        process.exit(1);
    }
    console.log('✅ База данных создана');
});

// Создаем таблицы
db.serialize(() => {
    // Таблица conversations
    db.run(`
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            userName TEXT NOT NULL,
            userPhone TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            lastMessageAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            clientStatus TEXT DEFAULT 'new',
            interestedProducts TEXT DEFAULT '[]'
        )
    `, (err) => {
        if (err) console.error('Ошибка создания таблицы conversations:', err);
        else console.log('✅ Таблица conversations создана');
    });

    // Таблица messages
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversationId TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversationId) REFERENCES conversations(id)
        )
    `, (err) => {
        if (err) console.error('Ошибка создания таблицы messages:', err);
        else console.log('✅ Таблица messages создана');
    });

    // Таблица followUps
    db.run(`
        CREATE TABLE IF NOT EXISTS followUps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversationId TEXT NOT NULL,
            scheduledFor DATETIME NOT NULL,
            sent BOOLEAN DEFAULT 0,
            sentAt DATETIME,
            FOREIGN KEY (conversationId) REFERENCES conversations(id)
        )
    `, (err) => {
        if (err) console.error('Ошибка создания таблицы followUps:', err);
        else console.log('✅ Таблица followUps создана');
    });

    // Индексы для производительности
    db.run('CREATE INDEX IF NOT EXISTS idx_messages_conversationId ON messages(conversationId)');
    db.run('CREATE INDEX IF NOT EXISTS idx_followUps_conversationId ON followUps(conversationId)');
    db.run('CREATE INDEX IF NOT EXISTS idx_followUps_scheduledFor ON followUps(scheduledFor)');
});

db.close((err) => {
    if (err) {
        console.error('❌ Ошибка закрытия базы данных:', err.message);
    } else {
        console.log('\n✅ База данных conversations.db успешно создана!');
    }
});
EOF

# Запускаем создание базы
node create-new-conversations-db.js

# Удаляем временный файл
rm create-new-conversations-db.js

echo ""
echo "✅ База данных исправлена!"
echo ""
echo "🚀 Теперь можете запустить бота командой:"
echo "   bun start"
