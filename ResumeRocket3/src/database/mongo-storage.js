const { ObjectId } = require('mongodb');
const { mongodb } = require('./mongodb');
const { 
  User, 
  Resume, 
  UserStats, 
  SkillAssessment, 
  AuditLog,
  InsertUser,
  InsertResume,
  ResumeAnalysis,
  ResumeSuggestion,
  SkillGap
} = require('../shared/schema');
const { IStorage } = require('./storage');

// MongoDB document interfaces
class UserDocument {
  constructor(data) {
    this._id = data._id;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.lastLoginAt = data.lastLoginAt;
  }
}

class ResumeDocument {
  constructor(data) {
    this._id = data._id;
    this.userId = data.userId;
    this.filename = data.filename;
    this.originalContent = data.originalContent;
    this.optimizedContent = data.optimizedContent;
    this.industry = data.industry;
    this.atsScore = data.atsScore;
    this.analysis = data.analysis;
    this.suggestions = data.suggestions;
    this.skillsGap = data.skillsGap;
    this.isPublic = data.isPublic;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

class UserStatsDocument {
  constructor(data) {
    this._id = data._id;
    this.userId = data.userId;
    this.resumesAnalyzed = data.resumesAnalyzed;
    this.avgScore = data.avgScore;
    this.interviews = data.interviews;
    this.totalOptimizations = data.totalOptimizations;
    this.lastActivityAt = data.lastActivityAt;
  }
}

class SkillAssessmentDocument {
  constructor(data) {
    this._id = data._id;
    this.userId = data.userId;
    this.industry = data.industry;
    this.skills = data.skills;
    this.overallScore = data.overallScore;
    this.recommendations = data.recommendations;
    this.createdAt = data.createdAt;
  }
}

class AuditLogDocument {
  constructor(data) {
    this._id = data._id;
    this.userId = data.userId;
    this.action = data.action;
    this.details = data.details;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
    this.createdAt = data.createdAt;
  }
}

class MongoStorage extends IStorage {
  getNextId() {
    // For compatibility with existing code, we'll use timestamp-based IDs
    return Date.now();
  }

  convertUserFromMongo(doc) {
    return new User({
      id: doc._id ? parseInt(doc._id.toString().slice(-8), 16) : this.getNextId(),
      username: doc.username,
      email: doc.email,
      password: doc.password,
      role: doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      lastLoginAt: doc.lastLoginAt,
    });
  }

  convertResumeFromMongo(doc) {
    return new Resume({
      id: doc._id ? parseInt(doc._id.toString().slice(-8), 16) : this.getNextId(),
      userId: doc.userId ? parseInt(doc.userId.toString().slice(-8), 16) : null,
      filename: doc.filename,
      originalContent: doc.originalContent,
      optimizedContent: doc.optimizedContent,
      industry: doc.industry,
      atsScore: doc.atsScore,
      analysis: doc.analysis,
      suggestions: doc.suggestions,
      skillsGap: doc.skillsGap,
      isPublic: doc.isPublic,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  // User management
  async getUser(id) {
    try {
      const collection = mongodb.getCollection('users');
      const doc = await collection.findOne({ 
        $or: [
          { _id: new ObjectId(id.toString().padStart(24, '0')) },
          { _id: ObjectId.createFromHexString(id.toString(16).padStart(24, '0')) }
        ]
      });
      return doc ? this.convertUserFromMongo(doc) : undefined;
    } catch (error) {
      // Try finding by a custom id field if ObjectId conversion fails
      const collection = mongodb.getCollection('users');
      const doc = await collection.findOne({ id });
      return doc ? this.convertUserFromMongo(doc) : undefined;
    }
  }

  async getUserByEmail(email) {
    const collection = mongodb.getCollection('users');
    const doc = await collection.findOne({ email });
    return doc ? this.convertUserFromMongo(doc) : undefined;
  }

  async getUserByUsername(username) {
    const collection = mongodb.getCollection('users');
    const doc = await collection.findOne({ username });
    return doc ? this.convertUserFromMongo(doc) : undefined;
  }

  async createUser(insertUser) {
    const collection = mongodb.getCollection('users');
    const now = new Date();
    const userDoc = {
      ...insertUser,
      isActive: insertUser.isActive ?? true,
      createdAt: now,
      lastLoginAt: null,
    };

    const result = await collection.insertOne(userDoc);
    const user = this.convertUserFromMongo({ ...userDoc, _id: result.insertedId });

    // Create default user stats
    await this.createDefaultUserStats(user.id);

    return user;
  }

  async createDefaultUserStats(userId) {
    const collection = mongodb.getCollection('userStats');
    await collection.insertOne({
      userId: new ObjectId(userId.toString(16).padStart(24, '0')),
      resumesAnalyzed: 0,
      avgScore: 0,
      interviews: 0,
      totalOptimizations: 0,
      lastActivityAt: new Date(),
    });
  }

  async updateUser(id, updates) {
    const collection = mongodb.getCollection('users');
    
    try {
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id.toString(16).padStart(24, '0')) },
        { $set: updates },
        { returnDocument: 'after' }
      );
      return result ? this.convertUserFromMongo(result) : undefined;
    } catch (error) {
      // Fallback to custom id field
      const result = await collection.findOneAndUpdate(
        { id },
        { $set: updates },
        { returnDocument: 'after' }
      );
      return result ? this.convertUserFromMongo(result) : undefined;
    }
  }

  async updateLastLogin(id) {
    const collection = mongodb.getCollection('users');
    
    try {
      await collection.updateOne(
        { _id: new ObjectId(id.toString(16).padStart(24, '0')) },
        { $set: { lastLoginAt: new Date() } }
      );
    } catch (error) {
      // Fallback to custom id field
      await collection.updateOne(
        { id },
        { $set: { lastLoginAt: new Date() } }
      );
    }
  }

  // Resume management
  async createResume(insertResume) {
    const collection = mongodb.getCollection('resumes');
    const now = new Date();
    
    const resumeDoc = {
      ...insertResume,
      userId: insertResume.userId ? new ObjectId(insertResume.userId.toString(16).padStart(24, '0')) : null,
      isPublic: insertResume.isPublic ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(resumeDoc);
    return this.convertResumeFromMongo({ ...resumeDoc, _id: result.insertedId });
  }

  async getResume(id) {
    const collection = mongodb.getCollection('resumes');
    
    try {
      const doc = await collection.findOne({ 
        _id: new ObjectId(id.toString(16).padStart(24, '0')) 
      });
      return doc ? this.convertResumeFromMongo(doc) : undefined;
    } catch (error) {
      // Fallback to custom id field
      const doc = await collection.findOne({ id });
      return doc ? this.convertResumeFromMongo(doc) : undefined;
    }
  }

  async getResumesByUser(userId) {
    const collection = mongodb.getCollection('resumes');
    
    try {
      const docs = await collection
        .find({ userId: new ObjectId(userId.toString(16).padStart(24, '0')) })
        .sort({ createdAt: -1 })
        .toArray();
      return docs.map(doc => this.convertResumeFromMongo(doc));
    } catch (error) {
      // Fallback to custom userId field
      const docs = await collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();
      return docs.map(doc => this.convertResumeFromMongo(doc));
    }
  }

  async getAllResumes(limit = 50, offset = 0) {
    const collection = mongodb.getCollection('resumes');
    const docs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return docs.map(doc => this.convertResumeFromMongo(doc));
  }

  async updateResume(id, updates) {
    const collection = mongodb.getCollection('resumes');
    const updateDoc = {
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.userId) {
      updateDoc.userId = new ObjectId(updates.userId.toString(16).padStart(24, '0'));
    }

    try {
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id.toString(16).padStart(24, '0')) },
        { $set: updateDoc },
        { returnDocument: 'after' }
      );
      return result ? this.convertResumeFromMongo(result) : undefined;
    } catch (error) {
      // Fallback to custom id field
      const result = await collection.findOneAndUpdate(
        { id },
        { $set: updateDoc },
        { returnDocument: 'after' }
      );
      return result ? this.convertResumeFromMongo(result) : undefined;
    }
  }

