const Database = require('bun:sqlite').default;
const fs = require('fs');

// Удаляем старую базу
if (fs.existsSync('./courses.db')) {
  fs.unlinkSync('./courses.db');
}

// Создаем новую
const db = new Database('./courses.db');

// Создаем таблицу
db.exec(`
  CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    duration TEXT NOT NULL,
    description TEXT NOT NULL,
    format TEXT DEFAULT 'онлайн',
    benefits TEXT NOT NULL,
    targetAudience TEXT NOT NULL,
    curriculum TEXT NOT NULL,
    enrollmentUrl TEXT NOT NULL,
    active INTEGER DEFAULT 1
  )
`);

// Добавляем курс
db.prepare(`
  INSERT INTO courses (name, price, duration, description, format, benefits, targetAudience, curriculum, enrollmentUrl)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'Тестовый курс',
  10000,
  '2 недели',
  'Описание курса',
  'онлайн',
  'Преимущества',
  'Аудитория',
  'Программа',
  'https://example.com'
);

console.log('База создана');

// Проверяем
const count = db.prepare('SELECT COUNT(*) as count FROM courses').get();
console.log('Курсов:', count.count);

// Закрываем
db.close();

// Копируем
fs.copyFileSync('./courses.db', '../telegram-admin-bot/courses.db');
console.log('Скопировано в админ панель');
