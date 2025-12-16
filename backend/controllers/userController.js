const User = require('../models/userModel');
const crypto = require('crypto');

exports.getUser = async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.params.user_id });
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        res.json(user);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

const retrainManager = require('../recommender/retrainManager');

exports.toggleLikeProduct = async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.params.user_id });
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        const { asin } = req.body;
        const isLiked = user.likedProducts.includes(asin);
        if (isLiked) { user.likedProducts = user.likedProducts.filter(id => id !== asin); }
        else { user.likedProducts.push(asin); }
        const updatedUser = await user.save();
        try { retrainManager.incrementCounter('like', 1); } catch (e) { console.error('Counter increment error:', e); }
        res.json(updatedUser);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

exports.registerUser = async (req, res) => {
    try {
        const { user_id, reviewerName, age_group, gender, location, isAdmin } = req.body;
        // If no user_id provided, generate a random one
        const uid = (user_id && String(user_id).trim()) || `USER_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        // ensure unique
        const existing = await User.findOne({ user_id: uid });
        if (existing) return res.status(400).json({ message: 'User ID already exists' });
        // Only allow creating admin users if caller provides correct ADMIN_SECRET header or uid is listed in ADMIN_USERS
        let adminFlag = false;
        try {
            const adminSecret = req.header('x-admin-secret');
            if (adminSecret && process.env.ADMIN_SECRET && adminSecret === process.env.ADMIN_SECRET) adminFlag = true;
            const envList = (process.env.ADMIN_USERS || '').split(',').map((s) => s.trim()).filter(Boolean);
            if (envList.includes(uid)) adminFlag = true;
            if (isAdmin === true && adminFlag === false) {
                // ignore client-supplied isAdmin unless secret provided
            }
        } catch (e) { }
        const newUser = new User({ user_id: uid, reviewerName: reviewerName || 'New User', likedProducts: [], age_group, gender, location, isAdmin: adminFlag });
        await newUser.save();
        return res.status(201).json(newUser);
    } catch (error) { console.error(error); res.status(500).json({ message: 'Server Error' }); }
};