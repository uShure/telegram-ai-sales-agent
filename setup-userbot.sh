#!/bin/bash

# ===============================================
# 📱 Настройка Telegram Userbot (реальный аккаунт)
# ===============================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

clear

echo "==============================================="
echo -e "${CYAN}📱 НАСТРОЙКА TELEGRAM USERBOT${NC}"
echo "==============================================="
echo ""
echo -e "${YELLOW}Этот бот работает через ВАШ РЕАЛЬНЫЙ аккаунт Telegram!${NC}"
echo -e "${YELLOW}Он будет отвечать на сообщения от вашего имени.${NC}"
echo ""

# Проверка root
if [[ $EUID -ne 0 ]]; then
   log_error "Запустите скрипт с правами root"
   exit 1
fi

APP_DIR="/home/telegram-bot/app"
ENV_FILE="$APP_DIR/.env"

# ===============================================
# ПРОВЕРКА УСТАНОВКИ
# ===============================================
log_step "Проверка установки..."

if [ ! -d "$APP_DIR" ]; then
    log_error "Директория приложения не найдена!"
    echo "Сначала запустите установку:"
    echo "  ./fix-and-continue-setup.sh"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    log_error "Файл конфигурации не найден!"
    echo "Создаю шаблон..."
    cp "$APP_DIR/.env.example" "$ENV_FILE" 2>/dev/null || cat > "$ENV_FILE" << 'EOF'
# Telegram API credentials
API_ID=
API_HASH=
PHONE_NUMBER=
SESSION_STRING=

# OpenAI API
OPENAI_API_KEY=

# Telegram Bot Token (не используется для userbot)
TELEGRAM_BOT_TOKEN=

# Database settings
DATABASE_PATH=/home/telegram-bot/app/conversations.db
COURSES_DB_PATH=/home/telegram-bot/app/courses.db

# Logging
LOG_LEVEL=info

# Production mode
NODE_ENV=production

# Follow-up settings
FOLLOW_UP_DAYS=3

# Proxy settings (если нужен)
# HTTP_PROXY=
# HTTPS_PROXY=
EOF
    chown telegram-bot:telegram-bot "$ENV_FILE"
    chmod 600 "$ENV_FILE"
fi

# ===============================================
# НАСТРОЙКА TELEGRAM API
# ===============================================
log_step "Настройка Telegram API..."

echo ""
echo -e "${BLUE}Для работы userbot нужны данные из Telegram API:${NC}"
echo "-----------------------------------"
echo "1. Откройте https://my.telegram.org"
echo "2. Войдите с вашим номером телефона"
echo "3. Перейдите в 'API development tools'"
echo "4. Создайте приложение (любое название)"
echo ""

# API_ID
CURRENT_API_ID=$(grep "^API_ID=" "$ENV_FILE" | cut -d= -f2)
if [ -z "$CURRENT_API_ID" ] || [ "$CURRENT_API_ID" = "" ]; then
    echo -n "Введите API_ID (числовой ID): "
    read API_ID
    sed -i "s/^API_ID=.*/API_ID=$API_ID/" "$ENV_FILE"
    log_info "API_ID сохранен"
else
    echo -e "${GREEN}✓ API_ID уже настроен: $CURRENT_API_ID${NC}"
    echo -n "Изменить? (y/n): "
    read CHANGE
    if [ "$CHANGE" = "y" ]; then
        echo -n "Новый API_ID: "
        read API_ID
        sed -i "s/^API_ID=.*/API_ID=$API_ID/" "$ENV_FILE"
    fi
fi

# API_HASH
echo ""
CURRENT_API_HASH=$(grep "^API_HASH=" "$ENV_FILE" | cut -d= -f2)
if [ -z "$CURRENT_API_HASH" ] || [ "$CURRENT_API_HASH" = "" ]; then
    echo -n "Введите API_HASH (32 символа): "
    read API_HASH
    sed -i "s/^API_HASH=.*/API_HASH=$API_HASH/" "$ENV_FILE"
    log_info "API_HASH сохранен"
else
    echo -e "${GREEN}✓ API_HASH уже настроен${NC}"
    echo -n "Изменить? (y/n): "
    read CHANGE
    if [ "$CHANGE" = "y" ]; then
        echo -n "Новый API_HASH: "
        read API_HASH
        sed -i "s/^API_HASH=.*/API_HASH=$API_HASH/" "$ENV_FILE"
    fi
fi

