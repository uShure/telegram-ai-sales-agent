const Database = require('bun:sqlite').default;
const fs = require('fs');

console.log('🔧 Создание базы данных курсов...\n');

// Удаляем старые базы
if (fs.existsSync('./courses.db')) {
  fs.unlinkSync('./courses.db');
  console.log('Удалена старая база');
}

// Создаем новую базу
const db = new Database('./courses.db', { create: true });

// Создаем таблицу
db.exec(`
  CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    duration TEXT NOT NULL,
    description TEXT NOT NULL,
    format TEXT DEFAULT 'онлайн',
    benefits TEXT NOT NULL,
    targetAudience TEXT NOT NULL,
    curriculum TEXT NOT NULL,
    enrollmentUrl TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_courses_active ON courses(active);
  CREATE INDEX idx_courses_price ON courses(price);
`);

console.log('✅ Таблица courses создана');

// Вставляем несколько курсов для теста
const insertCourse = db.prepare(`
  INSERT INTO courses (name, price, duration, description, format, benefits, targetAudience, curriculum, enrollmentUrl)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const courses = [
  {
    name: 'Консультация на миллион',
    price: 500,
    duration: '1 час',
    description: 'Персональная консультация по развитию вашего бизнеса в сфере красоты.',
    format: 'онлайн',
    benefits: '• Персональный разбор вашей ситуации\n• Готовая стратегия развития\n• Ответы на все вопросы',
    targetAudience: '• Владельцы салонов\n• Мастера с амбициями\n• Начинающие предприниматели',
    curriculum: 'Индивидуальная программа под ваши запросы',
    enrollmentUrl: 'https://sointera.com/consultation'
  },
  {
    name: 'Парикмахер с нуля',
    price: 135000,
    duration: '6 месяцев',
    description: 'Полный курс обучения парикмахерскому искусству с нуля до профессионала.',
    format: 'онлайн',
    benefits: '• Диплом государственного образца\n• Трудоустройство\n• Практика на моделях\n• Поддержка наставника',
    targetAudience: '• Новички без опыта\n• Желающие сменить профессию\n• Творческие личности',
    curriculum: 'Модуль 1: Основы\nМодуль 2: Стрижки\nМодуль 3: Окрашивание\nМодуль 4: Укладки',
    enrollmentUrl: 'https://sointera.com/hairdresser-from-zero'
  },
  {
    name: 'Курс по стрижкам',
    price: 39000,
    duration: '2 месяца',
    description: 'Профессиональный курс по современным техникам стрижек.',
    format: 'онлайн',
    benefits: '• 50+ техник стрижек\n• Сертификат\n• Онлайн-поддержка\n• Записи уроков навсегда',
    targetAudience: '• Практикующие мастера\n• Выпускники базовых курсов\n• Парикмахеры с опытом',
    curriculum: 'Женские стрижки\nМужские стрижки\nДетские стрижки\nКреативные техники',
    enrollmentUrl: 'https://sointera.com/haircut-course'
  }
];

// Вставляем курсы
let inserted = 0;
for (const course of courses) {
  try {
    insertCourse.run(
      course.name,
      course.price,
      course.duration,
      course.description,
      course.format,
      course.benefits,
      course.targetAudience,
      course.curriculum,
      course.enrollmentUrl
    );
    inserted++;
    console.log(`✅ Добавлен курс: ${course.name}`);
  } catch (err) {
    console.error(`❌ Ошибка при добавлении курса ${course.name}:`, err.message);
  }
}

// Проверяем результат
const count = db.prepare('SELECT COUNT(*) as count FROM courses').get();
console.log(`\n📊 Всего курсов в базе: ${count.count}`);

// ВАЖНО: Закрываем базу для сохранения изменений
db.close();

// Проверяем размер файла
const stats = fs.statSync('./courses.db');
console.log(`📁 Размер базы: ${stats.size} байт`);

// Копируем в админ панель
const adminPath = '../telegram-admin-bot/courses.db';
if (fs.existsSync(adminPath)) {
  fs.unlinkSync(adminPath);
}
fs.copyFileSync('./courses.db', adminPath);
console.log('✅ База скопирована в админ панель');

console.log('\n✅ База данных курсов создана успешно!');
