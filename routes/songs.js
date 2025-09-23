const express = require('express');
const { body, validationResult } = require('express-validator');
const Song = require('../models/Song');
const User = require('../models/User');
const { auth, requireArtist, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/songs
// @desc    Get all songs with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const genre = req.query.genre;
    const search = req.query.search;
    
    // Validate sortBy parameter to prevent NoSQL injection
    const allowedSortFields = ['createdAt', 'title', 'plays', 'tips', 'totalTipAmount'];
    const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    const query = { isPublic: true };
    
    if (genre) {
      query.genre = genre;
    }
    
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    // Execute query with pagination
    const songs = await Song.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('artist', 'name avatar isVerified')
      .select('title duration genre cover plays tips totalTipAmount createdAt previewSong');

    // Get total count for pagination
    const total = await Song.countDocuments(query);

    res.json({
      songs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get songs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/songs/:id
// @desc    Get song by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id)
      .where({ isPublic: true })
      .populate('artist', 'name avatar bio isVerified')
      .select('title duration genre cover plays tips totalTipAmount description tags releaseDate createdAt previewSong completeSongMp3 completeSongWav');

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json({ song: song.toPublicJSON() });
  } catch (error) {
    console.error('Get song error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/songs
// @desc    Upload a new song (artists only)
// @access  Private
router.post('/', auth, requireArtist, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('genre')
    .isIn([
      'Pop', 'Rock', 'Hip Hop', 'Jazz', 'Classical', 'Country', 
      'Electronic', 'R&B', 'Metal', 'Folk', 'Blues', 'Reggae', 
      'Punk', 'Ambient', 'Latin', 'Gospel', 'Indie', 'World', 
      'Alternative', 'EDM'
    ])
    .withMessage('Invalid genre'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  body('previewSong')
    .notEmpty()
    .withMessage('Preview song is required'),
  body('completeSongMp3')
    .notEmpty()
    .withMessage('Complete song MP3 is required'),
  body('cover')
    .optional()
    .custom((value) => {
      if (!value) return true;
      // Allow absolute URLs and local uploaded paths
      return /^https?:\/\//i.test(value) || value.startsWith('/uploads/');
    })
    .withMessage('Cover must be a valid URL or local uploaded path'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
], async (req, res) => {
  try {
    // Enforce per-artist song limit (max 5)
    const existingCount = await Song.countDocuments({ artist: req.user._id });
    if (existingCount >= 5) {
      return res.status(400).json({ error: 'Song upload limit reached (max 5 songs per artist)' });
    }
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, genre, duration, previewSong, completeSongMp3, completeSongWav, cover, description, tags } = req.body;

    // Create new song
    const song = new Song({
      title,
      artist: req.user._id,
      genre,
      duration,
      previewSong,
      completeSongMp3,
      completeSongWav: completeSongWav || null,
      cover: cover || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      description: description || '',
      tags: tags || []
    });

    await song.save();

    // Populate artist info
    await song.populate('artist', 'name avatar isVerified');

    res.status(201).json({
      message: 'Song uploaded successfully',
      song: song.toPublicJSON()
    });
  } catch (error) {
    console.error('Upload song error:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// @route   PUT /api/songs/:id
// @desc    Update song (artist only)
// @access  Private
router.put('/:id', auth, requireArtist, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('genre')
    .optional()
    .isIn([
      'Pop', 'Rock', 'Hip Hop', 'Jazz', 'Classical', 'Country', 
      'Electronic', 'R&B', 'Metal', 'Folk', 'Blues', 'Reggae', 
      'Punk', 'Ambient', 'Latin', 'Gospel', 'Indie', 'World', 
      'Alternative', 'EDM'
    ])
    .withMessage('Invalid genre'),
  body('cover')
    .optional()
    .custom((value) => {
      if (!value) return true;
      return /^https?:\/\//i.test(value) || value.startsWith('/uploads/');
    })
    .withMessage('Cover must be a valid URL or local uploaded path'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  body('previewSong')
    .optional()
    .custom((value) => {
      if (!value) return true;
      return /^https?:\/\//i.test(value) || value.startsWith('/uploads/');
    })
    .withMessage('Preview song must be a valid URL or local uploaded path'),
  body('completeSongMp3')
    .optional()
    .custom((value) => {
      if (!value) return true;
      return /^https?:\/\//i.test(value) || value.startsWith('/uploads/');
    })
    .withMessage('Complete song MP3 must be a valid URL or local uploaded path'),
  body('completeSongWav')
    .optional()
    .custom((value) => {
      if (!value) return true;
      return /^https?:\/\//i.test(value) || value.startsWith('/uploads/');
    })
    .withMessage('Complete song WAV must be a valid URL or local uploaded path'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Check if user owns the song
    if (song.artist.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this song' });
    }

    const { title, genre, cover, description, tags, previewSong, completeSongMp3, completeSongWav } = req.body;
    const updateFields = {};

    if (title) updateFields.title = title;
    if (genre) updateFields.genre = genre;
    if (cover) updateFields.cover = cover;
    if (description !== undefined) updateFields.description = description;
    if (previewSong) updateFields.previewSong = previewSong;
    if (completeSongMp3) updateFields.completeSongMp3 = completeSongMp3;
    if (completeSongWav !== undefined) updateFields.completeSongWav = completeSongWav || null;
    if (tags) updateFields.tags = tags;

    const updatedSong = await Song.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('artist', 'name avatar isVerified');

    res.json({
      message: 'Song updated successfully',
      song: updatedSong.toPublicJSON()
    });
  } catch (error) {
    console.error('Update song error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/songs/:id
// @desc    Delete song (artist only)
// @access  Private
router.delete('/:id', auth, requireArtist, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Check if user owns the song
    if (song.artist.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this song' });
    }

    // Do not delete tips; only delete the song document
    await Song.findByIdAndDelete(req.params.id);

    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Delete song error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/songs/:id/play
// @desc    Increment song play count
// @access  Public
router.post('/:id/play', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id)
      .where({ isPublic: true });
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Avoid inflating plays: perform atomic increment
    await song.incrementPlays();

    res.json({ message: 'Play count updated' });
  } catch (error) {
    console.error('Increment play error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/songs/trending
// @desc    Get trending songs
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get songs with highest plays in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const songs = await Song.find({
      isPublic: true,
      createdAt: { $gte: sevenDaysAgo }
    })
      .sort({ plays: -1, tips: -1 })
      .limit(limit)
      .populate('artist', 'name avatar isVerified')
      .select('title duration genre cover plays tips totalTipAmount');

    res.json({ songs });
  } catch (error) {
    console.error('Get trending songs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/songs/genre/:genre
// @desc    Get songs by genre
// @access  Public
router.get('/genre/:genre', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const genre = req.params.genre;

    const songs = await Song.find({
      genre,
      isPublic: true
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('artist', 'name avatar isVerified')
      .select('title duration genre cover plays tips totalTipAmount');

    const total = await Song.countDocuments({ genre, isPublic: true });

    res.json({
      songs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get songs by genre error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== SUPERADMIN SONG MANAGEMENT =====
// @route   GET /api/songs/superadmin/all
// @desc    List all songs (superadmin)
// @access  Private (superadmin)
router.get('/superadmin/all', auth, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const q = (req.query.q || '').trim();
    const filter = {};
    if (q) filter.title = { $regex: q, $options: 'i' };
    const songs = await Song.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('artist', 'name email');
    const total = await Song.countDocuments(filter);
    res.json({ songs, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
  } catch (error) {
    console.error('Superadmin songs list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/songs/superadmin/:id/visibility
// @desc    Toggle song visibility (superadmin)
// @access  Private (superadmin)
router.patch('/superadmin/:id/visibility', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { isPublic } = req.body;
    const song = await Song.findByIdAndUpdate(req.params.id, { isPublic: !!isPublic }, { new: true });
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json({ message: 'Visibility updated', song });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/songs/superadmin/:id
// @desc    Delete song (superadmin)
// @access  Private (superadmin)
router.delete('/superadmin/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ error: 'Song not found' });
    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: 'Song deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/songs/:id/complete
// @desc    Get complete song files (requires tip)
// @access  Private
router.get('/:id/complete', auth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id)
      .populate('artist', 'name avatar bio isVerified')
      .select('title duration genre cover plays tips totalTipAmount description tags releaseDate createdAt completeSongMp3 completeSongWav');

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Check if user has tipped for this song
    const Tip = require('../models/Tip');
    const tip = await Tip.findOne({
      song: req.params.id,
      fan: req.user._id,
      status: 'completed'
    });

    if (!tip) {
      return res.status(403).json({ 
        error: 'Tip required to access complete song',
        message: 'Please tip the artist to access the complete song files'
      });
    }

    res.json({ 
      song: {
        ...song.toObject(),
        completeSongMp3: song.completeSongMp3,
        completeSongWav: song.completeSongWav
      }
    });
  } catch (error) {
    console.error('Get complete song error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 