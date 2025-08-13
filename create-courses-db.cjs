const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Создаем базу данных курсов
const db = new sqlite3.Database('./courses.db');

db.serialize(() => {
  // Создаем таблицу Course
  db.run(`
    CREATE TABLE IF NOT EXISTS Course (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price REAL,
      currency TEXT DEFAULT 'RUB',
      duration TEXT,
      format TEXT NOT NULL,
      instructor TEXT NOT NULL,
      category TEXT NOT NULL,
      url TEXT UNIQUE NOT NULL,
      startDate TEXT,
      modules INTEGER,
      certificateType TEXT,
      additionalInfo TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Данные курсов
  const courses = [
    // Офлайн курсы
    {
      id: '1',
      title: 'Консультация на миллион',
      description: 'Персональная консультация с Еленой Алексеюк по развитию вашего бизнеса в beauty-индустрии',
      price: 500,
      duration: '1 час',
      format: 'офлайн',
      instructor: 'Елена Алексеюк',
      category: 'Консультации',
      url: 'https://sointera-biz.ru/million-consultation',
      startDate: '2025-08-06',
      certificateType: 'Персональные рекомендации'
    },
    {
      id: '2',
      title: 'ДНК персонального стиля',
      description: 'Уникальная методика создания персонального стиля для ваших клиентов',
      price: 75000,
      duration: '3 дня',
      format: 'офлайн',
      instructor: 'Елена Алексеюк',
      category: 'Выездные программы',
      url: 'https://sointera-biz.ru/dna-style',
      startDate: '2025-09-30'
    },
    {
      id: '3',
      title: 'Короткие стрижки 2.0',
      description: 'Интенсивный курс по современным техникам коротких стрижек',
      price: 45000,
      duration: '3 дня',
      format: 'офлайн',
      instructor: 'Елена Алексеюк',
      category: 'Выездные программы',
      url: 'https://sointera-biz.ru/short-haircuts-2',
      startDate: '2025-08-19'
    },
    {
      id: '4',
      title: 'Очный курс по стрижкам: фундамент',
      description: 'Базовый курс для начинающих мастеров. Все основные техники стрижек',
      price: 60000,
      duration: '1 месяц',
      format: 'офлайн',
      instructor: 'Елена Алексеюк',
      category: 'Выездные программы',
      url: 'https://sointera-biz.ru/haircuts-foundation',
      modules: 8,
      certificateType: 'Сертификат SOINTERA'
    },
    {
      id: '5',
      title: 'Стрижки 2.0',
      description: 'Продвинутый курс по современным техникам стрижек',
      price: 55000,
      duration: '3 дня',
      format: 'офлайн',
      instructor: 'Елена Алексеюк',
      category: 'Выездные программы',
      url: 'https://sointera-biz.ru/haircuts-2',
      startDate: '2025-10-21'
    },

    // Онлайн курсы
    {
      id: '6',
      title: 'СПА-стажировка в онлайн формате',
      description: 'Полный курс SPA-процедур для волос. Изучите все техники восстановления и ухода',
      price: 15000,
      duration: '2 недели',
      format: 'онлайн',
      instructor: 'кураторы',
      category: 'Бестселлеры',
      url: 'https://sointera-biz.ru/spa-online',
      modules: 6,
      certificateType: 'Сертификат SPA-специалиста'
    },
    {
      id: '7',
      title: 'Стрижка SOINTERA',
      description: 'Авторская методика стрижки от Елены Алексеюк. Доступ сразу после оплаты',
      price: 3900,
      duration: 'Доступ на 3 месяца',
      format: 'онлайн',
      instructor: 'Елена Алексеюк',
      category: 'Бестселлеры',
      url: 'https://sointera-biz.ru/strizhka-sointera',
      certificateType: 'Сертификат о прохождении'
    },
    {
      id: '8',
      title: 'Мастер-группа для руководителей',
      description: 'Эксклюзивная программа для владельцев салонов и руководителей',
      price: 120000,
      duration: '3 месяца',
      format: 'онлайн',
      instructor: 'Елена Алексеюк',
      category: 'Для руководителей',
      url: 'https://sointera-biz.ru/master-group',
      modules: 12
    },
    {
      id: '9',
      title: 'Планирование в салоне',
      description: 'Как организовать эффективную работу салона красоты',
      price: 25000,
      duration: '1 месяц',
      format: 'онлайн',
      instructor: 'кураторы',
      category: 'Для руководителей',
      url: 'https://sointera-biz.ru/salon-planning'
    },
    {
      id: '10',
      title: 'Школа маркетинга',
      description: 'Полный курс по продвижению салона красоты',
      price: 35000,
      duration: '6 недель',
      format: 'онлайн',
      instructor: 'кураторы',
      category: 'Для руководителей',
      url: 'https://sointera-biz.ru/marketing-school',
      modules: 8
    },
    {
      id: '11',
      title: 'ДНК Цвета. Курс по колористике',
      description: 'Глубокое погружение в колористику. От базы до сложных техник окрашивания',
      price: 30000,
      duration: '2 месяца',
      format: 'онлайн',
      instructor: 'кураторы',
      category: 'Онлайн программы',
      url: 'https://sointera-biz.ru/dna-color',
      modules: 10,
      certificateType: 'Сертификат колориста'
    },
    {
      id: '12',
      title: 'Короткие стрижки',
      description: 'Онлайн-курс по техникам коротких стрижек',
      price: 18000,
      duration: '1 месяц',
      format: 'онлайн',
      instructor: 'кураторы',
      category: 'Онлайн программы',
      url: 'https://sointera-biz.ru/short-haircuts-online'
    },
    {
      id: '13',
      title: 'Курс по стрижкам',
      description: 'Базовый онлайн-курс по всем видам стрижек',
      price: 22000,
      duration: '1.5 месяца',
      format: 'онлайн',
      instructor: 'кураторы',
      category: 'Онлайн программы',
      url: 'https://sointera-biz.ru/haircuts-online',
      modules: 8
    },
    {
      id: '14',
      title: 'Наставник по стрижкам',
      description: 'Курс для тех, кто хочет обучать других мастеров',
      price: 65000,
      duration: '3 месяца',
      format: 'онлайн',
      instructor: 'кураторы',
      category: 'Онлайн программы',
      url: 'https://sointera-biz.ru/haircuts-mentor',
      certificateType: 'Сертификат наставника'
    },
    {
      id: '15',
      title: 'Наставник-колорист',
      description: 'Программа подготовки преподавателей по колористике',
      price: 70000,
      duration: '3 месяца',
      format: 'онлайн',
      instructor: 'кураторы',
      category: 'Онлайн программы',
      url: 'https://sointera-biz.ru/colorist-mentor',
      certificateType: 'Сертификат наставника-колориста'
    },
    {
      id: '16',
      title: 'Парикмахер с нуля',
      description: 'Полная программа обучения для новичков. От базы до первых клиентов',
      price: 48000,
      duration: '3 месяца',
      format: 'онлайн',
      instructor: 'кураторы',
      category: 'Онлайн программы',
      url: 'https://sointera-biz.ru/hairdresser-from-zero',
      modules: 15,
      certificateType: 'Диплом парикмахера'
    },
    {
      id: '17',
      title: 'Корейские стрижки',
      description: 'Изучение популярных техник корейских стрижек',
      price: 28000,
      duration: '1 месяц',
      format: 'онлайн',
      instructor: 'кураторы',
      category: 'Факультеты',
      url: 'https://sointera-biz.ru/korean-haircuts'
    },
    {
      id: '18',
      title: 'Парикмахерский универ',
      description: 'Полный курс парикмахерского искусства',
      price: 85000,
      duration: '6 месяцев',
      format: 'онлайн',
      instructor: 'кураторы',
      category: 'Факультеты',
      url: 'https://sointera-biz.ru/hairdressing-university',
      modules: 24,
      certificateType: 'Диплом о профессиональной переподготовке'
    },
    {
      id: '19',
      title: 'Факультет по неуправляемым волосам',
      description: 'Специализированный курс по работе со сложными типами волос',
      price: 32000,
      duration: '1.5 месяца',
      format: 'онлайн',
      instructor: 'кураторы',
      category: 'Факультеты',
      url: 'https://sointera-biz.ru/unruly-hair'
    },
    {
      id: '20',
      title: 'Факультет по работе с блондинками',
      description: 'Все о блонде: от осветления до тонирования',
      price: 8950,
      duration: '3 недели',
      format: 'онлайн',
      instructor: 'кураторы',
      category: 'Факультеты',
      url: 'https://sointera-biz.ru/blonde-faculty',
      certificateType: 'Сертификат специалиста по блонду'
    },

    // Гибридные курсы
    {
      id: '21',
      title: 'Лицензия преподавателя',
      description: 'Официальная лицензия на преподавательскую деятельность',
      price: 150000,
      duration: '6 месяцев',
      format: 'гибрид',
      instructor: 'Елена Алексеюк',
      category: 'Стать тренером',
      url: 'https://sointera-biz.ru/teacher-license',
      certificateType: 'Лицензия преподавателя'
    },
    {
      id: '22',
      title: 'Федеральная программа подготовки тренеров',
      description: 'Комплексная программа для будущих тренеров индустрии красоты',
      price: 180000,
      duration: '1 год',
      format: 'гибрид',
      instructor: 'Елена Алексеюк',
      category: 'Стать тренером',
      url: 'https://sointera-biz.ru/federal-trainer-program',
      certificateType: 'Диплом федерального образца'
    }
  ];

  // Вставляем данные
  const stmt = db.prepare(`
    INSERT INTO Course (
      id, title, description, price, currency, duration, format,
      instructor, category, url, startDate, modules, certificateType,
      additionalInfo, isActive
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  courses.forEach(course => {
    stmt.run(
      course.id,
      course.title,
      course.description || null,
      course.price || null,
      course.currency || 'RUB',
      course.duration || null,
      course.format,
      course.instructor,
      course.category,
      course.url,
      course.startDate || null,
      course.modules || null,
      course.certificateType || null,
      course.additionalInfo || null,
      1
    );
  });

  stmt.finalize();

  console.log('✅ База данных курсов создана успешно!');
  console.log(`📚 Добавлено ${courses.length} курсов`);
});

db.close();
