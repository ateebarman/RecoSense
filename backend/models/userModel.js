const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    reviewerName: { type: String },
    password: { type: String },
    likedProducts: [{ type: String }],
    // Demographic / location info to help with cold-start recommendations
    age_group: { type: String }, // e.g., '18-24', '25-34'
    gender: { type: String }, // e.g., 'male','female','other'
    location: { type: String } // e.g., 'US', 'India', 'London'
    , isAdmin: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);