// Логика квалификации клиента перед предложением курсов

export interface ClientQualification {
  format?: "online" | "offline" | null;
  direction?: "haircuts" | "coloring" | "business" | null;
  experience?: "beginner" | "intermediate" | "expert" | null;
  qualified: boolean;
}

// Анализируем, что мы уже знаем о клиенте
export function analyzeQualification(messages: string[]): ClientQualification {
  const allText = messages.join(" ").toLowerCase();

  const qualification: ClientQualification = {
    format: null,
    direction: null,
    experience: null,
    qualified: false,
  };

  // Проверяем формат
  if (
    allText.includes("очн") ||
    allText.includes("офлайн") ||
    allText.includes("офлайн") ||
    allText.includes("творческ") ||
    allText.includes("деревн")
  ) {
    qualification.format = "offline";
  } else if (
    allText.includes("онлайн") ||
    allText.includes("дистанц") ||
    allText.includes("удален")
  ) {
    qualification.format = "online";
  }

  // Проверяем направление
  if (
    allText.includes("стрижк") ||
    allText.includes("парикмахер") ||
    allText.includes("стричь")
  ) {
    qualification.direction = "haircuts";
  } else if (
    allText.includes("колор") ||
    allText.includes("окраш") ||
    allText.includes("цвет") ||
    allText.includes("блонд") ||
    allText.includes("днк")
  ) {
    qualification.direction = "coloring";
  } else if (
    allText.includes("салон") ||
    allText.includes("управлен") ||
    allText.includes("бизнес") ||
    allText.includes("руководител")
  ) {
    qualification.direction = "business";
  }

  // Проверяем опыт
  if (
    allText.includes("начина") ||
    allText.includes("новичок") ||
    allText.includes("с нуля") ||
    allText.includes("нет опыта")
  ) {
    qualification.experience = "beginner";
  } else if (
    allText.includes("опыт") ||
    allText.includes("работаю") ||
    allText.includes("лет в профессии") ||
    allText.includes("года в профессии")
  ) {
    qualification.experience = "intermediate";
  } else if (
    allText.includes("эксперт") ||
    allText.includes("преподава") ||
    allText.includes("наставник") ||
    allText.includes("тренер")
  ) {
    qualification.experience = "expert";
  }

  // Считаем квалифицированным, если знаем хотя бы формат и направление
  qualification.qualified = !!(qualification.format && qualification.direction);

  return qualification;
}

// Генерируем вопросы для квалификации в правильном порядке
export function getQualificationQuestions(
  qualification: ClientQualification,
): string {
  const questions: string[] = [];

  // Приветствие если это первое сообщение
  if (
    !qualification.format &&
    !qualification.direction &&
    !qualification.experience
  ) {
    questions.push(
      "Здравствуйте! Меня зовут Вера, я консультант академии SOINTERA. Помогу подобрать идеальный курс именно для вас! 😊",
    );
  }

  // Порядок важен: сначала формат, потом направление, потом опыт
  if (!qualification.format) {
    questions.push(
      "Сначала определимся с форматом: вам удобнее учиться очно в Творческой деревне или онлайн?",
    );
  } else if (!qualification.direction) {
    questions.push(
      "Отлично! Теперь выберите направление: стрижки или колористика?",
    );
  } else if (!qualification.experience) {
    questions.push(
      "Супер! И последний вопрос: какой у вас опыт работы? Это поможет подобрать программу нужного уровня.",
    );
  }

  return questions.join("\n\n");
}

