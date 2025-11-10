# n8n Workflow Blueprints for Shopify Automation

This document describes several n8n workflows for automating Shopify e-commerce operations. Each workflow can be built in n8n by connecting the described nodes in sequence.

## Table of Contents

1. [Abandoned Cart Recovery](#1-abandoned-cart-recovery)
2. [New Product Social Promotion](#2-new-product-social-promotion)
3. [Order-to-CRM & Invoice Generation](#3-order-to-crm--invoice-generation)
4. [Inventory Sync Across Channels](#4-inventory-sync-across-channels)
5. [Customer Segmentation & Loyalty](#5-customer-segmentation--loyalty)
6. [Automated Fulfillment Updates](#6-automated-fulfillment-updates)

---

## 1. Abandoned Cart Recovery

**Purpose**: Automatically send recovery emails to customers who add items to their cart but don't complete the purchase.

### Workflow Steps:

1. **Trigger Node**: **Shopify Trigger** (Webhook)
   - Event: `carts/create` or `checkouts/create`
   - Listens for cart creation events from Shopify

2. **Wait Node**: **Wait** (Time-based)
   - Wait for 1 hour to allow customer time to complete checkout
   - This gives customers time before sending reminder

3. **Shopify Node**: **Shopify** (Get Checkout)
   - Action: Get checkout details by ID
   - Check if the checkout is still open (not completed)

4. **IF Node**: **IF** (Conditional)
   - Condition: If checkout status is still "open" and email exists
   - True branch continues, False branch ends workflow

5. **SendGrid Node**: **SendGrid** (Send Email)
   - To: Customer email from checkout
   - Subject: "You left something in your cart!"
   - Template: Abandoned cart email with product details and checkout link
   - Include: Cart items, total amount, direct checkout URL

6. **Wait Node**: **Wait** (Time-based)
   - Wait for 24 hours for second follow-up (optional)

7. **Shopify Node**: **Shopify** (Get Checkout) - Repeat check
   - Check again if checkout is still open

8. **IF Node**: **IF** (Conditional)
   - If still open, send discount code offer

9. **Shopify Node**: **Shopify** (Create Discount Code)
   - Create a unique 10% off discount code

10. **SendGrid Node**: **SendGrid** (Send Email)
    - Send second email with discount code incentive

---

## 2. New Product Social Promotion

**Purpose**: Automatically post new products to social media platforms when they're added to your Shopify store.

### Workflow Steps:

1. **Trigger Node**: **Shopify Trigger** (Webhook)
   - Event: `products/create`
   - Triggers when a new product is created in Shopify

2. **Shopify Node**: **Shopify** (Get Product)
   - Action: Get full product details including images, description, price
   - Extract: title, description, images, price, variants

3. **Code Node**: **Code** (JavaScript)
   - Format product data for social posts
   - Create engaging post text with product highlights
   - Extract and prepare image URLs
   - Generate appropriate hashtags

4. **Twitter Node**: **Twitter** (Post Tweet)
   - Post tweet with product announcement
   - Include: Product name, price, link, and image
   - Add relevant hashtags (#NewProduct, #YourBrand, etc.)

5. **Facebook Node**: **Facebook** (Create Post)
   - Post to Facebook Business Page
   - Include: Product description, image, and store link
   - Format with engaging copy

6. **Instagram Node**: **Instagram** (Post Photo)
   - Post product image to Instagram
   - Caption with product details and link in bio mention
   - Use relevant hashtags for reach

7. **Slack Node**: **Slack** (Send Message) - Optional
   - Notify your team that product was posted to social media
   - Include summary and links to posts

---

## 3. Order-to-CRM & Invoice Generation

**Purpose**: Automatically add new orders to your CRM system and generate professional invoices.

### Workflow Steps:

1. **Trigger Node**: **Shopify Trigger** (Webhook)
   - Event: `orders/create`
   - Triggers when a new order is placed

2. **Shopify Node**: **Shopify** (Get Order)
   - Action: Get complete order details
   - Extract: customer info, line items, totals, shipping address

3. **CRM Node**: **HubSpot/Salesforce** (Create or Update Contact)
   - Search for existing contact by email
   - If exists, update; if not, create new contact
   - Update: last order date, total order value, order count

4. **CRM Node**: **HubSpot/Salesforce** (Create Deal)
   - Create a new deal/opportunity for this order
   - Link to the customer contact
   - Set deal amount to order total
   - Set stage to "Closed Won"

5. **Code Node**: **Code** (JavaScript)
   - Format order data for invoice
   - Calculate line items, subtotals, taxes, shipping
   - Prepare data structure for PDF generation

6. **PDF Node**: **HTML to PDF** or **Puppeteer**
   - Generate professional PDF invoice
   - Include: Company logo, order details, line items, totals
   - Use HTML template for formatting

7. **Google Drive Node**: **Google Drive** (Upload File)
   - Upload invoice PDF to Drive
   - Organize in folder structure: `/Invoices/YYYY/MM/`
   - Name file: `Invoice-{order_number}.pdf`

8. **SendGrid Node**: **SendGrid** (Send Email with Attachment)
   - Send invoice to customer email
   - Attach PDF invoice
   - Include order summary and tracking information

9. **Shopify Node**: **Shopify** (Update Order)
   - Add note to order with CRM deal ID and invoice link
   - Tag order as "CRM-Synced" and "Invoice-Sent"

---

## 4. Inventory Sync Across Channels

**Purpose**: Keep inventory synchronized across Shopify and other sales channels (Amazon, eBay, etc.) to prevent overselling.

### Workflow Steps:

1. **Trigger Node**: **Shopify Trigger** (Webhook)
   - Event: `inventory_levels/update`
   - Triggers when inventory changes in Shopify

2. **Shopify Node**: **Shopify** (Get Inventory Item)
   - Get full inventory details
   - Extract: SKU, available quantity, location

3. **Database Node**: **PostgreSQL/MySQL** (Query)
   - Look up product mapping table
   - Match Shopify SKU to SKUs on other platforms
   - Get external platform product IDs

4. **IF Node**: **IF** (Conditional)
   - Check if product exists on Amazon
   - If yes, continue to Amazon sync

5. **Amazon Node**: **HTTP Request** (Amazon MWS/SP-API)
   - Update inventory quantity on Amazon
   - Match by SKU or ASIN
   - Set quantity to match Shopify inventory

6. **IF Node**: **IF** (Conditional)
   - Check if product exists on eBay
   - If yes, continue to eBay sync

7. **eBay Node**: **HTTP Request** (eBay Trading API)
   - Update inventory quantity on eBay
   - Match by SKU or listing ID
   - Set quantity to match Shopify inventory

8. **Database Node**: **PostgreSQL/MySQL** (Insert)
   - Log sync operation
   - Record: timestamp, SKU, old quantity, new quantity, platforms synced
   - Helps with audit trail

9. **Slack Node**: **Slack** (Send Message) - Optional
   - Send alert if inventory falls below threshold (e.g., < 5 units)
   - Notify team to reorder stock

---

## 5. Customer Segmentation & Loyalty

**Purpose**: Automatically segment customers based on purchase behavior and send targeted loyalty rewards.

### Workflow Steps:

1. **Schedule Node**: **Schedule Trigger** (Cron)
   - Run daily at 9:00 AM
   - Processes customer data for segmentation

2. **Shopify Node**: **Shopify** (List Customers)
   - Get all customers (paginated)
   - Limit to customers updated in last 30 days

3. **Loop Node**: **Split in Batches**
   - Process customers in batches of 50
   - Prevents rate limiting

4. **Shopify Node**: **Shopify** (Get Customer Orders)
   - For each customer, get order history
   - Calculate: total orders, total spent, average order value, last order date

5. **Code Node**: **Code** (JavaScript)
   - Segment logic:
     - **VIP**: Total spent > $1000 or > 10 orders
     - **Loyal**: Total spent > $500 or > 5 orders
     - **Regular**: 2-4 orders
     - **New**: 1 order
     - **At Risk**: No order in last 90 days
   - Assign segment tag to customer

6. **Shopify Node**: **Shopify** (Update Customer)
   - Add/update customer tags with segment
   - Update custom attributes with metrics

7. **Switch Node**: **Switch** (Route by Segment)
   - Route customers to different paths based on segment

8. **Path: VIP Customers**
   - **Shopify Node**: Create unique 20% off discount code
   - **SendGrid Node**: Send exclusive VIP offer email
   - **Slack Node**: Notify team about VIP customer activity

9. **Path: Loyal Customers**
   - **Shopify Node**: Create 15% off discount code
   - **SendGrid Node**: Send loyalty appreciation email

10. **Path: At Risk Customers**
    - **Shopify Node**: Create 25% off "We miss you" discount code
    - **SendGrid Node**: Send re-engagement email with incentive

11. **Database Node**: **PostgreSQL/MySQL** (Insert)
    - Store segmentation results for analytics
    - Track segment changes over time

---

## 6. Automated Fulfillment Updates

**Purpose**: Automatically update customers with fulfillment status and tracking information.

### Workflow Steps:

1. **Trigger Node**: **Shopify Trigger** (Webhook)
   - Event: `fulfillments/create` or `fulfillments/update`
   - Triggers when order is fulfilled or tracking updates

2. **Shopify Node**: **Shopify** (Get Fulfillment)
   - Get fulfillment details
   - Extract: tracking number, carrier, tracking URL, fulfillment status

3. **Shopify Node**: **Shopify** (Get Order)
   - Get associated order details
   - Extract: customer email, order number, line items

4. **IF Node**: **IF** (Conditional)
   - Check if tracking number exists
   - If yes, continue with tracking update

5. **HTTP Request Node**: **HTTP Request** (Carrier API)
   - Query carrier API (FedEx, UPS, USPS) for tracking details
   - Get: current location, estimated delivery date, delivery status

6. **Code Node**: **Code** (JavaScript)
   - Format tracking information
   - Create customer-friendly status message
   - Generate timeline of tracking events

7. **SendGrid Node**: **SendGrid** (Send Email)
   - Send shipping confirmation email
   - Include: Order summary, tracking number, tracking URL, estimated delivery
   - Use branded email template

8. **Twilio Node**: **Twilio** (Send SMS) - Optional
   - Send SMS notification for high-value orders
   - Text: "Your order #{order_number} has shipped! Track: {tracking_url}"

9. **IF Node**: **IF** (Conditional)
   - Check if fulfillment status is "delivered"
   - If delivered, request review

10. **Wait Node**: **Wait** (Time-based)
    - Wait 3 days after delivery
    - Give customer time to receive and use product

11. **SendGrid Node**: **SendGrid** (Send Email)
    - Send review request email
    - Include: Product images, links to leave review
    - Offer incentive (5% off next order for review)

12. **Shopify Node**: **Shopify** (Update Order)
    - Add note with fulfillment tracking history
    - Tag order as "Review-Requested"

---

## Getting Started with These Workflows

### Prerequisites

- n8n instance (self-hosted or n8n.cloud)
- Shopify store with Admin API access
- API credentials for integrated services (SendGrid, social platforms, CRM, etc.)

### Import Instructions

1. **Create New Workflow**: In n8n, click "New Workflow"
2. **Add Nodes**: Follow the node sequence described in each workflow
3. **Configure Credentials**: Set up credentials for each service (Shopify, SendGrid, etc.)
4. **Configure Webhooks**: In Shopify Admin, set up webhooks pointing to your n8n webhook URLs
5. **Test Workflow**: Use n8n's test execution feature to validate each node
6. **Activate**: Once tested, activate the workflow for production use

### Tips for Implementation

- **Start Simple**: Begin with one workflow and expand
- **Use n8n Templates**: Check n8n community for starter templates
- **Error Handling**: Add error workflow nodes to catch and log failures
- **Rate Limiting**: Add delays between API calls to respect rate limits
- **Monitoring**: Set up Slack/email alerts for workflow failures
- **Staging**: Test workflows in Shopify development store first

### Environment Variables Needed

Configure these in n8n or your environment:

- `SHOPIFY_SHOP`: Your Shopify store domain
- `SHOPIFY_API_KEY`: Shopify Admin API key
- `SHOPIFY_API_PASSWORD`: Shopify Admin API password/token
- `SENDGRID_API_KEY`: SendGrid API key for emails
- `CRM_API_KEY`: HubSpot/Salesforce API credentials
- Platform-specific credentials for Amazon, eBay, social media, etc.

---

## Workflow Maintenance

- **Regular Updates**: Check for API version changes quarterly
- **Performance Monitoring**: Track execution times and failure rates
- **Logging**: Maintain logs of all automated actions
- **Audit Trail**: Keep records of inventory syncs and customer communications
- **Compliance**: Ensure email communications comply with CAN-SPAM and GDPR

## Support and Resources

- [n8n Documentation](https://docs.n8n.io/)
- [Shopify API Documentation](https://shopify.dev/api)
- [n8n Community Forum](https://community.n8n.io/)
- [Workflow Templates](https://n8n.io/workflows/)

---

**Note**: These blueprints are templates. Customize them based on your specific business needs, product catalog, and customer communication preferences.
