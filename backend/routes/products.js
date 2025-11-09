const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const productsFile = path.join(__dirname, '../data/products.json');

// Helper function to read products
const getProducts = () => {
  const data = fs.readFileSync(productsFile, 'utf8');
  return JSON.parse(data);
};

// GET all products
router.get('/', (req, res) => {
  try {
    const products = getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product by ID
router.get('/:id', (req, res) => {
  try {
    const products = getProducts();
    const product = products.find(p => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// GET products by category
router.get('/category/:category', (req, res) => {
  try {
    const products = getProducts();
    const filteredProducts = products.filter(
      p => p.category.toLowerCase() === req.params.category.toLowerCase()
    );
    res.json(filteredProducts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products by category' });
  }
});

module.exports = router;
