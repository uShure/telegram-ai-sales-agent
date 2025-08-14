const Database = require('bun:sqlite').default;
const db = new Database('./courses.db');

// Проверяем курс ID 3 (который находится по слову наставник)
console.log('=== Курс ID 3 (Очный курс по стрижкам: фундамент) ===');
const course3 = db.prepare('SELECT * FROM courses WHERE id = 3').get();
console.log('Name:', course3.name);
console.log('Description:', course3.description);
console.log('TargetAudience:', course3.targetAudience);
console.log('Benefits:', course3.benefits);

// Проверяем курс ID 13 (Наставник по стрижкам)
console.log('\n=== Курс ID 13 (Наставник по стрижкам) ===');
const course13 = db.prepare('SELECT * FROM courses WHERE id = 13').get();
console.log('Name:', course13.name);
console.log('Description:', course13.description);
console.log('TargetAudience:', course13.targetAudience);
console.log('Benefits:', course13.benefits);

// Прямой поиск по точному названию
console.log('\n=== Прямой поиск по названию ===');
const directSearch = db.prepare('SELECT id, name FROM courses WHERE name = ?').get('Наставник по стрижкам');
if (directSearch) {
  console.log('Найден курс:', directSearch.name, '(ID:', directSearch.id, ')');
} else {
  console.log('Курс НЕ найден!');
}

// Поиск с LIKE
console.log('\n=== Поиск с LIKE по name ===');
const likeSearch = db.prepare('SELECT id, name FROM courses WHERE name LIKE ?').all('%Наставник по стрижкам%');
console.log('Найдено курсов:', likeSearch.length);
likeSearch.forEach(c => console.log('-', c.name));

db.close();
