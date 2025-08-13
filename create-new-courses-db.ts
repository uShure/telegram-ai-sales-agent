import { Database } from "bun:sqlite";

// Структура курсов с актуальными URL
const courses = [
  {
    id: 'consultation-million',
    title: 'Консультация на миллион',
    description: 'Индивидуальная консультация по развитию бизнеса в бьюти-индустрии',
    price: 150000,
    currency: 'RUB',
    duration: '2 часа',
    format: 'онлайн',
    instructor: 'Елена Алексеюк',
    category: 'Для руководителей',
    url: 'https://sointera-biz.ru/million-consultation',
    startDate: null,
    modules: 1,
    certificateType: null,
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/million-consultation',
    isActive: true
  },
  {
    id: 'short-haircuts-2',
    title: 'Короткие стрижки 2.0',
    description: 'Продвинутый курс по коротким стрижкам',
    price: 45000,
    currency: 'RUB',
    duration: '3 дня',
    format: 'офлайн',
    instructor: 'Мастера академии',
    category: 'Стрижки',
    url: 'https://sointera-biz.ru/short-haircuts-2',
    startDate: null,
    modules: 3,
    certificateType: 'Сертификат академии',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/short_haircuts2',
    isActive: true
  },
  {
    id: 'haircuts-foundation',
    title: 'Очный курс по стрижкам: фундамент',
    description: 'Базовый очный курс по стрижкам для начинающих',
    price: 65000,
    currency: 'RUB',
    duration: '5 дней',
    format: 'офлайн',
    instructor: 'Мастера академии',
    category: 'Стрижки',
    url: 'https://sointera-biz.ru/haircuts-foundation',
    startDate: null,
    modules: 5,
    certificateType: 'Сертификат академии',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/stajirovka',
    isActive: true
  },
  {
    id: 'haircuts-2',
    title: 'Стрижки 2.0',
    description: 'Продвинутый курс по стрижкам',
    price: 48000,
    currency: 'RUB',
    duration: '3 дня',
    format: 'офлайн',
    instructor: 'Мастера академии',
    category: 'Стрижки',
    url: 'https://sointera-biz.ru/haircuts-2',
    startDate: null,
    modules: 3,
    certificateType: 'Сертификат академии',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/haircuts-2-0',
    isActive: true
  },
  {
    id: 'spa-online',
    title: 'СПА-стажировка в онлайн формате',
    description: 'Онлайн курс по СПА-процедурам для волос',
    price: 25000,
    currency: 'RUB',
    duration: '2 недели',
    format: 'онлайн',
    instructor: 'Мастера академии',
    category: 'СПА и уход',
    url: 'https://sointera-biz.ru/spa-online',
    startDate: null,
    modules: 4,
    certificateType: 'Сертификат академии',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/spa-online',
    isActive: true
  },
  {
    id: 'strizhka-sointera',
    title: 'Стрижка SOINTERA',
    description: 'Авторская методика стрижки от академии SOINTERA',
    price: 35000,
    currency: 'RUB',
    duration: '2 дня',
    format: 'офлайн',
    instructor: 'Елена Алексеюк',
    category: 'Стрижки',
    url: 'https://sointera-biz.ru/strizhka-sointera',
    startDate: null,
    modules: 2,
    certificateType: 'Именной сертификат',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/haircut-sointera',
    isActive: true
  },
  {
    id: 'master-group',
    title: 'Мастер-группа для руководителей',
    description: 'Группа для владельцев салонов и руководителей',
    price: 95000,
    currency: 'RUB',
    duration: '3 месяца',
    format: 'онлайн',
    instructor: 'Елена Алексеюк',
    category: 'Для руководителей',
    url: 'https://sointera-biz.ru/master-group',
    startDate: null,
    modules: 12,
    certificateType: 'Диплом',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/master-gruppa',
    isActive: true
  },
  {
    id: 'salon-planning',
    title: 'Планирование в салоне',
    description: 'Курс по эффективному планированию работы салона',
    price: 42000,
    currency: 'RUB',
    duration: '2 дня',
    format: 'онлайн',
    instructor: 'Бизнес-эксперты',
    category: 'Для руководителей',
    url: 'https://sointera-biz.ru/salon-planning',
    startDate: null,
    modules: 4,
    certificateType: 'Сертификат академии',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/planning',
    isActive: true
  },
  {
    id: 'marketing-school',
    title: 'Школа маркетинга',
    description: 'Полный курс по маркетингу для салонов красоты',
    price: 68000,
    currency: 'RUB',
    duration: '1 месяц',
    format: 'онлайн',
    instructor: 'Маркетологи академии',
    category: 'Для руководителей',
    url: 'https://sointera-biz.ru/marketing-school',
    startDate: null,
    modules: 8,
    certificateType: 'Диплом',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/school-of-marketing',
    isActive: true
  },
  {
    id: 'dna-color',
    title: 'ДНК Цвета. Курс по колористике',
    description: 'Углубленный курс по колористике и окрашиванию',
    price: 85000,
    currency: 'RUB',
    duration: '5 дней',
    format: 'офлайн',
    instructor: 'Мастера-колористы',
    category: 'Окрашивание',
    url: 'https://sointera-biz.ru/dna-color',
    startDate: null,
    modules: 5,
    certificateType: 'Диплом колориста',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/dna_online',
    isActive: true
  },
  {
    id: 'dna-person',
    title: 'ДНК ЦВЕТА - Фундаментальный курс в Творческой деревне',
    description: 'Фундаментальный курс по колористике в Творческой деревне. 3 дня интенсивного обучения с Еленой Алексеюк. Все включено: обучение, проживание, питание. Диплом государственного образца о повышении квалификации.',
    price: 60000,
    currency: 'RUB',
    duration: '3 дня',
    format: 'офлайн',
    instructor: 'Елена Алексеюк',
    category: 'Окрашивание',
    url: 'https://sointera-biz.ru/dna_person',
    startDate: '30 сентября - 2 октября',
    modules: 3,
    certificateType: 'Диплом государственного образца о повышении квалификации',
    additionalInfo: 'Проживание в Творческой деревне, все включено',
    isActive: true
  },
  {
    id: 'short-haircuts-online',
    title: 'Короткие стрижки',
    description: 'Онлайн курс по коротким стрижкам',
    price: 28000,
    currency: 'RUB',
    duration: '2 недели',
    format: 'онлайн',
    instructor: 'Мастера академии',
    category: 'Стрижки',
    url: 'https://sointera-biz.ru/short-haircuts-online',
    startDate: null,
    modules: 6,
    certificateType: 'Сертификат академии',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/short_haircuts',
    isActive: true
  },
  {
    id: 'haircuts-online',
    title: 'Курс по стрижкам',
    description: 'Полный онлайн курс по стрижкам',
    price: 45000,
    currency: 'RUB',
    duration: '1 месяц',
    format: 'онлайн',
    instructor: 'Мастера академии',
    category: 'Стрижки',
    url: 'https://sointera-biz.ru/haircuts-online',
    startDate: null,
    modules: 8,
    certificateType: 'Сертификат академии',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/haircut_course',
    isActive: true
  },
  {
    id: 'haircuts-mentor',
    title: 'Наставник по стрижкам',
    description: 'Программа подготовки преподавателей по стрижкам',
    price: 125000,
    currency: 'RUB',
    duration: '2 месяца',
    format: 'офлайн',
    instructor: 'Елена Алексеюк',
    category: 'Для преподавателей',
    url: 'https://sointera-biz.ru/haircuts-mentor',
    startDate: null,
    modules: 10,
    certificateType: 'Лицензия преподавателя',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/hair_mentor',
    isActive: true
  },
  {
    id: 'colorist-mentor',
    title: 'Наставник-колорист',
    description: 'Программа подготовки преподавателей по колористике',
    price: 135000,
    currency: 'RUB',
    duration: '2 месяца',
    format: 'офлайн',
    instructor: 'Елена Алексеюк',
    category: 'Для преподавателей',
    url: 'https://sointera-biz.ru/colorist-mentor',
    startDate: null,
    modules: 10,
    certificateType: 'Лицензия преподавателя',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/nastavnik-kolorist',
    isActive: true
  },
  {
    id: 'hairdresser-from-zero',
    title: 'Парикмахер с нуля',
    description: 'Полный курс обучения парикмахерскому искусству для начинающих',
    price: 48000,
    currency: 'RUB',
    duration: '3 месяца',
    format: 'офлайн',
    instructor: 'Мастера академии',
    category: 'Базовое обучение',
    url: 'https://sointera-biz.ru/hairdresser-from-zero',
    startDate: null,
    modules: 12,
    certificateType: 'Диплом парикмахера',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/parikmakher-s-nulya',
    isActive: true
  },
  {
    id: 'korean-haircuts',
    title: 'Корейские стрижки',
    description: 'Техники корейских стрижек и укладок',
    price: 38000,
    currency: 'RUB',
    duration: '2 дня',
    format: 'офлайн',
    instructor: 'Приглашенные мастера',
    category: 'Стрижки',
    url: 'https://sointera-biz.ru/korean-haircuts',
    startDate: null,
    modules: 2,
    certificateType: 'Сертификат академии',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/koreyskiye-strizhki',
    isActive: true
  },
  {
    id: 'unruly-hair',
    title: 'Факультет по неуправляемым волосам',
    description: 'Специализированный курс по работе с проблемными волосами',
    price: 78000,
    currency: 'RUB',
    duration: '1 месяц',
    format: 'офлайн',
    instructor: 'Эксперты академии',
    category: 'Факультеты',
    url: 'https://sointera-biz.ru/unruly-hair',
    startDate: null,
    modules: 8,
    certificateType: 'Диплом факультета',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/fakultat-po-neupravlyayemym-volosam',
    isActive: true
  },
  {
    id: 'blonde-faculty',
    title: 'Факультет по работе с блондинками',
    description: 'Специализированный курс по блондированию и уходу',
    price: 92000,
    currency: 'RUB',
    duration: '1 месяц',
    format: 'офлайн',
    instructor: 'Эксперты-колористы',
    category: 'Факультеты',
    url: 'https://sointera-biz.ru/blonde-faculty',
    startDate: null,
    modules: 8,
    certificateType: 'Диплом факультета',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/fakultet-blond',
    isActive: true
  },
  {
    id: 'teacher-license',
    title: 'Лицензия преподавателя',
    description: 'Программа получения лицензии преподавателя академии',
    price: 145000,
    currency: 'RUB',
    duration: '3 месяца',
    format: 'офлайн',
    instructor: 'Елена Алексеюк',
    category: 'Для преподавателей',
    url: 'https://sointera-biz.ru/teacher-license',
    startDate: null,
    modules: 12,
    certificateType: 'Лицензия преподавателя SOINTERA',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/licenziya-prepodavatelya',
    isActive: true
  },
  {
    id: 'federal-trainer-program',
    title: 'Федеральная программа подготовки тренеров',
    description: 'Государственная программа подготовки тренеров для бьюти-индустрии',
    price: 165000,
    currency: 'RUB',
    duration: '6 месяцев',
    format: 'офлайн',
    instructor: 'Елена Алексеюк и эксперты',
    category: 'Для преподавателей',
    url: 'https://sointera-biz.ru/federal-trainer-program',
    startDate: null,
    modules: 24,
    certificateType: 'Государственный диплом',
    additionalInfo: 'Альтернативный URL: https://sointera-biz.ru/federalnaya-programma-podgotovki',
    isActive: true
  }
];

