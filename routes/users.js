const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const Song = require('../models/Song');
const Tip = require('../models/Tip');
const WalletTransaction = require('../models/WalletTransaction');
const SiteSetting = require('../models/SiteSetting');
const LibraryItem = require('../models/LibraryItem');
const { auth, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Use raw body for Stripe webhook only (route-level applied below)

// Helper: generate strong random password (meets model validator)
function generateStrongPassword(length = 18) {
  const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowers = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const specials = '@$!%*?&';
  const all = uppers + lowers + digits + specials;
  const pick = (set) => set[crypto.randomInt(0, set.length)];
  let pwd = pick(uppers) + pick(lowers) + pick(digits) + pick(specials);
  while (pwd.length < length) pwd += pick(all);
  // shuffle
  return pwd.split('').sort(() => 0.5 - Math.random()).join('');
}

// Helper: read payment configuration from DB with env fallbacks
async function loadPaymentConfig() {
  try {
    const doc = await SiteSetting.findOne({ key: 'paymentConfig' }).lean();
    const cfg = (doc && doc.value) || {};
    const base = {
      stripe: {
        enabled: cfg?.stripe?.enabled !== false,
        secretKey: cfg?.stripe?.secretKey || process.env.STRIPE_SECRET || '',
        publishableKey: cfg?.stripe?.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY || '',
        webhookSecret: cfg?.stripe?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || ''
      },
      paypal: {
        enabled: cfg?.paypal?.enabled !== false,
        clientId: cfg?.paypal?.clientId || process.env.PAYPAL_CLIENT_ID || '',
        clientSecret: cfg?.paypal?.clientSecret || process.env.PAYPAL_CLIENT_SECRET || '',
        mode: cfg?.paypal?.mode || (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox'),
        webhookId: cfg?.paypal?.webhookId || process.env.PAYPAL_WEBHOOK_ID || ''
      },
      venmo: { enabled: !!cfg?.venmo?.enabled },
      wise: { enabled: !!cfg?.wise?.enabled }
    };
    // Development demo defaults when nothing configured
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      if (!base.stripe.secretKey && !base.stripe.publishableKey) {
        base.stripe.enabled = true;
        base.stripe.secretKey = 'demo';
        base.stripe.publishableKey = 'demo';
        base.stripe.webhookSecret = 'demo';
      }
      if (!base.paypal.clientId && !base.paypal.clientSecret) {
        base.paypal.enabled = true;
        base.paypal.clientId = 'demo';
        base.paypal.clientSecret = 'demo';
        base.paypal.mode = 'sandbox';
      }
    }
    return base;
  } catch (_) {
    const fallback = {
      stripe: { enabled: !!process.env.STRIPE_SECRET, secretKey: process.env.STRIPE_SECRET || '', publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '', webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '' },
      paypal: { enabled: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET), clientId: process.env.PAYPAL_CLIENT_ID || '', clientSecret: process.env.PAYPAL_CLIENT_SECRET || '', mode: (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox'), webhookId: process.env.PAYPAL_WEBHOOK_ID || '' },
      venmo: { enabled: false }, wise: { enabled: false }
    };
    if ((process.env.NODE_ENV || 'development') !== 'production' && !fallback.stripe.enabled && !fallback.paypal.enabled) {
      fallback.stripe = { enabled: true, secretKey: 'demo', publishableKey: 'demo', webhookSecret: 'demo' };
      fallback.paypal = { enabled: true, clientId: 'demo', clientSecret: 'demo', mode: 'sandbox' };
    }
    return fallback;
  }
}

const isDemoStripe = (cfg) => cfg?.stripe?.secretKey === 'demo' || cfg?.stripe?.publishableKey === 'demo';
const isDemoPayPal = (cfg) => cfg?.paypal?.clientId === 'demo' || cfg?.paypal?.clientSecret === 'demo';

// ===== Superadmin Payment Config Endpoints =====
router.get('/superadmin/payments-config', auth, requireSuperAdmin, async (req, res) => {
  try {
    const doc = await SiteSetting.findOne({ key: 'paymentConfig' }).lean();
    const cfg = (doc && doc.value) || {};
    const mask = (s) => (typeof s === 'string' && s.length > 4) ? `${'*'.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}` : s || '';
    return res.json({
      stripe: {
        enabled: cfg?.stripe?.enabled !== false,
        publishableKey: cfg?.stripe?.publishableKey || '',
        secretKeyMasked: mask(cfg?.stripe?.secretKey || ''),
        webhookSecretMasked: mask(cfg?.stripe?.webhookSecret || '')
      },
      paypal: {
        enabled: cfg?.paypal?.enabled !== false,
        clientIdMasked: mask(cfg?.paypal?.clientId || ''),
        clientSecretMasked: mask(cfg?.paypal?.clientSecret || ''),
        mode: cfg?.paypal?.mode || 'sandbox',
        webhookIdMasked: mask(cfg?.paypal?.webhookId || '')
      },
      venmo: { enabled: !!cfg?.venmo?.enabled },
      wise: { enabled: !!cfg?.wise?.enabled }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load payment config' });
  }
});

router.put('/superadmin/payments-config', auth, requireSuperAdmin, async (req, res) => {
  try {
    const incoming = req.body || {};
    const existing = await SiteSetting.findOne({ key: 'paymentConfig' });
    const current = existing?.value || {};
    // Merge with safeguards (only known keys)
    const next = { ...current };
    if (incoming.stripe) {
      next.stripe = {
        enabled: incoming.stripe.enabled !== false,
        publishableKey: typeof incoming.stripe.publishableKey === 'string' ? incoming.stripe.publishableKey : (current.stripe?.publishableKey || ''),
        secretKey: typeof incoming.stripe.secretKey === 'string' && incoming.stripe.secretKey.trim() !== '' ? incoming.stripe.secretKey : (current.stripe?.secretKey || ''),
        webhookSecret: typeof incoming.stripe.webhookSecret === 'string' && incoming.stripe.webhookSecret.trim() !== '' ? incoming.stripe.webhookSecret : (current.stripe?.webhookSecret || '')
      };
    }
    if (incoming.paypal) {
      next.paypal = {
        enabled: incoming.paypal.enabled !== false,
        clientId: typeof incoming.paypal.clientId === 'string' && incoming.paypal.clientId.trim() !== '' ? incoming.paypal.clientId : (current.paypal?.clientId || ''),
        clientSecret: typeof incoming.paypal.clientSecret === 'string' && incoming.paypal.clientSecret.trim() !== '' ? incoming.paypal.clientSecret : (current.paypal?.clientSecret || ''),
        mode: (incoming.paypal.mode === 'live' || incoming.paypal.mode === 'sandbox') ? incoming.paypal.mode : (current.paypal?.mode || 'sandbox'),
        webhookId: typeof incoming.paypal.webhookId === 'string' && incoming.paypal.webhookId.trim() !== '' ? incoming.paypal.webhookId : (current.paypal?.webhookId || process.env.PAYPAL_WEBHOOK_ID || '')
      };
    }
    if (incoming.venmo) { next.venmo = { enabled: !!incoming.venmo.enabled }; }
    if (incoming.wise) { next.wise = { enabled: !!incoming.wise.enabled }; }

    const updated = await SiteSetting.findOneAndUpdate(
      { key: 'paymentConfig' },
      { $set: { value: next } },
      { upsert: true, new: true }
    );
    res.json({ message: 'Payment configuration saved' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save payment config' });
  }
});
// @route   GET /api/users/profile
// @desc    Get current user's full profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get additional data based on user role
    let additionalData = {};

    if (user.role === 'artist') {
      // Get artist's songs
      const songs = await Song.find({ artist: user._id, isPublic: true })
        .sort({ createdAt: -1 })
        .select('title duration genre cover plays tips totalTipAmount');

      // Get recent tips received
      const recentTips = await Tip.find({ artist: user._id, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('fan', 'name avatar')
        .populate('song', 'title');

      additionalData = { songs, recentTips };
    } else {
      // Get fan's recent tips sent
      const recentTips = await Tip.find({ fan: user._id, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('artist', 'name avatar')
        .populate('song', 'title');

      additionalData = { recentTips };
    }

    res.json({
      user: user.toPublicJSON(),
      ...additionalData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/profile
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
    .isURL()
    .withMessage('Avatar must be a valid URL')
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
    ).populate('followers', 'name avatar')
     .populate('following', 'name avatar');

    // Calculate profile completion
    user.calculateProfileCompletion();
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/following
// @desc    Get users that current user is following
// @access  Private
router.get('/following', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(req.user._id)
      .populate({
        path: 'following',
        select: 'name avatar bio role isVerified',
        options: {
          skip: (page - 1) * limit,
          limit: limit
        }
      });

    const total = user.following.length;

    res.json({
      following: user.following,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/followers
// @desc    Get users following current user
// @access  Private
router.get('/followers', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(req.user._id)
      .populate({
        path: 'followers',
        select: 'name avatar bio role isVerified',
        options: {
          skip: (page - 1) * limit,
          limit: limit
        }
      });

    const total = user.followers.length;

    res.json({
      followers: user.followers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Place search route BEFORE any param routes to avoid intercepting '/search' as ':id'
// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.q;
    const role = req.query.role;

    if (!search) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Build query
    const query = {
      isActive: true,
      $or: (function() {
        const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return [
          { name: { $regex: safe, $options: 'i' } },
          { bio: { $regex: safe, $options: 'i' } }
        ];
      })()
    };

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('name avatar bio role isVerified')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get public user profile
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .where({ isActive: true })
      .select('name avatar bio role isVerified createdAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get additional data based on user role
    let additionalData = {};

    if (user.role === 'artist') {
      // Get artist's public songs
      const songs = await Song.find({ artist: user._id, isPublic: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title duration genre cover plays tips totalTipAmount');

      additionalData = { songs };
    }

    res.json({
      user: user.toPublicJSON(),
      ...additionalData
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/users/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    // Soft delete - just mark as inactive
    await User.findByIdAndUpdate(req.user._id, { isActive: false });

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== WALLET ENDPOINTS =====

// @route   GET /api/users/wallet/balance
// @desc    Get current user's wallet balance
// @access  Private
router.get('/wallet/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ walletBalance: user.walletBalance });
  } catch (error) {
    console.error('Wallet balance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/users/wallet/topup
// @desc    Initiate wallet top-up (Stripe/PayPal)
// @access  Private
router.post('/wallet/topup', auth, async (req, res) => {
  try {
    const { amount, method, currency } = req.body;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 1) return res.status(400).json({ error: 'Minimum top-up is $1' });
    const cur = (currency || 'usd').toLowerCase();
    if (!['usd','eur','gbp'].includes(cur)) return res.status(400).json({ error: 'Unsupported currency' });
    if (!['stripe', 'paypal'].includes(method)) return res.status(400).json({ error: 'Invalid payment method' });

    // Create a pending transaction record early
    const tx = await WalletTransaction.create({ user: req.user._id, type: 'topup', amount, method, status: 'pending', meta: { currency: cur } });

    if (method === 'stripe') {
      const cfg = await loadPaymentConfig();
      if (isDemoStripe(cfg)) {
        // Demo mode: DO NOT credit wallet. Leave transaction pending.
        await WalletTransaction.updateOne(
          { _id: tx._id },
          { $set: { status: 'pending', meta: { ...tx.meta, simulated: true, note: 'Stripe not configured. No funds credited in demo.' } } }
        );
        return res.json({ clientSecret: 'demo_client_secret', transactionId: tx._id, simulated: true, requiresSetup: true });
      }
      const Stripe = require('stripe');
      const stripe = Stripe(cfg?.stripe?.secretKey || process.env.STRIPE_SECRET || '');
      if (!cfg?.stripe?.secretKey && (process.env.NODE_ENV||'development') === 'production') {
        return res.status(500).json({ error: 'Stripe not configured' });
      }
      const intent = await stripe.paymentIntents.create(
        {
          amount: Math.round(amount * 100),
          currency: cur,
          metadata: { userId: String(req.user._id), walletTxId: String(tx._id), currency: cur },
          automatic_payment_methods: { enabled: true }
        },
        { idempotencyKey: String(tx._id) }
      );
      tx.meta.intentId = intent.id;
      await tx.save();
      return res.json({ clientSecret: intent.client_secret, transactionId: tx._id });
    }

    if (method === 'paypal') {
      const cfg = await loadPaymentConfig();
      if (isDemoPayPal(cfg)) {
        await WalletTransaction.updateOne(
          { _id: tx._id },
          { $set: { status: 'pending', meta: { ...tx.meta, simulated: true, note: 'PayPal not configured. No funds credited in demo.' } } }
        );
        return res.json({ orderId: 'DEMO_ORDER_ID', transactionId: tx._id, approveLinks: [], simulated: true, requiresSetup: true });
      }
      const paypal = require('@paypal/checkout-server-sdk');
      const env = (cfg?.paypal?.mode === 'live')
        ? new paypal.core.LiveEnvironment(cfg?.paypal?.clientId || process.env.PAYPAL_CLIENT_ID || '', cfg?.paypal?.clientSecret || process.env.PAYPAL_CLIENT_SECRET || '')
        : new paypal.core.SandboxEnvironment(cfg?.paypal?.clientId || process.env.PAYPAL_CLIENT_ID || '', cfg?.paypal?.clientSecret || process.env.PAYPAL_CLIENT_SECRET || '');
      const client = new paypal.core.PayPalHttpClient(env);
      const request = new paypal.orders.OrdersCreateRequest();
      request.headers['PayPal-Request-Id'] = String(tx._id);
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: cur.toUpperCase(), value: amount.toFixed(2) } }]
      });
      const order = await client.execute(request);
      tx.meta.orderId = order.result.id;
      await tx.save();
      return res.json({ orderId: order.result.id, transactionId: tx._id, approveLinks: order.result.links });
    }
  } catch (error) {
    console.error('Wallet topup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// @route   POST /api/users/wallet/withdraw
// @desc    Request withdrawal
// @access  Private (Artists only)
router.post('/wallet/withdraw', auth, async (req, res) => {
  try {
    if (req.user.role !== 'artist') {
      return res.status(403).json({ error: 'Only artists can withdraw' });
    }
    const { amount, method, recipient } = req.body;
    const allowed = ['paypal', 'wise', 'venmo', 'cashapp', 'bank'];
    if (!allowed.includes(method)) return res.status(400).json({ error: 'Invalid payout method' });
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 1) return res.status(400).json({ error: 'Minimum withdrawal is $1' });
    if (!recipient || typeof recipient !== 'object') return res.status(400).json({ error: 'Recipient details required' });

    // Validate recipient per method
    if (method === 'paypal' && !recipient.email) return res.status(400).json({ error: 'PayPal email required' });
    if (method === 'wise' && !recipient.iban && !recipient.accountNumber) return res.status(400).json({ error: 'Wise requires IBAN or account number' });
    if (method === 'venmo' && !recipient.username) return res.status(400).json({ error: 'Venmo username required' });
    if (method === 'cashapp' && !recipient.cashtag) return res.status(400).json({ error: 'Cash App $Cashtag required' });
    if (method === 'bank' && (!recipient.accountNumber || !recipient.routingNumber)) return res.status(400).json({ error: 'Bank account and routing number required' });

    const user = await User.findById(req.user._id).select('walletBalance');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.walletBalance < amount) return res.status(400).json({ error: 'Insufficient balance' });

    // Reserve funds and create pending withdrawal (manual fulfillment in dev)
    user.walletBalance -= amount;
    await user.save();
    const tx = await WalletTransaction.create({
      user: req.user._id,
      type: 'withdrawal',
      amount,
      method,
      status: 'pending',
      meta: { recipient }
    });

    res.json({ message: 'Withdrawal requested', withdrawalId: tx._id, newBalance: user.walletBalance });
  } catch (error) {
    console.error('Wallet withdraw error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/users/wallet/tip
// @desc    Tip an artist from wallet
// @access  Private
router.post('/wallet/tip', auth, async (req, res) => {
  try {
    const { artistId, artistName, songId, amount, message } = req.body;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 1) return res.status(400).json({ error: 'Invalid tip request: amount' });
    const fan = await User.findById(req.user._id);
    if (!fan) return res.status(404).json({ error: 'Fan not found' });
    if (fan.walletBalance < amount) return res.status(400).json({ error: 'Insufficient wallet balance' });
    let artist = null;
    const isValidObjectId = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);
    if (artistId && isValidObjectId(artistId)) {
      artist = await User.findById(artistId);
    }
    if (!artist && artistName) {
      const safe = artistName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      artist = await User.findOne({ name: new RegExp('^' + safe + '$', 'i'), role: 'artist' });
    }
    if (!artist || artist.role !== 'artist') return res.status(404).json({ error: 'Artist not found' });
    // Deduct from fan wallet
    fan.walletBalance -= amount;
    await fan.save();
    // Credit artist (90%) — round to two decimals safely
          const artistCredit = Math.round((amount * 0.90) * 100) / 100;
    artist.walletBalance += artistCredit;
    artist.totalEarnings += artistCredit;
    await artist.save();
    // Record tip
    const tip = new Tip({
      fan: fan._id,
      artist: artist._id,
      song: isValidObjectId(songId) ? songId : null,
      amount,
      message: typeof message === 'string' ? message.slice(0, 300) : '',
      status: 'completed',
      paymentMethod: 'wallet'
    });
    console.log('Creating tip with message:', tip.message);
    await tip.save();

    // Grant song library access
    if (isValidObjectId(songId)) {
      // Specific song tipped
      try {
        await LibraryItem.updateOne(
          { user: fan._id, song: songId },
          { $setOnInsert: { user: fan._id, artist: artist._id, song: songId, grantedBy: 'tip' } },
          { upsert: true }
        );
      } catch (e) { /* ignore duplicate key errors */ }
    } else {
      // Artist-level tip: grant access to all current public songs by the artist
      try {
        const artistSongIds = await Song.find({ artist: artist._id, isPublic: true }).distinct('_id');
        for (const sId of artistSongIds) {
          try {
            await LibraryItem.updateOne(
              { user: fan._id, song: sId },
              { $setOnInsert: { user: fan._id, artist: artist._id, song: sId, grantedBy: 'tip' } },
              { upsert: true }
            );
          } catch (_) {}
        }
      } catch (e) { /* ignore */ }
    }
    // Record wallet transaction for fan (debit)
    await WalletTransaction.create({ user: fan._id, type: 'adjustment', amount, method: 'stripe', status: 'completed', meta: { reason: 'tip', artist: artist._id } });
    res.json({ message: 'Tip sent successfully', newBalance: fan.walletBalance });
  } catch (error) {
    console.error('Wallet tip error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/users/wallet/webhook/stripe
// @desc    Stripe webhook to update transaction state
// @access  Public
router.post('/wallet/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const Stripe = require('stripe');
    const cfg = await loadPaymentConfig();
    const stripe = Stripe(cfg?.stripe?.secretKey || process.env.STRIPE_SECRET || '');
    const endpointSecret = cfg?.stripe?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || '';
    if ((process.env.NODE_ENV||'development') === 'production' && (!cfg?.stripe?.secretKey || !endpointSecret)) {
      return res.status(500).json({ error: 'Stripe webhook not configured' });
    }
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Handle the event
    if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      const walletTxId = intent.metadata?.walletTxId;
      if (walletTxId) {
        const tx = await WalletTransaction.findById(walletTxId);
        if (tx) {
          // Idempotency: never credit twice
          if (tx.status === 'completed') {
            return res.json({ received: true, duplicated: true });
          }
          if (event.type === 'payment_intent.succeeded') {
            // Amount/currency sanity check
            const received = Number(intent.amount_received ?? intent.amount ?? 0);
            const expectedCents = Math.round(Number(tx.amount) * 100);
            const currencyOk = !intent.currency || String(intent.currency).toLowerCase() === String(tx.meta?.currency || 'usd');
            if (received >= expectedCents && currencyOk) {
              tx.status = 'completed';
              await User.updateOne({ _id: tx.user }, { $inc: { walletBalance: tx.amount } });
            } else {
              tx.status = 'failed';
            }
          } else {
            tx.status = 'failed';
          }
          tx.meta = { ...tx.meta, intentStatus: intent.status, lastEvent: event.type };
          await tx.save();
        }
      }
    }
    res.json({ received: true });
  } catch (e) {
    res.status(500).json({ error: 'Stripe webhook error' });
  }
});

// @route   POST /api/users/wallet/webhook/paypal
// @desc    PayPal webhook to update transaction state
// @access  Public
router.post('/wallet/webhook/paypal', async (req, res) => {
  try {
    const event = req.body;
    const headers = req.headers || {};
    const cfg = await loadPaymentConfig();
    const webhookId = cfg?.paypal?.webhookId || process.env.PAYPAL_WEBHOOK_ID || '';
    if ((process.env.NODE_ENV || 'development') === 'production' && !webhookId) {
      return res.status(500).json({ error: 'PayPal webhook not configured' });
    }

    let verified = false;
    try {
      const paypal = require('@paypal/checkout-server-sdk');
      const env = (cfg?.paypal?.mode === 'live')
        ? new paypal.core.LiveEnvironment(cfg?.paypal?.clientId || process.env.PAYPAL_CLIENT_ID || '', cfg?.paypal?.clientSecret || process.env.PAYPAL_CLIENT_SECRET || '')
        : new paypal.core.SandboxEnvironment(cfg?.paypal?.clientId || process.env.PAYPAL_CLIENT_ID || '', cfg?.paypal?.clientSecret || process.env.PAYPAL_CLIENT_SECRET || '');
      const client = new paypal.core.PayPalHttpClient(env);
      if (webhookId) {
        const request = new paypal.notifications.VerifyWebhookSignatureRequest();
        request.requestBody({
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: event
        });
        const response = await client.execute(request);
        verified = response?.result?.verification_status === 'SUCCESS';
      }
    } catch (e) {
      // If verification call fails, do not trust the event in production
      if ((process.env.NODE_ENV || 'development') === 'production') {
        return res.status(400).json({ error: 'PayPal webhook verification failed' });
      }
    }

    if ((process.env.NODE_ENV || 'development') === 'production' && !verified) {
      return res.status(400).json({ error: 'Invalid PayPal webhook signature' });
    }

    const orderId = event?.resource?.id;
    const status = event?.resource?.status;
    if (!orderId) return res.json({});
    const tx = await WalletTransaction.findOne({ 'meta.orderId': orderId });
    if (tx) {
      if (status === 'COMPLETED') {
        tx.status = 'completed';
        await User.updateOne({ _id: tx.user }, { $inc: { walletBalance: tx.amount } });
      } else if (status === 'VOIDED' || status === 'DECLINED') {
        tx.status = 'failed';
      } else {
        tx.status = 'processing';
      }
      tx.meta = { ...tx.meta, lastEvent: status };
      await tx.save();
    }
    res.json({ received: true });
  } catch (e) {
    res.status(500).json({ error: 'PayPal webhook error' });
  }
});

// ===== SUPERADMIN ROUTES =====

// Get all users (superadmin only)
router.get('/superadmin/all', auth, requireSuperAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update any user (superadmin only) — forbids direct password changes
router.put('/superadmin/user/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const disallowed = ['password', 'passwordHistory', 'passwordResetToken', 'passwordResetExpires', 'sessionTokens', '__proto__', 'prototype', 'constructor'];
    const payload = { ...req.body };
    disallowed.forEach(k => { if (k in payload) delete payload[k]; });
    const user = await User.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Set user active status (activate/deactivate)
router.patch('/superadmin/user/:id/status', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive must be boolean' });
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Status updated', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Reset user password (secure, triggers hashing via save hook)
router.post('/superadmin/user/:id/reset-password', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (typeof password !== 'string' || password.length < 12) {
      return res.status(400).json({ error: 'Password must be at least 12 characters and strong' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.password = password; // pre-save hook will hash and update history
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Clear user sessions (force logout everywhere)
router.post('/superadmin/user/:id/sessions/clear', auth, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.sessionTokens = [];
    await user.save();
    res.json({ message: 'Sessions cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear sessions' });
  }
});

// Delete any user (superadmin only)
router.delete('/superadmin/user/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot delete superadmin accounts' });
    }
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Bulk ensure artists exist (superadmin only)
// @route   POST /api/users/superadmin/ensure-artists
// @body    { names: string[], createSampleSong?: boolean }
router.post('/superadmin/ensure-artists', auth, requireSuperAdmin, async (req, res) => {
  try {
    const names = Array.isArray(req.body.names) ? req.body.names : [];
    const createSampleSong = !!req.body.createSampleSong;
    if (names.length === 0) return res.status(400).json({ error: 'names array required' });

    const results = [];
    for (const rawName of names) {
      const name = String(rawName).trim();
      if (!name) continue;
      let artist = await User.findOne({ name: new RegExp('^' + name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '$', 'i') });
      if (!artist) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const email = `${slug}@musicbae.com`;
        artist = await User.create({
          name,
          email,
          password: generateStrongPassword(),
          role: 'artist',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          bio: `${name} artist on MusicBae.`
        });
        if (createSampleSong) {
          await Song.create({
            title: 'Sample Track',
            genre: 'Indie',
            duration: 180,
            cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
            audioFile: '/uploads/sample-audio-1.mp3',
            isPublic: true,
            artist: artist._id
          });
        }
        results.push({ name, created: true, id: artist._id });
      } else {
        results.push({ name, created: false, id: artist._id });
      }
    }
    res.json({ message: 'Ensure completed', results });
  } catch (error) {
    console.error('Ensure artists error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Adjust wallet balance (superadmin only)
router.post('/superadmin/user/:id/wallet', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { amount } = req.body;
    if (typeof amount !== 'number' || !Number.isFinite(amount)) return res.status(400).json({ error: 'Amount must be a finite number' });
    if (amount < 0) return res.status(400).json({ error: 'Amount cannot be negative' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.walletBalance = amount;
    await user.save();
    res.json({ message: 'Wallet balance updated', walletBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update wallet balance' });
  }
});

// Get site stats (superadmin only)
router.get('/superadmin/stats', auth, requireSuperAdmin, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const artistCount = await User.countDocuments({ role: 'artist' });
    const fanCount = await User.countDocuments({ role: 'fan' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    const superadminCount = await User.countDocuments({ role: 'superadmin' });
    const totalWallet = await User.aggregate([{ $group: { _id: null, total: { $sum: '$walletBalance' } } }]);
    res.json({
      userCount,
      artistCount,
      fanCount,
      adminCount,
      superadminCount,
      totalWallet: totalWallet[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Superadmin dashboard summary: metrics, latest users, latest payments
router.get('/superadmin/summary', auth, requireSuperAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      artistCount,
      fanCount,
      adminCount,
      superadminCount,
      songsCount,
      tipsCompletedCount,
      tipsCompletedSum,
      topupsCompletedCount,
      withdrawalsPendingCount,
      totalWalletAgg,
      recentUsers,
      recentTips,
      recentTopups,
      onlineUsersCount
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'artist' }),
      User.countDocuments({ role: 'fan' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'superadmin' }),
      require('../models/Song').countDocuments(),
      Tip.countDocuments({ status: 'completed' }),
      Tip.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
      WalletTransaction.countDocuments({ type: 'topup', status: 'completed' }),
      WalletTransaction.countDocuments({ type: 'withdrawal', status: 'pending' }),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$walletBalance' } } }]),
      User.find().sort({ createdAt: -1 }).limit(6).select('name email role isActive createdAt'),
      Tip.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(10).select('amount createdAt fan artist').populate('fan','name email').populate('artist','name'),
      WalletTransaction.find({ type: 'topup', status: 'completed' }).sort({ createdAt: -1 }).limit(10).select('amount method createdAt user').populate('user','name email'),
      (async ()=>{ const since = new Date(Date.now() - 15*60*1000); return User.countDocuments({ 'sessionTokens.lastUsed': { $gte: since } }); })()
    ]);

    const totalTipsAmount = (tipsCompletedSum?.[0]?.sum || 0);
    const tipsGrossUsd = Math.round(totalTipsAmount * 100) / 100;
    const earnedUsd = Math.round((totalTipsAmount * 0.90) * 100) / 100; // artist credited

    // Compose recent payments (tips and topups)
    const payments = [
      ...recentTips.map(t => ({
        id: t._id,
        type: 'tip',
        user: t.fan?.name || 'Anonymous',
        detail: t.artist?.name || '',
        amount: t.amount,
        method: 'wallet',
        createdAt: t.createdAt
      })),
      ...recentTopups.map(w => ({
        id: w._id,
        type: 'topup',
        user: w.user?.name || 'User',
        detail: w.method?.toUpperCase?.() || w.method,
        amount: w.amount,
        method: w.method,
        createdAt: w.createdAt
      }))
    ].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    res.json({
      metrics: {
        totalUsers,
        artistCount,
        fanCount,
        adminCount,
        superadminCount,
        songsCount,
        tipsCompletedCount,
        tipsGrossUsd,
        withdrawalsPendingCount,
        totalWallet: totalWalletAgg?.[0]?.total || 0,
        earnedUsd,
        onlineUsers: onlineUsersCount
      },
      latestUsers: recentUsers.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role, isActive: u.isActive, createdAt: u.createdAt })),
      latestPayments: payments
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Site settings: homepage content
// @route   GET /api/users/superadmin/homepage
// @access  Private (Superadmin)
router.get('/superadmin/homepage', auth, requireSuperAdmin, async (req, res) => {
  try {
    const doc = await SiteSetting.findOne({ key: 'homepage' });
    // Prevent prototype pollution in stored values
    if (doc && doc.value && typeof doc.value === 'object') {
      delete doc.value.__proto__;
      delete doc.value.constructor;
      delete doc.value.prototype;
    }
    res.json({ homepage: doc?.value || {} });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load homepage' });
  }
});

// @route   PUT /api/users/superadmin/homepage
// @access  Private (Superadmin)
router.put('/superadmin/homepage', auth, requireSuperAdmin, async (req, res) => {
  try {
    const payload = req.body || {};
    // Shallow sanitize payload keys to avoid prototype pollution
    ['__proto__','constructor','prototype'].forEach(k=>{ if (k in payload) delete payload[k]; });
    const updated = await SiteSetting.findOneAndUpdate(
      { key: 'homepage' },
      { $set: { value: payload } },
      { upsert: true, new: true }
    );
    res.json({ message: 'Homepage updated', homepage: updated.value });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update homepage' });
  }
});

// Site settings: homepage texts (key-value)
// @route   GET /api/users/superadmin/homepage-texts
// @access  Private (Superadmin)
router.get('/superadmin/homepage-texts', auth, requireSuperAdmin, async (req, res) => {
  try {
    const doc = await SiteSetting.findOne({ key: 'homepageTexts' });
    if (doc && doc.value && typeof doc.value === 'object') {
      delete doc.value.__proto__;
      delete doc.value.constructor;
      delete doc.value.prototype;
    }
    res.json({ texts: doc?.value || {} });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load homepage texts' });
  }
});

// @route   PUT /api/users/superadmin/homepage-texts
// @access  Private (Superadmin)
router.put('/superadmin/homepage-texts', auth, requireSuperAdmin, async (req, res) => {
  try {
    const texts = req.body && typeof req.body === 'object' ? req.body : {};
    ['__proto__','constructor','prototype'].forEach(k=>{ if (k in texts) delete texts[k]; });
    const updated = await SiteSetting.findOneAndUpdate(
      { key: 'homepageTexts' },
      { $set: { value: texts } },
      { upsert: true, new: true }
    );
    res.json({ message: 'Homepage texts updated', texts: updated.value });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update homepage texts' });
  }
});

// ===== WITHDRAWAL ADMIN (SUPERADMIN) =====
// List withdrawal requests
router.get('/superadmin/withdrawals', auth, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const status = req.query.status;
    const method = req.query.method;
    const filter = { type: 'withdrawal' };
    if (status) filter.status = status;
    if (method) filter.method = method;
    const total = await WalletTransaction.countDocuments(filter);
    const txs = await WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email role');
    res.json({
      withdrawals: txs.map(t => ({
        id: t._id,
        user: t.user,
        amount: t.amount,
        method: t.method,
        status: t.status,
        meta: t.meta,
        proofUrl: t.meta?.proofUrl,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      })),
      pagination: { page, limit, total, pages: Math.ceil(total/limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// Update a withdrawal (status, proof)
router.patch('/superadmin/withdrawals/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { status, proofUrl, note } = req.body;
    const tx = await WalletTransaction.findById(req.params.id);
    if (!tx || tx.type !== 'withdrawal') return res.status(404).json({ error: 'Withdrawal not found' });
    if (status && !['pending','processing','completed','failed','refunded'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    // Basic state machine
    if (status) tx.status = status;
    tx.meta = { ...(tx.meta||{}), proofUrl: proofUrl || tx.meta?.proofUrl, note: note || tx.meta?.note };
    await tx.save();
    res.json({ message: 'Withdrawal updated', withdrawal: {
      id: tx._id,
      status: tx.status,
      proofUrl: tx.meta?.proofUrl,
      note: tx.meta?.note
    }});
  } catch (error) {
    res.status(500).json({ error: 'Failed to update withdrawal' });
  }
});

// ===== FAN DASHBOARD ENDPOINTS =====
// @route   GET /api/users/fan/wallet-transactions
// @desc    Get fan's wallet transactions (top-ups only for wallet tab)
// @access  Private (Fans only)
router.get('/fan/wallet-transactions', auth, async (req, res) => {
  try {
    if (req.user.role !== 'fan') {
      return res.status(403).json({ error: 'Access denied. Fan role required.' });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const txs = await WalletTransaction.find({ user: req.user._id, type: 'topup' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await WalletTransaction.countDocuments({ user: req.user._id, type: 'topup' });
    res.json({
      transactions: txs.map(t => ({
        id: t._id,
        amount: t.amount,
        method: t.method,
        status: t.status,
        date: t.createdAt
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/artist/dashboard
// @desc    Get artist dashboard data
// @access  Private (Artists only)
router.get('/artist/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'artist') {
      return res.status(403).json({ error: 'Access denied. Artist role required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get artist's songs with minimal fields for performance
    const songs = await Song.find({ artist: user._id })
      .select('title genre duration plays cover tips totalTipAmount createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Get recent tips received (last 20 for performance)
    const recentTips = await Tip.find({ 
      artist: user._id, 
      status: 'completed' 
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('fan song amount createdAt status message isAnonymous')
      .populate('fan', 'name')
      .populate('song', 'title')
      .lean();

    // Calculate statistics efficiently
    const totalEarnings = recentTips.reduce((sum, tip) => sum + tip.amount, 0);
    const totalSongs = songs.length;
    const totalPlays = songs.reduce((sum, song) => sum + (song.plays || 0), 0);
    const totalTips = recentTips.length;

    // Calculate monthly growth (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const currentMonthTips = await Tip.aggregate([
      { $match: { artist: user._id, status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const previousMonthTips = await Tip.aggregate([
      { $match: { artist: user._id, status: 'completed', createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const currentMonthTotal = currentMonthTips[0]?.total || 0;
    const previousMonthTotal = previousMonthTips[0]?.total || 0;
    const monthlyGrowth = previousMonthTotal > 0 ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0;

    res.json({
      user: user.toPublicJSON(),
      stats: {
        totalEarnings: user.totalEarnings || 0,
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
        totalSongs,
        totalPlays,
        totalTips,
        totalFollowers: user.followers?.length || 0
      },
      songs: songs.map(song => ({
        id: song._id,
        title: song.title,
        genre: song.genre,
        duration: song.duration,
        plays: song.plays || 0,
        cover: song.cover,
        tips: song.tips || 0,
        totalTipAmount: song.totalTipAmount || 0,
        createdAt: song.createdAt
      })),
      recentTips: recentTips.map(tip => ({
        id: tip._id,
        fan: tip.fan?.name || 'Anonymous',
        song: tip.song?.title || 'General Tip',
        amount: tip.amount,
        date: tip.createdAt,
        status: tip.status,
        message: tip.message,
        isAnonymous: tip.isAnonymous
      }))
    });
  } catch (error) {
    console.error('Get artist dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/fan/dashboard
// @desc    Get fan dashboard data
// @access  Private (Fans only)
router.get('/fan/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'fan') {
      return res.status(403).json({ error: 'Access denied. Fan role required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get favorite artists with minimal fields first (faster)
    const favoriteArtists = await User.find({ 
      _id: { $in: user.following }, 
      role: 'artist', 
      isActive: true 
    })
      .select('name avatar bio isVerified followers totalEarnings')
      .lean();

    // Get tips sent by the fan (recent 10 for overview) - optimized query
    const tipsSent = await Tip.find({ 
      fan: user._id, 
      status: 'completed' 
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('artist song amount createdAt status message')
      .populate('artist', 'name')
      .populate('song', 'title')
      .lean();

    // Get songs from artists the fan follows (song library) - optimized query
    const ownedSongIds = await LibraryItem.find({ user: user._id }).distinct('song');
    const songLibrary = await Song.find({ _id: { $in: ownedSongIds } })
      .sort({ createdAt: -1 })
      .select('title genre duration plays cover tips totalTipAmount artist')
      .populate('artist', 'name')
      .lean();

    // Calculate statistics
    const totalTips = tipsSent.reduce((sum, tip) => sum + tip.amount, 0);
    const totalSongs = songLibrary.length;
    const totalArtists = favoriteArtists.length;

    res.json({
      user: user.toPublicJSON(),
      stats: {
        walletBalance: user.walletBalance || 0,
        totalTips,
        totalSongs,
        totalArtists
      },
      favoriteArtists: favoriteArtists.map(artist => ({
        id: artist._id,
        name: artist.name,
        avatar: artist.avatar,
        followers: artist.followers?.length || 0,
        songs: 0, // Will be calculated separately if needed
        bio: artist.bio,
        isVerified: artist.isVerified,
        totalEarnings: artist.totalEarnings || 0
      })),
      tipsHistory: tipsSent.map(tip => ({
        id: tip._id,
        artist: tip.artist?.name || 'Unknown Artist',
        song: tip.song?.title || 'General Tip',
        amount: tip.amount,
        date: tip.createdAt,
        status: tip.status,
        message: tip.message
      })),
      songLibrary: songLibrary.map(song => ({
        id: song._id,
        title: song.title,
        artist: song.artist?.name || 'Unknown Artist',
        genre: song.genre,
        duration: song.duration,
        plays: song.plays || 0,
        cover: song.cover,
        tips: song.tips || 0,
        totalTipAmount: song.totalTipAmount || 0
      }))
    });
  } catch (error) {
    console.error('Get fan dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/fan/favorite-artists
// @desc    Get fan's favorite artists with detailed info
// @access  Private (Fans only)
router.get('/fan/favorite-artists', auth, async (req, res) => {
  try {
    if (req.user.role !== 'fan') {
      return res.status(403).json({ error: 'Access denied. Fan role required.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const favoriteArtists = await User.find({ _id: { $in: user.following } })
      .where({ role: 'artist', isActive: true })
      .select('name avatar bio followers totalEarnings isVerified createdAt')
      .populate('followers', 'name')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ name: 1 });

    // Get song count for each artist
    const artistsWithSongs = await Promise.all(
      favoriteArtists.map(async (artist) => {
        const songCount = await Song.countDocuments({ 
          artist: artist._id, 
          isPublic: true 
        });
        
        return {
          id: artist._id,
          name: artist.name,
          avatar: artist.avatar,
          followers: artist.followers.length,
          songs: songCount,
          bio: artist.bio,
          isVerified: artist.isVerified,
          totalEarnings: artist.totalEarnings,
          joinedDate: artist.createdAt
        };
      })
    );

    const total = user.following.length;

    res.json({
      favoriteArtists: artistsWithSongs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get favorite artists error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/fan/song-library
// @desc    Get fan's song library (songs from followed artists)
// @access  Private (Fans only)
router.get('/fan/song-library', auth, async (req, res) => {
  try {
    if (req.user.role !== 'fan') {
      return res.status(403).json({ error: 'Access denied. Fan role required.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const genre = req.query.genre;
    const search = req.query.search;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build query: songs the user owns via tipping OR public songs from followed artists
    const ownedSongIds = await LibraryItem.find({ user: user._id }).distinct('song');
    const query = { _id: { $in: ownedSongIds } };

    if (genre) {
      query.genre = { $regex: genre, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { genre: { $regex: search, $options: 'i' } }
      ];
    }

    const songLibrary = await Song.find(query)
      .sort({ createdAt: -1 })
      .populate('artist', 'name avatar')
      .select('title genre duration plays cover tips totalTipAmount createdAt')
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Song.countDocuments(query);

    res.json({
      songLibrary: songLibrary.map(song => ({
        id: song._id,
        title: song.title,
        artist: song.artist?.name || 'Unknown Artist',
        artistId: song.artist._id,
        genre: song.genre,
        duration: song.duration,
        plays: song.plays,
        cover: song.cover,
        tips: song.tips,
        totalTipAmount: song.totalTipAmount,
        addedDate: song.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get song library error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/fan/tips-history
// @desc    Get fan's complete tips history
// @access  Private (Fans only)
router.get('/fan/tips-history', auth, async (req, res) => {
  try {
    if (req.user.role !== 'fan') {
      return res.status(403).json({ error: 'Access denied. Fan role required.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status && req.query.status !== 'undefined' ? req.query.status : undefined;

    const query = { fan: req.user._id };
    if (status) {
      query.status = status;
    }

    const tipsHistory = await Tip.find(query)
      .sort({ createdAt: -1 })
      .populate('artist', 'name avatar')
      .populate('song', 'title cover')
      .skip((page - 1) * limit)
      .limit(limit);

    console.log('Tips history found:', tipsHistory.map(t => ({ id: t._id, message: t.message, reaction: t.reaction })));

    const total = await Tip.countDocuments(query);

    res.json({
      tipsHistory: tipsHistory.map(tip => ({
        id: tip._id,
        artist: tip.artist.name,
        artistId: tip.artist._id,
        song: tip.song?.title || 'General Tip',
        songId: tip.song?._id,
        amount: tip.amount,
        date: tip.createdAt,
        status: tip.status,
        message: tip.message,
        reaction: tip.reaction,
        isAnonymous: tip.isAnonymous,
        paymentMethod: tip.paymentMethod
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tips history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/profile/complete
// @desc    Complete user profile with additional details
// @access  Private
router.put('/profile/complete', auth, [
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
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  body('profileVisibility')
    .optional()
    .isIn(['public', 'followers', 'private'])
    .withMessage('Invalid profile visibility'),
  body('allowMessages')
    .optional()
    .isBoolean()
    .withMessage('allowMessages must be a boolean'),
  body('showOnlineStatus')
    .optional()
    .isBoolean()
    .withMessage('showOnlineStatus must be a boolean'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot be more than 100 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  body('socialLinks')
    .optional()
    .isObject()
    .withMessage('Social links must be an object'),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      bio,
      avatar,
      profileVisibility,
      allowMessages,
      showOnlineStatus,
      location,
      website,
      socialLinks,
      preferences
    } = req.body;

    const updateFields = {};

    if (name) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (avatar) updateFields.avatar = avatar;
    if (profileVisibility) updateFields.profileVisibility = profileVisibility;
    if (allowMessages !== undefined) updateFields.allowMessages = allowMessages;
    if (showOnlineStatus !== undefined) updateFields.showOnlineStatus = showOnlineStatus;
    if (location !== undefined) updateFields.location = location;
    if (website !== undefined) updateFields.website = website;
    if (socialLinks) updateFields.socialLinks = socialLinks;
    if (preferences) updateFields.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('followers', 'name avatar')
     .populate('following', 'name avatar');

    res.json({
      message: 'Profile updated successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 