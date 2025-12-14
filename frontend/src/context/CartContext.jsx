import React, { createContext, useState, useContext, useEffect } from 'react';
import { useUser } from './UserContext';
import { fetchCart, addToCart, removeFromCart, updateQuantity } from '../services/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user_id } = useUser();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch cart from backend when user logs in
  useEffect(() => {
    if (user_id) {
      loadCart();
    } else {
      setCartItems([]);
    }
  }, [user_id]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await fetchCart(user_id);
      setCartItems(response.data.items || []);
      setError('');
    } catch (err) {
      console.error('Failed to load cart:', err);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const addItemToCart = async (asin, product, quantity = 1) => {
    try {
      setError('');
      const response = await addToCart(user_id, asin, quantity, product);
      setCartItems(response.data.items || []);
    } catch (err) {
      console.error('Failed to add item to cart:', err);
      setError('Failed to add item to cart');
      throw err;
    }
  };

  const removeItemFromCart = async (asin) => {
    try {
      setError('');
      const response = await removeFromCart(user_id, asin);
      setCartItems(response.data.items || []);
    } catch (err) {
      console.error('Failed to remove item from cart:', err);
      setError('Failed to remove item from cart');
      throw err;
    }
  };

  const updateItemQuantity = async (asin, quantity) => {
    try {
      setError('');
      if (quantity <= 0) {
        await removeItemFromCart(asin);
      } else {
        const response = await updateQuantity(user_id, asin, quantity);
        setCartItems(response.data.items || []);
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
      setError('Failed to update quantity');
      throw err;
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price?.replace('$', '') || 0);
      return total + price * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        error,
        addItemToCart,
        removeItemFromCart,
        updateItemQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
