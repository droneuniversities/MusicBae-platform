const mongoose = require('mongoose');

const libraryItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true,
    index: true
  },
  grantedBy: {
    type: String,
    enum: ['tip', 'purchase', 'admin', 'promo'],
    default: 'tip'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a song is only added once per user
libraryItemSchema.index({ user: 1, song: 1 }, { unique: true });

// Additional performance indexes for dashboard queries
libraryItemSchema.index({ user: 1, createdAt: -1 });
libraryItemSchema.index({ artist: 1, createdAt: -1 });
libraryItemSchema.index({ user: 1, artist: 1 });

module.exports = mongoose.model('LibraryItem', libraryItemSchema);


