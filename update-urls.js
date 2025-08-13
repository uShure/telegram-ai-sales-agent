const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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

// Альтернативные URL для некоторых курсов
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

const dbPath = path.join(__dirname, 'courses.db');
console.log('📚 Обновление URL курсов в базе данных:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Ошибка подключения к базе данных:', err.message);
    process.exit(1);
  }
  console.log('✅ Подключено к базе данных');
});

// Основная функция обновления
async function updateAllCourseUrls() {
  console.log('\n🔄 Начинаем обновление URL курсов...\n');

  // Сначала покажем все курсы в базе
  console.log('📋 Текущие курсы в базе данных:');

  db.all('SELECT id, title, url FROM Course ORDER BY title', async (err, rows) => {
    if (err) {
      console.error('❌ Ошибка:', err.message);
      return;
    }

    console.log(`\nВсего курсов в базе: ${rows.length}\n`);

    let updatedCount = 0;
    let notFoundCount = 0;
    const notFoundCourses = [];

    // Обновляем URL для каждого курса из списка
    for (const [title, newUrl] of Object.entries(courseUrls)) {
      let found = false;

      // Ищем точное совпадение или частичное
      for (const row of rows) {
        if (row.title === title ||
            row.title.includes(title) ||
            title.includes(row.title) ||
            (row.title.toLowerCase().includes(title.toLowerCase()))) {

          // Обновляем URL
          db.run('UPDATE Course SET url = ? WHERE id = ?', [newUrl, row.id], (err) => {
            if (!err) {
              console.log(`✅ Обновлен: ${row.title}`);
              console.log(`   Новый URL: ${newUrl}`);

              // Добавляем альтернативный URL если есть
              if (alternativeUrls[title]) {
                const altUrl = alternativeUrls[title];
                const altInfo = `Альтернативный URL: ${altUrl}`;

                db.run(`UPDATE Course SET additionalInfo =
                  CASE
                    WHEN additionalInfo IS NULL THEN ?
                    WHEN additionalInfo NOT LIKE '%Альтернативный URL:%' THEN additionalInfo || char(10) || ?
                    ELSE additionalInfo
                  END
                  WHERE id = ?`, [altInfo, altInfo, row.id]);

                console.log(`   Альт. URL: ${altUrl}`);
              }
            }
          });

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

    // Показываем результаты
    setTimeout(() => {
      console.log(`\n📊 Результаты обновления:`);
      console.log(`   ✅ Обновлено курсов: ${updatedCount}`);
      console.log(`   ⚠️  Не найдено курсов: ${notFoundCount}`);

      if (notFoundCourses.length > 0) {
        console.log('\n⚠️  Не найдены следующие курсы:');
        notFoundCourses.forEach(course => {
          console.log(`   - ${course}`);
        });
      }

      // Показываем обновленный список
      console.log('\n📋 Проверка обновленных URL:');

      db.all('SELECT title, url FROM Course ORDER BY title', (err, updatedRows) => {
        if (!err) {
          updatedRows.forEach(row => {
            const hasNewUrl = Object.values(courseUrls).includes(row.url) ||
                             Object.values(alternativeUrls).includes(row.url);
            const status = hasNewUrl ? '✅' : '❓';
            console.log(`${status} ${row.title}`);
            console.log(`   ${row.url}`);
          });
        }

        db.close();
        console.log('\n✅ Обновление завершено!');
      });
    }, 1000);
  });
}

// Запускаем обновление
updateAllCourseUrls();
