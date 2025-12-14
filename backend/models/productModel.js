const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({
    asin: { type: String, required: true, unique: true }, title: { type: String }, description: [String], price: { type: String }, brand: { type: String }, imageURLHighRes: [String], categories: [[String]]
}, { timestamps: true });
module.exports = mongoose.model('Product', ProductSchema);