// Проверяем, это общий запрос или конкретный
export function isGeneralRequest(message: string): boolean {
  const lower = message.toLowerCase();

  // Точные фразы которые точно требуют квалификацию
  const exactPhrases = [
    "расскажи про курсы",
    "расскажите про курсы",
    "какие курсы",
    "какие есть курсы",
    "что есть",
    "все курсы",
    "про обучение",
    "хочу учиться",
    "подобрать курс",
  ];

  // Проверяем точные совпадения
  if (
    exactPhrases.some((phrase) => lower === phrase || lower === phrase + "?")
  ) {
    return true;
  }

  // Общие фразы для коротких сообщений
  const generalPhrases = [
    "расскажи",
    "расскажите",
    "какие есть",
    "что есть",
    "какие курсы",
    "все курсы",
    "про курсы",
    "об обучении",
    "интересно",
    "хочу учиться",
    "подобрать курс",
    "обучение",
    "научиться",
    "хочу на курс",
  ];

  // ИСКЛЮЧАЕМ фразы которые НЕ должны запускать квалификацию
  const excludePhrases = [
    "про днк",
    "про фундамент",
    "про стрижки",
    "про колор",
    "все очные",
    "все онлайн",
    "покажи все",
    "список всех",
  ];

  // Если есть исключающие фразы - это НЕ общий запрос
  if (excludePhrases.some((phrase) => lower.includes(phrase))) {
    return false;
  }

  // Проверяем, что сообщение короткое (менее 40 символов) и содержит общую фразу
  // Убираем "очные курсы" и "онлайн курсы" из общих запросов
  if (
    message.length < 40 &&
    generalPhrases.some((phrase) => lower.includes(phrase))
  ) {
    // Дополнительная проверка: если указан конкретный формат с направлением - это не общий запрос
    if (
      (lower.includes("очн") || lower.includes("онлайн")) &&
      (lower.includes("стриж") || lower.includes("колор"))
    ) {
      return false;
    }
    return true;
  }

  // Одиночные слова которые должны запускать квалификацию
  const singleWordTriggers = ["курсы", "обучение", "учиться"];
  if (message.length < 15 && singleWordTriggers.includes(lower.trim())) {
    return true;
  }

  return false;
}

// Проверяем, запрашивает ли клиент детали конкретного курса
export function isAskingForDetails(message: string): boolean {
  const lower = message.toLowerCase();

  // ИСКЛЮЧАЕМ общие фразы про курсы
  if (
    lower === "расскажи про курсы" ||
    lower === "расскажите про курсы" ||
    lower === "расскажи про курсы?" ||
    lower === "расскажите про курсы?"
  ) {
    return false;
  }

  // Выбор по номеру
  if (/^[1-3]$/.test(message.trim())) {
    return true;
  }

  // Выбор словами
  const choiceWords = [
    "первый",
    "второй",
    "третий",
    "первый курс",
    "второй курс",
    "третий курс",
  ];
  if (choiceWords.includes(lower.trim())) {
    return true;
  }

  // Запросы деталей конкретных курсов
  const detailPhrases = [
    "про фундамент",
    "про днк",
    "про стрижки 2.0",
    "про короткие",
    "расскажи про фундамент",
    "расскажи про днк",
    "подробнее о",
    "подробнее про",
    "что за курс",
    "расскажи подробнее",
  ];

  // Проверяем наличие фраз о деталях
  if (detailPhrases.some((phrase) => lower.includes(phrase))) {
    return true;
  }

  // Проверяем упоминание конкретных названий курсов
  const courseNames = [
    "фундамент",
    "днк цвета",
    "стрижки 2.0",
    "короткие стрижки",
    "наставник",
    "факультет",
    "планирование",
  ];

  // Если сообщение короткое и содержит название курса с вопросом о деталях
  if (message.length < 50 && courseNames.some((name) => lower.includes(name))) {
    // Проверяем контекст - есть ли вопросительные слова
    const questionWords = [
      "что",
      "какой",
      "какая",
      "расскажи",
      "про",
      "подробнее",
    ];
    if (questionWords.some((word) => lower.includes(word))) {
      return true;
    }
  }

  return false;
}

