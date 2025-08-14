# 📋 ИНСТРУКЦИЯ ПО ОБНОВЛЕНИЮ БОТА НА СЕРВЕРЕ

## 🚀 Быстрое обновление (если всё настроено)

```bash
# 1. Подключитесь к серверу
ssh root@ваш_сервер

# 2. Перейдите в папку с ботом
cd /root/telegram-ai-sales-agent

# 3. Остановите бота
pm2 stop sales-bot
# или если запущен через systemd:
systemctl stop telegram-sales-bot

# 4. Сохраните резервную копию базы данных
cp courses.db courses.db.backup-$(date +%Y%m%d-%H%M%S)
cp conversations.db conversations.db.backup-$(date +%Y%m%d-%H%M%S)

# 5. Получите обновления из GitHub
git fetch origin
git pull origin main

# 6. Установите/обновите зависимости
bun install

# 7. Проверьте конфигурацию
cat .env  # убедитесь, что все переменные на месте

# 8. Запустите бота
pm2 start sales-bot
# или если через systemd:
systemctl start telegram-sales-bot

# 9. Проверьте логи
pm2 logs sales-bot --lines 50
# или
tail -f sales-bot.log
```

## 📝 Подробная инструкция

### 1️⃣ Подключение к серверу

```bash
ssh root@ваш_сервер
# или с указанием порта
ssh -p 22 root@ваш_сервер
```

### 2️⃣ Проверка текущего состояния

```bash
# Проверьте, запущен ли бот
pm2 status
# или
systemctl status telegram-sales-bot

# Посмотрите текущую версию
cd /root/telegram-ai-sales-agent
git log --oneline -n 5
```

### 3️⃣ Остановка бота (ВАЖНО!)

```bash
# Если используете PM2
pm2 stop sales-bot
pm2 save

# Если используете systemd
systemctl stop telegram-sales-bot

# Если запущен напрямую - найдите процесс
ps aux | grep "bun.*index"
# и остановите по PID
kill -TERM <PID>
```

### 4️⃣ Резервное копирование

```bash
# Создайте папку для бэкапов если её нет
mkdir -p /root/backups

# Сохраните базы данных
cp courses.db /root/backups/courses.db.$(date +%Y%m%d-%H%M%S)
cp conversations.db /root/backups/conversations.db.$(date +%Y%m%d-%H%M%S)

# Сохраните конфигурацию
cp .env /root/backups/.env.backup

# Опционально - полный бэкап папки
tar -czf /root/backups/bot-backup-$(date +%Y%m%d-%H%M%S).tar.gz .
```

### 5️⃣ Обновление кода

```bash
# Сбросьте локальные изменения если они есть (ОСТОРОЖНО!)
git status  # проверьте изменения
git stash   # сохраните локальные изменения временно

# Получите обновления
git fetch origin
git pull origin main

# Если были конфликты
git status
# Разрешите конфликты вручную или используйте:
git checkout --theirs .  # принять все изменения из репозитория
git add .
git commit -m "Merged updates from remote"

# Верните локальные изменения если нужно
git stash pop
```

### 6️⃣ Обновление зависимостей

```bash
# Обновите Bun если нужно
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Установите/обновите пакеты
bun install

# Если есть проблемы с native модулями
rm -rf node_modules
bun install
```

### 7️⃣ Проверка и обновление конфигурации

```bash
# Проверьте .env файл
cat .env

# Если нужно добавить новые переменные из .env.example
diff .env .env.example

# Отредактируйте .env
nano .env
# или
vim .env
```

### 8️⃣ Обновление базы данных курсов

```bash
# ВАЖНО: Новая база перезапишет все курсы!
# Если хотите сохранить изменения - НЕ выполняйте эту команду

# Полное обновление базы курсов (21 курс с актуальными ценами)
bun run update-all-courses-final.js

# Проверка базы
bun run check-all-courses-final.js
```

### 9️⃣ Тестирование перед запуском

```bash
# Проверьте, что всё работает
bun run src/index.ts --test

# Или запустите в режиме отладки
DEBUG=* bun run src/index.ts
# Нажмите Ctrl+C после проверки
```

### 🔟 Запуск бота

#### Вариант A: Через PM2 (рекомендуется)

