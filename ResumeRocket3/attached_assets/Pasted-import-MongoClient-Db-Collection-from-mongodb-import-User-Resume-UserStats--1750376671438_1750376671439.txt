import { MongoClient, Db, Collection } from 'mongodb';
import { 
  User, 
  Resume, 
  UserStats, 
  SkillAssessment, 
  AuditLog,
  InsertUser,
  InsertResume
} from '@shared/schema';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Info:cHNxc0Bji6uvSFUU@resumecluster.bsi2yed.mongodb.net/?retryWrites=true&w=majority&appName=Resumecluster";
const DB_NAME = 'resume_platform';

class MongoDB {
  private client: MongoClient;
  private db: Db;
  private isConnected: boolean = false;

  constructor() {
    this.client = new MongoClient(MONGODB_URI);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log('MongoDB disconnected');
    }
  }

  getCollection<T = any>(name: string): Collection<T> {
    if (!this.isConnected) {
      throw new Error('MongoDB not connected');
    }
    return this.db.collection<T>(name);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error('MongoDB connection test failed:', error);
      return false;
    }
  }

  async createIndexes(): Promise<void> {
    try {
      // Users collection indexes
      const usersCollection = this.getCollection('users');
      await usersCollection.createIndex({ email: 1 }, { unique: true });
      await usersCollection.createIndex({ username: 1 }, { unique: true });
      await usersCollection.createIndex({ createdAt: -1 });

      // Resumes collection indexes
      const resumesCollection = this.getCollection('resumes');
      await resumesCollection.createIndex({ userId: 1 });
      await resumesCollection.createIndex({ createdAt: -1 });
      await resumesCollection.createIndex({ industry: 1 });
      await resumesCollection.createIndex({ atsScore: -1 });

      // User stats collection indexes
      const userStatsCollection = this.getCollection('userStats');
      await userStatsCollection.createIndex({ userId: 1 }, { unique: true });

      // Skill assessments collection indexes
      const skillAssessmentsCollection = this.getCollection('skillAssessments');
      await skillAssessmentsCollection.createIndex({ userId: 1 });
      await skillAssessmentsCollection.createIndex({ createdAt: -1 });

      // Audit logs collection indexes
      const auditLogsCollection = this.getCollection('auditLogs');
      await auditLogsCollection.createIndex({ userId: 1 });
      await auditLogsCollection.createIndex({ createdAt: -1 });
      await auditLogsCollection.createIndex({ action: 1 });

      console.log('✅ MongoDB indexes created successfully');
    } catch (error) {
      console.error('❌ Failed to create MongoDB indexes:', error);
    }
  }
}

export const mongodb = new MongoDB();

// Test connection function
export async function testMongoConnection(): Promise<boolean> {
  try {
    await mongodb.connect();
    await mongodb.createIndexes();
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    return false;
  }
}