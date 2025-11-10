import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare order data
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: `${formData.address}, ${formData.city}, ${formData.zipCode}`,
        },
      };

      // Send order to backend
      const response = await fetch('https://aiecommerce.onrender.com/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const order = await response.json();
      setOrderId(order.id);
      setOrderSuccess(true);
      clearCart();
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (cart.length === 0 && !orderSuccess) {
    return (
      <div className="container checkout-page">
        <h2>Checkout</h2>
        <div className="cart-empty">
          <p>Your cart is empty</p>
          <button className="back-home-btn" onClick={() => navigate('/')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="container checkout-page">
        <div className="success-message">
          <h2>Order Placed Successfully!</h2>
          <p>Thank you for your order. We'll send you a confirmation email shortly.</p>
          <div className="order-id">
            <strong>Order ID:</strong> {orderId}
          </div>
          <button className="back-home-btn" onClick={() => navigate('/')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const total = getCartTotal();

  return (
    <div className="container checkout-page">
      <h2>Checkout</h2>

      <form className="checkout-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <div className="order-summary">
          <h3>Order Summary</h3>
          {cart.map(item => (
            <div key={item.id} className="order-item">
              <span>{item.name} x {item.quantity}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="order-item summary-total">
            <strong>Total</strong>
            <strong>${total.toFixed(2)}</strong>
          </div>
        </div>

        <h3>Shipping Information</h3>

        <div className="form-group">
          <label htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Street Address *</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="city">City *</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="zipCode">ZIP Code *</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          className="submit-order-btn"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
};

export default Checkout;
