const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/userModel');

async function findAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await User.findOne({ isAdmin: true });
    if (admin) {
      console.log('ADMIN_USER_ID:', admin.user_id);
    } else {
      console.log('NO_ADMIN_FOUND');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

findAdmin();
