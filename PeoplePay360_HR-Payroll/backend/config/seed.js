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
    employeeType: 'Permanent',
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
    employeeType: 'Permanent',
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
    employeeType: 'Permanent',
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
    employeeType: 'Permanent',
    status: 'ACTIVE',
    createdByName: 'Admin'
  },
  {
    name: 'Ananya Iyer',
    email: 'ananya.iyer@peoplepay360.com',
    passwordRaw: 'emp123',
    role: 'Employee',
    department: 'IT',
    jobPosition: 'DevOps Engineer',
    salary: 95000,
    employeeType: 'Contract',
    contractStartDate: '2026-01-01',
    contractEndDate: '2026-12-31',
    contractDuration: '12 Months',
    status: 'ACTIVE',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    createdByName: 'HR Operations'
  },
  {
    name: 'Pooja Deshmukh',
    email: 'pooja.deshmukh@peoplepay360.com',
    passwordRaw: 'emp123',
    role: 'Employee',
    department: 'IT',
    jobPosition: 'QA Specialist',
    salary: 55000,
    employeeType: 'Contract',
    contractStartDate: '2026-03-01',
    contractEndDate: '2026-09-30',
    contractDuration: '6 Months',
    status: 'ACTIVE',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdByName: 'HR Operations'
  }
];

module.exports = { ADMIN_SEED_USER, DEMO_USERS };
