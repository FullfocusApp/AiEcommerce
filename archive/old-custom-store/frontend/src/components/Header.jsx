import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Header = () => {
  const navigate = useNavigate();
  const { getCartItemsCount } = useCart();
  const cartCount = getCartItemsCount();

  return (
    <header className="header">
      <div className="container header-content">
        <h1 onClick={() => navigate('/')}>AiEcommerce</h1>
        <nav>
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            Products
          </a>
          <button className="cart-button" onClick={() => navigate('/cart')}>
            Cart ({cartCount})
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
