const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/db');
const { User } = require('./modules/auth/auth.model');
const { ADMIN_SEED_USER } = require('./config/seed');

dotenv.config();

const runManualSeed = async () => {
  console.log('=======================================================');
  console.log('🌱 Starting Manual Database Seeding Task...');
  console.log('=======================================================');

  const isConnected = await connectDB();

  try {
    const adminEmail = ADMIN_SEED_USER.email.toLowerCase();
    
    if (isConnected) {
      let admin = await User.findOne({ email: adminEmail });

      if (!admin) {
        // Also check if any existing admin user exists and update email
        const existingAdminRole = await User.findOne({ role: 'Admin' });
        if (existingAdminRole) {
          existingAdminRole.email = adminEmail;
          existingAdminRole.password = ADMIN_SEED_USER.passwordRaw;
          await existingAdminRole.save();
          console.log(`[Seed Script] Updated existing Admin account email to: ${adminEmail}`);
        } else {
          admin = await User.create({
            name: ADMIN_SEED_USER.name,
            email: adminEmail,
            password: ADMIN_SEED_USER.passwordRaw,
            role: ADMIN_SEED_USER.role,
            department: ADMIN_SEED_USER.department,
            jobPosition: ADMIN_SEED_USER.jobPosition,
            status: ADMIN_SEED_USER.status,
            createdByName: ADMIN_SEED_USER.createdByName
          });
          console.log(`[Seed Script] Created single System Admin: ${adminEmail}`);
        }
      } else {
        console.log(`[Seed Script] System Admin already present: ${adminEmail}`);
      }

      console.log('=======================================================');
      console.log(`✅ Seeding Complete! System Admin Credentials:`);
      console.log(`   Email:    ${adminEmail}`);
      console.log(`   Password: ${ADMIN_SEED_USER.passwordRaw}`);
      console.log('=======================================================');
    } else {
      console.error('❌ Could not connect to database for manual seeding.');
    }
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('[Seed Script] Database connection closed.');
    }
    process.exit(0);
  }
};

runManualSeed();
