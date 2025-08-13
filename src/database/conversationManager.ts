import { Database } from 'bun:sqlite';
import path from 'path';

export interface Message {
  id?: number;
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface Conversation {
  id?: number;
  userId: string;
  userName: string;
  userPhone?: string;
  clientStatus: 'new' | 'interested' | 'negotiating' | 'purchased' | 'lost';
  interestedProducts: string[];
  followUpScheduled?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

class ConversationManager {
  private db: Database;

  constructor() {
    const dbPath = path.join(process.cwd(), 'conversations.db');
    console.log(`💬 Подключение к базе диалогов: ${dbPath}`);

    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    // Создаем таблицы если их нет
    this.db.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        userName TEXT NOT NULL,
        userPhone TEXT,
        clientStatus TEXT DEFAULT 'new',
        interestedProducts TEXT DEFAULT '[]',
        followUpScheduled DATETIME,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversationId INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversationId) REFERENCES conversations(id)
      )
    `);

    // Создаем индексы
    this.db.run('CREATE INDEX IF NOT EXISTS idx_conversations_userId ON conversations(userId)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_messages_conversationId ON messages(conversationId)');

    console.log('✅ База данных диалогов инициализирована');
  }

  async createConversation(userId: string, userName: string, userPhone?: string): Promise<number> {
    const stmt = this.db.prepare(`
      INSERT INTO conversations (userId, userName, userPhone)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(userId, userName, userPhone || null);
    return Number(result.lastInsertRowid);
  }

  async getActiveConversation(userId: string): Promise<number | null> {
    const stmt = this.db.prepare(`
      SELECT id FROM conversations
      WHERE userId = ?
      ORDER BY updatedAt DESC
      LIMIT 1
    `);

    const result = stmt.get(userId) as { id: number } | undefined;
    return result ? result.id : null;
  }

  async getConversation(conversationId: number): Promise<Conversation | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM conversations WHERE id = ?
    `);

    const result = stmt.get(conversationId) as any;
    if (!result) return null;

    return {
      ...result,
      interestedProducts: JSON.parse(result.interestedProducts || '[]'),
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
      followUpScheduled: result.followUpScheduled ? new Date(result.followUpScheduled) : undefined
    };
  }

  async addMessage(conversationId: number, role: 'user' | 'assistant' | 'system', content: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO messages (conversationId, role, content)
      VALUES (?, ?, ?)
    `);

    stmt.run(conversationId, role, content);

    // Обновляем время последнего обновления диалога
    const updateStmt = this.db.prepare(`
      UPDATE conversations
      SET updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateStmt.run(conversationId);
  }

  async getMessages(conversationId: number, limit: number = 50): Promise<Message[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM messages
      WHERE conversationId = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `);

    const results = stmt.all(conversationId, limit) as any[];

    return results.map(r => ({
      ...r,
      createdAt: new Date(r.createdAt)
    })).reverse();
  }

  async updateConversationStatus(conversationId: number, status: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE conversations
      SET clientStatus = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(status, conversationId);
  }

  async updateInterestedProducts(conversationId: number, products: string[]): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE conversations
      SET interestedProducts = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(JSON.stringify(products), conversationId);
  }

  async getAllConversations(): Promise<Conversation[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM conversations
      ORDER BY updatedAt DESC
    `);

    const results = stmt.all() as any[];

    return results.map(r => ({
      ...r,
      interestedProducts: JSON.parse(r.interestedProducts || '[]'),
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
      followUpScheduled: r.followUpScheduled ? new Date(r.followUpScheduled) : undefined
    }));
  }
}

export const conversationManager = new ConversationManager();
