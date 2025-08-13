#!/bin/bash

echo "🚀 Запуск SOINTERA AI Sales Agent..."
echo "===================================="

# Проверяем наличие bun
if ! command -v bun &> /dev/null; then
    echo "❌ Bun не установлен. Установите с https://bun.sh"
    exit 1
fi

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    exit 1
fi

# Устанавливаем зависимости если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    bun install
fi

# Запускаем приложение
echo "✅ Запуск приложения..."
bun start
