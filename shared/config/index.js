require('dotenv').config();

module.exports = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',

  // Shopify
  shopify: {
    storeUrl: process.env.SHOPIFY_STORE_URL,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET,
    apiVersion: process.env.SHOPIFY_ADMIN_API_VERSION || '2024-01',
  },

  // AI Services
  ai: {
    openaiKey: process.env.OPENAI_API_KEY,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    contentModel: process.env.CONTENT_GENERATION_MODEL || 'gpt-4',
  },

  // Database
  database: {
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/aiecommerce',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Marketing Integrations
  marketing: {
    meta: {
      accessToken: process.env.META_ACCESS_TOKEN,
      adAccountId: process.env.META_AD_ACCOUNT_ID,
    },
    google: {
      clientId: process.env.GOOGLE_ADS_CLIENT_ID,
      clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    },
    tiktok: {
      accessToken: process.env.TIKTOK_ACCESS_TOKEN,
    },
    klaviyo: {
      apiKey: process.env.KLAVIYO_API_KEY,
    },
  },

  // n8n
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL,
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    encryptionKey: process.env.ENCRYPTION_KEY,
  },

  // Feature Flags
  features: {
    dynamicPricing: process.env.ENABLE_DYNAMIC_PRICING === 'true',
    aiContent: process.env.ENABLE_AI_CONTENT === 'true',
    autoPosting: process.env.ENABLE_AUTO_POSTING === 'true',
    supportBot: process.env.ENABLE_SUPPORT_BOT === 'true',
  },

  // Pricing Engine
  pricing: {
    minMultiplier: parseFloat(process.env.MIN_PRICE_MULTIPLIER) || 0.8,
    maxMultiplier: parseFloat(process.env.MAX_PRICE_MULTIPLIER) || 1.5,
    updateFrequency: parseInt(process.env.PRICE_UPDATE_FREQUENCY) || 3600000, // 1 hour
  },

  // Content Generation
  content: {
    maxDailyPosts: parseInt(process.env.MAX_DAILY_POSTS) || 10,
    reviewMode: process.env.CONTENT_REVIEW_MODE || 'auto',
  },

  // Support Bot
  support: {
    language: process.env.SUPPORT_BOT_LANGUAGE || 'en',
    escalationThreshold: parseFloat(process.env.SUPPORT_ESCALATION_THRESHOLD) || 0.7,
  },
};
