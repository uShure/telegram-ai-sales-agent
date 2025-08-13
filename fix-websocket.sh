#!/bin/bash

echo "🔧 Исправление websocket зависимостей..."

# Устанавливаем основные зависимости через bun
echo "📦 Установка зависимостей..."
bun install

# Создаем заглушки для проблемных модулей
echo "🔨 Создание заглушек для native модулей..."

# Создаем bufferutil заглушку
mkdir -p node_modules/bufferutil
cat > node_modules/bufferutil/index.js << 'EOF'
module.exports = {
  mask: function(source, mask, output, offset, length) {
    if (!Buffer.isBuffer(source)) throw new TypeError('First argument must be a Buffer');
    if (!Buffer.isBuffer(mask)) throw new TypeError('Second argument must be a Buffer');
    if (mask.length !== 4) throw new RangeError('Mask must be exactly 4 bytes');

    const dataLength = length || source.length - (offset || 0);
    if (!output) output = Buffer.alloc(dataLength);

    const offsetValue = offset || 0;
    for (let i = 0; i < dataLength; i++) {
      output[i] = source[offsetValue + i] ^ mask[i % 4];
    }

    return output;
  },
  unmask: function(buffer, mask) {
    if (!Buffer.isBuffer(buffer)) throw new TypeError('First argument must be a Buffer');
    if (!Buffer.isBuffer(mask)) throw new TypeError('Second argument must be a Buffer');
    if (mask.length !== 4) throw new RangeError('Mask must be exactly 4 bytes');

    for (let i = 0; i < buffer.length; i++) {
      buffer[i] ^= mask[i % 4];
    }
  }
};
EOF

cat > node_modules/bufferutil/package.json << 'EOF'
{
  "name": "bufferutil",
  "version": "4.0.0",
  "main": "index.js"
}
EOF

# Создаем utf-8-validate заглушку
mkdir -p node_modules/utf-8-validate
cat > node_modules/utf-8-validate/index.js << 'EOF'
module.exports = function(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('First argument must be a Buffer');
  }
  return true;
};
EOF

cat > node_modules/utf-8-validate/package.json << 'EOF'
{
  "name": "utf-8-validate",
  "version": "6.0.0",
  "main": "index.js"
}
EOF

echo "✅ Заглушки созданы!"

# Устанавливаем websocket если его нет
if [ ! -d "node_modules/websocket" ]; then
  echo "📦 Установка websocket..."
  bun add websocket --no-save
fi

echo "✅ Все готово! Запускаю бота..."
echo ""

# Запускаем бота
bun start
