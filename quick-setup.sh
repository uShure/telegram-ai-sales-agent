#!/bin/bash

# ===============================================
# ⚡ Быстрая настройка Telegram AI Sales Agent
# ===============================================

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Проверка существования .env файла
ENV_FILE="/home/telegram-bot/app/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Ошибка: Файл конфигурации не найден!${NC}"
    echo "Сначала запустите cleanup-and-deploy.sh"
    exit 1
fi

clear

echo "==============================================="
echo -e "${CYAN}⚡ БЫСТРАЯ НАСТРОЙКА TELEGRAM BOT${NC}"
echo "==============================================="
echo ""
echo -e "${YELLOW}Этот помощник поможет вам настроить все необходимые API ключи${NC}"
echo ""

# Функция для безопасного обновления .env файла
update_env() {
    local key=$1
    local value=$2

    # Экранируем специальные символы
    value=$(echo "$value" | sed 's/[[\.*^$()+?{|]/\\&/g')

    # Обновляем значение в файле
    sed -i "s/^${key}=.*/${key}=${value}/" "$ENV_FILE"
}

# Функция для получения текущего значения
get_env_value() {
    local key=$1
    grep "^${key}=" "$ENV_FILE" | cut -d'=' -f2
}

# ===============================================
# TELEGRAM API
# ===============================================
echo -e "${BLUE}📱 НАСТРОЙКА TELEGRAM API${NC}"
echo "-----------------------------------"
echo "1. Откройте https://my.telegram.org"
echo "2. Войдите с вашим номером телефона"
echo "3. Перейдите в 'API development tools'"
echo "4. Создайте приложение если еще не создано"
echo ""

# API_ID
CURRENT_API_ID=$(get_env_value "API_ID")
if [ -z "$CURRENT_API_ID" ]; then
    echo -n "Введите API_ID (число): "
    read API_ID
    if [[ "$API_ID" =~ ^[0-9]+$ ]]; then
        update_env "API_ID" "$API_ID"
        echo -e "${GREEN}✓ API_ID сохранен${NC}"
    else
        echo -e "${RED}✗ Неверный формат API_ID${NC}"
    fi
else
    echo -e "${GREEN}✓ API_ID уже настроен: $CURRENT_API_ID${NC}"
    echo -n "Хотите изменить? (y/n): "
    read CHANGE
    if [ "$CHANGE" = "y" ]; then
        echo -n "Введите новый API_ID: "
        read API_ID
        update_env "API_ID" "$API_ID"
        echo -e "${GREEN}✓ API_ID обновлен${NC}"
    fi
fi