// Краткое представление курсов для выбора с указанием отличий
export function getShortCoursePresentation(
  courses: any[],
  qualification: ClientQualification,
): string {
  if (courses.length === 0) {
    return "К сожалению, не нашла подходящих курсов по вашим критериям. Давайте уточним, что именно вас интересует?";
  }

  let response = "";

  // Вступление на основе опыта и формата
  if (qualification.experience === "beginner") {
    response = "Отлично! Для начинающего мастера у нас есть эти варианты:\n\n";
  } else if (qualification.experience === "intermediate") {
    response = "Супер! С вашим опытом подойдут эти программы:\n\n";
  } else if (qualification.experience === "expert") {
    response = "Прекрасно! Для эксперта вашего уровня:\n\n";
  } else {
    response = "Смотрите, есть 3 варианта:\n\n";
  }

  const topCourses = courses.slice(0, 3);

  // Специальная презентация для стрижек
  if (
    qualification.direction === "haircuts" &&
    qualification.format === "offline"
  ) {
    response += "**1. Стрижки: Фундамент** (60,000₽)\n";
    response += "   📍 База для всех уровней\n";
    response += "   ✅ 11 форм = система в голове\n\n";

    response += "**2. Стрижки 2.0** (60,000₽)\n";
    response += "   📍 Для опытных (от 3 лет)\n";
    response += "   ✅ Современные коммерческие формы\n\n";

    response += "**3. Короткие стрижки 2.0** (70,000₽)\n";
    response += "   📍 Узкая специализация\n";
    response += "   ✅ От 15 см до 2-3 см поэтапно\n\n";

    response += "**Чем отличаются:**\n";
    response +=
      "• Фундамент — структурируем знания и раскладываем по полочкам\n";
    response += "• 2.0 — коммерция и тренды\n";
    response += "• Короткие — глубокая специализация\n\n";

    // Специальная презентация для колористики
  } else if (qualification.direction === "coloring") {
    const hasOffline = courses.some((c) => c.format === "офлайн");
    const hasOnline = courses.some((c) => c.format === "онлайн");

    if (hasOffline && hasOnline) {
      response += "**1. ДНК цвета (офлайн)** (60,000₽)\n";
      response += "   📍 3 дня в Творческой деревне\n";
      response += "   ✅ Рисование красителями + погружение\n\n";

      response += "**2. ДНК цвета (онлайн)** (39,000₽)\n";
      response += "   📍 В своем темпе, доступ навсегда\n";
      response += "   ✅ Та же программа, но дома\n\n";

      response += "**3. Наставник-колорист** (65,000₽)\n";
      response += "   📍 Для тех, кто хочет учить\n";
      response += "   ✅ Методика передачи знаний\n\n";

      response += "**Чем отличаются:**\n";
      response += "• Офлайн — полная перезагрузка\n";
      response += "• Онлайн — удобно, но нужна дисциплина\n";
      response += "• Наставник — станьте преподавателем\n\n";
    } else {
      // Стандартная презентация для колористики
      topCourses.forEach((course, index) => {
        response += `**${index + 1}. ${course.name}** (${course.price?.toLocaleString("ru-RU")}₽)\n`;
        if (course.name.includes("ДНК")) {
          response += "   ✅ Фундамент колористики\n";
        } else if (course.name.includes("Наставник")) {
          response += "   ✅ Научитесь преподавать\n";
        } else if (course.name.includes("Факультет")) {
          response += "   ✅ Углубленная программа\n";
        }
        response += "\n";
      });
    }

    // Стандартная презентация для остальных
  } else {
    topCourses.forEach((course, index) => {
      response += `**${index + 1}. ${course.name}**\n`;
      response += `   💰 ${course.price?.toLocaleString("ru-RU")} ₽\n`;

      if (course.name.includes("Фундамент")) {
        response += "   ✅ База и система\n";
      } else if (course.name.includes("ДНК")) {
        response += "   ✅ Понимание цвета\n";
      } else if (course.name.includes("2.0")) {
        response += "   ✅ Продвинутый уровень\n";
      } else if (course.name.includes("Короткие")) {
        response += "   ✅ Специализация\n";
      }
      response += "\n";
    });
  }

  response += "📌 О каком рассказать подробнее? Напишите 1, 2 или 3.";

  return response;
}
