// Даты проведения курсов SOINTERA (актуально на 2025 год)

export interface CourseDate {
  date: string;
  format: "online" | "offline";
}

export const courseDates: Record<string, CourseDate[]> = {
  // ОНЛАЙН КУРСЫ (начало каждого месяца)
  "Курс по стрижкам с нуля": [
    { date: "4 августа", format: "online" },
    { date: "8 сентября", format: "online" },
    { date: "6 октября", format: "online" },
    { date: "3 ноября", format: "online" },
    { date: "1 декабря", format: "online" },
  ],
  "Курс по стрижкам. Фундамент": [
    { date: "4 августа", format: "online" },
    { date: "8 сентября", format: "online" },
    { date: "6 октября", format: "online" },
    { date: "3 ноября", format: "online" },
    { date: "1 декабря", format: "online" },
  ],
  "Наставник по стрижкам": [
    { date: "4 августа", format: "online" },
    { date: "8 сентября", format: "online" },
    { date: "6 октября", format: "online" },
    { date: "3 ноября", format: "online" },
    { date: "1 декабря", format: "online" },
  ],
  "ДНК цвета": [
    { date: "4 августа", format: "online" },
    { date: "8 сентября", format: "online" },
    { date: "6 октября", format: "online" },
    { date: "3 ноября", format: "online" },
    { date: "1 декабря", format: "online" },
  ],
  "ДНК ЦВЕТА - Фундаментальный курс": [
    { date: "30 сентября - 2 октября", format: "offline" },
  ],
  "Наставник по колористике": [
    { date: "4 августа", format: "online" },
    { date: "8 сентября", format: "online" },
    { date: "6 октября", format: "online" },
    { date: "3 ноября", format: "online" },
    { date: "1 декабря", format: "online" },
  ],
  "Короткие стрижки. Динамический онлайн интенсив": [
    { date: "4 августа", format: "online" },
    { date: "8 сентября", format: "online" },
    { date: "6 октября", format: "online" },
    { date: "3 ноября", format: "online" },
    { date: "1 декабря", format: "online" },
  ],
  // ОЧНЫЕ КУРСЫ в Творческой деревне
  "Очный курс по коротким стрижкам": [
    { date: "19-21 августа", format: "offline" },
    { date: "9-11 сентября", format: "offline" },
  ],
  "Очный курс ДНК цвета": [
    { date: "30 сентября - 2 октября", format: "offline" },
  ],
  "Стрижки 2.0": [{ date: "21-23 октября", format: "offline" }],
  "Планирование в салоне": [{ date: "2-4 декабря", format: "offline" }],
};

// Функция для получения дат конкретного курса
export function getCourseDates(courseName: string): string {
  // Ищем по частичному совпадению
  for (const [key, dates] of Object.entries(courseDates)) {
    if (
      courseName.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(courseName.toLowerCase()) ||
      (courseName.includes("ДНК") && key.includes("ДНК")) ||
      (courseName.includes("колорист") && key.includes("ДНК"))
    ) {
      const offlineDates = dates.filter((d) => d.format === "offline");
      const onlineDates = dates.filter((d) => d.format === "online");

      let response = "";

      // Если запрос про очный курс - показываем ТОЛЬКО очные даты
      if (
        courseName.toLowerCase().includes("очн") ||
        courseName.toLowerCase().includes("офлайн") ||
        courseName.toLowerCase().includes("творческ") ||
        courseName.toLowerCase().includes("деревн")
      ) {
        if (offlineDates.length > 0) {
          response = `🏡 **Ближайшие даты в Творческой деревне:**\n`;
          response += offlineDates.map((d) => `• ${d.date}`).join("\n");
          response +=
            '\n\nГруппы небольшие — максимум 15 человек. Формат "всё включено": проживание, питание, материалы.';
          response +=
            "\n\n💫 Какая дата вам подходит? Могу забронировать место с фиксацией цены!";
          return response;
        }
      }

      // Если есть очные даты и НЕ указан онлайн формат - показываем очные
      if (
        offlineDates.length > 0 &&
        !courseName.toLowerCase().includes("онлайн")
      ) {
        response = `🏡 **Ближайшие даты в Творческой деревне:**\n`;
        response += offlineDates.map((d) => `• ${d.date}`).join("\n");
        response +=
          '\n\nГруппы небольшие — максимум 15 человек. Формат "всё включено": проживание, питание, материалы.';
      }

      // Если запрошен онлайн или нет очных дат
      if (
        onlineDates.length > 0 &&
        (response === "" || courseName.toLowerCase().includes("онлайн"))
      ) {
        if (response !== "") response += "\n\n";
        response += `💻 **Ближайшие старты онлайн:**\n`;
        response += onlineDates
          .slice(0, 3)
          .map((d) => `• ${d.date}`)
          .join("\n");
        response +=
          "\n\nОнлайн-формат с личным наставником и проверкой домашних заданий.";
      }

      if (response) {
        response +=
          "\n\n💫 Какая дата вам подходит? Могу забронировать место с фиксацией цены!";
        return response;
      }
    }
  }

  // Если не нашли конкретный курс, показываем общие даты
  return `📅 **Ближайшие даты курсов:**

🏡 **Очные в Творческой деревне:**
• 30 сентября - 2 октября - ДНК цвета
• 21-23 октября - Стрижки 2.0
• 2-4 декабря - Планирование для руководителей

Группы до 15 человек, формат "всё включено".

💻 **Онлайн старты:**
• 8 сентября - все основные программы
• 6 октября - все основные программы
• 3 ноября - все основные программы

Какое направление вас интересует?`;
}

// Функция проверки, спрашивает ли клиент о датах
export function isAskingForDates(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("дат") ||
    lower.includes("когда") ||
    lower.includes("расписан") ||
    lower.includes("старт") ||
    lower.includes("начало") ||
    lower.includes("ближайш") ||
    /\d+\s*(август|сентябр|октябр|ноябр|декабр)/i.test(lower)
  );
}

// Получить все очные курсы с датами
export function getOfflineCoursesWithDates(): string {
  return `🏡 **Очные курсы в Творческой деревне 2025:**

📅 **Август:**
• 19-21 августа - Короткие стрижки

📅 **Сентябрь:**
• 9-11 сентября - Короткие стрижки
• 30 сентября - 2 октября - ДНК цвета

📅 **Октябрь:**
• 21-23 октября - Стрижки 2.0 (продвинутый уровень)

📅 **Декабрь:**
• 2-4 декабря - Планирование для руководителей салонов

Все курсы в формате "всё включено": проживание в купольных домиках, домашняя еда, материалы.

Группы до 15 человек — внимание каждому участнику.

Какой курс вас заинтересовал? 🌿`;
}
