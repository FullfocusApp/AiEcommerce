const config = require('../../shared/config');

class PricingOptimizer {
  constructor() {
    this.minMultiplier = config.pricing.minMultiplier;
    this.maxMultiplier = config.pricing.maxMultiplier;
  }

  async calculateOptimalPrice(product) {
    try {
      // Get all pricing factors
      const factors = await this.gatherPricingFactors(product);

      // Calculate base multiplier from factors
      let multiplier = 1.0;

      // Demand factor (-0.1 to +0.2)
      multiplier += this.calculateDemandMultiplier(factors.demand);

      // Inventory factor (-0.15 to +0.05)
      multiplier += this.calculateInventoryMultiplier(factors.inventory);

      // Conversion factor (-0.1 to +0.1)
      multiplier += this.calculateConversionMultiplier(factors.conversionRate);

      // Time-based factor (-0.05 to +0.05)
      multiplier += this.calculateTimeMultiplier();

      // Competitor factor (-0.15 to +0.1)
      if (factors.competitorPrice) {
        multiplier += this.calculateCompetitorMultiplier(factors.competitorPrice, product.price);
      }

      // Clamp multiplier to configured limits
      multiplier = Math.max(this.minMultiplier, Math.min(this.maxMultiplier, multiplier));

      // Calculate new price based on base price (not current price to avoid drift)
      const basePrice = this.getBasePrice(product);
      const newPrice = Math.round((basePrice * multiplier) * 100) / 100;

      // Update product multiplier for tracking
      product.dynamicPricing.currentMultiplier = multiplier;

      // Ensure within min/max bounds
      return Math.max(
        product.dynamicPricing.minPrice,
        Math.min(product.dynamicPricing.maxPrice, newPrice)
      );
    } catch (error) {
      console.error('Error calculating optimal price:', error);
      return product.price; // Return current price if calculation fails
    }
  }

  async gatherPricingFactors(product) {
    const factors = {
      demand: 0,
      inventory: 0,
      conversionRate: 0,
      competitorPrice: null,
    };

    // Demand: views and add-to-carts
    if (product.analytics.views > 0) {
      factors.demand = product.analytics.addToCarts / product.analytics.views;
    }

    // Inventory: stock levels across variants
    const totalStock = product.variants.reduce((sum, v) => sum + v.inventoryQuantity, 0);
    factors.inventory = totalStock;

    // Conversion rate
    if (product.analytics.addToCarts > 0) {
      factors.conversionRate = product.analytics.purchases / product.analytics.addToCarts;
    }

    // Competitor price (placeholder - integrate with competitor tracking)
    // factors.competitorPrice = await this.getCompetitorPrice(product);

    return factors;
  }

  calculateDemandMultiplier(demandRate) {
    // High demand (>10% add-to-cart rate) = increase price
    // Low demand (<2%) = decrease price
    if (demandRate > 0.10) return 0.15; // +15%
    if (demandRate > 0.07) return 0.10; // +10%
    if (demandRate > 0.05) return 0.05; // +5%
    if (demandRate < 0.02) return -0.10; // -10%
    if (demandRate < 0.03) return -0.05; // -5%
    return 0;
  }

  calculateInventoryMultiplier(stockLevel) {
    // Low stock = increase price (scarcity)
    // High stock = decrease price (move inventory)
    if (stockLevel === 0) return 0; // Out of stock, no change
    if (stockLevel < 5) return 0.05; // Low stock premium
    if (stockLevel < 10) return 0.02;
    if (stockLevel > 100) return -0.10; // High stock discount
    if (stockLevel > 50) return -0.05;
    return 0;
  }

  calculateConversionMultiplier(conversionRate) {
    // High conversion = can increase price
    // Low conversion = decrease price
    if (conversionRate > 0.30) return 0.10; // 30%+ conversion
    if (conversionRate > 0.20) return 0.05;
    if (conversionRate < 0.05) return -0.10;
    if (conversionRate < 0.10) return -0.05;
    return 0;
  }

  calculateTimeMultiplier() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Weekend premium
    if (day === 0 || day === 6) return 0.03;

    // Peak shopping hours (lunch and evening)
    if ((hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21)) {
      return 0.02;
    }

    // Off-peak discount
    if (hour < 6 || hour > 23) return -0.03;

    return 0;
  }

  calculateCompetitorMultiplier(competitorPrice, ourPrice) {
    if (!competitorPrice) return 0;

    const priceDiff = (ourPrice - competitorPrice) / competitorPrice;

    // We're more expensive than competitor
    if (priceDiff > 0.20) return -0.15; // Significantly more expensive
    if (priceDiff > 0.10) return -0.08;

    // We're cheaper than competitor
    if (priceDiff < -0.15) return 0.10; // Room to increase
    if (priceDiff < -0.05) return 0.05;

    return 0;
  }

  getBasePrice(product) {
    // Get the original price or average of price history
    if (product.priceHistory && product.priceHistory.length > 0) {
      const prices = product.priceHistory.slice(-10).map(h => h.price);
      return prices.reduce((sum, p) => sum + p, 0) / prices.length;
    }
    return product.price;
  }

  async getAnalysis(product) {
    const factors = await this.gatherPricingFactors(product);

    return {
      currentPrice: product.price,
      currentMultiplier: product.dynamicPricing.currentMultiplier,
      factors: {
        demand: {
          value: factors.demand,
          impact: this.calculateDemandMultiplier(factors.demand),
          interpretation: this.interpretDemand(factors.demand),
        },
        inventory: {
          value: factors.inventory,
          impact: this.calculateInventoryMultiplier(factors.inventory),
          interpretation: this.interpretInventory(factors.inventory),
        },
        conversion: {
          value: factors.conversionRate,
          impact: this.calculateConversionMultiplier(factors.conversionRate),
          interpretation: this.interpretConversion(factors.conversionRate),
        },
        time: {
          impact: this.calculateTimeMultiplier(),
        },
      },
      priceRange: {
        min: product.dynamicPricing.minPrice,
        max: product.dynamicPricing.maxPrice,
      },
    };
  }

  interpretDemand(rate) {
    if (rate > 0.10) return 'Very High - Strong interest';
    if (rate > 0.05) return 'High - Good engagement';
    if (rate > 0.03) return 'Moderate - Average interest';
    if (rate > 0.01) return 'Low - Weak engagement';
    return 'Very Low - Needs attention';
  }

  interpretInventory(stock) {
    if (stock === 0) return 'Out of Stock';
    if (stock < 5) return 'Critical - Last few items';
    if (stock < 20) return 'Low - Restock soon';
    if (stock < 50) return 'Moderate';
    return 'High - Plenty in stock';
  }

  interpretConversion(rate) {
    if (rate > 0.30) return 'Excellent';
    if (rate > 0.20) return 'Very Good';
    if (rate > 0.10) return 'Good';
    if (rate > 0.05) return 'Fair';
    return 'Poor - Needs optimization';
  }
}

module.exports = PricingOptimizer;
