import { Api, TelegramApi } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { logger } from '../utils/logger';

export class ManagerNotificationMTProto {
  private client: TelegramApi | null = null;
  private isConnected = false;
  private readonly apiId: number;
  private readonly apiHash: string;
  private readonly sessionString: string;
  private readonly managerUsername: string;

  constructor() {
    this.apiId = parseInt(process.env.TELEGRAM_API_ID || '');
    this.apiHash = process.env.TELEGRAM_API_HASH || '';
    this.sessionString = process.env.TELEGRAM_SESSION_STRING || '';
    this.managerUsername = process.env.MANAGER_USERNAME || 'natalylini';

    if (!this.apiId || !this.apiHash || !this.sessionString) {
      logger.error('Missing required Telegram API credentials for MTProto');
    }
  }

  /**
   * Инициализация MTProto клиента
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info('Initializing MTProto client for manager notifications...');

      const session = new StringSession(this.sessionString);
      this.client = new TelegramApi(session, this.apiId, this.apiHash, {
        connectionRetries: 5,
      });

      await this.client.start({
        phoneNumber: async () => {
          throw new Error('Phone number should not be required with session string');
        },
        password: async () => {
          throw new Error('Password should not be required with session string');
        },
        phoneCode: async () => {
          throw new Error('Phone code should not be required with session string');
        },
        onError: (err) => {
          logger.error('MTProto client error:', err);
        },
      });

      this.isConnected = true;
      logger.info('MTProto client successfully initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize MTProto client:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Отправка уведомления менеджеру
   */
  async sendManagerNotification(message: string, urgencyLevel: string = 'medium'): Promise<boolean> {
    try {
      if (!this.isConnected || !this.client) {
        logger.warn('MTProto client not connected, attempting to initialize...');
        const initialized = await this.initialize();
        if (!initialized) {
          return false;
        }
      }

      logger.info(`Sending manager notification with urgency: ${urgencyLevel}`);

      // Получаем информацию о менеджере
      const managerEntity = await this.client.invoke(
        new Api.contacts.ResolveUsername({
          username: this.managerUsername,
        })
      );

      if (!managerEntity.users || managerEntity.users.length === 0) {
        logger.error(`Manager ${this.managerUsername} not found`);
        return false;
      }

      const manager = managerEntity.users[0];

      // Отправляем сообщение
      await this.client.invoke(
        new Api.messages.SendMessage({
          peer: manager.id,
          message: this.formatUrgentMessage(message, urgencyLevel),
          randomId: this.generateRandomId(),
        })
      );

      logger.info(`Manager notification sent successfully to @${this.managerUsername}`);
      return true;
    } catch (error) {
      logger.error('Failed to send manager notification via MTProto:', error);
      
      // Пытаемся переподключиться при ошибке
      if (error.message?.includes('CONNECTION_DEVICE_MODEL_EMPTY') || 
          error.message?.includes('AUTH_KEY_UNREGISTERED')) {
        logger.info('Attempting to reconnect MTProto client...');
        this.isConnected = false;
        await this.initialize();
      }
      
      return false;
    }
  }

  /**
   * Форматирование сообщения с учетом срочности
   */
  private formatUrgentMessage(message: string, urgencyLevel: string): string {
    const urgencyPrefix = this.getUrgencyPrefix(urgencyLevel);
    return `${urgencyPrefix}\n\n${message}`;
  }

  /**
   * Получение префикса срочности
   */
  private getUrgencyPrefix(urgencyLevel: string): string {
    switch (urgencyLevel) {
      case 'critical':
        return '🔴🚨 КРИТИЧЕСКАЯ ЭСКАЛАЦИЯ 🚨🔴';
      case 'high':
        return '🟠⚡ ВЫСОКИЙ ПРИОРИТЕТ ⚡🟠';
      case 'medium':
        return '🟡📋 ЭСКАЛАЦИЯ К МЕНЕДЖЕРУ 📋🟡';
      case 'low':
        return '🟢💬 УВЕДОМЛЕНИЕ МЕНЕДЖЕРА 💬🟢';
      default:
        return '📋 ЭСКАЛАЦИЯ К МЕНЕДЖЕРУ 📋';
    }
  }

  /**
   * Генерация случайного ID для сообщения
   */
  private generateRandomId(): bigint {
    return BigInt(Math.floor(Math.random() * 1000000000000000));
  }

  /**
   * Проверка подключения
   */
  async checkConnection(): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      // Простая проверка подключения
      await this.client.invoke(new Api.updates.GetState());
      return true;
    } catch (error) {
      logger.error('MTProto connection check failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Отключение клиента
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
        logger.info('MTProto client disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting MTProto client:', error);
    }
  }

  /**
   * Получение информации о сессии
   */
  getSessionInfo(): { connected: boolean; managerUsername: string } {
    return {
      connected: this.isConnected,
      managerUsername: this.managerUsername,
    };
  }
}

export const managerNotificationService = new ManagerNotificationMTProto();