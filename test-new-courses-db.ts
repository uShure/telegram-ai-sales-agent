import { Database } from "bun:sqlite";

try {
  console.log('🔍 Тестирование новой базы данных курсов...\n');

  const db = new Database("courses.db", { readonly: true });

  // Проверяем количество курсов
  const count = db.query("SELECT COUNT(*) as total FROM Course").get();
  console.log(`✅ Всего курсов в базе: ${count.total}`);

  // Проверяем несколько курсов с новыми URL
  console.log('\n📋 Примеры курсов с новыми URL:\n');

  const testTitles = [
    'Консультация на миллион',
    'Короткие стрижки 2.0',
    'Парикмахер с нуля',
    'ДНК Цвета. Курс по колористике'
  ];

  for (const title of testTitles) {
    const course = db.query("SELECT title, url, price, format FROM Course WHERE title = ?").get(title);
    if (course) {
      console.log(`📌 ${course.title}`);
      console.log(`   URL: ${course.url}`);
      console.log(`   Цена: ${course.price ? course.price.toLocaleString('ru-RU') + ' ₽' : 'не указана'}`);
      console.log(`   Формат: ${course.format}`);
      console.log('');
    }
  }

  // Проверяем поиск курсов
  console.log('🔎 Тест поиска курсов:\n');

  const searchResults = db.query("SELECT title, url FROM Course WHERE title LIKE ? OR description LIKE ?").all('%стрижк%', '%стрижк%');
  console.log(`Найдено курсов по запросу "стрижк": ${searchResults.length}`);
  searchResults.slice(0, 3).forEach((course: any) => {
    console.log(`  - ${course.title}: ${course.url}`);
  });

  // Проверяем категории
  console.log('\n📂 Проверка категорий:\n');
  const categories = db.query("SELECT category, COUNT(*) as count FROM Course GROUP BY category ORDER BY count DESC").all();
  categories.forEach((cat: any) => {
    console.log(`  ${cat.category}: ${cat.count} курсов`);
  });

  db.close();
  console.log('\n✅ Тестирование завершено успешно!');

} catch (error) {
  console.error('❌ Ошибка при тестировании:', error);
}
