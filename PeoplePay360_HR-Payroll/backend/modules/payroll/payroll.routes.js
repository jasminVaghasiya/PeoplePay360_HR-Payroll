const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../auth/auth.middleware');
const payrollCtrl = require('./payroll.controller');

// All payroll routes require authenticated user
router.use(verifyToken);

// Summary KPI & Eligible Employees (HR Manager blocked from payroll)
router.get('/summary', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User', 'Employee'), payrollCtrl.getPayrollSummary);
router.get('/eligible-employees', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User'), payrollCtrl.getEligibleEmployees);

// Payruns: HR Payroll User can Create, Read, Update; Delete is restricted to Admin & HR Payroll Manager
router.get('/payruns', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User'), payrollCtrl.getPayruns);
router.post('/payruns', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User'), payrollCtrl.createPayrun);
router.get('/payruns/:id', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User'), payrollCtrl.getPayrunById);
router.delete('/payruns/:id', authorizeRoles('Admin', 'HR Payroll Manager'), payrollCtrl.deletePayrun);
router.post('/payruns/:id/compute', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User'), payrollCtrl.computePayrun);
router.post('/payruns/:id/validate', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User'), payrollCtrl.validatePayrun);
router.post('/payruns/:id/pay', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User'), payrollCtrl.markPayrunPaid);
router.post('/payruns/:id/send-payslips', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User'), payrollCtrl.sendBulkPayslips);

// Payslips: Accessible to Admin, HR Payroll Manager, HR Payroll User, and Employee (own payslips)
router.get('/payslips', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User', 'Employee'), payrollCtrl.getPayslips);
router.get('/payslips/:id', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User', 'Employee'), payrollCtrl.getPayslipById);

// Contracts: Full CRUD for HR Manager, HR Payroll User, HR Payroll Manager, Admin
router.get('/contracts', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User', 'Employee'), payrollCtrl.getContracts);
router.post('/contracts', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'), payrollCtrl.createContract);
router.put('/contracts/:id', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'), payrollCtrl.updateContract);

// Salary Structures: Read-only for HR Payroll User & Employee; Full CRUD for Admin & HR Payroll Manager
router.get(['/structures', '/structures/', '/', ''], authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User', 'Employee'), payrollCtrl.getSalaryStructures);
router.post(['/structures', '/structures/', '/', ''], authorizeRoles('Admin', 'HR Payroll Manager'), payrollCtrl.createSalaryStructure);
router.put(['/structures', '/structures/', '/', ''], authorizeRoles('Admin', 'HR Payroll Manager'), payrollCtrl.createSalaryStructure);

router.get(['/structures/:id', '/structures/:id/', '/:id', '/:id/'], authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User', 'Employee'), payrollCtrl.getSalaryStructures);
router.put(['/structures/:id', '/structures/:id/', '/:id', '/:id/'], authorizeRoles('Admin', 'HR Payroll Manager'), payrollCtrl.updateSalaryStructure);
router.post(['/structures/:id', '/structures/:id/', '/:id', '/:id/'], authorizeRoles('Admin', 'HR Payroll Manager'), payrollCtrl.updateSalaryStructure);
router.delete(['/structures/:id', '/structures/:id/', '/:id', '/:id/'], authorizeRoles('Admin', 'HR Payroll Manager'), payrollCtrl.deleteSalaryStructure);

// Salary Rules: Read-only for HR Payroll User & Employee; Full CRUD for Admin & HR Payroll Manager
router.get('/rules', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User', 'Employee'), payrollCtrl.getSalaryRules);
router.post('/rules', authorizeRoles('Admin', 'HR Payroll Manager'), payrollCtrl.createSalaryRule);
router.put('/rules/:id', authorizeRoles('Admin', 'HR Payroll Manager'), payrollCtrl.updateSalaryRule);

// Enterprise Payroll Settings: Read-only for HR Payroll User; Admin & HR Payroll Manager full control
router.get('/settings', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Payroll User'), payrollCtrl.getPayrollSettings);
router.put('/settings', authorizeRoles('Admin', 'HR Payroll Manager'), payrollCtrl.updatePayrollSettings);

module.exports = router;
