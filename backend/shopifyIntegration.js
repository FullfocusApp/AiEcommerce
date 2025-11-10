/**
 * Shopify Integration Script for Dynamic Pricing and Automation
 *
 * Required Environment Variables:
 * - SHOPIFY_SHOP: Your Shopify shop domain (e.g., 'your-store.myshopify.com')
 * - SHOPIFY_API_KEY: Shopify Admin API access token
 * - SHOPIFY_API_PASSWORD: Shopify Admin API password (for Basic Auth) or access token
 * - SENDGRID_API_KEY: SendGrid API key for sending transactional emails (optional)
 */

const axios = require('axios');
const sgMail = require('@sendgrid/mail');

// Load environment variables
require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_PASSWORD = process.env.SHOPIFY_API_PASSWORD;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

// Configure SendGrid
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Shopify API base URL
const SHOPIFY_API_BASE = `https://${SHOPIFY_SHOP}/admin/api/2024-01`;

/**
 * Create axios instance with Shopify credentials
 */
const shopifyAPI = axios.create({
  baseURL: SHOPIFY_API_BASE,
  auth: {
    username: SHOPIFY_API_KEY,
    password: SHOPIFY_API_PASSWORD
  },
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Fetch all products from Shopify Admin API
 * @returns {Promise<Array>} Array of product objects
 */
async function fetchAllProducts() {
  try {
    console.log('Fetching products from Shopify...');
    const response = await shopifyAPI.get('/products.json', {
      params: {
        limit: 250 // Maximum allowed by Shopify
      }
    });

    console.log(`Fetched ${response.data.products.length} products`);
    return response.data.products;
  } catch (error) {
    console.error('Error fetching products:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Calculate dynamic price based on inventory levels
 * @param {number} currentPrice - Current price of the variant
 * @param {number} inventory - Current inventory quantity
 * @param {number} demandFactor - Optional demand multiplier (default: 1.0)
 * @returns {number} New calculated price
 */
function calculateDynamicPrice(currentPrice, inventory, demandFactor = 1.0) {
  let priceMultiplier = 1.0;

  // Low inventory (scarcity pricing) - increase by up to 10%
  if (inventory < 10) {
    const scarcityFactor = (10 - inventory) / 10; // 0.0 to 1.0
    priceMultiplier = 1 + (0.10 * scarcityFactor);
  }
  // High inventory (clearance pricing) - decrease by 5%
  else if (inventory > 100) {
    priceMultiplier = 0.95;
  }
  // Normal inventory - no change
  else {
    priceMultiplier = 1.0;
  }

  // Apply demand factor
  priceMultiplier *= demandFactor;

  // Calculate new price and round to 2 decimal places
  const newPrice = (currentPrice * priceMultiplier).toFixed(2);
  return parseFloat(newPrice);
}

/**
 * Update variant price via Shopify Admin API
 * @param {number} variantId - Shopify variant ID
 * @param {number} newPrice - New price to set
 * @returns {Promise<Object>} Updated variant object
 */
async function updateVariantPrice(variantId, newPrice) {
  try {
    const response = await shopifyAPI.put(`/variants/${variantId}.json`, {
      variant: {
        id: variantId,
        price: newPrice.toString()
      }
    });

    console.log(`Updated variant ${variantId} to price: $${newPrice}`);
    return response.data.variant;
  } catch (error) {
    console.error(`Error updating variant ${variantId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Run dynamic pricing for all products
 * Loops through all products, calculates new prices based on inventory,
 * and updates Shopify if prices have changed
 * @param {number} demandFactor - Optional demand multiplier (default: 1.0)
 * @returns {Promise<Object>} Summary of updates
 */
async function runDynamicPricing(demandFactor = 1.0) {
  console.log('Starting dynamic pricing update...');
  console.log('Demand factor:', demandFactor);

  const summary = {
    totalProducts: 0,
    totalVariants: 0,
    updatedVariants: 0,
    errors: []
  };

  try {
    // Fetch all products
    const products = await fetchAllProducts();
    summary.totalProducts = products.length;

    // Process each product and its variants
    for (const product of products) {
      console.log(`\nProcessing product: ${product.title} (ID: ${product.id})`);

      if (!product.variants || product.variants.length === 0) {
        console.log('  No variants found, skipping...');
        continue;
      }

      for (const variant of product.variants) {
        summary.totalVariants++;

        const currentPrice = parseFloat(variant.price);
        const inventory = variant.inventory_quantity || 0;

        console.log(`  Variant: ${variant.title || 'Default'}`);
        console.log(`    Current price: $${currentPrice}`);
        console.log(`    Inventory: ${inventory}`);

        // Calculate new dynamic price
        const newPrice = calculateDynamicPrice(currentPrice, inventory, demandFactor);
        console.log(`    Calculated price: $${newPrice}`);

        // Update if price has changed
        if (newPrice !== currentPrice) {
          try {
            await updateVariantPrice(variant.id, newPrice);
            summary.updatedVariants++;

            // Rate limiting - wait 500ms between API calls
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            summary.errors.push({
              variantId: variant.id,
              error: error.message
            });
          }
        } else {
          console.log('    No price change needed');
        }
      }
    }

    console.log('\n=== Dynamic Pricing Summary ===');
    console.log(`Total products processed: ${summary.totalProducts}`);
    console.log(`Total variants processed: ${summary.totalVariants}`);
    console.log(`Variants updated: ${summary.updatedVariants}`);
    console.log(`Errors encountered: ${summary.errors.length}`);

    if (summary.errors.length > 0) {
      console.log('\nErrors:');
      summary.errors.forEach(err => {
        console.log(`  Variant ${err.variantId}: ${err.error}`);
      });
    }

    return summary;
  } catch (error) {
    console.error('Fatal error during dynamic pricing:', error);
    throw error;
  }
}

/**
 * Send transactional email via SendGrid
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Email body (plain text)
 * @param {string} html - Email body (HTML, optional)
 * @returns {Promise<Object>} SendGrid response
 */
async function sendEmail(to, subject, text, html = null) {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Skipping email send.');
    return { skipped: true, reason: 'No API key' };
  }

  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourstore.com',
    subject,
    text,
    ...(html && { html })
  };

  try {
    const response = await sgMail.send(msg);
    console.log(`Email sent to ${to}: ${subject}`);
    return response;
  } catch (error) {
    console.error('Error sending email:', error.response?.body || error.message);
    throw error;
  }
}

/**
 * Send pricing update notification email
 * @param {Object} summary - Summary from runDynamicPricing
 * @param {string} recipientEmail - Email to send notification to
 */
async function sendPricingUpdateNotification(summary, recipientEmail) {
  const subject = 'Shopify Dynamic Pricing Update Complete';
  const text = `
Dynamic Pricing Update Summary:

Total Products: ${summary.totalProducts}
Total Variants: ${summary.totalVariants}
Updated Variants: ${summary.updatedVariants}
Errors: ${summary.errors.length}

${summary.errors.length > 0 ? '\nErrors:\n' + summary.errors.map(e => `- Variant ${e.variantId}: ${e.error}`).join('\n') : ''}
  `.trim();

  const html = `
    <h2>Dynamic Pricing Update Summary</h2>
    <ul>
      <li><strong>Total Products:</strong> ${summary.totalProducts}</li>
      <li><strong>Total Variants:</strong> ${summary.totalVariants}</li>
      <li><strong>Updated Variants:</strong> ${summary.updatedVariants}</li>
      <li><strong>Errors:</strong> ${summary.errors.length}</li>
    </ul>
    ${summary.errors.length > 0 ? '<h3>Errors:</h3><ul>' + summary.errors.map(e => `<li>Variant ${e.variantId}: ${e.error}</li>`).join('') + '</ul>' : ''}
  `;

  return sendEmail(recipientEmail, subject, text, html);
}

// Export functions
module.exports = {
  fetchAllProducts,
  calculateDynamicPrice,
  updateVariantPrice,
  runDynamicPricing,
  sendEmail,
  sendPricingUpdateNotification
};

// Run if executed directly
if (require.main === module) {
  console.log('Running Shopify Dynamic Pricing Script...\n');

  // Validate required environment variables
  if (!SHOPIFY_SHOP || !SHOPIFY_API_KEY || !SHOPIFY_API_PASSWORD) {
    console.error('Error: Missing required environment variables.');
    console.error('Please set SHOPIFY_SHOP, SHOPIFY_API_KEY, and SHOPIFY_API_PASSWORD');
    process.exit(1);
  }

  // Run dynamic pricing with optional demand factor from command line
  const demandFactor = parseFloat(process.argv[2]) || 1.0;

  runDynamicPricing(demandFactor)
    .then(async (summary) => {
      // Optionally send notification email
      const notificationEmail = process.env.NOTIFICATION_EMAIL;
      if (notificationEmail) {
        await sendPricingUpdateNotification(summary, notificationEmail);
      }
      console.log('\nDynamic pricing complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
