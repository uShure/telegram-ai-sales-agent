#!/bin/bash

echo "🔍 Диагностика проблем запуска..."
echo "================================="
echo ""

# Проверка bun
echo "1️⃣ Проверка Bun..."
if command -v bun &> /dev/null; then
    echo "✅ Bun установлен: $(bun --version)"
else
    echo "❌ Bun НЕ установлен!"
    echo ""
    echo "📦 Установите Bun одной командой:"
    echo "curl -fsSL https://bun.sh/install | bash"
    echo ""
    echo "Или используйте npm/yarn:"
    echo "npm install"
    echo "npm start"
    exit 1
fi

# Проверка node
echo ""
echo "2️⃣ Проверка Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js установлен: $(node --version)"
else
    echo "⚠️  Node.js не найден (не критично для Bun)"
fi

# Проверка .env
echo ""
echo "3️⃣ Проверка .env файла..."
if [ -f .env ]; then
    echo "✅ Файл .env найден"
    # Проверяем ключевые переменные
    if grep -q "API_ID=" .env && grep -q "GROQ_API_KEY=" .env; then
        echo "✅ Основные переменные настроены"
    else
        echo "❌ В .env отсутствуют важные переменные"
    fi
else
    echo "❌ Файл .env НЕ найден!"
    echo "Создайте его с вашими данными"
fi

# Проверка зависимостей
echo ""
echo "4️⃣ Проверка зависимостей..."
if [ -d "node_modules" ]; then
    echo "✅ Папка node_modules существует"
else
    echo "❌ Зависимости не установлены!"
    echo "Устанавливаю..."
    bun install
fi

# Проверка файлов проекта
echo ""
echo "5️⃣ Проверка структуры проекта..."
if [ -f "src/index.ts" ]; then
    echo "✅ Основные файлы на месте"
else
    echo "❌ Файлы проекта отсутствуют!"
fi

echo ""
echo "📊 Диагностика завершена"
echo "========================"
echo ""

# Если все ок, предлагаем запустить
if command -v bun &> /dev/null && [ -f .env ] && [ -f "src/index.ts" ]; then
    echo "✅ Все проверки пройдены!"
    echo ""
    read -p "🚀 Запустить бота? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Запускаю..."
        bun run src/index.ts
    fi
else
    echo "❌ Исправьте проблемы выше и запустите снова"
fi
