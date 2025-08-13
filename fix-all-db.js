const Database = require('bun:sqlite').default;
const fs = require('fs');

console.log('🔧 Исправление всех баз данных...\n');

// 1. База conversations.db
console.log('📌 Создаю conversations.db...');
if (fs.existsSync('./conversations.db')) {
  fs.unlinkSync('./conversations.db');
}

const convDb = new Database('./conversations.db');

// Создаем таблицы для conversations.db
convDb.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL UNIQUE,
    userName TEXT,
    userPhone TEXT,
    clientStatus TEXT NOT NULL DEFAULT 'new',
    interestedProducts TEXT DEFAULT '[]',
    lastMessageAt TEXT NOT NULL,
    notes TEXT,
    followUpScheduled TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversationId INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversationId);
  CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(clientStatus);
  CREATE INDEX IF NOT EXISTS idx_conversations_userId ON conversations(userId);
`);

console.log('✅ conversations.db создана успешно');
convDb.close();

// 2. База courses.db уже существует и работает
console.log('\n📌 Проверяю courses.db...');
try {
  const coursesDb = new Database('./courses.db');
  const count = coursesDb.prepare('SELECT COUNT(*) as count FROM courses').get();
  console.log(`✅ courses.db работает, курсов: ${count.count}`);
  coursesDb.close();
} catch (err) {
  console.error('❌ Ошибка с courses.db:', err.message);
}

console.log('\n✅ Все базы данных готовы к работе!');
