# 🚀 Настройка VLESS прокси для обхода блокировок

## 📋 Быстрая установка

### 1. Скачайте и запустите скрипт настройки:
```bash
cd /root
wget https://raw.githubusercontent.com/uShure/telegram-ai-sales-agent/main/setup-vless-proxy.sh
chmod +x setup-vless-proxy.sh
sudo ./setup-vless-proxy.sh
```

### 2. Введите данные вашего VLESS сервера

Скрипт попросит ввести:
- **VLESS ссылку целиком** (если есть)

  ИЛИ параметры по отдельности:
- **Адрес сервера** (IP или домен)
- **Порт** (обычно 443)
- **UUID** (из конфигурации вашего VLESS сервера)
- **Тип сети** (tcp/ws/grpc)
- **Безопасность** (tls/reality/none)
- **SNI** (если используется TLS)

### 3. Перезапустите бота:
```bash
bot restart
```

## ✅ Готово!

---

## 🔧 Как это работает

Скрипт настраивает цепочку:
```
Telegram Bot → Локальный Xray (SOCKS5:1080) → VLESS сервер → OpenAI/Telegram
```

1. **Xray-core** создает локальный SOCKS5 прокси на порту 1080
2. **Бот** использует этот прокси для всех запросов
3. **VLESS** туннелирует трафик через ваш сервер

---

## 📊 Команды управления прокси

| Команда | Описание |
|---------|----------|
| `proxy status` | Проверить статус прокси |
| `proxy test` | Тестировать соединение с OpenAI |
| `proxy restart` | Перезапустить прокси |
| `proxy logs` | Просмотр логов Xray |
| `proxy config` | Редактировать конфигурацию |

### Примеры использования:

```bash
# Проверить работает ли прокси
proxy status

# Протестировать доступ к OpenAI
proxy test

# Посмотреть логи если есть проблемы
proxy logs
```

---

## 🔍 Проверка работы

### 1. Проверьте статус Xray:
```bash
systemctl status xray
```

### 2. Проверьте порты:
```bash
netstat -tuln | grep -E "1080|8118"
```

### 3. Тестовый запрос к OpenAI:
```bash
curl --socks5 127.0.0.1:1080 https://api.openai.com/v1/models
```

### 4. Проверьте конфигурацию бота:
```bash
grep PROXY /home/telegram-bot/app/.env
```

Должны быть строки:
```
HTTP_PROXY=socks5://127.0.0.1:1080
HTTPS_PROXY=socks5://127.0.0.1:1080
```

---

## ❓ Решение проблем

### Xray не запускается

1. Проверьте логи:
```bash
journalctl -u xray -n 50
```

2. Проверьте конфигурацию:
```bash
/usr/local/bin/xray run -config /usr/local/etc/xray/config.json -test
```

3. Убедитесь что порты свободны:
```bash
lsof -i :1080
lsof -i :8118
```

### OpenAI недоступен

1. Проверьте что VLESS сервер работает
2. Проверьте правильность UUID и других параметров
3. Попробуйте другой тип сети (ws вместо tcp)
4. Проверьте что на VLESS сервере не заблокирован OpenAI

### Бот не использует прокси

1. Проверьте настройки в `.env`:
```bash
bot config
```

2. Перезапустите бота:
```bash
bot restart
```

3. Проверьте логи бота:
```bash
bot errors
```

---

## 🔐 Безопасность

### Рекомендации:

1. **Используйте только свой VLESS сервер** - не доверяйте публичным
2. **Регулярно меняйте UUID** на VLESS сервере
3. **Используйте TLS** для шифрования трафика
4. **Мониторьте трафик** через прокси

### Ограничение доступа:

Xray слушает только на localhost (127.0.0.1), поэтому прокси доступен только локально.

---

## 🛠️ Ручная настройка (если нужно)

### 1. Установка Xray вручную:
```bash
# Скачать последнюю версию
wget https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip

# Распаковать
unzip Xray-linux-64.zip

# Установить
mv xray /usr/local/bin/
chmod +x /usr/local/bin/xray
```

### 2. Создать конфигурацию `/usr/local/etc/xray/config.json`:
```json
{
  "inbounds": [
    {
      "port": 1080,
      "listen": "127.0.0.1",
      "protocol": "socks",
      "settings": {
        "udp": true
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "vless",
      "settings": {
        "vnext": [
          {
            "address": "ваш-сервер.com",
            "port": 443,
            "users": [
              {
                "id": "ваш-uuid",
                "encryption": "none"
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "tcp",
        "security": "tls"
      }
    }
  ]
}
```

### 3. Добавить в `/home/telegram-bot/app/.env`:
```bash
HTTP_PROXY=socks5://127.0.0.1:1080
HTTPS_PROXY=socks5://127.0.0.1:1080
```

### 4. Перезапустить:
```bash
systemctl restart xray
bot restart
```

---

## 📚 Дополнительная информация

### Форматы VLESS ссылок:

```
# Базовый формат
vless://UUID@server:port?параметры#название

# С TLS
vless://UUID@server:443?type=tcp&security=tls&sni=domain.com#MyVLESS

# С WebSocket
vless://UUID@server:443?type=ws&security=tls&path=/ws&host=domain.com#MyVLESS

# С gRPC
vless://UUID@server:443?type=grpc&security=tls&serviceName=grpc#MyVLESS
```

### Альтернативные прокси протоколы:

- **VMess** - альтернатива VLESS
- **Trojan** - маскируется под HTTPS
- **Shadowsocks** - простой и быстрый
- **WireGuard** - современный VPN

---

## 🆘 Поддержка

При проблемах предоставьте:

1. Логи Xray:
```bash
journalctl -u xray -n 100 > xray.log
```

2. Статус прокси:
```bash
proxy test > proxy-test.log
```

3. Конфигурацию (без UUID):
```bash
cat /usr/local/etc/xray/config.json | sed 's/"id":.*/"id": "HIDDEN"/' > xray-config.log
```

---

**Версия:** 1.0.0
**Обновлено:** 14.08.2025
