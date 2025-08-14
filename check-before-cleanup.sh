#!/bin/bash

# ===============================================
# 🔍 Скрипт проверки системы перед очисткой
# ===============================================

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "==============================================="
echo -e "${CYAN}🔍 АНАЛИЗ ТЕКУЩЕГО СОСТОЯНИЯ СЕРВЕРА${NC}"
echo "==============================================="
echo ""
echo -e "${YELLOW}Этот скрипт покажет, что будет удалено при очистке${NC}"
echo ""

# Функция для подсчета размера
get_size() {
    if [ -d "$1" ] || [ -f "$1" ]; then
        du -sh "$1" 2>/dev/null | cut -f1
    else
        echo "0"
    fi
}

# ===============================================
# ИНФОРМАЦИЯ О СИСТЕМЕ
# ===============================================
echo -e "${BLUE}📊 ИНФОРМАЦИЯ О СИСТЕМЕ${NC}"
echo "-----------------------------------"
echo "Hostname: $(hostname)"
echo "OS: $(lsb_release -d | cut -f2)"
echo "Kernel: $(uname -r)"
echo "Uptime: $(uptime -p)"
echo ""

# ===============================================
# ИСПОЛЬЗОВАНИЕ РЕСУРСОВ
# ===============================================
echo -e "${BLUE}💾 ИСПОЛЬЗОВАНИЕ РЕСУРСОВ${NC}"
echo "-----------------------------------"
echo "RAM: $(free -h | awk 'NR==2{printf "%s / %s (%.1f%%)", $3, $2, $3*100/$2}')"
echo "Disk: $(df -h / | awk 'NR==2{printf "%s / %s (%s)", $3, $2, $5}')"
echo "CPU cores: $(nproc)"
echo ""

# ===============================================
# DOCKER
# ===============================================
echo -e "${BLUE}🐳 DOCKER${NC}"
echo "-----------------------------------"
if command -v docker &> /dev/null; then
    echo -e "${RED}Docker установлен - БУДЕТ УДАЛЕН${NC}"

    # Контейнеры
    CONTAINERS=$(docker ps -aq | wc -l)
    if [ "$CONTAINERS" -gt 0 ]; then
        echo "  Контейнеров: $CONTAINERS"
        docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | head -10
    fi

    # Образы
    IMAGES=$(docker images -q | wc -l)
    if [ "$IMAGES" -gt 0 ]; then
        echo "  Образов: $IMAGES"
    fi

    # Volumes
    VOLUMES=$(docker volume ls -q | wc -l)
    if [ "$VOLUMES" -gt 0 ]; then
        echo "  Volumes: $VOLUMES"
    fi

    # Размер
    DOCKER_SIZE=$(get_size /var/lib/docker)
    echo "  Занимает места: $DOCKER_SIZE"
else
    echo -e "${GREEN}Docker не установлен${NC}"
fi
echo ""

# ===============================================
# ВЕБ-СЕРВЕРЫ
# ===============================================
echo -e "${BLUE}🌐 ВЕБ-СЕРВЕРЫ${NC}"
echo "-----------------------------------"
for service in nginx apache2 httpd; do
    if systemctl is-enabled --quiet $service 2>/dev/null; then
        echo -e "${RED}$service - БУДЕТ УДАЛЕН${NC}"
        systemctl status $service --no-pager | grep "Active:" | sed 's/^/  /'
    fi
done

# Проверка веб-директорий
if [ -d "/var/www" ] && [ "$(ls -A /var/www)" ]; then
    echo -e "${RED}/var/www содержит данные - БУДЕТ ОЧИЩЕН${NC}"
    WWW_SIZE=$(get_size /var/www)
    echo "  Размер: $WWW_SIZE"
    echo "  Сайтов: $(find /var/www -maxdepth 1 -type d | wc -l)"
fi
echo ""

