const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Info:cHNxc0Bji6uvSFUU@resumecluster.bsi2yed.mongodb.net/?retryWrites=true&w=majority&appName=Resumecluster";
const DB_NAME = 'resume_platform';

class MongoDB {
  constructor() {
    this.client = new MongoClient(MONGODB_URI);
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Set connection timeout
      await Promise.race([
        this.client.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);
      
      this.db = this.client.db(DB_NAME);
      this.isConnected = true;
      
      console.log('✅ MongoDB connected successfully');
      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.isConnected = false;
      return null;
    }
  }

  getDatabase() {
    if (!this.isConnected || !this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  getCollection(name) {
    return this.getDatabase().collection(name);
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log('MongoDB disconnected');
    }
  }

  async testConnection() {
    try {
      await this.connect();
      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error('MongoDB connection test failed:', error);
      return false;
    }
  }

  async createIndexes() {
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

const mongodb = new MongoDB();

// Test connection function
async function testMongoConnection() {
  try {
    const result = await mongodb.connect();
    if (result) {
      await mongodb.createIndexes();
      return true;
    }
    return false;
  } catch (error) {
    console.error('MongoDB connection test failed:', error.message);
    return false;
  }
}

module.exports = { mongodb, testMongoConnection };