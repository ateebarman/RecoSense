const mongoose = require('mongoose');
const ReviewSchema = new mongoose.Schema({
    overall: { type: Number, required: true }, verified: { type: Boolean, default: false }, reviewTime: { type: String }, user_id: { type: String, required: true }, asin: { type: String, required: true }, reviewerName: { type: String }, reviewText: { type: String }, summary: { type: String }, unixReviewTime: { type: Number }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
ReviewSchema.virtual('productDetails', { ref: 'Product', localField: 'asin', foreignField: 'asin', justOne: true });
module.exports = mongoose.model('Review', ReviewSchema);