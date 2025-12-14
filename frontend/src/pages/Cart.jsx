import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, removeItemFromCart, updateItemQuantity, getCartTotal, getCartCount } = useCart();
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = async (asin, newQuantity) => {
    try {
      setLoading(true);
      await updateItemQuantity(asin, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (asin) => {
    try {
      setLoading(true);
      await removeItemFromCart(asin);
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <h1>Shopping Cart</h1>
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <Link to="/" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const total = getCartTotal();

  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>
      <p className="cart-count">Items in cart: {getCartCount()}</p>

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map((item) => (
            <div key={item.asin} className="cart-item">
              <div className="item-image">
                <img
                  src={item.image || 'https://via.placeholder.com/100'}
                  alt={item.title}
                />
              </div>
              <div className="item-details">
                <Link to={`/product/${item.asin}`} className="item-title">
                  {item.title}
                </Link>
                <p className="item-brand">{item.brand}</p>
                <p className="item-price">{item.price}</p>
              </div>
              <div className="item-quantity">
                <label htmlFor={`qty-${item.asin}`}>Quantity:</label>
                <input
                  id={`qty-${item.asin}`}
                  type="number"
                  min="1"
                  max="100"
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(item.asin, parseInt(e.target.value))
                  }
                  disabled={loading}
                />
              </div>
              <div className="item-total">
                <p>
                  ${(parseFloat(item.price?.replace('$', '') || 0) * item.quantity).toFixed(2)}
                </p>
              </div>
              <button
                className="remove-btn"
                onClick={() => handleRemoveItem(item.asin)}
                disabled={loading}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping:</span>
            <span>Free</span>
          </div>
          <div className="summary-row">
            <span>Tax (estimated):</span>
            <span>${(total * 0.08).toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>${(total * 1.08).toFixed(2)}</span>
          </div>

          <button
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={loading}
          >
            Proceed to Checkout
          </button>

          <Link to="/" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
