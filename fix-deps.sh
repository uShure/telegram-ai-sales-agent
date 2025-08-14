#!/bin/bash

echo "🔧 Исправление зависимостей..."

# Удаляем node_modules и lockfile
echo "🗑️  Удаление старых зависимостей..."
rm -rf node_modules
rm -f bun.lockb

# Переустанавливаем все зависимости
echo "📦 Установка зависимостей заново..."
bun install

# Устанавливаем дополнительные пакеты для websocket
echo "🔌 Установка websocket зависимостей..."
bun add bufferutil utf-8-validate --optional

echo "✅ Зависимости исправлены!"
