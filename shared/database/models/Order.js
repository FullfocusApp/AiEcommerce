const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  shopifyId: {
    type: String,
    required: true,
    unique: true,
  },
  orderNumber: Number,
  customerId: String,
  customerEmail: String,
  lineItems: [{
    productId: String,
    variantId: String,
    title: String,
    quantity: Number,
    price: Number,
  }],
  totalPrice: Number,
  subtotalPrice: Number,
  totalTax: Number,
  shippingAddress: {
    address1: String,
    city: String,
    province: String,
    country: String,
    zip: String,
  },
  financialStatus: String,
  fulfillmentStatus: String,
  createdAt: Date,
  updatedAt: Date,
});

orderSchema.index({ shopifyId: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
