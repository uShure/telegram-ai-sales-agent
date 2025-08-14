import fs from "node:fs";
import path from "node:path";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private logLevel: LogLevel;
  private logFile: string;
  private errorFile: string;

  constructor() {
    this.logLevel = this.getLogLevel();

    // Создаем директорию для логов если её нет
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logFile = path.join(logsDir, "app.log");
    this.errorFile = path.join(logsDir, "error.log");
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    switch (level) {
      case "ERROR":
        return LogLevel.ERROR;
      case "WARN":
        return LogLevel.WARN;
      case "DEBUG":
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : "";
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  private writeToFile(file: string, message: string) {
    try {
      fs.appendFileSync(file, message + "\n");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    // Создаем копию объекта
    const sanitized = JSON.parse(JSON.stringify(data));

    // Список чувствительных ключей
    const sensitiveKeys = [
      "password",
      "token",
      "key",
      "secret",
      "api_key",
      "apiKey",
    ];

    const sanitizeObject = (obj: any) => {
      for (const key in obj) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
          obj[key] = "[REDACTED]";
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };

    if (typeof sanitized === "object") {
      sanitizeObject(sanitized);
    }

    return sanitized;
  }

  error(message: string, error?: any) {
    if (this.logLevel >= LogLevel.ERROR) {
      const sanitized = this.sanitizeData(error);
      const formatted = this.formatMessage("ERROR", message, sanitized);
      console.error(formatted);
      this.writeToFile(this.errorFile, formatted);
      this.writeToFile(this.logFile, formatted);
    }
  }

  warn(message: string, data?: any) {
    if (this.logLevel >= LogLevel.WARN) {
      const sanitized = this.sanitizeData(data);
      const formatted = this.formatMessage("WARN", message, sanitized);
      console.warn(formatted);
      this.writeToFile(this.logFile, formatted);
    }
  }

  info(message: string, data?: any) {
    if (this.logLevel >= LogLevel.INFO) {
      const sanitized = this.sanitizeData(data);
      const formatted = this.formatMessage("INFO", message, sanitized);
      console.log(formatted);
      this.writeToFile(this.logFile, formatted);
    }
  }

  debug(message: string, data?: any) {
    if (this.logLevel >= LogLevel.DEBUG) {
      const sanitized = this.sanitizeData(data);
      const formatted = this.formatMessage("DEBUG", message, sanitized);
      console.log(formatted);
      this.writeToFile(this.logFile, formatted);
    }
  }

  // Метод для ротации логов (для VDS с ограниченным местом)
  async rotateLogs() {
    const maxSize = 10 * 1024 * 1024; // 10 MB

    try {
      const stats = fs.statSync(this.logFile);
      if (stats.size > maxSize) {
        const timestamp = new Date().toISOString().replace(/:/g, "-");
        const archivePath = path.join(
          path.dirname(this.logFile),
          `app-${timestamp}.log`,
        );
        fs.renameSync(this.logFile, archivePath);
        this.info("Log file rotated", { oldFile: archivePath });
      }
    } catch (error) {
      // Файл не существует или другая ошибка - игнорируем
    }
  }
}

export const logger = new Logger();

// Ротация логов каждые 24 часа
setInterval(
  () => {
    logger.rotateLogs();
  },
  24 * 60 * 60 * 1000,
);
