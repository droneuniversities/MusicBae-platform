const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Simple auth middleware for upload routes
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

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create subdirectories for different file types
    let uploadPath = uploadsDir;
    
    if (file.fieldname === 'previewSong' || file.fieldname === 'completeSongMp3' || file.fieldname === 'completeSongWav') {
      uploadPath = path.join(uploadsDir, 'audio');
    } else if (file.fieldname === 'coverArt' || file.fieldname === 'image') {
      uploadPath = path.join(uploadsDir, 'images');
    }
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter function with enhanced security
const fileFilter = (req, file, cb) => {
  // Check file type
  const isAudioField = ['previewSong', 'completeSongMp3', 'completeSongWav', 'audio'].includes(file.fieldname);
  if (isAudioField) {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
    const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
    
    // Check MIME type
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid audio file type. Only MP3, WAV, OGG, and M4A files are allowed.'), false);
    }
    
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Invalid audio file extension.'), false);
    }
    
    return cb(null, true);
  }

  if (['coverArt', 'image'].includes(file.fieldname)) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    // Check MIME type
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid image file type. Only JPEG, PNG, GIF, and WebP files are allowed.'), false);
    }
    
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Invalid image file extension.'), false);
    }
    
    return cb(null, true);
  }

  return cb(new Error('Invalid field name'), false);
};

// Configure multer for single file uploads
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only one file at a time
  }
});

// Configure multer for song upload (multiple files)
const songUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit per file
    files: 4 // Allow up to 4 files (preview, mp3, wav, cover)
  }
});

// @route   POST /api/upload/audio
// @desc    Upload audio file
// @access  Private
router.post('/audio', auth, upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Return file information
    res.json({
      message: 'Audio file uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/audio/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// @route   POST /api/upload/image
// @desc    Upload image file
// @access  Private
router.post('/image', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Return file information
    res.json({
      message: 'Image uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/images/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// @route   POST /api/upload/song
// @desc    Upload complete song with all files
// @access  Private
router.post('/song', auth, songUpload.fields([
  { name: 'previewSong', maxCount: 1 },
  { name: 'completeSongMp3', maxCount: 1 },
  { name: 'completeSongWav', maxCount: 1 },
  { name: 'coverArt', maxCount: 1 }
]), (req, res) => {
  try {
    const files = req.files || {};
    const uploadedFiles = {};

    // Process preview song
    if (files.previewSong && files.previewSong[0]) {
      uploadedFiles.previewSong = {
        filename: files.previewSong[0].filename,
        originalname: files.previewSong[0].originalname,
        mimetype: files.previewSong[0].mimetype,
        size: files.previewSong[0].size,
        url: `/uploads/audio/${files.previewSong[0].filename}`
      };
    }

    // Process complete song MP3
    if (files.completeSongMp3 && files.completeSongMp3[0]) {
      uploadedFiles.completeSongMp3 = {
        filename: files.completeSongMp3[0].filename,
        originalname: files.completeSongMp3[0].originalname,
        mimetype: files.completeSongMp3[0].mimetype,
        size: files.completeSongMp3[0].size,
        url: `/uploads/audio/${files.completeSongMp3[0].filename}`
      };
    }

    // Process complete song WAV (optional)
    if (files.completeSongWav && files.completeSongWav[0]) {
      uploadedFiles.completeSongWav = {
        filename: files.completeSongWav[0].filename,
        originalname: files.completeSongWav[0].originalname,
        mimetype: files.completeSongWav[0].mimetype,
        size: files.completeSongWav[0].size,
        url: `/uploads/audio/${files.completeSongWav[0].filename}`
      };
    }

    // Process cover art
    if (files.coverArt && files.coverArt[0]) {
      uploadedFiles.coverArt = {
        filename: files.coverArt[0].filename,
        originalname: files.coverArt[0].originalname,
        mimetype: files.coverArt[0].mimetype,
        size: files.coverArt[0].size,
        url: `/uploads/images/${files.coverArt[0].filename}`
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

// @route   DELETE /api/upload/:filename
// @desc    Delete uploaded file
// @access  Private
router.delete('/:filename', auth, (req, res) => {
  try {
    const raw = req.params.filename;
    // Prevent path traversal and invalid names
    const filename = path.basename(raw);
    if (filename !== raw || /[\\/]/.test(raw)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    if (!/^[\w.-]+$/.test(filename)) {
      return res.status(400).json({ error: 'Invalid filename format' });
    }
    
    // Check if file exists in any upload directory
    const possiblePaths = [
      path.join(uploadsDir, 'audio', filename),
      path.join(uploadsDir, 'images', filename)
    ];

    let filePath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Server error during file deletion' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Only one file allowed.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  if (error.message) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

module.exports = router; 