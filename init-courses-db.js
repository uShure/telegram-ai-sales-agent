const Database = require('bun:sqlite').default;
const fs = require('fs');
const path = require('path');

console.log('🚀 Инициализация базы данных курсов...\n');

// Удаляем старую базу если существует
const dbPath = path.join(__dirname, 'courses.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Старая база данных удалена');
}

// Создаем новую базу данных
const db = new Database(dbPath);
console.log('✅ Создана новая база данных:', dbPath);

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
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('✅ Таблица courses создана');

// Создаем индексы
db.run('CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(active)');
db.run('CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name)');
console.log('✅ Индексы созданы');

// Вставляем курсы
const courses = [
  {
    name: "Парикмахер с нуля",
    price: 48000,
    description: "Полный курс обучения парикмахерскому искусству для начинающих. Научитесь всем основным техникам стрижки, укладки и окрашивания.",
    duration: "3 месяца",
    benefits: "✅ Диплом государственного образца\n✅ 80% практики\n✅ Трудоустройство\n✅ Инструменты в подарок\n✅ Поддержка после обучения",
    targetAudience: "Новички без опыта, желающие освоить профессию парикмахера",
    curriculum: "Модуль 1: Основы парикмахерского дела\nМодуль 2: Женские стрижки\nМодуль 3: Мужские стрижки\nМодуль 4: Окрашивание\nМодуль 5: Укладки и прически",
    enrollmentUrl: "https://sointera-biz.ru/parikmaher",
    active: 1
  },
  {
    name: "Парикмахер PRO",
    price: 75000,
    description: "Продвинутый курс для практикующих мастеров. Изучение сложных техник, колористика, работа с VIP-клиентами.",
    duration: "2 месяца",
    benefits: "✅ Международный сертификат\n✅ Мастер-классы от чемпионов\n✅ Бизнес-модуль\n✅ Стажировка в топ-салонах\n✅ Личный бренд",
    targetAudience: "Практикующие парикмахеры с опытом от 1 года",
    curriculum: "Модуль 1: Сложное окрашивание\nМодуль 2: Креативные стрижки\nМодуль 3: Свадебные прически\nМодуль 4: Работа с VIP\nМодуль 5: Развитие бизнеса",
    enrollmentUrl: "https://sointera-biz.ru/parikmaher-pro",
    active: 1
  },
  {
    name: "Бровист",
    price: 25000,
    description: "Комплексное обучение оформлению и окрашиванию бровей. Все современные техники и тренды.",
    duration: "3 недели",
    benefits: "✅ Сертификат\n✅ Стартовый набор\n✅ Отработка на моделях\n✅ Чат поддержки\n✅ Доступ к обновлениям",
    targetAudience: "Все желающие освоить востребованную beauty-профессию",
    curriculum: "Неделя 1: Архитектура бровей\nНеделя 2: Окрашивание и тонирование\nНеделя 3: Ламинирование и долговременная укладка",
    enrollmentUrl: "https://sointera-biz.ru/brovist",
    active: 1
  },
  {
    name: "Визажист",
    price: 55000,
    description: "Профессиональный курс макияжа. От базовых техник до fashion и beauty съемок.",
    duration: "2.5 месяца",
    benefits: "✅ Профессиональная косметика\n✅ Фотосессии для портфолио\n✅ Мастер-классы визажистов\n✅ Помощь в трудоустройстве\n✅ Сертификат",
    targetAudience: "Творческие личности, желающие работать в beauty-индустрии",
    curriculum: "Модуль 1: Основы визажа\nМодуль 2: Дневной и вечерний макияж\nМодуль 3: Свадебный макияж\nМодуль 4: Fashion и подиум\nМодуль 5: Работа с клиентами",
    enrollmentUrl: "https://sointera-biz.ru/vizazhist",
    active: 1
  },
  {
    name: "Мастер маникюра",
    price: 35000,
    description: "Полный курс по маникюру и покрытию гель-лаком. Аппаратный и комбинированный маникюр.",
    duration: "1.5 месяца",
    benefits: "✅ Все материалы включены\n✅ Аппарат в подарок\n✅ Практика на моделях\n✅ Поддержка наставника\n✅ Помощь в привлечении клиентов",
    targetAudience: "Начинающие мастера и те, кто хочет работать на себя",
    curriculum: "Модуль 1: Санитария и анатомия\nМодуль 2: Классический маникюр\nМодуль 3: Аппаратный маникюр\nМодуль 4: Покрытие и дизайн\nМодуль 5: Работа с клиентами",
    enrollmentUrl: "https://sointera-biz.ru/manikur",
    active: 1
  },
  {
    name: "Наращивание ресниц",
    price: 28000,
    description: "Обучение классическому и объемному наращиванию ресниц. Все современные техники.",
    duration: "3 недели",
    benefits: "✅ Стартовый набор lash-мастера\n✅ Отработка всех техник\n✅ Сертификат\n✅ Готовая база клиентов\n✅ Секреты продвижения",
    targetAudience: "Девушки, мечтающие о прибыльной beauty-профессии",
    curriculum: "Неделя 1: Основы и классика\nНеделя 2: Объемное наращивание 2D-6D\nНеделя 3: Особые техники и эффекты",
    enrollmentUrl: "https://sointera-biz.ru/resnicy",
    active: 1
  },
  {
    name: "Косметолог-эстетист",
    price: 120000,
    description: "Фундаментальное образование в косметологии. Лицензированная программа с медицинским уклоном.",
    duration: "6 месяцев",
    benefits: "✅ Государственный диплом\n✅ Медицинская лицензия\n✅ Оборудование для практики\n✅ Стажировка в клиниках\n✅ Международные сертификаты",
    targetAudience: "Лица с медицинским образованием и желающие его получить",
    curriculum: "Модуль 1: Анатомия и физиология\nМодуль 2: Дерматология\nМодуль 3: Аппаратная косметология\nМодуль 4: Инъекционные методики\nМодуль 5: Ведение пациентов",
    enrollmentUrl: "https://sointera-biz.ru/kosmetolog",
    active: 1
  },
  {
    name: "Массажист",
    price: 45000,
    description: "Профессиональное обучение классическому, лечебному и релакс-массажу.",
    duration: "2 месяца",
    benefits: "✅ Диплом с правом работы\n✅ 100+ часов практики\n✅ Анатомические атласы\n✅ Трудоустройство в спа\n✅ Обучение продажам услуг",
    targetAudience: "Люди, желающие помогать другим и хорошо зарабатывать",
    curriculum: "Модуль 1: Анатомия и физиология\nМодуль 2: Классический массаж\nМодуль 3: Лечебный массаж\nМодуль 4: SPA-процедуры\nМодуль 5: Этика и продажи",
    enrollmentUrl: "https://sointera-biz.ru/massazhist",
    active: 1
  },
  {
    name: "Барбер",
    price: 40000,
    description: "Специализированный курс мужских стрижек и ухода за бородой. Тренды и классика.",
    duration: "1.5 месяца",
    benefits: "✅ Профессиональные инструменты\n✅ Отработка на моделях\n✅ Сертификат барбера\n✅ Помощь в открытии барбершопа\n✅ Сообщество выпускников",
    targetAudience: "Мужчины и женщины, желающие стать барберами",
    curriculum: "Модуль 1: Основы барберинга\nМодуль 2: Мужские стрижки\nМодуль 3: Работа с бородой\nМодуль 4: Королевское бритье\nМодуль 5: Бизнес барбершопа",
    enrollmentUrl: "https://sointera-biz.ru/barber",
    active: 1
  },
  {
    name: "Стилист-имиджмейкер",
    price: 95000,
    description: "Комплексное обучение созданию индивидуального стиля. От теории цвета до работы со звездами.",
    duration: "4 месяца",
    benefits: "✅ Международный диплом\n✅ Стажировка на ТВ\n✅ Создание портфолио\n✅ База VIP-клиентов\n✅ PR и продвижение",
    targetAudience: "Творческие личности с чувством стиля",
    curriculum: "Модуль 1: Основы стиля\nМодуль 2: Цветотипы и типажи\nМодуль 3: Гардероб и шоппинг\nМодуль 4: Работа со звездами\nМодуль 5: Личный бренд стилиста",
    enrollmentUrl: "https://sointera-biz.ru/stilist",
    active: 1
  }
];

