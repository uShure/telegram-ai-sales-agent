# 🌐 Настройка прокси для OpenAI API

Если OpenAI API недоступен в вашем регионе, используйте один из следующих способов:

## 📋 Варианты обхода ограничений

### 1. Бесплатные прокси-сервисы для OpenAI

Добавьте в `.env`:
```bash
# Вариант 1: OpenAI API Proxy (бесплатный)
OPENAI_API_BASE=https://api.openai-proxy.com/v1

# Вариант 2: AI Proxy
OPENAI_API_BASE=https://api.aiproxy.io/v1

# Вариант 3: OpenAI SB (для тестирования)
OPENAI_API_BASE=https://api.openai-sb.com/v1
```

### 2. Собственный прокси-сервер

Если у вас есть VPS в регионе с доступом к OpenAI:

```bash
# На VPS установите прокси
sudo apt update
sudo apt install squid

# Настройте Squid для HTTPS
sudo nano /etc/squid/squid.conf

# Добавьте:
http_port 3128
https_port 3129 cert=/etc/squid/cert.pem key=/etc/squid/key.pem

# В .env на локальной машине:
HTTP_PROXY=http://your-vps-ip:3128
HTTPS_PROXY=http://your-vps-ip:3128
```

### 3. Cloudflare Workers (бесплатно до 100k запросов/день)

Создайте worker на Cloudflare:

```javascript
// worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  url.host = 'api.openai.com'

  const modifiedRequest = new Request(url, request)
  modifiedRequest.headers.set('Host', 'api.openai.com')

  return fetch(modifiedRequest)
}
```

Затем в `.env`:
```bash
OPENAI_API_BASE=https://your-worker.workers.dev/v1
```

### 4. Shadowsocks/V2Ray

Если у вас есть Shadowsocks или V2Ray:

```bash
# Запустите локальный SOCKS5 прокси
# Затем конвертируйте в HTTP прокси через privoxy

sudo apt install privoxy
sudo nano /etc/privoxy/config

# Добавьте:
forward-socks5 / 127.0.0.1:1080 .
listen-address 127.0.0.1:8118

# В .env:
HTTP_PROXY=http://127.0.0.1:8118
HTTPS_PROXY=http://127.0.0.1:8118
```

## 🧪 Тестирование соединения

После настройки проверьте соединение:

```bash
# Сделайте файл исполняемым
chmod +x test-openai-connection.js

# Запустите тест
./test-openai-connection.js
# или
node test-openai-connection.js
```

## ⚠️ Важные замечания

1. **Безопасность**: Используйте только доверенные прокси-сервисы
2. **Скорость**: Прокси может замедлить ответы AI
3. **Стабильность**: Бесплатные прокси могут быть нестабильными
4. **Приватность**: Ваш API ключ будет проходить через прокси

## 🎯 Рекомендации

1. **Для продакшена**: Используйте собственный VPS с прокси
2. **Для тестирования**: Можно использовать бесплатные сервисы
3. **Альтернатива**: Запустите бота на сервере в регионе с доступом к OpenAI

## 🔧 Решение проблем

### Ошибка SSL/TLS
```bash
# Отключить проверку сертификата (только для тестирования!)
NODE_TLS_REJECT_UNAUTHORIZED=0 bun start
```

### Таймауты
В `src/ai/aiAgent.ts` увеличьте таймаут:
```typescript
timeout: 60000 // 60 секунд вместо 30
```

### Ошибка 429 (Rate Limit)
Используйте модель `gpt-3.5-turbo` вместо `gpt-4o-mini` для большего лимита запросов.
