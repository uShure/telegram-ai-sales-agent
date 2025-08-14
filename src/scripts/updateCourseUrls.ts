import sqlite3 from "sqlite3";
import path from "path";

// Новые URL для курсов
const courseUrls: Record<string, string> = {
  "Консультация на миллион": "https://sointera-biz.ru/million-consultation",
  "Короткие стрижки 2.0": "https://sointera-biz.ru/short-haircuts-2",
  "Очный курс по стрижкам: фундамент":
    "https://sointera-biz.ru/haircuts-foundation",
  "Стрижки 2.0": "https://sointera-biz.ru/haircuts-2",
  "СПА-стажировка в онлайн формате": "https://sointera-biz.ru/spa-online",
  "Стрижка SOINTERA": "https://sointera-biz.ru/strizhka-sointera",
  "Мастер-группа для руководителей": "https://sointera-biz.ru/master-group",
  "Планирование в салоне": "https://sointera-biz.ru/salon-planning",
  "Школа маркетинга": "https://sointera-biz.ru/marketing-school",
  "ДНК Цвета. Курс по колористике": "https://sointera-biz.ru/dna-color",
  "Короткие стрижки": "https://sointera-biz.ru/short-haircuts-online",
  "Курс по стрижкам": "https://sointera-biz.ru/haircuts-online",
  "Наставник по стрижкам": "https://sointera-biz.ru/haircuts-mentor",
  "Наставник-колорист": "https://sointera-biz.ru/colorist-mentor",
  "Парикмахер с нуля": "https://sointera-biz.ru/hairdresser-from-zero",
  "Корейские стрижки": "https://sointera-biz.ru/korean-haircuts",
  "Факультет по неуправляемым волосам": "https://sointera-biz.ru/unruly-hair",
  "Факультет по работе с блондинками": "https://sointera-biz.ru/blonde-faculty",
  "Лицензия преподавателя": "https://sointera-biz.ru/teacher-license",
  "Федеральная программа подготовки тренеров":
    "https://sointera-biz.ru/federal-trainer-program",
};

// Альтернативные URL для некоторых курсов
const alternativeUrls: Record<string, string> = {
  "Консультация на миллион": "https://sointera-biz.ru/million-consultation",
  "Короткие стрижки 2.0": "https://sointera-biz.ru/short_haircuts2",
  "Очный курс по стрижкам: фундамент": "https://sointera-biz.ru/stajirovka",
  "Стрижки 2.0": "https://sointera-biz.ru/haircuts-2-0",
  "СПА-стажировка в онлайн формате": "https://sointera-biz.ru/spa-online",
  "Стрижка SOINTERA": "https://sointera-biz.ru/haircut-sointera",
  "Мастер-группа для руководителей": "https://sointera-biz.ru/master-gruppa",
  "Планирование в салоне": "https://sointera-biz.ru/planning",
  "Школа маркетинга": "https://sointera-biz.ru/school-of-marketing",
  "ДНК Цвета. Курс по колористике": "https://sointera-biz.ru/dna_online",
  "Короткие стрижки": "https://sointera-biz.ru/short_haircuts",
  "Курс по стрижкам": "https://sointera-biz.ru/haircut_course",
  "Наставник по стрижкам": "https://sointera-biz.ru/hair_mentor",
  "Наставник-колорист": "https://sointera-biz.ru/nastavnik-kolorist",
  "Парикмахер с нуля": "https://sointera-biz.ru/parikmakher-s-nulya",
  "Корейские стрижки": "https://sointera-biz.ru/koreyskiye-strizhki",
  "Факультет по неуправляемым волосам":
    "https://sointera-biz.ru/fakultat-po-neupravlyayemym-volosam",
  "Факультет по работе с блондинками": "https://sointera-biz.ru/fakultet-blond",
  "Лицензия преподавателя": "https://sointera-biz.ru/licenziya-prepodavatelya",
  "Федеральная программа подготовки тренеров":
    "https://sointera-biz.ru/federalnaya-programma-podgotovki",
};

