const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true },
    items: [
      {
        asin: { type: String, required: true },
        title: { type: String },
        brand: { type: String },
        price: { type: String },
        image: { type: String },
        quantity: { type: Number, required: true, min: 1, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', CartSchema);
