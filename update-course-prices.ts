import { Database } from "bun:sqlite";

// Обновленные цены курсов
const priceUpdates = [
  {
    title: 'Короткие стрижки 2.0',
    newPrice: 70000
  },
  {
    title: 'Стрижки 2.0',
    newPrice: 60000
  },
  {
    title: 'Очный курс по стрижкам: фундамент',
    newPrice: 60000
  }
];

try {
  console.log('💰 Обновление цен курсов в базе данных...\n');

  const db = new Database("courses.db");

  // Подготавливаем запрос
  const updateQuery = db.prepare("UPDATE Course SET price = ? WHERE title = ?");
  const selectQuery = db.prepare("SELECT title, price FROM Course WHERE title = ?");

  let updatedCount = 0;

  for (const update of priceUpdates) {
    // Сначала получаем текущую цену
    const current = selectQuery.get(update.title) as any;

    if (current) {
      const oldPrice = current.price;

      // Обновляем цену
      const result = updateQuery.run(update.newPrice, update.title);

      if (result.changes > 0) {
        console.log(`✅ ${update.title}`);
        console.log(`   Старая цена: ${oldPrice ? oldPrice.toLocaleString('ru-RU') : 'не указана'} ₽`);
        console.log(`   Новая цена: ${update.newPrice.toLocaleString('ru-RU')} ₽`);
        console.log(`   Изменение: ${oldPrice ? ((update.newPrice - oldPrice) > 0 ? '+' : '') + (update.newPrice - oldPrice).toLocaleString('ru-RU') : 'установлена'} ₽\n`);
        updatedCount++;
      }
    } else {
      console.log(`⚠️  Курс "${update.title}" не найден в базе\n`);
    }
  }

  console.log(`\n📊 Обновлено цен: ${updatedCount} из ${priceUpdates.length}`);

  // Проверяем результат
  console.log('\n📋 Проверка обновленных цен:\n');

  for (const update of priceUpdates) {
    const course = selectQuery.get(update.title) as any;
    if (course) {
      const isCorrect = course.price === update.newPrice;
      const status = isCorrect ? '✅' : '❌';
      console.log(`${status} ${course.title}: ${course.price ? course.price.toLocaleString('ru-RU') : 'не указана'} ₽`);
    }
  }

  // Показываем все курсы с ценами для контекста
  console.log('\n📊 Все курсы и их цены:\n');
  const allCourses = db.query("SELECT title, price, url FROM Course ORDER BY price DESC NULLS LAST").all();

  allCourses.forEach((course: any) => {
    console.log(`${course.title}`);
    console.log(`   💰 ${course.price ? course.price.toLocaleString('ru-RU') + ' ₽' : 'Цена не указана'}`);
    console.log(`   🔗 ${course.url}\n`);
  });

  db.close();
  console.log('✅ Обновление цен завершено!');

} catch (error) {
  console.error('❌ Ошибка:', error);
}
