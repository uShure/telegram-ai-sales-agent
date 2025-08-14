# 🔴 Бот не отвечает в Telegram - Решение проблемы

## ⚡ Быстрая диагностика

### Запустите скрипт диагностики:
```bash
cd /root
wget https://raw.githubusercontent.com/uShure/telegram-ai-sales-agent/main/diagnose-bot.sh
chmod +x diagnose-bot.sh
sudo ./diagnose-bot.sh
```

Скрипт автоматически проверит все компоненты и предложит исправления.

---

## 🔍 Ручная проверка по шагам

### 1. Проверьте статус бота
```bash
bot status
```

Если команда не найдена:
```bash
systemctl status telegram-bot
```

### 2. Проверьте логи на ошибки
```bash
bot errors
# или
tail -50 /home/telegram-bot/app/logs/bot-error.log
```

### 3. Проверьте конфигурацию
```bash
cat /home/telegram-bot/app/.env | grep -E "TELEGRAM_BOT_TOKEN|API_ID|API_HASH|OPENAI_API_KEY"
```

---

## ❌ Частые проблемы и решения

### Проблема 1: "Сервис не запущен"

**Симптомы:**
- `bot status` показывает "inactive" или "failed"

**Решение:**
```bash
# Попробуйте запустить
bot start

# Если не помогает, запустите вручную для отладки
cd /home/telegram-bot/app
/root/.bun/bin/bun run src/index.ts
```

### Проблема 2: "API ключи не настроены"

**Симптомы:**
- В логах ошибки типа "API_ID is not defined"
- "Invalid bot token"

**Решение:**
```bash
# Используйте интерактивный помощник
cd /root
./quick-setup.sh

# Или отредактируйте вручную
bot config
```

**Где получить ключи:**
- **API_ID и API_HASH**: https://my.telegram.org
- **TELEGRAM_BOT_TOKEN**: @BotFather в Telegram
- **OPENAI_API_KEY**: https://platform.openai.com/api-keys

### Проблема 3: "OpenAI недоступен"

**Симптомы:**
- Ошибки "connect ETIMEDOUT" для api.openai.com
- "Request failed with status code 403"

**Решение - настройте VLESS прокси:**
```bash
cd /root
wget https://raw.githubusercontent.com/uShure/telegram-ai-sales-agent/main/setup-vless-proxy.sh
chmod +x setup-vless-proxy.sh
sudo ./setup-vless-proxy.sh
```

После настройки прокси:
```bash
# Проверьте прокси
proxy test

# Перезапустите бота
bot restart
```

### Проблема 4: "Бот не получает сообщения"

**Симптомы:**
- Бот запущен, но не реагирует на команды
- В логах нет новых сообщений

**Решение:**

1. **Проверьте токен бота:**
```bash
# Получите токен из конфигурации
TOKEN=$(grep TELEGRAM_BOT_TOKEN /home/telegram-bot/app/.env | cut -d= -f2)

# Проверьте бота через API
curl "https://api.telegram.org/bot$TOKEN/getMe"
```

2. **Проверьте обновления:**
```bash
curl "https://api.telegram.org/bot$TOKEN/getUpdates"
```

3. **Убедитесь что написали боту /start**

4. **Проверьте правильность username бота**

### Проблема 5: "Session string expired"

**Симптомы:**
- Ошибка "The current session is no longer valid"

**Решение:**
```bash
# Удалите старую сессию
rm /home/telegram-bot/app/*.session

# Перезапустите бота
bot restart

# При первом запуске введите код подтверждения из Telegram
```

### Проблема 6: "База данных повреждена"

**Симптомы:**
- Ошибки "database disk image is malformed"

**Решение:**
```bash
# Переименуйте поврежденную базу
mv /home/telegram-bot/app/conversations.db /home/telegram-bot/app/conversations.db.broken

# Перезапустите бота (создаст новую БД)
bot restart
```

---

## 🔄 Полная переустановка (крайний случай)

Если ничего не помогает, выполните полную переустановку:

```bash
cd /root
wget https://raw.githubusercontent.com/uShure/telegram-ai-sales-agent/main/fix-and-continue-setup.sh
chmod +x fix-and-continue-setup.sh
sudo ./fix-and-continue-setup.sh
```

---

## 📝 Чеклист проверки

- [ ] Бот запущен (`bot status`)
- [ ] Нет ошибок в логах (`bot errors`)
- [ ] API ключи заполнены правильно
- [ ] Telegram Bot Token действителен
- [ ] OpenAI доступен (через прокси если нужно)
- [ ] Написали боту /start в Telegram
- [ ] Используете правильного бота (@ваш_бот)

---

## 🆘 Если ничего не помогает

### Соберите информацию для диагностики:

```bash
# Создайте файл с диагностикой
(
echo "=== SYSTEM INFO ==="
uname -a
echo ""
echo "=== BOT STATUS ==="
systemctl status telegram-bot --no-pager
echo ""
echo "=== LAST ERRORS ==="
tail -20 /home/telegram-bot/app/logs/bot-error.log
echo ""
echo "=== CONFIG CHECK ==="
ls -la /home/telegram-bot/app/.env
grep -E "API_ID|API_HASH|TELEGRAM_BOT|OPENAI" /home/telegram-bot/app/.env | sed 's/=.*/=***/'
echo ""
echo "=== PROCESS CHECK ==="
ps aux | grep bun
echo ""
echo "=== NETWORK CHECK ==="
curl -s https://api.telegram.org
echo ""
proxy test
) > bot-debug.log 2>&1
```

### Проверьте типичные ошибки:

1. **Неправильный формат номера телефона**
   - Должен быть с кодом страны: +79991234567

2. **Неправильный API ключ OpenAI**
   - Должен начинаться с `sk-`
   - Проверьте баланс на счету OpenAI

3. **Бот заблокирован в Telegram**
   - Проверьте не заблокировали ли вы бота
   - Попробуйте создать нового бота у @BotFather

4. **Конфликт портов**
   ```bash
   netstat -tuln | grep -E "1080|8118"
   ```

---

## 📊 Мониторинг после исправления

После устранения проблемы:

```bash
# Мониторинг в реальном времени
watch -n 5 'bot status; echo ""; tail -5 /home/telegram-bot/app/logs/bot.log'

# Проверка использования ресурсов
bot monitor

# Автоматический перезапуск при падении (уже настроен в cron)
crontab -l | grep telegram-bot
```

---

**Последнее обновление:** 14.08.2025
