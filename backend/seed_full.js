const fs = require('fs');
const readline = require('readline');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Product = require('./models/productModel');
const Review = require('./models/reviewModel');
const User = require('./models/userModel');

async function seedFull() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // 1. Clear existing data
    console.log('Clearing database...');
    await Product.deleteMany({});
    await Review.deleteMany({});
    await User.deleteMany({});

    const absaPath = path.join(__dirname, 'data', 'absa_reviews.json');
    const metadataPath = path.join(__dirname, 'data', 'metadata.jsonl');

    const requiredAsins = new Set();
    const reviewsToInsert = [];
    const usersToCreate = new Map();

    // 2. Load ABSA Reviews (JSONL)
    console.log('Reading absa_reviews.json...');
    const absaStream = fs.createReadStream(absaPath);
    const absaRl = readline.createInterface({ input: absaStream, crlfDelay: Infinity });

    for await (const line of absaRl) {
      if (!line.trim()) continue;
      const r = JSON.parse(line);
      
      requiredAsins.add(r.asin);

      // Map ABSA fields to Review model
      reviewsToInsert.push({
        overall: r.rating || 0,
        verified: r.verified_purchase || false,
        user_id: r.user_id,
        asin: r.asin,
        reviewerName: r.reviewer_name || 'Amazon Customer',
        reviewText: r.text || '',
        summary: r.title || '',
        unixReviewTime: Math.floor((r.timestamp || Date.now()) / 1000),
        reviewTime: new Date(r.timestamp || Date.now()).toLocaleDateString(),
        phone_score: r.phone_score || 0,
        battery_score: r.battery_score || 0,
        screen_score: r.screen_score || 0,
        camera_score: r.camera_score || 0,
        price_score: r.price_score || 0,
        software_score: r.app_score || r.apps_score || 0,
        quality_score: r.quality_score || 0
      });

      if (!usersToCreate.has(r.user_id)) {
        usersToCreate.set(r.user_id, {
          user_id: r.user_id,
          userName: r.reviewer_name || 'User ' + r.user_id.slice(-4),
        });
      }
    }
    console.log(`Loaded ${reviewsToInsert.length} reviews and ${requiredAsins.size} product IDs.`);

    // 3. Load Products from metadata.jsonl (Streaming for memory efficiency)
    console.log('Extracting product metadata from metadata.jsonl...');
    const metaStream = fs.createReadStream(metadataPath);
    const metaRl = readline.createInterface({ input: metaStream, crlfDelay: Infinity });
    const productsToInsert = [];

    for await (const line of metaRl) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        const asin = obj.asin || obj.parent_asin;
        if (requiredAsins.has(asin)) {
          productsToInsert.push({
            asin,
            title: obj.title || `Product ${asin}`,
            description: Array.isArray(obj.description) ? obj.description : [obj.description || ''],
            price: obj.price ? String(obj.price) : 'N/A',
            brand: obj.brand || obj.store || 'Generic',
            imageURLHighRes: Array.isArray(obj.images) ? obj.images.map(i => i.large || i.thumb || i.hi_res || i) : [],
            categories: obj.main_category ? [[obj.main_category]] : [obj.categories || []]
          });
          requiredAsins.delete(asin); // Found it
        }
      } catch (e) { /* skip malformed */ }
    }
    console.log(`Found ${productsToInsert.length} matching products in metadata.`);

    // 4. Batch Insert
    console.log('Inserting products...');
    await Product.insertMany(productsToInsert);

    console.log('Inserting reviews...');
    // Split into smaller chunks for large inserts
    const chunkSize = 1000;
    for (let i = 0; i < reviewsToInsert.length; i += chunkSize) {
      await Review.insertMany(reviewsToInsert.slice(i, i + chunkSize));
    }

    console.log('Seeding users...');
    const password = await bcrypt.hash('123456', 10);
    const userDocs = Array.from(usersToCreate.values()).map(u => ({
      ...u,
      password,
      likedProducts: []
    }));
    await User.insertMany(userDocs);

    console.log(`Success! Seeded ${productsToInsert.length} products, ${reviewsToInsert.length} reviews, and ${userDocs.length} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedFull();
