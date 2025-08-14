#!/bin/bash

# ===============================================
# 🔍 Диагностика проблем Telegram Bot
# ===============================================

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo "==============================================="
echo -e "${CYAN}🔍 ДИАГНОСТИКА TELEGRAM BOT${NC}"
echo "==============================================="
echo ""

# ===============================================
# 1. ПРОВЕРКА СИСТЕМНЫХ ТРЕБОВАНИЙ
# ===============================================
echo -e "${BLUE}1. Проверка системных требований${NC}"
echo "-----------------------------------"

# Проверка Bun
echo -n "Bun установлен: "
if /root/.bun/bin/bun --version > /dev/null 2>&1; then
    echo -e "${GREEN}✓ $(/root/.bun/bin/bun --version)${NC}"
else
    echo -e "${RED}✗ Не найден${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Проверка Git
echo -n "Git установлен: "
if git --version > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Проверка SQLite
echo -n "SQLite установлен: "
if sqlite3 --version > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ===============================================
# 2. ПРОВЕРКА ФАЙЛОВ И ДИРЕКТОРИЙ
# ===============================================
echo -e "${BLUE}2. Проверка файлов и директорий${NC}"
echo "-----------------------------------"

# Проверка директории приложения
APP_DIR="/home/telegram-bot/app"
echo -n "Директория приложения: "
if [ -d "$APP_DIR" ]; then
    echo -e "${GREEN}✓ Существует${NC}"

    # Проверка основных файлов
    echo -n "  package.json: "
    if [ -f "$APP_DIR/package.json" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        ERRORS=$((ERRORS + 1))
    fi

    echo -n "  src/index.ts: "
    if [ -f "$APP_DIR/src/index.ts" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        ERRORS=$((ERRORS + 1))
    fi

    echo -n "  .env: "
    if [ -f "$APP_DIR/.env" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗ Не найден${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗ Не существует${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ===============================================
# 3. ПРОВЕРКА КОНФИГУРАЦИИ
# ===============================================
echo -e "${BLUE}3. Проверка конфигурации${NC}"
echo "-----------------------------------"

if [ -f "$APP_DIR/.env" ]; then
    # Проверка обязательных переменных
    echo "Проверка API ключей:"

    echo -n "  API_ID: "
    if grep -q "^API_ID=..*" "$APP_DIR/.env" && ! grep -q "^API_ID=$" "$APP_DIR/.env"; then
        echo -e "${GREEN}✓ Заполнен${NC}"
    else
        echo -e "${RED}✗ Не заполнен${NC}"
        ERRORS=$((ERRORS + 1))
    fi

    echo -n "  API_HASH: "
    if grep -q "^API_HASH=..*" "$APP_DIR/.env" && ! grep -q "^API_HASH=$" "$APP_DIR/.env"; then
        echo -e "${GREEN}✓ Заполнен${NC}"
    else
        echo -e "${RED}✗ Не заполнен${NC}"
        ERRORS=$((ERRORS + 1))
    fi

    echo -n "  PHONE_NUMBER: "
    if grep -q "^PHONE_NUMBER=+.*" "$APP_DIR/.env"; then
        echo -e "${GREEN}✓ Заполнен${NC}"
    else
        echo -e "${RED}✗ Не заполнен${NC}"
        ERRORS=$((ERRORS + 1))
    fi

    echo -n "  OPENAI_API_KEY: "
    if grep -q "^OPENAI_API_KEY=sk-.*" "$APP_DIR/.env"; then
        echo -e "${GREEN}✓ Заполнен${NC}"
    else
        echo -e "${RED}✗ Не заполнен или неверный формат${NC}"
        ERRORS=$((ERRORS + 1))
    fi

    echo -n "  TELEGRAM_BOT_TOKEN: "
    if grep -q "^TELEGRAM_BOT_TOKEN=[0-9].*:.*" "$APP_DIR/.env"; then
        echo -e "${GREEN}✓ Заполнен${NC}"
        BOT_TOKEN=$(grep "^TELEGRAM_BOT_TOKEN=" "$APP_DIR/.env" | cut -d= -f2)
    else
        echo -e "${RED}✗ Не заполнен или неверный формат${NC}"
        ERRORS=$((ERRORS + 1))
    fi

    echo -n "  Прокси настроен: "
    if grep -q "^HTTPS_PROXY=.*" "$APP_DIR/.env" || grep -q "^HTTP_PROXY=.*" "$APP_DIR/.env"; then
        echo -e "${GREEN}✓${NC}"
        PROXY_URL=$(grep "^HTTPS_PROXY=" "$APP_DIR/.env" | cut -d= -f2)
        if [ -z "$PROXY_URL" ]; then
            PROXY_URL=$(grep "^HTTP_PROXY=" "$APP_DIR/.env" | cut -d= -f2)
        fi
        echo "    Прокси: $PROXY_URL"
    else
        echo -e "${YELLOW}⚠ Не настроен (может потребоваться для OpenAI)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}Файл .env не найден!${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ===============================================
# 4. ПРОВЕРКА СЕРВИСА
# ===============================================
echo -e "${BLUE}4. Проверка systemd сервиса${NC}"
echo "-----------------------------------"

echo -n "Сервис telegram-bot: "
if systemctl is-enabled telegram-bot > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Включен${NC}"

    echo -n "  Статус: "
    if systemctl is-active --quiet telegram-bot; then
        echo -e "${GREEN}✓ Работает${NC}"
    else
        echo -e "${RED}✗ Остановлен${NC}"
        ERRORS=$((ERRORS + 1))

        # Показываем последние ошибки
        echo ""
        echo -e "${YELLOW}Последние записи в журнале:${NC}"
        journalctl -u telegram-bot -n 10 --no-pager
    fi
else
    echo -e "${RED}✗ Не найден${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ===============================================
# 5. ПРОВЕРКА ПРОЦЕССОВ
# ===============================================
echo -e "${BLUE}5. Проверка процессов${NC}"
echo "-----------------------------------"

echo -n "Процесс Bun: "
if pgrep -f "bun run" > /dev/null; then
    echo -e "${GREEN}✓ Запущен${NC}"
    echo "  PID: $(pgrep -f 'bun run')"
else
    echo -e "${RED}✗ Не запущен${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ===============================================
# 6. ПРОВЕРКА ЛОГОВ
# ===============================================
echo -e "${BLUE}6. Проверка логов${NC}"
echo "-----------------------------------"

LOG_DIR="$APP_DIR/logs"
if [ -d "$LOG_DIR" ]; then
    echo "Директория логов существует"

    if [ -f "$LOG_DIR/bot.log" ]; then
        echo "Последние записи в bot.log:"
        tail -5 "$LOG_DIR/bot.log" 2>/dev/null | sed 's/^/  /'
    fi

    if [ -f "$LOG_DIR/bot-error.log" ]; then
        ERROR_COUNT=$(wc -l < "$LOG_DIR/bot-error.log" 2>/dev/null || echo 0)
        if [ "$ERROR_COUNT" -gt 0 ]; then
            echo -e "${YELLOW}Найдено ошибок в логах: $ERROR_COUNT${NC}"
            echo "Последние ошибки:"
            tail -5 "$LOG_DIR/bot-error.log" 2>/dev/null | sed 's/^/  /'
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
else
    echo -e "${YELLOW}Директория логов не найдена${NC}"
fi

echo ""

# ===============================================
# 7. ПРОВЕРКА ПОДКЛЮЧЕНИЯ К API
# ===============================================
echo -e "${BLUE}7. Проверка подключения к API${NC}"
echo "-----------------------------------"

# Проверка Telegram Bot API
if [ -n "$BOT_TOKEN" ]; then
    echo -n "Telegram Bot API: "

    # Используем прокси если настроен
    if [ -n "$PROXY_URL" ]; then
        export https_proxy="$PROXY_URL"
        export http_proxy="$PROXY_URL"
    fi

    RESPONSE=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getMe" 2>/dev/null)

    if echo "$RESPONSE" | grep -q '"ok":true'; then
        echo -e "${GREEN}✓ Доступен${NC}"
        BOT_USERNAME=$(echo "$RESPONSE" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
        echo "  Bot username: @$BOT_USERNAME"
    else
        echo -e "${RED}✗ Недоступен${NC}"
        echo "  Ответ: $(echo $RESPONSE | head -c 100)"
        ERRORS=$((ERRORS + 1))
    fi

    unset https_proxy http_proxy
else
    echo -e "${YELLOW}⚠ Токен бота не найден${NC}"
fi

# Проверка OpenAI API через прокси
echo -n "OpenAI API: "
if [ -n "$PROXY_URL" ]; then
    if curl -s --socks5 127.0.0.1:1080 --max-time 10 https://api.openai.com/v1/models > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Доступен через прокси${NC}"
    elif [ -n "$PROXY_URL" ]; then
        export https_proxy="$PROXY_URL"
        if curl -s --max-time 10 https://api.openai.com/v1/models > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Доступен через прокси${NC}"
        else
            echo -e "${RED}✗ Недоступен${NC}"
            ERRORS=$((ERRORS + 1))
        fi
        unset https_proxy
    fi
else
    if curl -s --max-time 10 https://api.openai.com/v1/models > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Доступен напрямую${NC}"
    else
        echo -e "${YELLOW}⚠ Недоступен (нужен прокси)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""

# ===============================================
# 8. ПРОВЕРКА БАЗ ДАННЫХ
# ===============================================
echo -e "${BLUE}8. Проверка баз данных${NC}"
echo "-----------------------------------"

echo -n "conversations.db: "
if [ -f "$APP_DIR/conversations.db" ]; then
    SIZE=$(du -h "$APP_DIR/conversations.db" | cut -f1)
    echo -e "${GREEN}✓ Существует ($SIZE)${NC}"

    # Проверка целостности
    if sqlite3 "$APP_DIR/conversations.db" "PRAGMA integrity_check;" | grep -q "ok"; then
        echo "  Целостность: ✓"
    else
        echo -e "  Целостность: ${RED}✗ Повреждена${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠ Не существует (будет создана при первом запуске)${NC}"
fi

echo -n "courses.db: "
if [ -f "$APP_DIR/courses.db" ]; then
    SIZE=$(du -h "$APP_DIR/courses.db" | cut -f1)
    echo -e "${GREEN}✓ Существует ($SIZE)${NC}"
else
    echo -e "${YELLOW}⚠ Не существует${NC}"
fi

echo ""

# ===============================================
# ИТОГОВЫЙ ОТЧЕТ
# ===============================================
echo "==============================================="
echo -e "${CYAN}📊 ИТОГОВЫЙ ОТЧЕТ${NC}"
echo "==============================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Все проверки пройдены успешно!${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Обнаружено предупреждений: $WARNINGS${NC}"
else
    echo -e "${RED}❌ Обнаружено ошибок: $ERRORS${NC}"
    [ $WARNINGS -gt 0 ] && echo -e "${YELLOW}⚠ Предупреждений: $WARNINGS${NC}"
fi

echo ""

# ===============================================
# РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ
# ===============================================
if [ $ERRORS -gt 0 ] || [ $WARNINGS -gt 0 ]; then
    echo -e "${BLUE}🔧 РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ${NC}"
    echo "==============================================="

    # Если нет .env
    if [ ! -f "$APP_DIR/.env" ]; then
        echo ""
        echo "1. Создайте файл конфигурации:"
        echo "   cp $APP_DIR/.env.example $APP_DIR/.env"
        echo "   bot config"
    fi

    # Если сервис не работает
    if ! systemctl is-active --quiet telegram-bot 2>/dev/null; then
        echo ""
        echo "2. Запустите бота:"
        echo "   bot start"
        echo ""
        echo "   Или попробуйте запустить вручную для отладки:"
        echo "   cd $APP_DIR"
        echo "   /root/.bun/bin/bun run src/index.ts"
    fi

    # Если нет прокси для OpenAI
    if [ -z "$PROXY_URL" ] && ! curl -s --max-time 5 https://api.openai.com/v1/models > /dev/null 2>&1; then
        echo ""
        echo "3. Настройте прокси для OpenAI:"
        echo "   wget https://raw.githubusercontent.com/uShure/telegram-ai-sales-agent/main/setup-vless-proxy.sh"
        echo "   chmod +x setup-vless-proxy.sh"
        echo "   ./setup-vless-proxy.sh"
    fi

    # Если API ключи не заполнены
    if grep -q "^OPENAI_API_KEY=$\|^TELEGRAM_BOT_TOKEN=$\|^API_ID=$" "$APP_DIR/.env" 2>/dev/null; then
        echo ""
        echo "4. Заполните API ключи:"
        echo "   ./quick-setup.sh"
        echo "   или"
        echo "   bot config"
    fi
fi

echo ""
echo "==============================================="
echo -e "${BLUE}📌 ПОЛЕЗНЫЕ КОМАНДЫ${NC}"
echo "==============================================="
echo "bot status   - проверить статус бота"
echo "bot logs     - просмотр логов"
echo "bot errors   - просмотр ошибок"
echo "bot restart  - перезапустить бота"
echo "bot config   - редактировать конфигурацию"
echo "proxy test   - проверить прокси"
echo ""

# Предложение автоматического исправления
if [ $ERRORS -gt 0 ]; then
    echo "==============================================="
    echo -e "${YELLOW}Хотите попытаться автоматически исправить проблемы? (y/n)${NC}"
    read -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${GREEN}Запуск автоматического исправления...${NC}"

        # Запускаем скрипт исправления
        if [ -f "/root/fix-and-continue-setup.sh" ]; then
            /root/fix-and-continue-setup.sh
        else
            wget https://raw.githubusercontent.com/uShure/telegram-ai-sales-agent/main/fix-and-continue-setup.sh
            chmod +x fix-and-continue-setup.sh
            ./fix-and-continue-setup.sh
        fi
    fi
fi