# PHONE_NUMBER
echo ""
CURRENT_PHONE=$(grep "^PHONE_NUMBER=" "$ENV_FILE" | cut -d= -f2)
if [ -z "$CURRENT_PHONE" ] || [ "$CURRENT_PHONE" = "" ]; then
    echo -e "${YELLOW}Введите номер телефона вашего Telegram аккаунта${NC}"
    echo -n "Номер с кодом страны (например +79991234567): "
    read PHONE_NUMBER
    sed -i "s/^PHONE_NUMBER=.*/PHONE_NUMBER=$PHONE_NUMBER/" "$ENV_FILE"
    log_info "Номер телефона сохранен"
else
    echo -e "${GREEN}✓ Номер телефона: $CURRENT_PHONE${NC}"
    echo -n "Изменить? (y/n): "
    read CHANGE
    if [ "$CHANGE" = "y" ]; then
        echo -n "Новый номер: "
        read PHONE_NUMBER
        sed -i "s/^PHONE_NUMBER=.*/PHONE_NUMBER=$PHONE_NUMBER/" "$ENV_FILE"
        # Удаляем старую сессию при смене номера
        rm -f "$APP_DIR"/*.session 2>/dev/null
        log_warn "Старая сессия удалена"
    fi
fi

# ===============================================
# НАСТРОЙКА OPENAI
# ===============================================
log_step "Настройка OpenAI API..."

echo ""
CURRENT_OPENAI=$(grep "^OPENAI_API_KEY=" "$ENV_FILE" | cut -d= -f2)
if [ -z "$CURRENT_OPENAI" ] || [ "$CURRENT_OPENAI" = "" ] || [[ "$CURRENT_OPENAI" == *"your-openai"* ]]; then
    echo -e "${BLUE}Получите ключ на https://platform.openai.com/api-keys${NC}"
    echo -n "Введите OPENAI_API_KEY: "
    read -s OPENAI_KEY
    echo ""
    sed -i "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_KEY|" "$ENV_FILE"
    log_info "OpenAI API ключ сохранен"
else
    echo -e "${GREEN}✓ OpenAI API ключ настроен${NC}"
fi

# ===============================================
# НАСТРОЙКА ПРОКСИ
# ===============================================
log_step "Проверка необходимости прокси..."

echo ""
echo -n "Проверка доступа к OpenAI... "
if curl -s --max-time 5 https://api.openai.com/v1/models > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Доступен напрямую${NC}"
else
    echo -e "${RED}✗ Недоступен${NC}"
    echo ""
    echo -e "${YELLOW}OpenAI заблокирован в вашем регионе!${NC}"
    echo "Необходимо настроить прокси."
    echo ""
    echo -n "У вас есть VLESS/прокси сервер? (y/n): "
    read HAS_PROXY

    if [ "$HAS_PROXY" = "y" ]; then
        echo ""
        echo "Запускаю настройку VLESS прокси..."
        if [ -f "./setup-vless-proxy.sh" ]; then
            ./setup-vless-proxy.sh
        else
            wget https://raw.githubusercontent.com/uShure/telegram-ai-sales-agent/main/setup-vless-proxy.sh
            chmod +x setup-vless-proxy.sh
            ./setup-vless-proxy.sh
        fi
    else
        log_warn "Без прокси бот не сможет использовать OpenAI!"
    fi
fi

# ===============================================
# ПЕРВЫЙ ЗАПУСК И АВТОРИЗАЦИЯ
# ===============================================
log_step "Подготовка к первому запуску..."

echo ""
echo -e "${CYAN}Сейчас будет выполнена авторизация в Telegram${NC}"
echo "-----------------------------------"
echo -e "${YELLOW}Приготовьтесь ввести:${NC}"
echo "1. Код подтверждения из Telegram"
echo "2. Пароль двухфакторной аутентификации (если включен)"
echo ""
echo -e "${GREEN}Код придет в Telegram от 'Telegram' или 'Telegram Notifications'${NC}"
echo ""

# Остановка существующего процесса
if systemctl is-active --quiet telegram-bot; then
    log_info "Остановка текущего процесса..."
    systemctl stop telegram-bot
    sleep 2
fi

# Удаление старых сессий если есть проблемы
echo -n "Удалить старые сессии? (рекомендуется при проблемах) (y/n): "
read DELETE_SESSION
if [ "$DELETE_SESSION" = "y" ]; then
    rm -f "$APP_DIR"/*.session 2>/dev/null
    rm -f "$APP_DIR"/session* 2>/dev/null
    log_info "Старые сессии удалены"
fi

echo ""
echo -e "${YELLOW}Запуск авторизации...${NC}"
echo "-----------------------------------"

# Создаем временный скрипт для авторизации
cat > "$APP_DIR/auth-userbot.js" << 'EOF'
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, ".env") });

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const phoneNumber = process.env.PHONE_NUMBER;

if (!apiId || !apiHash || !phoneNumber) {
    console.error("❌ Отсутствуют API_ID, API_HASH или PHONE_NUMBER в .env");
    process.exit(1);
}

(async () => {
    console.log("📱 Начинаю авторизацию...");

    // Проверяем существующую сессию
    let stringSession = "";
    const sessionFile = path.join(__dirname, "session.txt");

    if (fs.existsSync(sessionFile)) {
        stringSession = fs.readFileSync(sessionFile, "utf-8").trim();
        console.log("📂 Найдена существующая сессия");
    }

    const client = new TelegramClient(
        new StringSession(stringSession),
        apiId,
        apiHash,
        {
            connectionRetries: 5,
        }
    );

    await client.start({
        phoneNumber: async () => phoneNumber,
        password: async () => await input.text("Введите пароль 2FA (если нет, нажмите Enter): "),
        phoneCode: async () => await input.text("Введите код из Telegram: "),
        onError: (err) => console.log(err),
    });

    console.log("✅ Авторизация успешна!");

    // Сохраняем сессию
    const sessionString = client.session.save();
    fs.writeFileSync(sessionFile, sessionString);

    // Обновляем .env
    const envContent = fs.readFileSync(path.join(__dirname, ".env"), "utf-8");
    const updatedEnv = envContent.replace(
        /SESSION_STRING=.*/,
        `SESSION_STRING=${sessionString}`
    );
    fs.writeFileSync(path.join(__dirname, ".env"), updatedEnv);

    console.log("💾 Сессия сохранена");

    // Получаем информацию о пользователе
    const me = await client.getMe();
    console.log("\n📋 Информация об аккаунте:");
    console.log(`  Имя: ${me.firstName} ${me.lastName || ""}`);
    console.log(`  Username: @${me.username || "не установлен"}`);
    console.log(`  ID: ${me.id}`);
    console.log(`  Телефон: ${me.phone}`);

    await client.disconnect();
    process.exit(0);
})();
EOF

