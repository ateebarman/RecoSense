const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/userModel');

async function createAdmin() {
  const adminId = 'admin_user_01';
  const adminPassword = 'adminPassword123';
  const adminName = 'System Admin';

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({ user_id: adminId });
    if (existingAdmin) {
      console.log('Admin user already exists. Promoting to admin just in case...');
      existingAdmin.isAdmin = true;
      await existingAdmin.save();
      console.log('Done.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const newAdmin = new User({
      user_id: adminId,
      reviewerName: adminName,
      password: hashedPassword,
      isAdmin: true,
      age_group: '35-44',
      gender: 'other',
      location: 'System'
    });

    await newAdmin.save();
    console.log('******************************************');
    console.log('Admin User Created Successfully!');
    console.log(`User ID:  ${adminId}`);
    console.log(`Password: ${adminPassword}`);
    console.log('******************************************');
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();
