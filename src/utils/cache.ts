import { logger } from "./logger";

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly ttl: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize = 100, ttlMs = 3600000) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;

    // Очистка устаревших записей каждые 10 минут
    setInterval(() => this.cleanup(), 600000);
  }

  /**
   * Получает значение из кеша
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Проверяем TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Увеличиваем счетчик попаданий
    entry.hits++;
    this.hits++;

    return entry.value;
  }

  /**
   * Сохраняет значение в кеше
   */
  set(key: string, value: T): void {
    // Проверяем размер кеша
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Удаляет значение из кеша
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Очищает весь кеш
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    logger.info("Cache cleared");
  }

  /**
   * Вытесняет наименее используемый элемент
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let minHits = Number.POSITIVE_INFINITY;
    const oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      // Приоритет: сначала по количеству обращений, потом по времени
      const score = entry.hits * 1000 + (Date.now() - entry.timestamp);
      if (score < minHits) {
        minHits = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      logger.debug("Cache entry evicted", { key: lruKey });
    }
  }

  /**
   * Очищает устаревшие записи
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug("Cache cleanup completed", { removed });
    }
  }

  /**
   * Получает статистику кеша
   */
  getStats() {
    const hitRate =
      this.hits + this.misses > 0
        ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(2)
        : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      ttlMs: this.ttl,
    };
  }
}

// Специализированные кеши для разных типов данных

// Кеш для ответов AI
export const aiResponseCache = new Cache<string>(50, 1800000); // 30 минут

// Кеш для данных пользователей
export const userCache = new Cache<any>(200, 3600000); // 1 час

// Кеш для курсов
export const coursesCache = new Cache<any[]>(10, 7200000); // 2 часа

// Функция для создания ключа кеша на основе запроса
export function createCacheKey(...args: any[]): string {
  return args
    .map((arg) => {
      if (typeof arg === "object") {
        return JSON.stringify(arg);
      }
      return String(arg);
    })
    .join(":");
}
