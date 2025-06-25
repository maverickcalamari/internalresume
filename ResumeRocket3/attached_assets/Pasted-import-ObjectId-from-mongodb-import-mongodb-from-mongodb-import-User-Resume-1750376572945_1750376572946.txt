import { ObjectId } from 'mongodb';
import { mongodb } from './mongodb';
import { 
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
} from '@shared/schema';
import { IStorage } from './storage';

// MongoDB document interfaces
interface UserDocument extends Omit<User, 'id'> {
  _id?: ObjectId;
}

interface ResumeDocument extends Omit<Resume, 'id' | 'userId'> {
  _id?: ObjectId;
  userId?: ObjectId | null;
}

interface UserStatsDocument extends Omit<UserStats, 'id' | 'userId'> {
  _id?: ObjectId;
  userId: ObjectId;
}

interface SkillAssessmentDocument extends Omit<SkillAssessment, 'id' | 'userId'> {
  _id?: ObjectId;
  userId: ObjectId;
}

interface AuditLogDocument extends Omit<AuditLog, 'id' | 'userId'> {
  _id?: ObjectId;
  userId?: ObjectId;
}

export class MongoStorage implements IStorage {
  private getNextId(): number {
    // For compatibility with existing code, we'll use timestamp-based IDs
    return Date.now();
  }

  private convertUserFromMongo(doc: UserDocument): User {
    return {
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
    };
  }

