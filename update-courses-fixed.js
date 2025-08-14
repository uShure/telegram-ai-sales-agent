const Database = require('bun:sqlite').default;
const fs = require('fs');
const path = require('path');

console.log('🚀 Обновление базы данных курсов...\n');

// Путь к файлу с данными
const dataFile = './course-data.txt';
if (!fs.existsSync(dataFile)) {
  console.error('❌ Файл course-data.txt не найден!');
  process.exit(1);
}

// Читаем данные
const data = fs.readFileSync(dataFile, 'utf-8');
const lines = data.split('\n').filter(line => line.trim());

// Парсим курсы
const courses = [];
for (let i = 0; i < lines.length; i += 3) {
  if (i + 2 < lines.length) {
    const name = lines[i].trim();
    const format = lines[i + 1].trim();
    const priceStr = lines[i + 2].trim();
    
    const price = parseInt(priceStr.replace(/[^\d]/g, ''));
    
    if (name && format && !isNaN(price)) {
      courses.push({ name, format, price });
    }
  }
}

console.log(`📚 Найдено курсов для загрузки: ${courses.length}`);

// Удаляем старую базу
if (fs.existsSync('./courses.db')) {
  fs.unlinkSync('./courses.db');
}

// Создаем новую базу
const db = new Database('./courses.db');

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

// Функция генерации данных
function generateCourseData(name, format, price) {
  const duration = price > 100000 ? '6 месяцев' : 
                   price > 50000 ? '3 месяца' : 
                   price > 20000 ? '2 месяца' : 
                   price > 5000 ? '1 месяц' : '1 час';
  
  const description = `Профессиональный курс "${name}" в формате ${format}. ${
    name.includes('наставник') ? 'Персональное наставничество и поддержка на всех этапах.' :
    name.includes('с нуля') ? 'Комплексное обучение для начинающих.' :
    'Углубленное изучение современных техник и методик.'
  }`;
  
  const benefits = name.includes('наставник') ? 
    '• Персональный наставник\n• Индивидуальный план\n• Практика с обратной связью\n• Поддержка 24/7' :
    '• Сертификат SOINTERA\n• Практические занятия\n• Доступ к материалам навсегда\n• Чат с преподавателем';
  
  const targetAudience = price < 10000 ? 
    '• Все желающие\n• Начинающие мастера\n• Практикующие специалисты' :
    price > 100000 ?
    '• Опытные мастера\n• Владельцы салонов\n• Преподаватели' :
    '• Мастера с опытом\n• Выпускники базовых курсов\n• Амбициозные специалисты';
  
  const curriculum = 'Модуль 1: Теоретические основы\n' +
                     'Модуль 2: Практические навыки\n' +
                     'Модуль 3: Работа с клиентами\n' +
                     'Модуль 4: Развитие бизнеса';
  
  const urlName = name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-а-я]/gi, '');
  const enrollmentUrl = `https://sointera.com/courses/${urlName}`;
  
  return { duration, description, benefits, targetAudience, curriculum, enrollmentUrl };
}

// Вставляем курсы
const insert = db.prepare(`
  INSERT INTO courses (name, price, duration, description, format, benefits, targetAudience, curriculum, enrollmentUrl)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let added = 0;
for (const course of courses) {
  const data = generateCourseData(course.name, course.format, course.price);
  try {
    insert.run(
      course.name,
      course.price,
      data.duration,
      data.description,
      course.format,
      data.benefits,
      data.targetAudience,
      data.curriculum,
      data.enrollmentUrl
    );
    added++;
    console.log(`✅ Добавлен: ${course.name} (${course.format}, ${course.price}₽)`);
  } catch (err) {
    console.error(`❌ Ошибка: ${err.message}`);
  }
}

// Проверяем результат
const count = db.prepare('SELECT COUNT(*) as count FROM courses').get();
console.log(`\n📊 Всего курсов в базе: ${count.count}`);

// ВАЖНО: Закрываем базу
db.close();

// Копируем в админ панель
setTimeout(() => {
  try {
    fs.copyFileSync('./courses.db', '../telegram-admin-bot/courses.db');
    console.log('✅ База скопирована в админ панель');
  } catch (err) {
    console.error('❌ Ошибка копирования:', err.message);
  }
}, 100);

console.log('\n✅ Готово!');
