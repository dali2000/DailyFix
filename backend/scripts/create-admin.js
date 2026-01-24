require('dotenv').config();
const { sequelize } = require('../config/database');
const User = require('../models/User.model');

const createAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const email = process.argv[2] || 'admin@dailyfix.com';
    const password = process.argv[3] || 'admin123';
    const fullName = process.argv[4] || 'Administrator';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email } });
    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log('✅ Admin user already exists with this email');
        process.exit(0);
      } else {
        // Update existing user to admin
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Existing user updated to admin');
        console.log(`Email: ${email}`);
        console.log(`Password: (unchanged)`);
        process.exit(0);
      }
    }

    // Create new admin user
    const admin = await User.create({
      fullName,
      email,
      password,
      role: 'admin',
      provider: 'local'
    });

    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: admin`);
    console.log('\n⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

