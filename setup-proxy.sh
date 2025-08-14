#!/bin/bash

# ===============================================
# 🌐 Настройка прокси для обхода блокировок
# ===============================================

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

ENV_FILE="/home/telegram-bot/app/.env"

clear

echo "==============================================="
echo -e "${CYAN}🌐 НАСТРОЙКА ПРОКСИ ДЛЯ TELEGRAM BOT${NC}"
echo "==============================================="
echo ""
echo -e "${YELLOW}Этот скрипт поможет настроить прокси для обхода региональных блокировок${NC}"
echo ""

# Функция для обновления .env
update_env() {
    local key=$1
    local value=$2

    # Экранируем специальные символы
    value=$(echo "$value" | sed 's/[[\.*^$()+?{|]/\\&/g')

    # Проверяем существует ли ключ
    if grep -q "^${key}=" "$ENV_FILE"; then
        # Обновляем существующий
        sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    elif grep -q "^# ${key}=" "$ENV_FILE"; then
        # Раскомментируем и обновляем
        sed -i "s|^# ${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
        # Добавляем новый
        echo "${key}=${value}" >> "$ENV_FILE"
    fi
}

# ===============================================
# ВЫБОР ТИПА ПРОКСИ
# ===============================================
echo -e "${BLUE}📋 ВАРИАНТЫ НАСТРОЙКИ ПРОКСИ${NC}"
echo "-----------------------------------"
echo "1. У меня есть свой прокси-сервер"
echo "2. Настроить бесплатный прокси через Cloudflare WARP"
echo "3. Использовать публичный прокси (не рекомендуется)"
echo "4. Пропустить настройку прокси"
echo ""
echo -n "Выберите вариант (1-4): "
read PROXY_CHOICE

case $PROXY_CHOICE in
    1)
        # ===============================================
        # СОБСТВЕННЫЙ ПРОКСИ
        # ===============================================
        echo ""
        echo -e "${BLUE}🔧 НАСТРОЙКА СОБСТВЕННОГО ПРОКСИ${NC}"
        echo "-----------------------------------"
        echo "Введите данные вашего прокси-сервера"
        echo ""

        echo -n "Протокол (http/https/socks5) [http]: "
        read PROXY_PROTOCOL
        PROXY_PROTOCOL=${PROXY_PROTOCOL:-http}

        echo -n "Адрес прокси (например: proxy.example.com): "
        read PROXY_HOST

        echo -n "Порт прокси (например: 8080): "
        read PROXY_PORT

        echo -n "Требуется авторизация? (y/n) [n]: "
        read NEED_AUTH

        if [ "$NEED_AUTH" = "y" ]; then
            echo -n "Имя пользователя: "
            read PROXY_USER
            echo -n "Пароль: "
            read -s PROXY_PASS
            echo ""

            if [ "$PROXY_PROTOCOL" = "socks5" ]; then
                PROXY_URL="socks5://${PROXY_USER}:${PROXY_PASS}@${PROXY_HOST}:${PROXY_PORT}"
            else
                PROXY_URL="${PROXY_PROTOCOL}://${PROXY_USER}:${PROXY_PASS}@${PROXY_HOST}:${PROXY_PORT}"
            fi
        else
            if [ "$PROXY_PROTOCOL" = "socks5" ]; then
                PROXY_URL="socks5://${PROXY_HOST}:${PROXY_PORT}"
            else
                PROXY_URL="${PROXY_PROTOCOL}://${PROXY_HOST}:${PROXY_PORT}"
            fi
        fi

        # Обновляем конфигурацию
        update_env "HTTP_PROXY" "$PROXY_URL"
        update_env "HTTPS_PROXY" "$PROXY_URL"

        echo ""
        echo -e "${GREEN}✓ Прокси настроен: $PROXY_URL${NC}"
        ;;

    2)
        # ===============================================
        # CLOUDFLARE WARP
        # ===============================================
        echo ""
        echo -e "${BLUE}🚀 УСТАНОВКА CLOUDFLARE WARP${NC}"
        echo "-----------------------------------"
        echo "Cloudflare WARP - бесплатный VPN-сервис"
        echo ""

        # Проверяем архитектуру
        ARCH=$(uname -m)

        if [ "$ARCH" = "x86_64" ]; then
            echo "Установка WARP для x86_64..."

            # Добавляем репозиторий Cloudflare
            curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
            echo "deb [arch=amd64 signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflare-client.list

            # Устанавливаем WARP
            sudo apt-get update
            sudo apt-get install -y cloudflare-warp

            # Регистрируем и подключаем
            echo "Регистрация WARP..."
            warp-cli register

            echo "Установка режима прокси..."
            warp-cli mode proxy

            echo "Подключение..."
            warp-cli connect

            # Настраиваем прокси через WARP (по умолчанию порт 40000)
            PROXY_URL="socks5://127.0.0.1:40000"
            update_env "HTTP_PROXY" "$PROXY_URL"
            update_env "HTTPS_PROXY" "$PROXY_URL"

            echo ""
            echo -e "${GREEN}✓ Cloudflare WARP установлен и настроен${NC}"
            echo -e "${GREEN}✓ Прокси: $PROXY_URL${NC}"

            # Добавляем автозапуск
            systemctl enable warp-cli

            # Создаем скрипт проверки WARP
            cat > /usr/local/bin/check-warp << 'EOF'
