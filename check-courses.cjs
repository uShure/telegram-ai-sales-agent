const Database = require('bun:sqlite').default;
const db = new Database('./courses.db');

// Проверяем все курсы
console.log('Все курсы в базе:');
const allCourses = db.prepare('SELECT id, name, active FROM courses ORDER BY id').all();
allCourses.forEach(c => {
  console.log(`ID: ${c.id}, Active: ${c.active}, Name: "${c.name}"`);
});

// Ищем курсы со словом наставник
console.log('\n--- Поиск LIKE с LOWER ---');
const searchQuery = db.prepare('SELECT id, name FROM courses WHERE LOWER(name) LIKE LOWER(?)').all('%наставник%');
searchQuery.forEach(c => {
  console.log(`ID: ${c.id}, Name: "${c.name}"`);
});

// Ищем курс по ID 13
console.log('\n--- Курс с ID 13 ---');
const course13 = db.prepare('SELECT * FROM courses WHERE id = 13').get();
if (course13) {
  console.log(`ID: ${course13.id}`);
  console.log(`Name: "${course13.name}"`);
  console.log(`Price: ${course13.price}`);
  console.log(`Active: ${course13.active}`);
  console.log(`Format: ${course13.format}`);
} else {
  console.log('Курс с ID 13 не найден!');
}

db.close();
