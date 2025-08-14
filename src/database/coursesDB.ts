import { Database } from "bun:sqlite";
import path from "node:path";
import { formatCourseDate } from "../data/courseDates";
import { logger } from "../utils/logger";
import { coursesCache, createCacheKey } from "../utils/cache";

// Интерфейс курса из базы данных
export interface Course {
  id: number;
  name: string;
  price: number;
  description: string;
  duration: string;
  benefits: string;
  targetAudience: string;
  curriculum: string;
  enrollmentUrl: string;
  active: number;
  format?: string; // онлайн/офлайн
  category?: string;
}

// Экспортируем для совместимости
export interface ExternalCourse extends Course {
  url: string;
}

class CoursesDatabase {
  private db: Database;

  constructor() {
    const dbPath = path.join(process.cwd(), "courses.db");
    console.log("📚 Подключение к базе данных курсов:", dbPath);

    try {
      this.db = new Database(dbPath);
      console.log("✅ База данных курсов подключена");
    } catch (err) {
      console.error("❌ Ошибка подключения к базе курсов:", err);
      throw err;
    }
  }

  // Получить все активные курсы
  async getAllCourses(): Promise<Course[]> {
    try {
      const query = `
        SELECT * FROM courses
        WHERE active = 1
        ORDER BY price ASC
      `;
      const rows = this.db.prepare(query).all() as Course[];
      console.log(`✅ Загружено ${rows.length} курсов из базы`);
      return rows;
    } catch (err) {
      console.error("❌ Ошибка получения курсов:", err);
      return [];
    }
  }

  // Получить курс по ID
  async getCourseById(id: number): Promise<Course | null> {
    try {
      const query = `SELECT * FROM courses WHERE id = ? AND active = 1`;
      const course = this.db.prepare(query).get(id) as Course | undefined;
      return course || null;
    } catch (err) {
      console.error("❌ Ошибка получения курса:", err);
      return null;
    }
  }

  // Получить курс по названию (частичное совпадение)
  async getCourseByName(name: string): Promise<Course | null> {
    try {
      const query = `SELECT * FROM courses WHERE name LIKE ? AND active = 1 LIMIT 1`;
      const course = this.db.prepare(query).get(`%${name}%`) as
        | Course
        | undefined;
      return course || null;
    } catch (err) {
      console.error("❌ Ошибка получения курса по имени:", err);
      return null;
    }
  }

  // Получить курсы по формату (онлайн/офлайн)
  async getCoursesByFormat(format: string): Promise<Course[]> {
    try {
      const query = `
        SELECT * FROM courses
        WHERE format = ? AND active = 1
        ORDER BY price ASC
      `;
      const rows = this.db.prepare(query).all(format) as Course[];
      console.log(`✅ Найдено курсов с форматом '${format}': ${rows.length}`);
      return rows;
    } catch (err) {
      console.error("❌ Ошибка получения курсов по формату:", err);
      return [];
    }
  }

  // Получить курсы в ценовом диапазоне
  async getCoursesByPriceRange(
    minPrice: number,
    maxPrice: number,
  ): Promise<Course[]> {
    try {
      const query = `
        SELECT * FROM courses
        WHERE price >= ? AND price <= ? AND active = 1
        ORDER BY price ASC
      `;
      const rows = this.db.prepare(query).all(minPrice, maxPrice) as Course[];
      console.log(
        `✅ Найдено курсов в диапазоне ${minPrice}-${maxPrice}: ${rows.length}`,
      );
      return rows;
    } catch (err) {
      console.error("❌ Ошибка получения курсов по цене:", err);
      return [];
    }
  }

