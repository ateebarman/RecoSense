const User = require('../models/userModel');

exports.getUser = async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.params.user_id });
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        res.json(user);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

exports.toggleLikeProduct = async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.params.user_id });
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        const { asin } = req.body;
        const isLiked = user.likedProducts.includes(asin);
        if (isLiked) { user.likedProducts = user.likedProducts.filter(id => id !== asin); }
        else { user.likedProducts.push(asin); }
        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};