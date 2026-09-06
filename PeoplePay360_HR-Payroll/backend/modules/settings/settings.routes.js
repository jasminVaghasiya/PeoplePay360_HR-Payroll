const express = require('express');
const router = express.Router();
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  addPosition,
  updatePosition,
  deletePosition
} = require('./settings.controller');
const { verifyToken, authorizeRoles } = require('../auth/auth.middleware');

router.use(verifyToken);

// Read departments & positions - open to all authenticated staff (needed for user creation, filters, etc.)
router.get('/', getDepartments);
router.get('/departments', getDepartments);
router.get('/departments/:id', getDepartmentById);
router.get('/:id', getDepartmentById);

// Admin & HR Payroll Manager roles can manage departments & positions
router.post(
  '/',
  authorizeRoles('Admin', 'HR Payroll Manager'),
  createDepartment
);
router.post(
  '/departments',
  authorizeRoles('Admin', 'HR Payroll Manager'),
  createDepartment
);
router.put(
  '/departments/:id',
  authorizeRoles('Admin', 'HR Payroll Manager'),
  updateDepartment
);
router.delete(
  '/departments/:id',
  authorizeRoles('Admin', 'HR Payroll Manager'),
  deleteDepartment
);

// Position management nested in department
router.post(
  '/departments/:id/positions',
  authorizeRoles('Admin', 'HR Payroll Manager'),
  addPosition
);
router.put(
  '/departments/:id/positions/:posId',
  authorizeRoles('Admin', 'HR Payroll Manager'),
  updatePosition
);
router.delete(
  '/departments/:id/positions/:posId',
  authorizeRoles('Admin', 'HR Payroll Manager'),
  deletePosition
);

module.exports = router;