# Запускаем авторизацию
cd "$APP_DIR"
echo ""
echo -e "${CYAN}Запуск процесса авторизации...${NC}"
echo ""

# Используем Node.js напрямую для авторизации
if command -v node > /dev/null; then
    sudo -u telegram-bot node auth-userbot.js
else
    # Если нет Node.js, используем Bun
    sudo -u telegram-bot /root/.bun/bin/bun auth-userbot.js
fi

AUTH_RESULT=$?

if [ $AUTH_RESULT -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Авторизация завершена успешно!${NC}"

    # Удаляем временный скрипт
    rm -f "$APP_DIR/auth-userbot.js"

    # Перезапускаем бота
    log_step "Запуск userbot..."
    systemctl restart telegram-bot
    sleep 3

    if systemctl is-active --quiet telegram-bot; then
        echo ""
        echo -e "${GREEN}✅ Userbot успешно запущен!${NC}"
        echo ""
        echo "-----------------------------------"
        echo -e "${CYAN}Теперь бот будет отвечать на сообщения от вашего имени${NC}"
        echo ""
        echo "📝 Как это работает:"
        echo "  - Бот мониторит входящие сообщения"
        echo "  - Использует AI для генерации ответов"
        echo "  - Отвечает от вашего имени"
        echo ""
        echo "⚠️ Важно:"
        echo "  - НЕ используйте Telegram на других устройствах одновременно"
        echo "  - Бот будет видеть ВСЕ ваши сообщения"
        echo "  - Можете настроить фильтры в коде"
        echo ""
    else
        log_error "Не удалось запустить userbot"
        echo "Проверьте логи: bot errors"
    fi
else
    log_error "Ошибка авторизации!"
    echo ""
    echo "Возможные причины:"
    echo "1. Неверный код подтверждения"
    echo "2. Неправильный номер телефона"
    echo "3. Проблемы с API_ID/API_HASH"
    echo ""
    echo "Попробуйте еще раз или проверьте настройки"
fi

echo "-----------------------------------"
echo -e "${BLUE}Полезные команды:${NC}"
echo "  bot status   - статус бота"
echo "  bot logs     - просмотр логов"
echo "  bot restart  - перезапустить"
echo "  bot stop     - остановить"
echo "-----------------------------------"
