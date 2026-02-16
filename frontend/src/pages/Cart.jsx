import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  Package,
  ShieldCheck,
  Truck,
  CreditCard
} from 'lucide-react';
import '../styles/Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, removeItemFromCart, updateItemQuantity, getCartTotal, getCartCount } = useCart();
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = async (asin, newQuantity) => {
    if (newQuantity < 1) return;
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
    if (cartItems.length === 0) return;
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="page-container">
        <header className="page-header">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="welcome-badge">
              <ShoppingBag size={14} />
              <span>Your shopping bag</span>
            </div>
            <h1>Shopping <span className="gradient-text">Cart</span></h1>
          </motion.div>
        </header>

        <motion.div
          className="empty-state-premium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="empty-icon">
            <ShoppingBag />
          </div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <Link to="/shop" className="btn-primary">
            Start Shopping <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const tax = subtotal * 0.08;
  const shipping = 0; // Free shipping
  const total = subtotal + tax + shipping;

  return (
    <div className="page-container">
      <header className="page-header">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="welcome-badge">
            <Package size={14} />
            <span>{getCartCount()} Items in your bag</span>
          </div>
          <h1>Your <span className="gradient-text">Selection</span></h1>
        </motion.div>
        <Link to="/shop" className="btn-secondary">
          <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back to Shop
        </Link>
      </header>

      <div className="cart-content">
        <div className="cart-items-section">
          <AnimatePresence>
            {cartItems.map((item) => (
              <motion.div
                key={item.asin}
                className="cart-item-premium glass-card"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="cart-item-image">
                  <img src={item.image || 'https://via.placeholder.com/100'} alt={item.title} />
                </div>

                <div className="cart-item-info">
                  <Link to={`/product/${encodeURIComponent(item.asin)}`} className="item-title">
                    {item.title}
                  </Link>
                  <span className="item-brand-badge">{item.brand}</span>
                  <p className="item-price-tag">{item.price}</p>
                </div>

                <div className="cart-item-actions">
                  <div className="qty-control">
                    <button
                      onClick={() => handleQuantityChange(item.asin, item.quantity - 1)}
                      disabled={loading || item.quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.asin, item.quantity + 1)}
                      disabled={loading}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    className="remove-item-btn"
                    onClick={() => handleRemoveItem(item.asin)}
                    disabled={loading}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.aside
          className="cart-summary-premium glass-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="summary-title">Order Summary</h3>

          <div className="summary-details">
            <div className="summary-line">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Estimated Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Shipping</span>
              <span className="text-success">Free</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span className="total-amount">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="checkout-btn-premium btn-primary w-full"
            onClick={handleCheckout}
            disabled={loading}
          >
            Checkout Now <CreditCard size={18} />
          </button>

          <div className="trust-badges">
            <div className="trust-item">
              <ShieldCheck size={16} />
              <span>Secure Checkout</span>
            </div>
            <div className="trust-item">
              <Truck size={16} />
              <span>Fast Delivery</span>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
};

export default Cart;
