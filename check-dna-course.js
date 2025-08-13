const Database = require('bun:sqlite').default;

console.log('🔍 Проверка курсов по колористике в базе данных...\n');

const db = new Database('./courses.db');

// Получаем все курсы с ДНК, колор или цвет в названии
const colorCourses = db.prepare(`
  SELECT id, name, format, price, description
  FROM courses
  WHERE name LIKE '%ДНК%' OR name LIKE '%колор%' OR name LIKE '%цвет%'
     OR name LIKE '%окраш%' OR description LIKE '%колорист%'
  ORDER BY price
`).all();

console.log(`Найдено курсов по колористике: ${colorCourses.length}\n`);

colorCourses.forEach(course => {
  console.log(`📚 ${course.name}`);
  console.log(`   Формат: ${course.format}`);
  console.log(`   Цена: ${course.price} руб.`);
  console.log(`   Описание: ${course.description.substring(0, 150)}...`);
  console.log('');
});

// Проверяем курсы по визажу (которых не должно быть)
const makeupCourses = db.prepare(`
  SELECT name FROM courses
  WHERE name LIKE '%визаж%' OR name LIKE '%макияж%'
`).all();

if (makeupCourses.length > 0) {
  console.log('⚠️ НАЙДЕНЫ КУРСЫ ПО ВИЗАЖУ (не должны быть в базе SOINTERA):');
  makeupCourses.forEach(c => console.log(`   - ${c.name}`));
} else {
  console.log('✅ Курсов по визажу нет (правильно для SOINTERA)');
}

db.close();
