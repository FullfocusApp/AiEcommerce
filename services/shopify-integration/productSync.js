const Product = require('../../shared/database/models/Product');

class ProductSync {
  constructor(shopifyService) {
    this.shopify = shopifyService;
  }

  async syncAll() {
    console.log('🔄 Syncing all products from Shopify...');

    try {
      const shopifyProducts = await this.shopify.getProducts({ limit: 250 });

      let created = 0;
      let updated = 0;

      for (const shopifyProduct of shopifyProducts) {
        const productData = this.transformShopifyProduct(shopifyProduct);

        const existingProduct = await Product.findOne({ shopifyId: shopifyProduct.id.toString() });

        if (existingProduct) {
          await Product.updateOne(
            { shopifyId: shopifyProduct.id.toString() },
            {
              ...productData,
              updatedAt: new Date(),
              lastSyncedAt: new Date(),
            }
          );
          updated++;
        } else {
          await Product.create({
            ...productData,
            lastSyncedAt: new Date(),
          });
          created++;
        }
      }

      console.log(`✅ Product sync complete: ${created} created, ${updated} updated`);
      return { created, updated };
    } catch (error) {
      console.error('❌ Product sync error:', error);
      throw error;
    }
  }

  async syncSingle(productId) {
    try {
      const shopifyProduct = await this.shopify.getProduct(productId);
      const productData = this.transformShopifyProduct(shopifyProduct);

      await Product.updateOne(
        { shopifyId: productId.toString() },
        {
          ...productData,
          updatedAt: new Date(),
          lastSyncedAt: new Date(),
        },
        { upsert: true }
      );

      console.log(`✅ Product ${productId} synced`);
    } catch (error) {
      console.error(`❌ Error syncing product ${productId}:`, error);
      throw error;
    }
  }

  transformShopifyProduct(shopifyProduct) {
    const basePrice = parseFloat(shopifyProduct.variants[0]?.price || 0);

    return {
      shopifyId: shopifyProduct.id.toString(),
      title: shopifyProduct.title,
      description: shopifyProduct.body_html,
      price: basePrice,
      compareAtPrice: parseFloat(shopifyProduct.variants[0]?.compare_at_price || 0),
      vendor: shopifyProduct.vendor,
      productType: shopifyProduct.product_type,
      tags: shopifyProduct.tags ? shopifyProduct.tags.split(', ') : [],
      images: shopifyProduct.images?.map(img => ({
        src: img.src,
        alt: img.alt || '',
      })) || [],
      variants: shopifyProduct.variants?.map(v => ({
        variantId: v.id.toString(),
        sku: v.sku,
        price: parseFloat(v.price),
        inventoryQuantity: v.inventory_quantity || 0,
      })) || [],
      dynamicPricing: {
        enabled: true,
        minPrice: basePrice * 0.8,
        maxPrice: basePrice * 1.5,
        currentMultiplier: 1.0,
      },
    };
  }
}

module.exports = ProductSync;