  private convertResumeFromMongo(doc: ResumeDocument): Resume {
    return {
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
    };
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    try {
      const collection = mongodb.getCollection<UserDocument>('users');
      const doc = await collection.findOne({ 
        $or: [
          { _id: new ObjectId(id.toString().padStart(24, '0')) },
          { _id: ObjectId.createFromHexString(id.toString(16).padStart(24, '0')) }
        ]
      });
      return doc ? this.convertUserFromMongo(doc) : undefined;
    } catch (error) {
      // Try finding by a custom id field if ObjectId conversion fails
      const collection = mongodb.getCollection<UserDocument & { id: number }>('users');
      const doc = await collection.findOne({ id });
      return doc ? this.convertUserFromMongo(doc) : undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const collection = mongodb.getCollection<UserDocument>('users');
    const doc = await collection.findOne({ email });
    return doc ? this.convertUserFromMongo(doc) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const collection = mongodb.getCollection<UserDocument>('users');
    const doc = await collection.findOne({ username });
    return doc ? this.convertUserFromMongo(doc) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const collection = mongodb.getCollection<UserDocument>('users');
    const now = new Date();
    const userDoc: UserDocument = {
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

  private async createDefaultUserStats(userId: number): Promise<void> {
    const collection = mongodb.getCollection<UserStatsDocument>('userStats');
    await collection.insertOne({
      userId: new ObjectId(userId.toString(16).padStart(24, '0')),
      resumesAnalyzed: 0,
      avgScore: 0,
      interviews: 0,
      totalOptimizations: 0,
      lastActivityAt: new Date(),
    });
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const collection = mongodb.getCollection<UserDocument>('users');
    
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

  async updateLastLogin(id: number): Promise<void> {
    const collection = mongodb.getCollection<UserDocument>('users');
    
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
  async createResume(insertResume: InsertResume): Promise<Resume> {
    const collection = mongodb.getCollection<ResumeDocument>('resumes');
    const now = new Date();
    
    const resumeDoc: ResumeDocument = {
      ...insertResume,
      userId: insertResume.userId ? new ObjectId(insertResume.userId.toString(16).padStart(24, '0')) : null,
      isPublic: insertResume.isPublic ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(resumeDoc);
    return this.convertResumeFromMongo({ ...resumeDoc, _id: result.insertedId });
  }

  async getResume(id: number): Promise<Resume | undefined> {
    const collection = mongodb.getCollection<ResumeDocument>('resumes');
    
    try {
      const doc = await collection.findOne({ 
        _id: new ObjectId(id.toString(16).padStart(24, '0')) 
      });
      return doc ? this.convertResumeFromMongo(doc) : undefined;
    } catch (error) {
      // Fallback to custom id field
      const doc = await collection.findOne({ id } as any);
      return doc ? this.convertResumeFromMongo(doc) : undefined;
    }
  }

  async getResumesByUser(userId: number): Promise<Resume[]> {
    const collection = mongodb.getCollection<ResumeDocument>('resumes');
    
    try {
      const docs = await collection
        .find({ userId: new ObjectId(userId.toString(16).padStart(24, '0')) })
        .sort({ createdAt: -1 })
        .toArray();
      return docs.map(doc => this.convertResumeFromMongo(doc));
    } catch (error) {
      // Fallback to custom userId field
      const docs = await collection
        .find({ userId } as any)
        .sort({ createdAt: -1 })
        .toArray();
      return docs.map(doc => this.convertResumeFromMongo(doc));
    }
  }

  async getAllResumes(limit = 50, offset = 0): Promise<Resume[]> {
    const collection = mongodb.getCollection<ResumeDocument>('resumes');
    const docs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return docs.map(doc => this.convertResumeFromMongo(doc));
  }

  async updateResume(id: number, updates: Partial<InsertResume>): Promise<Resume | undefined> {
    const collection = mongodb.getCollection<ResumeDocument>('resumes');
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
        { id } as any,
        { $set: updateDoc },
        { returnDocument: 'after' }
      );
      return result ? this.convertResumeFromMongo(result) : undefined;
    }
  }

  async deleteResume(id: number): Promise<boolean> {
    const collection = mongodb.getCollection<ResumeDocument>('resumes');
    
    try {
      const result = await collection.deleteOne({ 
        _id: new ObjectId(id.toString(16).padStart(24, '0')) 
      });
      return result.deletedCount > 0;
    } catch (error) {
      // Fallback to custom id field
      const result = await collection.deleteOne({ id } as any);
      return result.deletedCount > 0;
    }
  }

  // User stats
  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const collection = mongodb.getCollection<UserStatsDocument>('userStats');
    
    try {
      const doc = await collection.findOne({ 
        userId: new ObjectId(userId.toString(16).padStart(24, '0')) 
      });
      
      if (doc) {
        return {
          id: doc._id ? parseInt(doc._id.toString().slice(-8), 16) : this.getNextId(),
          userId,
          resumesAnalyzed: doc.resumesAnalyzed,
          avgScore: doc.avgScore,
          interviews: doc.interviews,
          totalOptimizations: doc.totalOptimizations,
          lastActivityAt: doc.lastActivityAt,
        };
      }
      return undefined;
    } catch (error) {
      // Fallback to custom userId field
      const doc = await collection.findOne({ userId } as any);
      if (doc) {
        return {
          id: doc._id ? parseInt(doc._id.toString().slice(-8), 16) : this.getNextId(),
          userId,
          resumesAnalyzed: doc.resumesAnalyzed,
          avgScore: doc.avgScore,
          interviews: doc.interviews,
          totalOptimizations: doc.totalOptimizations,
          lastActivityAt: doc.lastActivityAt,
        };
      }
      return undefined;
    }
  }

  async updateUserStats(userId: number, stats: Partial<UserStats>): Promise<UserStats> {
    const collection = mongodb.getCollection<UserStatsDocument>('userStats');
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

      return {
        id: result!._id ? parseInt(result!._id.toString().slice(-8), 16) : this.getNextId(),
        userId,
        resumesAnalyzed: result!.resumesAnalyzed,
        avgScore: result!.avgScore,
        interviews: result!.interviews,
        totalOptimizations: result!.totalOptimizations,
        lastActivityAt: result!.lastActivityAt,
      };
    } catch (error) {
      // Fallback to custom userId field
      const result = await collection.findOneAndUpdate(
        { userId } as any,
        { $set: updateDoc },
        { returnDocument: 'after', upsert: true }
      );

      return {
        id: result!._id ? parseInt(result!._id.toString().slice(-8), 16) : this.getNextId(),
        userId,
        resumesAnalyzed: result!.resumesAnalyzed,
        avgScore: result!.avgScore,
        interviews: result!.interviews,
        totalOptimizations: result!.totalOptimizations,
        lastActivityAt: result!.lastActivityAt,
      };
    }
  }

  // Skill assessments
  async createSkillAssessment(assessment: any): Promise<SkillAssessment> {
    const collection = mongodb.getCollection<SkillAssessmentDocument>('skillAssessments');
    const assessmentDoc: SkillAssessmentDocument = {
      ...assessment,
      userId: new ObjectId(assessment.userId.toString(16).padStart(24, '0')),
      createdAt: new Date(),
    };

    const result = await collection.insertOne(assessmentDoc);
    
    return {
      id: parseInt(result.insertedId.toString().slice(-8), 16),
      userId: assessment.userId,
      industry: assessmentDoc.industry,
      skills: assessmentDoc.skills,
      overallScore: assessmentDoc.overallScore,
      recommendations: assessmentDoc.recommendations,
      createdAt: assessmentDoc.createdAt!,
    };
  }

  async getSkillAssessmentsByUser(userId: number): Promise<SkillAssessment[]> {
    const collection = mongodb.getCollection<SkillAssessmentDocument>('skillAssessments');
    
    try {
      const docs = await collection
        .find({ userId: new ObjectId(userId.toString(16).padStart(24, '0')) })
        .sort({ createdAt: -1 })
        .toArray();

      return docs.map(doc => ({
        id: doc._id ? parseInt(doc._id.toString().slice(-8), 16) : this.getNextId(),
        userId,
        industry: doc.industry,
        skills: doc.skills,
        overallScore: doc.overallScore,
        recommendations: doc.recommendations,
        createdAt: doc.createdAt!,
      }));
    } catch (error) {
      // Fallback to custom userId field
      const docs = await collection
        .find({ userId } as any)
        .sort({ createdAt: -1 })
        .toArray();

      return docs.map(doc => ({
        id: doc._id ? parseInt(doc._id.toString().slice(-8), 16) : this.getNextId(),
        userId,
        industry: doc.industry,
        skills: doc.skills,
        overallScore: doc.overallScore,
        recommendations: doc.recommendations,
        createdAt: doc.createdAt!,
      }));
    }
  }

  // Audit logs
  async createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    const collection = mongodb.getCollection<AuditLogDocument>('auditLogs');
    const logDoc: AuditLogDocument = {
      ...log,
      userId: log.userId ? new ObjectId(log.userId.toString(16).padStart(24, '0')) : undefined,
      createdAt: new Date(),
    };

    await collection.insertOne(logDoc);
  }

  async getAuditLogs(limit = 100, offset = 0): Promise<AuditLog[]> {
    const collection = mongodb.getCollection<AuditLogDocument>('auditLogs');
    const docs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return docs.map(doc => ({
      id: doc._id ? parseInt(doc._id.toString().slice(-8), 16) : this.getNextId(),
      userId: doc.userId ? parseInt(doc.userId.toString().slice(-8), 16) : undefined,
      action: doc.action,
      details: doc.details,
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent,
      createdAt: doc.createdAt!,
    }));
  }

  // Admin functions
  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    const collection = mongodb.getCollection<UserDocument>('users');
    const docs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return docs.map(doc => this.convertUserFromMongo(doc));
  }

  async getUserCount(): Promise<number> {
    const collection = mongodb.getCollection<UserDocument>('users');
    return await collection.countDocuments();
  }

  async getResumeCount(): Promise<number> {
    const collection = mongodb.getCollection<ResumeDocument>('resumes');
    return await collection.countDocuments();
  }

  async getAnalyticsData(): Promise<any> {
    const usersCollection = mongodb.getCollection<UserDocument>('users');
    const resumesCollection = mongodb.getCollection<ResumeDocument>('resumes');

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