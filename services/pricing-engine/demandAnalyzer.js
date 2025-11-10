const database = require('../../shared/database');

class DemandAnalyzer {
  async analyze(product) {
    try {
      const redis = database.getRedis();

      // Get recent traffic data from Redis
      const views = await redis.get(`product:${product.shopifyId}:views:24h`) || 0;
      const addToCarts = await redis.get(`product:${product.shopifyId}:atc:24h`) || 0;
      const purchases = await redis.get(`product:${product.shopifyId}:purchases:24h`) || 0;

      const demandScore = this.calculateDemandScore({
        views: parseInt(views),
        addToCarts: parseInt(addToCarts),
        purchases: parseInt(purchases),
      });

      const trend = await this.calculateTrend(product);

      return {
        productId: product.shopifyId,
        demandScore,
        trend,
        metrics: {
          views24h: parseInt(views),
          addToCarts24h: parseInt(addToCarts),
          purchases24h: parseInt(purchases),
          conversionRate: parseInt(views) > 0 ? (parseInt(purchases) / parseInt(views)) * 100 : 0,
        },
        recommendation: this.getRecommendation(demandScore, trend),
      };
    } catch (error) {
      console.error('Error analyzing demand:', error);
      return {
        demandScore: 0,
        trend: 'stable',
        recommendation: 'maintain',
      };
    }
  }

  calculateDemandScore(metrics) {
    // Score from 0-100 based on engagement
    let score = 0;

    // Views contribute 30%
    if (metrics.views > 100) score += 30;
    else if (metrics.views > 50) score += 20;
    else if (metrics.views > 20) score += 10;

    // Add-to-carts contribute 40%
    if (metrics.addToCarts > 20) score += 40;
    else if (metrics.addToCarts > 10) score += 30;
    else if (metrics.addToCarts > 5) score += 20;
    else if (metrics.addToCarts > 0) score += 10;

    // Purchases contribute 30%
    if (metrics.purchases > 10) score += 30;
    else if (metrics.purchases > 5) score += 25;
    else if (metrics.purchases > 2) score += 20;
    else if (metrics.purchases > 0) score += 15;

    return Math.min(100, score);
  }

  async calculateTrend(product) {
    try {
      // Compare last 24h vs previous 24h
      const redis = database.getRedis();

      const views24h = parseInt(await redis.get(`product:${product.shopifyId}:views:24h`) || 0);
      const views48h = parseInt(await redis.get(`product:${product.shopifyId}:views:48h`) || 0);

      const viewsPrevious24h = views48h - views24h;

      if (views24h > viewsPrevious24h * 1.2) return 'rising';
      if (views24h < viewsPrevious24h * 0.8) return 'falling';
      return 'stable';
    } catch (error) {
      return 'stable';
    }
  }

  getRecommendation(demandScore, trend) {
    if (demandScore > 70 && trend === 'rising') {
      return {
        action: 'increase_price',
        reason: 'High demand with rising trend',
        confidence: 'high',
      };
    }

    if (demandScore < 30 && trend === 'falling') {
      return {
        action: 'decrease_price',
        reason: 'Low demand with falling trend',
        confidence: 'high',
      };
    }

    if (demandScore > 60) {
      return {
        action: 'slight_increase',
        reason: 'Strong demand',
        confidence: 'medium',
      };
    }

    if (demandScore < 40) {
      return {
        action: 'slight_decrease',
        reason: 'Weak demand',
        confidence: 'medium',
      };
    }

    return {
      action: 'maintain',
      reason: 'Balanced demand',
      confidence: 'medium',
    };
  }

  async analyzeAll() {
    const Product = require('../../shared/database/models/Product');

    const products = await Product.find({
      'dynamicPricing.enabled': true,
    });

    const analyses = [];

    for (const product of products) {
      const analysis = await this.analyze(product);
      analyses.push(analysis);
    }

    console.log(`📊 Demand analysis complete for ${analyses.length} products`);
    return analyses;
  }

  // Track real-time events
  async trackView(productId) {
    const redis = database.getRedis();
    await redis.incr(`product:${productId}:views:24h`);
    await redis.expire(`product:${productId}:views:24h`, 86400); // 24 hours
  }

  async trackAddToCart(productId) {
    const redis = database.getRedis();
    await redis.incr(`product:${productId}:atc:24h`);
    await redis.expire(`product:${productId}:atc:24h`, 86400);
  }

  async trackPurchase(productId) {
    const redis = database.getRedis();
    await redis.incr(`product:${productId}:purchases:24h`);
    await redis.expire(`product:${productId}:purchases:24h`, 86400);
  }
}

module.exports = DemandAnalyzer;
