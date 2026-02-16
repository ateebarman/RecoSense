const Product = require('../models/productModel');
const Review = require('../models/reviewModel');
const fs = require('fs');
const path = require('path');
const cache = require('../utils/cacheManager');

// Helper to inject XAI (top selling point) based on review sentiment
const injectXAI = async (products) => {
    if (!products || products.length === 0) return products;
    
    // Check cache for individual products first? (Optional, skipping for now to keep complexity low)
    const asins = products.map((p) => p.asin);
    const sentimentStats = await Review.aggregate([
        { $match: { asin: { $in: asins } } },
        {
            $group: {
                _id: "$asin",
                battery: { $avg: "$battery_score" },
                camera: { $avg: "$camera_score" },
                screen: { $avg: "$screen_score" },
                price: { $avg: "$price_score" },
                software: { $avg: "$software_score" },
                quality: { $avg: "$quality_score" }
            }
        }
    ]);

    const statsMap = sentimentStats.reduce((acc, stat) => {
        const aspects = [
            { name: 'Battery', score: stat.battery },
            { name: 'Camera', score: stat.camera },
            { name: 'Screen', score: stat.screen },
            { name: 'Value', score: stat.price },
            { name: 'Software', score: stat.software },
            { name: 'Quality', score: stat.quality }
        ];
        // Lowered threshold to 0.2 to ensure visibility for more products
        const best = aspects.filter(a => a.score > 0.2).sort((a,b) => b.score - a.score)[0];
        acc[stat._id] = best ? best.name : null;
        return acc;
    }, {});

    return products.map(p => ({
        ...p,
        topAspect: statsMap[p.asin] || p.topAspect || null
    }));
};

exports.getProducts = async (req, res) => {
    try {
        const { random, size, page, limit, sortBy, search } = req.query;

        // --- CACHE LAYER ---
        // Don't cache random sampling as it should be fresh
        const isCacheable = random !== 'true' && !search; 
        const cacheKey = `products_${sortBy || 'default'}_p${page || 1}_l${limit || 20}`;
        
        if (isCacheable) {
            const cached = await cache.get(cacheKey);
            if (cached) return res.json(cached);
        }

        // 1. Handle Random Sampling
        if (random === 'true') {
            const sampleSize = Math.max(1, Math.min(500, parseInt(size || '20', 10)));
            const rawProducts = await Product.aggregate([{ $sample: { size: sampleSize } }]);
            const products = await injectXAI(rawProducts);
            return res.json(products);
        }

        // 2. Handle Search Query
        let query = {};
        if (search) {
            query = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { brand: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // 3. Handle Sentiment-Based Sorting
        let finalProducts = [];
        const validAspects = ['battery', 'camera', 'screen', 'price', 'software', 'quality'];
        if (sortBy && validAspects.includes(sortBy.toLowerCase())) {
            const aspectField = `${sortBy.toLowerCase()}_score`;
            
            const pipeline = [
                { $match: { [aspectField]: { $ne: 0 } } },
                {
                    $group: {
                        _id: "$asin",
                        avgSentiment: { $avg: `$${aspectField}` },
                        reviewCount: { $sum: 1 }
                    }
                },
                { $sort: { avgSentiment: -1 } },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "asin",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                {
                    $project: {
                        _id: "$productDetails._id",
                        asin: "$_id",
                        title: "$productDetails.title",
                        brand: "$productDetails.brand",
                        price: "$productDetails.price",
                        imageURLHighRes: "$productDetails.imageURLHighRes",
                        categories: "$productDetails.categories",
                        avgSentiment: 1,
                        reviewCount: 1
                    }
                }
            ];

            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { title: { $regex: search, $options: 'i' } },
                            { brand: { $regex: search, $options: 'i' } }
                        ]
                    }
                });
            }

            const l = Math.max(1, Math.min(50, parseInt(limit || '20', 10)));
            pipeline.push({ $limit: l });

            const sortedProducts = await Review.aggregate(pipeline);
            finalProducts = sortedProducts.map(p => ({
                ...p,
                topAspect: sortBy.charAt(0).toUpperCase() + sortBy.slice(1)
            }));
        } else {
            // 4. Default Pagination / Listing
            const p = Math.max(1, parseInt(page || '1', 10));
            const l = Math.max(1, Math.min(500, parseInt(limit || '20', 10)));
            
            const rawProducts = await Product.find(query)
                .skip((p - 1) * l)
                .limit(l)
                .sort({ createdAt: -1 })
                .lean();

            finalProducts = await injectXAI(rawProducts);
        }

        // Save to cache before sending
        if (isCacheable) {
            await cache.set(cacheKey, finalProducts, 300); // 5 min
        }

        res.json(finalProducts);
    } catch (error) { 
        console.error('getProducts Error:', error);
        res.status(500).json({ message: 'Server Error' }); 
    }
};

// Try DB first, then fall back to metadata file when product not found in DB
exports.getProductByAsin = async (req, res) => {
    try {
        const asin = req.params.asin;
        const product = await Product.findOne({ asin }).lean().exec();
        if (product) {
            const enriched = await injectXAI([product]);
            return res.json(enriched[0]);
        }

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

        // If not found in metadata.jsonl, try filtered_smartphone_metadata.json
        if (!found) {
            const filteredPath = path.join(__dirname, '..', 'data', 'filtered_smartphone_metadata.json');
            if (fs.existsSync(filteredPath)) {
                try {
                    const filteredRaw = fs.readFileSync(filteredPath, 'utf-8');
                    const filteredData = JSON.parse(filteredRaw);
                    if (Array.isArray(filteredData)) {
                        found = filteredData.find(p => p.asin === asin);
                    }
                } catch (e) {
                    console.error('Error reading filtered metadata:', e);
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
            imageURLHighRes: (Array.isArray(found.images) && found.images.length > 0)
                ? found.images.map(img => img.large || img.thumb || img)
                : (Array.isArray(found.imageURLHighRes) ? found.imageURLHighRes : []),
            categories: found.main_category ? [[found.main_category]] : [],
        };
        const enriched = await injectXAI([mapped]);
        return res.json(enriched[0]);
    } catch (error) {
        console.error('Error in getProductByAsin:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};