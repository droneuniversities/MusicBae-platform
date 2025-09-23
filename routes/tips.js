const express = require('express');
const { body, validationResult } = require('express-validator');
const Tip = require('../models/Tip');
const Song = require('../models/Song');
const User = require('../models/User');
const { auth, requireFan, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/tips
// @desc    Create a new tip (initiates payment)
// @access  Private (Fans only)
router.post('/', auth, requireFan, [
  body('artistId')
    .isMongoId()
    .withMessage('Valid artist ID is required'),
  body('songId')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Valid song ID is required when provided'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be at least $0.01'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Message cannot be more than 200 characters'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
  body('paymentMethod')
    .isIn(['stripe','paypal','wallet'])
    .withMessage('Invalid payment method')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { artistId, songId, amount, message, isAnonymous, paymentMethod } = req.body;

    // Check if artist exists and is active
    const artist = await User.findById(artistId)
      .where({ role: 'artist', isActive: true });
    
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Check if song exists and belongs to the artist
    const song = await Song.findById(songId)
      .where({ artist: artistId, isPublic: true });
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Check if user is trying to tip themselves
    if (req.user._id.toString() === artistId) {
      return res.status(400).json({ error: 'You cannot tip yourself' });
    }

    // Create a pending tip record
    const tip = await Tip.create({
      fan: req.user._id,
      artist: artistId,
      song: songId,
      amount,
      message: message || '',
      isAnonymous: !!isAnonymous,
      status: 'pending',
      paymentMethod
    });

    // Initiate payment based on method
    if (paymentMethod === 'wallet') {
      // Wallet: ensure balance and complete immediately
      const fan = await User.findById(req.user._id).select('walletBalance');
      if (!fan || fan.walletBalance < amount) {
        tip.status = 'failed';
        await tip.save();
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }
      fan.walletBalance -= amount;
      await fan.save();
      const artist = await User.findById(artistId).select('walletBalance totalEarnings');
      const artistCredit = Math.round((amount * 0.90) * 100) / 100;
      artist.walletBalance += artistCredit;
      artist.totalEarnings += artistCredit;
      await artist.save();
      await song.addTip(amount);
      tip.status = 'completed';
      await tip.save();
      await tip.populate('fan', 'name avatar');
      await tip.populate('artist', 'name avatar');
      await tip.populate('song', 'title cover');
      return res.status(201).json({ message: 'Tip completed with wallet', tip: tip.toPublicJSON() });
    }

    if (paymentMethod === 'stripe') {
      const cfg = await (async () => {
        try { return (await require('../models/SiteSetting').findOne({ key: 'paymentConfig' }).lean())?.value || {}; } catch (_) { return {}; }
      })();
      // Demo mode: simulate immediate success
      if ((process.env.NODE_ENV||'development')!=='production' && (!cfg?.stripe?.secretKey && !process.env.STRIPE_SECRET)) {
        tip.status = 'completed';
        await tip.save();
        await song.addTip(amount);
        await tip.populate('fan', 'name avatar');
        await tip.populate('artist', 'name avatar');
        await tip.populate('song', 'title cover');
        return res.status(201).json({ clientSecret: 'demo_client_secret', tipId: tip._id, simulated: true, tip: tip.toPublicJSON() });
      }
      const Stripe = require('stripe');
      const secret = cfg?.stripe?.secretKey || process.env.STRIPE_SECRET || '';
      if (!secret && (process.env.NODE_ENV||'development')==='production') return res.status(500).json({ error: 'Stripe not configured' });
      const stripe = Stripe(secret);
      const intent = await stripe.paymentIntents.create(
        {
          amount: Math.round(amount * 100),
          currency: 'usd',
          metadata: { tipId: String(tip._id), fanId: String(req.user._id), artistId },
          automatic_payment_methods: { enabled: true }
        },
        { idempotencyKey: `tip_${tip._id}` }
      );
      tip.transactionId = intent.id;
      await tip.save();
      return res.status(201).json({ clientSecret: intent.client_secret, tipId: tip._id });
    }

    if (paymentMethod === 'paypal') {
      const cfg = await (async () => {
        try { return (await require('../models/SiteSetting').findOne({ key: 'paymentConfig' }).lean())?.value || {}; } catch (_) { return {}; }
      })();
      if ((process.env.NODE_ENV||'development')!=='production' && (!cfg?.paypal?.clientId || !cfg?.paypal?.clientSecret)) {
        tip.status = 'completed';
        await tip.save();
        await song.addTip(amount);
        await tip.populate('fan', 'name avatar');
        await tip.populate('artist', 'name avatar');
        await tip.populate('song', 'title cover');
        return res.status(201).json({ orderId: 'DEMO_ORDER_ID', tipId: tip._id, approveLinks: [], simulated: true, tip: tip.toPublicJSON() });
      }
      const paypal = require('@paypal/checkout-server-sdk');
      const env = (cfg?.paypal?.mode === 'live')
        ? new paypal.core.LiveEnvironment(cfg?.paypal?.clientId || process.env.PAYPAL_CLIENT_ID || '', cfg?.paypal?.clientSecret || process.env.PAYPAL_CLIENT_SECRET || '')
        : new paypal.core.SandboxEnvironment(cfg?.paypal?.clientId || process.env.PAYPAL_CLIENT_ID || '', cfg?.paypal?.clientSecret || process.env.PAYPAL_CLIENT_SECRET || '');
      const client = new paypal.core.PayPalHttpClient(env);
      const request = new paypal.orders.OrdersCreateRequest();
      request.requestBody({ intent: 'CAPTURE', purchase_units: [{ amount: { currency_code: 'USD', value: amount.toFixed(2) } }] });
      const order = await client.execute(request);
      tip.transactionId = order.result.id;
      await tip.save();
      return res.status(201).json({ orderId: order.result.id, tipId: tip._id, approveLinks: order.result.links });
    }
  } catch (error) {
    console.error('Create tip error:', error);
    res.status(500).json({ error: 'Server error during tip creation' });
  }
});

