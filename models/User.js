const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters'],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z\s]+$/.test(v);
      },
      message: 'Name can only contain letters and spaces'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [12, 'Password must be at least 12 characters'],
    validate: {
      validator: function(v) {
        // Only validate if password is being modified and is not already hashed
        if (!this.isModified('password')) return true;
        if (v.startsWith('$2a$') || v.startsWith('$2b$') || v.startsWith('$2y$')) return true; // Skip validation for bcrypt hashes
        // Require at least one uppercase, lowercase, number, and special character across the entire string
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/.test(v);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  passwordHistory: [{
    password: String,
    changedAt: { type: Date, default: Date.now }
  }],
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['artist', 'fan', 'admin', 'superadmin'],
    default: 'fan'
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^https?:\/\//.test(v) || v.startsWith('/uploads/');
      },
      message: 'Avatar must be a valid URL or local uploaded path'
    }
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
    default: '',
    validate: {
      validator: function(v) {
        // Prevent XSS and script injection
        return !/<script|javascript:|vbscript:|onload=|onerror=/i.test(v);
      },
      message: 'Bio contains invalid content'
    }
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  totalTips: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // Security fields
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  twoFactorSecret: {
    type: String
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  backupCodes: [{
    code: String,
    used: { type: Boolean, default: false }
  }],
  sessionTokens: [{
    token: String,
    device: String,
    ip: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now },
    lastUsed: { type: Date, default: Date.now }
  }],
  securityQuestions: [{
    question: String,
    answer: String
  }],
  ipWhitelist: [String],
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  accountCreatedAt: {
    type: Date,
    default: Date.now
  },
  // Privacy settings
  profileVisibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  },
  allowMessages: {
    type: Boolean,
    default: true
  },
  showOnlineStatus: {
    type: Boolean,
    default: true
  },
  // Additional profile fields
  location: {
    type: String,
    maxlength: [100, 'Location cannot be more than 100 characters'],
    default: ''
  },
  website: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Website must be a valid URL'
    },
    default: ''
  },
  socialLinks: {
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    facebook: { type: String, default: '' },
    youtube: { type: String, default: '' },
    spotify: { type: String, default: '' },
    soundcloud: { type: String, default: '' },
    appleMusic: { type: String, default: '' },
    deezer: { type: String, default: '' },
    tidal: { type: String, default: '' },
    bandcamp: { type: String, default: '' },
    audiomack: { type: String, default: '' },
    youtubeMusic: { type: String, default: '' },
    linktree: { type: String, default: '' }
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' }
  },
  // Profile completion tracking
  profileCompleted: {
    type: Boolean,
    default: false
  },
  profileCompletionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Indexes for better query performance and security
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ followers: 1 });
userSchema.index({ 'sessionTokens.token': 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ lockUntil: 1 });

// Add performance indexes
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ role: 1, isActive: 1, followers: 1 });
userSchema.index({ role: 1, isActive: 1, createdAt: -1 });

// Virtual for follower count
userSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

// Virtual for following count
userSchema.virtual('followingCount').get(function() {
  return this.following.length;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Enhanced password hashing with higher salt rounds
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Check password history to prevent reuse
    if (this.passwordHistory.length > 0) {
      const isPasswordReused = await Promise.all(
        this.passwordHistory.slice(-5).map(async (historyItem) => {
          return await bcrypt.compare(this.password, historyItem.password);
        })
      );
      
      if (isPasswordReused.some(reused => reused)) {
        throw new Error('Password cannot be reused. Please choose a different password.');
      }
    }

    const salt = await bcrypt.genSalt(16); // Increased from 12 to 16
    const hashedPassword = await bcrypt.hash(this.password, salt);
    
    // Store password in history (keep last 5)
    this.passwordHistory.push({
      password: hashedPassword,
      changedAt: new Date()
    });
    
    if (this.passwordHistory.length > 5) {
      this.passwordHistory = this.passwordHistory.slice(-5);
    }
    
    this.password = hashedPassword;
    this.passwordChangedAt = Date.now();
    this.lastPasswordChange = Date.now();
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Method to create email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: Date.now() }
  });
};

// Method to add session token
userSchema.methods.addSessionToken = function(token, device, ip, userAgent) {
  // Remove old sessions if more than 10
  if (this.sessionTokens.length >= 10) {
    this.sessionTokens = this.sessionTokens.slice(-9);
  }
  
  this.sessionTokens.push({
    token,
    device,
    ip,
    userAgent,
    createdAt: new Date(),
    lastUsed: new Date()
  });
  
  return this.save();
};

// Method to remove session token
userSchema.methods.removeSessionToken = function(token) {
  this.sessionTokens = this.sessionTokens.filter(session => session.token !== token);
  return this.save();
};

// Method to get public profile (without sensitive data)
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordHistory;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  delete userObject.twoFactorSecret;
  delete userObject.backupCodes;
  delete userObject.sessionTokens;
  delete userObject.securityQuestions;
  delete userObject.ipWhitelist;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  delete userObject.__v;
  return userObject;
};

// Method to get secure profile (for admin purposes)
userSchema.methods.toSecureJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.twoFactorSecret;
  delete userObject.backupCodes;
  delete userObject.securityQuestions;
  return userObject;
};

// Method to calculate profile completion percentage
userSchema.methods.calculateProfileCompletion = function() {
  // Base fields for all users
  const baseFields = [
    { field: 'name', weight: 15 },
    { field: 'bio', weight: 10 },
    { field: 'avatar', weight: 10 },
    { field: 'location', weight: 5 },
    { field: 'website', weight: 5 },
    { field: 'preferences.theme', weight: 2 },
    { field: 'preferences.language', weight: 2 },
    { field: 'preferences.timezone', weight: 2 }
  ];

  // Extra fields that apply only to artists
  const artistOnlyFields = [
    { field: 'socialLinks.instagram', weight: 3 },
    { field: 'socialLinks.twitter', weight: 3 },
    { field: 'socialLinks.facebook', weight: 3 },
    { field: 'socialLinks.youtube', weight: 3 },
    { field: 'socialLinks.spotify', weight: 3 },
    { field: 'socialLinks.soundcloud', weight: 3 }
  ];

  const fields = this.role === 'artist' ? [...baseFields, ...artistOnlyFields] : baseFields;

  let completion = 0;
  let totalWeight = 0;

  fields.forEach(({ field, weight }) => {
    totalWeight += weight;
    const value = field.split('.').reduce((obj, key) => obj && obj[key], this);
    if (value && (typeof value === 'string' ? value.trim() !== '' : true)) {
      completion += weight;
    }
  });

  const percentage = Math.round((completion / totalWeight) * 100);
  this.profileCompletionPercentage = percentage;
  this.profileCompleted = percentage >= 80;
  return percentage;
};

module.exports = mongoose.model('User', userSchema); 