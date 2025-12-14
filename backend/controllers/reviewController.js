const Review = require('../models/reviewModel');

exports.getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user_id: req.params.user_id }).populate('productDetails');
        if (!reviews) { return res.status(404).json({ message: 'No reviews found for this user' }); }
        res.json(reviews);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

exports.getReviewsForProduct = async (req, res) => {
    try {
        const reviews = await Review.find({ asin: req.params.asin });
        res.json(reviews);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

exports.addReview = async (req, res) => {
    try {
        const { asin, user_id, reviewerName, reviewText, summary, overall } = req.body;
        const newReview = new Review({
            asin, user_id, reviewerName, reviewText, summary, overall, verified: true,
            reviewTime: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
            unixReviewTime: Math.floor(Date.now() / 1000)
        });
        const savedReview = await newReview.save();
        res.status(201).json(savedReview);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};