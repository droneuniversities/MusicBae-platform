const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Song = require('../models/Song');
const Tip = require('../models/Tip');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/artists
// @desc    Get all artists with pagination and filtering
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12);
    const genre = req.query.genre;
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'followers'; // followers | plays | tips | earnings | latest
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      // Database not connected, return fallback data
      const fallbackArtists = [
        {
          _id: 'fallback-1',
          name: 'Luna Echo',
          avatar: '/assets/images/music-baee-logo-with-dots.webp',
          bio: 'Alternative indie artist pushing boundaries with ethereal vocals and experimental soundscapes.',
          followerCount: 12450,
          songs: 3,
          totalPlays: 4689,
          totalTips: 218,
          totalTipAmount: 1488.2,
          isVerified: true
        },
        {
          _id: 'fallback-2',
          name: 'EDM Pulse',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          bio: 'Electronic dance music producer creating high-energy beats that make crowds move.',
          followerCount: 8900,
          songs: 1,
          totalPlays: 890,
          totalTips: 36,
          totalTipAmount: 204,
          isVerified: true
        },
        {
          _id: 'fallback-3',
          name: 'Jazz Flow',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          bio: 'Smooth jazz saxophonist bringing soulful melodies to life with every note.',
          followerCount: 5600,
          songs: 1,
          totalPlays: 2100,
          totalTips: 70,
          totalTipAmount: 374,
          isVerified: false
        }
      ];

      return res.json({
        artists: fallbackArtists,
        pagination: {
          page: 1,
          limit: 12,
          total: fallbackArtists.length,
          pages: 1
        }
      });
    }

    // Base match for active artists
    const baseMatch = { role: 'artist', isActive: true };
    if (search) {
      baseMatch.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    // Get artists with pagination
    const artists = await User.find(baseMatch)
      .select('name avatar bio followers isVerified createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(baseMatch);

    // Get song counts and stats for each artist
    const results = await Promise.all(artists.map(async (artist) => {
      const songs = await Song.find({ artist: artist._id, isPublic: true });
      return {
        ...artist,
        songCount: songs.length,
        followerCount: artist.followers?.length || 0,
        totalPlays: songs.reduce((sum, song) => sum + (song.plays || 0), 0),
        totalTips: songs.reduce((sum, song) => sum + (song.tips || 0), 0),
        totalTipAmount: songs.reduce((sum, song) => sum + (song.totalTipAmount || 0), 0)
      };
    }));

    // Prepare response shape and isFollowing
    const followingSet = req.user ? new Set((req.user.following || []).map(id => id.toString())) : null;
    const formattedArtists = results.map(a => {
      const obj = {
        _id: a._id,
        name: a.name,
        avatar: a.avatar,
        bio: a.bio,
        followerCount: a.followerCount || 0,
        songs: a.songCount || 0,
        totalPlays: a.totalPlays || 0,
        totalTips: a.totalTips || 0,
        totalTipAmount: a.totalTipAmount || 0,
        isVerified: !!a.isVerified
      };
      if (followingSet) obj.isFollowing = followingSet.has(String(a._id));
      return obj;
    });

    res.json({
      artists: formattedArtists,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get artists error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper to resolve artist by id or slug
async function resolveArtistByIdOrSlug(idOrSlug, select = 'name avatar bio followers totalEarnings isVerified createdAt socialLinks website location') {
  const isValidObjectId = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);
  if (isValidObjectId(idOrSlug)) {
    return await User.findById(idOrSlug)
      .where({ role: 'artist', isActive: true })
      .select(select);
  }
  const raw = String(idOrSlug || '').toLowerCase().trim();
  // Strict slug-style match (anchors, ignore non-alnum separators)
  const parts = raw.split('-').map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean);
  if (parts.length > 0) {
    const strictPattern = '^' + parts.join('[^a-z0-9]+') + '$';
    const strictRegex = new RegExp(strictPattern, 'i');
    const strictHit = await User.findOne({ role: 'artist', isActive: true, name: { $regex: strictRegex } }).select(select);
    if (strictHit) return strictHit;
  }
  // Looser fallback: treat dashes as spaces and do case-insensitive contains
  const loose = raw.replace(/-/g, ' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const looseRegex = new RegExp(loose, 'i');
  return await User.findOne({ role: 'artist', isActive: true, name: { $regex: looseRegex } }).select(select);
}

// @route   GET /api/artists/:idOrSlug
// @desc    Get artist profile with songs and stats
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const idOrSlug = req.params.id;
    const artist = await resolveArtistByIdOrSlug(idOrSlug);

    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Get artist's songs
    const songs = await Song.find({ artist: artist._id, isPublic: true })
      .sort({ createdAt: -1 })
      .select('title duration genre cover plays tips totalTipAmount createdAt previewSong completeSongMp3 completeSongWav description');

    // Get recent tips
    const recentTips = await Tip.find({ artist: artist._id, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('fan', 'name avatar')
      .populate('song', 'title');

    // Add following status and live stats
    const artistData = artist.toObject();
    if (req.user) {
      const isFollowing = req.user.following.some(id => id.toString() === artist._id.toString());
      artistData.isFollowing = isFollowing;
    }
    artistData.totalPlays = songs.reduce((sum, s) => sum + (s.plays || 0), 0);
    artistData.totalTips = songs.reduce((sum, s) => sum + (s.tips || 0), 0);
    artistData.topSong = songs.length ? songs.slice().sort((a,b)=> (b.plays||0)-(a.plays||0))[0]?.title : '';

    res.json({
      artist: artistData,
      songs,
      recentTips
    });
  } catch (error) {
    console.error('Get artist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/artists/:id/follow
// @desc    Follow an artist
// @access  Private
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const artistId = req.params.id;
    
    // Check if artist exists and is active
    const artist = await User.findById(artistId)
      .where({ role: 'artist', isActive: true });
    
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Check if user is trying to follow themselves
    if (req.user._id.toString() === artistId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    // Check if already following
    if (req.user.following.includes(artistId)) {
      return res.status(400).json({ error: 'Already following this artist' });
    }

    // Apply atomic updates for consistency and to avoid race conditions
    await Promise.all([
      User.updateOne({ _id: req.user._id }, { $addToSet: { following: artistId } }),
      User.updateOne({ _id: artist._id }, { $addToSet: { followers: req.user._id } })
    ]);

    // Return updated minimal state
    const followerCount = await User.countDocuments({ _id: artist._id, followers: { $exists: true } })
      .then(async () => (await User.findById(artist._id).select('followers')).followers.length)
      .catch(() => undefined);

    res.json({ 
      message: 'Successfully followed artist',
      isFollowing: true,
      followerCount
    });
  } catch (error) {
    console.error('Follow artist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/artists/:id/follow
// @desc    Unfollow an artist
// @access  Private
router.delete('/:id/follow', auth, async (req, res) => {
  try {
    const artistId = req.params.id;
    
    // Check if artist exists
    const artist = await User.findById(artistId);
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Check if currently following
    if (!req.user.following.includes(artistId)) {
      return res.status(400).json({ error: 'Not following this artist' });
    }

    // Apply atomic updates
    await Promise.all([
      User.updateOne({ _id: req.user._id }, { $pull: { following: artistId } }),
      User.updateOne({ _id: artist._id }, { $pull: { followers: req.user._id } })
    ]);

    const followerCount = await User.findById(artist._id).select('followers').then(doc => doc?.followers?.length).catch(()=>undefined);

    res.json({ 
      message: 'Successfully unfollowed artist',
      isFollowing: false,
      followerCount
    });
  } catch (error) {
    console.error('Unfollow artist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/artists/:idOrSlug/songs
// @desc    Get artist's songs
// @access  Public
router.get('/:id/songs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const genre = req.query.genre;

    // Resolve artist with minimal fields for performance
    const artist = await User.findById(req.params.id)
      .select('_id name isActive')
      .lean();
    
    if (!artist || !artist.isActive) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Build query with index-friendly conditions
    const query = { artist: artist._id, isPublic: true };
    if (genre) {
      query.genre = genre;
    }

    // Get songs with pagination - optimized query
    const songs = await Song.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('title duration genre cover plays tips totalTipAmount createdAt')
      .lean(); // Use lean() for better performance

    // Get total count - optimized with same query
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
    console.error('Get artist songs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/artists/:idOrSlug/tips
// @desc    Get artist's recent tips
// @access  Public
router.get('/:id/tips', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Resolve artist with minimal fields for performance
    const artist = await User.findById(req.params.id)
      .select('_id name isActive')
      .lean();
    
    if (!artist || !artist.isActive) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Get recent tips - optimized query
    const tips = await Tip.find({ 
      artist: artist._id, 
      status: 'completed' 
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('fan song amount createdAt message isAnonymous')
      .populate('fan', 'name avatar')
      .populate('song', 'title cover')
      .lean(); // Use lean() for better performance

    res.json({ tips });
  } catch (error) {
    console.error('Get artist tips error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/artists/:idOrSlug/stats
// @desc    Get live stats for an artist (totals and monthly growth)
// @access  Public
router.get('/:id/stats', async (req, res) => {
  try {
    const artist = await resolveArtistByIdOrSlug(req.params.id, 'followers totalEarnings');
    if (!artist) return res.status(404).json({ error: 'Artist not found' });

    // Totals from songs
    const songs = await Song.find({ artist: artist._id, isPublic: true }).select('plays title');
    const totalPlays = songs.reduce((sum, s) => sum + (s.plays || 0), 0);
    const topSong = songs.length ? songs.slice().sort((a,b)=> (b.plays||0)-(a.plays||0))[0]?.title : '';

    // Monthly growth based on credited earnings from tips (90% of tip amount)
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const Tip = require('../models/Tip');
    const [thisAgg] = await Tip.aggregate([
      { $match: { artist: artist._id, status: 'completed', createdAt: { $gte: startThisMonth } } },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);
    const [prevAgg] = await Tip.aggregate([
      { $match: { artist: artist._id, status: 'completed', createdAt: { $gte: startPrevMonth, $lt: startThisMonth } } },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);

    const creditedThis = Math.round(((thisAgg?.sum || 0) * 0.90) * 100) / 100;
    const creditedPrev = Math.round(((prevAgg?.sum || 0) * 0.90) * 100) / 100;
    let monthlyGrowth = 0;
    if (creditedPrev === 0) {
      monthlyGrowth = creditedThis > 0 ? 100 : 0;
    } else {
      monthlyGrowth = Math.round(((creditedThis - creditedPrev) / creditedPrev) * 100);
    }

    res.json({
      totalEarnings: artist.totalEarnings || 0,
      totalFollowers: artist.followers?.length || 0,
      totalPlays,
      monthlyGrowth,
      topSong
    });
  } catch (error) {
    console.error('Get artist stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 