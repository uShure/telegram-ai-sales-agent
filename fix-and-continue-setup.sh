#!/bin/bash

# ===============================================
# 🔧 Исправление и продолжение установки
# ===============================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Проверка root
if [[ $EUID -ne 0 ]]; then
   log_error "Запустите скрипт с правами root"
   exit 1
fi

echo "==============================================="
echo -e "${GREEN}🔧 ИСПРАВЛЕНИЕ И ПРОДОЛЖЕНИЕ УСТАНОВКИ${NC}"
echo "==============================================="
echo ""

# Убедимся что Bun доступен
export PATH="/root/.bun/bin:$PATH"
source /root/.bashrc

# ===============================================
# ФАЗА 1: ИСПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ
# ===============================================
log_step "Исправление пользователя telegram-bot..."

# Удаляем пользователя если он существует
if id "telegram-bot" &>/dev/null; then
    log_info "Удаление старого пользователя..."
    userdel telegram-bot 2>/dev/null || true
fi

# Создаем пользователя заново с домашней директорией
log_info "Создание пользователя telegram-bot..."
useradd -m -s /bin/bash telegram-bot
usermod -aG sudo telegram-bot

# ===============================================
# ФАЗА 2: КЛОНИРОВАНИЕ РЕПОЗИТОРИЯ
# ===============================================
log_step "Клонирование репозитория..."

APP_DIR="/home/telegram-bot/app"

# Удаляем старую директорию если существует
rm -rf $APP_DIR

# Клонируем репозиторий
sudo -u telegram-bot git clone https://github.com/uShure/telegram-ai-sales-agent.git $APP_DIR

cd $APP_DIR

# ===============================================
# ФАЗА 3: УСТАНОВКА ЗАВИСИМОСТЕЙ
# ===============================================
log_step "Установка зависимостей..."
sudo -u telegram-bot /root/.bun/bin/bun install

# ===============================================
# ФАЗА 4: СОЗДАНИЕ КОНФИГУРАЦИИ
# ===============================================
log_step "Создание файла конфигурации..."

cat > $APP_DIR/.env << 'EOF'
# ===================================
# КОНФИГУРАЦИЯ TELEGRAM BOT
# ===================================

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
DATABASE_PATH=/home/telegram-bot/app/conversations.db
COURSES_DB_PATH=/home/telegram-bot/app/courses.db

# Logging
LOG_LEVEL=info
LOG_FILE=/home/telegram-bot/app/logs/bot.log

# Production mode
NODE_ENV=production

# Rate limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_BLOCK_MS=300000

# Follow-up settings
FOLLOW_UP_DAYS=3

# Proxy (если нужен)
# HTTPS_PROXY=http://your-proxy:port
EOF

chown telegram-bot:telegram-bot $APP_DIR/.env
chmod 600 $APP_DIR/.env

# Создание необходимых директорий
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/backups
chown -R telegram-bot:telegram-bot $APP_DIR/logs
chown -R telegram-bot:telegram-bot $APP_DIR/backups

# ===============================================
# ФАЗА 5: СОЗДАНИЕ SYSTEMD СЕРВИСА
# ===============================================
log_step "Создание systemd сервиса..."

cat > /etc/systemd/system/telegram-bot.service << EOF
[Unit]
Description=Telegram AI Sales Agent Bot
After=network.target

[Service]
Type=simple
User=telegram-bot
WorkingDirectory=/home/telegram-bot/app
ExecStart=/root/.bun/bin/bun run src/index.ts
Restart=always
RestartSec=10
StandardOutput=append:/home/telegram-bot/app/logs/bot.log
StandardError=append:/home/telegram-bot/app/logs/bot-error.log

# Ограничения безопасности
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/home/telegram-bot/app

# Переменные окружения
Environment="NODE_ENV=production"
Environment="PATH=/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

[Install]
WantedBy=multi-user.target
EOF

# ===============================================
# ФАЗА 6: НАСТРОЙКА РОТАЦИИ ЛОГОВ
# ===============================================
log_step "Настройка ротации логов..."

cat > /etc/logrotate.d/telegram-bot << EOF
/home/telegram-bot/app/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 telegram-bot telegram-bot
    sharedscripts
    postrotate
        systemctl reload telegram-bot >/dev/null 2>&1 || true
    endscript
}
EOF

# ===============================================
# ФАЗА 7: СОЗДАНИЕ КОМАНДЫ УПРАВЛЕНИЯ
# ===============================================
log_step "Создание команды управления bot..."

cat > /usr/local/bin/bot << 'EOF'
#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

