# Quick Start Guide

Get your AI E-commerce Operating System running in 10 minutes!

## Prerequisites

Before you begin, make sure you have:
- **Shopify Store**: https://fullfocustrends.myshopify.com (already set up!)
- **Node.js** 18+ installed
- **MongoDB** (local or cloud)
- **Redis** (local or cloud)
- **OpenAI API Key** (for AI content generation)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```bash
# Shopify - MOST IMPORTANT
SHOPIFY_STORE_URL=fullfocustrends.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_token_here    # Get this from Shopify admin
SHOPIFY_API_KEY=your_key_here
SHOPIFY_API_SECRET=your_secret_here

# AI Services - Required for content generation
OPENAI_API_KEY=your_openai_key_here

# Database - Can use local defaults for testing
MONGODB_URI=mongodb://localhost:27017/aiecommerce
REDIS_URL=redis://localhost:6379
```

## Step 3: Get Shopify API Credentials

1. Go to your Shopify admin: https://fullfocustrends.myshopify.com/admin
2. Click **Settings** → **Apps and sales channels**
3. Click **Develop apps**
4. Click **Create an app** (name it "AI Commerce OS")
5. Click **Configure Admin API scopes** and select:
   - ✅ `read_products`, `write_products`
   - ✅ `read_orders`, `write_orders`
   - ✅ `read_customers`, `write_customers`
   - ✅ `read_inventory`, `write_inventory`
   - ✅ `read_price_rules`, `write_price_rules`
6. Click **Save**
7. Click **Install app**
8. Copy the **Admin API access token** to your `.env` file

## Step 4: Start MongoDB & Redis

### Option A: Using Docker (Easiest)

```bash
docker-compose up mongodb redis -d
```

### Option B: Local Installation

Make sure MongoDB and Redis are running:

```bash
# MongoDB
mongod --dbpath /path/to/data

# Redis
redis-server
```

## Step 5: Start the Services

### All Services at Once (Development)

```bash
npm run dev:all
```

### Individual Services (Production)

Open multiple terminal windows:

**Terminal 1 - Shopify Integration:**
```bash
npm run service:shopify
```

**Terminal 2 - AI Content Engine:**
```bash
npm run service:ai-content
```

**Terminal 3 - Dynamic Pricing:**
```bash
npm run service:pricing
```

## Step 6: Verify Everything Works

Open your browser and check:

- **Main Dashboard**: http://localhost:3000
- **Shopify Service Health**: http://localhost:3001/health
- **AI Content Service Health**: http://localhost:3002/health
- **Pricing Service Health**: http://localhost:3003/health

All should return `{ "status": "healthy" }`

## Step 7: Test with Your Store

### Sync Products from Shopify

```bash
curl -X POST http://localhost:3001/api/sync/all
```

This will import all your products from fullfocustrends.myshopify.com into the system.

### Generate AI Content for a Product

```bash
curl -X POST http://localhost:3002/api/content/ugc \
  -H "Content-Type: application/json" \
  -d '{"productId": "YOUR_PRODUCT_ID", "style": "authentic"}'
```

### Check Dynamic Pricing

```bash
curl http://localhost:3003/api/pricing/optimal/YOUR_PRODUCT_ID
```

## What Happens Next?

Once running, the system will automatically:

1. **Sync your Shopify store** every 15 minutes
2. **Generate daily content** at 8 AM
3. **Optimize prices** every hour (if enabled)
4. **Analyze demand patterns** every 6 hours

## Docker Deployment (Production)

For production deployment:

```bash
docker-compose up -d
```

This starts all services in containers.

## Feature Flags

Control what's enabled in your `.env`:

```bash
ENABLE_DYNAMIC_PRICING=true   # Auto-adjust prices
ENABLE_AI_CONTENT=true        # Generate content
ENABLE_AUTO_POSTING=false     # Auto-post to social (set up n8n first!)
ENABLE_SUPPORT_BOT=true       # AI customer support
```

## Next Steps

1. **Set up n8n** for social media automation
2. **Connect Klaviyo** for email marketing
3. **Add Meta/TikTok** credentials for ad automation
4. **Configure pricing guardrails** (min/max prices)
5. **Review AI-generated content** before auto-posting

## Troubleshooting

### "Shopify API connection failed"
- Check your access token in `.env`
- Verify API scopes in Shopify admin
- Make sure store URL is correct (no https://)

### "MongoDB connection error"
- Ensure MongoDB is running
- Check MONGODB_URI in `.env`

### "OpenAI API error"
- Verify your OpenAI API key
- Check your OpenAI account has credits

### Ports already in use
Change ports in your `.env`:
```bash
PORT=3000
SHOPIFY_SERVICE_PORT=3001
AI_CONTENT_PORT=3002
PRICING_ENGINE_PORT=3003
```

## Support

- 📖 Full docs: README.md
- 🐛 Issues: GitHub Issues
- 📧 Questions: Check the docs first!

## Important Notes

- Start with `ENABLE_AUTO_POSTING=false` until you review AI content
- Set pricing guardrails before enabling dynamic pricing
- Monitor the first 48 hours closely
- The AI learns from your data - the more orders, the smarter it gets!

---

**You're ready to build an autonomous e-commerce empire! 🚀**
