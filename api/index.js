const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { put } = require('@vercel/blob');

// Import models
const User = require('../models/User');
const Song = require('../models/Song');
const Tip = require('../models/Tip');

const app = express();

// Basic middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://musicbae_DB:uQzcwVf8qIMPvACl@musicbaedb.7dycpbq.mongodb.net/musicbae?retryWrites=true&w=majority&appName=MusicBaeDB';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Simple auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { name }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'fan'
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user profile
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let stats = { totalTips: 0, totalSongs: 0, totalPlays: 0, walletBalance: 0 };
    
    if (user.role === 'artist') {
      const songs = await Song.find({ artist: user._id });
      const tips = await Tip.find({ artist: user._id });
      
      stats.totalSongs = songs.length;
      stats.totalPlays = songs.reduce((sum, song) => sum + (song.plays || 0), 0);
      stats.totalTips = tips.length;
      stats.totalTipAmount = tips.reduce((sum, tip) => sum + (tip.amount || 0), 0);
      stats.walletBalance = user.walletBalance || 0;
    } else if (user.role === 'fan') {
      const tips = await Tip.find({ fan: user._id });
      
      stats.totalTips = tips.length;
      stats.walletBalance = user.walletBalance || 0;
      stats.libraryCount = 0; // Simplified for now
      stats.totalArtists = user.following ? user.following.length : 0;
    }
    
    res.json({ stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Artists routes
app.get('/api/artists', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { role: 'artist', isActive: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    const artists = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.json({
      artists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get individual artist
app.get('/api/artists/:name', async (req, res) => {
  try {
    // Convert URL slug to search pattern (e.g., "luna-echo" -> "luna echo")
    const searchName = req.params.name.replace(/-/g, ' ').toLowerCase();
    
    // Search for artist with flexible matching
    const artist = await User.findOne({ 
      $or: [
        { name: req.params.name }, // Exact match
        { name: { $regex: new RegExp(searchName, 'i') } }, // Case-insensitive partial match
        { name: { $regex: new RegExp(req.params.name.replace(/-/g, ' '), 'i') } } // Handle spaces
      ],
      role: 'artist',
      isActive: true 
    }).select('-password');
    
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }
    
    // Get artist's songs
    const songs = await Song.find({ artist: artist._id, isPublic: true })
      .sort({ createdAt: -1 });
    
    res.json({ artist, songs });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Songs routes
app.get('/api/songs', async (req, res) => {
  try {
    const { page = 1, limit = 10, artist } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { isPublic: true };
    if (artist) {
      query.artist = artist;
    }
    
    const songs = await Song.find(query)
      .populate('artist', 'name avatar')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Song.countDocuments(query);
    
    res.json({
      songs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Song creation endpoint
app.post('/api/songs', auth, async (req, res) => {
  try {
    const { title, genre, description, duration, previewSong, completeSongMp3, completeSongWav, cover } = req.body;
    
    // Validate required fields
    if (!title || !genre) {
      return res.status(400).json({ error: 'Title and genre are required' });
    }
    
    // Create song
    const song = new Song({
      title,
      genre,
      description: description || '',
      duration: duration || 0,
      previewSong: previewSong || '',
      completeSongMp3: completeSongMp3 || '',
      completeSongWav: completeSongWav || '',
      cover: cover || '',
      artist: req.user._id,
      isPublic: false // Default to private until approved
    });
    
    await song.save();
    
    res.status(201).json({
      message: 'Song created successfully',
      song
    });
  } catch (error) {
    console.error('Song creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get artist's songs
app.get('/api/songs/my', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const songs = await Song.find({ artist: req.user._id })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Song.countDocuments({ artist: req.user._id });
    
    res.json({
      songs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get artist's songs by ID (for artist dashboard)
app.get('/api/artists/:id/songs', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const songs = await Song.find({ artist: id, isPublic: true })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Song.countDocuments({ artist: id, isPublic: true });
    
    res.json({
      songs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Tips routes
app.get('/api/tips', async (req, res) => {
  try {
    const { page = 1, limit = 10, artist } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (artist) {
      query.artist = artist;
    }
    
    const tips = await Tip.find(query)
      .populate('fan', 'name avatar')
      .populate('artist', 'name avatar')
      .populate('song', 'title')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Tip.countDocuments(query);
    
    res.json({
      tips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create tip
app.post('/api/tips', auth, async (req, res) => {
  try {
    const { artistId, songId, amount, message } = req.body;
    
    if (!artistId || !amount) {
      return res.status(400).json({ error: 'Artist ID and amount are required' });
    }
    
    const tip = new Tip({
      fan: req.user._id,
      artist: artistId,
      song: songId,
      amount: parseFloat(amount),
      message: message || '',
      status: 'completed'
    });
    
    await tip.save();
    
    // Update artist's wallet balance
    await User.findByIdAndUpdate(artistId, {
      $inc: { walletBalance: parseFloat(amount) }
    });
    
    // Create wallet transaction record
    const WalletTransaction = mongoose.model('WalletTransaction', new mongoose.Schema({}, { strict: false }));
    await WalletTransaction.create({
      user: artistId,
      type: 'tip_received',
      amount: parseFloat(amount),
      balance: await User.findById(artistId).then(user => (user?.walletBalance || 0) + parseFloat(amount)),
      description: `Tip received from fan`,
      status: 'completed',
      createdAt: new Date()
    });
    
    res.status(201).json({
      message: 'Tip sent successfully',
      tip
    });
  } catch (error) {
    console.error('Tip creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Wallet transactions route
app.get('/api/wallet/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const WalletTransaction = mongoose.model('WalletTransaction', new mongoose.Schema({}, { strict: false }));
    const transactions = await WalletTransaction.find({ user: req.user._id })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await WalletTransaction.countDocuments({ user: req.user._id });
    
    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User tips endpoint
app.get('/api/user/tips', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (type === 'sent') {
      query.fan = req.user._id;
    } else if (type === 'received') {
      query.artist = req.user._id;
    } else {
      query.$or = [
        { fan: req.user._id },
        { artist: req.user._id }
      ];
    }
    
    const tips = await Tip.find(query)
      .populate('fan', 'name avatar')
      .populate('artist', 'name avatar')
      .populate('song', 'title')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Tip.countDocuments(query);
    
    res.json({
      tips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('User tips error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// SuperAdmin routes
app.get('/api/users/superadmin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// SuperAdmin stats
app.get('/api/superadmin/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const userCount = await User.countDocuments();
    const artistCount = await User.countDocuments({ role: 'artist' });
    const fanCount = await User.countDocuments({ role: 'fan' });
    const songsCount = await Song.countDocuments();
    const tipsCount = await Tip.countDocuments();
    
    res.json({
      userCount,
      artistCount,
      fanCount,
      songsCount,
      tipsCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// SuperAdmin summary
app.get('/api/superadmin/summary', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const metrics = {
      totalUsers: await User.countDocuments(),
      artistCount: await User.countDocuments({ role: 'artist' }),
      fanCount: await User.countDocuments({ role: 'fan' }),
      songsCount: await Song.countDocuments(),
      tipsGrossUsd: await Tip.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(result => result[0]?.total || 0),
      withdrawalsPendingCount: 0 // Placeholder
    };
    
    const latestUsers = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const latestPayments = await Tip.find({})
      .populate('fan', 'name')
      .populate('artist', 'name')
      .populate('song', 'title')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      metrics,
      latestUsers,
      latestPayments: latestPayments.map(tip => ({
        id: tip._id,
        user: tip.fan?.name || 'Anonymous',
        detail: `Tip for "${tip.song?.title || 'Unknown Song'}"`,
        amount: tip.amount,
        type: 'tip',
        createdAt: tip.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// SuperAdmin song management
app.get('/api/songs/superadmin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { page = 1, limit = 25, search } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { genre: { $regex: search, $options: 'i' } }
      ];
    }
    
    const songs = await Song.find(query)
      .populate('artist', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Song.countDocuments(query);
    
    res.json({
      songs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/songs/superadmin/:id/visibility', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { id } = req.params;
    const { isPublic } = req.body;
    
    const song = await Song.findByIdAndUpdate(id, { isPublic }, { new: true });
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    res.json({ song });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/songs/superadmin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { id } = req.params;
    
    const song = await Song.findByIdAndDelete(id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// SuperAdmin wallet management
app.get('/api/users/superadmin/user/:id/wallet', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { id } = req.params;
    const user = await User.findById(id).select('name email walletBalance');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletBalance: user.walletBalance || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/users/superadmin/user/:id/wallet', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { id } = req.params;
    const { walletBalance, action, amount, reason } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let newBalance = user.walletBalance || 0;
    
    if (action === 'set') {
      newBalance = parseFloat(walletBalance) || 0;
    } else if (action === 'add') {
      newBalance += parseFloat(amount) || 0;
    } else if (action === 'subtract') {
      newBalance -= parseFloat(amount) || 0;
    }
    
    // Ensure balance doesn't go negative
    newBalance = Math.max(0, newBalance);
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { walletBalance: newBalance },
      { new: true }
    ).select('-password');
    
    // Create wallet transaction record
    const WalletTransaction = mongoose.model('WalletTransaction', new mongoose.Schema({}, { strict: false }));
    await WalletTransaction.create({
      user: id,
      type: 'admin_adjustment',
      amount: action === 'set' ? (newBalance - (user.walletBalance || 0)) : (action === 'add' ? amount : -amount),
      balance: newBalance,
      description: reason || `Admin ${action} wallet balance`,
      status: 'completed',
      createdAt: new Date()
    });
    
    res.json({
      message: 'Wallet balance updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        walletBalance: updatedUser.walletBalance
      }
    });
  } catch (error) {
    console.error('Wallet update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile endpoint
app.patch('/api/users/profile', auth, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Image upload endpoint using Vercel Blob
app.post('/api/upload/image', auth, async (req, res) => {
  try {
    // Check if we have a file in the request
    if (!req.body.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const userId = req.user._id;
    const timestamp = Date.now();
    const filename = `avatar_${userId}_${timestamp}.jpg`;
    
    // Convert base64 to buffer if needed
    let fileBuffer;
    let contentType = 'image/jpeg';
    
    if (req.body.file.startsWith('data:')) {
      // Handle base64 data URL
      const base64Data = req.body.file.split(',')[1];
      fileBuffer = Buffer.from(base64Data, 'base64');
      
      // Extract content type from data URL
      const contentTypeMatch = req.body.file.match(/data:([^;]+)/);
      if (contentTypeMatch) {
        contentType = contentTypeMatch[1];
      }
    } else {
      // Handle direct file data
      fileBuffer = Buffer.from(req.body.file, 'base64');
    }
    
    // Upload to Vercel Blob
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType: contentType
    });
    
    res.json({
      message: 'Image uploaded successfully',
      file: {
        url: blob.url,
        filename: filename,
        size: fileBuffer.length,
        mimetype: contentType
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Audio upload endpoint using Vercel Blob
app.post('/api/upload/audio', auth, async (req, res) => {
  try {
    // Check if we have a file in the request
    if (!req.body.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const userId = req.user._id;
    const timestamp = Date.now();
    const filename = `audio_${userId}_${timestamp}.mp3`;
    
    // Convert base64 to buffer if needed
    let fileBuffer;
    let contentType = 'audio/mpeg';
    
    if (req.body.file.startsWith('data:')) {
      // Handle base64 data URL
      const base64Data = req.body.file.split(',')[1];
      fileBuffer = Buffer.from(base64Data, 'base64');
      
      // Extract content type from data URL
      const contentTypeMatch = req.body.file.match(/data:([^;]+)/);
      if (contentTypeMatch) {
        contentType = contentTypeMatch[1];
      }
    } else {
      // Handle direct file data
      fileBuffer = Buffer.from(req.body.file, 'base64');
    }
    
    // Upload to Vercel Blob
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType: contentType
    });
    
    res.json({
      message: 'Audio uploaded successfully',
      file: {
        url: blob.url,
        filename: filename,
        size: fileBuffer.length,
        mimetype: contentType
      }
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Song upload endpoint (multiple files)
app.post('/api/upload/song', auth, async (req, res) => {
  try {
    const files = req.body.files || {};
    const uploadedFiles = {};

    // Process preview song
    if (files.previewSong) {
      const userId = req.user._id;
      const timestamp = Date.now();
      const filename = `preview_${userId}_${timestamp}.mp3`;
      
      let fileBuffer;
      let contentType = 'audio/mpeg';
      
      if (files.previewSong.startsWith('data:')) {
        const base64Data = files.previewSong.split(',')[1];
        fileBuffer = Buffer.from(base64Data, 'base64');
        
        const contentTypeMatch = files.previewSong.match(/data:([^;]+)/);
        if (contentTypeMatch) {
          contentType = contentTypeMatch[1];
        }
      } else {
        fileBuffer = Buffer.from(files.previewSong, 'base64');
      }
      
      const blob = await put(filename, fileBuffer, {
        access: 'public',
        contentType: contentType
      });
      
      uploadedFiles.previewSong = {
        url: blob.url,
        filename: filename,
        size: fileBuffer.length,
        mimetype: contentType
      };
    }

    // Process complete song MP3
    if (files.completeSongMp3) {
      const userId = req.user._id;
      const timestamp = Date.now();
      const filename = `complete_${userId}_${timestamp}.mp3`;
      
      let fileBuffer;
      let contentType = 'audio/mpeg';
      
      if (files.completeSongMp3.startsWith('data:')) {
        const base64Data = files.completeSongMp3.split(',')[1];
        fileBuffer = Buffer.from(base64Data, 'base64');
        
        const contentTypeMatch = files.completeSongMp3.match(/data:([^;]+)/);
        if (contentTypeMatch) {
          contentType = contentTypeMatch[1];
        }
      } else {
        fileBuffer = Buffer.from(files.completeSongMp3, 'base64');
      }
      
      const blob = await put(filename, fileBuffer, {
        access: 'public',
        contentType: contentType
      });
      
      uploadedFiles.completeSongMp3 = {
        url: blob.url,
        filename: filename,
        size: fileBuffer.length,
        mimetype: contentType
      };
    }

    // Process cover art
    if (files.coverArt) {
      const userId = req.user._id;
      const timestamp = Date.now();
      const filename = `cover_${userId}_${timestamp}.jpg`;
      
      let fileBuffer;
      let contentType = 'image/jpeg';
      
      if (files.coverArt.startsWith('data:')) {
        const base64Data = files.coverArt.split(',')[1];
        fileBuffer = Buffer.from(base64Data, 'base64');
        
        const contentTypeMatch = files.coverArt.match(/data:([^;]+)/);
        if (contentTypeMatch) {
          contentType = contentTypeMatch[1];
        }
      } else {
        fileBuffer = Buffer.from(files.coverArt, 'base64');
      }
      
      const blob = await put(filename, fileBuffer, {
        access: 'public',
        contentType: contentType
      });
      
      uploadedFiles.coverArt = {
        url: blob.url,
        filename: filename,
        size: fileBuffer.length,
        mimetype: contentType
      };
    }

    res.json({
      message: 'Song files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Song upload error:', error);
    res.status(500).json({ error: 'Server error during song upload' });
  }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/styles', express.static(path.join(__dirname, '../styles')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/logo', express.static(path.join(__dirname, '../logo')));

// Serve index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

module.exports = app;