```bash
# Если PM2 не установлен
npm install -g pm2

# Создайте конфигурацию PM2 (один раз)
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sales-bot',
    script: 'bun',
    args: 'run src/index.ts',
    cwd: '/root/telegram-ai-sales-agent',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000
  }]
}
EOF

# Запустите бота
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # настройте автозапуск
```

#### Вариант B: Через systemd

```bash
# Создайте service файл
cat > /etc/systemd/system/telegram-sales-bot.service << 'EOF'
[Unit]
Description=Telegram Sales Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/telegram-ai-sales-agent
ExecStart=/root/.bun/bin/bun run src/index.ts
Restart=always
RestartSec=10
StandardOutput=append:/root/telegram-ai-sales-agent/sales-bot.log
StandardError=append:/root/telegram-ai-sales-agent/sales-bot-error.log

[Install]
WantedBy=multi-user.target
EOF

# Перезагрузите systemd и запустите
systemctl daemon-reload
systemctl enable telegram-sales-bot
systemctl start telegram-sales-bot
```

### 1️⃣1️⃣ Проверка работы

```bash
# Проверьте статус
pm2 status sales-bot
# или
systemctl status telegram-sales-bot

# Посмотрите логи
pm2 logs sales-bot --lines 100
# или
tail -f sales-bot.log

# Проверьте, что бот отвечает в Telegram
# Напишите боту /start или "Здравствуйте"
```

## 🔧 Решение проблем

### Если бот не запускается

```bash
# Проверьте логи ошибок
pm2 logs sales-bot --err --lines 100
# или
cat sales-bot-error.log

# Частые проблемы:
```

#### 1. AUTH_KEY_DUPLICATED
```bash
# Удалите сессию и перезапустите
rm anon.session session.txt
pm2 restart sales-bot
```

#### 2. База данных повреждена
```bash
# Восстановите из бэкапа
cp /root/backups/courses.db.XXXXXX courses.db
cp /root/backups/conversations.db.XXXXXX conversations.db
# или пересоздайте
bun run fix-all-db.js
```

#### 3. Нет связи с Telegram API
```bash
# Проверьте интернет
ping api.telegram.org

# Проверьте токен бота
grep TELEGRAM_BOT_TOKEN .env

# Проверьте API credentials
grep API_ID .env
grep API_HASH .env
```

#### 4. Проблемы с OpenAI API
```bash
# Проверьте ключ
grep OPENAI_API_KEY .env

# Проверьте прокси если используется
grep HTTP_PROXY .env
```

### Откат к предыдущей версии

```bash
# Посмотрите историю коммитов
git log --oneline -n 10

# Откатитесь к нужному коммиту
git checkout <commit-hash>

# Или откатитесь на один коммит назад
git checkout HEAD~1

# Перезапустите бота
pm2 restart sales-bot
```

### Полный сброс и переустановка

```bash
# ВНИМАНИЕ: Это удалит все данные!
cd /root
mv telegram-ai-sales-agent telegram-ai-sales-agent.old

# Клонируйте заново
git clone https://github.com/uShure/telegram-ai-sales-agent.git
cd telegram-ai-sales-agent

# Скопируйте конфигурацию
cp ../telegram-ai-sales-agent.old/.env .

# Установите зависимости
bun install

# Создайте базы данных
bun run update-all-courses-final.js

# Запустите
pm2 start ecosystem.config.js
```

## 📊 Мониторинг

```bash
# Настройте мониторинг PM2
pm2 install pm2-logrotate  # ротация логов
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Проверяйте использование ресурсов
pm2 monit

# Настройте алерты (опционально)
pm2 install pm2-slack  # уведомления в Slack
```

## 📌 Важные замечания

1. **ВСЕГДА делайте бэкап** перед обновлением
2. **Проверяйте логи** после запуска
3. **Тестируйте бота** отправкой сообщения
4. **Следите за памятью** - бот может потреблять 200-500MB RAM
5. **Обновляйте регулярно** - исправления и улучшения выходят часто

## 🆘 Контакты для помощи

Если возникли проблемы:
1. Проверьте файл `TROUBLESHOOTING.md`
2. Посмотрите логи ошибок
3. Обратитесь в поддержку: [укажите новый email поддержки]
