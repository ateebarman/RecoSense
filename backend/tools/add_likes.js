const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/userModel');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const uid = process.argv[2];
  if (!uid) { console.error('Usage: node add_likes.js <user_id>'); process.exit(1); }
  const u = await User.findOne({ user_id: uid });
  if (!u) { console.error('User not found'); process.exit(1); }
  u.likedProducts = ['B01','B02','B03','B04','B05'];
  await u.save();
  console.log('Updated likes for', uid);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
