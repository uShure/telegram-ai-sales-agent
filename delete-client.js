#!/usr/bin/env bun

import Database from 'bun:sqlite';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('🗑️  УДАЛЕНИЕ КЛИЕНТА ИЗ БАЗЫ ДАННЫХ');
console.log('=' .repeat(50));

// Открываем базу данных диалогов
const db = new Database('./conversations.db');

try {
  // Показываем всех клиентов
  const clients = db.prepare(`
    SELECT DISTINCT
      userId,
      userName,
      COUNT(*) as messageCount,
      MAX(lastMessageAt) as lastMessage
    FROM conversations
    GROUP BY userId
    ORDER BY lastMessage DESC
  `).all();

  if (clients.length === 0) {
    console.log('❌ База данных пуста');
    process.exit(0);
  }

  console.log('\n📋 Список клиентов:\n');
  clients.forEach((client, index) => {
    const lastDate = new Date(client.lastMessage).toLocaleString('ru-RU');
    console.log(`${index + 1}. ${client.userName || 'Без имени'}`);
    console.log(`   ID: ${client.userId}`);
    console.log(`   Сообщений: ${client.messageCount}`);
    console.log(`   Последнее: ${lastDate}`);
    console.log();
  });

  console.log('=' .repeat(50));

  // Запрашиваем ID для удаления
  const answer = await question('\n💡 Введите ID клиента для удаления (или "all" для очистки всей базы): ');

  if (answer.toLowerCase() === 'all') {
    const confirm = await question('\n⚠️  ВНИМАНИЕ! Это удалит ВСЕ диалоги! Вы уверены? (да/нет): ');

    if (confirm.toLowerCase() === 'да' || confirm.toLowerCase() === 'yes') {
      // Удаляем все записи
      const deleteAll = db.prepare('DELETE FROM conversations');
      const result = deleteAll.run();
      console.log(`\n✅ Удалено записей: ${result.changes}`);
      console.log('📊 База данных полностью очищена');
    } else {
      console.log('❌ Операция отменена');
    }
  } else {
    const userId = parseInt(answer);

    if (isNaN(userId)) {
      console.log('❌ Неверный ID');
      process.exit(1);
    }

    // Проверяем, существует ли клиент
    const client = db.prepare('SELECT * FROM conversations WHERE userId = ? LIMIT 1').get(userId);

    if (!client) {
      console.log(`❌ Клиент с ID ${userId} не найден`);
      process.exit(1);
    }

    const confirm = await question(`\n⚠️  Удалить все диалоги с ${client.userName}? (да/нет): `);

    if (confirm.toLowerCase() === 'да' || confirm.toLowerCase() === 'yes') {
      // Удаляем записи клиента
      const deleteClient = db.prepare('DELETE FROM conversations WHERE userId = ?');
      const result = deleteClient.run(userId);

      console.log(`\n✅ Удалено записей: ${result.changes}`);
      console.log(`📊 Клиент ${client.userName} (ID: ${userId}) удален из базы`);
    } else {
      console.log('❌ Операция отменена');
    }
  }

} catch (error) {
  console.error('❌ Ошибка:', error.message);
} finally {
  db.close();
  rl.close();
}