  async deleteResume(id) {
    const collection = mongodb.getCollection('resumes');
    
    try {
      const result = await collection.deleteOne({ 
        _id: new ObjectId(id.toString(16).padStart(24, '0')) 
      });
      return result.deletedCount > 0;
    } catch (error) {
      // Fallback to custom id field
      const result = await collection.deleteOne({ id });
      return result.deletedCount > 0;
    }
  }

  // User stats
  async getUserStats(userId) {
    const collection = mongodb.getCollection('userStats');
    
    try {
      const doc = await collection.findOne({ 
        userId: new ObjectId(userId.toString(16).padStart(24, '0')) 
      });
      
      if (doc) {
        return new UserStats({
          id: doc._id ? parseInt(doc._id.toString().slice(-8), 16) : this.getNextId(),
          userId,
          resumesAnalyzed: doc.resumesAnalyzed,
          avgScore: doc.avgScore,
          interviews: doc.interviews,
          totalOptimizations: doc.totalOptimizations,
          lastActivityAt: doc.lastActivityAt,
        });
      }
      return undefined;
    } catch (error) {
      // Fallback to custom userId field
      const doc = await collection.findOne({ userId });
      if (doc) {
        return new UserStats({
          id: doc._id ? parseInt(doc._id.toString().slice(-8), 16) : this.getNextId(),
          userId,
          resumesAnalyzed: doc.resumesAnalyzed,
          avgScore: doc.avgScore,
          interviews: doc.interviews,
          totalOptimizations: doc.totalOptimizations,
          lastActivityAt: doc.lastActivityAt,
        });
      }
      return undefined;
    }
  }

