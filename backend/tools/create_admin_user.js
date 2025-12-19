const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user_id = '1';
    let user = await User.findOne({ user_id }).exec();
    const pwHash = await bcrypt.hash('123456', 10);
    if (user) {
      user.reviewerName = 'ateeb';
      user.gender = 'male';
      user.location = 'delhi india';
      user.password = pwHash;
      user.isAdmin = true;
      await user.save();
      console.log(`Updated existing user '${user_id}' to admin.`);
    } else {
      user = new User({ user_id, reviewerName: 'ateeb', gender: 'male', location: 'delhi india', password: pwHash, isAdmin: true, likedProducts: [] });
      await user.save();
      console.log(`Created admin user '${user_id}'.`);
    }
  } catch (e) {
    console.error('Error creating admin user:', e);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
