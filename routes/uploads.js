const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/mp3'];
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (file.fieldname === 'audio') {
    if (allowedAudioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type. Allowed: MP3, WAV, FLAC, AAC'), false);
    }
  } else if (file.fieldname === 'image') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image file type. Allowed: JPG, PNG, GIF, WEBP'), false);
    }
  } else {
    cb(new Error('Invalid field name'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 1
  }
});

// @desc    Upload audio file
// @route   POST /api/uploads/audio
// @access  Private (Artists only)
router.post('/audio', [
  authorize('artist'),
  upload.single('audio')
], asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No audio file uploaded'
    });
  }

  // Get file info
  const fileInfo = {
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
    url: `/uploads/${req.file.filename}`
  };

  // TODO: In production, upload to cloud storage (AWS S3, Cloudinary, etc.)
  // For now, we'll use local storage

  res.json({
    success: true,
    data: {
      fileId: req.file.filename,
      url: fileInfo.url,
      filename: fileInfo.filename,
      size: fileInfo.size,
      mimetype: fileInfo.mimetype
    }
  });
}));

// @desc    Upload image file
// @route   POST /api/uploads/image
// @access  Private
router.post('/image', [
  auth,
  upload.single('image')
], asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No image file uploaded'
    });
  }

  // Get file info
  const fileInfo = {
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
    url: `/uploads/${req.file.filename}`
  };

  // TODO: In production, upload to cloud storage and generate different sizes
  // For now, we'll use local storage

  res.json({
    success: true,
    data: {
      fileId: req.file.filename,
      url: fileInfo.url,
      filename: fileInfo.filename,
      size: fileInfo.size,
      mimetype: fileInfo.mimetype
    }
  });
}));

// @desc    Upload multiple files
// @route   POST /api/uploads/multiple
// @access  Private
router.post('/multiple', [
  auth,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ])
], asyncHandler(async (req, res) => {
  const uploadedFiles = {};

  if (req.files.audio) {
    const audioFile = req.files.audio[0];
    uploadedFiles.audio = {
      fileId: audioFile.filename,
      url: `/uploads/${audioFile.filename}`,
      filename: audioFile.filename,
      size: audioFile.size,
      mimetype: audioFile.mimetype
    };
  }

  if (req.files.image) {
    const imageFile = req.files.image[0];
    uploadedFiles.image = {
      fileId: imageFile.filename,
      url: `/uploads/${imageFile.filename}`,
      filename: imageFile.filename,
      size: imageFile.size,
      mimetype: imageFile.mimetype
    };
  }

  if (Object.keys(uploadedFiles).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No files uploaded'
    });
  }

  res.json({
    success: true,
    data: uploadedFiles
  });
}));

// @desc    Delete uploaded file
// @route   DELETE /api/uploads/:filename
// @access  Private
router.delete('/:filename', auth, asyncHandler(async (req, res) => {
  const raw = req.params.filename;
  const filename = path.basename(raw);
  if (filename !== raw || /[\\/]/.test(raw)) {
    return res.status(400).json({ success: false, error: 'Invalid filename' });
  }
  if (!/^[\w.-]+$/.test(filename)) {
    return res.status(400).json({ success: false, error: 'Invalid filename format' });
  }
  const filePath = path.join(__dirname, '../uploads', filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }

  // Check if user owns the file (optional security measure)
  // In a real app, you might want to track file ownership

  try {
    // Delete file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
}));

// @desc    Get upload statistics
// @route   GET /api/uploads/stats
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  const uploadsDir = path.join(__dirname, '../uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    return res.json({
      success: true,
      data: {
        totalFiles: 0,
        totalSize: 0,
        audioFiles: 0,
        imageFiles: 0
      }
    });
  }

  const files = fs.readdirSync(uploadsDir);
  let totalSize = 0;
  let audioFiles = 0;
  let imageFiles = 0;

  files.forEach(file => {
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    totalSize += stats.size;

    const ext = path.extname(file).toLowerCase();
    if (['.mp3', '.wav', '.flac', '.aac'].includes(ext)) {
      audioFiles++;
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      imageFiles++;
    }
  });

  res.json({
    success: true,
    data: {
      totalFiles: files.length,
      totalSize,
      audioFiles,
      imageFiles
    }
  });
}));

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field'
      });
    }
  }

  if (error.message.includes('Invalid')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  next(error);
});

module.exports = router; 