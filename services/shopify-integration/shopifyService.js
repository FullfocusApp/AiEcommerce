const { Shopify } = require('@shopify/shopify-api');
const axios = require('axios');

class ShopifyService {
  constructor(config) {
    this.config = config;
    this.client = null;
  }

  async initialize() {
    // Initialize Shopify API client
    this.client = axios.create({
      baseURL: `https://${this.config.storeUrl}/admin/api/${this.config.apiVersion}`,
      headers: {
        'X-Shopify-Access-Token': this.config.accessToken,
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ Connected to Shopify store: ${this.config.storeUrl}`);
  }

  // Products
  async getProducts(params = {}) {
    try {
      const response = await this.client.get('/products.json', { params });
      return response.data.products;
    } catch (error) {
      console.error('Error fetching products:', error.response?.data || error.message);
      throw error;
    }
  }

  async getProduct(productId) {
    try {
      const response = await this.client.get(`/products/${productId}.json`);
      return response.data.product;
    } catch (error) {
      console.error('Error fetching product:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateProduct(productId, productData) {
    try {
      const response = await this.client.put(`/products/${productId}.json`, {
        product: productData,
      });
      return response.data.product;
    } catch (error) {
      console.error('Error updating product:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateProductPrice(productId, price, compareAtPrice = null) {
    try {
      const product = await this.getProduct(productId);

      // Update all variants
      const variantUpdates = product.variants.map(variant => ({
        id: variant.id,
        price: price.toString(),
        compare_at_price: compareAtPrice ? compareAtPrice.toString() : null,
      }));

      const response = await this.client.put(`/products/${productId}.json`, {
        product: {
          variants: variantUpdates,
        },
      });

      console.log(`💰 Updated price for product ${productId}: $${price}`);
      return response.data.product;
    } catch (error) {
      console.error('Error updating price:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateInventory(variantId, quantity) {
    try {
      // Get inventory item ID
      const variant = await this.client.get(`/variants/${variantId}.json`);
      const inventoryItemId = variant.data.variant.inventory_item_id;

      // Get inventory levels
      const levels = await this.client.get('/inventory_levels.json', {
        params: { inventory_item_ids: inventoryItemId },
      });

      if (levels.data.inventory_levels.length > 0) {
        const locationId = levels.data.inventory_levels[0].location_id;

        // Update inventory
        await this.client.post('/inventory_levels/set.json', {
          location_id: locationId,
          inventory_item_id: inventoryItemId,
          available: quantity,
        });

        console.log(`📦 Updated inventory for variant ${variantId}: ${quantity}`);
      }
    } catch (error) {
      console.error('Error updating inventory:', error.response?.data || error.message);
      throw error;
    }
  }

  // Orders
  async getOrders(params = {}) {
    try {
      const response = await this.client.get('/orders.json', { params });
      return response.data.orders;
    } catch (error) {
      console.error('Error fetching orders:', error.response?.data || error.message);
      throw error;
    }
  }

  async getOrder(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}.json`);
      return response.data.order;
    } catch (error) {
      console.error('Error fetching order:', error.response?.data || error.message);
      throw error;
    }
  }

  // Customers
  async getCustomers(params = {}) {
    try {
      const response = await this.client.get('/customers.json', { params });
      return response.data.customers;
    } catch (error) {
      console.error('Error fetching customers:', error.response?.data || error.message);
      throw error;
    }
  }

  async getCustomer(customerId) {
    try {
      const response = await this.client.get(`/customers/${customerId}.json`);
      return response.data.customer;
    } catch (error) {
      console.error('Error fetching customer:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateCustomer(customerId, customerData) {
    try {
      const response = await this.client.put(`/customers/${customerId}.json`, {
        customer: customerData,
      });
      return response.data.customer;
    } catch (error) {
      console.error('Error updating customer:', error.response?.data || error.message);
      throw error;
    }
  }

  // Analytics
  async getProductAnalytics(productId, startDate, endDate) {
    try {
      // Use Shopify GraphQL API for advanced analytics
      // This is a placeholder - implement based on your needs
      return {
        productId,
        views: 0,
        addToCarts: 0,
        purchases: 0,
        revenue: 0,
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
}

module.exports = ShopifyService;
