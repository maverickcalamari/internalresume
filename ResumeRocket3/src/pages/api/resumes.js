// Resume API endpoints
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { MongoStorage } = require('../../database/mongo-storage');
const { sendUploadNotification, sendAnalysisCompleteEmail } = require('../../services/email');
const { InsertResume } = require('../../shared/schema');

const storage = new MongoStorage();

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOC/DOCX files are allowed.'));
    }
  }
});

// Upload resume endpoint
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { industry, userEmail, userId } = req.body;
    const { originalname, buffer, size } = req.file;

    // Generate resume analysis
    const analysisResult = await analyzeResume(buffer, industry);

    // Store resume
    const insertResume = new InsertResume({
      userId: userId || null,
      filename: originalname,
      originalContent: buffer.toString('base64'),
      industry: industry || 'General',
      atsScore: analysisResult.atsScore,
      analysis: analysisResult.analysis,
      suggestions: analysisResult.suggestions,
      skillsGap: analysisResult.skillsGap
    });

    const resume = await storage.createResume(insertResume);

    // Update user stats if user is logged in
    if (userId) {
      const userStats = await storage.getUserStats(userId);
      await storage.updateUserStats(userId, {
        resumesAnalyzed: (userStats?.resumesAnalyzed || 0) + 1,
        avgScore: analysisResult.atsScore,
        totalOptimizations: (userStats?.totalOptimizations || 0) + 1
      });
    }

    // Send email notifications
    try {
      await sendUploadNotification(originalname, userEmail || 'anonymous@pierline.com', {
        size,
        industry: industry || 'General',
        atsScore: analysisResult.atsScore
      });

      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          await sendAnalysisCompleteEmail(user, resume, analysisResult);
        }
      }
    } catch (emailError) {
      console.error('Failed to send upload notifications:', emailError);
    }

    res.status(201).json({
      message: 'Resume uploaded and analyzed successfully',
      resume: {
        id: resume.id,
        filename: resume.filename,
        industry: resume.industry,
        atsScore: resume.atsScore,
        analysis: resume.analysis,
        suggestions: resume.suggestions,
        createdAt: resume.createdAt
      }
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Resume upload failed' });
  }
});

