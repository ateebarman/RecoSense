const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/productModel');
const Review = require('./models/reviewModel');
const User = require('./models/userModel');

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB connected for seeding...');

        await Product.deleteMany({});
        await Review.deleteMany({});
        await User.deleteMany({});
        console.log('Data cleared.');

        const metadataPath = path.join(__dirname, 'data', 'filtered_smartphone_metadata.json');
        const reviewsPath = path.join(__dirname, 'data', 'filtered_smartphone_reviews.json');
        const productsData = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        const reviewsData = JSON.parse(await fs.readFile(reviewsPath, 'utf-8'));
        
        console.log('Seeding products...');
        await Product.insertMany(productsData);
        console.log(`${productsData.length} products seeded.`);

        console.log('Seeding reviews...');
        await Review.insertMany(reviewsData);
        console.log(`${reviewsData.length} reviews seeded.`);
        
        console.log('Creating unique users...');
        const userMap = new Map();
        reviewsData.forEach(review => {
            if (!userMap.has(review.user_id)) {
                userMap.set(review.user_id, {
                    user_id: review.user_id,
                    reviewerName: review.reviewerName || 'N/A',
                    likedProducts: []
                });
            }
        });
        const usersToSeed = Array.from(userMap.values());
        await User.insertMany(usersToSeed);
        console.log(`${usersToSeed.length} unique users seeded.`);

        console.log('Database seeding completed successfully!');
    } catch (error) {
        console.error('Error during seeding:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
};

seedDatabase();