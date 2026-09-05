const { Payrun } = require('./payrun.model');
const { Payslip } = require('./payslip.model');
const { Contract } = require('./contract.model');
const { SalaryStructure } = require('./salary-structure.model');
const { SalaryRule } = require('./salary-rule.model');
const { User } = require('../auth/auth.model');
const payrollService = require('./payroll.service');

// 1. GET /api/payroll/summary
const getPayrollSummary = async (req, res) => {
  try {
    const isEmployee = req.user.role === 'Employee';

    if (isEmployee) {
      const myPayslips = await Payslip.find({ employeeId: req.user._id });
      const totalNetPaid = myPayslips.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + (p.net || 0), 0);
      const latestSlip = myPayslips.sort((a, b) => new Date(b.periodEnd) - new Date(a.periodEnd))[0];

      return res.status(200).json({
        success: true,
        summary: {
          totalNetPaid,
          payslipsCount: myPayslips.length,
          latestNet: latestSlip ? latestSlip.net : 0,
          activeContractWage: (await Contract.findOne({ employeeId: req.user._id, status: 'Active' }))?.wage || 0
        }
      });
    }

    const payruns = await Payrun.find();
    const payslips = await Payslip.find();

    const totalNetPaid = payruns
      .filter((p) => p.status === 'Paid')
      .reduce((sum, p) => sum + (p.totalNet || 0), 0);

    const activeBatchesCount = payruns.filter((p) => ['New', 'Computed'].includes(p.status)).length;
    const pendingValidationCount = payruns.filter((p) => p.status === 'Computed').length;
    const totalPayslipsCount = payslips.length;

    const contractsCount = await Contract.countDocuments({ status: 'Active' });
    const structuresCount = await SalaryStructure.countDocuments({ active: true });

    return res.status(200).json({
      success: true,
      summary: {
        totalNetPaid,
        activeBatchesCount,
        pendingValidationCount,
        totalPayslipsCount,
        contractsCount,
        structuresCount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payroll summary', error: err.message });
  }
};

// 2. GET /api/payroll/payruns
const getPayruns = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { batchReference: { $regex: search, $options: 'i' } },
        { salaryStructureName: { $regex: search, $options: 'i' } }
      ];
    }

    const payruns = await Payrun.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payruns.length,
      payruns
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payruns', error: err.message });
  }
};

