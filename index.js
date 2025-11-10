const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./shared/config');
const database = require('./shared/database');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-ecommerce-os',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Gateway - proxy to microservices
app.use('/api/shopify', require('./routes/shopifyProxy'));
app.use('/api/content', require('./routes/contentProxy'));
app.use('/api/pricing', require('./routes/pricingProxy'));

// Dashboard
app.get('/', (req, res) => {
  res.json({
    message: 'AI E-commerce Operating System',
    store: config.shopify.storeUrl,
    services: {
      shopify: 'http://localhost:3001',
      aiContent: 'http://localhost:3002',
      pricing: 'http://localhost:3003',
    },
    documentation: '/docs',
  });
});

// Start server
async function start() {
  try {
    console.log('🚀 Starting AI E-commerce Operating System...');
    console.log(`📍 Store: ${config.shopify.storeUrl}`);

    // Connect to databases
    await database.connectAll();

    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`✅ AI E-commerce OS running on port ${PORT}`);
      console.log(`🌐 Dashboard: http://localhost:${PORT}`);
      console.log('\n🎯 Services:');
      console.log('   - Shopify Integration: http://localhost:3001');
      console.log('   - AI Content Engine: http://localhost:3002');
      console.log('   - Dynamic Pricing: http://localhost:3003');
      console.log('\n💡 Run individual services:');
      console.log('   npm run service:shopify');
      console.log('   npm run service:ai-content');
      console.log('   npm run service:pricing');
    });
  } catch (error) {
    console.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await database.disconnect();
  process.exit(0);
});

start();

module.exports = app;
