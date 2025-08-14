import { Database } from "bun:sqlite";

// ТОЧНЫЕ URL из списка пользователя
const courseData = [
  {
    title: 'Консультация на миллион',
    url: 'https://sointera-biz.ru/million-consultation',
    altUrl: 'https://sointera-biz.ru/million-consultation'
  },
  {
    title: 'Короткие стрижки 2.0',
    url: 'https://sointera-biz.ru/short-haircuts-2',
    altUrl: 'https://sointera-biz.ru/short_haircuts2'
  },
  {
    title: 'Очный курс по стрижкам: фундамент',
    url: 'https://sointera-biz.ru/haircuts-foundation',
    altUrl: 'https://sointera-biz.ru/stajirovka'
  },
  {
    title: 'Стрижки 2.0',
    url: 'https://sointera-biz.ru/haircuts-2',
    altUrl: 'https://sointera-biz.ru/haircuts-2-0'
  },
  {
    title: 'СПА-стажировка в онлайн формате',
    url: 'https://sointera-biz.ru/spa-online',
    altUrl: 'https://sointera-biz.ru/spa-online'
  },
  {
    title: 'Стрижка SOINTERA',
    url: 'https://sointera-biz.ru/strizhka-sointera',
    altUrl: 'https://sointera-biz.ru/haircut-sointera'
  },
  {
    title: 'Мастер-группа для руководителей',
    url: 'https://sointera-biz.ru/master-group',
    altUrl: 'https://sointera-biz.ru/master-gruppa'
  },
  {
    title: 'Планирование в салоне',
    url: 'https://sointera-biz.ru/salon-planning',
    altUrl: 'https://sointera-biz.ru/planning'
  },
  {
    title: 'Школа маркетинга',
    url: 'https://sointera-biz.ru/marketing-school',
    altUrl: 'https://sointera-biz.ru/school-of-marketing'
  },
  {
    title: 'ДНК Цвета. Курс по колористике',
    url: 'https://sointera-biz.ru/dna-color',
    altUrl: 'https://sointera-biz.ru/dna_online'
  },
  {
    title: 'Короткие стрижки',
    url: 'https://sointera-biz.ru/short-haircuts-online',
    altUrl: 'https://sointera-biz.ru/short_haircuts'
  },
  {
    title: 'Курс по стрижкам',
    url: 'https://sointera-biz.ru/haircuts-online',
    altUrl: 'https://sointera-biz.ru/haircut_course'
  },
  {
    title: 'Наставник по стрижкам',
    url: 'https://sointera-biz.ru/haircuts-mentor',
    altUrl: 'https://sointera-biz.ru/hair_mentor'
  },
  {
    title: 'Наставник-колорист',
    url: 'https://sointera-biz.ru/colorist-mentor',
    altUrl: 'https://sointera-biz.ru/nastavnik-kolorist'
  },
  {
    title: 'Парикмахер с нуля',
    url: 'https://sointera-biz.ru/hairdresser-from-zero',
    altUrl: 'https://sointera-biz.ru/parikmakher-s-nulya'
  },
  {
    title: 'Корейские стрижки',
    url: 'https://sointera-biz.ru/korean-haircuts',
    altUrl: 'https://sointera-biz.ru/koreyskiye-strizhki'
  },
  {
    title: 'Факультет по неуправляемым волосам',
    url: 'https://sointera-biz.ru/unruly-hair',
    altUrl: 'https://sointera-biz.ru/fakultat-po-neupravlyayemym-volosam'
  },
  {
    title: 'Факультет по работе с блондинками',
    url: 'https://sointera-biz.ru/blonde-faculty',
    altUrl: 'https://sointera-biz.ru/fakultet-blond'
  },
  {
    title: 'Лицензия преподавателя',
    url: 'https://sointera-biz.ru/teacher-license',
    altUrl: 'https://sointera-biz.ru/licenziya-prepodavatelya'
  },
  {
    title: 'Федеральная программа подготовки тренеров',
    url: 'https://sointera-biz.ru/federal-trainer-program',
    altUrl: 'https://sointera-biz.ru/federalnaya-programma-podgotovki'
  }
];

try {
  console.log('🔧 Исправление URL курсов в базе данных...\n');

  const db = new Database("courses.db");

  // Подготавливаем запросы
  const updateUrlQuery = db.prepare("UPDATE Course SET url = ? WHERE title = ?");
  const updateInfoQuery = db.prepare("UPDATE Course SET additionalInfo = ? WHERE title = ?");

  let updatedCount = 0;

  for (const course of courseData) {
    // Обновляем основной URL
    const urlResult = updateUrlQuery.run(course.url, course.title);

    if (urlResult.changes > 0) {
      console.log(`✅ ${course.title}`);
      console.log(`   Основной URL: ${course.url}`);

      // Обновляем альтернативный URL только если он отличается
      if (course.url !== course.altUrl) {
        const altInfo = `Альтернативный URL: ${course.altUrl}`;
        updateInfoQuery.run(altInfo, course.title);
        console.log(`   Альт. URL: ${course.altUrl}`);
      }

      updatedCount++;
    } else {
      console.log(`⚠️  Не найден курс: ${course.title}`);
    }
    console.log('');
  }

  console.log(`\n📊 Обновлено курсов: ${updatedCount} из ${courseData.length}`);

  // Проверяем результат
  console.log('\n📋 Проверка обновленных URL:\n');
  const courses = db.query("SELECT title, url, additionalInfo FROM Course ORDER BY title").all();

  courses.forEach((course: any) => {
    console.log(`📌 ${course.title}`);
    console.log(`   URL: ${course.url}`);
    if (course.additionalInfo && course.additionalInfo.includes('Альтернативный URL:')) {
      console.log(`   ${course.additionalInfo}`);
    }
    console.log('');
  });

  db.close();
  console.log('✅ Исправление завершено!');

} catch (error) {
  console.error('❌ Ошибка:', error);
}
