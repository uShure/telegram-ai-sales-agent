import { logger } from "./logger";

export interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
  blockDurationMs?: number;
}

export class RateLimiter {
  private requests = new Map<string, number[]>();
  private blocked = new Map<string, number>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;

  constructor(options: RateLimitOptions = {}) {
    this.maxRequests = options.maxRequests || 10;
    this.windowMs = options.windowMs || 60000; // 1 минута
    this.blockDurationMs = options.blockDurationMs || 300000; // 5 минут блокировки

    // Очистка старых записей каждые 10 минут
    setInterval(() => this.cleanup(), 600000);
  }

  /**
   * Проверяет, может ли пользователь сделать запрос
   */
  canMakeRequest(userId: string): boolean {
    // Проверяем, не заблокирован ли пользователь
    if (this.isBlocked(userId)) {
      return false;
    }

    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Удаляем старые запросы за пределами окна
    const validRequests = userRequests.filter(
      (time) => now - time < this.windowMs,
    );

    // Проверяем лимит
    if (validRequests.length >= this.maxRequests) {
      // Блокируем пользователя
      this.blockUser(userId);
      logger.warn("User rate limited", {
        userId,
        requests: validRequests.length,
      });
      return false;
    }

    // Добавляем новый запрос
    validRequests.push(now);
    this.requests.set(userId, validRequests);

    return true;
  }

  /**
   * Проверяет, заблокирован ли пользователь
   */
  private isBlocked(userId: string): boolean {
    const blockedUntil = this.blocked.get(userId);
    if (!blockedUntil) return false;

    const now = Date.now();
    if (now < blockedUntil) {
      return true;
    }

    // Разблокируем пользователя
    this.blocked.delete(userId);
    return false;
  }

  /**
   * Блокирует пользователя
   */
  private blockUser(userId: string) {
    const blockedUntil = Date.now() + this.blockDurationMs;
    this.blocked.set(userId, blockedUntil);
    logger.info("User blocked for rate limiting", {
      userId,
      blockedUntilMs: this.blockDurationMs,
    });
  }

  /**
   * Очищает старые записи для экономии памяти
   */
  private cleanup() {
    const now = Date.now();

    // Очищаем старые запросы
    for (const [userId, requests] of this.requests.entries()) {
      const validRequests = requests.filter(
        (time) => now - time < this.windowMs,
      );
      if (validRequests.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, validRequests);
      }
    }

    // Очищаем истекшие блокировки
    for (const [userId, blockedUntil] of this.blocked.entries()) {
      if (now >= blockedUntil) {
        this.blocked.delete(userId);
      }
    }

    logger.debug("Rate limiter cleanup completed", {
      activeUsers: this.requests.size,
      blockedUsers: this.blocked.size,
    });
  }

  /**
   * Получает статистику rate limiter
   */
  getStats() {
    return {
      activeUsers: this.requests.size,
      blockedUsers: this.blocked.size,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      blockDurationMs: this.blockDurationMs,
    };
  }

  /**
   * Сбрасывает лимиты для пользователя (для админов)
   */
  resetUser(userId: string) {
    this.requests.delete(userId);
    this.blocked.delete(userId);
    logger.info("User rate limits reset", { userId });
  }
}

// Создаем глобальный экземпляр
export const globalRateLimiter = new RateLimiter({
  maxRequests: Number.parseInt(process.env.RATE_LIMIT_REQUESTS || "10"),
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
  blockDurationMs: Number.parseInt(process.env.RATE_LIMIT_BLOCK_MS || "300000"),
});
