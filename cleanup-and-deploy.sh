#!/bin/bash

# ===============================================
# 🧹 Скрипт полной очистки и развертывания
# Telegram AI Sales Agent на First VDS
# ===============================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для логирования
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Проверка прав root
if [[ $EUID -ne 0 ]]; then
   log_error "Этот скрипт должен быть запущен с правами root (используйте sudo)"
   exit 1
fi

echo "==============================================="
echo "🚀 ПОЛНАЯ ОЧИСТКА И РАЗВЕРТЫВАНИЕ"
echo "   Telegram AI Sales Agent"
echo "==============================================="
echo ""

# Предупреждение
log_warn "ВНИМАНИЕ! Этот скрипт удалит ВСЕ существующие сервисы и данные!"
log_warn "Будут удалены:"
echo "  - Все Docker контейнеры и образы"
echo "  - Все системные сервисы (кроме системных)"
echo "  - Данные в /home/* (кроме root)"
echo "  - Установленные веб-серверы (nginx, apache)"
echo ""
read -p "Вы уверены, что хотите продолжить? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "Операция отменена"
    exit 0
fi

# ===============================================
# ФАЗА 1: СОЗДАНИЕ БЭКАПА ВАЖНЫХ ДАННЫХ
# ===============================================
log_step "Фаза 1: Создание бэкапа важных конфигураций..."

BACKUP_DIR="/root/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Сохраняем SSH ключи и конфигурацию
if [ -d "/root/.ssh" ]; then
    cp -r /root/.ssh $BACKUP_DIR/
    log_info "SSH ключи сохранены"
fi

# Сохраняем сетевую конфигурацию
cp /etc/netplan/*.yaml $BACKUP_DIR/ 2>/dev/null || true
cp /etc/network/interfaces $BACKUP_DIR/ 2>/dev/null || true
log_info "Сетевая конфигурация сохранена"

# ===============================================
# ФАЗА 2: ОСТАНОВКА И УДАЛЕНИЕ СЕРВИСОВ
# ===============================================
log_step "Фаза 2: Остановка всех сервисов..."

# Остановка Docker если установлен
if command -v docker &> /dev/null; then
    log_info "Остановка Docker контейнеров..."
    docker stop $(docker ps -aq) 2>/dev/null || true
    docker rm $(docker ps -aq) 2>/dev/null || true
    docker rmi $(docker images -q) 2>/dev/null || true
    docker system prune -af --volumes 2>/dev/null || true
fi

# Остановка всех пользовательских systemd сервисов
log_info "Остановка пользовательских сервисов..."
systemctl list-units --type=service --state=running | grep -v "ssh\|network\|systemd\|kernel" | awk '{print $1}' | while read service; do
    if [[ ! -z "$service" ]] && [[ "$service" != "UNIT" ]]; then
        systemctl stop $service 2>/dev/null || true
        systemctl disable $service 2>/dev/null || true
    fi
done

# Остановка веб-серверов
for service in nginx apache2 httpd; do
    if systemctl is-active --quiet $service; then
        log_info "Остановка $service..."
        systemctl stop $service
        systemctl disable $service
    fi
done

# ===============================================
# ФАЗА 3: УДАЛЕНИЕ ПРОГРАММ И ДАННЫХ
# ===============================================
log_step "Фаза 3: Удаление установленных программ..."

# Удаление Docker
if command -v docker &> /dev/null; then
    log_info "Удаление Docker..."
    apt-get remove -y docker docker-engine docker.io containerd runc docker-compose 2>/dev/null || true
    rm -rf /var/lib/docker
    rm -rf /etc/docker
fi

# Удаление веб-серверов
log_info "Удаление веб-серверов..."
apt-get remove -y nginx apache2 2>/dev/null || true

# Удаление Node.js, npm, yarn
log_info "Удаление Node.js и менеджеров пакетов..."
apt-get remove -y nodejs npm yarn 2>/dev/null || true
rm -rf /usr/local/lib/node_modules
rm -rf /usr/local/bin/node
rm -rf /usr/local/bin/npm
rm -rf /usr/local/bin/npx

# Удаление Python окружений
log_info "Очистка Python окружений..."
rm -rf /opt/venv* 2>/dev/null || true
rm -rf /home/*/venv* 2>/dev/null || true

# ===============================================
# ФАЗА 4: ОЧИСТКА ФАЙЛОВОЙ СИСТЕМЫ
# ===============================================
log_step "Фаза 4: Очистка файловой системы..."

