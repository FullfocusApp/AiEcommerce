# AiEcommerce

A modern, full-stack e-commerce web application built with Node.js, Express, and React. This application demonstrates core e-commerce functionality including product catalog, shopping cart, and checkout process, all using free and open-source tools.

## Features

- **Product Catalog**: Browse products with images, descriptions, prices, and stock information
- **Shopping Cart**: Add, remove, and update product quantities in your cart
- **Persistent Cart**: Cart data is saved in localStorage and persists across sessions
- **Checkout Process**: Simple checkout form with order submission
- **Order Management**: Orders are stored in a JSON file with unique IDs
- **Stock Management**: Product stock is automatically updated when orders are placed
- **Responsive Design**: Clean, modern UI that works on all devices

## Tech Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web application framework
- **CORS**: Cross-origin resource sharing middleware
- **UUID**: Generate unique order IDs

### Frontend
- **React**: UI library
- **React Router**: Client-side routing
- **Vite**: Fast build tool and development server
- **Context API**: State management for shopping cart

### Data Storage
- **JSON Files**: Simple file-based data storage (no database required)

## Project Structure

```
AiEcommerce/
├── backend/
│   ├── data/
│   │   ├── products.json    # Product catalog data
│   │   └── orders.json      # Order history
│   ├── routes/
│   │   ├── products.js      # Product API routes
│   │   └── orders.js        # Order API routes
│   ├── server.js            # Express server setup
│   └── package.json         # Backend dependencies
├── frontend/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   │   ├── Header.jsx
│   │   │   └── ProductCard.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── Products.jsx
│   │   │   ├── Cart.jsx
│   │   │   └── Checkout.jsx
│   │   ├── context/         # React Context for state management
│   │   │   └── CartContext.jsx
│   │   ├── App.jsx          # Main application component
│   │   ├── main.jsx         # Application entry point
│   │   └── index.css        # Global styles
│   ├── index.html           # HTML template
│   ├── vite.config.js       # Vite configuration
│   └── package.json         # Frontend dependencies
└── README.md                # This file
```

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)

To check if you have Node.js and npm installed:
```bash
node --version
npm --version
```

If not installed, download from [nodejs.org](https://nodejs.org/)

## Installation

### 1. Clone or Download the Repository

```bash
git clone <repository-url>
cd AiEcommerce
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Running the Application

You need to run both the backend and frontend servers. Open two terminal windows:

### Terminal 1: Start the Backend Server

```bash
cd backend
npm start
```

The backend server will start on **http://localhost:5000**

For development with auto-restart on file changes:
```bash
npm run dev
```

### Terminal 2: Start the Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on **http://localhost:3000**

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a single product by ID
- `GET /api/products/category/:category` - Get products by category

### Orders

- `POST /api/orders` - Create a new order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get a single order by ID

### Example Order Request

```json
POST /api/orders
Content-Type: application/json

{
  "items": [
    {
      "productId": "1",
      "quantity": 2
    }
  ],
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-0123",
    "address": "123 Main St, New York, NY 10001"
  }
}
```

## How to Use the Application

1. **Browse Products**: The home page displays all available products with images, descriptions, prices, and stock levels.

2. **Add to Cart**: Click the "Add to Cart" button on any product to add it to your shopping cart. The cart count in the header updates automatically.

3. **View Cart**: Click the "Cart" button in the header to view your shopping cart. Here you can:
   - Adjust quantities using + and - buttons
   - Remove items
   - See the order total
   - Proceed to checkout

4. **Checkout**: Fill in the shipping information form and click "Place Order". The order will be submitted to the backend, and you'll receive a confirmation with your order ID.

5. **Persistent Cart**: Your cart is saved in the browser's localStorage, so it will persist even if you close the browser or refresh the page.

## Data Management

### Products Data

Products are stored in `backend/data/products.json`. You can edit this file to:
- Add new products
- Update product information
- Change prices or stock levels

### Orders Data

Orders are stored in `backend/data/orders.json`. Each order includes:
- Unique order ID
- Customer information
- Order items with quantities and prices
- Order total
- Timestamp
- Order status

## Customization

### Adding New Products

Edit `backend/data/products.json`:

```json
{
  "id": "9",
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "category": "Electronics",
  "image": "https://example.com/image.jpg",
  "stock": 50
}
```

### Styling

All styles are in `frontend/src/index.css`. You can customize:
- Colors
- Fonts
- Layout
- Spacing

### API Base URL

If you deploy the backend to a different URL, update the Vite proxy configuration in `frontend/vite.config.js`:

```javascript
proxy: {
  '/api': {
    target: 'http://your-backend-url',
    changeOrigin: true
  }
}
```

## Building for Production

### Build Frontend

```bash
cd frontend
npm run build
```

This creates an optimized production build in the `frontend/dist` directory.

### Serve Production Build

```bash
npm run preview
```

## Troubleshooting

### Port Already in Use

If port 5000 or 3000 is already in use:

**Backend**: Set a different port
```bash
PORT=5001 npm start
```

**Frontend**: Edit `frontend/vite.config.js` and change the port number

### CORS Issues

If you encounter CORS errors, ensure the backend CORS middleware is properly configured in `backend/server.js`.

### Cart Not Persisting

Clear your browser's localStorage and refresh:
- Open Developer Tools (F12)
- Go to Application/Storage tab
- Clear localStorage
- Refresh the page

## Automation & Shopify Integration

This application now includes powerful automation features for Shopify stores, including dynamic pricing based on inventory levels and comprehensive workflow blueprints for n8n automation platform.

### Shopify Integration Script

The `backend/shopifyIntegration.js` script provides automated dynamic pricing for your Shopify store. It analyzes inventory levels and automatically adjusts prices to optimize sales:

- **Low inventory** (< 10 units): Increases price by up to 10% to capitalize on scarcity
- **High inventory** (> 100 units): Decreases price by 5% to move stock faster
- **Normal inventory**: Maintains current pricing

#### Running the Script

```bash
cd backend
node shopifyIntegration.js
```

You can optionally provide a demand factor multiplier:

```bash
node shopifyIntegration.js 1.2  # Apply 20% demand increase
```

#### Required Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```bash
# Shopify Configuration (Required)
SHOPIFY_SHOP=your-store.myshopify.com
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_PASSWORD=your_api_password

