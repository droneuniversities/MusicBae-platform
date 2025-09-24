const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { put } = require('@vercel/blob');

// Import models
const User = require('../models/User');

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

// Song upload endpoint using Vercel Blob (handles multiple files)
app.post('/api/upload/song', auth, async (req, res) => {
  try {
    console.log('Upload endpoint hit!');
    const userId = req.user._id;
    const timestamp = Date.now();
    const uploadedFiles = {};

    // Helper function to upload a file
    const uploadFile = async (fileData, fieldName, defaultContentType) => {
      if (!fileData) return null;

      const filename = `${fieldName}_${userId}_${timestamp}.${defaultContentType.split('/')[1]}`;
      
      let fileBuffer;
      let contentType = defaultContentType;
      
      if (fileData.startsWith('data:')) {
        // Handle base64 data URL
        const base64Data = fileData.split(',')[1];
        fileBuffer = Buffer.from(base64Data, 'base64');
        
        // Extract content type from data URL
        const contentTypeMatch = fileData.match(/data:([^;]+)/);
        if (contentTypeMatch) {
          contentType = contentTypeMatch[1];
        }
      } else {
        // Handle direct file data
        fileBuffer = Buffer.from(fileData, 'base64');
      }
      
      // Upload to Vercel Blob
      const blob = await put(filename, fileBuffer, {
        access: 'public',
        contentType: contentType
      });
      
      return {
        url: blob.url,
        filename: filename,
        size: fileBuffer.length,
        mimetype: contentType
      };
    };

    // Upload preview song
    if (req.body.previewSong) {
      uploadedFiles.previewSong = await uploadFile(req.body.previewSong, 'previewSong', 'audio/mpeg');
    }

    // Upload complete song MP3
    if (req.body.completeSongMp3) {
      uploadedFiles.completeSongMp3 = await uploadFile(req.body.completeSongMp3, 'completeSongMp3', 'audio/mpeg');
    }

    // Upload complete song WAV
    if (req.body.completeSongWav) {
      uploadedFiles.completeSongWav = await uploadFile(req.body.completeSongWav, 'completeSongWav', 'audio/wav');
    }

    // Upload cover art
    if (req.body.coverArt) {
      uploadedFiles.coverArt = await uploadFile(req.body.coverArt, 'coverArt', 'image/jpeg');
    }

    res.json({
      message: 'Song files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Song upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = app;
