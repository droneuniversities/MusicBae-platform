const mongoose = require('mongoose');

const tipSchema = new mongoose.Schema({
  fan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Fan is required']
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Artist is required']
  },
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: false,
    default: null
  },
  amount: {
    type: Number,
    required: [true, 'Tip amount is required'],
    min: [0.01, 'Tip amount must be at least $0.01']
  },
  message: {
    type: String,
    maxlength: [200, 'Message cannot be more than 200 characters'],
    default: ''
  },
  reaction: {
    type: String,
    maxlength: [10, 'Reaction must be a single emoji'],
    default: null
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'crypto', 'wallet'],
    default: 'stripe'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
tipSchema.index({ fan: 1 });
tipSchema.index({ artist: 1 });
tipSchema.index({ song: 1 });
tipSchema.index({ status: 1 });
tipSchema.index({ createdAt: -1 });
tipSchema.index({ amount: -1 });

// Additional performance indexes for dashboard queries
tipSchema.index({ artist: 1, status: 1 });
tipSchema.index({ artist: 1, status: 1, createdAt: -1 });
tipSchema.index({ fan: 1, status: 1 });
tipSchema.index({ fan: 1, status: 1, createdAt: -1 });
tipSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted amount
tipSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Pre-save middleware to update user totals
tipSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'completed') {
    // Update fan's total tips given
    await mongoose.model('User').findByIdAndUpdate(
      this.fan,
      { $inc: { totalTips: this.amount } }
    );
    
    // Update song's tip count and total
    if (this.song) {
      await mongoose.model('Song').findByIdAndUpdate(
        this.song,
        { 
          $inc: { 
            tips: 1,
            totalTipAmount: this.amount
          }
        }
      );
    }
  }
  next();
});

// Static method to get tips by artist
tipSchema.statics.getByArtist = function(artistId, limit = 20) {
  return this.find({ artist: artistId, status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('fan', 'name avatar')
    .populate('song', 'title cover');
};

// Static method to get tips by fan
tipSchema.statics.getByFan = function(fanId, limit = 20) {
  return this.find({ fan: fanId, status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('artist', 'name avatar')
    .populate('song', 'title cover');
};

// Static method to get tips by song
tipSchema.statics.getBySong = function(songId, limit = 20) {
  return this.find({ song: songId, status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('fan', 'name avatar')
    .populate('artist', 'name avatar');
};

// Method to get public tip data
tipSchema.methods.toPublicJSON = function() {
  const tipObject = this.toObject();
  tipObject.formattedAmount = this.formattedAmount;
  
  // Hide fan info if anonymous
  if (this.isAnonymous) {
    tipObject.fan = { name: 'Anonymous', avatar: null };
  }
  
  return tipObject;
};

// Method to get tip data for artist view (always anonymous)
tipSchema.methods.toArtistJSON = function() {
  const tipObject = this.toObject();
  tipObject.formattedAmount = this.formattedAmount;
  
  // Always hide fan info for artist view
  tipObject.fan = { name: 'Anonymous Fan', avatar: null };
  
  console.log('Converting tip to artist JSON:', { id: tipObject._id, message: tipObject.message, hasMessage: !!tipObject.message });
  
  return tipObject;
};

module.exports = mongoose.model('Tip', tipSchema); 