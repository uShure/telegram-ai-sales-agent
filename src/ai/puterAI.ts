import axios from 'axios';
import { logger } from '../utils/logger';

export interface PuterAIConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface PuterAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PuterAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class PuterAI {
  private apiKey: string;
  private baseURL: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: PuterAIConfig = {}) {
    this.apiKey = config.apiKey || process.env.PUTER_AI_API_KEY || '';
    this.baseURL = process.env.PUTER_AI_BASE_URL || 'https://api.puter.com/v1';
    this.model = config.model || process.env.PUTER_AI_MODEL || 'gpt-4o-mini';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 2000;

    if (!this.apiKey) {
      logger.warn('Puter AI API key not provided');
    }
  }

  /**
   * Отправка запроса к Puter AI
   */
  async chatCompletion(messages: PuterAIMessage[]): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('Puter AI API key not configured');
      }

      logger.info('Sending request to Puter AI...');

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
          stream: false,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 секунд таймаут
        }
      );

      const aiResponse: PuterAIResponse = response.data;
      
      if (!aiResponse.choices || aiResponse.choices.length === 0) {
        throw new Error('No response from Puter AI');
      }

      const content = aiResponse.choices[0].message.content;
      
      // Логируем использование токенов
      if (aiResponse.usage) {
        logger.info('Puter AI token usage:', aiResponse.usage);
      }

      logger.info('Puter AI response received successfully');
      return content;
    } catch (error) {
      logger.error('Puter AI request failed:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Puter AI API key');
        } else if (error.response?.status === 429) {
          throw new Error('Puter AI rate limit exceeded');
        } else if (error.response?.status === 503) {
          throw new Error('Puter AI service temporarily unavailable');
        }
      }
      
      throw new Error(`Puter AI error: ${error.message}`);
    }
  }

  /**
   * Генерация ответа с системным промптом
   */
  async generateResponse(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: PuterAIMessage[] = []
  ): Promise<string> {
    const messages: PuterAIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    return await this.chatCompletion(messages);
  }

  /**
   * Проверка доступности сервиса
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return false;
      }

      const response = await axios.get(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 10000,
      });

      return response.status === 200;
    } catch (error) {
      logger.error('Puter AI health check failed:', error);
      return false;
    }
  }

  /**
   * Получение информации о модели
   */
  getModelInfo(): { model: string; temperature: number; maxTokens: number } {
    return {
      model: this.model,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    };
  }

  /**
   * Установка параметров модели
   */
  setModelConfig(config: Partial<PuterAIConfig>): void {
    if (config.model) this.model = config.model;
    if (config.temperature !== undefined) this.temperature = config.temperature;
    if (config.maxTokens !== undefined) this.maxTokens = config.maxTokens;
  }

  /**
   * Получение списка доступных моделей
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      if (!this.apiKey) {
        throw new Error('API key not configured');
      }

      const response = await axios.get(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 10000,
      });

      return response.data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      logger.error('Failed to get available models:', error);
      return [];
    }
  }
}

// Экспорт экземпляра для использования в приложении
export const puterAI = new PuterAI();