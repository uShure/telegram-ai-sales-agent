# 🚀 Полная очистка и развертывание на First VDS

## ⚠️ ВНИМАНИЕ
Этот скрипт **ПОЛНОСТЬЮ ОЧИСТИТ** ваш сервер и установит только Telegram AI Sales Agent!

### Что будет удалено:
- ✅ Все Docker контейнеры и образы
- ✅ Все веб-приложения
- ✅ Все базы данных (кроме системных)
- ✅ Все пользовательские сервисы
- ✅ Nginx, Apache и другие веб-серверы
- ✅ Node.js, npm, yarn
- ✅ Все данные в /home/* (кроме root)

### Что будет сохранено:
- ✅ SSH ключи и доступ
- ✅ Сетевые настройки
- ✅ Системные сервисы

## 📦 Быстрая установка

### Шаг 1: Подключитесь к серверу
```bash
ssh root@ваш_ip_адрес
```

### Шаг 2: Скачайте и запустите скрипт очистки
```bash
# Скачиваем скрипт
wget https://raw.githubusercontent.com/uShure/telegram-ai-sales-agent/main/cleanup-and-deploy.sh

# Делаем исполняемым
chmod +x cleanup-and-deploy.sh

# Запускаем
sudo ./cleanup-and-deploy.sh
```

⚠️ Скрипт попросит подтверждение. Введите `yes` для продолжения.

### Шаг 3: Настройте бота

После установки настройте конфигурацию:
```bash
bot config
```

Заполните обязательные поля:

#### Telegram API
1. Перейдите на https://my.telegram.org
2. Войдите с вашим номером телефона
3. Создайте приложение и получите:
   - `API_ID` - числовой ID приложения
   - `API_HASH` - хеш приложения

#### OpenAI API
1. Перейдите на https://platform.openai.com/api-keys
2. Создайте новый API ключ
3. Вставьте в `OPENAI_API_KEY`

#### Telegram Bot
1. Откройте @BotFather в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Получите токен и вставьте в `TELEGRAM_BOT_TOKEN`

### Шаг 4: Запустите бота
```bash
bot start
```

## 🎯 Команды управления

### Основные команды
| Команда | Описание |
|---------|----------|
| `bot start` | Запустить бота |
| `bot stop` | Остановить бота |
| `bot restart` | Перезапустить бота |
| `bot status` | Проверить статус |
| `bot logs` | Просмотр логов |
| `bot errors` | Просмотр ошибок |
| `bot config` | Редактировать конфигурацию |
| `bot update` | Обновить из GitHub |
| `bot backup` | Создать резервную копию |
| `bot monitor` | Мониторинг системы |

### Примеры использования

#### Просмотр логов в реальном времени
```bash
bot logs
# Для выхода нажмите Ctrl+C
```

#### Проверка состояния системы
```bash
bot monitor
```
Вывод:
```
=============================
📊 Bot Monitoring
=============================
Status: ✅ Running
Memory: 512MB/2GB (25.0%)
Disk: 5GB/20GB (25%)
CPU Load: 0.15, 0.10, 0.05
=============================
```

#### Создание бэкапа
```bash
bot backup
```
Бэкапы сохраняются в `/home/telegram-bot/app/backups/`

## 🔧 Настройка прокси (если нужно)

Если OpenAI заблокирован в вашем регионе:

1. Откройте конфигурацию:
```bash
bot config
```

2. Раскомментируйте и заполните строку:
```env
HTTPS_PROXY=http://ваш-прокси:порт
```

3. Перезапустите бота:
```bash
bot restart
```

## 📊 Мониторинг и логи

### Просмотр логов
```bash
# Основные логи
bot logs

# Только ошибки
bot errors

# Системные логи бота
journalctl -u telegram-bot -f
```

### Проверка использования ресурсов
```bash
# Общий мониторинг
bot monitor

# Детальный мониторинг процессов
htop

# Использование диска
df -h

# Использование памяти
free -h
```

## 🔄 Обновление бота

### Автоматическое обновление
```bash
bot update
```

### Ручное обновление
```bash
cd /home/telegram-bot/app
sudo -u telegram-bot git pull
sudo -u telegram-bot bun install
bot restart
```

## 🛟 Восстановление из бэкапа

### Просмотр доступных бэкапов
```bash
ls -la /home/telegram-bot/app/backups/
```

### Восстановление
```bash
cd /home/telegram-bot/app
tar -xzf backups/backup_20250112_120000.tar.gz
bot restart
```

## ❓ Решение проблем

### Бот не запускается

1. Проверьте конфигурацию:
```bash
cat /home/telegram-bot/app/.env | grep -E "API_ID|API_HASH|OPENAI_API_KEY|TELEGRAM_BOT_TOKEN"
```

2. Проверьте логи ошибок:
```bash
bot errors
```

3. Попробуйте запустить вручную:
```bash
cd /home/telegram-bot/app
sudo -u telegram-bot bun run src/index.ts
```

### Ошибка "API key invalid"

1. Проверьте правильность ключей:
   - OpenAI: https://platform.openai.com/api-keys
   - Telegram: https://my.telegram.org

2. Проверьте баланс OpenAI аккаунта

### Высокое использование памяти

```bash
# Перезапустить бота
bot restart

# Очистить логи
rm /home/telegram-bot/app/logs/*.log
bot restart
```

### База данных повреждена

```bash
# Проверка целостности
sqlite3 /home/telegram-bot/app/conversations.db "PRAGMA integrity_check;"

# Восстановление из бэкапа
cd /home/telegram-bot/app
tar -xzf backups/последний_бэкап.tar.gz conversations.db
bot restart
```

## 🔒 Безопасность

### Что уже настроено:
- ✅ UFW Firewall (порты: SSH, 80, 443)
- ✅ Fail2ban (защита от брутфорса)
- ✅ Изолированный пользователь для бота
- ✅ Ограничения systemd
- ✅ Автоматическая ротация логов

### Дополнительные меры (рекомендуется):

#### Смена SSH порта
```bash
# Редактируем конфигурацию
nano /etc/ssh/sshd_config

# Меняем строку Port 22 на Port 2222 (или другой)
Port 2222

# Перезапускаем SSH
systemctl restart sshd

# Обновляем firewall
ufw allow 2222/tcp
ufw delete allow ssh
```

#### Настройка SSH ключей
На вашем локальном компьютере:
```bash
# Генерируем ключ
ssh-keygen -t ed25519

# Копируем на сервер
ssh-copy-id root@ваш_ip

# На сервере отключаем вход по паролю
nano /etc/ssh/sshd_config
# PasswordAuthentication no
systemctl restart sshd
```

## 📱 Первый запуск бота

После настройки и запуска:

1. Откройте Telegram
2. Найдите вашего бота по имени
3. Нажмите `/start`
4. Бот должен ответить приветствием

### Проверка работы с OpenAI
Отправьте боту любой вопрос о курсах. Бот должен ответить, используя AI.

## 🆘 Поддержка

### Логи для диагностики
При обращении за помощью предоставьте:
```bash
# Сохраните вывод в файл
bot status > debug.txt
bot monitor >> debug.txt
tail -n 100 /home/telegram-bot/app/logs/bot-error.log >> debug.txt
```

### Контакты
- GitHub Issues: https://github.com/uShure/telegram-ai-sales-agent/issues
- Документация: https://github.com/uShure/telegram-ai-sales-agent/wiki

## ✅ Чеклист после установки

- [ ] Скрипт выполнен без ошибок
- [ ] Заполнены все API ключи в конфигурации
- [ ] Бот успешно запущен (`bot status`)
- [ ] Бот отвечает в Telegram
- [ ] Настроены автоматические бэкапы
- [ ] Проверена работа с OpenAI
- [ ] Изменен SSH порт (опционально)
- [ ] Настроены SSH ключи (опционально)
- [ ] Создан первый бэкап (`bot backup`)

---

**Версия:** 1.0.0
**Последнее обновление:** 14.08.2025
