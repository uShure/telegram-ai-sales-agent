# 🔧 Устранение неполадок

## ❌ Ошибка от OpenAI API

### Проблема 1: Региональные ограничения
```
Request failed with status code 403
Access denied due to geographic restrictions
```

### Решение:
1. Настройте прокси в `.env`:
```
HTTP_PROXY=http://your-proxy:port
HTTPS_PROXY=http://your-proxy:port
```

2. Или используйте альтернативный endpoint:
```
OPENAI_API_BASE=https://api-proxy.com/v1
```

### Проблема 2: Неверный API ключ
```
Request failed with status code 401
Invalid API key
```

### Решение:
1. Проверьте правильность ключа в `.env`
2. Убедитесь, что ключ активен в вашем аккаунте OpenAI
3. Проверьте баланс и лимиты аккаунта

### Доступные модели OpenAI:
- `gpt-4o-mini` (рекомендуется, быстрая и дешевая)
- `gpt-4o` (продвинутая модель)
- `gpt-3.5-turbo` (бюджетный вариант)

## ❌ Ошибка Telegram Entity

### Проблема:
```
Could not find the input entity for {"userId":"xxxxx","className":"PeerUser"}
```

### Причины:
1. Пользователь еще не в ваших контактах
2. Это первое сообщение от пользователя
3. Telegram не может определить entity

### Решение:
- Бот уже настроен для обработки этой ошибки
- Ответ будет отправлен автоматически при следующем сообщении
- Убедитесь, что у вас есть диалог с пользователем

## ⚠️ Бот не отвечает

### Проверьте:
1. **Интернет соединение** - должно быть стабильным
2. **API ключи** в `.env` файле
3. **Логи в консоли** - там будет информация об ошибке

### Диагностика:
```bash
# Проверьте переменные окружения
cat .env | grep -E "API_ID|API_HASH|GROQ_API_KEY"

# Проверьте сессию
ls -la session.txt

# Проверьте базу данных
ls -la conversations.db
```

## 🔄 Сброс бота

### Полный сброс:
```bash
# Удалить сессию (потребуется новая авторизация)
rm session.txt

# Удалить базу данных (все диалоги будут потеряны)
rm conversations.db

# Запустить заново
bun start
```

### Мягкий сброс:
```bash
# Только перезапустить бота
# Нажмите Ctrl+C и запустите снова
bun start
```

## 📋 Проверка логов

### Уровни логов:
- `🚀` - Запуск и инициализация
- `✅` - Успешные операции
- `📨` - Входящие сообщения
- `🤖` - AI операции
- `⚠️` - Предупреждения
- `❌` - Ошибки

### Полезные логи:
```
🔍 Получено новое сообщение:      # Детали сообщения
🤖 Запрос к AI для генерации...   # AI работает
📤 Отправка ответа...              # Отправка сообщения
✅ Ответ отправлен                 # Успех
```

## 🛡️ Безопасность

### Если взломали аккаунт:
1. Немедленно удалите `session.txt`
2. Измените пароль в Telegram
3. Отзовите все активные сессии в настройках Telegram
4. Создайте новую сессию для бота

### Защита данных:
- Никогда не делитесь файлом `session.txt`
- Не публикуйте `.env` файл
- Регулярно делайте бекапы `conversations.db`

## 📞 Контакты для помощи

Если проблема не решается:
1. Проверьте этот файл еще раз
2. Посмотрите README.md
3. Обратитесь к разработчику

## 🔍 Дополнительная диагностика

### Тест OpenAI API:
```bash
# Проверить API ключ напрямую
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json"

# Проверить через прокси
curl -x http://your-proxy:port https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json"
```

### Тест соединения через Node.js:
```javascript
// test-openai.js
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const apiKey = 'YOUR_API_KEY';
const proxyUrl = process.env.HTTPS_PROXY;

const config = {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
};

if (proxyUrl) {
  config.httpsAgent = new HttpsProxyAgent(proxyUrl);
}

axios.get('https://api.openai.com/v1/models', config)
  .then(res => console.log('✅ Соединение успешно!', res.data))
  .catch(err => console.error('❌ Ошибка:', err.message));
```

### Тест Telegram соединения:
- Отправьте любое сообщение боту
- В логах должно появиться "🔍 Получено новое сообщение"
- Если нет - проблема с Telegram соединением
