const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth/auth.middleware');
const payrollCtrl = require('./payroll.controller');

// All payroll routes require authenticated user
router.use(verifyToken);

// Summary KPI & Eligible Employees
router.get('/summary', payrollCtrl.getPayrollSummary);
router.get('/eligible-employees', payrollCtrl.getEligibleEmployees);

// Payruns
router.get('/payruns', payrollCtrl.getPayruns);
router.post('/payruns', payrollCtrl.createPayrun);
router.get('/payruns/:id', payrollCtrl.getPayrunById);
router.delete('/payruns/:id', payrollCtrl.deletePayrun);
router.post('/payruns/:id/compute', payrollCtrl.computePayrun);
router.post('/payruns/:id/validate', payrollCtrl.validatePayrun);
router.post('/payruns/:id/pay', payrollCtrl.markPayrunPaid);
router.post('/payruns/:id/send-payslips', payrollCtrl.sendBulkPayslips);

// Payslips
router.get('/payslips', payrollCtrl.getPayslips);
router.get('/payslips/:id', payrollCtrl.getPayslipById);

// Contracts
router.get('/contracts', payrollCtrl.getContracts);
router.post('/contracts', payrollCtrl.createContract);
router.put('/contracts/:id', payrollCtrl.updateContract);

// Salary Structures & Rules
router.get('/structures', payrollCtrl.getSalaryStructures);
router.post('/structures', payrollCtrl.createSalaryStructure);
router.get('/rules', payrollCtrl.getSalaryRules);
router.post('/rules', payrollCtrl.createSalaryRule);
router.put('/rules/:id', payrollCtrl.updateSalaryRule);

// Enterprise Payroll Settings (GSTIN, PAN, TAN, CIN, Bank details, Statutory rates)
router.get('/settings', payrollCtrl.getPayrollSettings);
router.put('/settings', payrollCtrl.updatePayrollSettings);

module.exports = router;
