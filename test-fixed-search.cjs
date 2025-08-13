const Database = require('bun:sqlite').default;
const db = new Database('./courses.db');

// Тестируем исправленный запрос
const query = `
  SELECT * FROM courses
  WHERE (
    LOWER(name) LIKE LOWER(?) OR
    LOWER(description) LIKE LOWER(?) OR
    LOWER(targetAudience) LIKE LOWER(?) OR
    LOWER(benefits) LIKE LOWER(?)
  ) AND active = 1
  ORDER BY price ASC
`;

const keywords = 'наставник';
const searchPattern = `%${keywords}%`;

console.log(`Поиск по слову: "${keywords}"`);

const stmt = db.prepare(query);
const rows = stmt.all(searchPattern, searchPattern, searchPattern, searchPattern);

console.log(`\nНайдено курсов: ${rows.length}`);
rows.forEach(row => {
  console.log(`- ${row.name} (ID: ${row.id}, Цена: ${row.price}₽, Формат: ${row.format})`);
});

db.close();