# ===============================================
# NODE.JS И ПАКЕТНЫЕ МЕНЕДЖЕРЫ
# ===============================================
echo -e "${BLUE}📦 NODE.JS И ПАКЕТНЫЕ МЕНЕДЖЕРЫ${NC}"
echo "-----------------------------------"
if command -v node &> /dev/null; then
    echo -e "${RED}Node.js $(node -v) - БУДЕТ УДАЛЕН${NC}"
fi
if command -v npm &> /dev/null; then
    echo -e "${RED}npm $(npm -v) - БУДЕТ УДАЛЕН${NC}"
fi
if command -v yarn &> /dev/null; then
    echo -e "${RED}yarn $(yarn -v) - БУДЕТ УДАЛЕН${NC}"
fi
if command -v bun &> /dev/null; then
    echo -e "${YELLOW}Bun $(bun -v) - будет переустановлен${NC}"
fi
echo ""

# ===============================================
# SYSTEMD СЕРВИСЫ
# ===============================================
echo -e "${BLUE}⚙️ ПОЛЬЗОВАТЕЛЬСКИЕ СЕРВИСЫ${NC}"
echo "-----------------------------------"
SERVICES=$(systemctl list-units --type=service --state=running | grep -v "ssh\|network\|systemd\|kernel" | grep -v "^UNIT" | wc -l)
if [ "$SERVICES" -gt 0 ]; then
    echo -e "${RED}Активных сервисов: $SERVICES - БУДУТ ОСТАНОВЛЕНЫ${NC}"
    systemctl list-units --type=service --state=running | grep -v "ssh\|network\|systemd\|kernel" | head -10
fi
echo ""

