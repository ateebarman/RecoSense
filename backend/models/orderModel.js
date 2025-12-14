const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    orderNumber: { type: String, unique: true, required: true },
    items: [
      {
        asin: { type: String, required: true },
        title: { type: String },
        brand: { type: String },
        price: { type: String },
        image: { type: String },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    shippingInfo: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    paymentInfo: {
      cardLast4: { type: String },
      cardType: { type: String },
    },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'confirmed',
    },
    orderDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
