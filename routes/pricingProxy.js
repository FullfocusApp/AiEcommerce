const express = require('express');
const axios = require('axios');
const router = express.Router();

const PRICING_SERVICE_URL = process.env.PRICING_SERVICE_URL || 'http://localhost:3003';

router.all('*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${PRICING_SERVICE_URL}${req.path}`,
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
