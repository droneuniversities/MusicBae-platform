const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cron = require('node-cron');
const crypto = require('crypto');
require('dotenv').config();

// Import security configurations
const {
  securityConfig,
  helmetConfig,
  corsConfig,
  sanitizeInput,
  addRequestId,
  securityHeaders,
  ipFilter,
  requestLogger,
  errorLogger,
  sessionSecurity,
  uploadSecurity,
  jwtSecurity,
  querySecurity,
  logger
} = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 5001;
const securityMonitor = require('./middleware/securityMonitor');
const { auth, requireSuperAdmin } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const artistRoutes = require('./routes/artists');
const songRoutes = require('./routes/songs');
const tipRoutes = require('./routes/tips');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Enhanced security middleware
app.use(helmet(helmetConfig));
app.use(compression());
app.use(hpp()); // Protect against HTTP Parameter Pollution
app.use(mongoSanitize()); // Prevent NoSQL injection

// Request ID and logging
app.use(addRequestId);
app.use(requestLogger);

// Security headers
app.use(securityHeaders);

// IP filtering
app.use(ipFilter);

// CORS configuration
app.use(cors(corsConfig));

// Stripe webhook requires raw body to validate signature
app.use('/api/users/wallet/webhook/stripe', express.raw({ type: 'application/json' }));
// Stripe webhook for tips
app.use('/api/tips/webhook/stripe', express.raw({ type: 'application/json' }));

// Session configuration with MongoDB store
const derivedSessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET || '';
if ((process.env.NODE_ENV || 'development') === 'production' && (!derivedSessionSecret || derivedSessionSecret.length < 32)) {
  throw new Error('SESSION_SECRET must be set to a strong value in production');
}
app.use(session({
  secret: derivedSessionSecret || crypto.randomBytes(48).toString('hex'),
  name: 'musicbae.sid',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/musicbae',
    ttl: 24 * 60 * 60, // 1 day
    autoRemove: 'native'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: 'strict'
  }
}));

// Session security
app.use(sessionSecurity);

// Rate limiting and speed limiting (API only to avoid throttling static assets/Spa HTML)
app.use('/api', securityConfig.generalLimiter);
app.use('/api', securityConfig.speedLimiter);

// Body parsing middleware with enhanced security
// JSON parser (note: Stripe webhook uses raw body on its own route)
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    if (!buf || buf.length === 0) return; // allow empty bodies
    try {
      JSON.parse(buf);
    } catch (e) {
      logger.warn('Invalid JSON payload', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 100
}));

// Input sanitization
app.use(sanitizeInput);

// Query security
app.use(querySecurity);

// JWT security
app.use(jwtSecurity);

// File upload security
app.use(uploadSecurity);

// Static file serving with security headers
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// Serve static files for frontend (restrict to safe dirs)
const staticCacheHeaders = (res, filePath) => {
  if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
    res.setHeader('Cache-Control', 'no-store');
  } else if (/(png|jpg|jpeg|webp|svg|woff2?)$/i.test(filePath)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
};
app.use('/assets', express.static('assets', { setHeaders: staticCacheHeaders }));
app.use('/styles', express.static('styles', { setHeaders: staticCacheHeaders }));
app.use('/js', express.static('js', { setHeaders: staticCacheHeaders }));
app.use('/logo', express.static('logo', { setHeaders: staticCacheHeaders }));

// API routes with specific rate limiting
app.use('/api/auth', securityConfig.authLimiter, authRoutes);
app.use('/api/artists', securityConfig.apiLimiter, artistRoutes);
app.use('/api/songs', securityConfig.apiLimiter, songRoutes);
app.use('/api/tips', securityConfig.apiLimiter, tipRoutes);
app.use('/api/users', securityConfig.apiLimiter, userRoutes);
app.use('/api/upload', securityConfig.uploadLimiter, uploadRoutes);

// Health check endpoint with rate limiting
app.get('/api/health', securityConfig.generalLimiter, (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MusicBae API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Security status endpoint (non-sensitive summary)
app.get('/api/security/status', (req, res) => {
  res.json({
    status: 'secure',
    features: {
      rateLimiting: true,
      inputSanitization: true,
      sqlInjectionProtection: true,
      xssProtection: true,
      csrfProtection: true,
      sessionSecurity: true,
      fileUploadSecurity: true,
      logging: true
    },
    monitor: securityMonitor.getSecuritySummary(),
    timestamp: new Date().toISOString()
  });
});

// Superadmin: export detailed security report
app.get('/api/security/report', auth, requireSuperAdmin, (req, res) => {
  try {
    const report = securityMonitor.exportSecurityReport();
    res.json(report);
  } catch (e) {
    res.status(500).json({ error: 'Unable to build security report' });
  }
});

// Error handling middleware
app.use(errorLogger);
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    requestId: req.id
  });
});

// Serve index.html for SPA frontend routes (clean URLs)
// Any non-API, non-asset route should fall back to index.html
app.get(/^\/(?!api|uploads|assets|js|styles|logo|favicon\.ico|testsprite_tests).*/, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile('index.html', { root: '.' });
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn('404 - Route not found', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method
  });
  res.status(404).json({ 
    error: 'Route not found',
    requestId: req.id
  });
});

// Database connection with enhanced security
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/musicbae', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
.then(() => {
  logger.info('Connected to MongoDB');
  
  // Start scheduled security tasks
  startSecurityTasks();
  
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})
.catch((err) => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});

// Security maintenance tasks
function startSecurityTasks() {
  // Clean up expired sessions daily
  cron.schedule('0 2 * * *', async () => {
    try {
      const User = require('./models/User');
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      await User.updateMany(
        { 'sessionTokens.lastUsed': { $lt: cutoff } },
        { $pull: { sessionTokens: { lastUsed: { $lt: cutoff } } } }
      );
      
      logger.info('Cleaned up expired sessions');
    } catch (error) {
      logger.error('Error cleaning up sessions:', error);
    }
  });

  // Clean up expired password reset tokens hourly
  cron.schedule('0 * * * *', async () => {
    try {
      const User = require('./models/User');
      const cutoff = new Date();
      
      await User.updateMany(
        { passwordResetExpires: { $lt: cutoff } },
        { $unset: { passwordResetToken: 1, passwordResetExpires: 1 } }
      );
      
      logger.info('Cleaned up expired password reset tokens');
    } catch (error) {
      logger.error('Error cleaning up password reset tokens:', error);
    }
  });

  // Clean up expired email verification tokens daily
  cron.schedule('0 3 * * *', async () => {
    try {
      const User = require('./models/User');
      const cutoff = new Date();
      
      await User.updateMany(
        { emailVerificationExpires: { $lt: cutoff } },
        { $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 } }
      );
      
      logger.info('Cleaned up expired email verification tokens');
    } catch (error) {
      logger.error('Error cleaning up email verification tokens:', error);
    }
  });

  // Log security statistics weekly
  cron.schedule('0 4 * * 0', async () => {
    try {
      const User = require('./models/User');
      
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
      const lockedAccounts = await User.countDocuments({ lockUntil: { $gt: new Date() } });
      
      logger.info('Security statistics', {
        totalUsers,
        activeUsers,
        verifiedUsers,
        lockedAccounts,
        verificationRate: (verifiedUsers / totalUsers * 100).toFixed(2) + '%'
      });
    } catch (error) {
      logger.error('Error generating security statistics:', error);
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app; 