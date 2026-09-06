const express = require('express');
const router = express.Router();
const { login, refreshToken, logout, createUser, getUsers, toggleUserStatus, deleteUser, getMe, getUserById, updateUserRole, updateUser } = require('./auth.controller');
const { verifyToken, authorizeRoles } = require('./auth.middleware');

const validate = require('../../validation/joiValidator');
const { loginSchema, createUserSchema } = require('../../validation/schemas/auth.schema');

// Public authentication routes
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Authenticated current user profile
router.get('/me', verifyToken, getMe);

// Get User By ID (Admin, HR Roles or Employee viewing own profile)
router.get('/users/:id', verifyToken, getUserById);

// Create User Endpoint (Admin, HR Payroll Manager, HR Manager, HR Payroll User)
router.post(
  '/users',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'),
  validate(createUserSchema),
  createUser
);

// Get Users List (Admin, HR Payroll Manager, HR Payroll User, HR Manager)
router.get(
  '/users',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager'),
  getUsers
);

// Toggle User Status Active/Inactive (Admin, HR Payroll Manager, HR Manager, HR Payroll User)
router.patch(
  '/users/:id/status',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'),
  toggleUserStatus
);

// Update User Role Endpoint (Admin, HR Payroll Manager, HR Manager)
router.patch(
  '/users/:id/role',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager'),
  updateUserRole
);

// Update Full User Details (Admin, HR Payroll Manager, HR Manager, HR Payroll User)
router.put(
  '/users/:id',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'),
  updateUser
);
router.patch(
  '/users/:id',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'),
  updateUser
);

// Delete User Endpoint (Admin, HR Payroll Manager, HR Manager)
router.delete(
  '/users/:id',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager'),
  deleteUser
);
router.post(
  '/users/:id/delete',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager'),
  deleteUser
);

module.exports = router;
