#!/bin/bash

echo "📋 Обновление бота SOINTERA на сервере"
echo "========================================"

# 1. Проверяем текущий статус
echo ""
echo "1️⃣ Проверка локальных изменений..."
git status

echo ""
echo "2️⃣ Сохранение локальных изменений (если есть)..."
git stash

echo ""
echo "3️⃣ Принятие всех изменений из репозитория..."
git config pull.rebase false
git pull origin main --allow-unrelated-histories

# Если всё ещё есть проблемы, сбрасываем к версии из репозитория
if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️ Есть конфликты. Принимаем версию из репозитория..."
    git reset --hard origin/main
fi

echo ""
echo "4️⃣ Установка/обновление зависимостей..."
bun install

echo ""
echo "5️⃣ Обновление базы данных курсов..."
echo "⚠️ ВНИМАНИЕ: Это перезапишет все курсы!"
read -p "Обновить базу курсов? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    bun run update-all-courses-final.js
    echo "✅ База курсов обновлена"
else
    echo "⏭️ Пропущено обновление базы курсов"
fi

echo ""
echo "6️⃣ Проверка конфигурации..."
if [ -f .env ]; then
    echo "✅ Файл .env найден"
    echo "Проверьте, что все переменные на месте:"
    echo "- TELEGRAM_BOT_TOKEN"
    echo "- API_ID"
    echo "- API_HASH"
    echo "- PHONE_NUMBER"
    echo "- OPENAI_API_KEY"
else
    echo "❌ Файл .env не найден!"
    echo "Скопируйте из бэкапа или создайте новый"
fi

echo ""
echo "7️⃣ Запуск бота..."
pm2 start sointera-sales

echo ""
echo "8️⃣ Проверка логов..."
pm2 logs sointera-sales --lines 20

echo ""
echo "========================================"
echo "✅ Обновление завершено!"
echo ""
echo "Проверьте:"
echo "1. Отправьте боту сообщение 'Здравствуйте'"
echo "2. Проверьте логи: pm2 logs sointera-sales"
echo "3. При проблемах: pm2 restart sointera-sales"
echo ""
echo "Версия бота: 13 (с FAQ и работой с возражениями)"
