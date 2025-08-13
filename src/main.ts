import { EnhancedTelegramBot } from './telegram/enhancedTelegramClient';
import { AdminPanel } from './admin/adminPanel';
import { database } from './database/database';
import { coursesDB } from './database/coursesDB';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🤖 SOINTERA AI Sales Agent (Вера)');
  console.log('=====================================\n');

  try {
    // Инициализируем базы данных
    console.log('📦 Инициализация баз данных...');
    await database.initialize();

    // Проверяем подключение к базе курсов
    try {
      const courses = await coursesDB.getAllCourses();
      console.log(`✅ База курсов подключена: ${courses.length} курсов загружено`);
    } catch (error) {
      console.error('⚠️ Ошибка подключения к базе курсов:', error);
      console.log('Создайте базу курсов командой: bun run create-full-courses-db.js');
    }

    // Создаем и запускаем бота
    const bot = new EnhancedTelegramBot();

    console.log('🚀 Запуск Telegram клиента...');
    await bot.start();

    console.log('\n✅ Бот успешно запущен и готов к работе!');
    console.log('💬 Ожидаю входящие сообщения...\n');
    console.log('Для остановки нажмите Ctrl+C\n');

    // Обработка graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Получен сигнал остановки...');
      await bot.stop();
      await database.close();
      coursesDB.close();
      console.log('👋 Бот остановлен');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n\n🛑 Получен сигнал SIGTERM...');
      await bot.stop();
      await database.close();
      coursesDB.close();
      console.log('👋 Бот остановлен');
      process.exit(0);
    });

    // Держим процесс активным
    process.stdin.resume();

  } catch (error) {
    console.error('❌ Критическая ошибка при запуске:', error);
    process.exit(1);
  }
}

// Запускаем приложение
main().catch(error => {
  console.error('❌ Ошибка в main:', error);
  process.exit(1);
});
