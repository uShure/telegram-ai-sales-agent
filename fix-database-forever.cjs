const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ИСПРАВЛЕНИЕ ВСЕХ ПРОБЛЕМ С БАЗАМИ ДАННЫХ РАЗ И НАВСЕГДА\n');

// 1. Удаляем все старые базы данных
console.log('1️⃣ Удаление старых баз данных...');
const dbFiles = ['courses.db', 'conversations.db'];
dbFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`   ✅ Удален ${file}`);
  }
});

// 2. Создаем новую базу курсов
console.log('\n2️⃣ Создание новой базы курсов...');
try {
  execSync('bun run init-courses-db.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Ошибка при создании базы курсов:', error.message);
}

// 3. Создаем новую базу диалогов
console.log('\n3️⃣ Создание новой базы диалогов...');
const createConversationsDB = `
const Database = require('bun:sqlite').default;
const db = new Database('conversations.db');

// Создаем таблицы
db.run(\`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL UNIQUE,
    userName TEXT NOT NULL,
    userPhone TEXT,
    lastMessageAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    followUpScheduled DATETIME,
    clientStatus TEXT DEFAULT 'new',
    interestedProducts TEXT DEFAULT '[]',
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
\`);

db.run(\`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversationId INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversationId) REFERENCES conversations(id)
  )
\`);

db.run(\`
  CREATE TABLE IF NOT EXISTS follow_ups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversationId INTEGER NOT NULL,
    scheduledAt DATETIME NOT NULL,
    completed BOOLEAN DEFAULT 0,
    message TEXT,
    FOREIGN KEY (conversationId) REFERENCES conversations(id)
  )
\`);

// Создаем индексы
db.run('CREATE INDEX IF NOT EXISTS idx_conversations_userId ON conversations(userId)');
db.run('CREATE INDEX IF NOT EXISTS idx_messages_conversationId ON messages(conversationId)');
db.run('CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduledAt ON follow_ups(scheduledAt)');

console.log('✅ База диалогов создана');
db.close();
`;

fs.writeFileSync('create-conversations-temp.js', createConversationsDB);
try {
  execSync('bun run create-conversations-temp.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Ошибка при создании базы диалогов:', error.message);
}
fs.unlinkSync('create-conversations-temp.js');

// 4. Копируем базы в админ панель
console.log('\n4️⃣ Копирование баз данных в админ панель...');
const adminPath = path.join(__dirname, '..', 'telegram-admin-bot');
if (fs.existsSync(adminPath)) {
  dbFiles.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(adminPath, file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`   ✅ Скопирован ${file}`);
    }
  });
}

// 5. Проверяем права доступа
console.log('\n5️⃣ Установка прав доступа...');
dbFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.chmodSync(filePath, 0o666);
      console.log(`   ✅ Права установлены для ${file}`);
    } catch (error) {
      console.warn(`   ⚠️  Не удалось установить права для ${file}`);
    }
  }
});

// 6. Финальная проверка
console.log('\n6️⃣ Финальная проверка...');
const Database = require('bun:sqlite').default;

// Проверяем базу курсов
try {
  const coursesDb = new Database('courses.db');
  const count = coursesDb.prepare('SELECT COUNT(*) as count FROM courses').get();
  console.log(`   ✅ База курсов: ${count.count} записей`);
  coursesDb.close();
} catch (error) {
  console.error(`   ❌ Ошибка базы курсов: ${error.message}`);
}

// Проверяем базу диалогов
try {
  const convDb = new Database('conversations.db');
  const tables = convDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(`   ✅ База диалогов: ${tables.length} таблиц (${tables.map(t => t.name).join(', ')})`);
  convDb.close();
} catch (error) {
  console.error(`   ❌ Ошибка базы диалогов: ${error.message}`);
}

console.log('\n✅ ВСЕ ГОТОВО! Базы данных исправлены и готовы к работе.');
console.log('🚀 Теперь можете запускать бота командой: bun start');