# ===============================================
# ПОЛЬЗОВАТЕЛИ И ДОМАШНИЕ ДИРЕКТОРИИ
# ===============================================
echo -e "${BLUE}👥 ПОЛЬЗОВАТЕЛИ И ДИРЕКТОРИИ${NC}"
echo "-----------------------------------"
for dir in /home/*; do
    if [ -d "$dir" ] && [ "$dir" != "/home/root" ]; then
        USER=$(basename "$dir")
        SIZE=$(get_size "$dir")
        echo -e "${RED}$dir - БУДЕТ УДАЛЕН${NC}"
        echo "  Пользователь: $USER"
        echo "  Размер: $SIZE"
    fi
done
echo ""

# ===============================================
# БАЗЫ ДАННЫХ
# ===============================================
echo -e "${BLUE}🗄️ БАЗЫ ДАННЫХ${NC}"
echo "-----------------------------------"
if command -v mysql &> /dev/null; then
    echo -e "${RED}MySQL - БУДЕТ УДАЛЕН${NC}"
fi
if command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL - БУДЕТ УДАЛЕН${NC}"
fi
if command -v mongo &> /dev/null; then
    echo -e "${RED}MongoDB - БУДЕТ УДАЛЕН${NC}"
fi
if command -v redis-cli &> /dev/null; then
    echo -e "${RED}Redis - БУДЕТ УДАЛЕН${NC}"
fi

# SQLite базы
SQLITE_DBS=$(find /home -name "*.db" -o -name "*.sqlite" 2>/dev/null | wc -l)
if [ "$SQLITE_DBS" -gt 0 ]; then
    echo -e "${RED}SQLite баз найдено: $SQLITE_DBS - БУДУТ УДАЛЕНЫ${NC}"
fi
echo ""

# ===============================================
# CRON ЗАДАЧИ
# ===============================================
echo -e "${BLUE}⏰ CRON ЗАДАЧИ${NC}"
echo "-----------------------------------"
CRON_JOBS=$(crontab -l 2>/dev/null | grep -v "^#" | wc -l)
if [ "$CRON_JOBS" -gt 0 ]; then
    echo -e "${RED}Cron задач: $CRON_JOBS - БУДУТ УДАЛЕНЫ${NC}"
    crontab -l 2>/dev/null | grep -v "^#" | head -5
fi
echo ""

# ===============================================
# PYTHON ОКРУЖЕНИЯ
# ===============================================
echo -e "${BLUE}🐍 PYTHON ОКРУЖЕНИЯ${NC}"
echo "-----------------------------------"
VENVS=$(find /opt /home -type d -name "venv*" -o -name "*env" 2>/dev/null | wc -l)
if [ "$VENVS" -gt 0 ]; then
    echo -e "${RED}Виртуальных окружений: $VENVS - БУДУТ УДАЛЕНЫ${NC}"
fi
echo ""

# ===============================================
# ДРУГИЕ ДИРЕКТОРИИ
# ===============================================
echo -e "${BLUE}📁 ДРУГИЕ ДИРЕКТОРИИ${NC}"
echo "-----------------------------------"
if [ -d "/opt" ] && [ "$(ls -A /opt)" ]; then
    OPT_SIZE=$(get_size /opt)
    echo -e "${RED}/opt - БУДЕТ ОЧИЩЕН${NC}"
    echo "  Размер: $OPT_SIZE"
    echo "  Содержимое:"
    ls -la /opt | head -10 | sed 's/^/    /'
fi
echo ""

# ===============================================
# ПРОЦЕССЫ
# ===============================================
echo -e "${BLUE}🔄 АКТИВНЫЕ ПРОЦЕССЫ${NC}"
echo "-----------------------------------"
echo "Top 5 процессов по памяти:"
ps aux --sort=-%mem | head -6 | tail -5 | awk '{printf "  %-20s %s\n", $11, $4"%"}'
echo ""

# ===============================================
# СЕТЕВЫЕ ПОРТЫ
# ===============================================
echo -e "${BLUE}🔌 ОТКРЫТЫЕ ПОРТЫ${NC}"
echo "-----------------------------------"
netstat -tuln | grep LISTEN | grep -v "127.0.0.1" | head -10
echo ""

# ===============================================
# ИТОГОВАЯ СТАТИСТИКА
# ===============================================
echo "==============================================="
echo -e "${CYAN}📊 ИТОГОВАЯ СТАТИСТИКА${NC}"
echo "==============================================="

TOTAL_TO_DELETE=0

# Docker
if command -v docker &> /dev/null; then
    DOCKER_SPACE=$(du -sb /var/lib/docker 2>/dev/null | cut -f1)
    TOTAL_TO_DELETE=$((TOTAL_TO_DELETE + DOCKER_SPACE))
fi

# Home директории
for dir in /home/*; do
    if [ -d "$dir" ] && [ "$dir" != "/home/root" ]; then
        DIR_SPACE=$(du -sb "$dir" 2>/dev/null | cut -f1)
        TOTAL_TO_DELETE=$((TOTAL_TO_DELETE + DIR_SPACE))
    fi
done

# /opt
if [ -d "/opt" ]; then
    OPT_SPACE=$(du -sb /opt 2>/dev/null | cut -f1)
    TOTAL_TO_DELETE=$((TOTAL_TO_DELETE + OPT_SPACE))
fi

# /var/www
if [ -d "/var/www" ]; then
    WWW_SPACE=$(du -sb /var/www 2>/dev/null | cut -f1)
    TOTAL_TO_DELETE=$((TOTAL_TO_DELETE + WWW_SPACE))
fi

# Конвертируем в человекочитаемый формат
if [ "$TOTAL_TO_DELETE" -gt 0 ]; then
    HUMAN_SIZE=$(numfmt --to=iec-i --suffix=B $TOTAL_TO_DELETE)
    echo -e "${RED}Будет освобождено места: ~$HUMAN_SIZE${NC}"
fi

echo ""
echo -e "${YELLOW}⚠️  ВАЖНО:${NC}"
echo "  - SSH доступ будет сохранен"
echo "  - Сетевые настройки останутся без изменений"
echo "  - Будет создан бэкап важных конфигураций"
echo ""
echo "==============================================="
echo -e "${GREEN}Для запуска полной очистки и установки выполните:${NC}"
echo -e "${CYAN}./cleanup-and-deploy.sh${NC}"
echo "==============================================="
