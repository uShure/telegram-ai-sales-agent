# SOINTERA AI Sales Agent

Telegram бот для автоматизации продаж курсов SOINTERA с использованием AI.

## 🚀 Установка с нуля

### Требования
- Ubuntu 20.04+ или другой Linux дистрибутив
- Node.js 18+
- Bun 1.0+
- SQLite3

### 1. Установка Bun
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 2. Клонирование репозитория
```bash
git clone https://github.com/YOUR_USERNAME/telegram-ai-sales-agent.git
cd telegram-ai-sales-agent
```

### 3. Установка зависимостей
```bash
bun install
```

### 4. Настройка переменных окружения
Создайте файл `.env` в корне проекта:
```env
# Telegram API (получить на https://my.telegram.org)
API_ID=ваш_api_id
API_HASH=ваш_api_hash
PHONE_NUMBER=ваш_номер_телефона
SESSION_STRING=оставьте_пустым_при_первом_запуске

# OpenAI API
OPENAI_API_KEY=ваш_openai_api_key

# Telegram Bot Token (получить у @BotFather)
TELEGRAM_BOT_TOKEN=ваш_telegram_bot_token

# Прокси для OpenAI (опционально, если нужно)
HTTPS_PROXY=http://your-proxy:port
```

### 5. Создание и настройка баз данных
```bash
# Скрипт автоматически создаст базы данных
bun run fix-all-db.js
```

### 6. Загрузка курсов из файла (опционально)
Если у вас есть файл с курсами, поместите его в `course-data.txt` и выполните:
```bash
bun run update-courses-from-file.js
```

### 7. Создание заглушек для native модулей
```bash
mkdir -p node_modules/bufferutil && echo 'module.exports = {}' > node_modules/bufferutil/index.js
mkdir -p node_modules/utf-8-validate && echo 'module.exports = {}' > node_modules/utf-8-validate/index.js
```

### 8. Первый запуск
```bash
bun start
```

При первом запуске:
1. Введите код подтверждения из Telegram
2. Сессия сохранится автоматически
3. Бот начнет работу

## 📁 Структура проекта
```
telegram-ai-sales-agent/
├── src/
│   ├── index.ts              # Точка входа
│   ├── ai/
│   │   └── aiAgent.ts        # AI логика обработки сообщений
│   ├── database/
│   │   ├── coursesDB.ts      # Работа с базой курсов
│   │   ├── conversationManager.ts # Управление диалогами
│   │   └── database.ts       # Базовые операции с БД
│   └── telegram/
│       └── enhancedTelegramClient.ts # Telegram клиент
├── courses.db                # База данных курсов
├── conversations.db          # База данных диалогов
├── fix-all-db.js            # Скрипт восстановления БД
├── update-courses-from-file.js # Обновление курсов из файла
└── course-data.txt          # Данные курсов (пример)
```

## 🔧 Команды управления
В консоли бота доступны команды:
- `stats` - показать статистику
- `conversations` - список диалогов
- `analyze` - анализ диалога
- `export` - экспорт данных
- `help` - справка
- `exit` - выход

## 🐛 Решение проблем

### SQLITE_CORRUPT ошибка
```bash
bun run fix-all-db.js
```

### Ошибки с native модулями
```bash
# Пересоздать заглушки
rm -rf node_modules/bufferutil node_modules/utf-8-validate
mkdir -p node_modules/bufferutil && echo 'module.exports = {}' > node_modules/bufferutil/index.js
mkdir -p node_modules/utf-8-validate && echo 'module.exports = {}' > node_modules/utf-8-validate/index.js
```

### Проблемы с сессией Telegram
Удалите `anon.session` и перезапустите бота.

## 🚀 Запуск в production

### Использование PM2
```bash
npm install -g pm2
pm2 start "bun start" --name sointera-bot
pm2 save
pm2 startup
```

### Использование systemd
Создайте файл `/etc/systemd/system/sointera-bot.service`:
```ini
[Unit]
Description=SOINTERA AI Sales Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/telegram-ai-sales-agent
ExecStart=/home/your-user/.bun/bin/bun start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Затем:
```bash
sudo systemctl enable sointera-bot
sudo systemctl start sointera-bot
```

## 📊 Мониторинг
Логи бота можно смотреть:
```bash
# PM2
pm2 logs sointera-bot

# systemd
sudo journalctl -u sointera-bot -f
```

## 🔒 Безопасность
- Никогда не коммитьте файл `.env`
- Храните `anon.session` в безопасном месте
- Регулярно делайте бэкапы баз данных
- Используйте прокси для OpenAI API если нужно

## 📝 Лицензия
Proprietary - Все права защищены
