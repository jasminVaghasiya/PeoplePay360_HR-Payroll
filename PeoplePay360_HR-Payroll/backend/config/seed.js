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

const DEMO_USERS = [
  {
    name: 'Sarah Jenkins',
    email: 'employee@peoplepay360.com',
    passwordRaw: 'emp123',
    role: 'Employee',
    department: 'Engineering',
    jobPosition: 'Senior Full Stack Engineer',
    status: 'ACTIVE',
    createdByName: 'HR Operations'
  },
  {
    name: 'Alex Morgan',
    email: 'alex@peoplepay360.com',
    passwordRaw: 'emp123',
    role: 'Employee',
    department: 'Marketing',
    jobPosition: 'Product Marketing Lead',
    status: 'ACTIVE',
    createdByName: 'HR Operations'
  },
  {
    name: 'Elena Rostova',
    email: 'hrmanager@peoplepay360.com',
    passwordRaw: 'hr123',
    role: 'HR Manager',
    department: 'Human Resources',
    jobPosition: 'Principal HR Business Partner',
    status: 'ACTIVE',
    createdByName: 'Admin'
  },
  {
    name: 'David Chen',
    email: 'payroll@peoplepay360.com',
    passwordRaw: 'payroll123',
    role: 'HR Payroll Manager',
    department: 'Finance & Payroll',
    jobPosition: 'Payroll Operations Director',
    status: 'ACTIVE',
    createdByName: 'Admin'
  }
];

module.exports = { ADMIN_SEED_USER, DEMO_USERS };
