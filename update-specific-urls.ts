import { Database } from "bun:sqlite";

// Конкретные URL для обновления
const urlUpdates = [
  {
    title: 'Стрижки 2.0',
    newUrl: 'https://sointera-biz.ru/haircuts-2-0'
  },
  {
    title: 'Короткие стрижки 2.0',
    newUrl: 'https://sointera-biz.ru/short_haircuts2'
  },
  {
    title: 'Очный курс по стрижкам: фундамент',
    newUrl: 'https://sointera-biz.ru/stajirovka'
  },
  {
    title: 'СПА-стажировка в онлайн формате',
    newUrl: 'https://sointera-biz.ru/spa-online'
  }
];

try {
  console.log('🔧 Обновление конкретных URL курсов...\n');

  const db = new Database("courses.db");

  // Подготавливаем запрос
  const updateQuery = db.prepare("UPDATE Course SET url = ? WHERE title = ?");

  // Обновляем указанные курсы
  for (const update of urlUpdates) {
    const result = updateQuery.run(update.newUrl, update.title);

    if (result.changes > 0) {
      console.log(`✅ Обновлен: ${update.title}`);
      console.log(`   Новый URL: ${update.newUrl}\n`);
    } else {
      console.log(`⚠️  Не найден: ${update.title}\n`);
    }
  }

  console.log('\n📋 ВСЕ КУРСЫ И ИХ ССЫЛКИ:\n');
  console.log('=' .repeat(80));

  // Показываем все курсы с их URL
  const allCourses = db.query("SELECT title, url FROM Course ORDER BY title").all();

  allCourses.forEach((course: any, index: number) => {
    console.log(`${index + 1}. ${course.title}`);
    console.log(`   ${course.url}`);
    console.log('');
  });

  console.log('=' .repeat(80));
  console.log(`\n📊 Всего курсов в базе: ${allCourses.length}`);

  db.close();
  console.log('\n✅ Обновление завершено!');

} catch (error) {
  console.error('❌ Ошибка:', error);
}
