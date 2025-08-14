#!/bin/bash

# Скрипт резервного копирования баз данных
# Для использования на VDS

# Настройки
BACKUP_DIR="/home/telegram-bot/backups"
APP_DIR="/home/telegram-bot/app"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Функции логирования
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Создание директории для бэкапов
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    log_info "Создана директория для бэкапов: $BACKUP_DIR"
fi

# Функция создания бэкапа
create_backup() {
    local db_file=$1
    local db_name=$2

    if [ -f "$db_file" ]; then
        backup_file="$BACKUP_DIR/${db_name}_${TIMESTAMP}.db"

        # Создание бэкапа
        cp "$db_file" "$backup_file"

        # Сжатие бэкапа
        gzip "$backup_file"

        if [ -f "${backup_file}.gz" ]; then
            log_info "Бэкап создан: ${backup_file}.gz"

            # Вычисление размера
            size=$(du -h "${backup_file}.gz" | cut -f1)
            log_info "Размер бэкапа: $size"
        else
            log_error "Не удалось создать бэкап для $db_name"
            return 1
        fi
    else
        log_warn "База данных не найдена: $db_file"
        return 1
    fi
}

# Функция удаления старых бэкапов
cleanup_old_backups() {
    log_info "Удаление бэкапов старше $RETENTION_DAYS дней..."

    find "$BACKUP_DIR" -name "*.gz" -type f -mtime +$RETENTION_DAYS -delete

    # Подсчет оставшихся бэкапов
    backup_count=$(ls -1 "$BACKUP_DIR"/*.gz 2>/dev/null | wc -l)
    log_info "Осталось бэкапов: $backup_count"
}

# Функция проверки целостности базы данных
check_database_integrity() {
    local db_file=$1
    local db_name=$2

    if [ -f "$db_file" ]; then
        log_info "Проверка целостности $db_name..."

        result=$(sqlite3 "$db_file" "PRAGMA integrity_check;" 2>&1)

        if [ "$result" = "ok" ]; then
            log_info "База данных $db_name в порядке"
            return 0
        else
            log_error "Обнаружены проблемы в базе данных $db_name: $result"
            return 1
        fi
    else
        log_warn "База данных не найдена для проверки: $db_file"
        return 1
    fi
}

# Функция восстановления из бэкапа
restore_backup() {
    local backup_file=$1
    local target_db=$2

    if [ ! -f "$backup_file" ]; then
        log_error "Файл бэкапа не найден: $backup_file"
        return 1
    fi

    # Создание резервной копии текущей БД
    if [ -f "$target_db" ]; then
        cp "$target_db" "${target_db}.before_restore"
        log_info "Создана резервная копия текущей БД: ${target_db}.before_restore"
    fi

    # Распаковка если файл сжат
    if [[ "$backup_file" == *.gz ]]; then
        log_info "Распаковка бэкапа..."
        gunzip -c "$backup_file" > "${backup_file%.gz}"
        backup_file="${backup_file%.gz}"
    fi

    # Восстановление
    cp "$backup_file" "$target_db"

    if [ $? -eq 0 ]; then
        log_info "База данных восстановлена из бэкапа"

        # Проверка восстановленной БД
        if check_database_integrity "$target_db" "восстановленная"; then
            log_info "Восстановление прошло успешно"
            return 0
        else
            log_error "Восстановленная БД повреждена, откат изменений..."
            if [ -f "${target_db}.before_restore" ]; then
                mv "${target_db}.before_restore" "$target_db"
            fi
            return 1
        fi
    else
        log_error "Ошибка при восстановлении"
        return 1
    fi
}

# Функция отправки бэкапа на внешнее хранилище (опционально)
upload_to_remote() {
    local backup_file=$1

    # Пример для загрузки на удаленный сервер через SCP
    # Раскомментируйте и настройте при необходимости

    # REMOTE_HOST="backup.example.com"
    # REMOTE_USER="backup_user"
    # REMOTE_PATH="/backups/telegram-bot/"

    # if [ ! -z "$REMOTE_HOST" ]; then
    #     log_info "Загрузка бэкапа на удаленный сервер..."
    #     scp "$backup_file" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
    #
    #     if [ $? -eq 0 ]; then
    #         log_info "Бэкап загружен на удаленный сервер"
    #     else
    #         log_error "Ошибка при загрузке на удаленный сервер"
    #     fi
    # fi
}

# Главная функция
main() {
    echo "==================================="
    echo "🗄️  Резервное копирование баз данных"
    echo "==================================="
    echo ""

    # Проверка целостности баз данных
    log_info "Начало проверки целостности..."
    check_database_integrity "$APP_DIR/conversations.db" "conversations"
    check_database_integrity "$APP_DIR/courses.db" "courses"

    # Создание бэкапов
    log_info "Начало создания бэкапов..."
    create_backup "$APP_DIR/conversations.db" "conversations"
    create_backup "$APP_DIR/courses.db" "courses"

    # Бэкап сессии если существует
    if [ -f "$APP_DIR/sointera_sales_session.txt" ]; then
        cp "$APP_DIR/sointera_sales_session.txt" "$BACKUP_DIR/session_${TIMESTAMP}.txt"
        log_info "Сессия сохранена"
    fi

    # Бэкап .env файла (без чувствительных данных в логах)
    if [ -f "$APP_DIR/.env" ]; then
        cp "$APP_DIR/.env" "$BACKUP_DIR/env_${TIMESTAMP}.txt"
        chmod 600 "$BACKUP_DIR/env_${TIMESTAMP}.txt"
        log_info "Конфигурация сохранена"
    fi

    # Очистка старых бэкапов
    cleanup_old_backups

    # Отчет о использовании диска
    log_info "Использование диска:"
    du -sh "$BACKUP_DIR"

    echo ""
    echo "==================================="
    echo "✅ Резервное копирование завершено"
    echo "==================================="
}

# Обработка аргументов командной строки
case "$1" in
    backup)
        main
        ;;
    restore)
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Использование: $0 restore <backup_file> <target_database>"
            echo "Пример: $0 restore /home/telegram-bot/backups/conversations_20240112_120000.db.gz /home/telegram-bot/app/conversations.db"
            exit 1
        fi
        restore_backup "$2" "$3"
        ;;
    list)
        echo "Доступные бэкапы:"
        ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null || echo "Бэкапы не найдены"
        ;;
    check)
        check_database_integrity "$APP_DIR/conversations.db" "conversations"
        check_database_integrity "$APP_DIR/courses.db" "courses"
        ;;
    *)
        echo "Использование: $0 {backup|restore|list|check}"
        echo ""
        echo "  backup  - Создать новый бэкап"
        echo "  restore - Восстановить из бэкапа"
        echo "  list    - Показать список бэкапов"
        echo "  check   - Проверить целостность БД"
        exit 1
        ;;
esac
