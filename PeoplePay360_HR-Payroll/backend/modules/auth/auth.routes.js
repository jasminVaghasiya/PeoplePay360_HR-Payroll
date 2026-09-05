const express = require('express');
const router = express.Router();
const { login, refreshToken, logout, createUser, getUsers, toggleUserStatus, getMe } = require('./auth.controller');
const { verifyToken, authorizeRoles } = require('./auth.middleware');

// Public authentication routes
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Authenticated current user profile
router.get('/me', verifyToken, getMe);

// Create User Endpoint (Higher authorities: Admin, HR Payroll Manager, HR Manager)
router.post(
  '/users',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager'),
  createUser
);

// Get Users List (Admin, HR Payroll Manager, HR Payroll User, HR Manager)
router.get(
  '/users',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager'),
  getUsers
);

// Toggle User Status Active/Inactive (Admin & HR Payroll Manager)
router.patch(
  '/users/:id/status',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager'),
  toggleUserStatus
);

module.exports = router;
