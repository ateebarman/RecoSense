# Shopping Cart Functionality - Implementation Summary

## Overview
A complete shopping cart system has been added to your Recommender System Website, enabling users to add products to a cart, manage quantities, and proceed to checkout.

---

## Frontend Changes

### 1. **New Context: CartContext.jsx**
- **Location**: `frontend/src/context/CartContext.jsx`
- **Features**:
  - Manages cart state globally
  - Provides cart operations: add, remove, update quantity
  - Persists cart to backend
  - Calculates cart total and item count
  - Functions:
    - `addItemToCart(asin, product, quantity)`
    - `removeItemFromCart(asin)`
    - `updateItemQuantity(asin, quantity)`
    - `clearCart()`
    - `getCartTotal()`
    - `getCartCount()`

### 2. **New Pages**

#### Cart Page (`frontend/src/pages/Cart.jsx`)
- Displays all items in the shopping cart
- Features:
  - Item quantity adjustment
  - Remove item functionality
  - Order summary with subtotal, shipping, and tax
  - "Proceed to Checkout" button
  - "Continue Shopping" link
  - Responsive design
- Styling: `frontend/src/styles/Cart.css`

#### Checkout Page (`frontend/src/pages/Checkout.jsx`)
- Complete checkout form with:
  - Shipping Information (name, email, address, city, state, zip)
  - Payment Information (card number, expiry, CVV)
  - Order summary sidebar
  - Order total calculation with tax
- Features:
  - Form validation
  - Order placement confirmation
  - Clears cart after successful order
  - Redirects to home page
- Styling: `frontend/src/styles/Checkout.css`

### 3. **Updated Components**

#### ProductCard.jsx
- Added "Add to Cart" button (🛒 emoji)
- Button appears alongside the like button
- Click handler with product data passed to cart
- Loading state while adding to cart

#### ProductDetail.jsx
- Added quantity selector (number input)
- Added "Add to Cart" button on product detail page
- Allows users to select quantity before adding to cart
- Confirmation message after adding to cart

#### Navbar.jsx
- Added shopping cart link with badge
- Badge displays current cart item count
- Cart icon (🛒) with dynamic count update
- Updates in real-time as items are added/removed

### 4. **Updated Services**

#### api.js
Added new cart API endpoints:
```javascript
export const fetchCart = (user_id)
export const addToCart = (user_id, asin, quantity, product)
export const removeFromCart = (user_id, asin)
export const updateQuantity = (user_id, asin, quantity)
```

### 5. **Routing Updates**

#### App.jsx
- Added `/cart` route → Cart page
- Added `/checkout` route → Checkout page
- Protected routes (require user login)

#### main.jsx
- Wrapped app with `CartProvider` to enable cart context

### 6. **Styling**

#### Cart.css
- Cart item display with image, details, quantity, price
- Order summary sidebar
- Checkout button styling
- Responsive mobile layout
- Sticky summary panel

#### Checkout.css
- Two-column layout (order summary + form)
- Styled form fields with focus states
- Order items list with totals
- Payment form styling
- Responsive design

#### App.css Updates
- Product card actions container
- Add to cart button styling (green color #28a745)
- Quantity selector styling
- Cart badge styling with red notification color

---

## Backend Changes

### 1. **New Model: cartModel.js**
- **Location**: `backend/models/cartModel.js`
- **Schema**:
  ```javascript
  {
    user_id: String (unique),
    items: [
      {
        asin: String,
        title: String,
        brand: String,
        price: String,
        image: String,
        quantity: Number
      }
    ],
    timestamps: true
  }
  ```

### 2. **New Controller: cartController.js**
- **Location**: `backend/controllers/cartController.js`
- **Functions**:
  - `getCart(user_id)` - Retrieve user's cart
  - `addToCart(user_id, asin, quantity, product)` - Add or update item
  - `removeFromCart(user_id, asin)` - Remove item from cart
  - `updateQuantity(user_id, asin, quantity)` - Update item quantity
  - `clearCart(user_id)` - Clear all items

### 3. **New Routes: cartRoutes.js**
- **Location**: `backend/routes/cartRoutes.js`
- **Endpoints**:
  - `GET /api/cart/:user_id` - Get cart
  - `POST /api/cart/:user_id` - Add to cart
  - `PUT /api/cart/:user_id/:asin` - Update quantity
  - `DELETE /api/cart/:user_id/:asin` - Remove item
  - `DELETE /api/cart/:user_id` - Clear cart

### 4. **Server.js Updates**
- Registered cart routes: `app.use("/api/cart", cartRoutes);`

---

## User Flow

1. **Browse Products**
   - User views products on home page
   - Each product card has "Add to Cart" button

2. **Add to Cart**
   - Click "Add to Cart" on product card (default quantity: 1)
   - Or go to product detail page, select quantity, then add

3. **View Cart**
   - Click cart icon in navbar
   - See all items with quantities, prices
   - Adjust quantities or remove items
   - View order summary with totals

4. **Checkout**
   - Click "Proceed to Checkout"
   - Fill in shipping and payment details
   - Review order summary
   - Place order
   - Cart clears, redirected to home page

---

## Key Features

✅ **Persistent Storage** - Cart saved to MongoDB database
✅ **Real-time Updates** - Cart count updates in navbar instantly
✅ **Quantity Management** - Add/remove/update item quantities
✅ **Order Summary** - Automatic calculation of totals with tax
✅ **Responsive Design** - Works on desktop and mobile
✅ **User-Friendly** - Simple, intuitive interface
✅ **Data Persistence** - Cart survives page refreshes (synced with backend)
✅ **Validation** - Form validation on checkout

---

## Technical Stack

**Frontend**:
- React Context API for state management
- React Router for navigation
- Axios for API calls
- CSS for styling

**Backend**:
- Node.js/Express for API
- MongoDB for data persistence
- Mongoose for database modeling

---

## Testing the Cart

1. **Add Item**:
   - Go to home page, click "Add to Cart" on any product
   - Should see cart badge update in navbar

2. **View Cart**:
   - Click cart icon in navbar
   - Should see added items with quantities

3. **Adjust Quantity**:
   - Change quantity input in cart
   - Should update in real-time

4. **Remove Item**:
   - Click "Remove" button on item
   - Should disappear from cart

5. **Checkout**:
   - Click "Proceed to Checkout"
   - Fill in details
   - Click "Place Order"
   - Should show confirmation and clear cart

---

## Files Created/Modified

### Created Files:
- `frontend/src/context/CartContext.jsx`
- `frontend/src/pages/Cart.jsx`
- `frontend/src/pages/Checkout.jsx`
- `frontend/src/styles/Cart.css`
- `frontend/src/styles/Checkout.css`
- `backend/models/cartModel.js`
- `backend/controllers/cartController.js`
- `backend/routes/cartRoutes.js`

### Modified Files:
- `frontend/src/App.jsx`
- `frontend/src/main.jsx`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/ProductCard.jsx`
- `frontend/src/pages/ProductDetail.jsx`
- `frontend/src/services/api.js`
- `frontend/src/App.css`
- `backend/server.js`

---

## Notes

- Cart is tied to user_id, so each user has their own cart
- Cart data is stored in MongoDB and persists across sessions
- Tax is calculated at 8% of subtotal (configurable)
- Shipping is free (can be customized)
- Payment processing is mocked (for demo purposes)
- To use in production, integrate with real payment gateway (Stripe, PayPal, etc.)

---

## Future Enhancements

- Integration with real payment gateway
- Order history page
- Discount/coupon codes
- Inventory management
- Order tracking
- Email confirmations
- Wishlist integration with cart
