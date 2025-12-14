const Product = require('../models/productModel');

exports.getProducts = async (req, res) => {
    try {
        // Support query params:
        // - random=true&size=NN  => return NN random products (uses aggregation $sample)
        // - page=1&limit=20      => server-side pagination (skip/limit)
        // - limit=NN             => limit results
        // default: return all products
        const { random, size, page, limit } = req.query;
        if (random === 'true') {
            const sampleSize = Math.max(1, Math.min(500, parseInt(size || '20', 10)));
            const products = await Product.aggregate([{ $sample: { size: sampleSize } }]);
            return res.json(products);
        }
        if (page && limit) {
            const p = Math.max(1, parseInt(page, 10));
            const l = Math.max(1, Math.min(500, parseInt(limit, 10)));
            const products = await Product.find({}).skip((p - 1) * l).limit(l);
            return res.json(products);
        }
        if (limit) {
            const l = Math.max(1, Math.min(500, parseInt(limit, 10)));
            const products = await Product.find({}).limit(l);
            return res.json(products);
        }
        const products = await Product.find({});
        res.json(products);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

exports.getProductByAsin = async (req, res) => {
    try {
        const product = await Product.findOne({ asin: req.params.asin });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};