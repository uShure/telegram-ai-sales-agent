# 📚 Руководство по развертыванию на First VDS

## 🚀 Быстрый старт

### 1. Подключение к серверу
```bash
ssh root@your_server_ip
```

### 2. Запуск скрипта установки
```bash
# Скачайте и запустите скрипт развертывания
wget https://raw.githubusercontent.com/uShure/telegram-ai-sales-agent/main/deploy-vds.sh
chmod +x deploy-vds.sh
sudo ./deploy-vds.sh
```

### 3. Настройка конфигурации
После установки отредактируйте файл `.env`:
```bash
nano /home/telegram-bot/app/.env
```

Заполните следующие обязательные поля:
- `API_ID` - получить на https://my.telegram.org
- `API_HASH` - получить на https://my.telegram.org
- `PHONE_NUMBER` - ваш номер телефона
- `OPENAI_API_KEY` - ключ OpenAI API
- `TELEGRAM_BOT_TOKEN` - токен бота от @BotFather

### 4. Запуск бота
```bash
telegram-bot-manage start
```

## 📋 Системные требования

### Минимальные требования
- **ОС:** Ubuntu 20.04+ / Debian 10+
- **RAM:** 1 GB
- **CPU:** 1 ядро
- **Диск:** 10 GB
- **Сеть:** Стабильное интернет-соединение

### Рекомендуемые требования
- **ОС:** Ubuntu 22.04 LTS
- **RAM:** 2 GB
- **CPU:** 2 ядра
- **Диск:** 20 GB SSD
- **Сеть:** 100 Мбит/с

## 🛠️ Команды управления

### Основные команды
```bash
# Запуск бота
telegram-bot-manage start

# Остановка бота
telegram-bot-manage stop

# Перезапуск бота
telegram-bot-manage restart

# Проверка статуса
telegram-bot-manage status

# Просмотр логов
telegram-bot-manage logs

# Просмотр ошибок
telegram-bot-manage errors

# Мониторинг системы
telegram-bot-manage monitor

# Обновление бота
telegram-bot-manage update
```

### Работа с бэкапами
```bash
# Создать бэкап
/home/telegram-bot/app/backup.sh backup

# Показать список бэкапов
/home/telegram-bot/app/backup.sh list

# Восстановить из бэкапа
/home/telegram-bot/app/backup.sh restore <backup_file> <target_db>

# Проверить целостность БД
/home/telegram-bot/app/backup.sh check
```

### Настройка автоматических бэкапов
Добавьте в crontab:
```bash
crontab -e
```

Добавьте строку:
```cron
0 3 * * * /home/telegram-bot/app/backup.sh backup
```

## 🔒 Безопасность

### Основные меры защиты
1. **Firewall (UFW)** - автоматически настраивается скриптом
2. **Fail2ban** - защита от брутфорса SSH
3. **Изоляция процесса** - бот работает от отдельного пользователя
4. **Ограничения systemd** - ограничен доступ к системным ресурсам
5. **Ротация логов** - автоматическая очистка старых логов

### Дополнительные рекомендации

#### 1. Смена SSH порта
```bash
# Редактируем конфигурацию SSH
nano /etc/ssh/sshd_config

# Меняем порт (например, на 2222)
Port 2222

# Перезапускаем SSH
systemctl restart sshd

# Обновляем firewall
ufw allow 2222/tcp
```

#### 2. Настройка SSH ключей
```bash
# На локальной машине
ssh-keygen -t ed25519 -C "your_email@example.com"

# Копируем ключ на сервер
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@your_server_ip

# Отключаем вход по паролю
nano /etc/ssh/sshd_config
# PasswordAuthentication no
systemctl restart sshd
```

#### 3. Настройка HTTPS прокси (опционально)
Если OpenAI заблокирован в вашем регионе:
```bash
# В файле .env добавьте
HTTPS_PROXY=http://your-proxy:port
```

## 📊 Мониторинг