const insertStmt = db.prepare(`
  INSERT INTO courses (name, price, description, duration, benefits, targetAudience, curriculum, enrollmentUrl, active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let inserted = 0;
for (const course of courses) {
  try {
    insertStmt.run(
      course.name,
      course.price,
      course.description,
      course.duration,
      course.benefits,
      course.targetAudience,
      course.curriculum,
      course.enrollmentUrl,
      course.active
    );
    inserted++;
    console.log(`✅ Добавлен курс: ${course.name}`);
  } catch (error) {
    console.error(`❌ Ошибка при добавлении курса ${course.name}:`, error.message);
  }
}

console.log(`\n✅ Успешно добавлено курсов: ${inserted} из ${courses.length}`);

// Проверяем что всё сохранилось
const count = db.prepare('SELECT COUNT(*) as count FROM courses').get();
console.log(`✅ Всего курсов в базе: ${count.count}`);

// Тестовый запрос
console.log('\n📋 Тестовый запрос - список активных курсов:');
const testCourses = db.prepare('SELECT id, name, price FROM courses WHERE active = 1').all();
testCourses.forEach(course => {
  console.log(`   ${course.id}. ${course.name} - ${course.price}₽`);
});

db.close();
console.log('\n✅ База данных курсов успешно инициализирована!');
console.log('✅ Путь к базе данных:', dbPath);
