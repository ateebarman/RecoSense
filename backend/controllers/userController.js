const User = require('../models/userModel');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'secret';

exports.getUser = async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.params.user_id }).select('-password');
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
        const sanitized = updatedUser.toObject(); delete sanitized.password;
        res.json(sanitized);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

exports.registerUser = async (req, res) => {
    try {
        const { user_id, reviewerName, age_group, gender, location, isAdmin, password } = req.body;
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
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            newUser.password = hash;
        }
        await newUser.save();
        const sanitized = newUser.toObject(); delete sanitized.password;
        return res.status(201).json(sanitized);
    } catch (error) { console.error(error); res.status(500).json({ message: 'Server Error' }); }
};

// Login - returns JWT and user info
exports.login = async (req, res) => {
    try {
        const { user_id, password } = req.body;
        if (!user_id || !password) return res.status(400).json({ message: 'user_id and password required' });
        const user = await User.findOne({ user_id });
        if (!user || !user.password) return res.status(401).json({ message: 'Invalid credentials' });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ user_id: user.user_id, isAdmin: user.isAdmin }, jwtSecret, { expiresIn: '7d' });
        const sanitized = user.toObject(); delete sanitized.password;
        return res.json({ token, user: sanitized });
    } catch (error) { console.error('Login error', error); return res.status(500).json({ message: 'Server Error' }); }
};

// Protected - change password
exports.changePassword = async (req, res) => {
    try {
        const userId = (req.user && req.user.user_id) || req.body.user_id;
        if (!userId) return res.status(401).json({ message: 'Authentication required' });
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both current and new passwords required' });
        const user = await User.findOne({ user_id: userId });
        if (!user || !user.password) return res.status(401).json({ message: 'Invalid credentials' });
        const ok = await bcrypt.compare(currentPassword, user.password);
        if (!ok) return res.status(401).json({ message: 'Current password incorrect' });
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ message: 'Password updated' });
    } catch (error) { console.error('Change password error', error); return res.status(500).json({ message: 'Server Error' }); }
};

exports.getMe = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Authentication required' });
        const user = await User.findOne({ user_id: req.user.user_id }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};