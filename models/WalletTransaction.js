const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['topup', 'withdrawal', 'adjustment'], required: true, index: true },
  amount: { type: Number, required: true, min: 0.01 },
  method: { type: String, enum: ['stripe', 'paypal', 'wise', 'venmo', 'cashapp', 'bank', 'crypto'], default: 'stripe' },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], default: 'pending', index: true },
  meta: { type: Object, default: {} }
}, {
  timestamps: true
});

walletTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);


