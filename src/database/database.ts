import sqlite3 from "sqlite3";
import { promisify } from "node:util";
import dotenv from "dotenv";
import { logger } from "../utils/logger";
import { Validator } from "../utils/validator";

dotenv.config();

export interface Conversation {
  id?: number;
  userId: string;
  userName: string;
  userPhone?: string;
  messages: Message[];
  lastMessageAt: Date;
  followUpScheduled?: Date;
  clientStatus: "new" | "interested" | "negotiating" | "purchased" | "lost";
  interestedProducts: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id?: number;
  conversationId?: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface FollowUp {
  id?: number;
  conversationId: number;
  scheduledAt: Date;
  completed: boolean;
  message?: string;
}

class Database {
  private db: sqlite3.Database;
  private run: (sql: string, params?: any[]) => Promise<void>;
  private get: (sql: string, params?: any[]) => Promise<any>;
  private all: (sql: string, params?: any[]) => Promise<any[]>;

  constructor() {
    const dbPath = process.env.DATABASE_PATH || "./conversations.db";
    this.db = new sqlite3.Database(dbPath);

    // Promisify database methods
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
  }

  async initialize(): Promise<void> {
    // Create conversations table
    await this.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL UNIQUE,
        userName TEXT NOT NULL,
        userPhone TEXT,
        lastMessageAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        followUpScheduled DATETIME,
        clientStatus TEXT DEFAULT 'new',
        interestedProducts TEXT DEFAULT '[]',
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create messages table
    await this.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversationId INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversationId) REFERENCES conversations(id)
      )
    `);

    // Create follow_ups table
    await this.run(`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversationId INTEGER NOT NULL,
        scheduledAt DATETIME NOT NULL,
        completed BOOLEAN DEFAULT 0,
        message TEXT,
        FOREIGN KEY (conversationId) REFERENCES conversations(id)
      )
    `);

    // Create indexes
    await this.run(
      "CREATE INDEX IF NOT EXISTS idx_conversations_userId ON conversations(userId)",
    );
    await this.run(
      "CREATE INDEX IF NOT EXISTS idx_messages_conversationId ON messages(conversationId)",
    );
    await this.run(
      "CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduledAt ON follow_ups(scheduledAt)",
    );
  }

  async getOrCreateConversation(
    userId: string,
    userName: string,
    userPhone?: string,
  ): Promise<number> {
    // Check if conversation exists
    const existing = await this.get(
      "SELECT id FROM conversations WHERE userId = ?",
      [userId],
    );

    if (existing) {
      // Update last message time
      await this.run(
        "UPDATE conversations SET lastMessageAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
        [existing.id],
      );
      return existing.id;
    }

    // Create new conversation
    await this.run(
      "INSERT INTO conversations (userId, userName, userPhone) VALUES (?, ?, ?)",
      [userId, userName, userPhone],
    );

    const result = await this.get("SELECT last_insert_rowid() as id");
    return result.id;
  }

  async addMessage(
    conversationId: number,
    role: "user" | "assistant",
    content: string,
  ): Promise<void> {
    await this.run(
      "INSERT INTO messages (conversationId, role, content) VALUES (?, ?, ?)",
      [conversationId, role, content],
    );

    // Update conversation's last message time
    await this.run(
      "UPDATE conversations SET lastMessageAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [conversationId],
    );
  }

  async getConversationHistory(
    conversationId: number,
    limit = 20,
  ): Promise<Message[]> {
    const messages = await this.all(
      "SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp DESC LIMIT ?",
      [conversationId, limit],
    );

    return messages.reverse().map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  }

  async getFullConversation(userId: string): Promise<Conversation | null> {
    const conv = await this.get(
      "SELECT * FROM conversations WHERE userId = ?",
      [userId],
    );
    if (!conv) return null;

    const messages = await this.getConversationHistory(conv.id, 100);

    return {
      ...conv,
      messages,
      interestedProducts: JSON.parse(conv.interestedProducts || "[]"),
      lastMessageAt: new Date(conv.lastMessageAt),
      followUpScheduled: conv.followUpScheduled
        ? new Date(conv.followUpScheduled)
        : undefined,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
    };
  }

  async updateClientStatus(
    conversationId: number,
    status: Conversation["clientStatus"],
  ): Promise<void> {
    await this.run(
      "UPDATE conversations SET clientStatus = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [status, conversationId],
    );
  }

  async updateInterestedProducts(
    conversationId: number,
    products: string[],
  ): Promise<void> {
    await this.run(
      "UPDATE conversations SET interestedProducts = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [JSON.stringify(products), conversationId],
    );
  }

  async scheduleFollowUp(
    conversationId: number,
    scheduledAt: Date,
    message?: string,
  ): Promise<void> {
    await this.run(
      "INSERT INTO follow_ups (conversationId, scheduledAt, message) VALUES (?, ?, ?)",
      [conversationId, scheduledAt.toISOString(), message],
    );

    await this.run(
      "UPDATE conversations SET followUpScheduled = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [scheduledAt.toISOString(), conversationId],
    );
  }

  async getPendingFollowUps(): Promise<
    Array<{ followUp: FollowUp; conversation: Conversation }>
  > {
    const followUps = await this.all(
      `SELECT f.*, c.*
       FROM follow_ups f
       JOIN conversations c ON f.conversationId = c.id
       WHERE f.completed = 0 AND f.scheduledAt <= datetime('now')`,
    );

    return followUps.map((row) => ({
      followUp: {
        id: row.id,
        conversationId: row.conversationId,
        scheduledAt: new Date(row.scheduledAt),
        completed: Boolean(row.completed),
        message: row.message,
      },
      conversation: {
        id: row.conversationId,
        userId: row.userId,
        userName: row.userName,
        userPhone: row.userPhone,
        messages: [],
        lastMessageAt: new Date(row.lastMessageAt),
        followUpScheduled: new Date(row.followUpScheduled),
        clientStatus: row.clientStatus,
        interestedProducts: JSON.parse(row.interestedProducts || "[]"),
        notes: row.notes,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      },
    }));
  }

  async markFollowUpCompleted(followUpId: number): Promise<void> {
    await this.run("UPDATE follow_ups SET completed = 1 WHERE id = ?", [
      followUpId,
    ]);
  }

  async addNotes(conversationId: number, notes: string): Promise<void> {
    await this.run(
      "UPDATE conversations SET notes = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [notes, conversationId],
    );
  }

  async getConversationStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    activeToday: number;
  }> {
    const total = await this.get("SELECT COUNT(*) as count FROM conversations");
    const byStatus = await this.all(
      "SELECT clientStatus, COUNT(*) as count FROM conversations GROUP BY clientStatus",
    );
    const activeToday = await this.get(
      "SELECT COUNT(*) as count FROM conversations WHERE date(lastMessageAt) = date('now')",
    );

    const statusMap: Record<string, number> = {};
    byStatus.forEach((row) => {
      statusMap[row.clientStatus] = row.count;
    });

    return {
      total: total.count,
      byStatus: statusMap,
      activeToday: activeToday.count,
    };
  }

  async deleteConversation(userId: string): Promise<void> {
    await this.run("DELETE FROM conversations WHERE userId = ?", [userId]);
  }

  // Методы для работы с настройками
  async getSetting(key: string): Promise<string | null> {
    try {
      const result = await this.get(
        "SELECT value FROM settings WHERE key = ?",
        [key],
      );
      return result ? result.value : null;
    } catch (error) {
      // Если таблица не существует, создаем её
      await this.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      return null;
    }
  }

  async setSetting(key: string, value: string): Promise<void> {
    // Сначала убедимся, что таблица существует
    await this.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.run(
      `INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [key, value],
    );
  }

  async deleteSetting(key: string): Promise<void> {
    await this.run("DELETE FROM settings WHERE key = ?", [key]);
  }

  async getRecentConversations(limit: number): Promise<any[]> {
    const conversations = await this.all(
      `SELECT c.*, COUNT(m.id) as messageCount
       FROM conversations c
       LEFT JOIN messages m ON c.id = m.conversationId
       GROUP BY c.id
       ORDER BY c.lastMessageAt DESC
       LIMIT ?`,
      [limit],
    );
    return conversations;
  }

  async getAllConversations(): Promise<any[]> {
    const conversations = await this.all(
      `SELECT c.*, COUNT(m.id) as messageCount
       FROM conversations c
       LEFT JOIN messages m ON c.id = m.conversationId
       GROUP BY c.id
       ORDER BY c.lastMessageAt DESC`,
    );
    return conversations;
  }

  async getStats(): Promise<any> {
    const stats = await this.getConversationStats();
    return stats;
  }

  close(): void {
    this.db.close();
  }
}

export const database = new Database();