const dbPath = path.join(process.cwd(), "courses.db");
console.log("📚 Обновление URL курсов в базе данных:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Ошибка подключения к базе данных:", err.message);
    process.exit(1);
  }
  console.log("✅ Подключено к базе данных");
});

// Функция для обновления URL курса
function updateCourseUrl(title: string, newUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const updateQuery = `UPDATE Course SET url = ? WHERE title = ?`;

    db.run(updateQuery, [newUrl, title], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

// Функция для поиска курса по частичному совпадению названия
function findCourseByPartialTitle(
  partialTitle: string,
): Promise<{ id: string; title: string; url: string } | undefined> {
  return new Promise((resolve, reject) => {
    const query = `SELECT id, title, url FROM Course WHERE title LIKE ? OR title LIKE ?`;

    db.get(query, [`%${partialTitle}%`, `${partialTitle}%`], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Основная функция обновления
async function updateAllCourseUrls() {
  console.log("\n🔄 Начинаем обновление URL курсов...\n");

  let updatedCount = 0;
  let notFoundCount = 0;

  for (const [title, url] of Object.entries(courseUrls)) {
    try {
      // Сначала пытаемся найти по точному названию
      let changes = await updateCourseUrl(title, url);

      if (changes === 0) {
        // Если не нашли по точному названию, ищем по частичному совпадению
        const course = await findCourseByPartialTitle(title);

        if (course) {
          console.log(`📝 Найден курс "${course.title}" для "${title}"`);
          changes = await updateCourseUrl(course.title, url);
        }
      }

      if (changes > 0) {
        console.log(`✅ Обновлен URL для "${title}": ${url}`);

        // Также обновляем альтернативный URL в поле additionalInfo если есть
        if (alternativeUrls[title]) {
          const altUrl = alternativeUrls[title];
          const updateAltQuery = `UPDATE Course SET additionalInfo =
            CASE
              WHEN additionalInfo IS NULL THEN ?
              WHEN additionalInfo NOT LIKE '%Альтернативный URL:%' THEN additionalInfo || char(10) || ?
              ELSE additionalInfo
            END
            WHERE title = ?`;

          const altInfo = `Альтернативный URL: ${altUrl}`;

          db.run(updateAltQuery, [altInfo, altInfo, title], (err) => {
            if (!err) {
              console.log(`   📎 Добавлен альтернативный URL: ${altUrl}`);
            }
          });
        }

        updatedCount++;
      } else {
        console.log(`⚠️  Курс "${title}" не найден в базе данных`);
        notFoundCount++;
      }
    } catch (error: any) {
      console.error(`❌ Ошибка при обновлении "${title}":`, error.message);
    }
  }

  console.log(`\n📊 Результаты обновления:`);
  console.log(`   ✅ Обновлено курсов: ${updatedCount}`);
  console.log(`   ⚠️  Не найдено курсов: ${notFoundCount}`);

  // Показываем все курсы после обновления
  console.log("\n📋 Проверка всех курсов в базе:");

  db.all("SELECT title, url FROM Course ORDER BY title", (err, rows: any[]) => {
    if (err) {
      console.error("❌ Ошибка при получении списка курсов:", err.message);
    } else {
      rows.forEach((row) => {
        const hasNewUrl =
          Object.values(courseUrls).includes(row.url) ||
          Object.values(alternativeUrls).includes(row.url);
        const status = hasNewUrl ? "✅" : "❓";
        console.log(`${status} ${row.title}: ${row.url}`);
      });
    }

    db.close((err) => {
      if (err) {
        console.error("❌ Ошибка при закрытии базы данных:", err.message);
      } else {
        console.log("\n✅ База данных закрыта");
      }
    });
  });
}

// Запускаем обновление
updateAllCourseUrls();