# Email Notifications (Optional)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourstore.com
NOTIFICATION_EMAIL=admin@yourstore.com
```

#### Features

- **Fetch Products**: Retrieves all products and variants from your Shopify store
- **Dynamic Pricing**: Calculates optimal prices based on inventory and demand
- **Automated Updates**: Updates variant prices via Shopify Admin API
- **Email Notifications**: Sends summary reports via SendGrid (optional)
- **Rate Limiting**: Respects Shopify API rate limits with automatic delays
- **Error Handling**: Comprehensive error logging and recovery

#### Script Functions

The script exports the following functions for programmatic use:

```javascript
const {
  fetchAllProducts,
  calculateDynamicPrice,
  updateVariantPrice,
  runDynamicPricing,
  sendEmail,
  sendPricingUpdateNotification
} = require('./backend/shopifyIntegration');
```

### n8n Workflow Blueprints

The `n8n/blueprint.md` file contains detailed workflow descriptions for automating various aspects of your Shopify store. These workflows can be implemented in n8n (a free workflow automation tool).

#### Available Workflows

1. **Abandoned Cart Recovery**: Automatically send recovery emails with discount codes to customers who abandon their carts

2. **New Product Social Promotion**: Auto-post new products to Twitter, Facebook, and Instagram when added to Shopify

3. **Order-to-CRM & Invoice Generation**: Sync orders to HubSpot/Salesforce and generate professional PDF invoices

4. **Inventory Sync Across Channels**: Keep inventory synchronized across Shopify, Amazon, eBay, and other platforms

5. **Customer Segmentation & Loyalty**: Automatically segment customers (VIP, Loyal, At Risk) and send targeted rewards

6. **Automated Fulfillment Updates**: Send tracking updates and request reviews after delivery

#### Implementing n8n Workflows

1. Install n8n (self-hosted or use n8n.cloud)
2. Create a new workflow in n8n
3. Follow the node sequences described in `n8n/blueprint.md`
4. Configure credentials for Shopify, SendGrid, and other services
5. Set up webhooks in Shopify Admin
6. Test and activate workflows

For detailed instructions, see [`n8n/blueprint.md`](./n8n/blueprint.md).

### Scheduling Automated Pricing

To run dynamic pricing automatically, set up a cron job:

```bash
# Run dynamic pricing every day at 3 AM
0 3 * * * cd /path/to/AiEcommerce/backend && node shopifyIntegration.js >> /var/log/shopify-pricing.log 2>&1
```

Or use n8n with a Schedule Trigger node to run the script at specified intervals.

### Installation of Automation Dependencies

After cloning the repository, install the required dependencies:

```bash
cd backend
npm install
```

This will install:
- `axios`: HTTP client for Shopify API requests
- `@sendgrid/mail`: Email notifications
- `dotenv`: Environment variable management

## Future Enhancements

Potential features to add:
- User authentication and login
- Product search and filtering
- Product categories navigation
- Product reviews and ratings
- Order history for users
- Admin panel for managing products
- Payment gateway integration
- Email notifications
- Database integration (MongoDB, PostgreSQL)

## Cost Information

This application uses only free and open-source tools:
- ✅ Node.js - Free
- ✅ Express - Free
- ✅ React - Free
- ✅ Vite - Free
- ✅ All npm packages - Free

**Total Cost: $0**

To deploy for free, consider:
- **Backend**: Railway, Render, Fly.io (free tiers)
- **Frontend**: Netlify, Vercel, GitHub Pages (free tiers)

## License

MIT License - Feel free to use this project for learning or commercial purposes.

## Support

For issues or questions, please check:
1. This README for common solutions
2. The code comments for implementation details
3. The console for error messages

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

---

**Happy Shopping!** 🛒
