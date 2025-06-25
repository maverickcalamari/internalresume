const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', async (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: 'Not connected',
    timestamp: new Date().toISOString()
  });
});

// Basic auth endpoints for testing
app.post('/api/auth/register', async (req, res) => {
  res.status(501).json({ error: 'Database not connected. Please wait for full setup.' });
});

app.post('/api/auth/login', async (req, res) => {
  res.status(501).json({ error: 'Database not connected. Please wait for full setup.' });
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
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple Resume Platform Server running on port ${PORT}`);
  console.log(`📧 Email notifications configured with Resend`);
  console.log(`⚠️  Database connection pending`);
});