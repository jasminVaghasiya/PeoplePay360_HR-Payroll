const bcrypt = require('bcryptjs');

// Standard System Admin Seed Account
const ADMIN_SEED_USER = {
  id: 'user_admin_001',
  name: 'jemin vaghasiya',
  email: 'jaiminvaghasiya9023@gmail.com',
  passwordRaw: 'admin123',
  role: 'Admin',
  department: 'Executive Management',
  jobPosition: 'Chief System Administrator',
  status: 'ACTIVE',
  createdByName: 'System Bootstrapper'
};

module.exports = { ADMIN_SEED_USER };