  // Поиск курсов по ключевым словам
  async searchCourses(keywords: string) {
    logger.info(`Поиск курсов по ключевым словам: "${keywords}"`);

    // Проверяем кеш
    const cacheKey = createCacheKey("search", keywords);
    const cached = coursesCache.get(cacheKey);
    if (cached) {
      logger.debug("Courses found in cache");
      return cached;
    }

    // Создаем варианты паттерна для поиска
    const patterns = [
      `%${keywords}%`,
      `%${keywords.toLowerCase()}%`,
      `%${keywords.charAt(0).toUpperCase() + keywords.slice(1).toLowerCase()}%`,
      `%${keywords.toUpperCase()}%`,
    ];

    const query = `
      SELECT DISTINCT * FROM courses
      WHERE (
        name LIKE ? OR name LIKE ? OR name LIKE ? OR name LIKE ? OR
        description LIKE ? OR description LIKE ? OR description LIKE ? OR description LIKE ? OR
        targetAudience LIKE ? OR targetAudience LIKE ? OR targetAudience LIKE ? OR targetAudience LIKE ? OR
        benefits LIKE ? OR benefits LIKE ? OR benefits LIKE ? OR benefits LIKE ?
      ) AND active = 1
      ORDER BY price ASC
    `;

    try {
      const stmt = this.db.prepare(query);
      const rows = stmt.all(
        ...patterns,
        ...patterns,
        ...patterns,
        ...patterns,
      ) as Course[];
      if (rows.length > 0) {
        logger.info(
          `Найденные курсы: ${rows.map((r: any) => r.name).join(", ")}`,
        );
        coursesCache.set(cacheKey, rows);
      }
      return rows;
    } catch (err) {
      logger.error("Ошибка поиска курсов:", err);
      return [];
    }
  }

  // Получить список категорий
  async getCategories(): Promise<string[]> {
    try {
      const cacheKey = "categories";
      const cached = coursesCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const query = `SELECT DISTINCT category FROM courses WHERE active = 1 AND category IS NOT NULL`;
      const rows = this.db.prepare(query).all() as { category: string }[];
      const categories = rows.map((r) => r.category).filter(Boolean);

      coursesCache.set(cacheKey, categories);
      logger.info(`Загружено категорий: ${categories.length}`);
      return categories;
    } catch (err) {
      logger.error("Ошибка получения категорий:", err);
      return [];
    }
  }

  // Форматировать курс для отображения
  formatCourseInfo(course: Course): string {
    let info = `\n📚 ${course.name}\n`;

    // ИНФОРМАЦИЯ О КУРСЕ
    info += `\n📋 ИНФОРМАЦИЯ О КУРСЕ:\n`;

    // ФОРМАТ ОБУЧЕНИЯ
    if (course.format) {
      if (course.format.toLowerCase() === "онлайн") {
        info += `📱 Формат: Онлайн обучение\n`;
      } else if (course.format.toLowerCase() === "офлайн") {
        info += `🏢 Формат: Очное обучение в академии\n`;
      }
    }

    // ЦЕНА - ТОЧНАЯ ИЗ БАЗЫ ДАННЫХ
    info += `💰 СТОИМОСТЬ: ${course.price.toLocaleString("ru-RU")} ₽\n`;
    info += `⏱ Длительность: ${course.duration}\n`;
    info += `🔗 Подробнее: ${course.enrollmentUrl}\n`;
    info += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    // ОПИСАНИЕ КУРСА
    info += `\n📝 ОПИСАНИЕ:\n`;
    info += `${course.description}\n`;

    // ПРЕИМУЩЕСТВА
    info += `\n🎯 ПРЕИМУЩЕСТВА:\n`;
    info += `${course.benefits}\n`;

    // ЦЕЛЕВАЯ АУДИТОРИЯ
    info += `\n👥 ДЛЯ КОГО:\n`;
    info += `${course.targetAudience}\n`;

    // ПРОГРАММА КУРСА
    info += `\n📖 ПРОГРАММА:\n`;
    info += `${course.curriculum}\n`;

    // ДАТА НАЧАЛА
    info += `${formatCourseDate(course.name)}\n`;

    // КАК ЗАПИСАТЬСЯ
    info += `\n📝 КАК ЗАПИСАТЬСЯ:\n`;
    info += `• Перейдите по ссылке выше для подробной информации\n`;
    info += `• На сайте доступна оплата картой или в рассрочку\n`;
    info += `• Если есть вопросы - спрашивайте, я помогу!`;

    return info;
  }

  // Форматировать краткую информацию о курсе
  formatCourseShortInfo(course: Course): string {
    const format = course.format ? ` (${course.format})` : "";
    return (
      `📚 ${course.name}${format}\n` +
      `💰 ${course.price.toLocaleString("ru-RU")} ₽\n` +
      `⏱ ${course.duration}\n` +
      `🔗 ${course.enrollmentUrl}`
    );
  }

  // Закрыть соединение с базой данных
  close(): void {
    try {
      this.db.close();
      console.log("👋 База данных курсов закрыта");
    } catch (err) {
      console.error("❌ Ошибка закрытия базы курсов:", err);
    }
  }
}

// Экспортируем singleton экземпляр
export const coursesDB = new CoursesDatabase();
