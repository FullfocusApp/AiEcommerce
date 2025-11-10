const Order = require('../../shared/database/models/Order');

class OrderSync {
  constructor(shopifyService) {
    this.shopify = shopifyService;
  }

  async syncRecent(days = 30) {
    console.log(`🔄 Syncing orders from last ${days} days...`);

    try {
      const createdAtMin = new Date();
      createdAtMin.setDate(createdAtMin.getDate() - days);

      const shopifyOrders = await this.shopify.getOrders({
        status: 'any',
        created_at_min: createdAtMin.toISOString(),
        limit: 250,
      });

      let synced = 0;

      for (const order of shopifyOrders) {
        await this.syncSingle(order.id);
        synced++;
      }

      console.log(`✅ Order sync complete: ${synced} orders synced`);
      return { synced };
    } catch (error) {
      console.error('❌ Order sync error:', error);
      throw error;
    }
  }

  async syncSingle(orderId) {
    try {
      const shopifyOrder = await this.shopify.getOrder(orderId);

      // Update customer analytics based on order
      await this.updateCustomerAnalytics(shopifyOrder);

      // Update product analytics
      await this.updateProductAnalytics(shopifyOrder);

      console.log(`✅ Order ${orderId} synced`);
    } catch (error) {
      console.error(`❌ Error syncing order ${orderId}:`, error);
    }
  }

  async updateCustomerAnalytics(order) {
    const Customer = require('../../shared/database/models/Customer');

    if (!order.customer) return;

    const customerId = order.customer.id.toString();
    const orderTotal = parseFloat(order.total_price);

    await Customer.updateOne(
      { shopifyId: customerId },
      {
        $inc: {
          totalOrders: 1,
          totalSpent: orderTotal,
        },
        $set: {
          lastOrderDate: new Date(order.created_at),
        },
      }
    );

    // Recalculate average order value
    const customer = await Customer.findOne({ shopifyId: customerId });
    if (customer && customer.totalOrders > 0) {
      customer.averageOrderValue = customer.totalSpent / customer.totalOrders;
      await customer.save();
    }
  }

  async updateProductAnalytics(order) {
    const Product = require('../../shared/database/models/Product');

    for (const lineItem of order.line_items) {
      const productId = lineItem.product_id?.toString();
      if (!productId) continue;

      await Product.updateOne(
        { shopifyId: productId },
        {
          $inc: {
            'analytics.purchases': lineItem.quantity,
            'analytics.revenue': parseFloat(lineItem.price) * lineItem.quantity,
          },
        }
      );
    }
  }
}

module.exports = OrderSync;
