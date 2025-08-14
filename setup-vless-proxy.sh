#!/bin/bash

# ===============================================
# 🚀 Настройка VLESS прокси для Telegram Bot
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

# Проверка root
if [[ $EUID -ne 0 ]]; then
   log_error "Запустите скрипт с правами root"
   exit 1
fi

clear

echo "==============================================="
echo -e "${CYAN}🚀 НАСТРОЙКА VLESS ПРОКСИ${NC}"
echo "==============================================="
echo ""
echo -e "${YELLOW}Этот скрипт настроит VLESS прокси для обхода блокировок OpenAI${NC}"
echo ""

# ===============================================
# УСТАНОВКА XRAY
# ===============================================
log_step "Проверка и установка Xray-core..."

if ! command -v xray &> /dev/null; then
    log_info "Установка Xray-core..."

    # Определяем архитектуру
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            XRAY_ARCH="64"
            ;;
        aarch64)
            XRAY_ARCH="arm64-v8a"
            ;;
        *)
            log_error "Неподдерживаемая архитектура: $ARCH"
            exit 1
            ;;
    esac

    # Скачиваем последнюю версию Xray
    LATEST_VERSION=$(curl -s https://api.github.com/repos/XTLS/Xray-core/releases/latest | grep tag_name | cut -d '"' -f 4)
    log_info "Скачивание Xray ${LATEST_VERSION}..."

    cd /tmp
    wget -q "https://github.com/XTLS/Xray-core/releases/download/${LATEST_VERSION}/Xray-linux-${XRAY_ARCH}.zip"

    # Распаковка
    unzip -q Xray-linux-${XRAY_ARCH}.zip

    # Установка
    mv xray /usr/local/bin/
    chmod +x /usr/local/bin/xray

    # Создание директорий
    mkdir -p /usr/local/etc/xray
    mkdir -p /var/log/xray

    # Очистка
    rm -f Xray-linux-${XRAY_ARCH}.zip geoip.dat geosite.dat LICENSE README.md

    log_info "Xray установлен успешно"
else
    log_info "Xray уже установлен"
fi

# ===============================================
# ВВОД ДАННЫХ VLESS
# ===============================================
log_step "Настройка VLESS подключения..."

echo ""
echo -e "${BLUE}Введите данные вашего VLESS сервера:${NC}"
echo "-----------------------------------"

# Можно ввести полную VLESS ссылку или по частям
echo -n "У вас есть полная VLESS ссылка? (y/n): "
read HAS_LINK

if [ "$HAS_LINK" = "y" ]; then
    echo ""
    echo "Вставьте вашу VLESS ссылку:"
    echo "(формат: vless://UUID@SERVER:PORT?параметры)"
    echo -n "> "
    read VLESS_LINK

    # Парсим VLESS ссылку
    # vless://uuid@server:port?type=tcp&security=tls&sni=domain#name

    # Извлекаем UUID
    UUID=$(echo "$VLESS_LINK" | sed -n 's/^vless:\/\/\([^@]*\)@.*/\1/p')

    # Извлекаем сервер и порт
    SERVER_PORT=$(echo "$VLESS_LINK" | sed -n 's/^vless:\/\/[^@]*@\([^?#]*\).*/\1/p')
    SERVER=$(echo "$SERVER_PORT" | cut -d: -f1)
    PORT=$(echo "$SERVER_PORT" | cut -d: -f2)

    # Извлекаем параметры
    PARAMS=$(echo "$VLESS_LINK" | sed -n 's/^[^?]*?\([^#]*\).*/\1/p')

    # Парсим параметры
    NETWORK=$(echo "$PARAMS" | sed -n 's/.*type=\([^&]*\).*/\1/p')
    SECURITY=$(echo "$PARAMS" | sed -n 's/.*security=\([^&]*\).*/\1/p')
    SNI=$(echo "$PARAMS" | sed -n 's/.*sni=\([^&]*\).*/\1/p')
    FLOW=$(echo "$PARAMS" | sed -n 's/.*flow=\([^&]*\).*/\1/p')

    # Значения по умолчанию
    NETWORK=${NETWORK:-tcp}
    SECURITY=${SECURITY:-tls}

    echo ""
    echo -e "${GREEN}Распознаны параметры:${NC}"
    echo "  Сервер: $SERVER"
    echo "  Порт: $PORT"
    echo "  UUID: ${UUID:0:8}..."
    echo "  Тип: $NETWORK"
    echo "  Безопасность: $SECURITY"
    [ -n "$SNI" ] && echo "  SNI: $SNI"
    [ -n "$FLOW" ] && echo "  Flow: $FLOW"

else
    # Ручной ввод параметров
    echo ""
    echo -n "Адрес сервера (IP или домен): "
    read SERVER

    echo -n "Порт сервера [443]: "
    read PORT
    PORT=${PORT:-443}

    echo -n "UUID: "
    read UUID

    echo -n "Тип сети (tcp/ws/grpc) [tcp]: "
    read NETWORK
    NETWORK=${NETWORK:-tcp}

    echo -n "Безопасность (none/tls/reality) [tls]: "
    read SECURITY
    SECURITY=${SECURITY:-tls}

    if [ "$SECURITY" = "tls" ]; then
        echo -n "SNI (Server Name Indication) [оставить пустым для авто]: "
        read SNI
    fi

    if [ "$NETWORK" = "tcp" ] && [ "$SECURITY" = "tls" ]; then
        echo -n "Flow (xtls-rprx-vision/none) [none]: "
        read FLOW
        FLOW=${FLOW:-none}
    fi

    if [ "$NETWORK" = "ws" ]; then
        echo -n "WebSocket путь [/]: "
        read WS_PATH
        WS_PATH=${WS_PATH:-/}

        echo -n "WebSocket Host [оставить пустым]: "
        read WS_HOST
    fi
fi

# ===============================================
# СОЗДАНИЕ КОНФИГУРАЦИИ XRAY
# ===============================================
log_step "Создание конфигурации Xray..."

# Базовая конфигурация
cat > /usr/local/etc/xray/config.json << EOF
{
  "log": {
    "loglevel": "warning",
    "access": "/var/log/xray/access.log",
    "error": "/var/log/xray/error.log"
  },
  "inbounds": [
    {
      "port": 1080,
      "listen": "127.0.0.1",
      "protocol": "socks",
      "settings": {
        "udp": true,
        "auth": "noauth"
      },
      "tag": "socks-in"
    },
    {
      "port": 8118,
      "listen": "127.0.0.1",
      "protocol": "http",
      "settings": {
        "allowTransparent": false
      },
      "tag": "http-in"
    }
  ],
  "outbounds": [
    {
      "protocol": "vless",
      "settings": {
        "vnext": [
          {
            "address": "$SERVER",
            "port": $PORT,
            "users": [
              {
                "id": "$UUID",
                "encryption": "none"$([ "$FLOW" != "none" ] && [ -n "$FLOW" ] && echo ",
                \"flow\": \"$FLOW\"")
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "$NETWORK"$([ "$SECURITY" = "tls" ] && echo ",
        \"security\": \"tls\",
        \"tlsSettings\": {
          \"allowInsecure\": false$([ -n "$SNI" ] && echo ",
          \"serverName\": \"$SNI\"")
        }")$([ "$NETWORK" = "ws" ] && echo ",
        \"wsSettings\": {
          \"path\": \"$WS_PATH\"$([ -n "$WS_HOST" ] && echo ",
          \"headers\": {
            \"Host\": \"$WS_HOST\"
          }")
        }")
      },
      "tag": "proxy"
    },
    {
      "protocol": "freedom",
      "settings": {},
      "tag": "direct"
    }
  ],
  "routing": {
    "domainStrategy": "AsIs",
    "rules": [
      {
        "type": "field",
        "inboundTag": ["socks-in", "http-in"],
        "outboundTag": "proxy"
      }
    ]
  }
}
EOF

log_info "Конфигурация создана"

# ===============================================
# СОЗДАНИЕ SYSTEMD СЕРВИСА
# ===============================================
log_step "Создание systemd сервиса для Xray..."

cat > /etc/systemd/system/xray.service << 'EOF'
[Unit]
Description=Xray Service
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/xray run -config /usr/local/etc/xray/config.json
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Перезагрузка и запуск
systemctl daemon-reload
systemctl enable xray
systemctl restart xray

sleep 2

# Проверка статуса
if systemctl is-active --quiet xray; then
    log_info "Xray запущен успешно"
else
    log_error "Ошибка запуска Xray"
    journalctl -u xray -n 20
    exit 1
fi

# ===============================================
# НАСТРОЙКА ПРОКСИ В БОТЕ
# ===============================================
log_step "Настройка прокси в конфигурации бота..."

ENV_FILE="/home/telegram-bot/app/.env"

if [ -f "$ENV_FILE" ]; then
    # Обновляем или добавляем настройки прокси

    # Удаляем старые настройки прокси если есть
    sed -i '/^HTTP_PROXY=/d' "$ENV_FILE"
    sed -i '/^HTTPS_PROXY=/d' "$ENV_FILE"
    sed -i '/^# HTTP_PROXY=/d' "$ENV_FILE"
    sed -i '/^# HTTPS_PROXY=/d' "$ENV_FILE"

    # Добавляем новые настройки
    echo "" >> "$ENV_FILE"
    echo "# VLESS Proxy Settings" >> "$ENV_FILE"
    echo "HTTP_PROXY=socks5://127.0.0.1:1080" >> "$ENV_FILE"
    echo "HTTPS_PROXY=socks5://127.0.0.1:1080" >> "$ENV_FILE"

    log_info "Прокси настроен в конфигурации бота"
else
    log_warn "Файл конфигурации бота не найден. Настройте прокси вручную в /home/telegram-bot/app/.env"
fi

# ===============================================
# ТЕСТИРОВАНИЕ ПРОКСИ
# ===============================================
log_step "Тестирование прокси соединения..."

echo ""
echo -n "Проверка локального SOCKS5 прокси... "
if nc -zv 127.0.0.1 1080 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    log_error "SOCKS5 прокси не отвечает на порту 1080"
fi

echo -n "Проверка локального HTTP прокси... "
if nc -zv 127.0.0.1 8118 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    log_error "HTTP прокси не отвечает на порту 8118"
fi

echo -n "Проверка доступа к OpenAI через прокси... "
if curl -s --socks5 127.0.0.1:1080 --max-time 10 https://api.openai.com/v1/models > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OpenAI доступен${NC}"
else
    echo -e "${RED}✗ OpenAI недоступен${NC}"
fi

echo -n "Проверка доступа к Telegram через прокси... "
if curl -s --socks5 127.0.0.1:1080 --max-time 10 https://api.telegram.org > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Telegram доступен${NC}"
else
    echo -e "${YELLOW}⚠ Telegram недоступен (может быть нормально)${NC}"
fi

# ===============================================
# СОЗДАНИЕ УТИЛИТЫ УПРАВЛЕНИЯ
# ===============================================
log_step "Создание утилиты управления прокси..."

cat > /usr/local/bin/proxy << 'EOF'
#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

case "$1" in
    status)
        echo "============================="
        echo "📊 Статус прокси"
        echo "============================="
        if systemctl is-active --quiet xray; then
            echo -e "Xray: ${GREEN}✓ Работает${NC}"
            echo ""
            echo "Прокси доступны:"
            echo "  SOCKS5: 127.0.0.1:1080"
            echo "  HTTP:   127.0.0.1:8118"
        else
            echo -e "Xray: ${RED}✗ Остановлен${NC}"
        fi
        ;;
    start)
        echo -e "${GREEN}Запуск прокси...${NC}"
        systemctl start xray
        sleep 2
        systemctl status xray --no-pager
        ;;
    stop)
        echo -e "${RED}Остановка прокси...${NC}"
        systemctl stop xray
        ;;
    restart)
        echo -e "${GREEN}Перезапуск прокси...${NC}"
        systemctl restart xray
        sleep 2
        systemctl status xray --no-pager
        ;;
    test)
        echo "============================="
        echo "🔍 Тестирование прокси"
        echo "============================="

        echo -n "SOCKS5 (127.0.0.1:1080): "
        if nc -zv 127.0.0.1 1080 2>/dev/null; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
        fi

        echo -n "HTTP (127.0.0.1:8118): "
        if nc -zv 127.0.0.1 8118 2>/dev/null; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
        fi

        echo ""
        echo "Проверка внешних сервисов:"

        echo -n "  OpenAI API: "
        if curl -s --socks5 127.0.0.1:1080 --max-time 5 https://api.openai.com/v1/models > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Доступен${NC}"
        else
            echo -e "${RED}✗ Недоступен${NC}"
        fi

        echo -n "  Telegram API: "
        if curl -s --socks5 127.0.0.1:1080 --max-time 5 https://api.telegram.org > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Доступен${NC}"
        else
            echo -e "${YELLOW}⚠ Недоступен${NC}"
        fi

        echo -n "  Google: "
        if curl -s --socks5 127.0.0.1:1080 --max-time 5 https://www.google.com > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Доступен${NC}"
        else
            echo -e "${RED}✗ Недоступен${NC}"
        fi
        ;;
    logs)
        tail -f /var/log/xray/error.log
        ;;
    config)
        nano /usr/local/etc/xray/config.json
        ;;
    *)
        echo "Использование: proxy {status|start|stop|restart|test|logs|config}"
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/proxy

# ===============================================
# ЗАВЕРШЕНИЕ
# ===============================================
echo ""
echo "==============================================="
echo -e "${GREEN}✅ VLESS ПРОКСИ УСПЕШНО НАСТРОЕН!${NC}"
echo "==============================================="
echo ""
echo "📊 Информация о прокси:"
echo "  SOCKS5: 127.0.0.1:1080"
echo "  HTTP:   127.0.0.1:8118"
echo ""
echo "📌 Команды управления прокси:"
echo "  proxy status  - проверить статус"
echo "  proxy test    - тестировать соединение"
echo "  proxy restart - перезапустить"
echo "  proxy logs    - просмотр логов"
echo ""
echo "🤖 Для применения прокси в боте:"
echo -e "  ${CYAN}bot restart${NC}"
echo ""
echo "==============================================="
echo ""
log_warn "Сохраните данные вашего VLESS сервера в безопасном месте!"
echo ""
