const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const User = require('../models/userModel');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const uid = process.argv[2];
  if (!uid) { console.error('Usage: node set_admin.js <user_id>'); process.exit(1); }
  const u = await User.findOne({ user_id: uid });
  if (!u) { console.error('User not found'); process.exit(1); }
  u.isAdmin = true;
  await u.save();
  console.log('Set isAdmin for', uid);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
