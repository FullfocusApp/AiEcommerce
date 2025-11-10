import React from 'react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <div className="product-card">
      <img
        src={product.image}
        alt={product.name}
        className="product-image"
      />
      <div className="product-info">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <p className="product-price">${product.price.toFixed(2)}</p>
        <p className="product-stock">
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </p>
        <button
          className="add-to-cart-btn"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