# Удаление пользовательских директорий (кроме root)
log_info "Очистка домашних директорий..."
for dir in /home/*; do
    if [ -d "$dir" ] && [ "$dir" != "/home/root" ]; then
        log_info "Удаление $dir..."
        rm -rf $dir
    fi
done

# Очистка /opt
log_info "Очистка /opt..."
rm -rf /opt/*

# Очистка /var/www
log_info "Очистка веб-директорий..."
rm -rf /var/www/*

# Очистка временных файлов
log_info "Очистка временных файлов..."
apt-get autoremove -y
apt-get autoclean -y
rm -rf /tmp/*
rm -rf /var/tmp/*

# Удаление старых логов
log_info "Очистка логов..."
find /var/log -type f -name "*.log" -exec truncate -s 0 {} \;
journalctl --vacuum-time=1d

# ===============================================
# ФАЗА 5: ОБНОВЛЕНИЕ СИСТЕМЫ
# ===============================================
log_step "Фаза 5: Обновление системы..."

apt-get update
apt-get upgrade -y
apt-get dist-upgrade -y

# ===============================================
# ФАЗА 6: УСТАНОВКА БАЗОВЫХ ПАКЕТОВ
# ===============================================
log_step "Фаза 6: Установка базовых пакетов..."

apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    sqlite3 \
    ufw \
    fail2ban \
    htop \
    supervisor \
    python3 \
    python3-pip

# ===============================================
# ФАЗА 7: УСТАНОВКА BUN
# ===============================================
log_step "Фаза 7: Установка Bun..."

curl -fsSL https://bun.sh/install | bash
source /root/.bashrc
export PATH="/root/.bun/bin:$PATH"

# Добавляем Bun в PATH для всех пользователей
echo 'export PATH="/root/.bun/bin:$PATH"' >> /etc/profile

# ===============================================
# ФАЗА 8: НАСТРОЙКА БЕЗОПАСНОСТИ
# ===============================================
log_step "Фаза 8: Настройка безопасности..."

# Настройка UFW
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload

# Настройка Fail2ban
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

# ===============================================
# ФАЗА 9: СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ ДЛЯ БОТА
# ===============================================
log_step "Фаза 9: Создание пользователя для бота..."

useradd -m -s /bin/bash telegram-bot
usermod -aG sudo telegram-bot

# ===============================================
# ФАЗА 10: КЛОНИРОВАНИЕ И УСТАНОВКА ПРОЕКТА
# ===============================================
log_step "Фаза 10: Установка Telegram AI Sales Agent..."

APP_DIR="/home/telegram-bot/app"

# Клонирование репозитория
sudo -u telegram-bot git clone https://github.com/uShure/telegram-ai-sales-agent.git $APP_DIR

cd $APP_DIR

# Установка зависимостей через Bun
log_info "Установка зависимостей..."
sudo -u telegram-bot /root/.bun/bin/bun install

# ===============================================
# ФАЗА 11: СОЗДАНИЕ КОНФИГУРАЦИИ
# ===============================================
log_step "Фаза 11: Создание конфигурации..."

cat > $APP_DIR/.env << EOF
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

# Создание директорий
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/backups
chown -R telegram-bot:telegram-bot $APP_DIR/logs
chown -R telegram-bot:telegram-bot $APP_DIR/backups

# ===============================================
# ФАЗА 12: СОЗДАНИЕ SYSTEMD СЕРВИСА
# ===============================================
log_step "Фаза 12: Создание systemd сервиса..."

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
# ФАЗА 13: НАСТРОЙКА ЛОГИРОВАНИЯ
# ===============================================
log_step "Фаза 13: Настройка ротации логов..."

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
# ФАЗА 14: СОЗДАНИЕ УТИЛИТ УПРАВЛЕНИЯ
# ===============================================
log_step "Фаза 14: Создание утилит управления..."

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
        tar -czf $BACKUP_FILE -C /home/telegram-bot/app conversations.db courses.db .env
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
# ФАЗА 15: НАСТРОЙКА CRON
# ===============================================
log_step "Фаза 15: Настройка автоматических задач..."

# Добавляем автоматический перезапуск при падении
(crontab -l 2>/dev/null; echo "*/5 * * * * systemctl is-active --quiet telegram-bot || systemctl restart telegram-bot") | crontab -

# Добавляем автоматический бэкап
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/bot backup") | crontab -

# ===============================================
# ФАЗА 16: ФИНАЛИЗАЦИЯ
# ===============================================
log_step "Фаза 16: Финализация установки..."

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
echo "📋 ВАЖНЫЕ ШАГИ:"
echo ""
echo "1. Настройте конфигурацию бота:"
echo "   bot config"
echo ""
echo "   Заполните обязательные поля:"
echo "   - API_ID и API_HASH (https://my.telegram.org)"
echo "   - PHONE_NUMBER (ваш номер телефона)"
echo "   - OPENAI_API_KEY (ключ OpenAI)"
echo "   - TELEGRAM_BOT_TOKEN (токен от @BotFather)"
echo ""
echo "2. Запустите бота:"
echo "   bot start"
echo ""
echo "3. Проверьте статус:"
echo "   bot status"
echo ""
echo "==============================================="
echo "📌 ПОЛЕЗНЫЕ КОМАНДЫ:"
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
echo ""
log_warn "Бэкап старых данных сохранен в: $BACKUP_DIR"
echo ""
