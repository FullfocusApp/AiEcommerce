const express = require('express');
const config = require('../../shared/config');
const database = require('../../shared/database');
const ContentGenerator = require('./contentGenerator');
const SocialPostScheduler = require('./socialPostScheduler');
const AdCopyGenerator = require('./adCopyGenerator');

const app = express();
app.use(express.json());

let contentGenerator;
let socialScheduler;
let adCopyGen;

async function initialize() {
  console.log('🤖 Starting AI Content Engine...');

  try {
    await database.connectAll();

    contentGenerator = new ContentGenerator();
    socialScheduler = new SocialPostScheduler();
    adCopyGen = new AdCopyGenerator();

    console.log('✅ AI Content Engine initialized');

    // Start scheduled content generation if enabled
    if (config.features.aiContent) {
      startScheduledGeneration();
    }
  } catch (error) {
    console.error('❌ Failed to initialize AI Content Engine:', error);
    process.exit(1);
  }
}

function startScheduledGeneration() {
  const cron = require('node-cron');

  // Generate daily content at 8 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('🎨 Generating daily content...');
    await generateDailyContent();
  });

  console.log('⏰ Scheduled content generation configured');
}

async function generateDailyContent() {
  try {
    const Product = require('../../shared/database/models/Product');

    // Get top products to feature
    const topProducts = await Product.find({})
      .sort({ 'analytics.conversionRate': -1 })
      .limit(5);

    for (const product of topProducts) {
      // Generate UGC-style content
      const ugcContent = await contentGenerator.generateUGCContent(product);

      // Generate social posts
      const socialPosts = await contentGenerator.generateSocialPosts(product, 'feminine-luxury');

      // Schedule posts
      await socialScheduler.schedulePost(socialPosts);

      console.log(`✅ Content generated for: ${product.title}`);
    }
  } catch (error) {
    console.error('❌ Daily content generation error:', error);
  }
}

// API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-content-engine',
    timestamp: new Date().toISOString(),
  });
});

// Generate UGC content for product
app.post('/api/content/ugc', async (req, res) => {
  try {
    const { productId, style } = req.body;
    const Product = require('../../shared/database/models/Product');

    const product = await Product.findOne({ shopifyId: productId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const content = await contentGenerator.generateUGCContent(product, style);
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate social media posts
app.post('/api/content/social', async (req, res) => {
  try {
    const { productId, brand, platforms } = req.body;
    const Product = require('../../shared/database/models/Product');

    const product = await Product.findOne({ shopifyId: productId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const posts = await contentGenerator.generateSocialPosts(product, brand, platforms);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate ad copy
app.post('/api/content/ad-copy', async (req, res) => {
  try {
    const { productId, platform, objective } = req.body;
    const Product = require('../../shared/database/models/Product');

    const product = await Product.findOne({ shopifyId: productId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const adCopy = await adCopyGen.generate(product, platform, objective);
    res.json(adCopy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule social post
app.post('/api/schedule/post', async (req, res) => {
  try {
    const { content, platform, scheduledTime } = req.body;
    const result = await socialScheduler.schedulePost({
      content,
      platform,
      scheduledTime: scheduledTime || new Date(Date.now() + 3600000), // 1 hour from now
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get scheduled posts
app.get('/api/schedule/posts', async (req, res) => {
  try {
    const posts = await socialScheduler.getScheduledPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate product descriptions
app.post('/api/content/product-description', async (req, res) => {
  try {
    const { productId } = req.body;
    const Product = require('../../shared/database/models/Product');

    const product = await Product.findOne({ shopifyId: productId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const description = await contentGenerator.generateProductDescription(product);

    // Update product with AI-generated description
    product.aiGeneratedDescription = description;
    await product.save();

    res.json({ description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.AI_CONTENT_PORT || 3002;
app.listen(PORT, async () => {
  console.log(`🤖 AI Content Engine running on port ${PORT}`);
  await initialize();
});

process.on('SIGTERM', async () => {
  await database.disconnect();
  process.exit(0);
});