  async updateUserStats(userId, stats) {
    const collection = mongodb.getCollection('userStats');
    const updateDoc = {
      ...stats,
      lastActivityAt: new Date(),
    };

    try {
      const result = await collection.findOneAndUpdate(
        { userId: new ObjectId(userId.toString(16).padStart(24, '0')) },
        { $set: updateDoc },
        { returnDocument: 'after', upsert: true }
      );

      return new UserStats({
        id: result._id ? parseInt(result._id.toString().slice(-8), 16) : this.getNextId(),
        userId,
        resumesAnalyzed: result.resumesAnalyzed,
        avgScore: result.avgScore,
        interviews: result.interviews,
        totalOptimizations: result.totalOptimizations,
        lastActivityAt: result.lastActivityAt,
      });
    } catch (error) {
      // Fallback to custom userId field
      const result = await collection.findOneAndUpdate(
        { userId },
        { $set: updateDoc },
        { returnDocument: 'after', upsert: true }
      );

      return new UserStats({
        id: result._id ? parseInt(result._id.toString().slice(-8), 16) : this.getNextId(),
        userId,
        resumesAnalyzed: result.resumesAnalyzed,
        avgScore: result.avgScore,
        interviews: result.interviews,
        totalOptimizations: result.totalOptimizations,
        lastActivityAt: result.lastActivityAt,
      });
    }
  }

  // Skill assessments
  async createSkillAssessment(assessment) {
    const collection = mongodb.getCollection('skillAssessments');
    const assessmentDoc = {
      ...assessment,
      userId: new ObjectId(assessment.userId.toString(16).padStart(24, '0')),
      createdAt: new Date(),
    };

    const result = await collection.insertOne(assessmentDoc);
    
    return new SkillAssessment({
      id: parseInt(result.insertedId.toString().slice(-8), 16),
      userId: assessment.userId,
      industry: assessmentDoc.industry,
      skills: assessmentDoc.skills,
      overallScore: assessmentDoc.overallScore,
      recommendations: assessmentDoc.recommendations,
      createdAt: assessmentDoc.createdAt,
    });
  }

  async getSkillAssessmentsByUser(userId) {
    const collection = mongodb.getCollection('skillAssessments');
    
    try {
      const docs = await collection
        .find({ userId: new ObjectId(userId.toString(16).padStart(24, '0')) })
        .sort({ createdAt: -1 })
        .toArray();

      return docs.map(doc => new SkillAssessment({
        id: doc._id ? parseInt(doc._id.toString().slice(-8), 16) : this.getNextId(),
        userId,
        industry: doc.industry,
        skills: doc.skills,
        overallScore: doc.overallScore,
        recommendations: doc.recommendations,
        createdAt: doc.createdAt,
      }));
    } catch (error) {
      // Fallback to custom userId field
      const docs = await collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

      return docs.map(doc => new SkillAssessment({
        id: doc._id ? parseInt(doc._id.toString().slice(-8), 16) : this.getNextId(),
        userId,
        industry: doc.industry,
        skills: doc.skills,
        overallScore: doc.overallScore,
        recommendations: doc.recommendations,
        createdAt: doc.createdAt,
      }));
    }
  }

  // Audit logs
  async createAuditLog(log) {
    const collection = mongodb.getCollection('auditLogs');
    const logDoc = {
      ...log,
      userId: log.userId ? new ObjectId(log.userId.toString(16).padStart(24, '0')) : undefined,
      createdAt: new Date(),
    };

    await collection.insertOne(logDoc);
  }

  async getAuditLogs(limit = 100, offset = 0) {
    const collection = mongodb.getCollection('auditLogs');
    const docs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return docs.map(doc => new AuditLog({
      id: doc._id ? parseInt(doc._id.toString().slice(-8), 16) : this.getNextId(),
      userId: doc.userId ? parseInt(doc.userId.toString().slice(-8), 16) : undefined,
      action: doc.action,
      details: doc.details,
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent,
      createdAt: doc.createdAt,
    }));
  }

  // Admin functions
  async getAllUsers(limit = 50, offset = 0) {
    const collection = mongodb.getCollection('users');
    const docs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return docs.map(doc => this.convertUserFromMongo(doc));
  }

  async getUserCount() {
    const collection = mongodb.getCollection('users');
    return await collection.countDocuments();
  }

  async getResumeCount() {
    const collection = mongodb.getCollection('resumes');
    return await collection.countDocuments();
  }

  async getAnalyticsData() {
    const usersCollection = mongodb.getCollection('users');
    const resumesCollection = mongodb.getCollection('resumes');

    // Get counts
    const totalUsers = await usersCollection.countDocuments();
    const totalResumes = await resumesCollection.countDocuments();

    // Get average ATS score
    const avgScoreResult = await resumesCollection.aggregate([
      { $match: { atsScore: { $ne: null } } },
      { $group: { _id: null, avgScore: { $avg: '$atsScore' } } }
    ]).toArray();
    const averageAtsScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentResumes = await resumesCollection.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const recentUsers = await usersCollection.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    return {
      totalUsers,
      totalResumes,
      averageAtsScore,
      recentResumes,
      recentUsers,
    };
  }
}

module.exports = { MongoStorage };