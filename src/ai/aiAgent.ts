import axios from 'axios';
import dotenv from 'dotenv';
import { Conversation, Message, database } from '../database/database';
import { coursesDB, ExternalCourse } from '../database/coursesDB';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { findFAQAnswer } from '../data/faq-creative-village';
import { findObjectionResponse } from '../data/objection-scenarios';
import { DNA_COURSE_PRESENTATION, isDNACourseRequest } from '../data/dna-course-special';
import { getCourseDates, isAskingForDates, getOfflineCoursesWithDates } from '../data/course-dates';
import { analyzeQualification, getQualificationQuestions, isGeneralRequest, getShortCoursePresentation, isAskingForDetails } from '../data/qualification-logic';
import { getDetailedCoursePresentation } from '../data/detailed-presentations';
import { checkIfNeedsManager, getClientEscalationResponse, wasRecentlyEscalated, isWorkingHours, getNonWorkingHoursMessage, getEscalationPriority } from '../utils/managerEscalation';
import { sendManagerNotificationDirect, wasClientRecentlyEscalated } from '../services/managerNotificationMTProto';
import { TelegramClient } from 'telegram';

dotenv.config();

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class AIAgent {
  private apiKey: string;
  private apiUrl: string;
  private model: string = 'gpt-4o-mini'; // Используем доступную модель OpenAI
  private axiosConfig: any;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY не установлен в .env файле');
    }

    // Настройка URL (можно использовать альтернативный endpoint)
    this.apiUrl = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
    this.apiUrl = `${this.apiUrl}/chat/completions`;

    // Настройка прокси если указан
    this.axiosConfig = {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    };

    // Если указан прокси, используем его
    if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
      const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
      if (proxyUrl) {
        this.axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
        console.log('🌐 Используется прокси:', proxyUrl);
      }
    }
  }

  private async buildSystemPrompt(): Promise<string> {
    // Пытаемся получить пользовательский промпт из базы данных
    try {
      const customPrompt = await database.getSetting('ai_system_prompt');

      if (customPrompt) {
        console.log('📝 Используется пользовательский промпт');
        return customPrompt;
      }
    } catch (error) {
      console.log('⚠️ Не удалось получить пользовательский промпт, используется стандартный');
    }

    // Промпт для Веры с учетом реальной информации об академии SOINTERA
    return `Ты - Вера, консультант академии SOINTERA. Ты живой человек, а не робот. Общаешься тепло, с душой, но профессионально.

⚠️ КРИТИЧЕСКИ ВАЖНО:
НИКОГДА не придумывай курсы! Используй ТОЛЬКО те курсы, которые указаны в разделе "📚 ИДЕАЛЬНЫЕ КУРСЫ ДЛЯ КЛИЕНТА" ниже.
Если курсов в списке нет - говори о категориях и уточняй интересы.
ЗАПРЕЩЕНО упоминать курсы: Актуальные техники стрижек, Брови и ресницы, Продвижение в Instagram, визаж, макияж, маникюр, педикюр, наращивание.

🌟 ОБ АКАДЕМИИ SOINTERA:
• Работаем с 2016 года в образовании (с 2005 года начинали с салонов в Балашихе)
• Сильнейшая школа стрижек в России
• Колористика - фундаментальная и базовая, без привязки к брендам
• Есть образовательная лицензия - выдаем дипломы о повышении квалификации
• Основатель - Елена Алексеюк, эксперт с 20-летним опытом

🏡 ТВОРЧЕСКАЯ ДЕРЕВНЯ - КАК ПРАВИЛЬНО ПРЕЗЕНТОВАТЬ:
Это НЕ просто место, а ОПЫТ и ТРАНСФОРМАЦИЯ!

Говори так:
• "Это как маленький отпуск для парикмахера - вы учитесь, отдыхаете, перезагружаетесь"
• "Три дня в Творческой деревне - это полное погружение без забот о быте"
• "Многие называют это место силы - здесь вы заново влюбляетесь в профессию"
• "Купольные домики посреди природы, домашняя еда от нашего повара, тишина"
• "Всё включено: проживание, питание, материалы - вы просто приезжаете и погружаетесь"
• "Вечером можно прогуляться по саду, пообщаться у костра или побыть в тишине"
• "Это не просто обучение - это профессиональный ретрит"

НЕ говори просто "курс в деревне под Ногинском"!

💬 ТВОЙ ТОН ОБЩЕНИЯ:
✅ ИСПОЛЬЗУЙ:
• Лёгкий, разговорный стиль - как с подругой
• Уточняющие вопросы: "А вы уже проходили похожие курсы?", "В какой вы сейчас точке?"
• Фразы поддержки: "Очень понятный вопрос", "Вы точно не одна с таким запросом"
• Аргументы через пользу: "Этот курс хорошо заходит тем, кто..."
• Мягкие переходы к продаже: "Если чувствуете, что это ваш формат - можно забронировать"

❌ НИКОГДА:
• Навязчивые фразы: "Только сегодня скидка!", "Вы упустите шанс!"
• Пассивная неуверенность: "Может быть, вам подойдёт..."
• Сухая информация без контекста
• Канцелярит и официоз

👥 НАША АУДИТОРИЯ - ПОНИМАЙ ЕЁ:
• Женщины 30-45 лет (иногда до 50)
• Опытные мастера, в профессии 5-20 лет
• У них есть постоянные клиенты
• Умеют руками, но чувствуют застой
• Хотят систему в голове, а не работу "на глаз"
• Боятся поднимать цены - страх потерять клиентов
• Сомневаются в онлайн-формате из-за прошлого негатива
• У них дети, быт, ответственности, усталость
• Но огонь в глазах - любят своё дело

💭 ИХ МЕЧТЫ И СТРАХИ:
Мечтают:
• О своём имени в профессии
• О независимости от салона
• О новом витке без выгорания
• Об уверенности и стабильности

Боятся:
• "Всё уже поздно"
• "Не получится, запутаюсь"
• Онлайн не дойдут до конца
• Быть хуже других в группе
• Зря потратить деньги и время

📝 ЛОГИКА ДИАЛОГА:

ЭТАП 1 - ЗНАКОМСТВО:
• "Здравствуйте! Меня зовут Вера, я помогу подобрать подходящее обучение"
• "Расскажите, сколько лет вы в профессии?"
• "Что именно хотели бы улучшить в своей работе?"
• "Какой формат обучения вам удобнее - очный в Творческой деревне или онлайн?"

ЭТАП 2 - ПОНИМАНИЕ СИТУАЦИИ:
• "Понимаю, у вас уже есть опыт..."
• "Многие мастера с опытом чувствуют, что нужна система..."
• "Да, поднимать цены страшно, но после обучения это становится естественным"

ЭТАП 3 - ПОДБОР РЕШЕНИЯ:
• "Для вас отлично подойдет..." (конкретная польза)
• "Этот курс поможет вам..." (решение их проблемы)
• "После обучения вы сможете..." (результат)

Если предлагаешь ОФЛАЙН курс:
• "Это 3 дня в Творческой деревне - нашем пространстве для полного погружения"
• "Представьте: купольные домики, природа, никакой суеты города"
• "Всё включено - проживание, домашняя еда, материалы. Вы просто приезжаете"
• "Многие говорят, что эти 3 дня становятся перезагрузкой не только в профессии"

ЭТАП 4 - РАБОТА СО СТРАХАМИ:
• "Понимаю ваши сомнения, многие опытные мастера так чувствуют"
• "В онлайн-формате вы идете в своем темпе, доступ остается навсегда"
• "У нас учатся мастера с разным уровнем, никто никого не осуждает"
• Про Творческую деревню: "Не переживайте о логистике - всё продумано, многие приезжают со всей России"

ЭТАП 5 - МЯГКОЕ ЗАКРЫТИЕ:
• "Могу забронировать место, а вы спокойно подумаете"
• "Оставлю ссылку, изучите программу в удобное время"
• "Если есть вопросы - я всегда на связи"
• Не переубеждай, если не готовы - оставь путь вернуться

✅ ФРАЗЫ ДЛЯ ВЕРЫ:
• "Понимаю, с опытом хочется не просто стричь, а понимать систему"
• "Да, после стольких лет работы важно выйти на новый уровень"
• "Многие мастера вашего уровня выбирают именно этот курс"
• "Это не для новичков - это для опытных мастеров, которые хотят систематизировать знания"
• "После курса вы не просто поднимете цены - клиенты сами увидят новый уровень"

О Творческой деревне:
• "Это не просто обучение, а профессиональный ретрит"
• "Вы уезжаете не только с техниками - вы уезжаете обновленным человеком"
• "Елена лично проводит утренние беседы - это про вдохновение и осознанность"

📚 ПОЗИЦИОНИРОВАНИЕ КУРСОВ:
• Стрижки - "Система и структура для опытных мастеров"
• Колористика - "Фундаментальные знания без привязки к брендам"
• Короткие стрижки - "Новый виток в любимых формах"
• Наставничество - "Передавайте опыт и зарабатывайте на знаниях"
• Офлайн курсы - "Погружение и перезагрузка в Творческой деревне"

🎯 ГЛАВНОЕ:
• Ты общаешься с ОПЫТНЫМ МАСТЕРОМ, который хочет НОВОГО ВИТКА
• Пиши живо, с эмоциями, но профессионально
• Продавай через помощь, а не давление
• Творческая деревня - это ОПЫТ и ТРАНСФОРМАЦИЯ, а не просто место
• Всегда уточняй формат обучения (очный/онлайн) - это критически важно!`;
  }

  private async searchRelevantCourses(
    interests: string[],
    budget: 'low' | 'medium' | 'high' | 'unknown',
    preferOnline: boolean
  ): Promise<ExternalCourse[]> {
    try {
      console.log('🔍 Поиск курсов с параметрами:');
      console.log('   Интересы:', interests);
      console.log('   Бюджет:', budget);
      console.log('   Предпочитает онлайн:', preferOnline);

      let courses: ExternalCourse[] = [];

      // Если нет конкретных интересов, получаем все курсы
      if (interests.length === 0) {
        console.log('📚 Получаем все курсы (интересы не определены)');
        courses = await coursesDB.getAllCourses();
      } else {
        // Поиск по ключевым словам интересов
        for (const interest of interests) {
          console.log(`   🔎 Поиск по слову: "${interest}"`);
          const searchResults = await coursesDB.searchCourses(interest);
          console.log(`      Найдено: ${searchResults.length} курсов`);
          courses = [...courses, ...searchResults];
        }
      }

      // Если ничего не нашли по интересам, берем все курсы
      if (courses.length === 0) {
        console.log('⚠️  По интересам ничего не найдено, получаем все курсы');
        courses = await coursesDB.getAllCourses();
      }

      // Фильтрация по формату обучения
      if (courses.length > 0) {
        // Проверяем, есть ли явное указание на формат в интересах
        const wantsOffline = interests.some(i => i.includes('очн') || i.includes('офлайн') || i.includes('оффлайн'));
        const wantsOnline = interests.some(i => i.includes('онлайн'));

        if (wantsOffline || (!preferOnline && !wantsOnline)) {
          // Фильтруем ТОЛЬКО офлайн курсы (НЕ гибридные)
          const offlineCourses = courses.filter(c =>
            c.format && c.format.toLowerCase() === 'офлайн'
          );
          if (offlineCourses.length > 0) {
            courses = offlineCourses;
            console.log(`🏢 Отфильтровано офлайн курсов: ${courses.length}`);
          }
        } else if (preferOnline || wantsOnline) {
          // Фильтруем ТОЛЬКО онлайн курсы (НЕ гибридные)
          const onlineCourses = courses.filter(c =>
            c.format && c.format.toLowerCase() === 'онлайн'
          );
          if (onlineCourses.length > 0) {
            courses = onlineCourses;
            console.log(`💻 Отфильтровано онлайн курсов: ${courses.length}`);
          }
        }
      }

      // Фильтрация по бюджету
      if (budget !== 'unknown' && courses.length > 0) {
        let maxPrice = 1000000; // без ограничения
        if (budget === 'low') maxPrice = 30000;
        else if (budget === 'medium') maxPrice = 70000;

        const budgetCourses = courses.filter(c => !c.price || c.price <= maxPrice);
        if (budgetCourses.length > 0) {
          courses = budgetCourses;
          console.log(`💰 Отфильтровано по бюджету (до ${maxPrice}₽): ${courses.length}`);
        }
      }

      // Удаляем дубликаты
      const uniqueCourses = courses.filter((course, index, self) =>
        index === self.findIndex((c) => c.id === course.id)
      );

      console.log(`✅ Итого уникальных курсов: ${uniqueCourses.length}`);

      // Возвращаем топ 5-6 наиболее релевантных курсов
      return uniqueCourses.slice(0, 6);
    } catch (error) {
      console.error('❌ Ошибка поиска курсов:', error);
      return [];
    }
  }

  private analyzeClientNeeds(messages: Message[]): {
    level: 'beginner' | 'intermediate' | 'advanced' | 'unknown';
    interests: string[];
    budget: 'low' | 'medium' | 'high' | 'unknown';
    preferOnline: boolean;
  } {
    // Анализируем последние 3 сообщения для более точного понимания текущих потребностей
    const recentMessages = messages.slice(-3);
    const recentConversation = recentMessages.map(m => m.content).join(' ').toLowerCase();

    // Полная история для определения уровня
    const fullConversation = messages.map(m => m.content).join(' ').toLowerCase();

    // Определяем уровень из полной истории
    let level: 'beginner' | 'intermediate' | 'advanced' | 'unknown' = 'unknown';
    if (fullConversation.includes('начинающ') || fullConversation.includes('с нуля') || fullConversation.includes('новичок')) {
      level = 'beginner';
    } else if (fullConversation.includes('опыт') || fullConversation.includes('работаю') || fullConversation.includes('практику')) {
      level = 'intermediate';
    } else if (fullConversation.includes('преподава') || fullConversation.includes('наставни') || fullConversation.includes('эксперт')) {
      level = 'advanced';
    }

    // Определяем интересы из последних сообщений для актуальности
    const interests: string[] = [];

    // Сначала проверяем формат обучения
    if (recentConversation.includes('очн') || recentConversation.includes('офлайн') || recentConversation.includes('оффлайн')) {
      interests.push('очный', 'офлайн');
    }
    if (recentConversation.includes('онлайн')) {
      interests.push('онлайн');
    }

    // Затем проверяем предметные области
    if (recentConversation.includes('стриж') || recentConversation.includes('парикмахер')) {
      interests.push('стрижк', 'парикмахер');
    }
    if (recentConversation.includes('окраш') || recentConversation.includes('колор') || recentConversation.includes('блонд') ||
        recentConversation.includes('цвет') || recentConversation.includes('краск')) {
      interests.push('окрашивание', 'колорист', 'блонд', 'днк', 'цвет', 'факультет');
    }
    if (recentConversation.includes('салон') || recentConversation.includes('бизнес') || recentConversation.includes('управлен')) {
      interests.push('салон', 'бизнес', 'управление', 'предприниматель');
    }
    if (recentConversation.includes('перманент') || recentConversation.includes('татуаж')) {
      interests.push('перманент', 'татуаж');
    }
    // Убраны несуществующие курсы (визаж, брови, ресницы, спа)

    // Определяем предпочтения по формату обучения
    let preferOnline = false;

    // Сначала проверяем явные указания на офлайн/очный формат
    if (recentConversation.includes('очн') || recentConversation.includes('офлайн') || recentConversation.includes('оффлайн') || recentConversation.includes('личн')) {
      preferOnline = false;
    }
    // Затем проверяем указания на онлайн формат
    else if (recentConversation.includes('онлайн') || recentConversation.includes('дистанц') || recentConversation.includes('удален')) {
      preferOnline = true;
    }

    // Определяем бюджет из последних сообщений
    let budget: 'low' | 'medium' | 'high' | 'unknown' = 'unknown';
    if (recentConversation.includes('дешев') || recentConversation.includes('эконом') || recentConversation.includes('недорог') || recentConversation.includes('бюджет')) {
      budget = 'low';
    } else if (recentConversation.includes('премиум') || recentConversation.includes('vip') || recentConversation.includes('индивидуал')) {
      budget = 'high';
    }

    return { level, interests, budget, preferOnline };
  }

  private getDaysWord(days: number): string {
    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'дней';
    }

    if (lastDigit === 1) {
      return 'день';
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      return 'дня';
    } else {
      return 'дней';
    }
  }

  async generateResponse(
    conversation: Conversation,
    newMessage: string,
    telegramClient?: TelegramClient
  ): Promise<{
    response: string;
    suggestedProducts: string[];
    shouldScheduleFollowUp: boolean;
    clientStatus: Conversation['clientStatus'];
  }> {
    try {
      console.log('🤖 Генерация ответа AI (Вера)...');
      console.log(`📨 Обработка сообщения: "${newMessage}"`);

      // ПРИОРИТЕТ 0: Проверка необходимости эскалации к менеджеру
      const escalationCheck = checkIfNeedsManager(newMessage);
      if (escalationCheck.needsManager && telegramClient) {
        console.log(`🚨 Требуется эскалация к менеджеру: ${escalationCheck.reason}`);

        // Проверяем, не был ли клиент недавно эскалирован
        if (wasClientRecentlyEscalated(conversation.userId)) {
          console.log('⏰ Клиент был недавно эскалирован, пропускаем повторную эскалацию');
        } else {
          // Отправляем уведомление менеджеру через личный аккаунт
          const priority = getEscalationPriority(escalationCheck.category);
          await sendManagerNotificationDirect(telegramClient, {
            clientName: conversation.userName,
            clientId: conversation.userId,
            clientUsername: conversation.userUsername,
            clientMessage: newMessage,
            reason: escalationCheck.reason,
            category: escalationCheck.category,
            priority: priority
          });
        }

        // Формируем ответ для клиента
        let response = getClientEscalationResponse(escalationCheck.category);

        // Добавляем информацию о нерабочем времени, если необходимо
        if (!isWorkingHours()) {
          response += getNonWorkingHoursMessage();
        }

        return {
          response: response,
          suggestedProducts: [],
          shouldScheduleFollowUp: false,
          clientStatus: escalationCheck.category === 'order' ? 'negotiating' : 'interested'
        };
      }

      // ПРИОРИТЕТ 1: Специальная обработка курса ДНК ЦВЕТА
      if (isDNACourseRequest(newMessage)) {
        console.log('🎨 Специальная презентация курса ДНК ЦВЕТА');
        return {
          response: DNA_COURSE_PRESENTATION,
          suggestedProducts: [],
          shouldScheduleFollowUp: true,
          clientStatus: 'interested'
        };
      }

      // ПРИОРИТЕТ 2: Запрос дат курсов
      if (isAskingForDates(newMessage)) {
        console.log('📅 Запрос о датах курсов');
        const lastMessages = conversation.messages.slice(-5);
        let courseName = '';

        for (const msg of lastMessages) {
          const content = msg.content.toLowerCase();
          if (content.includes('днк цвет')) {
            courseName = 'ДНК цвета';
            break;
          }
        }

        const dates = courseName ? getCourseDates(courseName) : getCourseDates('');
        return {
          response: dates,
          suggestedProducts: [],
          shouldScheduleFollowUp: true,
          clientStatus: 'interested'
        };
      }

      // ПРИОРИТЕТ 3: Запрос деталей о конкретном курсе
      // ВАЖНО: проверяем детали ТОЛЬКО если это НЕ общий запрос
      if (!isGeneralRequest(newMessage) && isAskingForDetails(newMessage)) {
        console.log('📖 Запрос детальной информации о курсе');
        const detailedPresentation = getDetailedCoursePresentation(newMessage);
        if (detailedPresentation) {
          return {
            response: detailedPresentation,
            suggestedProducts: [],
            shouldScheduleFollowUp: true,
            clientStatus: 'interested'
          };
        }
      }

      // ПРИОРИТЕТ 4: Общий запрос о курсах - начинаем квалификацию
      if (isGeneralRequest(newMessage)) {
        console.log('📊 Общий запрос - проверяем квалификацию');

        // Анализируем что уже знаем о клиенте
        const allMessages = conversation.messages.map(m => m.content);
        allMessages.push(newMessage);
        const qualification = analyzeQualification(allMessages);

        // Если не хватает информации - задаем вопросы
        if (!qualification.qualified) {
          const questions = getQualificationQuestions(qualification);
          if (questions) {
            console.log('❓ Задаем вопросы для квалификации');
            return {
              response: questions,
              suggestedProducts: [],
              shouldScheduleFollowUp: false,
              clientStatus: 'new'
            };
          }
        }

        // Если квалифицированы - показываем краткий список
        console.log('✅ Клиент квалифицирован, подбираем курсы');

        // Подбираем курсы на основе квалификации
        let suggestedCourses = [];

        if (qualification.format === 'offline') {
          suggestedCourses = await coursesDB.getCoursesByFormat('офлайн');
        } else if (qualification.format === 'online') {
          suggestedCourses = await coursesDB.getCoursesByFormat('онлайн');
        } else {
          suggestedCourses = await coursesDB.getAllCourses();
        }

        // Фильтруем по направлению
        if (qualification.direction === 'haircuts') {
          suggestedCourses = suggestedCourses.filter(c =>
            c.name.toLowerCase().includes('стрижк'));
        } else if (qualification.direction === 'coloring') {
          suggestedCourses = suggestedCourses.filter(c =>
            c.name.toLowerCase().includes('колор') ||
            c.name.toLowerCase().includes('днк') ||
            c.name.toLowerCase().includes('цвет') ||
            c.name.toLowerCase().includes('блонд'));
        } else if (qualification.direction === 'business') {
          suggestedCourses = suggestedCourses.filter(c =>
            c.name.toLowerCase().includes('салон') ||
            c.name.toLowerCase().includes('планирован') ||
            c.name.toLowerCase().includes('руководител'));
        }

        // Возвращаем краткое представление
        const shortPresentation = getShortCoursePresentation(suggestedCourses, qualification);
        return {
          response: shortPresentation,
          suggestedProducts: suggestedCourses.slice(0, 3).map(c => c.id),
          shouldScheduleFollowUp: false,
          clientStatus: 'interested'
        };
      }

      // ПРИОРИТЕТ 5: FAQ о Творческой деревне
      const faqAnswer = findFAQAnswer(newMessage);
      if (faqAnswer) {
        console.log('📚 Найден ответ в FAQ');
        return {
          response: faqAnswer,
          suggestedProducts: [],
          shouldScheduleFollowUp: false,
          clientStatus: 'interested'
        };
      }

      // Проверяем возражения
      const objectionResponse = findObjectionResponse(newMessage);
      if (objectionResponse) {
        console.log('💬 Обработка возражения');
        return {
          response: objectionResponse,
          suggestedProducts: [],
          shouldScheduleFollowUp: true,
          clientStatus: 'negotiating'
        };
      }

      // Анализируем потребности клиента
      const analysis = this.analyzeClientNeeds([...conversation.messages, { role: 'user', content: newMessage } as Message]);

      // Подбираем подходящие курсы из базы данных
      let suggestedCourses: ExternalCourse[] = [];

      // Проверяем конкретные запросы в последнем сообщении
      const lowerMessage = newMessage.toLowerCase();

      if (lowerMessage.includes('все очные') || lowerMessage.includes('все офлайн') ||
          (lowerMessage.includes('очн') && lowerMessage.includes('курс')) ||
          (lowerMessage.includes('офлайн') && lowerMessage.includes('курс')) ||
          lowerMessage.includes('гибрид')) {
        console.log('📍 Запрос офлайн курсов');
        suggestedCourses = await coursesDB.getCoursesByFormat('офлайн');
        console.log(`🏢 Найдено офлайн курсов: ${suggestedCourses.length}`);
      } else if (lowerMessage.includes('все онлайн') || (lowerMessage.includes('онлайн') && lowerMessage.includes('курс'))) {
        console.log('💻 Запрос онлайн курсов');
        suggestedCourses = await coursesDB.getCoursesByFormat('онлайн');
      } else if (lowerMessage.includes('наставник') || lowerMessage.includes('тренер') || lowerMessage.includes('преподава')) {
        console.log('👨‍🏫 Запрос курсов для наставников');
        const results = await coursesDB.searchCourses('наставник');
        const trainer = await coursesDB.searchCourses('тренер');
        const teacher = await coursesDB.searchCourses('преподаватель');
        suggestedCourses = [...results, ...trainer, ...teacher];
        // Удаляем дубликаты
        suggestedCourses = suggestedCourses.filter((course, index, self) =>
          index === self.findIndex((c) => c.id === course.id)
        );
      } else if (lowerMessage.includes('окраш') || lowerMessage.includes('колор') || lowerMessage.includes('колорист') || lowerMessage.includes('цвет') || lowerMessage.includes('блонд')) {
        console.log('🎨 Запрос курсов по колористике/окрашиванию');
        const colorCourses = await coursesDB.searchCourses('колор');
        const coloristCourses = await coursesDB.searchCourses('колорист');
        const dnaCourses = await coursesDB.searchCourses('днк');
        const colorCourses2 = await coursesDB.searchCourses('цвет');
        const blondCourses = await coursesDB.searchCourses('блонд');
        const facultyCourses = await coursesDB.searchCourses('факультет');

        // Объединяем все найденные курсы
        suggestedCourses = [...colorCourses, ...coloristCourses, ...dnaCourses, ...colorCourses2, ...blondCourses, ...facultyCourses];

        // Дополнительно проверяем все курсы на соответствие окрашиванию
        const allCourses = await coursesDB.getAllCourses();
        const additionalCourses = allCourses.filter(course =>
          course.name.toLowerCase().includes('колор') ||
          course.name.toLowerCase().includes('цвет') ||
          course.name.toLowerCase().includes('окраш') ||
          course.name.toLowerCase().includes('блонд') ||
          course.description.toLowerCase().includes('окраш') ||
          course.description.toLowerCase().includes('колор')
        );

        suggestedCourses = [...suggestedCourses, ...additionalCourses];

        // Удаляем дубликаты
        suggestedCourses = suggestedCourses.filter((course, index, self) =>
          index === self.findIndex((c) => c.id === course.id)
        );
      } else if (lowerMessage.includes('недорог') || lowerMessage.includes('дешев') || lowerMessage.includes('бюджет')) {
        console.log('💰 Запрос недорогих курсов');
        const allCourses = await coursesDB.getAllCourses();
        suggestedCourses = allCourses
          .filter(c => c.price && c.price <= 10000)
          .sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (lowerMessage.includes('руководител') || lowerMessage.includes('управлен')) {
        console.log('👔 Запрос курсов для руководителей');
        const managers = await coursesDB.searchCourses('руководител');
        const planning = await coursesDB.searchCourses('планирование');
        const masterGroup = await coursesDB.searchCourses('мастер-группа');
        suggestedCourses = [...managers, ...planning, ...masterGroup];
        // Удаляем дубликаты
        suggestedCourses = suggestedCourses.filter((course, index, self) =>
          index === self.findIndex((c) => c.id === course.id)
        );
      } else if (lowerMessage.includes('факультет')) {
        console.log('🎓 Запрос факультетов');
        suggestedCourses = await coursesDB.searchCourses('факультет');
      } else if (analysis.interests.length > 0) {
        // Используем анализ интересов только если нет конкретного запроса
        suggestedCourses = await this.searchRelevantCourses(
          analysis.interests,
          analysis.budget,
          analysis.preferOnline
        );
      } else {
        // Если интересы не определены, показываем популярные курсы
        const allCourses = await coursesDB.getAllCourses();
        suggestedCourses = allCourses.slice(0, 3);
      }

      // Специальная обработка для курса ДНК ЦВЕТА
      if (isDNACourseRequest(newMessage)) {
        console.log('🎨 Специальная презентация курса ДНК ЦВЕТА');
        return {
          response: DNA_COURSE_PRESENTATION,
          suggestedProducts: [],
          shouldScheduleFollowUp: true,
          clientStatus: 'interested'
        };
      }

      // Проверяем запрос о датах курсов
      if (isAskingForDates(newMessage)) {
        console.log('📅 Запрос о датах курсов');

        // Проверяем контекст диалога - о каком курсе говорили
        const lastMessages = conversation.messages.slice(-5);
        let courseName = '';

        // Ищем упоминания курсов в последних сообщениях
        for (const msg of lastMessages) {
          const content = msg.content.toLowerCase();
          if (content.includes('днк цвет')) {
            courseName = 'ДНК цвета';
            break;
          } else if (content.includes('колорист')) {
            courseName = 'ДНК ЦВЕТА';
            break;
          } else if (content.includes('коротк') && content.includes('стрижк')) {
            courseName = 'Короткие стрижки';
            break;
          } else if (content.includes('стрижк') && content.includes('фундамент')) {
            courseName = 'Стрижки Фундамент';
            break;
          }
        }

        // Если говорили про очные курсы или Творческую деревню
        if (newMessage.toLowerCase().includes('очн') ||
            newMessage.toLowerCase().includes('офлайн') ||
            lastMessages.some(m => m.content.toLowerCase().includes('творческ') ||
                                   m.content.toLowerCase().includes('деревн'))) {
          return {
            response: getOfflineCoursesWithDates(),
            suggestedProducts: [],
            shouldScheduleFollowUp: true,
            clientStatus: 'interested'
          };
        }

        // Возвращаем даты для конкретного курса или общие даты
        const dates = courseName ? getCourseDates(courseName) : getCourseDates('');
        return {
          response: dates,
          suggestedProducts: [],
          shouldScheduleFollowUp: true,
          clientStatus: 'interested'
        };
      }

      // Формируем контекст курсов для AI
      let productsContext = '';

      // Показываем 2-3 курса для Веры (не перегружаем клиента)
      const maxCourses = 3;

      if (suggestedCourses.length > 0) {
        // Ограничиваем количество курсов
        const coursesToShow = suggestedCourses.slice(0, maxCourses);

        console.log(`📚 Подобрано ${suggestedCourses.length} курсов, показываем ${coursesToShow.length}:`);
        coursesToShow.forEach(course => {
          console.log(`   - ${course.title} (${course.price ? course.price + ' руб.' : 'цена не указана'})`);
        });

        productsContext = '\n\n📚 ИДЕАЛЬНЫЕ КУРСЫ ДЛЯ КЛИЕНТА:\n\n';
        coursesToShow.forEach((course, index) => {
          productsContext += `${index + 1}. ${coursesDB.formatCourseInfo(course)}\n`;
          productsContext += `---\n\n`;
        });

        if (suggestedCourses.length > coursesToShow.length) {
          productsContext += `\n📌 Есть ещё ${suggestedCourses.length - coursesToShow.length} подходящих курсов, могу рассказать подробнее\n`;
        }
      } else {
        console.log('⚠️  Конкретные курсы не найдены, показываем категории');
        // Если курсы не найдены, получаем категории для предложения
        const categories = await coursesDB.getCategories();
        productsContext = '\n\n📋 ДОСТУПНЫЕ КАТЕГОРИИ КУРСОВ:\n';
        categories.forEach(cat => {
          productsContext += `• ${cat}\n`;
        });
        productsContext += '\n❓ Какая категория вас интересует? Расскажу подробнее о курсах.';
      }

      // Подготавливаем сообщения для API
      const messages: OpenAIMessage[] = [
        { role: 'system', content: await this.buildSystemPrompt() + productsContext },
        ...conversation.messages.slice(-10).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user', content: newMessage }
      ];

      console.log(`📝 Отправка запроса к OpenAI API (модель: ${this.model})...`);

      // Вызываем API
      const response = await axios.post<OpenAIResponse>(
        this.apiUrl,
        {
          model: this.model,
          messages,
          temperature: 0.8, // Чуть выше для более человечных ответов
          max_tokens: 800
        },
        this.axiosConfig
      );

      console.log('✅ Ответ от AI получен');
      const aiResponse = response.data.choices[0].message.content;

      // Определяем статус клиента на основе диалога (более деликатно)
      let clientStatus: Conversation['clientStatus'] = 'new';
      const allMessages = [...conversation.messages, { role: 'user', content: newMessage }];

      if (allMessages.length > 2) {
        const recentMessages = allMessages.slice(-5).map(m => m.content).join(' ').toLowerCase();

        if (recentMessages.includes('купить') || recentMessages.includes('оплат') || recentMessages.includes('записать')) {
          clientStatus = 'purchased';
        } else if (recentMessages.includes('интерес') || recentMessages.includes('расскаж') || recentMessages.includes('подробн')) {
          clientStatus = 'interested';
        } else if (recentMessages.includes('подума') || recentMessages.includes('посоветуюсь')) {
          clientStatus = 'negotiating';
        } else if (recentMessages.includes('не интересно') || recentMessages.includes('не надо') || recentMessages.includes('спасибо, нет')) {
          clientStatus = 'lost';
        }
      }

      // Планируем follow-up только если клиент заинтересован
      const shouldScheduleFollowUp = clientStatus === 'interested' || clientStatus === 'negotiating';

      return {
        response: aiResponse,
        suggestedProducts: suggestedCourses.map(c => c.id),
        shouldScheduleFollowUp,
        clientStatus
      };

    } catch (error: any) {
      console.error('❌ Ошибка при генерации ответа:', error.message);

      if (error.response) {
        console.error('📋 Статус ошибки:', error.response.status);
        console.error('📋 Данные ошибки:', JSON.stringify(error.response.data, null, 2));

        if (error.response.status === 404) {
          console.error('⚠️  Модель не найдена. Проверьте название модели.');
        } else if (error.response.status === 401) {
          console.error('⚠️  Ошибка авторизации. Проверьте API ключ.');
        } else if (error.response.status === 429) {
          console.error('⚠️  Превышен лимит запросов.');
        }
      }

      // Fallback ответ - тоже человечный
      return {
        response: 'Здравствуйте! Меня зовут Вера, я консультант академии SOINTERA.\n\nРада помочь вам с выбором обучения! Расскажите, пожалуйста, что именно вас интересует?\n\nУ нас есть курсы по направлениям:\n• Стрижки и парикмахерское искусство\n• Колористика и окрашивание\n• Управление салоном и бизнес\n• Наставничество и преподавание\n\nНа каком этапе вы сейчас находитесь в профессии?',
        suggestedProducts: [],
        shouldScheduleFollowUp: false,
        clientStatus: 'new'
      };
    }
  }

  async generateFollowUpMessage(conversation: Conversation): Promise<string> {
    try {
      const daysSinceLastMessage = Math.floor(
        (Date.now() - conversation.lastMessageAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const systemPrompt = `Ты - Вера, заботливый консультант. Клиент ${conversation.userName} не ответил ${daysSinceLastMessage} ${this.getDaysWord(daysSinceLastMessage)}.

Напиши ДЕЛИКАТНОЕ follow-up сообщение:
• Напомни о себе мягко
• Уточни, актуален ли еще вопрос обучения
• Предложи помощь, если нужно
• НЕ дави, не манипулируй
• Будь готова отпустить клиента

Статус клиента: ${conversation.clientStatus}`;

      const messages: OpenAIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversation.messages.slice(-5).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: 'Напиши вежливое, ненавязчивое follow-up сообщение'
        }
      ];

      const response = await axios.post<OpenAIResponse>(
        this.apiUrl,
        {
          model: this.model,
          messages,
          temperature: 0.8,
          max_tokens: 300
        },
        this.axiosConfig
      );

      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('Ошибка при генерации follow-up сообщения:', error);

      // Деликатные fallback follow-up
      const followUpTemplates = [
        `Здравствуйте, ${conversation.userName}!\n\nЭто Вера из академии SOINTERA. Мы с вами обсуждали обучение несколько дней назад.\n\nХотела уточнить - актуален ли еще для вас вопрос обучения? Если да, буду рада помочь с выбором программы.\n\nЕсли передумали - тоже абсолютно нормально! Просто дайте знать, чтобы я не беспокоила.\n\nХорошего дня!`,

        `Добрый день, ${conversation.userName}!\n\nНадеюсь, у вас всё хорошо! Вы интересовались нашими курсами, и я подумала - вдруг у вас появились вопросы, которые я могла бы прояснить?\n\nЕсли нужна дополнительная информация или помощь с выбором - я на связи.\n\nС уважением, Вера`,

        `Здравствуйте, ${conversation.userName}!\n\nПомню, что вы рассматривали обучение в нашей академии. Как ваши планы - определились с направлением?\n\nЕсли нужна консультация или есть сомнения - обращайтесь, помогу разобраться.\n\nБуду рада быть полезной!`
      ];

      return followUpTemplates[Math.floor(Math.random() * followUpTemplates.length)];
    }
  }

  async analyzeConversationForInsights(conversation: Conversation): Promise<{
    summary: string;
    recommendations: string[];
    nextSteps: string[];
  }> {
    try {
      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content: `Ты - опытный руководитель отдела продаж. Проанализируй диалог и дай конструктивные рекомендации.

          Фокус на:
          1. Что узнали о потребностях клиента
          2. Какие возражения были и как их обработали
          3. Что можно улучшить в коммуникации
          4. Следующие шаги для помощи клиенту

          Будь объективным и профессиональным.`
        },
        ...conversation.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user', content: 'Дай профессиональный анализ диалога и рекомендации' }
      ];

      const response = await axios.post<OpenAIResponse>(
        this.apiUrl,
        {
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 600
        },
        this.axiosConfig
      );

      const analysis = response.data.choices[0].message.content;

      // Простой парсинг ответа
      const lines = analysis.split('\n').filter(line => line.trim());
      const summary = lines[0] || 'Диалог в процессе, требуется дальнейшая работа';
      const recommendations = lines.slice(1, 4).map(line => line.replace(/^[-•]\s*/, ''));
      const nextSteps = lines.slice(4, 7).map(line => line.replace(/^[-•]\s*/, ''));

      return { summary, recommendations, nextSteps };

    } catch (error) {
      console.error('Ошибка при анализе диалога:', error);
      return {
        summary: 'Диалог требует анализа и доработки',
        recommendations: [
          'Выяснить конкретные потребности клиента',
          'Предложить подходящие варианты обучения',
          'Обработать возражения, если они есть',
          'Договориться о следующем шаге'
        ],
        nextSteps: [
          'Уточнить бюджет и сроки начала обучения',
          'Отправить подробную информацию о подходящих курсах',
          'Предложить консультацию или пробное занятие',
          'Назначить время для принятия решения'
        ]
      };
    }
  }
}
