#!/bin/bash

# Скрипт развертывания на First VDS
# Автор: AI Assistant
# Дата: 2025

set -e

echo "==================================="
echo "🚀 Развертывание Telegram AI Sales Agent"
echo "==================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка, что скрипт запущен от root или с sudo
if [[ $EUID -ne 0 ]]; then
   log_error "Этот скрипт должен быть запущен с правами root (используйте sudo)"
   exit 1
fi

# 1. Обновление системы
log_info "Обновление системы..."
apt-get update && apt-get upgrade -y

# 2. Установка необходимых пакетов
log_info "Установка системных пакетов..."
apt-get install -y \
    curl \
    git \
    build-essential \
    sqlite3 \
    nginx \
    ufw \
    fail2ban \
    htop \
    supervisor

# 3. Установка Bun
if ! command -v bun &> /dev/null; then
    log_info "Установка Bun..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
    export PATH="$HOME/.bun/bin:$PATH"
else
    log_info "Bun уже установлен"
fi

# 4. Настройка firewall
log_info "Настройка firewall..."
ufw --force enable
ufw allow ssh
ufw allow http
ufw allow https
ufw status

# 5. Настройка fail2ban для защиты от брутфорса
log_info "Настройка fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
EOF

systemctl restart fail2ban

# 6. Создание пользователя для приложения
log_info "Создание пользователя приложения..."
if ! id -u telegram-bot &>/dev/null; then
    useradd -m -s /bin/bash telegram-bot
    usermod -aG sudo telegram-bot
fi

# 7. Установка приложения
APP_DIR="/home/telegram-bot/app"
log_info "Установка приложения в $APP_DIR..."

# Клонирование если директория не существует
if [ ! -d "$APP_DIR" ]; then
    sudo -u telegram-bot git clone https://github.com/uShure/telegram-ai-sales-agent.git $APP_DIR
fi

cd $APP_DIR

# 8. Установка зависимостей
log_info "Установка зависимостей..."
sudo -u telegram-bot bun install

# 9. Создание .env файла
if [ ! -f "$APP_DIR/.env" ]; then
    log_warn ".env файл не найден. Создаю шаблон..."
    cat > $APP_DIR/.env << EOF
# ВАЖНО: Заполните эти значения!

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

# Production mode
NODE_ENV=production

# Rate limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_BLOCK_MS=300000

# Follow-up settings
FOLLOW_UP_DAYS=3
EOF
    chown telegram-bot:telegram-bot $APP_DIR/.env
    chmod 600 $APP_DIR/.env

    log_error "ВАЖНО: Отредактируйте файл $APP_DIR/.env и добавьте ваши API ключи!"
    log_error "Используйте: nano $APP_DIR/.env"
fi

# 10. Создание директории для логов
log_info "Создание директории для логов..."
mkdir -p $APP_DIR/logs
chown telegram-bot:telegram-bot $APP_DIR/logs

# 11. Создание systemd сервиса
log_info "Создание systemd сервиса..."
cat > /etc/systemd/system/telegram-bot.service << EOF
[Unit]
Description=Telegram AI Sales Agent Bot
After=network.target

[Service]
Type=simple
User=telegram-bot
WorkingDirectory=$APP_DIR
ExecStart=/home/telegram-bot/.bun/bin/bun run src/index.ts
Restart=always
RestartSec=10
StandardOutput=append:$APP_DIR/logs/bot.log
StandardError=append:$APP_DIR/logs/bot-error.log

# Ограничения для безопасности
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR

# Переменные окружения
Environment="NODE_ENV=production"
Environment="PATH=/home/telegram-bot/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

[Install]
WantedBy=multi-user.target
EOF

