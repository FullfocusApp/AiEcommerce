const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  shopifyId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  firstName: String,
  lastName: String,
  phone: String,
  // AI-powered segmentation
  segment: {
    type: String,
    enum: ['vip', 'loyal', 'at-risk', 'new', 'one-time', 'churned'],
    default: 'new',
  },
  lifetimeValue: {
    type: Number,
    default: 0,
  },
  predictedLTV: Number,
  churnRisk: {
    type: Number,
    min: 0,
    max: 1,
    default: 0,
  },
  // Purchase behavior
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  averageOrderValue: { type: Number, default: 0 },
  lastOrderDate: Date,
  firstOrderDate: Date,
  daysSinceLastOrder: Number,
  // Preferences
  preferences: {
    productCategories: [String],
    priceRange: {
      min: Number,
      max: Number,
    },
    favoriteProducts: [String],
  },
  // Marketing
  marketing: {
    emailOptIn: { type: Boolean, default: true },
    smsOptIn: { type: Boolean, default: false },
    lastEmailSent: Date,
    lastSmsSent: Date,
    engagementScore: { type: Number, default: 0 },
  },
  // AI interactions
  aiInteractions: [{
    type: { type: String },
    content: String,
    sentiment: String,
    timestamp: Date,
  }],
  // Metadata
  lastSyncedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

customerSchema.index({ shopifyId: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ segment: 1 });
customerSchema.index({ lifetimeValue: -1 });
customerSchema.index({ churnRisk: -1 });

module.exports = mongoose.model('Customer', customerSchema);
