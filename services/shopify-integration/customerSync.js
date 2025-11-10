const Customer = require('../../shared/database/models/Customer');

class CustomerSync {
  constructor(shopifyService) {
    this.shopify = shopifyService;
  }

  async syncAll() {
    console.log('🔄 Syncing all customers from Shopify...');

    try {
      const shopifyCustomers = await this.shopify.getCustomers({ limit: 250 });

      let created = 0;
      let updated = 0;

      for (const shopifyCustomer of shopifyCustomers) {
        const customerData = this.transformShopifyCustomer(shopifyCustomer);

        const existing = await Customer.findOne({ shopifyId: shopifyCustomer.id.toString() });

        if (existing) {
          await Customer.updateOne(
            { shopifyId: shopifyCustomer.id.toString() },
            {
              ...customerData,
              updatedAt: new Date(),
              lastSyncedAt: new Date(),
            }
          );
          updated++;
        } else {
          await Customer.create({
            ...customerData,
            lastSyncedAt: new Date(),
          });
          created++;
        }
      }

      console.log(`✅ Customer sync complete: ${created} created, ${updated} updated`);

      // Update customer segments after sync
      await this.updateCustomerSegments();

      return { created, updated };
    } catch (error) {
      console.error('❌ Customer sync error:', error);
      throw error;
    }
  }

  async syncSingle(customerId) {
    try {
      const shopifyCustomer = await this.shopify.getCustomer(customerId);
      const customerData = this.transformShopifyCustomer(shopifyCustomer);

      await Customer.updateOne(
        { shopifyId: customerId.toString() },
        {
          ...customerData,
          updatedAt: new Date(),
          lastSyncedAt: new Date(),
        },
        { upsert: true }
      );

      console.log(`✅ Customer ${customerId} synced`);
    } catch (error) {
      console.error(`❌ Error syncing customer ${customerId}:`, error);
    }
  }

  transformShopifyCustomer(shopifyCustomer) {
    return {
      shopifyId: shopifyCustomer.id.toString(),
      email: shopifyCustomer.email,
      firstName: shopifyCustomer.first_name,
      lastName: shopifyCustomer.last_name,
      phone: shopifyCustomer.phone,
      totalOrders: shopifyCustomer.orders_count || 0,
      totalSpent: parseFloat(shopifyCustomer.total_spent || 0),
      marketing: {
        emailOptIn: shopifyCustomer.accepts_marketing || false,
        smsOptIn: shopifyCustomer.accepts_marketing_updated_at ? true : false,
      },
    };
  }

  async updateCustomerSegments() {
    console.log('🎯 Updating customer segments...');

    try {
      const customers = await Customer.find({});

      for (const customer of customers) {
        // Calculate days since last order
        if (customer.lastOrderDate) {
          const daysSince = Math.floor(
            (Date.now() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          customer.daysSinceLastOrder = daysSince;
        }

        // Calculate average order value
        if (customer.totalOrders > 0) {
          customer.averageOrderValue = customer.totalSpent / customer.totalOrders;
        }

        // Set lifetime value
        customer.lifetimeValue = customer.totalSpent;

        // Determine segment
        if (customer.totalOrders === 0) {
          customer.segment = 'new';
        } else if (customer.totalOrders === 1) {
          customer.segment = 'one-time';
        } else if (customer.daysSinceLastOrder > 90) {
          customer.segment = 'churned';
        } else if (customer.daysSinceLastOrder > 45) {
          customer.segment = 'at-risk';
        } else if (customer.lifetimeValue > 500 || customer.totalOrders > 5) {
          customer.segment = 'vip';
        } else {
          customer.segment = 'loyal';
        }

        // Calculate churn risk (simple heuristic)
        if (customer.daysSinceLastOrder > 60) {
          customer.churnRisk = Math.min(customer.daysSinceLastOrder / 180, 0.95);
        } else {
          customer.churnRisk = 0.1;
        }

        await customer.save();
      }

      console.log('✅ Customer segments updated');
    } catch (error) {
      console.error('❌ Error updating customer segments:', error);
    }
  }
}

module.exports = CustomerSync;
