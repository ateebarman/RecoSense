const Product = require('../models/productModel');
const fs = require('fs');
const path = require('path');

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

// Try DB first, then fall back to metadata file when product not found in DB
exports.getProductByAsin = async (req, res) => {
    try {
        const asin = req.params.asin;
        const product = await Product.findOne({ asin }).lean().exec();
        if (product) return res.json(product);

        // DB miss: attempt to load metadata.jsonl and find matching record
        const metadataPath = path.join(__dirname, '..', 'data', 'metadata.jsonl');
        if (!fs.existsSync(metadataPath)) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const raw = fs.readFileSync(metadataPath, 'utf-8');
        const lines = raw.split(/\r?\n/).filter(Boolean);
        let found = null;
        for (const line of lines) {
            try {
                const obj = JSON.parse(line);
                if (obj.asin === asin || obj.parent_asin === asin) {
                    found = obj;
                    break;
                }
            } catch (e) {
                // ignore malformed lines
                const m = line.match(/(\{[\s\S]*\})/);
                if (m) {
                    try {
                        const obj = JSON.parse(m[1]);
                        if (obj.asin === asin || obj.parent_asin === asin) {
                            found = obj;
                            break;
                        }
                    } catch (err) { /* ignore */ }
                }
            }
        }

        if (!found) return res.status(404).json({ message: 'Product not found' });

        // map metadata record to product-like response
        const mapped = {
            asin: found.asin || asin,
            title: found.title || `Product ${asin}`,
            description: Array.isArray(found.description) ? found.description : (found.description ? [found.description] : []),
            price: found.price ? String(found.price) : null,
            brand: found.brand || '',
            imageURLHighRes: Array.isArray(found.images) ? found.images.map(img => img.large || img.thumb || img) : [],
            categories: found.main_category ? [[found.main_category]] : [],
        };
        return res.json(mapped);
    } catch (error) {
        console.error('Error in getProductByAsin:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};