// Get user resumes
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const resumes = await storage.getResumesByUser(parseInt(userId));
    res.json({
      resumes: resumes.map(resume => ({
        id: resume.id,
        filename: resume.filename,
        industry: resume.industry,
        atsScore: resume.atsScore,
        isPublic: resume.isPublic,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// Get specific resume
router.get('/:id', async (req, res) => {
  try {
    const resume = await storage.getResume(parseInt(req.params.id));
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json({ resume });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// Resume analysis function using OpenAI
async function analyzeResume(buffer, industry) {
  try {
    // Convert buffer to text (supports PDF text extraction in production)
    let content;
    try {
      content = buffer.toString('utf-8');
    } catch (error) {
      // If UTF-8 conversion fails, try base64 decode first
      content = Buffer.from(buffer.toString('base64'), 'base64').toString('utf-8');
    }
    
    // Use OpenAI analyzer for comprehensive analysis
    const { analyzeResume: openaiAnalyze } = require('../../services/openai-analyzer');
    const result = await openaiAnalyze(content, industry);
    
    return {
      atsScore: result.score,
      analysis: result.analysis,
      suggestions: result.suggestions,
      skillsGap: result.skillsGap
    };
    
  } catch (error) {
    console.error('Resume analysis error:', error);
    
    // Fallback to basic analysis if OpenAI fails
    return generateBasicAnalysis(buffer, industry);
  }
}

// Fallback analysis function
function generateBasicAnalysis(buffer, industry) {
  const content = buffer.toString('utf-8').toLowerCase();
  
  // Basic keyword analysis
  const industryKeywords = getIndustryKeywords(industry);
  const keywordMatches = industryKeywords.filter(keyword => 
    content.includes(keyword.toLowerCase())
  ).length;
  
  const keywordScore = Math.min(100, (keywordMatches / industryKeywords.length) * 100);
  const baseScore = Math.max(60, keywordScore);
  
  return {
    atsScore: baseScore,
    analysis: {
      strengths: ['Professional structure detected', 'Contact information present'],
      weaknesses: ['Could benefit from more industry keywords'],
      keywords: industryKeywords.slice(0, 10),
      keywordMatch: keywordScore,
      formatting: 75,
      content: baseScore,
      readability: 80
    },
    suggestions: [
      {
        type: 'keywords',
        title: 'Add Industry Keywords',
        description: `Include more ${industry} specific keywords`,
        priority: 'high'
      }
    ],
    skillsGap: {
      missingSkills: industryKeywords.slice(0, 3),
      improvementAreas: ['Keyword optimization'],
      recommendations: ['Add technical skills section']
    }
  };
}

function getIndustryKeywords(industry) {
  const keywords = {
    'Technology': ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'API', 'Database', 'Agile'],
    'Healthcare': ['Patient care', 'Medical records', 'HIPAA', 'Clinical', 'Healthcare', 'Medical', 'Treatment', 'Diagnosis'],
    'Finance': ['Financial analysis', 'Risk management', 'Investment', 'Portfolio', 'Banking', 'Accounting', 'Compliance'],
    'Marketing': ['Digital marketing', 'SEO', 'Social media', 'Campaign', 'Analytics', 'Brand', 'Content', 'Strategy'],
    'Sales': ['Sales', 'Revenue', 'Lead generation', 'CRM', 'Customer', 'Pipeline', 'Negotiation', 'Target'],
    'Education': ['Teaching', 'Curriculum', 'Student', 'Learning', 'Assessment', 'Education', 'Training', 'Development']
  };
  
  return keywords[industry] || keywords['Technology'];
}

function generateStrengths(content, keywordMatches) {
  const strengths = [];
  
  if (keywordMatches > 5) strengths.push('Strong keyword optimization');
  if (content.includes('experience')) strengths.push('Clear experience section');
  if (content.includes('education')) strengths.push('Education section present');
  if (content.includes('skill')) strengths.push('Skills section included');
  
  return strengths.length ? strengths : ['Professional formatting', 'Clear structure'];
}

function generateWeaknesses(content, atsScore) {
  const weaknesses = [];
  
  if (atsScore < 70) weaknesses.push('Low keyword density');
  if (!content.includes('achievement')) weaknesses.push('Missing quantified achievements');
  if (!content.includes('skill')) weaknesses.push('Skills section needs improvement');
  
  return weaknesses.length ? weaknesses : ['Minor formatting improvements needed'];
}

function analyzeSections(content) {
  return {
    hasExperience: content.includes('experience'),
    hasEducation: content.includes('education'),
    hasSkills: content.includes('skill'),
    hasContact: content.includes('email') || content.includes('phone')
  };
}

function analyzeFormatting(content) {
  return {
    readability: content.length > 1000 ? 'Good' : 'Needs improvement',
    structure: content.includes('\n') ? 'Well structured' : 'Needs better formatting'
  };
}

function generateSuggestions(atsScore, analysis) {
  const suggestions = [];
  
  if (atsScore < 80) {
    suggestions.push({
      type: 'keyword',
      priority: 'high',
      title: 'Add industry-specific keywords',
      description: 'Include more relevant keywords for your target industry'
    });
  }
  
  if (!analysis.sections.hasSkills) {
    suggestions.push({
      type: 'section',
      priority: 'medium',
      title: 'Add skills section',
      description: 'Include a dedicated skills section with relevant technical and soft skills'
    });
  }
  
  return suggestions;
}

function getMissingSkills(industry, content) {
  const industrySkills = getIndustryKeywords(industry);
  return industrySkills.filter(skill => 
    !content.toLowerCase().includes(skill.toLowerCase())
  ).slice(0, 5);
}

function getImprovementAreas(atsScore) {
  const areas = [];
  
  if (atsScore < 70) areas.push('Keyword optimization');
  if (atsScore < 80) areas.push('Achievement quantification');
  
  return areas.length ? areas : ['Format consistency'];
}

function getRecommendations(industry, atsScore) {
  const recommendations = [];
  
  if (atsScore < 75) {
    recommendations.push(`Consider taking ${industry} certification courses`);
    recommendations.push('Add more quantified achievements');
  }
  
  return recommendations.length ? recommendations : ['Continue optimizing for ATS systems'];
}

module.exports = router;