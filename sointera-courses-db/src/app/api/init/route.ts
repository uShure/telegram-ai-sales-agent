import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const coursesData = [
  // Бестселлеры
  {
    title: "Стрижка SOINTERA",
    description: "Стрижка-конструктор, которая дает решение для 4 разных задач: базовая стрижка, геометрическая стрижка, креативная стрижка и коммерческие техники",
    price: 3900,
    format: "онлайн",
    instructor: "Елена Алексеюк",
    category: "Бестселлеры",
    url: "https://sointera-biz.ru/haircut-sointera",
    modules: 3,
    duration: "3 урока",
    certificateType: "Сертификат о прохождении курса",
    additionalInfo: "3 универсальных техники стрижки за 3 урока по цене 1"
  },
  {
    title: "СПА-стажировка в онлайн формате",
    description: "Разберем все СПА сервисы, которые вы сможете применить в своей работе. Освоите массаж головы, SPA процедуры и уходы за волосами",
    price: 15000,
    format: "онлайн",
    instructor: "кураторы",
    category: "Бестселлеры",
    url: "https://sointera-biz.ru/spa-online",
    modules: 6,
    duration: "6 модулей",
    certificateType: "Сертификат СПА-мастера",
    additionalInfo: "Включает ботокс для волос, кератин, нанопластику и другие процедуры"
  },
  {
    title: "Консультация на миллион",
    description: "День по стрижкам с командой SOINTERA. 12 стрижек за день с подробным разбором",
    price: 500,
    format: "офлайн",
    instructor: "Елена Алексеюк",
    category: "Бестселлеры",
    url: "https://sointera-biz.ru/million-consultation",
    duration: "1 час",
    startDate: "6 августа",
    certificateType: "Участие в мастер-классе",
    additionalInfo: "Консультация по стрижкам с Еленой Алексеюк"
  },
  // Выездные программы
  {
    title: "Очный курс по стрижкам: фундамент",
    description: "Пройди весь фундамент по стрижкам с постановкой руки за 3 дня в Творческой деревне с Еленой Алексеюк",
    price: 60000,
    format: "офлайн",
    instructor: "Елена Алексеюк",
    category: "Выездные программы",
    url: "https://sointera-biz.ru/stajirovka",
    duration: "3 дня",
    startDate: "13-14-15 декабря",
    certificateType: "Сертификат о прохождении стажировки",
    additionalInfo: "Место проведения: Творческая деревня, Коломна"
  },
  {
    title: "Стрижки 2.0",
    description: "Продвинутый курс по стрижкам в Творческой деревне",
    format: "офлайн",
    instructor: "Елена Алексеюк",
    category: "Выездные программы",
    url: "https://sointera-biz.ru/haircuts-2-0",
    certificateType: "Сертификат о прохождении курса"
  },
  {
    title: "Короткие стрижки 2.0",
    description: "Специализированный курс по коротким стрижкам",
    format: "офлайн",
    instructor: "Елена Алексеюк",
    category: "Выездные программы",
    url: "https://sointera-biz.ru/short_haircuts2",
    certificateType: "Сертификат о прохождении курса"
  },
  {
    title: "ДНК персонального стиля",
    description: "Курс по созданию персонального стиля в стрижках",
    format: "офлайн",
    instructor: "Елена Алексеюк",
    category: "Выездные программы",
    url: "https://sointera-biz.ru/dna_person",
    certificateType: "Сертификат о прохождении курса"
  },
  // Онлайн программы
  {
    title: "ДНК Цвета. Курс по колористике",
    description: "Наведи порядок в своих знаниях за 3 месяца под руководством наставника-колориста. 52 урока по колористике с полным разбором всех техник",
    price: 30000,
    format: "онлайн",
    instructor: "кураторы",
    category: "Онлайн программы",
    url: "https://sointera-biz.ru/dna_online",
    startDate: "1 декабря",
    duration: "3 месяца",
    modules: 52,
    certificateType: "Сертификат колориста SOINTERA",
    additionalInfo: "Возможна рассрочка на 6 месяцев"
  },
  {
    title: "Наставник-колорист",
    description: "Программа подготовки наставников по колористике",
    format: "онлайн",
    instructor: "кураторы",
    category: "Онлайн программы",
    url: "https://sointera-biz.ru/nastavnik-kolorist",
    startDate: "каждый месяц",
    certificateType: "Сертификат наставника-колориста"
  },
  {
    title: "Курс по стрижкам",
    description: "Базовый онлайн курс по стрижкам",
    format: "онлайн",
    instructor: "кураторы",
    category: "Онлайн программы",
    url: "https://sointera-biz.ru/haircut_course",
    startDate: "каждый месяц",
    certificateType: "Сертификат о прохождении курса"
  },
  {
    title: "Наставник по стрижкам",
    description: "Программа подготовки наставников по стрижкам",
    format: "онлайн",
    instructor: "кураторы",
    category: "Онлайн программы",
    url: "https://sointera-biz.ru/hair_mentor",
    startDate: "каждый месяц",
    certificateType: "Сертификат наставника"
  },
  {
    title: "Парикмахер с нуля",
    description: "Полный курс обучения парикмахерскому искусству с нуля. 52 урока с полным разбором всех техник стрижек и окрашивания",
    price: 48000,
    format: "онлайн",
    instructor: "кураторы",
    category: "Онлайн программы",
    url: "https://sointera-biz.ru/parikmakher-s-nulya",
    startDate: "4 декабря",
    duration: "3 месяца",
    modules: 52,
    certificateType: "Диплом парикмахера с лицензией",
    additionalInfo: "Разные тарифы от 48,000 до 165,000 руб в зависимости от уровня поддержки"
  },
  {
    title: "Короткие стрижки",
    description: "Специализированный онлайн курс по коротким стрижкам",
    format: "онлайн",
    instructor: "кураторы",
    category: "Онлайн программы",
    url: "https://sointera-biz.ru/short_haircuts",
    startDate: "каждый месяц",
    certificateType: "Сертификат о прохождении курса"
  },
  // Стать тренером
  {
    title: "Федеральная программа подготовки тренеров",
    description: "Программа подготовки тренеров по методике SOINTERA в своем городе",
    format: "гибрид",
    instructor: "Елена Алексеюк",
    category: "Стать тренером",
    url: "https://sointera-biz.ru/federalnaya-programma-podgotovki",
    certificateType: "Лицензия тренера SOINTERA"
  },
  {
    title: "Лицензия преподавателя",
    description: "Получение лицензии преподавателя по методике SOINTERA",
    format: "гибрид",
    instructor: "Елена Алексеюк",
    category: "Стать тренером",
    url: "https://sointera-biz.ru/licenziya-prepodavatelya",
    certificateType: "Лицензия преподавателя"
  },
  // Для руководителей
  {
    title: "Мастер-группа для руководителей",
    description: "Программа развития для руководителей салонов красоты",
    format: "онлайн",
    instructor: "Елена Алексеюк",
    category: "Для руководителей",
    url: "https://sointera-biz.ru/master-gruppa",
    certificateType: "Сертификат участника мастер-группы"
  },
  {
    title: "Школа маркетинга",
    description: "Маркетинг и продвижение для салонов красоты",
    format: "онлайн",
    instructor: "кураторы",
    category: "Для руководителей",
    url: "https://sointera-biz.ru/school-of-marketing",
    certificateType: "Сертификат о прохождении курса"
  },
  {
    title: "Планирование в салоне",
    description: "Курс по эффективному планированию работы салона",
    format: "онлайн",
    instructor: "кураторы",
    category: "Для руководителей",
    url: "https://sointera-biz.ru/planning",
    certificateType: "Сертификат о прохождении курса"
  },
  // Факультеты
  {
    title: "Парикмахерский универ",
    description: "Полный факультет парикмахерского искусства",
    format: "онлайн",
    instructor: "кураторы",
    category: "Факультеты",
    url: "https://sointera-biz.ru/parikmakherskiy-univer",
    certificateType: "Диплом о прохождении факультета",
    additionalInfo: "Доступ сразу после покупки"
  },
  {
    title: "Факультет по неуправляемым волосам",
    description: "Специализированный факультет по работе с проблемными волосами",
    format: "онлайн",
    instructor: "кураторы",
    category: "Факультеты",
    url: "https://sointera-biz.ru/fakultat-po-neupravlyayemym-volosam",
    certificateType: "Сертификат специалиста",
    additionalInfo: "Доступ сразу после покупки"
  },
  {
    title: "Корейские стрижки",
    description: "Факультет по корейским техникам стрижек",
    format: "онлайн",
    instructor: "кураторы",
    category: "Факультеты",
    url: "https://sointera-biz.ru/koreyskiye-strizhki",
    certificateType: "Сертификат о прохождении курса",
    additionalInfo: "Доступ сразу после покупки"
  },
  {
    title: "Факультет по работе с блондинками",
    description: "Стратегия работы с разными видами блондов. Техники: airtouch, балаяж, шатуш, мелирование",
    price: 8950,
    format: "онлайн",
    instructor: "кураторы",
    category: "Факультеты",
    url: "https://sointera-biz.ru/fakultet-blond",
    duration: "3 месяца",
    modules: 7,
    certificateType: "Сертификат колориста-специалиста по блонду",
    additionalInfo: "Доступ сразу после покупки. Записи уроков"
  }
]

export async function POST() {
  try {
    // Удаляем все существующие курсы
    await prisma.course.deleteMany()

    // Создаем новые курсы
    const courses = await Promise.all(
      coursesData.map(course =>
        prisma.course.create({ data: course })
      )
    )

    return NextResponse.json({
      message: 'Database initialized successfully',
      count: courses.length
    })
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json({
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
