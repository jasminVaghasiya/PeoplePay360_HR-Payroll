const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../auth/auth.middleware');
const timeOffCtrl = require('./timeoff.controller');

// All time off routes require authenticated user
router.use(verifyToken);

// Calculation & Dashboard
router.post('/calculate-duration', timeOffCtrl.calculateDurationController);
router.get('/summary', timeOffCtrl.getSummary);
router.get('/balances', timeOffCtrl.getBalances);
router.get('/calendar', timeOffCtrl.getCalendarEvents);
router.get('/history', timeOffCtrl.getAuditHistory);

// Time Off Types: Management for Admin, HR Manager, HR Payroll Manager, HR Payroll User
router.get('/types', timeOffCtrl.getTimeOffTypes);
router.post('/types', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'), timeOffCtrl.createTimeOffType);
router.put('/types/:id', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'), timeOffCtrl.updateTimeOffType);
router.patch('/types/:id/toggle', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'), timeOffCtrl.toggleTimeOffTypeStatus);

// Allocations
router.get('/allocations', timeOffCtrl.getAllocations);
router.post('/allocations', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'), timeOffCtrl.createAllocation);
router.patch('/allocations/:id/approve', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'), timeOffCtrl.approveAllocation);
router.patch('/allocations/:id/refuse', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'), timeOffCtrl.refuseAllocation);

// Leave Requests: Approve / Refuse restricted to Admin and HR roles
router.get('/requests', timeOffCtrl.getRequests);
router.get('/requests/:id', timeOffCtrl.getRequestById);
router.post('/requests', timeOffCtrl.createRequest);
router.patch('/requests/:id/approve', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'), timeOffCtrl.approveRequest);
router.patch('/requests/:id/refuse', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'), timeOffCtrl.refuseRequest);
router.patch('/requests/:id/cancel', timeOffCtrl.cancelRequest);

module.exports = router;
