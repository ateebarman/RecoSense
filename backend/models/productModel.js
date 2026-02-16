const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({
    asin: { type: String, required: true, unique: true }, title: { type: String }, description: [String], price: { type: String }, brand: { type: String }, imageURLHighRes: [String], categories: [[String]]
}, { timestamps: true });

// Performance & Search Optimization
ProductSchema.index({ title: 'text', brand: 'text' });
ProductSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', ProductSchema);