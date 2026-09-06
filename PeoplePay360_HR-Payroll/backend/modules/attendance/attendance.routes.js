const express = require('express');
const router = express.Router();
const attendanceController = require('./attendance.controller');
const { verifyToken, authorizeRoles } = require('../auth/auth.middleware');

// All Attendance routes require an authenticated user
router.use(verifyToken);

// 1. Employee Check-In & Check-Out (All Roles)
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);

// 2. Personal Employee Views & Settings
router.get('/today', attendanceController.getTodayStatus);
router.get('/my', attendanceController.getMyAttendance);
router.get('/summary', attendanceController.getSummary);
router.get('/settings', attendanceController.getConfig);
router.put(
  '/settings',
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'),
  attendanceController.updateConfig
);

// 3. Main Attendance List View (Filtered & Authorized)
router.get('/', attendanceController.getAttendanceList);
router.get('/:id', attendanceController.getAttendanceById);

// 4. Employee & HR Correction Workflow
router.post('/:id/correction', attendanceController.requestCorrection);

// 5. HR & Admin Specific Management Endpoints
router.post(
  '/',
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User', 'HOD', 'Manager'),
  attendanceController.createAttendance
);

router.put(
  '/:id',
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User', 'HOD', 'Manager'),
  attendanceController.updateAttendance
);

router.delete(
  '/:id',
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User', 'HOD', 'Manager'),
  attendanceController.deleteAttendance
);

router.post(
  '/corrections/:id/approve',
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User', 'HOD', 'Manager'),
  attendanceController.approveCorrection
);

router.post(
  '/corrections/:id/reject',
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User', 'HOD', 'Manager'),
  attendanceController.rejectCorrection
);

module.exports = router;
