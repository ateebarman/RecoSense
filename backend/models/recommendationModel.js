const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    recommendations: [{
        rank: Number,
        asin: String,
        score: Number,
        title: String,
        price: String,
        category: String,
        images: [String]
    }]
}, { timestamps: true });

module.exports = mongoose.model('Recommendation', RecommendationSchema);
