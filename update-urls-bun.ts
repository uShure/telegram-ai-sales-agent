import { Database } from "bun:sqlite";

// Новые URL для курсов
const courseUrls = {
  'Консультация на миллион': 'https://sointera-biz.ru/million-consultation',
  'Короткие стрижки 2.0': 'https://sointera-biz.ru/short-haircuts-2',
  'Очный курс по стрижкам: фундамент': 'https://sointera-biz.ru/haircuts-foundation',
  'Стрижки 2.0': 'https://sointera-biz.ru/haircuts-2',
  'СПА-стажировка в онлайн формате': 'https://sointera-biz.ru/spa-online',
  'Стрижка SOINTERA': 'https://sointera-biz.ru/strizhka-sointera',
  'Мастер-группа для руководителей': 'https://sointera-biz.ru/master-group',
  'Планирование в салоне': 'https://sointera-biz.ru/salon-planning',
  'Школа маркетинга': 'https://sointera-biz.ru/marketing-school',
  'ДНК Цвета. Курс по колористике': 'https://sointera-biz.ru/dna-color',
  'Короткие стрижки': 'https://sointera-biz.ru/short-haircuts-online',
  'Курс по стрижкам': 'https://sointera-biz.ru/haircuts-online',
  'Наставник по стрижкам': 'https://sointera-biz.ru/haircuts-mentor',
  'Наставник-колорист': 'https://sointera-biz.ru/colorist-mentor',
  'Парикмахер с нуля': 'https://sointera-biz.ru/hairdresser-from-zero',
  'Корейские стрижки': 'https://sointera-biz.ru/korean-haircuts',
  'Факультет по неуправляемым волосам': 'https://sointera-biz.ru/unruly-hair',
  'Факультет по работе с блондинками': 'https://sointera-biz.ru/blonde-faculty',
  'Лицензия преподавателя': 'https://sointera-biz.ru/teacher-license',
  'Федеральная программа подготовки тренеров': 'https://sointera-biz.ru/federal-trainer-program'
};

// Альтернативные URL
const alternativeUrls = {
  'Консультация на миллион': 'https://sointera-biz.ru/million-consultation',
  'Короткие стрижки 2.0': 'https://sointera-biz.ru/short_haircuts2',
  'Очный курс по стрижкам: фундамент': 'https://sointera-biz.ru/stajirovka',
  'Стрижки 2.0': 'https://sointera-biz.ru/haircuts-2-0',
  'СПА-стажировка в онлайн формате': 'https://sointera-biz.ru/spa-online',
  'Стрижка SOINTERA': 'https://sointera-biz.ru/haircut-sointera',
  'Мастер-группа для руководителей': 'https://sointera-biz.ru/master-gruppa',
  'Планирование в салоне': 'https://sointera-biz.ru/planning',
  'Школа маркетинга': 'https://sointera-biz.ru/school-of-marketing',
  'ДНК Цвета. Курс по колористике': 'https://sointera-biz.ru/dna_online',
  'Короткие стрижки': 'https://sointera-biz.ru/short_haircuts',
  'Курс по стрижкам': 'https://sointera-biz.ru/haircut_course',
  'Наставник по стрижкам': 'https://sointera-biz.ru/hair_mentor',
  'Наставник-колорист': 'https://sointera-biz.ru/nastavnik-kolorist',
  'Парикмахер с нуля': 'https://sointera-biz.ru/parikmakher-s-nulya',
  'Корейские стрижки': 'https://sointera-biz.ru/koreyskiye-strizhki',
  'Факультет по неуправляемым волосам': 'https://sointera-biz.ru/fakultat-po-neupravlyayemym-volosam',
  'Факультет по работе с блондинками': 'https://sointera-biz.ru/fakultet-blond',
  'Лицензия преподавателя': 'https://sointera-biz.ru/licenziya-prepodavatelya',
  'Федеральная программа подготовки тренеров': 'https://sointera-biz.ru/federalnaya-programma-podgotovki'
};

try {
  console.log('📚 Обновление URL курсов с помощью Bun SQLite...\n');

  const db = new Database("courses.db");
  console.log('✅ Подключено к базе данных\n');

  // Получаем все курсы
  const getAllCoursesQuery = db.query("SELECT id, title, url FROM Course ORDER BY title");
  const allCourses = getAllCoursesQuery.all();

  console.log(`📋 Всего курсов в базе: ${allCourses.length}\n`);

  let updatedCount = 0;
  let notFoundCount = 0;
  const notFoundCourses: string[] = [];

  // Подготавливаем запрос для обновления
  const updateQuery = db.prepare("UPDATE Course SET url = ? WHERE id = ?");
  const updateAltInfoQuery = db.prepare(`
    UPDATE Course
    SET additionalInfo =
      CASE
        WHEN additionalInfo IS NULL THEN ?
        WHEN additionalInfo NOT LIKE '%Альтернативный URL:%' THEN additionalInfo || char(10) || ?
        ELSE additionalInfo
      END
    WHERE id = ?
  `);

  console.log('🔄 Начинаем обновление URL...\n');

  // Обновляем URL для каждого курса
  for (const [title, newUrl] of Object.entries(courseUrls)) {
    let found = false;

    // Ищем соответствие в базе
    for (const course of allCourses as any[]) {
      if (course.title === title ||
          title.toLowerCase().includes(course.title.toLowerCase()) ||
          course.title.toLowerCase().includes(title.toLowerCase())) {

        // Обновляем URL
        updateQuery.run(newUrl, course.id);

        console.log(`✅ Обновлен: ${course.title}`);
        console.log(`   Старый URL: ${course.url}`);
        console.log(`   Новый URL: ${newUrl}`);

        // Добавляем альтернативный URL если есть
        if (alternativeUrls[title] && alternativeUrls[title] !== newUrl) {
          const altUrl = alternativeUrls[title];
          const altInfo = `Альтернативный URL: ${altUrl}`;

          updateAltInfoQuery.run(altInfo, altInfo, course.id);
          console.log(`   Альт. URL: ${altUrl}`);
        }

        console.log('');
        found = true;
        updatedCount++;
        break;
      }
    }

    if (!found) {
      notFoundCourses.push(title);
      notFoundCount++;
    }
  }

  console.log(`\n📊 Результаты обновления:`);
  console.log(`   ✅ Обновлено курсов: ${updatedCount}`);
  console.log(`   ⚠️  Не найдено курсов: ${notFoundCount}`);

  if (notFoundCourses.length > 0) {
    console.log('\n⚠️  Не найдены следующие курсы:');
    notFoundCourses.forEach(course => {
      console.log(`   - ${course}`);
    });
  }

  // Показываем обновленные курсы
  console.log('\n📋 Проверка обновленных URL:');
  const updatedCourses = db.query("SELECT title, url FROM Course ORDER BY title").all();

  for (const course of updatedCourses as any[]) {
    const hasNewUrl = Object.values(courseUrls).includes(course.url) ||
                     Object.values(alternativeUrls).includes(course.url);
    const status = hasNewUrl ? '✅' : '❓';
    console.log(`${status} ${course.title}`);
    console.log(`   ${course.url}`);
  }

  db.close();
  console.log('\n✅ База данных закрыта. Обновление завершено!');

} catch (error) {
  console.error('❌ Ошибка:', error);
}
