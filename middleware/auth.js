const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('./security');

// Enhanced middleware to protect routes
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      logger.warn('Authentication attempt without token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Validate token format
    if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
      logger.warn('Invalid token format', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return res.status(401).json({ error: 'Invalid token format.' });
    }

    const secret = process.env.JWT_SECRET || ((process.env.NODE_ENV||'development')==='production' ? '' : 'dev-insecure-secret');
    if (!secret) {
      return res.status(500).json({ error: 'Server misconfiguration' });
    }
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      logger.warn('Token for non-existent user', {
        userId: decoded.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    if (!user.isActive) {
      logger.warn('Login attempt for deactivated account', {
        userId: user._id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ error: 'Account is deactivated.' });
    }

    // Check if account is locked
    if (user.isLocked) {
      logger.warn('Login attempt for locked account', {
        userId: user._id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(423).json({ 
        error: 'Account is temporarily locked due to multiple failed login attempts.',
        lockUntil: user.lockUntil
      });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      logger.warn('Token used after password change', {
        userId: user._id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ error: 'Password was changed recently. Please log in again.' });
    }

    // Validate session token if session management is enabled
    if (user.sessionTokens && user.sessionTokens.length > 0) {
      const sessionToken = user.sessionTokens.find(session => session.token === token);
      if (!sessionToken) {
        logger.warn('Invalid session token', {
          userId: user._id,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
      }
      
      // Update last used timestamp
      sessionToken.lastUsed = new Date();
      await user.save();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid JWT token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      logger.warn('Expired JWT token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return res.status(401).json({ error: 'Token expired.' });
    }
    logger.error('Authentication error', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    res.status(500).json({ error: 'Server error.' });
  }
};

// Enhanced login middleware with brute force protection
const loginAuth = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      logger.warn('Login attempt with non-existent email', {
        email: email.toLowerCase(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check if account is locked
    if (user.isLocked) {
      logger.warn('Login attempt for locked account', {
        userId: user._id,
        email: email.toLowerCase(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(423).json({ 
        error: 'Account is temporarily locked due to multiple failed login attempts.',
        lockUntil: user.lockUntil
      });
    }

    // Check if account is active
    if (!user.isActive) {
      logger.warn('Login attempt for deactivated account', {
        userId: user._id,
        email: email.toLowerCase(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ error: 'Account is deactivated.' });
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incLoginAttempts();
      
      logger.warn('Failed login attempt', {
        userId: user._id,
        email: email.toLowerCase(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        loginAttempts: user.loginAttempts + 1
      });
      
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Generate session token
    const sessionToken = require('crypto').randomBytes(32).toString('hex');
    const device = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress;
    
    await user.addSessionToken(sessionToken, device, ip, req.get('User-Agent'));

    req.user = user;
    req.sessionToken = sessionToken;
    next();
  } catch (error) {
    logger.error('Login authentication error', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(500).json({ error: 'Server error.' });
  }
};

// Middleware to check if user is an artist
const requireArtist = async (req, res, next) => {
  if (req.user.role !== 'artist') {
    logger.warn('Unauthorized artist access attempt', {
      userId: req.user._id,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    return res.status(403).json({ error: 'Access denied. Artist role required.' });
  }
  next();
};

// Middleware to check if user is a fan
const requireFan = async (req, res, next) => {
  if (req.user.role !== 'fan') {
    logger.warn('Unauthorized fan access attempt', {
      userId: req.user._id,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    return res.status(403).json({ error: 'Access denied. Fan role required.' });
  }
  next();
};

// Enhanced middleware to check if user owns the resource
const requireOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[resourceField] || req.body[resourceField];
    
    if (req.user._id.toString() !== resourceUserId && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      logger.warn('Unauthorized resource access attempt', {
        userId: req.user._id,
        resourceUserId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return res.status(403).json({ error: 'Access denied. You can only modify your own resources.' });
    }
    next();
  };
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const secret = process.env.JWT_SECRET || ((process.env.NODE_ENV||'development')==='production' ? '' : 'dev-insecure-secret');
      if (!secret) return next();
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive && !user.isLocked) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Middleware to check if user is an admin
const requireAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    logger.warn('Unauthorized admin access attempt', {
      userId: req.user._id,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

// Middleware to check if user is a superadmin
const requireSuperAdmin = async (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    logger.warn('Unauthorized superadmin access attempt', {
      userId: req.user._id,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    return res.status(403).json({ error: 'Access denied. Superadmin role required.' });
  }
  next();
};

// Middleware to check email verification
const requireEmailVerification = async (req, res, next) => {
  if (!req.user.isEmailVerified) {
    logger.warn('Access attempt without email verification', {
      userId: req.user._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    return res.status(403).json({ 
      error: 'Email verification required.',
      message: 'Please verify your email address before accessing this feature.'
    });
  }
  next();
};

// Middleware to check 2FA if enabled
const require2FA = async (req, res, next) => {
  if (req.user.twoFactorEnabled) {
    const twoFactorToken = req.header('X-2FA-Token');
    if (!twoFactorToken) {
      return res.status(403).json({ 
        error: 'Two-factor authentication required.',
        message: 'Please provide your 2FA token.'
      });
    }
    // Here you would validate the 2FA token
    // For now, we'll just check if it's provided
  }
  next();
};

// Middleware to log user activity
const logActivity = (action) => {
  return (req, res, next) => {
    logger.info('User activity', {
      userId: req.user._id,
      action,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    next();
  };
};

module.exports = {
  auth,
  loginAuth,
  requireArtist,
  requireFan,
  requireOwnership,
  optionalAuth,
  requireAdmin,
  requireSuperAdmin,
  requireEmailVerification,
  require2FA,
  logActivity
}; 