# 📱 Настройка Telegram Userbot (реальный аккаунт)

## ⚠️ ВАЖНО ПОНИМАТЬ

**Это НЕ обычный бот!** Это userbot, который:
- ✅ Работает через ВАШ реальный Telegram аккаунт
- ✅ Отвечает на сообщения от ВАШЕГО имени
- ✅ Имеет доступ ко ВСЕМ вашим чатам
- ✅ Использует AI для генерации ответов

## 🚀 Быстрая настройка

### 1. Запустите скрипт настройки userbot:
```bash
cd /root
wget https://raw.githubusercontent.com/uShure/telegram-ai-sales-agent/main/setup-userbot.sh
chmod +x setup-userbot.sh
sudo ./setup-userbot.sh
```

### 2. Введите необходимые данные:

#### Telegram API (обязательно):
1. Откройте https://my.telegram.org
2. Войдите с вашим номером телефона
3. Перейдите в "API development tools"
4. Создайте приложение (любое название)
5. Получите:
   - **API_ID** - числовой ID
   - **API_HASH** - строка из 32 символов

#### Ваш номер телефона:
- Формат: `+79991234567` (с кодом страны)
- Это номер вашего Telegram аккаунта

#### OpenAI API ключ:
- Получите на https://platform.openai.com/api-keys
- Начинается с `sk-`

### 3. Авторизация:

Когда скрипт запустится, он попросит:
1. **Код подтверждения** - придет в Telegram от "Telegram"
2. **Пароль 2FA** - если у вас включена двухфакторная аутентификация

---

## 🔧 Ручная настройка

### Шаг 1: Настройте конфигурацию
```bash
nano /home/telegram-bot/app/.env
```

Заполните:
```env
# Telegram API
API_ID=ваш_api_id
API_HASH=ваш_api_hash
PHONE_NUMBER=+79991234567

# OpenAI
OPENAI_API_KEY=sk-...

# Прокси (если нужен для OpenAI)
HTTPS_PROXY=socks5://127.0.0.1:1080
```

### Шаг 2: Первый запуск для авторизации
```bash
cd /home/telegram-bot/app
sudo -u telegram-bot /root/.bun/bin/bun run src/index.ts
```

Введите код из Telegram когда попросит.

### Шаг 3: Запустите как сервис
```bash
bot restart
bot status
```

---

## 🌐 Настройка прокси для OpenAI

Если OpenAI заблокирован в вашем регионе:

### Вариант 1: VLESS прокси (рекомендуется)
```bash
cd /root
wget https://raw.githubusercontent.com/uShure/telegram-ai-sales-agent/main/setup-vless-proxy.sh
chmod +x setup-vless-proxy.sh
sudo ./setup-vless-proxy.sh
```

### Вариант 2: Ручная настройка прокси
В файле `.env`:
```env
HTTP_PROXY=socks5://127.0.0.1:1080
HTTPS_PROXY=socks5://127.0.0.1:1080
```

---

## ❓ Частые проблемы

### Проблема: "The current session is no longer valid"

**Решение:**
```bash
# Удалите старые сессии
rm /home/telegram-bot/app/*.session
rm /home/telegram-bot/app/session*

# Запустите повторную авторизацию
./setup-userbot.sh
```

### Проблема: "Phone number invalid"

**Причины:**
- Неправильный формат (должен быть с +)
- Номер не зарегистрирован в Telegram

### Проблема: "API_ID or API_HASH invalid"

**Решение:**
1. Проверьте на https://my.telegram.org
2. API_ID должен быть числом
3. API_HASH должен быть 32 символа

### Проблема: "OpenAI не отвечает"

**Решение:**
```bash
# Проверьте прокси
proxy test

# Если прокси не работает, перенастройте
./setup-vless-proxy.sh
```

---

## 🔒 Безопасность

### ⚠️ ВАЖНЫЕ предупреждения:

1. **Доступ к аккаунту**
   - Бот имеет ПОЛНЫЙ доступ к вашему Telegram
   - Может читать ВСЕ сообщения
   - Может отправлять сообщения от вашего имени

2. **Одновременное использование**
   - НЕ используйте Telegram на других устройствах одновременно
   - Может вызвать конфликты сессий

3. **Хранение данных**
   - Сессия хранится в файле
   - Защитите сервер от несанкционированного доступа

### Рекомендации:

1. **Используйте отдельный аккаунт** для бота
2. **Настройте фильтры** в коде для ограничения чатов
3. **Регулярно проверяйте логи**
4. **Используйте 2FA** в Telegram

---

## 📊 Мониторинг работы

### Проверка статуса:
```bash
bot status
```

### Просмотр логов в реальном времени:
```bash
bot logs
```

### Проверка последних ошибок:
```bash
bot errors
```

### Мониторинг активности:
```bash
# Последние обработанные сообщения
tail -f /home/telegram-bot/app/logs/bot.log | grep "Message from"

# Статистика ответов
grep "Sending response" /home/telegram-bot/app/logs/bot.log | wc -l
```

---

## 🛠️ Настройка фильтров

Чтобы бот отвечал только на определенные чаты, отредактируйте код:

```bash
nano /home/telegram-bot/app/src/telegram/telegramClient.ts
```

Добавьте фильтры:
```typescript
// Отвечать только на личные сообщения
if (!message.isPrivate) return;

// Отвечать только определенным пользователям
const allowedUsers = [123456789, 987654321];
if (!allowedUsers.includes(message.senderId)) return;

// Игнорировать определенные чаты
const ignoredChats = [-1001234567890];
if (ignoredChats.includes(message.chatId)) return;
```

После изменений:
```bash
bot restart
```

---

## 📝 Команды управления

| Команда | Описание |
|---------|----------|
| `bot start` | Запустить userbot |
| `bot stop` | Остановить userbot |
| `bot restart` | Перезапустить |
| `bot status` | Проверить статус |
| `bot logs` | Просмотр логов |
| `bot errors` | Просмотр ошибок |
| `bot config` | Редактировать конфигурацию |
| `bot monitor` | Мониторинг системы |

---

## 🔄 Обновление

```bash
bot update
```

Или вручную:
```bash
cd /home/telegram-bot/app
git pull
bun install
bot restart
```

---

## 🆘 Экстренная остановка

Если бот начал отвечать неправильно:

```bash
# Немедленная остановка
bot stop

# Проверка что остановлен
ps aux | grep bun

# Удаление из автозапуска
systemctl disable telegram-bot
```

---

## 📋 Чеклист после настройки

- [ ] API_ID и API_HASH получены и настроены
- [ ] Номер телефона указан правильно
- [ ] OpenAI ключ работает
- [ ] Прокси настроен (если нужен)
- [ ] Авторизация прошла успешно
- [ ] Бот запущен и работает
- [ ] Проверены логи на ошибки
- [ ] Настроены фильтры (опционально)

---

**Версия:** 1.0.0
**Обновлено:** 14.08.2025
