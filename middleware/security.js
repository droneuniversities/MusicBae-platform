const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const crypto = require('crypto');
const winston = require('winston');

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'musicbae-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Rate limiting configurations
const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const RATE_LIMIT_WINDOW_MS = toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const RATE_LIMIT_MAX_REQUESTS = toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 100);
const AUTH_RATE_LIMIT_MAX = toInt(process.env.AUTH_RATE_LIMIT_MAX, 20);
const LOGIN_RATE_LIMIT_MAX = toInt(process.env.LOGIN_RATE_LIMIT_MAX, 10);
const UPLOAD_RATE_LIMIT_MAX = toInt(process.env.UPLOAD_RATE_LIMIT_MAX, 10);

// In development, optionally relax rate limits for easier testing
if (process.env.NODE_ENV === 'development') {
  if (process.env.RELAX_RATE_LIMITS === 'true') {
    // Bump limits significantly when explicitly requested
    if (!process.env.AUTH_RATE_LIMIT_MAX) process.env.AUTH_RATE_LIMIT_MAX = '1000';
    if (!process.env.LOGIN_RATE_LIMIT_MAX) process.env.LOGIN_RATE_LIMIT_MAX = '1000';
  }
}

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting only for OPTIONS requests or when explicitly relaxed
    skip: (req, res) => {
      if (req.method === 'OPTIONS') return true;
      if (process.env.RELAX_RATE_LIMITS === 'true') return true;
      return false;
    },
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: message || 'Please wait a moment before trying again',
        retryAfter: Math.ceil(windowMs / 1000),
        retryAfterMinutes: Math.ceil(windowMs / (1000 * 60))
      });
    }
  });
};

// Speed limiting
const createSpeedLimit = (windowMs, delayAfter, delayMs) => {
  return slowDown({
    windowMs,
    delayAfter,
    delayMs,
    handler: (req, res) => {
      logger.info(`Speed limit triggered for IP: ${req.ip}`);
    }
  });
};

// Security middleware configurations
const securityConfig = {
  // General rate limiting
  generalLimiter: createRateLimit(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, 'Too many requests from this IP'),
  
  // Auth rate limiting (more strict)
  authLimiter: createRateLimit(RATE_LIMIT_WINDOW_MS, toInt(process.env.AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_MAX), 'Too many authentication attempts'),
  
  // Login rate limiting (very strict)
  loginLimiter: createRateLimit(RATE_LIMIT_WINDOW_MS, toInt(process.env.LOGIN_RATE_LIMIT_MAX, LOGIN_RATE_LIMIT_MAX), 'Too many login attempts'),
  
  // Password reset rate limiting
  passwordResetLimiter: createRateLimit(60 * 60 * 1000, 3, 'Too many password reset attempts'),
  
  // File upload rate limiting
  uploadLimiter: createRateLimit(60 * 60 * 1000, toInt(process.env.UPLOAD_RATE_LIMIT_MAX, UPLOAD_RATE_LIMIT_MAX), 'Too many file uploads'),
  
  // API rate limiting
  apiLimiter: createRateLimit(RATE_LIMIT_WINDOW_MS, 1000, 'API rate limit exceeded'),
  
  // Speed limiting
  speedLimiter: createSpeedLimit(RATE_LIMIT_WINDOW_MS, 50, 500)
};

// Enhanced Helmet configuration
const buildHelmetConfig = () => {
  const isProd = (process.env.NODE_ENV || 'development') === 'production';
  const scriptSrc = ["'self'", "https://unpkg.com", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net", "https://cdn.plyr.io"];
  // Relaxed only in non-production
  const styleSrc = ["'self'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com", "https://cdn.plyr.io"];
  if (!isProd) {
    scriptSrc.push("'unsafe-eval'", "'unsafe-inline'");
    styleSrc.push("'unsafe-inline'");
  }

  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc,
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc,
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.unsplash.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  };
};

const helmetConfig = buildHelmetConfig();

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+=/gi, '');
      }
    });
  }

  // Sanitize body parameters
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+=/gi, '');
      }
    });
  }

  next();
};

// Request ID middleware
const addRequestId = (req, res, next) => {
  req.id = crypto.randomBytes(16).toString('hex');
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// IP filtering middleware
const ipFilter = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const blockedIPs = process.env.BLOCKED_IPS ? process.env.BLOCKED_IPS.split(',') : [];
  
  if (blockedIPs.includes(clientIP)) {
    logger.warn(`Blocked IP attempted access: ${clientIP}`);
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.id
    };
    
    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id
  });
  
  next(err);
};

// Session security middleware
// Important: Only regenerate session during sensitive auth flows to avoid
// heavy store operations on every static/API request.
const sessionSecurity = (req, res, next) => {
  try {
    const isAuthMutation = req.method === 'POST' && (/^\/api\/auth\/(login|register|change-password)$/).test(req.path);
    if (isAuthMutation && req.session && typeof req.session.regenerate === 'function') {
      return req.session.regenerate((err) => {
        if (err) {
          logger.error('Session regeneration error', { error: err.message });
        }
        next();
      });
    }
  } catch (e) {
    logger.warn('Session security guard error', { error: e?.message });
  }
  next();
};

// File upload security middleware
const uploadSecurity = (req, res, next) => {
  // Check file type
  if (req.file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav', 'audio/flac'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    // Check file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: 'File too large' });
    }
    
    // Generate secure filename
    const fileExtension = req.file.originalname.split('.').pop();
    const secureFilename = crypto.randomBytes(32).toString('hex') + '.' + fileExtension;
    req.file.filename = secureFilename;
  }
  
  next();
};

// JWT token security middleware
const jwtSecurity = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    // Check token format
    if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
  }
  
  next();
};

// Database query security middleware
const querySecurity = (req, res, next) => {
  // Prevent NoSQL injection
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value.replace(/\$/, '');
    }
    return value;
  };
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      req.query[key] = sanitizeValue(req.query[key]);
    });
  }
  
  // Sanitize body parameters
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      req.body[key] = sanitizeValue(req.body[key]);
    });
  }
  
  next();
};

// CORS security configuration
const corsConfig = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5001',
      'http://localhost:8000',
      'https://musicbae.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, curl, same-origin fetch)
    if (!origin) return callback(null, true);

    // Normalize to avoid trailing slash mismatches
    const normalize = (s) => (typeof s === 'string' ? s.replace(/\/+$/, '') : s);
    const normalizedOrigin = normalize(origin);
    const normalizedFrontend = normalize(process.env.FRONTEND_URL || '');

    // Development convenience: allow any localhost/127.0.0.1 port
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      try {
        const u = new URL(origin);
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch (_) {}
    }

    if (allowedOrigins.includes(normalizedOrigin) || (normalizedFrontend && normalizedOrigin === normalizedFrontend)) {
      return callback(null, true);
    }

    logger.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400 // 24 hours
};

module.exports = {
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
}; 