try {
  console.log('🔄 Создание новой базы данных курсов...\n');

  // Удаляем старую базу если существует
  const db = new Database("courses.db", { create: true });

  // Создаем таблицу Course
  db.run(`
    CREATE TABLE IF NOT EXISTS Course (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price INTEGER,
      currency TEXT DEFAULT 'RUB',
      duration TEXT,
      format TEXT NOT NULL,
      instructor TEXT NOT NULL,
      category TEXT NOT NULL,
      url TEXT NOT NULL,
      startDate TEXT,
      modules INTEGER,
      certificateType TEXT,
      additionalInfo TEXT,
      isActive BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Таблица Course создана\n');

  // Подготавливаем запрос для вставки
  const insertQuery = db.prepare(`
    INSERT INTO Course (
      id, title, description, price, currency, duration, format,
      instructor, category, url, startDate, modules, certificateType,
      additionalInfo, isActive
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  // Вставляем все курсы
  console.log('📝 Добавление курсов в базу данных...\n');

  for (const course of courses) {
    insertQuery.run(
      course.id,
      course.title,
      course.description,
      course.price,
      course.currency,
      course.duration,
      course.format,
      course.instructor,
      course.category,
      course.url,
      course.startDate,
      course.modules,
      course.certificateType,
      course.additionalInfo,
      course.isActive ? 1 : 0
    );

    console.log(`✅ Добавлен: ${course.title}`);
    console.log(`   URL: ${course.url}`);
    console.log(`   Цена: ${course.price ? course.price.toLocaleString('ru-RU') + ' ₽' : 'не указана'}`);
    console.log('');
  }

  // Показываем статистику
  const stats = db.query("SELECT COUNT(*) as total, COUNT(DISTINCT category) as categories FROM Course").get();
  console.log(`\n📊 Статистика:`);
  console.log(`   Всего курсов: ${stats.total}`);
  console.log(`   Категорий: ${stats.categories}`);

  // Показываем категории
  const categories = db.query("SELECT DISTINCT category FROM Course ORDER BY category").all();
  console.log('\n📂 Категории:');
  categories.forEach((cat: any) => {
    const count = db.query("SELECT COUNT(*) as count FROM Course WHERE category = ?").get(cat.category);
    console.log(`   - ${cat.category}: ${count.count} курсов`);
  });

  db.close();
  console.log('\n✅ База данных успешно создана!');

} catch (error) {
  console.error('❌ Ошибка:', error);
}
