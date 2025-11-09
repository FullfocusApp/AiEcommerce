const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const ordersFile = path.join(__dirname, '../data/orders.json');
const productsFile = path.join(__dirname, '../data/products.json');

// Helper functions
const getOrders = () => {
  const data = fs.readFileSync(ordersFile, 'utf8');
  return JSON.parse(data);
};

const saveOrders = (orders) => {
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
};

const getProducts = () => {
  const data = fs.readFileSync(productsFile, 'utf8');
  return JSON.parse(data);
};

const saveProducts = (products) => {
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
};

// POST create new order
router.post('/', (req, res) => {
  try {
    const { items, customer } = req.body;

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order items' });
    }

    if (!customer || !customer.name || !customer.email || !customer.address) {
      return res.status(400).json({ error: 'Invalid customer information' });
    }

    // Get current products to check stock and calculate total
    const products = getProducts();
    let total = 0;
    const orderItems = [];

    // Validate items and calculate total
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);

      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemTotal
      });

      // Update product stock
      product.stock -= item.quantity;
    }

    // Create order
    const order = {
      id: uuidv4(),
      items: orderItems,
      customer,
      total: parseFloat(total.toFixed(2)),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Save order
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);

    // Update product stock
    saveProducts(products);

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET all orders
router.get('/', (req, res) => {
  try {
    const orders = getOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET single order by ID
router.get('/:id', (req, res) => {
  try {
    const orders = getOrders();
    const order = orders.find(o => o.id === req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;
