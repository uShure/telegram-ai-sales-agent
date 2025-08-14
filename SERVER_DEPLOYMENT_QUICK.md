# 🚀 Быстрое развертывание на First VDS

## ⚡ За 3 минуты

### 1️⃣ Подключитесь к серверу
```bash
ssh root@ваш_ip
```

### 2️⃣ Запустите установку
```bash
# Скачиваем и запускаем
wget https://raw.githubusercontent.com/uShure/telegram-ai-sales-agent/main/cleanup-and-deploy.sh
chmod +x cleanup-and-deploy.sh
sudo ./cleanup-and-deploy.sh
```

⚠️ **ВНИМАНИЕ**: Скрипт удалит ВСЕ данные на сервере! Введите `yes` для подтверждения.

### 3️⃣ Настройте API ключи

#### Вариант А: Интерактивная настройка (рекомендуется)
```bash
wget https://raw.githubusercontent.com/uShure/telegram-ai-sales-agent/main/quick-setup.sh
chmod +x quick-setup.sh
./quick-setup.sh
```

#### Вариант Б: Ручная настройка
```bash
bot config
```

Заполните:
- `API_ID` и `API_HASH` - получить на https://my.telegram.org
- `PHONE_NUMBER` - ваш номер с кодом страны (+7...)
- `OPENAI_API_KEY` - получить на https://platform.openai.com/api-keys
- `TELEGRAM_BOT_TOKEN` - получить у @BotFather в Telegram

### 4️⃣ Запустите бота
```bash
bot start
```

## ✅ Готово!

Откройте вашего бота в Telegram и отправьте `/start`

---

## 📋 Команды управления

| Команда | Действие |
|---------|----------|
| `bot start` | Запустить |
| `bot stop` | Остановить |
| `bot restart` | Перезапустить |
| `bot status` | Статус |
| `bot logs` | Логи |
| `bot monitor` | Мониторинг |

---

## 🔍 Проверка перед установкой

Хотите увидеть, что будет удалено?
```bash
wget https://raw.githubusercontent.com/uShure/telegram-ai-sales-agent/main/check-before-cleanup.sh
chmod +x check-before-cleanup.sh
./check-before-cleanup.sh
```

---

## 🆘 Проблемы?

1. Проверьте логи: `bot errors`
2. Проверьте конфигурацию: `cat /home/telegram-bot/app/.env`
3. Попробуйте перезапустить: `bot restart`

📚 [Полная документация](FIRST_VDS_SETUP.md)