#!/bin/bash
if ! warp-cli status | grep -q "Connected"; then
    echo "WARP отключен. Подключаем..."
    warp-cli connect
fi
EOF
            chmod +x /usr/local/bin/check-warp

            # Добавляем в cron
            (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/check-warp") | crontab -

        else
            echo -e "${RED}К сожалению, WARP не поддерживает архитектуру $ARCH${NC}"
            echo "Попробуйте использовать другой вариант"
        fi
        ;;

    3)
        # ===============================================
        # ПУБЛИЧНЫЕ ПРОКСИ
        # ===============================================
        echo ""
        echo -e "${YELLOW}⚠️ ВНИМАНИЕ: Публичные прокси ненадежны и небезопасны!${NC}"
        echo ""
        echo -e "${BLUE}Список проверенных прокси-сервисов:${NC}"
        echo "-----------------------------------"
        echo "1. proxy.antizapret.prostovpn.org:3128 (HTTP)"
        echo "2. proxy-ssl.antizapret.prostovpn.org:3143 (HTTPS)"
        echo "3. Ввести свой адрес"
        echo ""
        echo -n "Выберите вариант (1-3): "
        read PUBLIC_CHOICE

        case $PUBLIC_CHOICE in
            1)
                PROXY_URL="http://proxy.antizapret.prostovpn.org:3128"
                ;;
            2)
                PROXY_URL="https://proxy-ssl.antizapret.prostovpn.org:3143"
                ;;
            3)
                echo -n "Введите полный URL прокси: "
                read PROXY_URL
                ;;
        esac

        update_env "HTTP_PROXY" "$PROXY_URL"
        update_env "HTTPS_PROXY" "$PROXY_URL"

        echo ""
        echo -e "${GREEN}✓ Прокси настроен: $PROXY_URL${NC}"
        ;;

    4)
        echo ""
        echo -e "${YELLOW}Настройка прокси пропущена${NC}"
        echo "Вы можете настроить прокси позже, отредактировав файл:"
        echo "bot config"
        ;;
esac

# ===============================================
# ТЕСТИРОВАНИЕ ПРОКСИ
# ===============================================
if [ "$PROXY_CHOICE" != "4" ]; then
    echo ""
    echo -e "${BLUE}🔍 ТЕСТИРОВАНИЕ ПРОКСИ${NC}"
    echo "-----------------------------------"

    # Проверка доступности OpenAI
    echo -n "Проверка доступа к OpenAI API... "

    if [ -n "$PROXY_URL" ]; then
        export http_proxy="$PROXY_URL"
        export https_proxy="$PROXY_URL"
    fi

    if curl -s --max-time 10 https://api.openai.com/v1/models > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Успешно${NC}"
        OPENAI_OK=true
    else
        echo -e "${RED}✗ Недоступен${NC}"
        OPENAI_OK=false
    fi

    # Проверка доступности Telegram
    echo -n "Проверка доступа к Telegram API... "
    if curl -s --max-time 10 https://api.telegram.org > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Успешно${NC}"
        TELEGRAM_OK=true
    else
        echo -e "${RED}✗ Недоступен${NC}"
        TELEGRAM_OK=false
    fi

    unset http_proxy
    unset https_proxy

    echo ""
    if [ "$OPENAI_OK" = true ] && [ "$TELEGRAM_OK" = true ]; then
        echo -e "${GREEN}✅ Прокси работает корректно!${NC}"
    elif [ "$OPENAI_OK" = false ]; then
        echo -e "${RED}❌ OpenAI недоступен через этот прокси${NC}"
        echo "Попробуйте другой прокси-сервер"
    elif [ "$TELEGRAM_OK" = false ]; then
        echo -e "${YELLOW}⚠️ Telegram недоступен, но это может быть нормально${NC}"
    fi
