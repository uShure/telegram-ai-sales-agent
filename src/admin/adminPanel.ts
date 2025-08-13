import { database } from '../database/database';
import { TelegramBot } from '../telegram/telegramClient';
import { AIAgent } from '../ai/aiAgent';
import fs from 'fs';
import path from 'path';

export class AdminPanel {
  private aiAgent: AIAgent;

  constructor(private bot: TelegramBot) {
    this.aiAgent = new AIAgent();
  }

  async listRecentConversations(limit: number = 10): Promise<void> {
    try {
      const all = (database as any).all;

      const conversations = await all(
        `SELECT c.*, COUNT(m.id) as messageCount
         FROM conversations c
         LEFT JOIN messages m ON c.id = m.conversationId
         GROUP BY c.id
         ORDER BY c.lastMessageAt DESC
         LIMIT ?`,
        [limit]
      );

      console.log('\n📋 Последние диалоги:');
      console.log('═══════════════════════════════════════════════════════════════');

      for (const conv of conversations) {
        const status = this.getStatusEmoji(conv.clientStatus);
        const date = new Date(conv.lastMessageAt).toLocaleString('ru-RU');

        console.log(`\n${status} ${conv.userName} (ID: ${conv.userId})`);
        console.log(`   📅 Последнее сообщение: ${date}`);
        console.log(`   💬 Сообщений: ${conv.messageCount}`);
        console.log(`   📱 Телефон: ${conv.userPhone || 'Не указан'}`);

        if (conv.interestedProducts && conv.interestedProducts !== '[]') {
          const products = JSON.parse(conv.interestedProducts);
          if (products.length > 0) {
            console.log(`   🎯 Интересуется: ${products.join(', ')}`);
          }
        }
      }
      console.log('\n═══════════════════════════════════════════════════════════════');
    } catch (error) {
      console.error('❌ Ошибка при получении диалогов:', error);
    }
  }

  async analyzeConversation(userId: string): Promise<void> {
    try {
      const conversation = await database.getFullConversation(userId);

      if (!conversation) {
        console.log('❌ Диалог не найден');
        return;
      }

      console.log(`\n📊 Анализ диалога с ${conversation.userName}`);
      console.log('═══════════════════════════════════════════════════════════════');

      console.log(`\n📱 Контакт: ${conversation.userPhone || 'Не указан'}`);
      console.log(`📅 Начало диалога: ${conversation.createdAt.toLocaleString('ru-RU')}`);
      console.log(`📅 Последнее сообщение: ${conversation.lastMessageAt.toLocaleString('ru-RU')}`);
      console.log(`💬 Всего сообщений: ${conversation.messages.length}`);
      console.log(`📊 Статус: ${this.getStatusText(conversation.clientStatus)}`);

      console.log('\n🤖 AI-анализ диалога...');
      const insights = await this.aiAgent.analyzeConversationForInsights(conversation);

      console.log('\n📝 Краткое содержание:');
      console.log(insights.summary);

      console.log('\n💡 Рекомендации:');
      insights.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });

      console.log('\n🎯 Следующие шаги:');
      insights.nextSteps.forEach((step, i) => {
        console.log(`${i + 1}. ${step}`);
      });

      console.log('\n💬 Последние 5 сообщений:');
      console.log('───────────────────────────────────────────────────────────────');
      const lastMessages = conversation.messages.slice(-5);
      lastMessages.forEach(msg => {
        const role = msg.role === 'user' ? '👤 Клиент' : '🤖 Бот';
        const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU');
        console.log(`\n[${time}] ${role}:`);
        console.log(msg.content);
      });

      console.log('\n═══════════════════════════════════════════════════════════════');
    } catch (error) {
      console.error('❌ Ошибка при анализе диалога:', error);
    }
  }

  async exportConversations(): Promise<void> {
    try {
      const all = (database as any).all;

      const conversations = await all(
        `SELECT c.*,
         (SELECT COUNT(*) FROM messages WHERE conversationId = c.id) as messageCount
         FROM conversations c
         ORDER BY c.createdAt DESC`
      );

      const csvContent = [
        'ID,Имя,Телефон,Статус,Количество сообщений,Интересующие продукты,Дата создания,Последнее сообщение',
        ...conversations.map((conv: any) => {
          const products = JSON.parse(conv.interestedProducts || '[]').join(';');
          return `${conv.userId},"${conv.userName}","${conv.userPhone || ''}","${conv.clientStatus}",${conv.messageCount},"${products}","${conv.createdAt}","${conv.lastMessageAt}"`;
        })
      ].join('\n');

      const fileName = `conversations_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = path.join(process.cwd(), fileName);

      fs.writeFileSync(filePath, '\ufeff' + csvContent, 'utf8');

      console.log(`✅ Диалоги экспортированы в файл: ${fileName}`);
      console.log(`📁 Путь: ${filePath}`);
    } catch (error) {
      console.error('❌ Ошибка при экспорте:', error);
    }
  }

  private getStatusEmoji(status: string): string {
    const statusMap: Record<string, string> = {
      'new': '🆕',
      'interested': '💫',
      'negotiating': '💰',
      'purchased': '✅',
      'lost': '❌'
    };
    return statusMap[status] || '❓';
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'new': 'Новый клиент',
      'interested': 'Заинтересован',
      'negotiating': 'В процессе переговоров',
      'purchased': 'Совершил покупку',
      'lost': 'Потерян'
    };
    return statusMap[status] || 'Неизвестно';
  }

  async generateDailyReport(): Promise<void> {
    try {
      const stats = await database.getConversationStats();
      const today = new Date().toLocaleDateString('ru-RU');

      console.log(`\n📊 Ежедневный отчет за ${today}`);
      console.log('═══════════════════════════════════════════════════════════════');

      console.log(`\n📈 Общая статистика:`);
      console.log(`   Всего диалогов: ${stats.total}`);
      console.log(`   Активных сегодня: ${stats.activeToday}`);

      console.log(`\n📊 Распределение по статусам:`);
      Object.entries(stats.byStatus).forEach(([status, count]) => {
        const emoji = this.getStatusEmoji(status);
        const text = this.getStatusText(status);
        const percentage = ((count / stats.total) * 100).toFixed(1);
        console.log(`   ${emoji} ${text}: ${count} (${percentage}%)`);
      });

      console.log('\n═══════════════════════════════════════════════════════════════');
    } catch (error) {
      console.error('❌ Ошибка при генерации отчета:', error);
    }
  }
}
