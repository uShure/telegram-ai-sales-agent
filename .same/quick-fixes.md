# 🚀 Быстрые исправления

## 1. Создание отсутствующих типов

### Создайте файл `src/data/dna-course-special.d.ts`:
```typescript
export declare const DNA_COURSE_PRESENTATION: string;
export declare function isDNACourseRequest(text: string): boolean;
```

### Добавьте в `src/database/coursesDB.ts`:
```typescript
export interface ExternalCourse {
  id: number;
  name: string;
  price: number;
  url: string;
  format?: string;
}
```

## 2. Исправление импортов

Замените во всех файлах:
- `import fs from 'fs'` → `import fs from 'node:fs'`
- `import path from 'path'` → `import path from 'node:path'`
- `import { promisify } from 'util'` → `import { promisify } from 'node:util'`

## 3. Создание отсутствующего модуля

### Создайте файл `src/telegram/telegramClient.ts`:
```typescript
export class TelegramBot {
  // Добавьте базовую реализацию или интерфейс
}
```

## 4. Исправление типов в `aiAgent.ts`

Строка 502, замените:
```typescript
suggestedProducts: suggestedCourses.slice(0, 3).map(c => c.id.toString()),
```

## 5. Добавление метода в `coursesDB.ts`:
```typescript
async getCategories(): Promise<string[]> {
  const query = `SELECT DISTINCT category FROM courses WHERE active = 1`;
  const rows = this.db.prepare(query).all() as {category: string}[];
  return rows.map(r => r.category);
}
```

## 6. Команды для автоматического исправления линтера:

```bash
# Исправить форматирование
cd telegram-ai-sales-agent
bunx biome format --write src/

# Исправить простые проблемы линтера
bunx biome lint --write src/
```

## 7. Добавление валидации окружения

Создайте файл `src/config/env.ts`:
```typescript
import dotenv from 'dotenv';
dotenv.config();

function validateEnv() {
  const required = [
    'API_ID',
    'API_HASH',
    'OPENAI_API_KEY',
    'TELEGRAM_BOT_TOKEN'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

validateEnv();

export const config = {
  apiId: parseInt(process.env.API_ID!),
  apiHash: process.env.API_HASH!,
  openaiKey: process.env.OPENAI_API_KEY!,
  botToken: process.env.TELEGRAM_BOT_TOKEN!,
  phoneNumber: process.env.PHONE_NUMBER,
  databasePath: process.env.DATABASE_PATH || './conversations.db',
  coursesDbPath: process.env.COURSES_DB_PATH || './courses.db',
};
```

## 8. Простой логгер

Создайте файл `src/utils/logger.ts`:
```typescript
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
  }
};
```

## 9. Rate Limiter

Создайте файл `src/utils/rateLimiter.ts`:
```typescript
export class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Удаляем старые запросы
    const validRequests = userRequests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(userId, validRequests);
    return true;
  }
}
```

## 10. Команда для запуска всех исправлений:

```bash
#!/bin/bash
# fix-all.sh

echo "🔧 Начинаем исправление проблем..."

# Установка зависимостей
echo "📦 Установка зависимостей..."
bun install

# Форматирование кода
echo "🎨 Форматирование кода..."
bunx biome format --write src/

# Исправление линтера
echo "🔍 Исправление проблем линтера..."
bunx biome lint --write src/

# Проверка TypeScript
echo "📝 Проверка TypeScript..."
bunx tsc --noEmit

echo "✅ Готово!"
```

Сохраните как `fix-all.sh` и выполните:
```bash
chmod +x fix-all.sh
./fix-all.sh
```
