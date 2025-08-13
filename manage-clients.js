#!/usr/bin/env bun

import Database from 'bun:sqlite';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('👥 УПРАВЛЕНИЕ КЛИЕНТАМИ');
console.log('=' .repeat(60));

// Открываем базу данных
const db = new Database('./conversations.db');

async function showMenu() {
  console.log('\n📋 Выберите действие:\n');
  console.log('1. Показать всех клиентов');
  console.log('2. Показать диалог с клиентом');
  console.log('3. Удалить клиента');
  console.log('4. Удалить старые диалоги');
  console.log('5. Экспортировать диалоги в файл');
  console.log('6. Показать статистику');
  console.log('0. Выход');

  const choice = await question('\n👉 Ваш выбор: ');

  switch(choice) {
    case '1':
      await showAllClients();
      break;
    case '2':
      await showClientDialog();
      break;
    case '3':
      await deleteClient();
      break;
    case '4':
      await deleteOldDialogs();
      break;
    case '5':
      await exportDialogs();
      break;
    case '6':
      await showStatistics();
      break;
    case '0':
      console.log('\n👋 До свидания!');
      db.close();
      rl.close();
      process.exit(0);
    default:
      console.log('❌ Неверный выбор');
  }

  await showMenu();
}

async function showAllClients() {
  console.log('\n📊 СПИСОК КЛИЕНТОВ');
  console.log('-'.repeat(60));

  const clients = db.prepare(`
    SELECT
      userId,
      userName,
      clientStatus,
      COUNT(*) as messageCount,
      MIN(createdAt) as firstMessage,
      MAX(lastMessageAt) as lastMessage
    FROM conversations
    GROUP BY userId
    ORDER BY lastMessage DESC
  `).all();

  if (clients.length === 0) {
    console.log('❌ База данных пуста');
    return;
  }

  clients.forEach((client, index) => {
    const lastDate = new Date(client.lastMessage).toLocaleString('ru-RU');
    const firstDate = new Date(client.firstMessage).toLocaleString('ru-RU');

    console.log(`\n${index + 1}. ${client.userName || 'Без имени'} (ID: ${client.userId})`);
    console.log(`   📊 Статус: ${client.clientStatus || 'new'}`);
    console.log(`   💬 Сообщений: ${client.messageCount}`);
    console.log(`   📅 Первое: ${firstDate}`);
    console.log(`   📅 Последнее: ${lastDate}`);
  });
}

async function showClientDialog() {
  const userId = await question('\n💡 Введите ID клиента: ');

  const messages = db.prepare(`
    SELECT messages, createdAt, lastMessageAt
    FROM conversations
    WHERE userId = ?
    ORDER BY createdAt DESC
    LIMIT 1
  `).get(parseInt(userId));

  if (!messages) {
    console.log('❌ Клиент не найден');
    return;
  }

  console.log('\n💬 ДИАЛОГ');
  console.log('-'.repeat(60));

  try {
    const dialog = JSON.parse(messages.messages);
    dialog.forEach(msg => {
      const time = new Date(msg.timestamp).toLocaleString('ru-RU');
      const role = msg.role === 'user' ? '👤 Клиент' : '🤖 Вера';
      console.log(`\n[${time}] ${role}:`);
      console.log(msg.content.substring(0, 200));
      if (msg.content.length > 200) console.log('...');
    });
  } catch (e) {
    console.log('❌ Ошибка при чтении диалога');
  }
}

async function deleteClient() {
  await showAllClients();

  const userId = await question('\n💡 Введите ID клиента для удаления: ');

  if (!userId) return;

  const client = db.prepare('SELECT userName FROM conversations WHERE userId = ? LIMIT 1').get(parseInt(userId));

  if (!client) {
    console.log('❌ Клиент не найден');
    return;
  }

  const confirm = await question(`\n⚠️  Удалить все данные ${client.userName}? (да/нет): `);

  if (confirm.toLowerCase() === 'да') {
    const result = db.prepare('DELETE FROM conversations WHERE userId = ?').run(parseInt(userId));
    console.log(`✅ Удалено записей: ${result.changes}`);
  } else {
    console.log('❌ Отменено');
  }
}

async function deleteOldDialogs() {
  const days = await question('\n💡 Удалить диалоги старше скольки дней? ');

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(days));

  const oldDialogs = db.prepare(`
    SELECT COUNT(*) as count
    FROM conversations
    WHERE lastMessageAt < ?
  `).get(daysAgo.toISOString());

  console.log(`\n⚠️  Будет удалено диалогов: ${oldDialogs.count}`);

  const confirm = await question('Продолжить? (да/нет): ');

  if (confirm.toLowerCase() === 'да') {
    const result = db.prepare('DELETE FROM conversations WHERE lastMessageAt < ?').run(daysAgo.toISOString());
    console.log(`✅ Удалено записей: ${result.changes}`);
  } else {
    console.log('❌ Отменено');
  }
}

async function exportDialogs() {
  const userId = await question('\n💡 ID клиента (или Enter для экспорта всех): ');

  let data;
  if (userId) {
    data = db.prepare('SELECT * FROM conversations WHERE userId = ?').all(parseInt(userId));
  } else {
    data = db.prepare('SELECT * FROM conversations').all();
  }

  const filename = `export-${Date.now()}.json`;
  await Bun.write(filename, JSON.stringify(data, null, 2));

  console.log(`✅ Экспортировано в файл: ${filename}`);
  console.log(`📊 Записей: ${data.length}`);
}

async function showStatistics() {
  console.log('\n📊 СТАТИСТИКА');
  console.log('-'.repeat(60));

  const stats = db.prepare(`
    SELECT
      COUNT(DISTINCT userId) as uniqueClients,
      COUNT(*) as totalConversations,
      COUNT(CASE WHEN clientStatus = 'purchased' THEN 1 END) as purchased,
      COUNT(CASE WHEN clientStatus = 'interested' THEN 1 END) as interested,
      COUNT(CASE WHEN clientStatus = 'negotiating' THEN 1 END) as negotiating,
      COUNT(CASE WHEN clientStatus = 'lost' THEN 1 END) as lost,
      COUNT(CASE WHEN clientStatus = 'new' OR clientStatus IS NULL THEN 1 END) as new
    FROM conversations
  `).get();

  console.log(`\n👥 Уникальных клиентов: ${stats.uniqueClients}`);
  console.log(`💬 Всего диалогов: ${stats.totalConversations}`);
  console.log('\nПо статусам:');
  console.log(`  🆕 Новые: ${stats.new}`);
  console.log(`  💚 Заинтересованные: ${stats.interested}`);
  console.log(`  💬 В переговорах: ${stats.negotiating}`);
  console.log(`  ✅ Купили: ${stats.purchased}`);
  console.log(`  ❌ Потеряны: ${stats.lost}`);

  // Статистика по дням
  const byDay = db.prepare(`
    SELECT
      DATE(createdAt) as day,
      COUNT(*) as count
    FROM conversations
    WHERE createdAt > datetime('now', '-7 days')
    GROUP BY DATE(createdAt)
    ORDER BY day DESC
  `).all();

  console.log('\n📅 За последние 7 дней:');
  byDay.forEach(day => {
    console.log(`  ${day.day}: ${day.count} диалогов`);
  });
}

// Запускаем меню
showMenu();
