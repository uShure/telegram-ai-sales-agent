const TelegramBot = require('node-telegram-bot-api');
const { AIAgent } = require('./src/ai/aiAgent.js');
const Database = require('bun:sqlite').default;

// Используем токен из .env
const token = '8307724302:AAGrBdp1zAXlbqm8XQ3LkQt56P1he6zZFzc';
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Тестовый бот SOINTERA запущен!');
console.log('📱 Отправьте /start боту для начала работы');

// Инициализация AI агента
const aiAgent = new AIAgent();

// Подключение к базе данных
const db = new Database('./conversations.db');

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'Клиент';
  
  await bot.sendMessage(chatId, 
    `Привет, ${userName}! 👋\n\n` +
    `Я - консультант академии SOINTERA! 🎓\n\n` +
    `Помогу подобрать идеальный курс для вас. Расскажите, что вас интересует?`
  );
});

// Обработка всех сообщений
bot.on('message', async (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'Клиент';
    
    try {
      // Получаем или создаем диалог
      let conversation = db.query('SELECT * FROM conversations WHERE userId = ?').get(chatId.toString());
      
      if (!conversation) {
        // Создаем новый диалог
        db.run(\`
          INSERT INTO conversations (userId, userName, lastMessageAt, clientStatus, interestedProducts, createdAt, updatedAt)
          VALUES (?, ?, datetime('now'), 'new', '[]', datetime('now'), datetime('now'))
        \`, [chatId.toString(), userName]);
        
        conversation = { 
          id: db.query('SELECT last_insert_rowid() as id').get().id,
          messages: [] 
        };
      } else {
        // Получаем историю сообщений
        const messages = db.query('SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp').all(conversation.id);
        conversation.messages = messages || [];
      }
      
      // Сохраняем сообщение пользователя
      db.run(\`
        INSERT INTO messages (conversationId, role, content, timestamp)
        VALUES (?, 'user', ?, datetime('now'))
      \`, [conversation.id, msg.text]);
      
      // Показываем, что бот печатает
      await bot.sendChatAction(chatId, 'typing');
      
      // Генерируем ответ AI
      const response = await aiAgent.generateResponse(conversation, msg.text);
      
      // Отправляем ответ
      await bot.sendMessage(chatId, response.response);
      
      // Сохраняем ответ бота
      db.run(\`
        INSERT INTO messages (conversationId, role, content, timestamp)
        VALUES (?, 'assistant', ?, datetime('now'))
      \`, [conversation.id, response.response]);
      
      // Обновляем статус диалога
      db.run(\`
        UPDATE conversations 
        SET lastMessageAt = datetime('now'), 
            clientStatus = ?,
            interestedProducts = ?,
            updatedAt = datetime('now')
        WHERE id = ?
      \`, [response.clientStatus, JSON.stringify(response.suggestedProducts), conversation.id]);
      
      console.log(\`💬 Диалог с ${userName}: ${response.clientStatus}\`);
      
    } catch (error) {
      console.error('❌ Ошибка:', error);
      await bot.sendMessage(chatId, 'Извините, произошла ошибка. Попробуйте еще раз.');
    }
  }
});

console.log('✅ Бот готов к работе!');
