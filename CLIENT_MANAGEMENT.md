# 👥 Управление клиентами в базе данных

## 🗂️ Структура базы данных

База данных `conversations.db` содержит таблицу `conversations` со следующими полями:
- `id` - уникальный ID записи
- `userId` - Telegram ID клиента
- `userName` - имя клиента
- `messages` - JSON с историей сообщений
- `createdAt` - дата создания диалога
- `lastMessageAt` - дата последнего сообщения
- `clientStatus` - статус клиента (new, interested, negotiating, purchased, lost)
- `notes` - заметки о клиенте

## 🛠️ Доступные скрипты

### 1. Быстрое удаление клиента
```bash
bun run delete-client.js
```
- Показывает список всех клиентов
- Позволяет удалить по ID
- Опция удаления всей базы

### 2. Полное управление клиентами
```bash
bun run manage-clients.js
```

Меню опций:
1. **Показать всех клиентов** - список с статусами и датами
2. **Показать диалог** - просмотр переписки с клиентом
3. **Удалить клиента** - удаление по ID
4. **Удалить старые диалоги** - очистка по дате
5. **Экспортировать диалоги** - сохранение в JSON
6. **Показать статистику** - аналитика по базе

## 📝 Примеры использования

### Удалить конкретного клиента
```bash
# Запустите скрипт
bun run delete-client.js

# Увидите список:
1. Иван Иванов
   ID: 123456789
   Сообщений: 15
   Последнее: 06.08.2025, 15:30

# Введите ID для удаления
💡 Введите ID клиента: 123456789

# Подтвердите
⚠️ Удалить все диалоги с Иван Иванов? (да/нет): да
```

### Очистить всю базу
```bash
bun run delete-client.js

# Введите "all"
💡 Введите ID клиента для удаления (или "all" для очистки): all

# Подтвердите
⚠️ ВНИМАНИЕ! Это удалит ВСЕ диалоги! Вы уверены? (да/нет): да
```

### Удалить старые диалоги
```bash
bun run manage-clients.js

# Выберите опцию 4
👉 Ваш выбор: 4

# Укажите количество дней
💡 Удалить диалоги старше скольки дней? 30

# Подтвердите
⚠️ Будет удалено диалогов: 25
Продолжить? (да/нет): да
```

## 🔍 SQL запросы для прямой работы с базой

### Через SQLite CLI
```bash
# Открыть базу
sqlite3 conversations.db

# Показать всех клиентов
SELECT DISTINCT userId, userName FROM conversations;

# Удалить конкретного клиента
DELETE FROM conversations WHERE userId = 123456789;

# Удалить старые диалоги (старше 30 дней)
DELETE FROM conversations
WHERE lastMessageAt < datetime('now', '-30 days');

# Удалить всё
DELETE FROM conversations;

# Выход
.quit
```

### Через Bun
```javascript
import Database from 'bun:sqlite';

const db = new Database('./conversations.db');

// Удалить клиента
db.prepare('DELETE FROM conversations WHERE userId = ?').run(123456789);

// Удалить всех
db.prepare('DELETE FROM conversations').run();

db.close();
```

## ⚠️ Важные замечания

1. **Бэкапы**: Всегда делайте бэкап перед удалением
   ```bash
   cp conversations.db conversations.db.backup-$(date +%Y%m%d)
   ```

2. **Осторожность**: Удаление необратимо!

3. **Статусы клиентов**:
   - `new` - новый клиент
   - `interested` - проявил интерес
   - `negotiating` - в переговорах
   - `purchased` - купил курс
   - `lost` - потерян

4. **Права доступа**: Убедитесь, что у вас есть права на изменение файла базы данных

## 🚀 Быстрые команды для сервера

```bash
# На сервере
cd ~/telegram-ai-sales-agent

# Остановить бота перед работой с базой
pm2 stop sointera-sales

# Сделать бэкап
cp conversations.db conversations.db.backup-$(date +%Y%m%d-%H%M%S)

# Запустить управление клиентами
bun run manage-clients.js

# Запустить бота обратно
pm2 start sointera-sales
```

## 📊 Проверка результата

После удаления можно проверить:
```bash
# Количество записей в базе
sqlite3 conversations.db "SELECT COUNT(*) FROM conversations;"

# Список уникальных клиентов
sqlite3 conversations.db "SELECT DISTINCT userId, userName FROM conversations;"
```
