import { EnhancedTelegramBot } from "./telegram/enhancedTelegramClient";
import { AdminPanel } from "./admin/adminPanel";
import readline from "readline";
import dotenv from "dotenv";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  console.log("🤖 SOINTERA AI Sales Agent (Enhanced)");
  console.log("=====================================\n");

  const bot = new EnhancedTelegramBot();
  const admin = new AdminPanel(bot as any);

  try {
    // Запускаем бота
    await bot.start();

    // Показываем меню команд
    showMenu();

    // Обрабатываем команды
    rl.on("line", async (input) => {
      const command = input.trim().toLowerCase();

      switch (command) {
        case "stats":
          await bot.getStats();
          break;

        case "conversations":
          await admin.listRecentConversations();
          break;

        case "analyze":
          const userId = await question("Введите User ID для анализа: ");
          await admin.analyzeConversation(userId);
          break;

        case "send":
          const targetId = await question("Введите User ID: ");
          const message = await question("Введите сообщение: ");
          await bot.sendProactiveMessage(targetId, message);
          break;

        case "export":
          await admin.exportConversations();
          break;

        case "help":
          showMenu();
          break;

        case "exit":
          console.log("\n👋 Завершение работы...");
          await bot.stop();
          process.exit(0);
          break;

        default:
          console.log('❌ Неизвестная команда. Введите "help" для справки.');
      }
    });

    // Обработка graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n\n🛑 Получен сигнал остановки...");
      await bot.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Критическая ошибка:", error);
    process.exit(1);
  }
}

function showMenu() {
  console.log("\n📋 Доступные команды:");
  console.log("  stats        - Показать статистику");
  console.log("  conversations - Список последних диалогов");
  console.log("  analyze      - Анализировать диалог с клиентом");
  console.log("  send         - Отправить сообщение пользователю");
  console.log("  export       - Экспортировать диалоги в CSV");
  console.log("  help         - Показать это меню");
  console.log("  exit         - Выйти из программы\n");
}

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Запускаем приложение
main().catch(console.error);
