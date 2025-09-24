const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://musicbae_DB:uQzcwVf8qIMPvACl@musicbaedb.7dycpbq.mongodb.net/musicbae?retryWrites=true&w=majority&appName=MusicBaeDB';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  checkUsers();
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');

    const users = await User.find({}).select('name email role isActive');
    
    console.log(`📊 Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log('');
    });

    // Test password for luna
    const luna = await User.findOne({ email: 'luna@musicbae.com' });
    if (luna) {
      console.log('🧪 Testing password for Luna...');
      const isValid = await luna.comparePassword('Password123!');
      console.log(`Password match: ${isValid}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking users:', error);
    process.exit(1);
  }
}
