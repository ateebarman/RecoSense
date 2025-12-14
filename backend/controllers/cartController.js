const Cart = require('../models/cartModel');

// Get cart for a user
exports.getCart = async (req, res) => {
  try {
    const { user_id } = req.params;
    let cart = await Cart.findOne({ user_id });

    if (!cart) {
      cart = new Cart({ user_id, items: [] });
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { asin, quantity, product } = req.body;

    let cart = await Cart.findOne({ user_id });

    if (!cart) {
      cart = new Cart({
        user_id,
        items: [
          {
            asin,
            title: product?.title,
            brand: product?.brand,
            price: product?.price,
            image: product?.imageURLHighRes?.[0],
            quantity: parseInt(quantity) || 1,
          },
        ],
      });
    } else {
      // Check if item already exists in cart
      const existingItem = cart.items.find((item) => item.asin === asin);

      if (existingItem) {
        // Update quantity if item exists
        existingItem.quantity += parseInt(quantity) || 1;
      } else {
        // Add new item
        cart.items.push({
          asin,
          title: product?.title,
          brand: product?.brand,
          price: product?.price,
          image: product?.imageURLHighRes?.[0],
          quantity: parseInt(quantity) || 1,
        });
      }
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error adding to cart', error });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { user_id, asin } = req.params;

    const cart = await Cart.findOne({ user_id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item.asin !== asin);
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error removing from cart', error });
  }
};

// Update item quantity in cart
exports.updateQuantity = async (req, res) => {
  try {
    const { user_id, asin } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user_id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find((item) => item.asin === asin);

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items = cart.items.filter((item) => item.asin !== asin);
    } else {
      item.quantity = parseInt(quantity);
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error updating quantity', error });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const { user_id } = req.params;

    const cart = await Cart.findOne({ user_id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cart', error });
  }
};
