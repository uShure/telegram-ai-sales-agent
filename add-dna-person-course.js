const Database = require('bun:sqlite').Database;

console.log('📚 Добавление курса "ДНК ЦВЕТА в Творческой деревне"...');

try {
  const db = new Database('courses.db');

  // Проверяем, существует ли уже курс с таким названием
  const existingCourse = db.prepare(`
    SELECT * FROM courses
    WHERE name LIKE '%ДНК ЦВЕТА%Творческой деревне%'
  `).get();

  if (existingCourse) {
    console.log('⚠️ Курс уже существует в базе данных');
    db.close();
    process.exit(0);
  }

  // Добавляем новый курс
  const insertQuery = db.prepare(`
    INSERT INTO courses (
      name,
      price,
      description,
      duration,
      benefits,
      targetAudience,
      curriculum,
      enrollmentUrl,
      format,
      active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertQuery.run(
    'ДНК ЦВЕТА - Фундаментальный курс в Творческой деревне',
    60000,
    'Фундаментальный курс по колористике в Творческой деревне. 3 дня интенсивного обучения с Еленой Алексеюк.',
    '3 дня (30 сентября - 2 октября)',
    '✅ Личное обучение от Елены Алексеюк\n✅ Диплом государственного образца о повышении квалификации\n✅ Все включено: проживание и питание в Творческой деревне\n✅ Практика на моделях\n✅ Все материалы включены',
    'Парикмахеры-колористы, мастера по окрашиванию, стилисты',
    'День 1: Основы колористики и теория цвета\nДень 2: Практика сложных техник окрашивания\nДень 3: Работа с блондом и коррекция цвета',
    'https://sointera-biz.ru/dna_person',
    'офлайн',
    1
  );

  console.log('✅ Курс успешно добавлен в базу данных!');
  console.log('   ID нового курса:', result.lastInsertRowid);
  console.log('   Название: ДНК ЦВЕТА - Фундаментальный курс в Творческой деревне');
  console.log('   Цена: 60,000 руб.');
  console.log('   Формат: офлайн');
  console.log('   Даты: 30 сентября - 2 октября');

  // Проверяем, что курс добавлен
  const addedCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
  if (addedCourse) {
    console.log('✅ Проверка: курс найден в базе данных');
  }

  db.close();
  console.log('✅ База данных закрыта');

} catch (error) {
  console.error('❌ Ошибка при добавлении курса:', error.message);
  process.exit(1);
}
