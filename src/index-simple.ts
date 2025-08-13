import { SimpleTelegramBot } from './telegram/simpleTelegramBot';
import { coursesDB } from './database/coursesDB';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

console.log('🤖 SOINTERA AI Sales Agent (Simple Bot)');
console.log('=====================================');

async function main() {
  try {
    // Инициализация базы данных курсов
    console.log('📚 Инициализация базы данных курсов...');
    await coursesDB.init();

    // Запуск бота
    const bot = new SimpleTelegramBot();
    await bot.start();

    // Обработка сигналов завершения
    process.on('SIGINT', () => {
      console.log('\n👋 Получен сигнал завершения, закрываю соединения...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n👋 Получен сигнал завершения, закрываю соединения...');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }
}

// Запуск
main();
