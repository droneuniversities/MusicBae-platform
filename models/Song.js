const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Song title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Artist is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 second']
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    enum: [
      'Pop', 'Rock', 'Hip Hop', 'Jazz', 'Classical', 'Country', 
      'Electronic', 'R&B', 'Metal', 'Folk', 'Blues', 'Reggae', 
      'Punk', 'Ambient', 'Latin', 'Gospel', 'Indie', 'World', 
      'Alternative', 'EDM'
    ]
  },
  previewSong: {
    type: String,
    required: [true, 'Preview song is required']
  },
  completeSongMp3: {
    type: String,
    required: [true, 'Complete song MP3 is required']
  },
  completeSongWav: {
    type: String,
    default: null
  },
  cover: {
    type: String,
    default: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
    default: ''
  },
  plays: {
    type: Number,
    default: 0
  },
  tips: {
    type: Number,
    default: 0
  },
  totalTipAmount: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isExplicit: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot be more than 20 characters']
  }],
  releaseDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
songSchema.index({ artist: 1 });
songSchema.index({ genre: 1 });
songSchema.index({ plays: -1 });
songSchema.index({ tips: -1 });
songSchema.index({ releaseDate: -1 });
songSchema.index({ title: 'text', description: 'text' });

// Additional performance indexes for dashboard queries
songSchema.index({ artist: 1, isPublic: 1 });
songSchema.index({ artist: 1, isPublic: 1, createdAt: -1 });
songSchema.index({ artist: 1, isPublic: 1, genre: 1 });
songSchema.index({ isPublic: 1, createdAt: -1 });
songSchema.index({ isPublic: 1, genre: 1 });

// Virtual for formatted duration
songSchema.virtual('formattedDuration').get(function() {
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for average tip amount
songSchema.virtual('averageTip').get(function() {
  return this.tips > 0 ? (this.totalTipAmount / this.tips).toFixed(2) : 0;
});

// Method to increment plays
songSchema.methods.incrementPlays = function() {
  // Debounce rapid increments by grouping into a single atomic update
  return this.updateOne({ $inc: { plays: 1 } });
};

// Method to add tip
songSchema.methods.addTip = function(amount) {
  this.tips += 1;
  this.totalTipAmount += amount;
  return this.save();
};

// Method to get public song data
songSchema.methods.toPublicJSON = function() {
  const songObject = this.toObject();
  songObject.formattedDuration = this.formattedDuration;
  songObject.averageTip = this.averageTip;
  return songObject;
};

module.exports = mongoose.model('Song', songSchema); 