case "$1" in
    start)
        echo -e "${GREEN}Starting bot...${NC}"
        systemctl start telegram-bot
        systemctl status telegram-bot --no-pager
        ;;
    stop)
        echo -e "${RED}Stopping bot...${NC}"
        systemctl stop telegram-bot
        ;;
    restart)
        echo -e "${GREEN}Restarting bot...${NC}"
        systemctl restart telegram-bot
        systemctl status telegram-bot --no-pager
        ;;
    status)
        systemctl status telegram-bot --no-pager
        ;;
    logs)
        tail -f /home/telegram-bot/app/logs/bot.log
        ;;
    errors)
        tail -f /home/telegram-bot/app/logs/bot-error.log
        ;;
    config)
        nano /home/telegram-bot/app/.env
        ;;
    update)
        echo -e "${GREEN}Updating bot...${NC}"
        cd /home/telegram-bot/app
        sudo -u telegram-bot git pull
        sudo -u telegram-bot /root/.bun/bin/bun install
        systemctl restart telegram-bot
        ;;
    backup)
        echo -e "${GREEN}Creating backup...${NC}"
        BACKUP_FILE="/home/telegram-bot/app/backups/backup_$(date +%Y%m%d_%H%M%S).tar.gz"
        tar -czf $BACKUP_FILE -C /home/telegram-bot/app conversations.db courses.db .env 2>/dev/null || true
        echo "Backup created: $BACKUP_FILE"
        ;;
    monitor)
        echo "============================="
        echo "📊 Bot Monitoring"
        echo "============================="
        echo -n "Status: "
        if systemctl is-active --quiet telegram-bot; then
            echo -e "${GREEN}✅ Running${NC}"
        else
            echo -e "${RED}❌ Stopped${NC}"
        fi
        echo -n "Memory: "
        free -h | awk 'NR==2{printf "%s/%s (%.1f%%)\n", $3, $2, $3*100/$2}'
        echo -n "Disk: "
        df -h / | awk 'NR==2{printf "%s/%s (%s)\n", $3, $2, $5}'
        echo -n "CPU Load: "
        uptime | awk -F'load average:' '{print $2}'
        echo "============================="
        ;;
    *)
        echo "Usage: bot {start|stop|restart|status|logs|errors|config|update|backup|monitor}"
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/bot

# ===============================================
# ФАЗА 8: НАСТРОЙКА CRON
# ===============================================
log_step "Настройка автоматических задач..."

# Удаляем старые задачи и добавляем новые
(crontab -l 2>/dev/null | grep -v "telegram-bot") | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * systemctl is-active --quiet telegram-bot || systemctl restart telegram-bot") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/bot backup") | crontab -

# ===============================================
# ФАЗА 9: ФИНАЛИЗАЦИЯ
# ===============================================
log_step "Финализация установки..."

# Перезагрузка systemd
systemctl daemon-reload
systemctl enable telegram-bot

# Установка прав
chown -R telegram-bot:telegram-bot /home/telegram-bot/app
chmod -R 755 /home/telegram-bot/app
chmod 600 /home/telegram-bot/app/.env

# ===============================================
# ЗАВЕРШЕНИЕ
# ===============================================
echo ""
echo "==============================================="
echo -e "${GREEN}✅ УСТАНОВКА УСПЕШНО ЗАВЕРШЕНА!${NC}"
echo "==============================================="
echo ""
echo "📋 СЛЕДУЮЩИЕ ШАГИ:"
echo ""
echo "1. Настройте конфигурацию:"
echo -e "   ${YELLOW}bot config${NC}"
echo ""
echo "   Или используйте интерактивный помощник:"
echo -e "   ${YELLOW}./quick-setup.sh${NC}"
echo ""
echo "2. Запустите бота:"
echo -e "   ${YELLOW}bot start${NC}"
echo ""
echo "3. Проверьте статус:"
echo -e "   ${YELLOW}bot status${NC}"
echo ""
echo "==============================================="
echo "📌 КОМАНДЫ УПРАВЛЕНИЯ:"
echo ""
echo "  bot start    - запустить бота"
echo "  bot stop     - остановить бота"
echo "  bot restart  - перезапустить бота"
echo "  bot status   - статус бота"
echo "  bot logs     - просмотр логов"
echo "  bot errors   - просмотр ошибок"
echo "  bot config   - редактировать конфигурацию"
echo "  bot update   - обновить бота"
echo "  bot backup   - создать бэкап"
echo "  bot monitor  - мониторинг системы"
echo ""
echo "==============================================="
