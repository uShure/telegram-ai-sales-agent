import { Database } from "bun:sqlite";

// Курсы которые нужно обновить на цену 8,950₽
const coursesToUpdate = [
  'Корейские стрижки',
  'Факультет по неуправляемым волосам',
  'Факультет по работе с блондинками'
];

const newPrice = 8950; // Цена для всех факультетов

try {
  console.log('💰 Обновление цен факультетов в базе данных...\n');

  const db = new Database("courses.db");

  // Подготавливаем запросы
  const updateQuery = db.prepare("UPDATE Course SET price = ? WHERE title = ?");
  const selectQuery = db.prepare("SELECT title, price FROM Course WHERE title = ?");

  let updatedCount = 0;

  for (const courseTitle of coursesToUpdate) {
    // Получаем текущую цену
    const current = selectQuery.get(courseTitle) as any;

    if (current) {
      const oldPrice = current.price;

      // Обновляем цену
      const result = updateQuery.run(newPrice, courseTitle);

      if (result.changes > 0) {
        console.log(`✅ ${courseTitle}`);
        console.log(`   Старая цена: ${oldPrice ? oldPrice.toLocaleString('ru-RU') : 'не указана'} ₽`);
        console.log(`   Новая цена: ${newPrice.toLocaleString('ru-RU')} ₽`);
        const diff = oldPrice ? oldPrice - newPrice : 0;
        console.log(`   Экономия: ${diff.toLocaleString('ru-RU')} ₽ (${diff > 0 ? '-' + Math.round(diff/oldPrice*100) + '%' : ''})\n`);
        updatedCount++;
      }
    } else {
      console.log(`⚠️  Курс "${courseTitle}" не найден в базе\n`);
    }
  }

  console.log(`\n📊 Обновлено курсов: ${updatedCount} из ${coursesToUpdate.length}`);

  // Показываем все факультеты и их цены
  console.log('\n📚 Все факультеты и похожие курсы:\n');

  const fakultetQuery = db.query(`
    SELECT title, price, url
    FROM Course
    WHERE title LIKE '%факультет%'
       OR title LIKE '%корейск%'
       OR title LIKE '%школа%'
       OR price = ?
    ORDER BY title
  `);

  const fakultets = fakultetQuery.all(newPrice);

  fakultets.forEach((course: any) => {
    const isCorrect = course.price === newPrice;
    const status = isCorrect ? '✅' : '❌';
    console.log(`${status} ${course.title}`);
    console.log(`   💰 ${course.price ? course.price.toLocaleString('ru-RU') + ' ₽' : 'Цена не указана'}`);
    console.log(`   🔗 ${course.url}\n`);
  });

  // Показываем топ самых доступных курсов после обновления
  console.log('💎 Топ-10 самых доступных курсов:\n');

  const cheapestQuery = db.query(`
    SELECT title, price
    FROM Course
    WHERE price IS NOT NULL
    ORDER BY price ASC
    LIMIT 10
  `);

  const cheapest = cheapestQuery.all();

  cheapest.forEach((course: any, index: number) => {
    console.log(`${index + 1}. ${course.title} - ${course.price.toLocaleString('ru-RU')} ₽`);
  });

  db.close();
  console.log('\n✅ Обновление цен завершено!');

} catch (error) {
  console.error('❌ Ошибка:', error);
}
