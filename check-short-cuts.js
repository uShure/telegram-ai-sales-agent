const Database = require('bun:sqlite').default;

console.log('🔍 Проверка курса "Короткие стрижки 2.0":\n');

const db = new Database('./courses.db');

const course = db.prepare('SELECT * FROM courses WHERE name LIKE "%Короткие стрижки 2.0%"').get();

if (course) {
  console.log('✅ Курс найден:', course.name);
  console.log('Формат:', course.format);
  console.log('Цена:', course.price, 'руб.');

  console.log('\n📝 Описание:');
  console.log(course.description);

  console.log('\n📖 Программа включает:');
  const checks = [
    ['Читаемый затылок', course.curriculum.includes('затылок') || course.benefits.includes('затылок')],
    ['Не зарезать форму', course.curriculum.includes('зарезать') || course.benefits.includes('зарезать')],
    ['От 15 см до 2-3 см', course.curriculum.includes('15 см') || course.benefits.includes('15 см')],
    ['Костная структура', course.curriculum.includes('костн') || course.benefits.includes('костн')]
  ];

  checks.forEach(([feature, present]) => {
    console.log(`  ${present ? '✅' : '❌'} ${feature}`);
  });

  console.log('\n📋 Полная программа:');
  console.log(course.curriculum);
} else {
  console.log('❌ Курс не найден');
}

db.close();
