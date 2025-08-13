#!/usr/bin/env bun

const { Database } = require('bun:sqlite');
const fs = require('fs');
const path = require('path');

console.log('🚀 Создание полной базы данных курсов SOINTERA (21 курс)...\n');

// Пути к базам
const COURSES_DB_PATH = './courses.db';
const ADMIN_DB_PATH = '../telegram-admin-bot/courses.db';

// Удаляем старую базу
if (fs.existsSync(COURSES_DB_PATH)) {
    fs.unlinkSync(COURSES_DB_PATH);
    console.log('✅ Старая база данных удалена');
}

// Создаем новую базу
const db = new Database(COURSES_DB_PATH);

// Создаем таблицу
db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER,
        type TEXT CHECK(type IN ('online', 'offline')),
        duration TEXT,
        url TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(type);
    CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(active);
    CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);
`);

console.log('✅ Таблица courses создана\n');

// ВСЕ 21 КУРС SOINTERA
const courses = [
    // ОНЛАЙН КУРСЫ (14 штук)
    {
        name: 'Консультация на миллион',
        url: 'https://sointera-biz.ru/million-consultation',
        type: 'online',
        price: 500,
        duration: '1 час',
        description: 'Индивидуальная консультация по развитию в beauty-сфере'
    },
    {
        name: 'СПА-стажировка в онлайн формате',
        url: 'https://sointera-biz.ru/spa-online',
        type: 'online',
        price: 15000,
        duration: '2 недели',
        description: 'Онлайн обучение СПА-процедурам и уходам'
    },
    {
        name: 'Стрижка SOINTERA',
        url: 'https://sointera-biz.ru/haircut-sointera',
        type: 'online',
        price: 3900,
        duration: '4 недели',
        description: 'Авторская методика стрижек SOINTERA'
    },
    {
        name: 'Мастер-группа для руководителей',
        url: 'https://sointera-biz.ru/master-gruppa',
        type: 'online',
        price: 150000,
        duration: '3 месяца',
        description: 'Программа для владельцев и руководителей салонов'
    },
    {
        name: 'Школа маркетинга',
        url: 'https://sointera-biz.ru/school-of-marketing',
        type: 'online',
        price: 35000,
        duration: '2 месяца',
        description: 'Маркетинг и продвижение в beauty-сфере'
    },
    {
        name: 'ДНК Цвета. Курс по колористике',
        url: 'https://sointera-biz.ru/dna_online',
        type: 'online',
        price: 39000,
        duration: '3 месяца',
        description: 'Фундаментальная колористика онлайн с наставником'
    },
    {
        name: 'Короткие стрижки',
        url: 'https://sointera-biz.ru/short_haircuts',
        type: 'online',
        price: 35000,
        duration: '6 недель',
        description: 'Онлайн-курс по коротким стрижкам'
    },
    {
        name: 'Курс по стрижкам',
        url: 'https://sointera-biz.ru/haircut_course',
        type: 'online',
        price: 39000,
        duration: '2 месяца',
        description: 'Полный онлайн-курс по стрижкам с поддержкой наставника'
    },
    {
        name: 'Наставник по стрижкам',
        url: 'https://sointera-biz.ru/hair_mentor',
        type: 'online',
        price: 65000,
        duration: '3 месяца',
        description: 'Программа подготовки преподавателей по стрижкам'
    },
    {
        name: 'Наставник-колорист',
        url: 'https://sointera-biz.ru/nastavnik-kolorist',
        type: 'online',
        price: 65000,
        duration: '3 месяца',
        description: 'Программа подготовки преподавателей колористики'
    },
    {
        name: 'Парикмахер с нуля',
        url: 'https://sointera-biz.ru/parikmakher-s-nulya',
        type: 'online',
        price: 135000,
        duration: '6 месяцев',
        description: 'Полное обучение профессии парикмахера с нуля'
    },
    {
        name: 'Корейские стрижки',
        url: 'https://sointera-biz.ru/koreyskiye-strizhki',
        type: 'online',
        price: 8950,
        duration: '3 недели',
        description: 'Техники и секреты корейских мастеров'
    },
    {
        name: 'Факультет по неуправляемым волосам',
        url: 'https://sointera-biz.ru/fakultat-po-neupravlyayemym-volosam',
        type: 'online',
        price: 8950,
        duration: '4 недели',
        description: 'Специальные техники работы со сложными волосами'
    },
    {
        name: 'Факультет по работе с блондинками',
        url: 'https://sointera-biz.ru/fakultet-blond',
        type: 'online',
        price: 8950,
        duration: '4 недели',
        description: 'Все о блонде: техники осветления, тонирования, уход'
    },

    // ОФЛАЙН КУРСЫ в Творческой деревне (7 штук)
    {
        name: 'Короткие стрижки 2.0',
        url: 'https://sointera-biz.ru/short_haircuts2',
        type: 'offline',
        price: 70000,
        duration: '3 дня',
        description: 'Интенсив по коротким стрижкам в Творческой деревне'
    },
    {
        name: 'Очный курс по стрижкам: фундамент',
        url: 'https://sointera-biz.ru/stajirovka',
        type: 'offline',
        price: 60000,
        duration: '3 дня',
        description: 'Базовый курс по стрижкам в Творческой деревне. Основы и фундаментальные техники'
    },
    {
        name: 'Стрижки 2.0',
        url: 'https://sointera-biz.ru/haircuts-2-0',
        type: 'offline',
        price: 60000,
        duration: '3 дня',
        description: 'Продвинутый курс по современным техникам стрижек в Творческой деревне'
    },
    {
        name: 'Планирование в салоне',
        url: 'https://sointera-biz.ru/planning',
        type: 'offline',
        price: 95000,
        duration: '3 дня',
        description: 'Курс по управлению салоном красоты. Бизнес-процессы, маркетинг, управление персоналом'
    },
    {
        name: 'Лицензия преподавателя',
        url: 'https://sointera-biz.ru/licenziya-prepodavatelya',
        type: 'offline',
        price: 130000,
        duration: '5 дней',
        description: 'Получение лицензии преподавателя с правом обучения'
    },
    {
        name: 'Федеральная программа подготовки тренеров',
        url: 'https://sointera-biz.ru/federalnaya-programma-podgotovki',
        type: 'offline',
        price: 260000,
        duration: '7 дней',
        description: 'Федеральная программа подготовки тренеров высшей категории'
    },
    {
        name: 'ДНК ЦВЕТА - Фундаментальный курс по колористике в Творческой деревне',
        url: 'https://sointera-biz.ru/dna_person#rec981721501',
        type: 'offline',
        price: 60000,
        duration: '3 дня',
        description: 'Революционная методика окрашивания. Фундаментальная колористика в Творческой деревне'
    }
];

// Вставляем курсы
const stmt = db.prepare(`
    INSERT INTO courses (name, description, price, type, duration, url, active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
`);

let addedCount = 0;
let errors = 0;

courses.forEach(course => {
    try {
        stmt.run(
            course.name,
            course.description,
            course.price,
            course.type,
            course.duration,
            course.url
        );
        console.log(`✅ Добавлен: ${course.name} (${course.type}, ${course.price.toLocaleString('ru-RU')}₽)`);
        addedCount++;
    } catch (error) {
        console.error(`❌ Ошибка при добавлении курса ${course.name}:`, error.message);
        errors++;
    }
});

console.log('\n' + '='.repeat(60));
console.log(`✅ Успешно добавлено курсов: ${addedCount} из ${courses.length}`);
if (errors > 0) {
    console.log(`❌ Ошибок: ${errors}`);
}

// Статистика
const stats = db.prepare(`
    SELECT
        type,
        COUNT(*) as count,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price
    FROM courses
    WHERE active = 1
    GROUP BY type
`).all();

console.log('\n📊 Статистика курсов:');
stats.forEach(stat => {
    const typeName = stat.type === 'offline' ? '🏡 Офлайн (Творческая деревня)' : '💻 Онлайн';
    console.log(`${typeName}:`);
    console.log(`  Количество: ${stat.count} курсов`);
    console.log(`  Цены: от ${stat.min_price.toLocaleString('ru-RU')}₽ до ${stat.max_price.toLocaleString('ru-RU')}₽`);
    console.log(`  Средняя цена: ${Math.round(stat.avg_price).toLocaleString('ru-RU')}₽`);
});

// Общая статистика
const total = db.prepare('SELECT COUNT(*) as count FROM courses WHERE active = 1').get();
console.log(`\n📈 Всего активных курсов: ${total.count}`);

// Копируем базу в админ-бота
if (fs.existsSync(path.dirname(ADMIN_DB_PATH))) {
    if (fs.existsSync(ADMIN_DB_PATH)) {
        fs.unlinkSync(ADMIN_DB_PATH);
    }
    fs.copyFileSync(COURSES_DB_PATH, ADMIN_DB_PATH);
    console.log('\n✅ База скопирована в telegram-admin-bot');
}

db.close();
console.log('\n🎉 База данных с 21 курсом SOINTERA успешно создана!');
