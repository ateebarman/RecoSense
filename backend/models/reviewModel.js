const mongoose = require('mongoose');
const ReviewSchema = new mongoose.Schema({
    overall: { type: Number, required: true },
    verified: { type: Boolean, default: false },
    reviewTime: { type: String },
    user_id: { type: String, required: true },
    asin: { type: String, required: true },
    reviewerName: { type: String },
    reviewText: { type: String },
    summary: { type: String },
    unixReviewTime: { type: Number },
    // ABSA Scores
    phone_score: { type: Number, default: 0 },
    battery_score: { type: Number, default: 0 },
    screen_score: { type: Number, default: 0 },
    camera_score: { type: Number, default: 0 },
    price_score: { type: Number, default: 0 },
    software_score: { type: Number, default: 0 },
    quality_score: { type: Number, default: 0 }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
ReviewSchema.virtual('productDetails', { ref: 'Product', localField: 'asin', foreignField: 'asin', justOne: true });

// Performance Indexes
ReviewSchema.index({ asin: 1 });
ReviewSchema.index({ user_id: 1 });
ReviewSchema.index({ battery_score: -1 });
ReviewSchema.index({ camera_score: -1 });
ReviewSchema.index({ price_score: -1 });
ReviewSchema.index({ quality_score: -1 });

module.exports = mongoose.model('Review', ReviewSchema);