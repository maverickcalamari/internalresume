// User types
const UserRole = {
  USER: 'user',
  ADMIN: 'admin'
};

// Base user interface for database operations
class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || UserRole.USER;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt;
    this.lastLoginAt = data.lastLoginAt;
  }
}

// Resume interface
class Resume {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.filename = data.filename;
    this.originalContent = data.originalContent;
    this.optimizedContent = data.optimizedContent;
    this.industry = data.industry;
    this.atsScore = data.atsScore;
    this.analysis = data.analysis;
    this.suggestions = data.suggestions;
    this.skillsGap = data.skillsGap;
    this.isPublic = data.isPublic || false;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

// User statistics
class UserStats {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.resumesAnalyzed = data.resumesAnalyzed || 0;
    this.avgScore = data.avgScore || 0;
    this.interviews = data.interviews || 0;
    this.totalOptimizations = data.totalOptimizations || 0;
    this.lastActivityAt = data.lastActivityAt;
  }
}

// Skill assessment
class SkillAssessment {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.industry = data.industry;
    this.skills = data.skills;
    this.overallScore = data.overallScore;
    this.recommendations = data.recommendations;
    this.createdAt = data.createdAt;
  }
}

// Audit log
class AuditLog {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.action = data.action;
    this.details = data.details;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
    this.createdAt = data.createdAt;
  }
}

// Input types for creating records
class InsertUser {
  constructor(data) {
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.isActive = data.isActive;
  }
}

class InsertResume {
  constructor(data) {
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
  }
}

// Resume analysis types
class ResumeAnalysis {
  constructor(data) {
    this.strengths = data.strengths || [];
    this.weaknesses = data.weaknesses || [];
    this.keywords = data.keywords || [];
    this.formatting = data.formatting || {};
    this.sections = data.sections || {};
  }
}

class ResumeSuggestion {
  constructor(data) {
    this.type = data.type;
    this.priority = data.priority;
    this.title = data.title;
    this.description = data.description;
    this.example = data.example;
  }
}

class SkillGap {
  constructor(data) {
    this.missingSkills = data.missingSkills || [];
    this.improvementAreas = data.improvementAreas || [];
    this.recommendations = data.recommendations || [];
  }
}

module.exports = {
  UserRole,
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
};