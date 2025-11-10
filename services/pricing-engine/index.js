const express = require('express');
const config = require('../../shared/config');
const database = require('../../shared/database');
const PricingOptimizer = require('./pricingOptimizer');
const CompetitorTracker = require('./competitorTracker');
const DemandAnalyzer = require('./demandAnalyzer');

const app = express();
app.use(express.json());

let pricingOptimizer;
let competitorTracker;
let demandAnalyzer;

async function initialize() {
  console.log('💰 Starting Dynamic Pricing Engine...');

  try {
    await database.connectAll();

    pricingOptimizer = new PricingOptimizer();
    competitorTracker = new CompetitorTracker();
    demandAnalyzer = new DemandAnalyzer();

    console.log('✅ Dynamic Pricing Engine initialized');

    if (config.features.dynamicPricing) {
      startScheduledPricing();
    }
  } catch (error) {
    console.error('❌ Failed to initialize Pricing Engine:', error);
    process.exit(1);
  }
}

function startScheduledPricing() {
  const cron = require('node-cron');

  // Update prices every hour
  cron.schedule('0 * * * *', async () => {
    console.log('💰 Running scheduled price optimization...');
    await optimizeAllPrices();
  });

  // Analyze demand every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('📊 Analyzing demand patterns...');
    await demandAnalyzer.analyzeAll();
  });

  console.log('⏰ Scheduled pricing optimization configured');
}

async function optimizeAllPrices() {
  try {
    const Product = require('../../shared/database/models/Product');

    const products = await Product.find({
      'dynamicPricing.enabled': true,
    });

    let updated = 0;

    for (const product of products) {
      const newPrice = await pricingOptimizer.calculateOptimalPrice(product);

      if (newPrice && newPrice !== product.price) {
        // Update in database
        product.priceHistory.push({
          price: product.price,
          timestamp: new Date(),
          reason: 'dynamic_optimization',
        });

        product.price = newPrice;
        await product.save();

        // Update in Shopify
        const ShopifyService = require('../shopify-integration/shopifyService');
        const shopify = new ShopifyService(config.shopify);
        await shopify.initialize();
        await shopify.updateProductPrice(product.shopifyId, newPrice);

        updated++;
      }
    }

    console.log(`✅ Price optimization complete: ${updated} products updated`);
  } catch (error) {
    console.error('❌ Price optimization error:', error);
  }
}

// API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'pricing-engine',
    timestamp: new Date().toISOString(),
  });
});

// Get optimal price for product
app.get('/api/pricing/optimal/:productId', async (req, res) => {
  try {
    const Product = require('../../shared/database/models/Product');
    const product = await Product.findOne({ shopifyId: req.params.productId });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const optimalPrice = await pricingOptimizer.calculateOptimalPrice(product);
    const analysis = await pricingOptimizer.getAnalysis(product);

    res.json({
      currentPrice: product.price,
      optimalPrice,
      analysis,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product price
app.post('/api/pricing/update/:productId', async (req, res) => {
  try {
    const { price } = req.body;
    const Product = require('../../shared/database/models/Product');

    const product = await Product.findOne({ shopifyId: req.params.productId });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update locally
    product.priceHistory.push({
      price: product.price,
      timestamp: new Date(),
      reason: 'manual_update',
    });

    product.price = price;
    await product.save();

    // Update in Shopify
    const ShopifyService = require('../shopify-integration/shopifyService');
    const shopify = new ShopifyService(config.shopify);
    await shopify.initialize();
    await shopify.updateProductPrice(product.shopifyId, price);

    res.json({ message: 'Price updated', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get price history
app.get('/api/pricing/history/:productId', async (req, res) => {
  try {
    const Product = require('../../shared/database/models/Product');
    const product = await Product.findOne({ shopifyId: req.params.productId });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      currentPrice: product.price,
      history: product.priceHistory.slice(-30), // Last 30 changes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get demand analysis
app.get('/api/pricing/demand/:productId', async (req, res) => {
  try {
    const Product = require('../../shared/database/models/Product');
    const product = await Product.findOne({ shopifyId: req.params.productId });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const demand = await demandAnalyzer.analyze(product);
    res.json(demand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger manual price optimization
app.post('/api/pricing/optimize-all', async (req, res) => {
  try {
    await optimizeAllPrices();
    res.json({ message: 'Price optimization completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PRICING_ENGINE_PORT || 3003;
app.listen(PORT, async () => {
  console.log(`💰 Dynamic Pricing Engine running on port ${PORT}`);
  await initialize();
});

process.on('SIGTERM', async () => {
  await database.disconnect();
  process.exit(0);
});
