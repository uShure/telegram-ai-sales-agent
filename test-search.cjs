const Database = require('bun:sqlite').default;
const db = new Database('./courses.db');

// Тот же запрос, что в searchCourses
const query = `
  SELECT * FROM courses
  WHERE (
    name LIKE ? OR
    description LIKE ? OR
    targetAudience LIKE ? OR
    benefits LIKE ?
  ) AND active = 1
  ORDER BY price ASC
`;

const keywords = 'наставник';
const searchPattern = `%${keywords}%`;

console.log(`Поиск по слову: "${keywords}"`);
console.log(`Паттерн поиска: "${searchPattern}"`);

const stmt = db.prepare(query);
const rows = stmt.all(searchPattern, searchPattern, searchPattern, searchPattern);

console.log(`\nНайдено курсов: ${rows.length}`);
rows.forEach(row => {
  console.log(`- ${row.name} (ID: ${row.id}, Цена: ${row.price}₽)`);
});

// Проверим прямым запросом
console.log('\n--- Прямой поиск по name ---');
const directRows = db.prepare("SELECT id, name, price, active FROM courses WHERE name LIKE '%наставник%'").all();
directRows.forEach(row => {
  console.log(`- ${row.name} (ID: ${row.id}, Цена: ${row.price}₽, Active: ${row.active})`);
});

db.close();
