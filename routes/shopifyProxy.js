const express = require('express');
const axios = require('axios');
const router = express.Router();

const SHOPIFY_SERVICE_URL = process.env.SHOPIFY_SERVICE_URL || 'http://localhost:3001';

// Proxy all requests to shopify service
router.all('*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${SHOPIFY_SERVICE_URL}${req.path}`,
      data: req.body,
      params: req.query,
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.message,
    });
  }
});

module.exports = router;
