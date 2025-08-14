import { logger } from "./logger";

export class Validator {
  /**
   * Валидирует и очищает пользовательский ввод
   */
  static sanitizeUserInput(input: string, maxLength = 1000): string {
    if (!input || typeof input !== "string") {
      return "";
    }

    // Удаляем потенциально опасные символы
    let sanitized = input
      .replace(/[<>]/g, "") // Удаляем HTML теги
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Удаляем управляющие символы
      .trim();

    // Ограничиваем длину
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
      logger.debug("Input truncated", {
        originalLength: input.length,
        maxLength,
      });
    }

    return sanitized;
  }

  /**
   * Валидирует номер телефона
   */
  static validatePhoneNumber(phone: string): boolean {
    // Удаляем все нецифровые символы
    const cleaned = phone.replace(/\D/g, "");

    // Проверяем длину (от 10 до 15 цифр)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return false;
    }

    return true;
  }

  /**
   * Валидирует email
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Валидирует URL
   */
  static validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Очищает SQL параметры
   */
  static sanitizeSqlParam(param: any): string {
    if (param === null || param === undefined) {
      return "";
    }

    // Преобразуем в строку и экранируем опасные символы
    return String(param)
      .replace(/'/g, "''") // Экранируем одинарные кавычки
      .replace(/\\/g, "\\\\") // Экранируем обратный слеш
      .replace(/\0/g, ""); // Удаляем null байты
  }

  /**
   * Валидирует ID пользователя Telegram
   */
  static validateTelegramUserId(userId: string | number): boolean {
    const id = typeof userId === "string" ? Number.parseInt(userId) : userId;

    // Telegram user IDs - положительные числа
    if (isNaN(id) || id <= 0) {
      return false;
    }

    // Максимальное значение для Telegram ID
    if (id > 9999999999) {
      return false;
    }

    return true;
  }

  /**
   * Проверяет текст на наличие спама или подозрительного контента
   */
  static isSpamContent(text: string): boolean {
    const spamPatterns = [
      /\b(viagra|cialis|porn|xxx|casino|bitcoin|crypto|forex)\b/i,
      /\b(click here|buy now|limited offer|act now|winner|congratulations)\b/i,
      /https?:\/\/[^\s]+\.(tk|ml|ga|cf)/i, // Подозрительные домены
      /(\$|€|£|¥)\s*\d+[,.]?\d*/g, // Денежные суммы
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(text)) {
        logger.warn("Spam content detected", { pattern: pattern.toString() });
        return true;
      }
    }

    // Проверка на избыточное количество ссылок
    const urlCount = (text.match(/https?:\/\/[^\s]+/g) || []).length;
    if (urlCount > 3) {
      logger.warn("Too many URLs detected", { urlCount });
      return true;
    }

    // Проверка на избыточное количество эмодзи
    const emojiCount = (
      text.match(
        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/gu,
      ) || []
    ).length;
    if (emojiCount > 10) {
      logger.warn("Too many emojis detected", { emojiCount });
      return true;
    }

    return false;
  }

  /**
   * Валидирует JSON строку
   */
  static isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Экранирует HTML символы
   */
  static escapeHtml(text: string): string {
    const htmlEscapes: { [key: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "/": "&#x2F;",
    };

    return text.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
  }

  /**
   * Проверяет, является ли строка SQL инъекцией
   */
  static hasSqlInjectionPattern(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FROM|WHERE|JOIN|ORDER BY|GROUP BY|HAVING)\b)/i,
      /(--|\||;|\/\*|\*\/|xp_|sp_|0x)/i,
      /(\bOR\b\s*\d+\s*=\s*\d+|\bAND\b\s*\d+\s*=\s*\d+)/i,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        logger.warn("SQL injection pattern detected", {
          pattern: pattern.toString(),
        });
        return true;
      }
    }

    return false;
  }
}

// Middleware для валидации всех входящих сообщений
export function validateMessage(message: string): {
  isValid: boolean;
  sanitized: string;
  reason?: string;
} {
  // Проверка на пустое сообщение
  if (!message || message.trim().length === 0) {
    return {
      isValid: false,
      sanitized: "",
      reason: "Empty message",
    };
  }

  // Проверка на спам
  if (Validator.isSpamContent(message)) {
    return {
      isValid: false,
      sanitized: "",
      reason: "Spam content detected",
    };
  }

  // Проверка на SQL инъекции
  if (Validator.hasSqlInjectionPattern(message)) {
    return {
      isValid: false,
      sanitized: "",
      reason: "Suspicious pattern detected",
    };
  }

  // Очистка и валидация
  const sanitized = Validator.sanitizeUserInput(message, 4000);

  return {
    isValid: true,
    sanitized,
  };
}
