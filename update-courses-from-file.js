const Database = require('bun:sqlite').default;
const fs = require('fs');
const path = require('path');

console.log('🚀 Обновление базы данных курсов из вашего файла...\n');

// Удаляем старую базу
const dbPath = path.join(__dirname, 'courses.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Старая база данных удалена');
}

// Создаем новую базу данных
const db = new Database(dbPath);
console.log('✅ Создана новая база данных');

// Включаем строгий режим
db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA foreign_keys = ON');

// Создаем таблицу курсов
db.run(`
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT NOT NULL,
    duration TEXT NOT NULL,
    benefits TEXT NOT NULL,
    targetAudience TEXT NOT NULL,
    curriculum TEXT NOT NULL,
    enrollmentUrl TEXT NOT NULL,
    active BOOLEAN DEFAULT 1,
    format TEXT DEFAULT 'онлайн',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('✅ Таблица courses создана');

// Создаем индексы
db.run('CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(active)');
db.run('CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name)');
db.run('CREATE INDEX IF NOT EXISTS idx_courses_format ON courses(format)');
console.log('✅ Индексы созданы');

// Данные курсов из файла пользователя
const coursesData = [
  {
    name: "Консультация на миллион",
    url: "https://sointera-biz.ru/million-consultation",
    format: "онлайн",
    price: 500
  },
  {
    name: "Короткие стрижки 2.0",
    url: "https://sointera-biz.ru/short_haircuts2",
    format: "офлайн",
    price: 70000
  },
  {
    name: "Очный курс по стрижкам: фундамент",
    url: "https://sointera-biz.ru/stajirovka",
    format: "офлайн",
    price: 60000
  },
  {
    name: "Стрижки 2.0",
    url: "https://sointera-biz.ru/haircuts-2-0",
    format: "офлайн",
    price: 60000
  },
  {
    name: "СПА-стажировка в онлайн формате",
    url: "https://sointera-biz.ru/spa-online",
    format: "онлайн",
    price: 15000
  },
  {
    name: "Стрижка SOINTERA",
    url: "https://sointera-biz.ru/haircut-sointera",
    format: "онлайн",
    price: 3900
  },
  {
    name: "Мастер-группа для руководителей",
    url: "https://sointera-biz.ru/master-gruppa",
    format: "онлайн",
    price: 150000
  },
  {
    name: "Планирование в салоне",
    url: "https://sointera-biz.ru/planning",
    format: "офлайн",
    price: 95000
  },
  {
    name: "Школа маркетинга",
    url: "https://sointera-biz.ru/school-of-marketing",
    format: "онлайн",
    price: 35000
  },
  {
    name: "ДНК Цвета. Курс по колористике",
    url: "https://sointera-biz.ru/dna_online",
    format: "онлайн",
    price: 39000
  },
  {
    name: "Короткие стрижки",
    url: "https://sointera-biz.ru/short_haircuts",
    format: "онлайн",
    price: 35000
  },
  {
    name: "Курс по стрижкам",
    url: "https://sointera-biz.ru/haircut_course",
    format: "онлайн",
    price: 39000
  },
  {
    name: "Наставник по стрижкам",
    url: "https://sointera-biz.ru/hair_mentor",
    format: "онлайн",
    price: 65000
  },
  {
    name: "Наставник-колорист",
    url: "https://sointera-biz.ru/nastavnik-kolorist",
    format: "онлайн",
    price: 65000
  },
  {
    name: "Парикмахер с нуля",
    url: "https://sointera-biz.ru/parikmakher-s-nulya",
    format: "онлайн",
    price: 135000
  },
  {
    name: "Корейские стрижки",
    url: "https://sointera-biz.ru/koreyskiye-strizhki",
    format: "онлайн",
    price: 8950
  },
  {
    name: "Факультет по неуправляемым волосам",
    url: "https://sointera-biz.ru/fakultat-po-neupravlyayemym-volosam",
    format: "онлайн",
    price: 8950
  },
  {
    name: "Факультет по работе с блондинками",
    url: "https://sointera-biz.ru/fakultet-blond",
    format: "онлайн",
    price: 8950
  },
  {
    name: "Лицензия преподавателя",
    url: "https://sointera-biz.ru/licenziya-prepodavatelya",
    format: "офлайн",
    price: 130000
  },
  {
    name: "Федеральная программа подготовки тренеров",
    url: "https://sointera-biz.ru/federalnaya-programma-podgotovki",
    format: "офлайн",
    price: 260000
  }
];

// Генерируем описания и другие поля на основе названия и цены
function generateCourseDetails(course) {
  let description = `Профессиональный курс "${course.name}"`;
  let duration = "По запросу";
  let benefits = "✅ Сертификат об окончании\n✅ Поддержка преподавателей\n✅ Практические занятия";
  let targetAudience = "Парикмахеры, стилисты и все желающие развиваться в beauty-индустрии";
  let curriculum = "Подробная программа доступна на сайте";

  // Специфические настройки для разных курсов
  if (course.name.includes("с нуля")) {
    targetAudience = "Начинающие мастера без опыта";
    description += " для начинающих. Обучение с самых основ.";
    duration = "3-6 месяцев";
    benefits += "\n✅ Инструменты в подарок\n✅ Помощь в трудоустройстве";
  } else if (course.name.includes("Наставник")) {
    targetAudience = "Опытные мастера, желающие стать преподавателями";
    description += " для опытных мастеров. Научитесь передавать свои знания другим.";
    duration = "2-3 месяца";
    benefits += "\n✅ Методические материалы\n✅ Лицензия на преподавание";
  } else if (course.name.includes("руководител")) {
    targetAudience = "Владельцы салонов, руководители, администраторы";
    description += " для владельцев бизнеса. Эффективное управление салоном красоты.";
    duration = "2-4 месяца";
    benefits += "\n✅ Бизнес-инструменты\n✅ Консультации экспертов";
  } else if (course.name.includes("Факультет")) {
    targetAudience = "Практикующие мастера для повышения квалификации";
    description += ". Углубленное изучение специализированных техник.";
    duration = "1 месяц";
    benefits += "\n✅ Уникальные техники\n✅ Мастер-классы";
  } else if (course.price < 10000) {
    description += ". Доступное обучение для всех желающих.";
    duration = "1-2 недели";
  } else if (course.price > 100000) {
    description += ". Премиальная программа с индивидуальным подходом.";
    duration = "3-6 месяцев";
    benefits += "\n✅ VIP-поддержка\n✅ Индивидуальные консультации\n✅ Гарантия результата";
  }

  if (course.format === "офлайн") {
    benefits += "\n✅ Живое общение с преподавателями\n✅ Практика на моделях";
    description += " Очное обучение в академии SOINTERA.";
  } else {
    benefits += "\n✅ Обучение из любой точки мира\n✅ Доступ к записям занятий";
    description += " Удобный онлайн-формат обучения.";
  }

  // Специфика для некоторых курсов
  if (course.name.includes("стрижк")) {
    curriculum = "Модуль 1: Основы и инструменты\nМодуль 2: Базовые техники\nМодуль 3: Современные тренды\nМодуль 4: Работа с клиентами";
  } else if (course.name.includes("колорист") || course.name.includes("Цвета")) {
    curriculum = "Модуль 1: Теория цвета\nМодуль 2: Техники окрашивания\nМодуль 3: Работа с блондом\nМодуль 4: Коррекция цвета";
  } else if (course.name.includes("маркетинг")) {
    curriculum = "Модуль 1: Основы маркетинга\nМодуль 2: Digital-продвижение\nМодуль 3: Работа с клиентской базой\nМодуль 4: Увеличение продаж";
  }

  return {
    ...course,
    description,
    duration,
    benefits,
    targetAudience,
    curriculum,
    enrollmentUrl: course.url,
    active: 1
  };
}

// Вставляем курсы
const insertStmt = db.prepare(`
  INSERT INTO courses (name, price, description, duration, benefits, targetAudience, curriculum, enrollmentUrl, active, format)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let inserted = 0;
for (const courseData of coursesData) {
  try {
    const course = generateCourseDetails(courseData);
    insertStmt.run(
      course.name,
      course.price,
      course.description,
      course.duration,
      course.benefits,
      course.targetAudience,
      course.curriculum,
      course.enrollmentUrl,
      course.active,
      course.format
    );
    inserted++;
    console.log(`✅ Добавлен курс: ${course.name} (${course.format}, ${course.price}₽)`);
  } catch (error) {
    console.error(`❌ Ошибка при добавлении курса ${courseData.name}:`, error.message);
  }
}

console.log(`\n✅ Успешно добавлено курсов: ${inserted} из ${coursesData.length}`);

// Проверяем что всё сохранилось
const count = db.prepare('SELECT COUNT(*) as count FROM courses').get();
console.log(`✅ Всего курсов в базе: ${count.count}`);

// Показываем итоговый список
console.log('\n📋 Финальный список курсов:');
const allCourses = db.prepare('SELECT id, name, format, price FROM courses WHERE active = 1 ORDER BY price').all();
allCourses.forEach(course => {
  console.log(`   ${course.id}. ${course.name} (${course.format}) - ${course.price.toLocaleString('ru-RU')}₽`);
});

// Копируем базу в админ панель
const adminPath = path.join(__dirname, '..', 'telegram-admin-bot', 'courses.db');
if (fs.existsSync(path.dirname(adminPath))) {
  fs.copyFileSync(dbPath, adminPath);
  console.log('\n✅ База скопирована в админ панель');
}

db.close();
console.log('\n✅ База данных курсов успешно обновлена из вашего файла!');
console.log('🚀 Теперь бот будет использовать только эти курсы.');
