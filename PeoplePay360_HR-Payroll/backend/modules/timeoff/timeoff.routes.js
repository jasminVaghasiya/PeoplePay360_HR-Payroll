const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth/auth.middleware');
const timeOffCtrl = require('./timeoff.controller');

// All time off routes require authenticated user
router.use(verifyToken);

// Calculation & Dashboard
router.post('/calculate-duration', timeOffCtrl.calculateDurationController);
router.get('/summary', timeOffCtrl.getSummary);
router.get('/balances', timeOffCtrl.getBalances);
router.get('/calendar', timeOffCtrl.getCalendarEvents);
router.get('/history', timeOffCtrl.getAuditHistory);

// Time Off Types
router.get('/types', timeOffCtrl.getTimeOffTypes);
router.post('/types', timeOffCtrl.createTimeOffType);
router.put('/types/:id', timeOffCtrl.updateTimeOffType);
router.patch('/types/:id/toggle', timeOffCtrl.toggleTimeOffTypeStatus);

// Allocations
router.get('/allocations', timeOffCtrl.getAllocations);
router.post('/allocations', timeOffCtrl.createAllocation);
router.patch('/allocations/:id/approve', timeOffCtrl.approveAllocation);
router.patch('/allocations/:id/refuse', timeOffCtrl.refuseAllocation);

// Leave Requests
router.get('/requests', timeOffCtrl.getRequests);
router.get('/requests/:id', timeOffCtrl.getRequestById);
router.post('/requests', timeOffCtrl.createRequest);
router.patch('/requests/:id/approve', timeOffCtrl.approveRequest);
router.patch('/requests/:id/refuse', timeOffCtrl.refuseRequest);
router.patch('/requests/:id/cancel', timeOffCtrl.cancelRequest);

module.exports = router;