fi

# ===============================================
# ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ
# ===============================================
echo ""
echo -e "${BLUE}📝 ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ${NC}"
echo "-----------------------------------"

# Настройка альтернативного endpoint для OpenAI
echo -n "Использовать альтернативный endpoint для OpenAI? (y/n) [n]: "
read USE_ALT_ENDPOINT

if [ "$USE_ALT_ENDPOINT" = "y" ]; then
    echo "Примеры альтернативных endpoint:"
    echo "1. https://api.openai-proxy.com/v1"
    echo "2. https://api.openai.azure.com/v1"
    echo "3. Ввести свой"
    echo ""
    echo -n "Выберите вариант (1-3): "
    read ENDPOINT_CHOICE

    case $ENDPOINT_CHOICE in
        1)
            OPENAI_ENDPOINT="https://api.openai-proxy.com/v1"
            ;;
        2)
            OPENAI_ENDPOINT="https://api.openai.azure.com/v1"
            ;;
        3)
            echo -n "Введите URL endpoint: "
            read OPENAI_ENDPOINT
            ;;
    esac

    update_env "OPENAI_API_BASE" "$OPENAI_ENDPOINT"
    echo -e "${GREEN}✓ Альтернативный endpoint настроен${NC}"
fi

# ===============================================
# СОХРАНЕНИЕ КОНФИГУРАЦИИ
# ===============================================
echo ""
echo -e "${GREEN}✅ Настройка прокси завершена!${NC}"
echo ""
echo "Конфигурация сохранена в: $ENV_FILE"
echo ""
echo "Для применения изменений перезапустите бота:"
echo -e "${CYAN}bot restart${NC}"
echo ""

# ===============================================
# СОЗДАНИЕ СПРАВКИ
# ===============================================
cat > /home/telegram-bot/PROXY_HELP.md << 'EOF'
# 🌐 Справка по настройке прокси

## Текущие настройки прокси

Проверить текущие настройки:
```bash
grep PROXY /home/telegram-bot/app/.env
```

## Варианты прокси-серверов

### 1. Cloudflare WARP (рекомендуется)
- Бесплатный
- Надежный
- Автоматическая установка через скрипт

### 2. Собственный VPS с прокси
Настройте Shadowsocks или V2Ray на отдельном VPS в разрешенной стране.

### 3. Платные прокси-сервисы
- ProxyMesh
- Bright Data
- SmartProxy

### 4. Бесплатные прокси (не рекомендуется)
- proxy.antizapret.prostovpn.org:3128
- Публичные SOCKS5 прокси

## Форматы прокси в .env

```bash
# HTTP прокси
HTTP_PROXY=http://proxy.example.com:8080
HTTPS_PROXY=http://proxy.example.com:8080

# SOCKS5 прокси
HTTP_PROXY=socks5://127.0.0.1:1080
HTTPS_PROXY=socks5://127.0.0.1:1080

# С авторизацией
HTTP_PROXY=http://user:pass@proxy.example.com:8080
HTTPS_PROXY=http://user:pass@proxy.example.com:8080
```

## Проверка работы прокси

```bash
# Тест OpenAI
export https_proxy="ваш_прокси"
curl https://api.openai.com/v1/models

# Тест Telegram
curl https://api.telegram.org
```

## Решение проблем

### OpenAI не работает через прокси
1. Попробуйте SOCKS5 вместо HTTP
2. Используйте Cloudflare WARP
3. Настройте альтернативный endpoint

### Telegram не работает
1. Проверьте что прокси поддерживает HTTPS
2. Попробуйте без прокси (если Telegram не заблокирован)

### Бот не подключается
1. Проверьте формат прокси в .env
2. Убедитесь что прокси работает
3. Перезапустите бота: `bot restart`
EOF

echo -e "${BLUE}📚 Справка по прокси сохранена в:${NC}"
echo "/home/telegram-bot/PROXY_HELP.md"
echo ""
