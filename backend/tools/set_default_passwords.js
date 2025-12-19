const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

const setPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}).exec();
    let updated = 0;
    for (const u of users) {
      if (!u.password) {
        u.password = await bcrypt.hash('123456', 10);
        await u.save();
        updated += 1;
      }
    }
    console.log(`Updated passwords for ${updated} users (set to '123456').`);
  } catch (e) {
    console.error('Error setting passwords', e);
  } finally {
    await mongoose.disconnect();
  }
};

setPasswords();