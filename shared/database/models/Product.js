const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  shopifyId: {
    type: String,
    required: true,
    unique: true,
  },
  title: String,
  description: String,
  price: Number,
  compareAtPrice: Number,
  cost: Number,
  vendor: String,
  productType: String,
  tags: [String],
  images: [{
    src: String,
    alt: String,
  }],
  variants: [{
    variantId: String,
    sku: String,
    price: Number,
    inventoryQuantity: Number,
  }],
  // AI-enhanced data
  aiGeneratedDescription: String,
  seoKeywords: [String],
  targetAudience: String,
  // Pricing data
  priceHistory: [{
    price: Number,
    timestamp: Date,
    reason: String,
  }],
  dynamicPricing: {
    enabled: { type: Boolean, default: true },
    minPrice: Number,
    maxPrice: Number,
    currentMultiplier: { type: Number, default: 1.0 },
  },
  // Analytics
  analytics: {
    views: { type: Number, default: 0 },
    addToCarts: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
  },
  // Metadata
  lastSyncedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

productSchema.index({ shopifyId: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ 'analytics.conversionRate': -1 });

module.exports = mongoose.model('Product', productSchema);