### Просмотр статистики
```bash
# Использование ресурсов
htop

# Статус бота
telegram-bot-manage monitor

# Размер баз данных
du -h /home/telegram-bot/app/*.db

# Размер логов
du -h /home/telegram-bot/app/logs/
```

### Настройка алертов
Создайте скрипт мониторинга `/home/telegram-bot/monitor-alert.sh`:
```bash
#!/bin/bash

# Проверка работы бота
if ! systemctl is-active --quiet telegram-bot; then
    echo "Bot is down!" | mail -s "Alert: Telegram Bot" admin@example.com
    systemctl restart telegram-bot
fi

# Проверка места на диске
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage is ${DISK_USAGE}%" | mail -s "Alert: Disk Space" admin@example.com
fi
```

Добавьте в crontab:
```cron
*/5 * * * * /home/telegram-bot/monitor-alert.sh
```

## 🔄 Обновление

### Автоматическое обновление
```bash
telegram-bot-manage update
```

### Ручное обновление
```bash
cd /home/telegram-bot/app
sudo -u telegram-bot git pull
sudo -u telegram-bot bun install
systemctl restart telegram-bot
```

### Откат к предыдущей версии
```bash
cd /home/telegram-bot/app
sudo -u telegram-bot git log --oneline -10
sudo -u telegram-bot git checkout <commit_hash>
sudo -u telegram-bot bun install
systemctl restart telegram-bot
```

## 🐛 Решение проблем

### Бот не запускается
```bash
# Проверьте логи
journalctl -u telegram-bot -n 50

# Проверьте конфигурацию
cat /home/telegram-bot/app/.env

# Проверьте права доступа
ls -la /home/telegram-bot/app/

# Попробуйте запустить вручную
cd /home/telegram-bot/app
sudo -u telegram-bot bun run src/index.ts
```

### Ошибки OpenAI API
- Проверьте правильность API ключа
- Проверьте баланс аккаунта OpenAI
- Проверьте лимиты rate limiting

### База данных повреждена
```bash
# Проверка целостности
/home/telegram-bot/app/backup.sh check

# Восстановление из последнего бэкапа
cd /home/telegram-bot/backups
ls -la
/home/telegram-bot/app/backup.sh restore <latest_backup.gz> /home/telegram-bot/app/conversations.db
```

### Высокое использование памяти
```bash
# Перезапуск бота
systemctl restart telegram-bot

# Очистка логов
rm /home/telegram-bot/app/logs/*.log
systemctl restart telegram-bot

# Проверка утечек памяти
journalctl -u telegram-bot | grep -i memory
```

## 📈 Оптимизация производительности

### 1. Настройка swap (если мало RAM)
```bash
# Создание swap файла
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Добавление в автозагрузку
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Настройка swappiness
echo 'vm.swappiness=10' >> /etc/sysctl.conf
sysctl -p
```

### 2. Настройка лимитов системы
```bash
# Увеличение лимитов открытых файлов
echo '* soft nofile 65536' >> /etc/security/limits.conf
echo '* hard nofile 65536' >> /etc/security/limits.conf
```

### 3. Оптимизация базы данных
```bash
# Вакуумирование SQLite
sqlite3 /home/telegram-bot/app/conversations.db "VACUUM;"
sqlite3 /home/telegram-bot/app/courses.db "VACUUM;"
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `telegram-bot-manage logs`
2. Проверьте эту документацию
3. Создайте issue на GitHub
4. Свяжитесь с разработчиком

## 📝 Чеклист после установки

- [ ] Заполнены все переменные в `.env`
- [ ] Бот успешно запускается
- [ ] Настроены автоматические бэкапы
- [ ] Проверена работа с Telegram
- [ ] Проверена работа с OpenAI
- [ ] Настроен мониторинг
- [ ] Изменен SSH порт
- [ ] Настроены SSH ключи
- [ ] Отключен вход по паролю
- [ ] Проверены логи на ошибки
- [ ] Создан первый бэкап

---

**Версия документации:** 1.0.0
**Последнее обновление:** 2025-01-12