# API_HASH
echo ""
CURRENT_API_HASH=$(get_env_value "API_HASH")
if [ -z "$CURRENT_API_HASH" ]; then
    echo -n "Введите API_HASH (строка из 32 символов): "
    read API_HASH
    if [[ ${#API_HASH} -eq 32 ]]; then
        update_env "API_HASH" "$API_HASH"
        echo -e "${GREEN}✓ API_HASH сохранен${NC}"
    else
        echo -e "${RED}✗ API_HASH должен быть 32 символа${NC}"
    fi
else
    echo -e "${GREEN}✓ API_HASH уже настроен${NC}"
    echo -n "Хотите изменить? (y/n): "
    read CHANGE
    if [ "$CHANGE" = "y" ]; then
        echo -n "Введите новый API_HASH: "
        read API_HASH
        update_env "API_HASH" "$API_HASH"
        echo -e "${GREEN}✓ API_HASH обновлен${NC}"
    fi
fi

# PHONE_NUMBER
echo ""
CURRENT_PHONE=$(get_env_value "PHONE_NUMBER")
if [ -z "$CURRENT_PHONE" ]; then
    echo -n "Введите ваш номер телефона (с кодом страны, например +79991234567): "
    read PHONE_NUMBER
    if [[ "$PHONE_NUMBER" =~ ^\+[0-9]+$ ]]; then
        update_env "PHONE_NUMBER" "$PHONE_NUMBER"
        echo -e "${GREEN}✓ Номер телефона сохранен${NC}"
    else
        echo -e "${RED}✗ Номер должен начинаться с + и содержать только цифры${NC}"
    fi
else
    echo -e "${GREEN}✓ Номер телефона уже настроен: $CURRENT_PHONE${NC}"
fi

echo ""

# ===============================================
# OPENAI API
# ===============================================
echo -e "${BLUE}🤖 НАСТРОЙКА OPENAI API${NC}"
echo "-----------------------------------"
echo "1. Откройте https://platform.openai.com/api-keys"
echo "2. Войдите или зарегистрируйтесь"
echo "3. Нажмите 'Create new secret key'"
echo "4. Скопируйте ключ (начинается с sk-)"
echo ""

CURRENT_OPENAI=$(get_env_value "OPENAI_API_KEY")
if [ -z "$CURRENT_OPENAI" ] || [ "$CURRENT_OPENAI" = "sk-your-openai-api-key-here" ]; then
    echo -n "Введите OPENAI_API_KEY: "
    read -s OPENAI_KEY
    echo ""
    if [[ "$OPENAI_KEY" =~ ^sk- ]]; then
        update_env "OPENAI_API_KEY" "$OPENAI_KEY"
        echo -e "${GREEN}✓ OpenAI API ключ сохранен${NC}"
    else
        echo -e "${RED}✗ API ключ должен начинаться с 'sk-'${NC}"
    fi
else
    echo -e "${GREEN}✓ OpenAI API ключ уже настроен${NC}"
    echo -n "Хотите изменить? (y/n): "
    read CHANGE
    if [ "$CHANGE" = "y" ]; then
        echo -n "Введите новый OPENAI_API_KEY: "
        read -s OPENAI_KEY
        echo ""
        update_env "OPENAI_API_KEY" "$OPENAI_KEY"
        echo -e "${GREEN}✓ OpenAI API ключ обновлен${NC}"
    fi
fi

echo ""

# ===============================================
# TELEGRAM BOT TOKEN
# ===============================================
echo -e "${BLUE}🤖 НАСТРОЙКА TELEGRAM BOT${NC}"
echo "-----------------------------------"
echo "1. Откройте @BotFather в Telegram"
echo "2. Отправьте команду /newbot"
echo "3. Введите имя бота (например: Sales Agent)"
echo "4. Введите username бота (должен заканчиваться на 'bot')"
echo "5. Скопируйте токен"
echo ""

CURRENT_TOKEN=$(get_env_value "TELEGRAM_BOT_TOKEN")
if [ -z "$CURRENT_TOKEN" ] || [[ "$CURRENT_TOKEN" == *"123456789"* ]]; then
    echo -n "Введите TELEGRAM_BOT_TOKEN: "
    read BOT_TOKEN
    if [[ "$BOT_TOKEN" =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]]; then
        update_env "TELEGRAM_BOT_TOKEN" "$BOT_TOKEN"
        echo -e "${GREEN}✓ Telegram Bot токен сохранен${NC}"
    else
        echo -e "${RED}✗ Неверный формат токена${NC}"
    fi
else
    echo -e "${GREEN}✓ Telegram Bot токен уже настроен${NC}"
    echo -n "Хотите изменить? (y/n): "
    read CHANGE
    if [ "$CHANGE" = "y" ]; then
        echo -n "Введите новый TELEGRAM_BOT_TOKEN: "
        read BOT_TOKEN
        update_env "TELEGRAM_BOT_TOKEN" "$BOT_TOKEN"
        echo -e "${GREEN}✓ Telegram Bot токен обновлен${NC}"
    fi
fi

echo ""

# ===============================================
# ПРОКСИ (ОПЦИОНАЛЬНО)
# ===============================================
echo -e "${BLUE}🌐 НАСТРОЙКА ПРОКСИ (опционально)${NC}"
echo "-----------------------------------"
echo "Если OpenAI заблокирован в вашем регионе, настройте прокси"
echo -n "Нужно настроить прокси? (y/n): "
read NEED_PROXY

if [ "$NEED_PROXY" = "y" ]; then
    echo -n "Введите адрес прокси (например http://proxy.example.com:8080): "
    read PROXY_URL
    if [[ "$PROXY_URL" =~ ^https?:// ]]; then
        update_env "HTTPS_PROXY" "$PROXY_URL"
        echo -e "${GREEN}✓ Прокси настроен${NC}"
    else
        echo -e "${RED}✗ Прокси должен начинаться с http:// или https://${NC}"
    fi
fi

echo ""

# ===============================================
# ПРОВЕРКА КОНФИГУРАЦИИ
# ===============================================
echo "==============================================="
echo -e "${CYAN}🔍 ПРОВЕРКА КОНФИГУРАЦИИ${NC}"
echo "==============================================="

ERRORS=0
WARNINGS=0

# Проверка обязательных полей
echo ""
echo "Обязательные поля:"

# API_ID
if [ -n "$(get_env_value 'API_ID')" ] && [ "$(get_env_value 'API_ID')" != "" ]; then
    echo -e "  ${GREEN}✓${NC} API_ID"
else
    echo -e "  ${RED}✗${NC} API_ID не настроен"
    ERRORS=$((ERRORS + 1))
fi

# API_HASH
if [ -n "$(get_env_value 'API_HASH')" ] && [ "$(get_env_value 'API_HASH')" != "" ]; then
    echo -e "  ${GREEN}✓${NC} API_HASH"
else
    echo -e "  ${RED}✗${NC} API_HASH не настроен"
    ERRORS=$((ERRORS + 1))
fi

# PHONE_NUMBER
if [ -n "$(get_env_value 'PHONE_NUMBER')" ] && [ "$(get_env_value 'PHONE_NUMBER')" != "" ]; then
    echo -e "  ${GREEN}✓${NC} PHONE_NUMBER"
else
    echo -e "  ${RED}✗${NC} PHONE_NUMBER не настроен"
    ERRORS=$((ERRORS + 1))
fi

# OPENAI_API_KEY
OPENAI_KEY=$(get_env_value 'OPENAI_API_KEY')
if [ -n "$OPENAI_KEY" ] && [[ "$OPENAI_KEY" =~ ^sk- ]]; then
    echo -e "  ${GREEN}✓${NC} OPENAI_API_KEY"
else
    echo -e "  ${RED}✗${NC} OPENAI_API_KEY не настроен или неверный формат"
    ERRORS=$((ERRORS + 1))
fi

# TELEGRAM_BOT_TOKEN
BOT_TOKEN=$(get_env_value 'TELEGRAM_BOT_TOKEN')
if [ -n "$BOT_TOKEN" ] && [[ "$BOT_TOKEN" =~ ^[0-9]+: ]]; then
    echo -e "  ${GREEN}✓${NC} TELEGRAM_BOT_TOKEN"
else
    echo -e "  ${RED}✗${NC} TELEGRAM_BOT_TOKEN не настроен или неверный формат"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ===============================================
# РЕЗУЛЬТАТ
# ===============================================
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Конфигурация готова!${NC}"
    echo ""
    echo "Теперь вы можете запустить бота:"
    echo -e "${CYAN}bot start${NC}"
    echo ""
    echo "Проверить статус:"
    echo -e "${CYAN}bot status${NC}"
    echo ""
    echo "Просмотреть логи:"
    echo -e "${CYAN}bot logs${NC}"
else
    echo -e "${RED}❌ Обнаружено ошибок: $ERRORS${NC}"
    echo ""
    echo "Исправьте ошибки и запустите скрипт снова или"
    echo "отредактируйте конфигурацию вручную:"
    echo -e "${CYAN}bot config${NC}"
fi

echo ""
echo "==============================================="
echo -e "${BLUE}📚 Полезные команды:${NC}"
echo "  bot start    - запустить бота"
echo "  bot stop     - остановить бота"
echo "  bot restart  - перезапустить бота"
echo "  bot status   - проверить статус"
echo "  bot logs     - просмотр логов"
echo "  bot monitor  - мониторинг системы"
echo "  bot config   - редактировать конфигурацию"
echo "==============================================="
