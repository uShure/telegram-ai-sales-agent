import { Database } from "bun:sqlite";

try {
  const db = new Database("courses.db", { readonly: true });

  console.log('\n' + '='.repeat(80));
  console.log('📚 ВСЕ КУРСЫ SOINTERA С АКТУАЛЬНЫМИ ССЫЛКАМИ');
  console.log('='.repeat(80) + '\n');

  const courses = db.query("SELECT title, url, price, format FROM Course ORDER BY title").all();

  courses.forEach((course: any, index: number) => {
    console.log(`${index + 1}. ${course.title}`);
    console.log(`   🔗 ${course.url}`);
    if (course.price) {
      console.log(`   💰 ${course.price.toLocaleString('ru-RU')} ₽`);
    }
    console.log(`   📍 ${course.format}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log(`📊 Всего курсов: ${courses.length}`);
  console.log('='.repeat(80) + '\n');

  // Проверка правильности URL для указанных курсов
  console.log('✅ ПРОВЕРКА ОБНОВЛЕННЫХ URL:');
  console.log('-'.repeat(80));

  const checkCourses = [
    { title: 'Стрижки 2.0', expectedUrl: 'https://sointera-biz.ru/haircuts-2-0' },
    { title: 'Короткие стрижки 2.0', expectedUrl: 'https://sointera-biz.ru/short_haircuts2' },
    { title: 'Очный курс по стрижкам: фундамент', expectedUrl: 'https://sointera-biz.ru/stajirovka' },
    { title: 'СПА-стажировка в онлайн формате', expectedUrl: 'https://sointera-biz.ru/spa-online' }
  ];

  checkCourses.forEach(check => {
    const course = courses.find((c: any) => c.title === check.title);
    if (course) {
      const status = course.url === check.expectedUrl ? '✅' : '❌';
      console.log(`${status} ${check.title}`);
      console.log(`   Текущий URL: ${course.url}`);
      console.log(`   Ожидаемый URL: ${check.expectedUrl}`);
      console.log('');
    }
  });

  db.close();

} catch (error) {
  console.error('❌ Ошибка:', error);
}