// 3. POST /api/payroll/payruns (From Wizard)
const createPayrun = async (req, res) => {
  try {
    const { name, salaryStructureId, periodStart, periodEnd, selectedEmployeeIds, notes } = req.body;

    if (!name || !salaryStructureId || !periodStart || !periodEnd) {
      return res.status(400).json({ success: false, message: 'Missing required Payrun fields' });
    }

    if (!selectedEmployeeIds || selectedEmployeeIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one employee for the Payrun' });
    }

    const structure = await SalaryStructure.findById(salaryStructureId);
    if (!structure) {
      return res.status(404).json({ success: false, message: 'Selected Salary Structure not found' });
    }

    const pStart = new Date(periodStart);
    const pEnd = new Date(periodEnd);
    const pName = `${pStart.toISOString().split('T')[0]} to ${pEnd.toISOString().split('T')[0]}`;
    const batchReference = `PR-${pStart.getFullYear()}${String(pStart.getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;

    const payrun = await Payrun.create({
      name,
      batchReference,
      salaryStructureId: structure._id,
      salaryStructureName: structure.name,
      periodStart: pStart,
      periodEnd: pEnd,
      periodName: pName,
      status: 'New',
      selectedEmployeeIds,
      payslipCount: selectedEmployeeIds.length,
      notes: notes || '',
      createdBy: req.user?.name || req.user?.email || 'System Admin'
    });

    // Automatically compute initial draft payslips
    const computedPayrun = await payrollService.computePayrunBatch(payrun._id, req.user?.name || 'Admin');

    return res.status(201).json({
      success: true,
      message: `Payrun "${name}" created and computed with ${computedPayrun.payslipCount} payslips.`,
      payrun: computedPayrun
    });
  } catch (err) {
    console.error('[Create Payrun Error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create payrun', error: err.message });
  }
};

// 4. GET /api/payroll/payruns/:id
const getPayrunById = async (req, res) => {
  try {
    const payrun = await Payrun.findById(req.params.id);
    if (!payrun) {
      return res.status(404).json({ success: false, message: 'Payrun not found' });
    }

    const payslips = await Payslip.find({ payrunId: payrun._id }).sort({ employeeName: 1 });

    return res.status(200).json({
      success: true,
      payrun,
      payslips
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payrun details', error: err.message });
  }
};

// 5. DELETE /api/payroll/payruns/:id
const deletePayrun = async (req, res) => {
  try {
    const payrun = await Payrun.findById(req.params.id);
    if (!payrun) {
      return res.status(404).json({ success: false, message: 'Payrun not found' });
    }

    if (payrun.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Cannot delete a finalized Paid Payrun historical record.' });
    }

    await Payslip.deleteMany({ payrunId: payrun._id });
    await Payrun.findByIdAndDelete(payrun._id);

    return res.status(200).json({
      success: true,
      message: 'Payrun and associated draft payslips deleted.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete payrun', error: err.message });
  }
};

// 6. POST /api/payroll/payruns/:id/compute
const computePayrun = async (req, res) => {
  try {
    const updatedPayrun = await payrollService.computePayrunBatch(req.params.id, req.user.name);
    return res.status(200).json({
      success: true,
      message: `Payrun recomputed dynamically for ${updatedPayrun.payslipCount} employees.`,
      payrun: updatedPayrun
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// 7. POST /api/payroll/payruns/:id/validate
const validatePayrun = async (req, res) => {
  try {
    const updatedPayrun = await payrollService.validatePayrunBatch(req.params.id, req.user.name);
    return res.status(200).json({
      success: true,
      message: `Payrun successfully validated and locked for payout.`,
      payrun: updatedPayrun
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// 8. POST /api/payroll/payruns/:id/pay
const markPayrunPaid = async (req, res) => {
  try {
    const updatedPayrun = await payrollService.markPayrunAsPaid(req.params.id, req.user.name);
    return res.status(200).json({
      success: true,
      message: `Payrun marked as Paid. Bank transactions archived into immutable historical record.`,
      payrun: updatedPayrun
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// 9. POST /api/payroll/payruns/:id/send-payslips
const sendBulkPayslips = async (req, res) => {
  try {
    const result = await payrollService.sendBulkPayslips(req.params.id, req.user.name);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// 10. GET /api/payroll/payslips
const getPayslips = async (req, res) => {
  try {
    const { search, payrunId, status } = req.query;
    const query = {};

    // Role-based filter
    if (req.user.role === 'Employee') {
      query.employeeId = req.user._id;
    }

    if (payrunId) query.payrunId = payrunId;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { payslipNumber: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const payslips = await Payslip.find(query).sort({ periodEnd: -1, employeeName: 1 });

    return res.status(200).json({
      success: true,
      count: payslips.length,
      payslips
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payslips', error: err.message });
  }
};

// 11. GET /api/payroll/payslips/:id
const getPayslipById = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id);
    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    // Role security check
    if (req.user.role === 'Employee' && payslip.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this payslip' });
    }

    return res.status(200).json({
      success: true,
      payslip
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payslip', error: err.message });
  }
};

// 12. GET /api/payroll/eligible-employees (Wizard Step 2)
const getEligibleEmployees = async (req, res) => {
  try {
    const { salaryStructureId, periodStart, periodEnd } = req.query;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ success: false, message: 'Period Start and End dates are required' });
    }

    const employees = await payrollService.getEligibleEmployeesForPeriod(salaryStructureId, periodStart, periodEnd);

    return res.status(200).json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load eligible employees', error: err.message });
  }
};

// 13. CONTRACTS CRUD
const getContracts = async (req, res) => {
  try {
    const { status, search, department } = req.query;
    const query = {};

    if (req.user.role === 'Employee') {
      query.employeeId = req.user._id;
    }

    if (status) query.status = status;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { contractName: { $regex: search, $options: 'i' } }
      ];
    }

    const contracts = await Contract.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: contracts.length,
      contracts
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch contracts', error: err.message });
  }
};

const createContract = async (req, res) => {
  try {
    const {
      employeeId,
      contractName,
      wage,
      wageType,
      salaryStructureId,
      startDate,
      endDate,
      status,
      bankName,
      bankAccountNumber,
      bankIFSC,
      panNumber,
      taxId,
      workingSchedule
    } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Selected Employee not found' });
    }

    let structureName = 'Standard Employee Salary Structure';
    if (salaryStructureId) {
      const struct = await SalaryStructure.findById(salaryStructureId);
      if (struct) structureName = struct.name;
    }

    const contract = await Contract.create({
      employeeId: employee._id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      department: employee.department || 'General',
      jobPosition: employee.jobPosition || 'Employee',
      contractName,
      wage: Number(wage),
      wageType: wageType || 'Monthly',
      salaryStructureId,
      salaryStructureName: structureName,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status: status || 'Active',
      bankName: bankName || '',
      bankAccountNumber: bankAccountNumber || '',
      bankIFSC: bankIFSC || '',
      panNumber: panNumber || '',
      taxId: taxId || '',
      workingSchedule: workingSchedule || 'Standard 40h/week (Mon-Fri 09:00 - 18:00)',
      createdBy: req.user.name
    });

    return res.status(201).json({
      success: true,
      message: `Contract "${contractName}" created for ${employee.name}.`,
      contract
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create contract', error: err.message });
  }
};

const updateContract = async (req, res) => {
  try {
    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });

    return res.status(200).json({
      success: true,
      message: 'Contract updated successfully.',
      contract
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update contract', error: err.message });
  }
};

// 14. SALARY STRUCTURES & RULES CRUD
const getSalaryStructures = async (req, res) => {
  try {
    const structures = await SalaryStructure.find().populate('ruleIds').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: structures.length, structures });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch salary structures', error: err.message });
  }
};

const createSalaryStructure = async (req, res) => {
  try {
    const { name, code, description, ruleIds, isDefault } = req.body;
    const structure = await SalaryStructure.create({
      name,
      code: code.toUpperCase(),
      description,
      ruleIds: ruleIds || [],
      isDefault: !!isDefault
    });

    return res.status(201).json({ success: true, message: 'Salary Structure created.', structure });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create structure', error: err.message });
  }
};

const getSalaryRules = async (req, res) => {
  try {
    const rules = await SalaryRule.find().sort({ sequence: 1 });
    return res.status(200).json({ success: true, count: rules.length, rules });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch rules', error: err.message });
  }
};

const createSalaryRule = async (req, res) => {
  try {
    const rule = await SalaryRule.create(req.body);
    return res.status(201).json({ success: true, message: 'Salary Rule created.', rule });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create rule', error: err.message });
  }
};

const updateSalaryRule = async (req, res) => {
  try {
    const rule = await SalaryRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ success: true, message: 'Salary Rule updated.', rule });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update rule', error: err.message });
  }
};

// 12. GET /api/payroll/settings
const getPayrollSettings = async (req, res) => {
  try {
    const settings = await payrollService.getPayrollSettings();
    return res.status(200).json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payroll settings', error: err.message });
  }
};

// 13. PUT /api/payroll/settings
const updatePayrollSettings = async (req, res) => {
  try {
    const updatedBy = req.user?.name || req.user?.email || 'Admin';
    const settings = await payrollService.updatePayrollSettings(req.body, updatedBy);
    return res.status(200).json({ success: true, message: 'Enterprise payroll settings updated successfully.', settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update payroll settings', error: err.message });
  }
};

module.exports = {
  getPayrollSummary,
  getPayruns,
  createPayrun,
  getPayrunById,
  deletePayrun,
  computePayrun,
  validatePayrun,
  markPayrunPaid,
  sendBulkPayslips,
  getPayslips,
  getPayslipById,
  getEligibleEmployees,
  getContracts,
  createContract,
  updateContract,
  getSalaryStructures,
  createSalaryStructure,
  getSalaryRules,
  createSalaryRule,
  updateSalaryRule,
  getPayrollSettings,
  updatePayrollSettings
};
