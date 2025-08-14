import { logger } from './logger';
import { managerNotificationService } from '../services/managerNotificationMTProto';

export interface EscalationContext {
  userId: number;
  userInfo: {
    firstName?: string;
    lastName?: string;
    username?: string;
    phoneNumber?: string;
  };
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  escalationReason: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class ManagerEscalationService {
  private static instance: ManagerEscalationService;

  public static getInstance(): ManagerEscalationService {
    if (!ManagerEscalationService.instance) {
      ManagerEscalationService.instance = new ManagerEscalationService();
    }
    return ManagerEscalationService.instance;
  }

  /**
   * Эскалация к менеджеру через личный аккаунт (MTProto)
   */
  async escalateToManager(context: EscalationContext): Promise<boolean> {
    try {
      logger.info('Starting manager escalation for user:', context.userId);

      // Формируем подробное сообщение для менеджера
      const escalationMessage = this.formatEscalationMessage(context);

      // Отправляем уведомление менеджеру через MTProto
      const success = await managerNotificationService.sendManagerNotification(
        escalationMessage,
        context.urgencyLevel
      );

      if (success) {
        logger.info('Manager escalation successful for user:', context.userId);
        return true;
      } else {
        logger.error('Failed to escalate to manager for user:', context.userId);
        return false;
      }
    } catch (error) {
      logger.error('Error during manager escalation:', error);
      return false;
    }
  }

  /**
   * Форматирование сообщения для эскалации
   */
  private formatEscalationMessage(context: EscalationContext): string {
    const { userInfo, conversationHistory, escalationReason, urgencyLevel } = context;

    let message = `🚨 ЭСКАЛАЦИЯ К МЕНЕДЖЕРУ\n\n`;
    message += `👤 Клиент: ${userInfo.firstName || ''} ${userInfo.lastName || ''}`;
    
    if (userInfo.username) {
      message += ` (@${userInfo.username})`;
    }
    
    if (userInfo.phoneNumber) {
      message += `\n📞 Телефон: ${userInfo.phoneNumber}`;
    }

    message += `\n🔥 Приоритет: ${this.getUrgencyEmoji(urgencyLevel)} ${urgencyLevel.toUpperCase()}`;
    message += `\n❗ Причина: ${escalationReason}\n\n`;

    message += `📝 ИСТОРИЯ РАЗГОВОРА:\n`;
    message += `${'='.repeat(40)}\n`;

    // Добавляем последние 5 сообщений из истории
    const recentMessages = conversationHistory.slice(-5);
    recentMessages.forEach((msg, index) => {
      const role = msg.role === 'user' ? '👤 Клиент' : '🤖 ИИ';
      const time = msg.timestamp.toLocaleString('ru-RU');
      message += `\n${role} (${time}):\n${msg.content}\n`;
      
      if (index < recentMessages.length - 1) {
        message += `${'-'.repeat(30)}\n`;
      }
    });

    message += `\n${'='.repeat(40)}\n`;
    message += `\n⏰ Время эскалации: ${new Date().toLocaleString('ru-RU')}`;
    message += `\n🆔 ID клиента: ${context.userId}`;

    return message;
  }

  /**
   * Получение эмодзи для уровня срочности
   */
  private getUrgencyEmoji(urgencyLevel: string): string {
    switch (urgencyLevel) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  /**
   * Проверка необходимости эскалации на основе контекста
   */
  shouldEscalate(conversationHistory: any[], lastUserMessage: string): boolean {
    // Ключевые слова, указывающие на необходимость эскалации
    const escalationKeywords = [
      'менеджер', 'руководитель', 'жалоба', 'недоволен', 'проблема',
      'говорить с человеком', 'живой человек', 'оператор',
      'не устраивает', 'плохо работает', 'не понимаю',
      'хочу поговорить с менеджером', 'свяжите с менеджером'
    ];

    const messageText = lastUserMessage.toLowerCase();
    
    // Проверяем наличие ключевых слов
    const hasEscalationKeywords = escalationKeywords.some(keyword => 
      messageText.includes(keyword)
    );

    // Проверяем длину разговора (если больше 10 сообщений без результата)
    const isLongConversation = conversationHistory.length > 10;

    // Проверяем повторяющиеся вопросы
    const hasRepeatedQuestions = this.checkRepeatedQuestions(conversationHistory);

    return hasEscalationKeywords || (isLongConversation && hasRepeatedQuestions);
  }

  /**
   * Определение уровня срочности эскалации
   */
  determineUrgencyLevel(conversationHistory: any[], lastUserMessage: string): 'low' | 'medium' | 'high' | 'critical' {
    const messageText = lastUserMessage.toLowerCase();

    // Критический уровень
    if (messageText.includes('срочно') || messageText.includes('критично') || 
        messageText.includes('немедленно')) {
      return 'critical';
    }

    // Высокий уровень
    if (messageText.includes('жалоба') || messageText.includes('недоволен') ||
        messageText.includes('проблема')) {
      return 'high';
    }

    // Средний уровень
    if (conversationHistory.length > 10) {
      return 'medium';
    }

    // Низкий уровень
    return 'low';
  }

  /**
   * Проверка повторяющихся вопросов
   */
  private checkRepeatedQuestions(conversationHistory: any[]): boolean {
    if (conversationHistory.length < 4) return false;

    const userMessages = conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content.toLowerCase());

    // Простая проверка на похожие сообщения
    for (let i = 0; i < userMessages.length - 1; i++) {
      for (let j = i + 1; j < userMessages.length; j++) {
        const similarity = this.calculateSimilarity(userMessages[i], userMessages[j]);
        if (similarity > 0.7) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Простой расчет схожести строк
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return commonWords.length / totalWords;
  }
}

export const managerEscalationService = ManagerEscalationService.getInstance();