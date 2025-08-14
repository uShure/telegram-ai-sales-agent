import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config();

// Функция для безопасного получения переменной окружения
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

// Функция для валидации конфигурации
function validateConfig() {
  const required = [
    "API_ID",
    "API_HASH",
    "OPENAI_API_KEY",
    "TELEGRAM_BOT_TOKEN",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  // Валидация формата API_ID
  const apiId = process.env.API_ID;
  if (apiId && isNaN(Number.parseInt(apiId))) {
    throw new Error("API_ID must be a valid number");
  }

  // Валидация длины ключей
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.length < 20) {
    throw new Error("OPENAI_API_KEY seems to be invalid");
  }

  logger.info("Environment configuration validated successfully");
}

// Валидируем при загрузке модуля
try {
  validateConfig();
} catch (error) {
  console.error("Configuration validation failed:", error);
  process.exit(1);
}

// Экспортируем безопасную конфигурацию
export const config = {
  // Telegram API
  apiId: Number.parseInt(getEnvVar("API_ID")),
  apiHash: getEnvVar("API_HASH"),
  phoneNumber: process.env.PHONE_NUMBER,
  sessionString: process.env.SESSION_STRING || "",

  // OpenAI
  openaiKey: getEnvVar("OPENAI_API_KEY"),
  openaiBaseUrl: process.env.OPENAI_API_BASE || "https://api.openai.com/v1",

  // Telegram Bot
  botToken: getEnvVar("TELEGRAM_BOT_TOKEN"),

  // Database
  databasePath: process.env.DATABASE_PATH || "./conversations.db",
  coursesDbPath: process.env.COURSES_DB_PATH || "./courses.db",

  // Proxy (optional)
  httpProxy: process.env.HTTP_PROXY,
  httpsProxy: process.env.HTTPS_PROXY,

  // Follow-up settings
  followUpDays: Number.parseInt(process.env.FOLLOW_UP_DAYS || "3"),

  // Security settings
  maxMessageLength: 4000,
  rateLimitRequests: 10,
  rateLimitWindowMs: 60000,

  // Server settings for VDS
  isProduction: process.env.NODE_ENV === "production",
  logLevel: process.env.LOG_LEVEL || "info",
};

// Дополнительные настройки для VDS
export const vdsConfig = {
  // Оптимизация памяти
  maxCacheSize: 100, // Максимальный размер кеша
  cacheCleanupInterval: 3600000, // Очистка кеша каждый час

  // Оптимизация производительности
  dbConnectionPoolSize: 5,
  maxConcurrentRequests: 10,

  // Безопасность
  sessionTimeout: 86400000, // 24 часа
  maxLoginAttempts: 5,
};