# 12. Создание скрипта для ротации логов
log_info "Настройка ротации логов..."
cat > /etc/logrotate.d/telegram-bot << EOF
$APP_DIR/logs/*.log {
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

# 13. Создание скрипта мониторинга
log_info "Создание скрипта мониторинга..."
cat > $APP_DIR/monitor.sh << 'EOF'
#!/bin/bash

# Проверка статуса бота
check_bot_status() {
    if systemctl is-active --quiet telegram-bot; then
        echo "✅ Бот работает"
        return 0
    else
        echo "❌ Бот не работает"
        return 1
    fi
}

# Проверка использования памяти
check_memory() {
    MEMORY_USAGE=$(free -m | awk 'NR==2{printf "%.1f", $3*100/$2}')
    echo "💾 Использование памяти: ${MEMORY_USAGE}%"

    if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
        echo "⚠️  Высокое использование памяти!"
    fi
}

# Проверка места на диске
check_disk() {
    DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    echo "💿 Использование диска: ${DISK_USAGE}%"

    if [ $DISK_USAGE -gt 80 ]; then
        echo "⚠️  Мало свободного места на диске!"
    fi
}

# Проверка размера логов
check_logs() {
    LOG_SIZE=$(du -sh logs/ 2>/dev/null | cut -f1)
    echo "📝 Размер логов: ${LOG_SIZE:-0}"
}

# Главная функция
main() {
    echo "==================================="
    echo "📊 Мониторинг Telegram Bot"
    echo "==================================="
    check_bot_status
    check_memory
    check_disk
    check_logs
    echo "==================================="
}

main
EOF

chmod +x $APP_DIR/monitor.sh
chown telegram-bot:telegram-bot $APP_DIR/monitor.sh

# 14. Создание скрипта управления
log_info "Создание скрипта управления..."
cat > /usr/local/bin/telegram-bot-manage << 'EOF'
#!/bin/bash

case "$1" in
    start)
        echo "Запуск бота..."
        systemctl start telegram-bot
        systemctl status telegram-bot
        ;;
    stop)
        echo "Остановка бота..."
        systemctl stop telegram-bot
        ;;
    restart)
        echo "Перезапуск бота..."
        systemctl restart telegram-bot
        systemctl status telegram-bot
        ;;
    status)
        systemctl status telegram-bot
        ;;
    logs)
        tail -f /home/telegram-bot/app/logs/bot.log
        ;;
    errors)
        tail -f /home/telegram-bot/app/logs/bot-error.log
        ;;
    monitor)
        /home/telegram-bot/app/monitor.sh
        ;;
    update)
        echo "Обновление бота..."
        cd /home/telegram-bot/app
        sudo -u telegram-bot git pull
        sudo -u telegram-bot bun install
        systemctl restart telegram-bot
        ;;
    *)
        echo "Использование: $0 {start|stop|restart|status|logs|errors|monitor|update}"
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/telegram-bot-manage

# 15. Настройка автозапуска
log_info "Настройка автозапуска..."
systemctl daemon-reload
systemctl enable telegram-bot

# 16. Создание cron задачи для мониторинга
log_info "Настройка cron для мониторинга..."
(crontab -l 2>/dev/null; echo "*/5 * * * * systemctl is-active --quiet telegram-bot || systemctl restart telegram-bot") | crontab -

# 17. Финальная проверка
log_info "Выполнение финальной проверки..."

echo ""
echo "==================================="
echo "✅ Установка завершена!"
echo "==================================="
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "1. Отредактируйте файл конфигурации:"
echo "   nano $APP_DIR/.env"
echo ""
echo "2. Запустите бота:"
echo "   telegram-bot-manage start"
echo ""
echo "3. Проверьте статус:"
echo "   telegram-bot-manage status"
echo ""
echo "4. Просмотр логов:"
echo "   telegram-bot-manage logs"
echo ""
echo "5. Мониторинг:"
echo "   telegram-bot-manage monitor"
echo ""
echo "==================================="
echo "📌 Полезные команды:"
echo "- Перезапуск: telegram-bot-manage restart"
echo "- Обновление: telegram-bot-manage update"
echo "- Ошибки: telegram-bot-manage errors"
echo "==================================="
echo ""
log_warn "Не забудьте настроить backup базы данных!"
echo ""
