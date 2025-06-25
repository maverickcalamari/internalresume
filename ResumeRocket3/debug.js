// Debug script to test individual components
const { mongodb, testMongoConnection } = require('./src/database/mongodb');

async function debugDatabase() {
  console.log('Testing MongoDB connection...');
  try {
    const connected = await testMongoConnection();
    console.log('Database connection result:', connected);
    
    if (connected) {
      console.log('✅ Database connected successfully');
      await mongodb.disconnect();
    } else {
      console.log('❌ Database connection failed');
    }
  } catch (error) {
    console.error('Database error:', error.message);
  }
}

debugDatabase();