const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Resolve JWT secret with safety
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if ((process.env.NODE_ENV || 'development') === 'production') {
      throw new Error('JWT_SECRET is not set');
    }
    // Generate a random secret for development
    const crypto = require('crypto');
    return crypto.randomBytes(64).toString('hex');
  }
  return secret;
}

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 12 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/)
    .withMessage('Password must be 12+ chars with upper, lower, number, and special char'),
  body('role')
    .isIn(['artist', 'fan'])
    .withMessage('Role must be either artist or fan')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userData = user.toPublicJSON();

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('role')
    .optional()
    .isIn(['artist', 'fan'])
    .withMessage('Invalid role')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role } = req.body;

    // Find user by email
    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Check password (guard against unexpected errors)
    let isMatch = false;
    try {
      isMatch = await user.comparePassword(password);
    } catch (e) {
      console.error('Login error: comparePassword failed', e);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Enforce role-based login when provided
    if (role && user.role !== role) {
      return res.status(403).json({ error: `This account is a ${user.role}. Please use the correct login.` });
    }

    // Update last login (avoid triggering pre-save hooks)
    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userData = user.toPublicJSON();

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error (unexpected):', error?.message || error, error?.stack);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // Set a timeout for this operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 5000);
    });

    // Only get essential user data without expensive populate operations
    const userPromise = User.findById(req.user._id)
      .select('name email role avatar bio genre isVerified walletBalance totalEarnings followers following createdAt')
      .lean();

    const user = await Promise.race([userPromise, timeoutPromise]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Transform the data to match expected format
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      genre: user.genre,
      isVerified: user.isVerified,
      walletBalance: user.walletBalance || 0,
      totalEarnings: user.totalEarnings || 0,
      followers: user.followers || [],
      following: user.following || [],
      createdAt: user.createdAt
    };

    res.json({
      user: userData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    if (error.message === 'Database query timeout') {
      res.status(408).json({ error: 'Request timeout - please try again' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot be more than 500 characters'),
  body('avatar')
    .optional()
    .custom((value) => {
      if (!value) return true;
      // Allow absolute URLs and local uploaded paths
      return /^https?:\/\//i.test(value) || value.startsWith('/uploads/');
    })
    .withMessage('Avatar must be a valid URL or local uploaded path')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, bio, avatar } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (avatar) updateFields.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('name email role avatar bio genre isVerified walletBalance totalEarnings followers following createdAt')
     .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Transform the data to match expected format
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      genre: user.genre,
      isVerified: user.isVerified,
      walletBalance: user.walletBalance || 0,
      totalEarnings: user.totalEarnings || 0,
      followers: user.followers || [],
      following: user.following || [],
      createdAt: user.createdAt
    };

    res.json({
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 12 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/)
    .withMessage('New password must be 12+ chars with upper, lower, number, and special char')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 