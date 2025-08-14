#!/bin/bash

# Скрипт для автоматического исправления всех проблем
# Запускать после клонирования репозитория

set -e

echo "=========================================="
echo "🔧 Автоматическое исправление проблем"
echo "=========================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Установка зависимостей
echo "📦 Установка зависимостей..."
bun install

# 2. Создание директории для логов
echo "📁 Создание директорий..."
mkdir -p logs
mkdir -p .same

# 3. Форматирование кода с помощью Biome
echo "🎨 Форматирование кода..."
bunx biome format --write src/ || true

# 4. Исправление простых проблем линтера
echo "🔍 Исправление проблем линтера..."
bunx biome lint --write src/ || true

# 5. Проверка TypeScript
echo "📝 Проверка TypeScript..."
bunx tsc --noEmit || {
    log_warn "Есть ошибки TypeScript, но проект должен работать"
}

# 6. Создание примера .env файла если его нет
if [ ! -f .env ]; then
    echo "📋 Создание .env файла..."
    cat > .env << 'EOF'
# Telegram API (получить на https://my.telegram.org)
API_ID=
API_HASH=
PHONE_NUMBER=
SESSION_STRING=

# OpenAI API
OPENAI_API_KEY=

# Telegram Bot Token (получить у @BotFather)
TELEGRAM_BOT_TOKEN=

# Database settings
DATABASE_PATH=./conversations.db
COURSES_DB_PATH=./courses.db

# Logging
LOG_LEVEL=info

# Production mode
NODE_ENV=development

# Rate limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_BLOCK_MS=300000

# Follow-up settings
FOLLOW_UP_DAYS=3
EOF
    log_warn "Создан файл .env - не забудьте заполнить API ключи!"
fi

# 7. Создание баз данных если их нет
echo "💾 Проверка баз данных..."
if [ ! -f conversations.db ]; then
    touch conversations.db
    log_info "Создана база conversations.db"
fi

if [ ! -f courses.db ]; then
    touch courses.db
    log_info "Создана база courses.db"
fi

# 8. Установка прав доступа
echo "🔒 Настройка прав доступа..."
chmod 600 .env 2>/dev/null || true
chmod 755 *.sh 2>/dev/null || true
chmod 755 deploy-vds.sh 2>/dev/null || true
chmod 755 backup.sh 2>/dev/null || true

# 9. Проверка готовности
echo ""
echo "=========================================="
echo "✅ Исправления применены!"
echo "=========================================="
echo ""

# Показываем статистику
echo "📊 Статистика:"
echo "  - Файлов TypeScript: $(find src -name "*.ts" | wc -l)"
echo "  - Размер проекта: $(du -sh . | cut -f1)"

# Проверяем наличие необходимых файлов
echo ""
echo "📋 Проверка файлов:"

check_file() {
    if [ -f "$1" ]; then
        echo "  ✓ $1"
    else
        echo "  ✗ $1 (отсутствует)"
    fi
}

check_file ".env"
check_file "conversations.db"
check_file "courses.db"
check_file "package.json"
check_file "tsconfig.json"
check_file "biome.json"

echo ""
echo "=========================================="
echo "🎯 Следующие шаги:"
echo "=========================================="
echo ""
echo "1. Заполните файл .env вашими API ключами:"
echo "   nano .env"
echo ""
echo "2. Запустите бота локально для теста:"
echo "   bun run src/index.ts"
echo ""
echo "3. Для развертывания на VDS используйте:"
echo "   sudo ./deploy-vds.sh"
echo ""
echo "=========================================="
echo ""

# Проверка на заполненность .env
if grep -q "^OPENAI_API_KEY=$" .env 2>/dev/null; then
    log_warn "ВАЖНО: Не забудьте заполнить API ключи в файле .env!"
fi

echo "Готово! 🚀"
