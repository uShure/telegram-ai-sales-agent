import { Database } from "bun:sqlite";

// ТОЧНЫЕ URL из списка пользователя
const correctUrls = [
  {
    title: 'Консультация на миллион',
    mainUrl: 'https://sointera-biz.ru/million-consultation',
    altUrl: 'https://sointera-biz.ru/million-consultation'
  },
  {
    title: 'Короткие стрижки 2.0',
    mainUrl: 'https://sointera-biz.ru/short-haircuts-2',
    altUrl: 'https://sointera-biz.ru/short_haircuts2'
  },
  {
    title: 'Очный курс по стрижкам: фундамент',
    mainUrl: 'https://sointera-biz.ru/haircuts-foundation',
    altUrl: 'https://sointera-biz.ru/stajirovka'
  },
  {
    title: 'Стрижки 2.0',
    mainUrl: 'https://sointera-biz.ru/haircuts-2',
    altUrl: 'https://sointera-biz.ru/haircuts-2-0'
  },
  {
    title: 'СПА-стажировка в онлайн формате',
    mainUrl: 'https://sointera-biz.ru/spa-online',
    altUrl: 'https://sointera-biz.ru/spa-online'
  },
  {
    title: 'Стрижка SOINTERA',
    mainUrl: 'https://sointera-biz.ru/haircut-sointera',
    altUrl: null
  },
  {
    title: 'Мастер-группа для руководителей',
    mainUrl: 'https://sointera-biz.ru/master-gruppa',
    altUrl: null
  },
  {
    title: 'Планирование в салоне',
    mainUrl: 'https://sointera-biz.ru/planning',
    altUrl: null
  },
  {
    title: 'Школа маркетинга',
    mainUrl: 'https://sointera-biz.ru/school-of-marketing',
    altUrl: null
  },
  {
    title: 'ДНК Цвета. Курс по колористике',
    mainUrl: 'https://sointera-biz.ru/dna_online',
    altUrl: null
  },
  {
    title: 'Короткие стрижки',
    mainUrl: 'https://sointera-biz.ru/short_haircuts',
    altUrl: null
  },
  {
    title: 'Курс по стрижкам',
    mainUrl: 'https://sointera-biz.ru/haircut_course',
    altUrl: null
  },
  {
    title: 'Наставник по стрижкам',
    mainUrl: 'https://sointera-biz.ru/hair_mentor',
    altUrl: null
  },
  {
    title: 'Наставник-колорист',
    mainUrl: 'https://sointera-biz.ru/nastavnik-kolorist',
    altUrl: null
  },
  {
    title: 'Парикмахер с нуля',
    mainUrl: 'https://sointera-biz.ru/parikmakher-s-nulya',
    altUrl: null
  },
  {
    title: 'Корейские стрижки',
    mainUrl: 'https://sointera-biz.ru/koreyskiye-strizhki',
    altUrl: null
  },
  {
    title: 'Факультет по неуправляемым волосам',
    mainUrl: 'https://sointera-biz.ru/fakultat-po-neupravlyayemym-volosam',
    altUrl: null
  },
  {
    title: 'Факультет по работе с блондинками',
    mainUrl: 'https://sointera-biz.ru/fakultet-blond',
    altUrl: null
  },
  {
    title: 'Лицензия преподавателя',
    mainUrl: 'https://sointera-biz.ru/licenziya-prepodavatelya',
    altUrl: null
  },
  {
    title: 'Федеральная программа подготовки тренеров',
    mainUrl: 'https://sointera-biz.ru/federalnaya-programma-podgotovki',
    altUrl: null
  }
];

try {
  console.log('🔧 ФИНАЛЬНОЕ исправление URL курсов согласно точному списку...\n');

  const db = new Database("courses.db");

  // Подготавливаем запросы
  const updateUrlQuery = db.prepare("UPDATE Course SET url = ? WHERE title = ?");
  const updateInfoQuery = db.prepare("UPDATE Course SET additionalInfo = ? WHERE title = ?");
  const clearInfoQuery = db.prepare("UPDATE Course SET additionalInfo = NULL WHERE title = ?");

  let updatedCount = 0;
  let errors: string[] = [];

  for (const course of correctUrls) {
    try {
      // Обновляем основной URL
      const urlResult = updateUrlQuery.run(course.mainUrl, course.title);

      if (urlResult.changes > 0) {
        console.log(`✅ ${course.title}`);
        console.log(`   URL: ${course.mainUrl}`);

        // Обрабатываем альтернативный URL
        if (course.altUrl && course.altUrl !== course.mainUrl) {
          const altInfo = `Альтернативный URL: ${course.altUrl}`;
          updateInfoQuery.run(altInfo, course.title);
          console.log(`   Альт: ${course.altUrl}`);
        } else {
          // Очищаем additionalInfo если альтернативного URL нет
          clearInfoQuery.run(course.title);
        }

        updatedCount++;
      } else {
        errors.push(`Не найден курс: ${course.title}`);
      }
      console.log('');
    } catch (error) {
      errors.push(`Ошибка при обновлении "${course.title}": ${error}`);
    }
  }

  console.log(`\n📊 Результаты:`);
  console.log(`   ✅ Успешно обновлено: ${updatedCount} из ${correctUrls.length}`);

  if (errors.length > 0) {
    console.log(`\n⚠️  Ошибки:`);
    errors.forEach(err => console.log(`   - ${err}`));
  }

  // Проверяем финальный результат
  console.log('\n📋 ФИНАЛЬНАЯ проверка URL в базе данных:\n');
  const courses = db.query("SELECT title, url, additionalInfo FROM Course ORDER BY title").all();

  let correctCount = 0;
  courses.forEach((course: any) => {
    const expected = correctUrls.find(c => c.title === course.title);
    const isCorrect = expected && course.url === expected.mainUrl;
    const status = isCorrect ? '✅' : '❌';

    if (isCorrect) correctCount++;

    console.log(`${status} ${course.title}`);
    console.log(`   URL: ${course.url}`);
    if (course.additionalInfo && course.additionalInfo.includes('Альтернативный URL:')) {
      console.log(`   ${course.additionalInfo}`);
    }
    console.log('');
  });

  console.log(`\n📊 Итого правильных URL: ${correctCount} из ${courses.length}`);

  db.close();
  console.log('\n✅ Финальное исправление завершено!');

} catch (error) {
  console.error('❌ Ошибка:', error);
}
