const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Updated credentials
const updatedCredentials = [
  {
    email: 'luna@musicbae.com',
    password: 'Password123!',
    role: 'artist',
    name: 'Luna Echo'
  },
  {
    email: 'fan1@musicbae.com', 
    password: 'Password123!',
    role: 'fan',
    name: 'Music Lover'
  },
  {
    email: 'superadmin@musicbae.com',
    password: 'SuperAdmin2024!',
    role: 'superadmin',
    name: 'Super Admin'
  }
];

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://musicbae_DB:uQzcwVf8qIMPvACl@musicbaedb.7dycpbq.mongodb.net/musicbae?retryWrites=true&w=majority&appName=MusicBaeDB';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  updateCredentials();
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function updateCredentials() {
  try {
    console.log('🔄 Starting credential updates...');

    for (const cred of updatedCredentials) {
      console.log(`\n📝 Updating ${cred.role}: ${cred.email}`);
      
      // Find existing user
      const existingUser = await User.findOne({ email: cred.email });
      
      if (existingUser) {
        // Update existing user - clear password history to allow reuse
        existingUser.passwordHistory = [];
        existingUser.password = cred.password; // Will be hashed by pre-save middleware
        existingUser.name = cred.name;
        existingUser.role = cred.role;
        existingUser.isActive = true;
        existingUser.isEmailVerified = true;
        
        await existingUser.save();
        console.log(`✅ Updated existing ${cred.role}: ${cred.email}`);
      } else {
        // Create new user if doesn't exist
        const newUser = new User({
          name: cred.name,
          email: cred.email,
          password: cred.password, // Will be hashed by pre-save middleware
          role: cred.role,
          isActive: true,
          isEmailVerified: true,
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          bio: cred.role === 'artist' ? 'Alternative indie artist pushing boundaries with ethereal vocals and experimental soundscapes.' : 
               cred.role === 'superadmin' ? 'The all-powerful super administrator of MusicBae.' :
               'Passionate music enthusiast always looking for new sounds.'
        });
        
        await newUser.save();
        console.log(`✅ Created new ${cred.role}: ${cred.email}`);
      }
    }

    console.log('\n🎉 All credentials updated successfully!');
    console.log('\n📋 Updated Login Credentials:');
    console.log('👨‍🎤 Artist: luna@musicbae.com / Password123!');
    console.log('👤 Fan: fan1@musicbae.com / Password123!');
    console.log('👑 Admin: superadmin@musicbae.com / SuperAdmin2024!');
    
    console.log('\n🔗 Database Connection Status:');
    console.log(`✅ Connected to: ${MONGODB_URI.split('@')[1]?.split('/')[0] || 'MongoDB Atlas'}`);
    console.log('✅ All users are active and email verified');
    console.log('✅ Passwords are securely hashed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating credentials:', error);
    process.exit(1);
  }
}