// Stripe webhook for tips (separate from wallet webhook)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const SiteSetting = require('../models/SiteSetting');
    const cfg = await SiteSetting.findOne({ key: 'paymentConfig' }).lean().then(d => d?.value || {}).catch(()=>({}));
    const Stripe = require('stripe');
    const secret = cfg?.stripe?.secretKey || process.env.STRIPE_SECRET || '';
    const endpointSecret = cfg?.stripe?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || '';
    if ((process.env.NODE_ENV||'development') === 'production' && (!secret || !endpointSecret)) {
      return res.status(500).json({ error: 'Stripe webhook not configured' });
    }
    const stripe = Stripe(secret);
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      const tipId = intent.metadata?.tipId;
      if (tipId) {
        const tip = await Tip.findById(tipId).populate('song', '_id').populate('artist','_id');
        if (tip) {
          if (tip.status === 'completed') {
            return res.json({ received: true, duplicated: true });
          }
          if (event.type === 'payment_intent.succeeded') {
            // Validate amount/currency if present
            const received = Number(intent.amount_received ?? intent.amount ?? 0);
            const expectedCents = Math.round(Number(tip.amount) * 100);
            if (received >= expectedCents) {
              tip.status = 'completed';
              await tip.save();
              // Credit artist and song metrics
              try {
                await Song.updateOne({ _id: tip.song }, { $inc: { tips: 1, totalTipAmount: tip.amount } });
                const artistCredit = Math.round((tip.amount * 0.90) * 100) / 100;
                await User.updateOne({ _id: tip.artist }, { $inc: { walletBalance: artistCredit, totalEarnings: artistCredit } });
              } catch (_) {}
            } else {
              tip.status = 'failed';
              await tip.save();
            }
          } else {
            tip.status = 'failed';
            await tip.save();
          }
        }
      }
    }
    res.json({ received: true });
  } catch (e) {
    res.status(500).json({ error: 'Stripe webhook error' });
  }
});

