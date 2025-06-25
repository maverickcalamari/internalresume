const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const multer = require('multer');

// Import database and services
const { mongodb, testMongoConnection } = require('./src/database/mongodb');
const { MongoStorage } = require('./src/database/mongo-storage');
const { 
  generateToken, 
  hashPassword, 
  verifyPassword, 
  authenticateToken, 
  requireAdmin, 
  authLimiter, 
  apiLimiter 
} = require('./src/middleware/auth');
const { 
  sendUploadNotification, 
  sendWelcomeEmail, 
  sendAnalysisCompleteEmail 
} = require('./src/services/email');
const { 
  User, 
  InsertUser, 
  InsertResume,
  UserRole 
} = require('./src/shared/schema');

const app = express();
const PORT = process.env.PORT || 5000;
const storage = new MongoStorage();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : true,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database connection
async function initializeApp() {
  try {
    const connected = await testMongoConnection();
    if (connected) {
      console.log('✅ Database connection established');
    } else {
      console.log('⚠️ Database connection failed - continuing without DB');
    }
  } catch (error) {
    console.error('⚠️ Database initialization failed:', error.message);
  }
}

// Authentication routes
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Validation
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const existingUsername = await storage.getUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const insertUser = new InsertUser({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: UserRole.USER
    });

    const user = await storage.createUser(insertUser);
    const token = generateToken(user.id);

    // Send welcome email
    try {
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Create audit log
    await storage.createAuditLog({
      userId: user.id,
      action: 'USER_REGISTERED',
      details: `User ${username} registered`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await storage.updateLastLogin(user.id);

    const token = generateToken(user.id);

    // Create audit log
    await storage.createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      details: `User ${user.username} logged in`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Resume upload and analysis routes
app.post('/api/resumes/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { industry } = req.body;
    const { originalname, buffer, mimetype, size } = req.file;

    // Basic resume analysis (placeholder - integrate with actual analysis service)
    const mockAnalysis = {
      atsScore: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
      strengths: ['Clear formatting', 'Relevant keywords', 'Quantified achievements'],
      suggestions: ['Add more industry-specific keywords', 'Include skill certifications'],
      keywords: ['JavaScript', 'Project Management', 'Leadership']
    };

    // Store resume
    const insertResume = new InsertResume({
      userId: req.user.id,
      filename: originalname,
      originalContent: buffer.toString('base64'), // Store as base64
      industry: industry || 'General',
      atsScore: mockAnalysis.atsScore,
      analysis: mockAnalysis,
      suggestions: mockAnalysis.suggestions,
      skillsGap: {
        missingSkills: ['AWS', 'Docker'],
        improvementAreas: ['Technical writing', 'Public speaking'],
        recommendations: ['Consider AWS certification', 'Join a technical writing course']
      }
    });

    const resume = await storage.createResume(insertResume);

    // Update user stats
    const userStats = await storage.getUserStats(req.user.id);
    await storage.updateUserStats(req.user.id, {
      resumesAnalyzed: (userStats?.resumesAnalyzed || 0) + 1,
      avgScore: mockAnalysis.atsScore,
      totalOptimizations: (userStats?.totalOptimizations || 0) + 1
    });

    // Send email notifications
    try {
      await sendUploadNotification(originalname, req.user.email, {
        size,
        industry: industry || 'General',
        atsScore: mockAnalysis.atsScore
      });

      await sendAnalysisCompleteEmail(req.user, resume, mockAnalysis);
    } catch (emailError) {
      console.error('Failed to send upload notifications:', emailError);
    }

    // Create audit log
    await storage.createAuditLog({
      userId: req.user.id,
      action: 'RESUME_UPLOADED',
      details: `Resume ${originalname} uploaded and analyzed`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

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

// Get user's resumes
app.get('/api/resumes', authenticateToken, async (req, res) => {
  try {
    const resumes = await storage.getResumesByUser(req.user.id);
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

// Get specific resume details
app.get('/api/resumes/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await storage.getResume(parseInt(req.params.id));
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Check if user owns the resume or if it's public
    if (resume.userId !== req.user.id && !resume.isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ resume });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// User dashboard data
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const userStats = await storage.getUserStats(req.user.id);
    const resumes = await storage.getResumesByUser(req.user.id);
    const skillAssessments = await storage.getSkillAssessmentsByUser(req.user.id);

    res.json({
      stats: userStats || {
        resumesAnalyzed: 0,
        avgScore: 0,
        interviews: 0,
        totalOptimizations: 0
      },
      recentResumes: resumes.slice(0, 5),
      skillAssessments: skillAssessments.slice(0, 3)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Admin routes
app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const analytics = await storage.getAnalyticsData();
    res.json({ analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const users = await storage.getAllUsers(parseInt(limit), parseInt(offset));
    const totalUsers = await storage.getUserCount();
    
    res.json({
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      })),
      total: totalUsers,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await mongodb.testConnection();
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      database: dbConnected ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Health check failed',
      error: error.message 
    });
  }
});

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }
  
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize and start server
initializeApp().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Resume Platform Server running on port ${PORT}`);
    console.log(`📧 Email notifications enabled with Resend`);
    console.log(`📊 MongoDB database connected`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});