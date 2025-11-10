const express = require('express');
const config = require('../../shared/config');
const database = require('../../shared/database');
const ShopifyService = require('./shopifyService');
const ProductSync = require('./productSync');
const OrderSync = require('./orderSync');
const CustomerSync = require('./customerSync');

const app = express();
app.use(express.json());

let shopifyService;
let productSync;
let orderSync;
let customerSync;

// Initialize Shopify service
async function initialize() {
  console.log('🚀 Starting Shopify Integration Service...');

  try {
    // Connect to databases
    await database.connectAll();

    // Initialize Shopify service
    shopifyService = new ShopifyService(config.shopify);
    await shopifyService.initialize();

    // Initialize sync services
    productSync = new ProductSync(shopifyService);
    orderSync = new OrderSync(shopifyService);
    customerSync = new CustomerSync(shopifyService);

    console.log('✅ Shopify Integration Service initialized');

    // Start initial sync
    await performInitialSync();

    // Schedule regular syncs
    startScheduledSyncs();

  } catch (error) {
    console.error('❌ Failed to initialize Shopify service:', error);
    process.exit(1);
  }
}

// Initial sync of all data
async function performInitialSync() {
  console.log('🔄 Starting initial data sync...');

  try {
    await Promise.all([
      productSync.syncAll(),
      orderSync.syncRecent(30), // Last 30 days
      customerSync.syncAll(),
    ]);

    console.log('✅ Initial sync completed');
  } catch (error) {
    console.error('❌ Initial sync error:', error);
  }
}

// Schedule regular syncs
function startScheduledSyncs() {
  const cron = require('node-cron');

  // Sync products every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('🔄 Running scheduled product sync...');
    await productSync.syncAll();
  });

  // Sync orders every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 Running scheduled order sync...');
    await orderSync.syncRecent(1); // Last 24 hours
  });

  // Sync customers every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('🔄 Running scheduled customer sync...');
    await customerSync.syncAll();
  });

  console.log('⏰ Scheduled syncs configured');
}

// API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'shopify-integration',
    timestamp: new Date().toISOString(),
  });
});

// Get products from Shopify
app.get('/api/products', async (req, res) => {
  try {
    const products = await shopifyService.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await shopifyService.getProduct(req.params.id);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product price
app.put('/api/products/:id/price', async (req, res) => {
  try {
    const { price, compareAtPrice } = req.body;
    const result = await shopifyService.updateProductPrice(
      req.params.id,
      price,
      compareAtPrice
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product inventory
app.put('/api/products/:id/inventory', async (req, res) => {
  try {
    const { quantity } = req.body;
    const result = await shopifyService.updateInventory(req.params.id, quantity);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders
app.get('/api/orders', async (req, res) => {
  try {
    const { status, limit } = req.query;
    const orders = await shopifyService.getOrders({ status, limit });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await shopifyService.getCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger manual sync
app.post('/api/sync/:type', async (req, res) => {
  try {
    const { type } = req.params;

    switch (type) {
      case 'products':
        await productSync.syncAll();
        break;
      case 'orders':
        await orderSync.syncRecent(30);
        break;
      case 'customers':
        await customerSync.syncAll();
        break;
      case 'all':
        await performInitialSync();
        break;
      default:
        return res.status(400).json({ error: 'Invalid sync type' });
    }

    res.json({ message: `${type} sync completed` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Shopify webhook handler
app.post('/webhooks/shopify/:topic', async (req, res) => {
  const { topic } = req.params;
  console.log(`📨 Received webhook: ${topic}`);

  try {
    // Handle different webhook topics
    switch (topic) {
      case 'products/create':
      case 'products/update':
        await productSync.syncSingle(req.body.id);
        break;
      case 'orders/create':
      case 'orders/updated':
        await orderSync.syncSingle(req.body.id);
        break;
      case 'customers/create':
      case 'customers/update':
        await customerSync.syncSingle(req.body.id);
        break;
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// Start server
const PORT = process.env.SHOPIFY_SERVICE_PORT || 3001;
app.listen(PORT, async () => {
  console.log(`🛍️  Shopify Integration Service running on port ${PORT}`);
  await initialize();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await database.disconnect();
  process.exit(0);
});
