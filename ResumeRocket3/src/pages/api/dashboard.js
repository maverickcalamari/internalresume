// Dashboard API endpoints
const express = require('express');
const router = express.Router();
const { MongoStorage } = require('../../database/mongo-storage');

const storage = new MongoStorage();

// Get user dashboard data
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const userStats = await storage.getUserStats(parseInt(userId));
    const resumes = await storage.getResumesByUser(parseInt(userId));
    const skillAssessments = await storage.getSkillAssessmentsByUser(parseInt(userId));

    res.json({
      stats: userStats || {
        resumesAnalyzed: 0,
        avgScore: 0,
        interviews: 0,
        totalOptimizations: 0
      },
      recentResumes: resumes.slice(0, 5),
      skillAssessments: skillAssessments.slice(0, 3),
      totalResumes: resumes.length
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get analytics for admin
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await storage.getAnalyticsData();
    res.json({ analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;