const Groq = require('groq-sdk');
const Product = require('../models/productModel');
const Review = require('../models/reviewModel');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Generates an initial analysis for a product including summary, pros and cons.
 */
exports.analyzeProduct = async (req, res) => {
    try {
        const { asin } = req.params;

        // Fetch product details
        const product = await Product.findOne({ asin }).lean();
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Fetch sentiment stats to provide grounded context
        const sentimentStats = await Review.aggregate([
            { $match: { asin: asin } },
            {
                $group: {
                    _id: "$asin",
                    battery: { $avg: "$battery_score" },
                    camera: { $avg: "$camera_score" },
                    screen: { $avg: "$screen_score" },
                    price: { $avg: "$price_score" },
                    software: { $avg: "$software_score" },
                    quality: { $avg: "$quality_score" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const stats = sentimentStats[0] || {};
        const context = `
            Product: ${product.title}
            Brand: ${product.brand}
            Description: ${product.description?.join(' ') || 'N/A'}
            Average Sentiment (Scores -1 to 1):
            - Battery: ${stats.battery?.toFixed(2) || 'N/A'}
            - Camera: ${stats.camera?.toFixed(2) || 'N/A'}
            - Screen: ${stats.screen?.toFixed(2) || 'N/A'}
            - Price/Value: ${stats.price?.toFixed(2) || 'N/A'}
            - Software: ${stats.software?.toFixed(2) || 'N/A'}
            - Build Quality: ${stats.quality?.toFixed(2) || 'N/A'}
            Based on ${stats.count || 0} community reviews.
        `;

        const prompt = `
            You are "RecoSense AI", a premium tech shopping assistant. 
            Analyze the following product data and provide:
            1. A 2-sentence sophisticated summary.
            2. A list of 3 Pros (be specific to the data provided).
            3. A list of 2 Cons or "Wait-for" points.
            
            Format your response exactly like this:
            SUMMARY: [Your summary here]
            PROS:
            - [Pro 1]
            - [Pro 2]
            - [Pro 3]
            CONS:
            - [Con 1]
            - [Con 2]
            
            Be critical but helpful. If a sentiment score is negative, mention it as a con.
            Data: ${context}
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_tokens: 500,
        });

        res.json({ analysis: completion.choices[0].message.content });
    } catch (error) {
        console.error('Groq Analysis Error:', error);
        res.status(500).json({ message: 'AI Analysis failed. Check API key.' });
    }
};

/**
 * Handles follow-up questions about a product.
 */
exports.askQuestion = async (req, res) => {
    try {
        const { asin, question, history } = req.body;

        const product = await Product.findOne({ asin }).lean();
        const context = `You are discussing the ${product?.title || 'this device'}.`;

        const messages = [
            { role: 'system', content: `You are RecoSense AI. Use product data to answer questions. Be concise and technical. ${context}` },
            ...history,
            { role: 'user', content: question }
        ];

        const completion = await groq.chat.completions.create({
            messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 300,
        });

        res.json({ answer: completion.choices[0].message.content });
    } catch (error) {
        console.error('Groq Question Error:', error);
        res.status(500).json({ message: 'AI failed to answer.' });
    }
};
