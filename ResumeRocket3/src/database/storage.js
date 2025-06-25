// Storage interface definition
class IStorage {
  // User methods
  async getUser(id) { throw new Error('Not implemented'); }
  async getUserByEmail(email) { throw new Error('Not implemented'); }
  async getUserByUsername(username) { throw new Error('Not implemented'); }
  async createUser(insertUser) { throw new Error('Not implemented'); }
  async updateUser(id, updates) { throw new Error('Not implemented'); }
  async updateLastLogin(id) { throw new Error('Not implemented'); }
  async getAllUsers(limit, offset) { throw new Error('Not implemented'); }
  async getUserCount() { throw new Error('Not implemented'); }

  // Resume methods
  async createResume(insertResume) { throw new Error('Not implemented'); }
  async getResume(id) { throw new Error('Not implemented'); }
  async getResumesByUser(userId) { throw new Error('Not implemented'); }
  async getAllResumes(limit, offset) { throw new Error('Not implemented'); }
  async updateResume(id, updates) { throw new Error('Not implemented'); }
  async deleteResume(id) { throw new Error('Not implemented'); }
  async getResumeCount() { throw new Error('Not implemented'); }

  // Stats methods
  async getUserStats(userId) { throw new Error('Not implemented'); }
  async updateUserStats(userId, stats) { throw new Error('Not implemented'); }

  // Skill assessment methods
  async createSkillAssessment(assessment) { throw new Error('Not implemented'); }
  async getSkillAssessmentsByUser(userId) { throw new Error('Not implemented'); }

  // Audit log methods
  async createAuditLog(log) { throw new Error('Not implemented'); }
  async getAuditLogs(limit, offset) { throw new Error('Not implemented'); }

  // Analytics methods
  async getAnalyticsData() { throw new Error('Not implemented'); }
}

module.exports = { IStorage };