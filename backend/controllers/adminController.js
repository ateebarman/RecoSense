const Product = require('../models/productModel');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const Order = require('../models/orderModel');
const retrainManager = require('../recommender/retrainManager');

exports.getStats = async (req, res) => {
    try {
        const [productCount, userCount, reviewCount, orders] = await Promise.all([
            Product.countDocuments(),
            User.countDocuments(),
            Review.countDocuments(),
            Order.find({}, 'totalAmount').lean()
        ]);

        const totalRevenue = orders.reduce((sum, order) => {
            const amountStr = String(order.totalAmount || '0').replace('$', '').trim();
            const amount = parseFloat(amountStr) || 0;
            return sum + amount;
        }, 0);

        const orderCount = orders.length;

        // Get live interaction counters
        const counters = retrainManager.getCounters();

        const modelStats = {
            threshold: Number(process.env.MODEL_RUN_THRESHOLD || 10),
            currentReviewCount: reviewCount,
            pending: counters.pending || 0
        };

        res.json({
            products: productCount,
            users: userCount,
            reviews: reviewCount,
            revenue: totalRevenue,
            orders: orderCount,
            modelStats,
            counters
        });
    } catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.runModel = async (req, res) => {
    try {
        retrainManager.startModelRun().catch(e => console.error('Background model run error:', e));
        res.json({ message: 'Model run (re-generation) started in background.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to start model run' });
    }
};

exports.triggerRetrain = async (req, res) => {
    try {
        // Start retraining in background
        retrainManager.startRetrain().catch(e => console.error('Background retrain error:', e));
        res.json({ message: 'Retraining started in background. This may take a few minutes.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to start retraining' });
    }
};