// @route   GET /api/tips/received
// @desc    Get tips received by current user (artists only)
// @access  Private
router.get('/received', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Check if user is an artist
    if (req.user.role !== 'artist') {
      return res.status(403).json({ error: 'Only artists can view received tips' });
    }

    const tips = await Tip.find({ artist: req.user._id, status: 'completed' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('fan', 'name avatar')
      .populate('song', 'title cover');

    console.log('Found tips with messages:', tips.map(t => ({ id: t._id, message: t.message, hasMessage: !!t.message })));

    const total = await Tip.countDocuments({ artist: req.user._id, status: 'completed' });

    res.json({
      tips: tips.map(tip => tip.toArtistJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get received tips error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/tips/sent
// @desc    Get tips sent by current user (fans only)
// @access  Private
router.get('/sent', auth, requireFan, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const tips = await Tip.find({ fan: req.user._id, status: 'completed' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('artist', 'name avatar')
      .populate('song', 'title cover');

    const total = await Tip.countDocuments({ fan: req.user._id, status: 'completed' });

    res.json({
      tips: tips.map(tip => tip.toPublicJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get sent tips error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/tips/song/:songId
// @desc    Get tips for a specific song
// @access  Public
router.get('/song/:songId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Check if song exists
    const song = await Song.findById(req.params.songId)
      .where({ isPublic: true });
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const tips = await Tip.find({ song: req.params.songId, status: 'completed' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('fan', 'name avatar')
      .populate('artist', 'name avatar');

    const total = await Tip.countDocuments({ song: req.params.songId, status: 'completed' });

    res.json({
      tips: tips.map(tip => tip.toPublicJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get song tips error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/tips/artist/:artistId
// @desc    Get tips for a specific artist
// @access  Public
router.get('/artist/:artistId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Check if artist exists
    const artist = await User.findById(req.params.artistId)
      .where({ role: 'artist', isActive: true });
    
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const tips = await Tip.find({ artist: req.params.artistId, status: 'completed' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('fan', 'name avatar')
      .populate('song', 'title cover');

    const total = await Tip.countDocuments({ artist: req.params.artistId, status: 'completed' });

    res.json({
      tips: tips.map(tip => tip.toPublicJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get artist tips error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/tips/:id
// @desc    Get specific tip by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const tip = await Tip.findById(req.params.id)
      .populate('fan', 'name avatar')
      .populate('artist', 'name avatar')
      .populate('song', 'title cover');

    if (!tip) {
      return res.status(404).json({ error: 'Tip not found' });
    }

    // Check if user has permission to view this tip
    const canView = req.user._id.toString() === tip.fan._id.toString() ||
                   req.user._id.toString() === tip.artist._id.toString();

    if (!canView) {
      return res.status(403).json({ error: 'Not authorized to view this tip' });
    }

    res.json({ tip: tip.toPublicJSON() });
  } catch (error) {
    console.error('Get tip error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/tips/:id/react
// @desc    Artist reacts to a tip with an emoji
// @access  Private (Artist who received the tip)
router.put('/:id/react', auth, [
  body('reaction')
    .isString()
    .isLength({ min: 1, max: 10 })
    .withMessage('Reaction must be a single emoji character')
    .custom((value) => {
      console.log('Validating reaction:', value, 'Type:', typeof value, 'Length:', value.length);
      
      // Simple validation: just check if it's not empty and reasonable length
      if (!value || value.length === 0) {
        throw new Error('Reaction cannot be empty');
      }
      
      if (value.length > 10) {
        throw new Error('Reaction too long (max 10 characters)');
      }
      
      // Allow any non-empty string that's not just whitespace
      if (value.trim().length === 0) {
        throw new Error('Reaction cannot be just whitespace');
      }
      
      console.log('Reaction validation passed:', value);
      return true;
    })
], async (req, res) => {
  try {
    console.log('Reaction request body:', req.body);
    console.log('Reaction request params:', req.params);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { reaction } = req.body;
    const tipId = req.params.id;

    // Find the tip and ensure it exists
    const tip = await Tip.findById(tipId);
    if (!tip) {
      return res.status(404).json({ error: 'Tip not found' });
    }

    // Ensure the tip is completed
    if (tip.status !== 'completed') {
      return res.status(400).json({ error: 'Can only react to completed tips' });
    }

    // Ensure the current user is the artist who received the tip
    if (tip.artist.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the artist who received the tip can react to it' });
    }

    // Update the tip with the reaction
    tip.reaction = reaction;
    await tip.save();

    // Populate the tip for response
    await tip.populate('fan', 'name avatar');
    await tip.populate('artist', 'name avatar');
    await tip.populate('song', 'title cover');

    res.json({ 
      message: 'Reaction added successfully', 
      tip: tip.toArtistJSON() 
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Server error while adding reaction' });
  }
});

module.exports = router; 

// ===== SUPERADMIN TIP MANAGEMENT =====
// List tips with filters
router.get('/superadmin/all', auth, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;
    const filter = {};
    if (status) filter.status = status;
    const tips = await Tip.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('fan', 'name email')
      .populate('artist', 'name email')
      .populate('song', 'title');
    const total = await Tip.countDocuments(filter);
    res.json({ tips: tips.map(t => t.toPublicJSON()), pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update tip status (e.g., refund)
router.patch('/superadmin/:id/status', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending','completed','failed','refunded'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const tip = await Tip.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('fan', 'name email')
      .populate('artist', 'name email')
      .populate('song', 'title');
    if (!tip) return res.status(404).json({ error: 'Tip not found' });
    res.json({ message: 'Tip status updated', tip: tip.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});