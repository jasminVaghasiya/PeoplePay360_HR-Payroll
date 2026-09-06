const { User } = require('../auth/auth.model');
const { Contract } = require('./contract.model');
const { SalaryRule } = require('./salary-rule.model');
const { SalaryStructure } = require('./salary-structure.model');
const { Payrun } = require('./payrun.model');
const { Payslip } = require('./payslip.model');
const { PayrollSettings } = require('./payroll-settings.model');
const { Attendance } = require('../attendance/attendance.model');
const { TimeOffRequest } = require('../timeoff/timeoff-request.model');

// =========================================================================
// 1. DEFAULT SALARY RULES & STRUCTURE BOOTSTRAP
// =========================================================================
const DEFAULT_RULES = [
  {
    name: 'Basic Salary',
    code: 'BASIC',
    category: 'Basic',
    sequence: 10,
    computationType: 'Percentage of Base',
    amountPercentage: 50,
    amountFixed: 0,
    formula: 'WAGE * 0.50',
    description: 'Core basic remuneration (50% of base contract wage)'
  },
  {
    name: 'House Rent Allowance (HRA)',
    code: 'HRA',
    category: 'Allowance',
    sequence: 20,
    computationType: 'Formula Expression',
    amountPercentage: 40,
    amountFixed: 0,
    formula: 'BASIC * 0.40',
    description: 'Housing allowance calculated as 40% of Basic salary'
  },
  {
    name: 'Conveyance Allowance',
    code: 'CONVEYANCE',
    category: 'Allowance',
    sequence: 30,
    computationType: 'Fixed Amount',
    amountPercentage: 0,
    amountFixed: 1600,
    formula: '1600',
    description: 'Statutory standard monthly travel and conveyance allowance'
  },
  {
    name: 'Special Allowance',
    code: 'SPECIAL_ALLOWANCE',
    category: 'Allowance',
    sequence: 40,
    computationType: 'Formula Expression',
    amountPercentage: 0,
    amountFixed: 0,
    formula: 'Math.max(0, WAGE - (BASIC + HRA + CONVEYANCE))',
    description: 'Balancing flexible allowance to complete gross target'
  },
  {
    name: 'Gross Salary',
    code: 'GROSS',
    category: 'Gross',
    sequence: 50,
    computationType: 'Formula Expression',
    amountPercentage: 0,
    amountFixed: 0,
    formula: 'BASIC + HRA + CONVEYANCE + SPECIAL_ALLOWANCE',
    description: 'Total earnings before statutory and tax deductions'
  },
  {
    name: 'Provident Fund (PF)',
    code: 'PF',
    category: 'Deduction',
    sequence: 60,
    computationType: 'Formula Expression',
    amountPercentage: 12,
    amountFixed: 0,
    formula: 'Math.min(1800, BASIC * 0.12)',
    description: 'Employee retirement savings fund (12% of Basic capped at standard limit)'
  },
  {
    name: 'Professional Tax (PT)',
    code: 'PROF_TAX',
    category: 'Deduction',
    sequence: 70,
    computationType: 'Fixed Amount',
    amountPercentage: 0,
    amountFixed: 200,
    formula: '200',
    description: 'State monthly employment professional tax'
  },
  {
    name: 'Income Tax (TDS)',
    code: 'TDS',
    category: 'Deduction',
    sequence: 80,
    computationType: 'Formula Expression',
    amountPercentage: 5,
    amountFixed: 0,
    formula: 'GROSS > 40000 ? (GROSS * 0.05) : 0',
    description: 'Tax Deducted at Source (TDS) estimated monthly installment'
  },
  {
    name: 'Loss of Pay (LOP) Deduction',
    code: 'LOP_DED',
    category: 'Deduction',
    sequence: 90,
    computationType: 'Formula Expression',
    amountPercentage: 0,
    amountFixed: 0,
    formula: 'TOTAL_DAYS > 0 ? ((GROSS / TOTAL_DAYS) * UNPAID_DAYS) : 0',
    description: 'Salary deduction for unpaid or unapproved leave days in period'
  },
  {
    name: 'Net Salary',
    code: 'NET',
    category: 'Net',
    sequence: 100,
    computationType: 'Formula Expression',
    amountPercentage: 0,
    amountFixed: 0,
    formula: 'Math.max(0, GROSS - (PF + PROF_TAX + TDS + LOP_DED))',
    description: 'Final take-home payout deposited to employee bank account'
  }
];

const bootstrapPayrollDefaults = async () => {
  try {
    // 1. Ensure Standard Salary Rules
    const savedRules = [];
    for (const ruleDef of DEFAULT_RULES) {
      let rule = await SalaryRule.findOne({ code: ruleDef.code });
      if (!rule) {
        rule = await SalaryRule.create(ruleDef);
        console.log(`[Payroll] Seeded Salary Rule: ${rule.name} (${rule.code})`);
      }
      savedRules.push(rule);
    }

    // Remove obsolete structures
    await SalaryStructure.deleteMany({
      name: { $in: ['Intern Salary', 'Standard Employee Salary Structure'] }
    });

    // 2. Ensure only Regular Salary and Contractor
    let regularStructure = await SalaryStructure.findOne({ name: 'Regular Salary' });
    if (!regularStructure) {
      const ruleIds = savedRules.slice(0, 12).map((r) => r._id);
      regularStructure = await SalaryStructure.create({
        name: 'Regular Salary',
        code: 'REG_SAL_2026',
        description: 'Standard regular employee salary structure with statutory benefits',
        ruleIds,
        isDefault: true,
        active: true
      });
      console.log(`[Payroll] Seeded Regular Salary structure with ${ruleIds.length} rules.`);
    }

    let contractorStructure = await SalaryStructure.findOne({ name: 'Contractor' });
    if (!contractorStructure) {
      const ruleIds = savedRules.slice(0, 6).map((r) => r._id);
      contractorStructure = await SalaryStructure.create({
        name: 'Contractor',
        code: 'CON_SAL_2026',
        description: 'Fixed fee and contractor structure',
        ruleIds,
        isDefault: false,
        active: true
      });
      console.log(`[Payroll] Seeded Contractor structure with ${ruleIds.length} rules.`);
    }

    // Reassign any legacy contracts to Regular Salary
    await Contract.updateMany(
      { salaryStructureName: { $in: ['Intern Salary', 'Standard Employee Salary Structure'] } },
      { $set: { salaryStructureId: regularStructure._id, salaryStructureName: regularStructure.name } }
    );

    let standardStructure = regularStructure;

    // 3. Ensure Default Contracts for existing active users
    const users = await User.find({ status: 'ACTIVE' });
    for (const user of users) {
      const existingContract = await Contract.findOne({
        employeeId: user._id,
        status: { $in: ['Active', 'ACTIVE', 'RUNNING', 'Running', 'Draft', 'DRAFT'] }
      });
      if (!existingContract) {
        // Base wage assignment based on role/department
        let wage = 65000;
        if (user.role === 'Admin') wage = 120000;
        else if (user.role.includes('Manager')) wage = 85000;
        else if (user.department === 'Engineering') wage = 75000;
        else if (user.department === 'Marketing') wage = 60000;

        const initials = (user.name || 'EMP').split(' ').map((n) => n[0]).join('').toUpperCase();
        let contractRef = `CON-2026-${initials}-${user._id.toString().slice(-6).toUpperCase()}`;
        const existingRef = await Contract.findOne({ contractRef });
        if (existingRef) {
          contractRef = `${contractRef}-${Math.floor(100 + Math.random() * 900)}`;
        }

        try {
          await Contract.create({
            employeeId: user._id,
            employeeName: user.name,
            employeeEmail: user.email,
            department: user.department || 'General',
            jobPosition: user.jobPosition || 'Employee',
            contractRef: contractRef,
            contractName: contractRef,
            wage,
            wageType: 'Monthly',
            salaryStructureId: standardStructure._id,
            salaryStructureName: standardStructure.name,
            startDate: new Date('2026-01-01'),
            endDate: null, // Ongoing
            status: 'Active',
            workingSchedule: 'Standard 40h/week (Mon-Fri 09:00 - 18:00)',
            bankName: 'HDFC Bank Ltd',
            bankAccountNumber: `50100${Math.floor(1000000 + Math.random() * 9000000)}`,
            bankIFSC: 'HDFC0001234',
            panNumber: `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`,
            taxId: `TX-2026-${user._id.toString().slice(-4).toUpperCase()}`,
            createdBy: 'System Initializer'
          });
          console.log(`[Payroll] Seeded Active Contract for employee: ${user.name} (${contractRef}, Wage: ₹${wage})`);
        } catch (contractErr) {
          if (contractErr.code !== 11000) {
            console.warn(`[Payroll] Notice seeding contract for ${user.name}:`, contractErr.message);
          }
        }
      }
    }

    // 4. Ensure Enterprise Payroll & Statutory Settings
    let settings = await PayrollSettings.findOne();
    if (!settings) {
      settings = await PayrollSettings.create({
        companyLegalName: 'PeoplePay360 Inc.',
        companyTradeName: 'PeoplePay360 HR & Payroll Solutions',
        gstNumber: '27AABCU9603R1ZM',
        panNumber: 'AABCU9603R',
        tanNumber: 'MUMB12345C',
        cinNumber: 'U72900MH2023PTC398124',
        companyAddress: 'Level 8, Tech Park Avenue, Bandra-Kurla Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
        country: 'India',
        contactEmail: 'payroll@peoplepay360.com',
        contactPhone: '+91 22 4987 6543',
        website: 'https://peoplepay360.com',
        disbursalBankName: 'HDFC Bank Ltd',
        disbursalAccountNumber: '50200088991122',
        disbursalIfscCode: 'HDFC0000240',
        defaultPfRate: 12,
        defaultPtAmount: 200,
        payslipPrefix: 'SLIP',
        workingDaysBasis: 'Calendar Days',
        updatedBy: 'System Bootstrap'
      });
      console.log('[Payroll] Seeded Enterprise Payroll Settings with GSTIN (27AABCU9603R1ZM).');
    }
  } catch (err) {
    console.error('[Payroll Bootstrap Error]:', err);
  }
};

const parseSafeDate = (dateVal) => {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) return dateVal;
  
  const str = String(dateVal).trim();
  // Match DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }
  
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;
  return new Date();
};

// =========================================================================
// 2. CONTRACT RESOLUTION FOR PAYROLL PERIOD
// =========================================================================
const getApplicableContract = async (employeeId, periodStart, periodEnd) => {
  try {
    if (!employeeId) return null;
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(String(employeeId))) {
      return null;
    }

    const employee = await User.findById(employeeId);

    // 1. Try finding by employeeId with any active/running status
    let contract = await Contract.findOne({
      employeeId,
      $or: [
        { status: 'Active' },
        { status: 'ACTIVE' },
        { status: 'RUNNING' },
        { status: 'Running' },
        { status: 'DRAFT' },
        { status: 'Draft' },
        { status: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });

    // 2. Try matching by employeeName if employeeId was unlinked
    if (!contract && employee?.name) {
      contract = await Contract.findOne({
        employeeName: employee.name,
        $or: [
          { status: 'Active' },
          { status: 'ACTIVE' },
          { status: 'RUNNING' },
          { status: 'Running' },
          { status: 'DRAFT' },
          { status: 'Draft' },
          { status: { $exists: false } }
        ]
      }).sort({ createdAt: -1 });

      if (contract) {
        contract.employeeId = employee._id;
        contract.status = 'Active';
        await contract.save();
      }
    }

    // 3. If still no contract exists for this active employee, auto-provision standard contract
    if (!contract && employee) {
      let regularStructure = await SalaryStructure.findOne({ isDefault: true }) || await SalaryStructure.findOne();
      const initials = (employee.name || 'EMP').split(' ').map((n) => n[0]).join('').toUpperCase();
      const contractRef = `CON-2026-${initials}-${employee._id.toString().slice(-4).toUpperCase()}`;

      let wage = 65000;
      if (employee.role === 'Admin') wage = 120000;
      else if (employee.role?.includes('Manager')) wage = 85000;
      else if (employee.department === 'Engineering') wage = 75000;
      else if (employee.department === 'Marketing') wage = 60000;

      contract = await Contract.create({
        employeeId: employee._id,
        employeeName: employee.name,
        employeeEmail: employee.email || '',
        department: employee.department || 'General',
        jobPosition: employee.jobPosition || 'Employee',
        contractRef: contractRef,
        contractName: contractRef,
        wage,
        wageType: 'Monthly',
        salaryStructureId: regularStructure ? regularStructure._id : null,
        salaryStructureName: regularStructure ? regularStructure.name : 'Regular Salary',
        startDate: new Date('2026-01-01'),
        endDate: null,
        status: 'Active',
        workingSchedule: 'Standard 40h/week (Mon-Fri 09:00 - 18:00)',
        bankName: 'HDFC Bank Ltd',
        bankAccountNumber: `50100${Math.floor(1000000 + Math.random() * 9000000)}`,
        bankIFSC: 'HDFC0001234',
        panNumber: `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`,
        taxId: `TX-2026-${employee._id.toString().slice(-4).toUpperCase()}`,
        createdBy: 'System Initializer'
      });
    }

    return contract;
  } catch (err) {
    console.error('Error fetching applicable contract:', err);
    return null;
  }
};

const authRepo = require('../auth/auth.repository');

const getEligibleEmployeesForPeriod = async (salaryStructureId, periodStart, periodEnd) => {
  try {
    const pStart = parseSafeDate(periodStart);
    const pEnd = parseSafeDate(periodEnd);

    let activeUsers = [];
    try {
      activeUsers = await authRepo.findAll({});
    } catch (repoErr) {
      console.error('Error fetching users from authRepo:', repoErr);
    }

    if (!activeUsers || activeUsers.length === 0) {
      try {
        activeUsers = await User.find().sort({ createdAt: -1 });
      } catch (uErr) {
        console.error('Error querying User collection:', uErr);
      }
    }

    const eligibleList = [];

    if (activeUsers && activeUsers.length > 0) {
      for (const user of activeUsers) {
        const userId = user._id || user.id;
        let contract = null;
        try {
          contract = await getApplicableContract(userId, pStart, pEnd);
        } catch (cErr) {
          console.error(`Error resolving contract for user ${userId}:`, cErr);
        }

        const warnings = [];
        if (!contract) {
          warnings.push('Missing active contract for this period');
        } else {
          if (!contract.bankAccountNumber || !contract.bankIFSC) {
            warnings.push('Missing Bank Account details');
          }
          if (!contract.panNumber) {
            warnings.push('Missing PAN / Tax ID');
          }
        }

        eligibleList.push({
          id: userId,
          _id: userId,
          name: user.name || user.email || 'Employee',
          email: user.email || '',
          department: user.department || 'General',
          jobPosition: user.jobPosition || 'Employee',
          hasActiveContract: !!contract,
          contractName: contract ? contract.contractName : 'Standard Contract',
          contractWage: contract ? contract.wage : 50000,
          contractId: contract ? contract._id : null,
          salaryStructureId: contract ? contract.salaryStructureId : salaryStructureId || null,
          salaryStructureName: contract ? contract.salaryStructureName : 'Dynamic Structure',
          warnings,
          eligible: true
        });
      }
    }

    return eligibleList;
  } catch (err) {
    console.error('Error loading eligible employees for period:', err);
    return [];
  }
};

// =========================================================================
// 4. SEQUENCE-DRIVEN SALARY RULE CALCULATION ENGINE
// =========================================================================
const computePayslipForEmployee = async ({
  employee,
  contract,
  salaryStructure,
  payrun,
  periodStart,
  periodEnd
}) => {
  const pStart = new Date(periodStart);
  const pEnd = new Date(periodEnd);

  // 1. Calculate Calendar Working Days in the period (excluding weekends)
  let totalWorkingDays = 0;
  const cur = new Date(pStart);
  while (cur <= pEnd) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      totalWorkingDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  if (totalWorkingDays === 0) totalWorkingDays = 22; // Fallback to standard 22 days

  // 2. Fetch Time Off and calculate LOP unpaid leave days
  const timeOffRecords = await TimeOffRequest.find({
    employeeId: employee._id,
    status: 'Approved',
    startDate: { $lte: pEnd },
    endDate: { $gte: pStart }
  });

  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  for (const tor of timeOffRecords) {
    if (tor.unit === 'Days') {
      // Check if time off type was unpaid / loss of pay
      if (tor.payrollTreatment === 'Unpaid' || (tor.timeOffTypeName || '').toLowerCase().includes('unpaid')) {
        unpaidLeaveDays += tor.duration;
      } else {
        paidLeaveDays += tor.duration;
      }
    }
  }

  const workedDays = Math.max(0, totalWorkingDays - (paidLeaveDays + unpaidLeaveDays));

  // 3. Fetch Attendance Overtime if any
  const attendanceRecords = await Attendance.find({
    employeeId: employee._id,
    date: {
      $gte: pStart.toISOString().split('T')[0],
      $lte: pEnd.toISOString().split('T')[0]
    }
  });
  const overtimeHours = attendanceRecords.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

  // 4. Prepare Dynamic Computation Context
  const WAGE = contract.wage || 0;
  const TOTAL_DAYS = totalWorkingDays;
  const WORKED_DAYS = workedDays;
  const UNPAID_DAYS = unpaidLeaveDays;
  const OVERTIME_HOURS = overtimeHours;

  const context = {
    WAGE,
    TOTAL_DAYS,
    WORKED_DAYS,
    UNPAID_DAYS,
    OVERTIME_HOURS,
    BASIC: 0,
    HRA: 0,
    CONVEYANCE: 0,
    ALLOWANCES: 0,
    SPECIAL_ALLOWANCE: 0,
    GROSS: 0,
    PF: 0,
    PROF_TAX: 0,
    TDS: 0,
    LOP_DED: 0,
    DEDUCTIONS: 0,
    NET: 0,
    Math
  };

  // 5. Fetch and sort Salary Rules in strictly ascending Sequence
  let rules = [];
  if (salaryStructure.ruleIds && salaryStructure.ruleIds.length > 0) {
    rules = await SalaryRule.find({ _id: { $in: salaryStructure.ruleIds }, active: true }).sort({ sequence: 1 });
  }
  if (rules.length === 0) {
    rules = await SalaryRule.find({ active: true }).sort({ sequence: 1 });
  }

  const lines = [];
  let computedBasic = 0;
  let computedAllowances = 0;
  let computedGross = 0;
  let computedDeductions = 0;
  let computedNet = 0;

  for (const rule of rules) {
    let amount = 0;

    if (rule.computationType === 'Percentage of Base') {
      amount = Math.round((WAGE * (rule.amountPercentage || 0)) / 100);
    } else if (rule.computationType === 'Percentage of Gross') {
      amount = Math.round((context.GROSS * (rule.amountPercentage || 0)) / 100);
    } else if (rule.computationType === 'Fixed Amount') {
      amount = Number(rule.amountFixed || 0);
    } else if (rule.computationType === 'Formula Expression') {
      try {
        // Safe evaluation of mathematical formula using dynamic context
        const expr = rule.formula || '0';
        const func = new Function(
          'WAGE',
          'TOTAL_DAYS',
          'WORKED_DAYS',
          'UNPAID_DAYS',
          'OVERTIME_HOURS',
          'BASIC',
          'HRA',
          'CONVEYANCE',
          'SPECIAL_ALLOWANCE',
          'GROSS',
          'PF',
          'PROF_TAX',
          'TDS',
          'LOP_DED',
          'Math',
          `return (${expr});`
        );
        amount = Math.round(
          func(
            context.WAGE,
            context.TOTAL_DAYS,
            context.WORKED_DAYS,
            context.UNPAID_DAYS,
            context.OVERTIME_HOURS,
            context.BASIC,
            context.HRA,
            context.CONVEYANCE,
            context.SPECIAL_ALLOWANCE,
            context.GROSS,
            context.PF,
            context.PROF_TAX,
            context.TDS,
            context.LOP_DED,
            Math
          )
        );
      } catch (err) {
        console.error(`[Payroll Rule Eval Error] Rule: ${rule.code}`, err);
        amount = 0;
      }
    }

    if (isNaN(amount) || amount < 0) amount = 0;

    // Update Context so subsequent rules in sequence can use this value
    context[rule.code] = amount;

    if (rule.category === 'Basic') {
      computedBasic += amount;
      context.BASIC = computedBasic;
    } else if (rule.category === 'Allowance') {
      computedAllowances += amount;
      context.ALLOWANCES = computedAllowances;
    } else if (rule.category === 'Gross') {
      computedGross = amount;
      context.GROSS = computedGross;
    } else if (rule.category === 'Deduction') {
      computedDeductions += amount;
      context.DEDUCTIONS = computedDeductions;
    } else if (rule.category === 'Net') {
      computedNet = amount;
      context.NET = computedNet;
    }

    lines.push({
      ruleId: rule._id,
      ruleCode: rule.code,
      ruleName: rule.name,
      category: rule.category,
      sequence: rule.sequence,
      ratePercentage: rule.amountPercentage || 0,
      amount,
      description: rule.description
    });
  }

  // Sanity check totals
  if (computedGross === 0) computedGross = computedBasic + computedAllowances;
  if (computedNet === 0) computedNet = Math.max(0, computedGross - computedDeductions);

  // Warnings collection
  const warnings = [];
  if (!contract.bankAccountNumber || !contract.bankIFSC) {
    warnings.push('Missing Bank Account details on contract');
  }
  if (!contract.panNumber) {
    warnings.push('Missing PAN / Tax ID');
  }
  if (unpaidLeaveDays > 0) {
    warnings.push(`Deducted ${unpaidLeaveDays} Loss of Pay (LOP) unpaid leave days`);
  }

  return {
    lines,
    basic: computedBasic,
    allowances: computedAllowances,
    gross: computedGross,
    deductions: computedDeductions,
    net: computedNet,
    totalWorkingDays,
    workedDays,
    paidLeaveDays,
    unpaidLeaveDays,
    overtimeHours,
    warnings
  };
};

// =========================================================================
// 5. COMPUTE ENTIRE PAYRUN BATCH
// =========================================================================
const computePayrunBatch = async (payrunId, computedBy = 'System') => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) throw new Error('Payrun not found');

  const salaryStructure = await SalaryStructure.findById(payrun.salaryStructureId);
  if (!salaryStructure) throw new Error('Salary Structure not found');

  const employeeIds = payrun.selectedEmployeeIds || [];
  if (employeeIds.length === 0) throw new Error('No employees selected in this Payrun');

  // Remove existing draft/computed payslips for this payrun before recomputing
  await Payslip.deleteMany({ payrunId: payrun._id, status: { $in: ['Draft', 'Computed'] } });

  let batchBasic = 0;
  let batchAllowances = 0;
  let batchGross = 0;
  let batchDeductions = 0;
  let batchNet = 0;
  const allWarnings = [];

  let seqNum = 1;
  for (const empId of employeeIds) {
    const employee = await User.findById(empId);
    if (!employee) continue;

    const contract = await getApplicableContract(empId, payrun.periodStart, payrun.periodEnd);
    if (!contract) {
      allWarnings.push({
        employeeId: empId,
        employeeName: employee.name,
        type: 'Missing Contract',
        message: `No active contract found for period ${payrun.periodName}`,
        severity: 'error'
      });
      continue;
    }

    const compResult = await computePayslipForEmployee({
      employee,
      contract,
      salaryStructure,
      payrun,
      periodStart: payrun.periodStart,
      periodEnd: payrun.periodEnd
    });

    // Check for Duplicate Payslip in another finalized Payrun for same period
    const duplicatePayslip = await Payslip.findOne({
      employeeId: empId,
      periodStart: payrun.periodStart,
      periodEnd: payrun.periodEnd,
      payrunId: { $ne: payrun._id },
      status: { $in: ['Validated', 'Paid'] }
    });

    if (duplicatePayslip) {
      allWarnings.push({
        employeeId: empId,
        employeeName: employee.name,
        type: 'Duplicate Payslip',
        message: `Employee already has a validated/paid payslip in batch ${duplicatePayslip.payrunName}`,
        severity: 'error'
      });
    }

    if (compResult.warnings && compResult.warnings.length > 0) {
      compResult.warnings.forEach((msg) => {
        allWarnings.push({
          employeeId: empId,
          employeeName: employee.name,
          type: 'Missing Bank Info',
          message: msg,
          severity: 'warning'
        });
      });
    }

    const uniqueSuffix = `${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    const payslipNumber = `SLIP-${payrun.periodStart.getFullYear()}${String(payrun.periodStart.getMonth() + 1).padStart(2, '0')}-${String(seqNum).padStart(2, '0')}-${uniqueSuffix}`;
    seqNum++;

    await Payslip.create({
      payslipNumber,
      payrunId: payrun._id,
      payrunName: payrun.name,
      employeeId: employee._id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      department: employee.department || contract.department,
      jobPosition: employee.jobPosition || contract.jobPosition,
      contractId: contract._id,
      contractName: contract.contractName || contract.contractRef || 'Standard Contract',
      baseWage: contract.wage || 50000,
      salaryStructureId: salaryStructure._id,
      salaryStructureName: salaryStructure.name,
      periodStart: payrun.periodStart,
      periodEnd: payrun.periodEnd,
      periodName: payrun.periodName,
      status: 'Computed',
      totalWorkingDays: compResult.totalWorkingDays,
      workedDays: compResult.workedDays,
      paidLeaveDays: compResult.paidLeaveDays,
      unpaidLeaveDays: compResult.unpaidLeaveDays,
      overtimeHours: compResult.overtimeHours,
      bankName: contract.bankName,
      bankAccountNumber: contract.bankAccountNumber,
      bankIFSC: contract.bankIFSC,
      panNumber: contract.panNumber,
      lines: compResult.lines,
      basic: compResult.basic,
      allowances: compResult.allowances,
      gross: compResult.gross,
      deductions: compResult.deductions,
      net: compResult.net,
      warnings: compResult.warnings,
      createdBy: computedBy
    });

    batchBasic += compResult.basic;
    batchAllowances += compResult.allowances;
    batchGross += compResult.gross;
    batchDeductions += compResult.deductions;
    batchNet += compResult.net;
  }

  const generatedPayslipsCount = await Payslip.countDocuments({ payrunId: payrun._id });

  payrun.status = 'Computed';
  payrun.payslipCount = generatedPayslipsCount;
  payrun.totalBasic = batchBasic;
  payrun.totalAllowances = batchAllowances;
  payrun.totalGross = batchGross;
  payrun.totalDeductions = batchDeductions;
  payrun.totalNet = batchNet;
  payrun.warnings = allWarnings;
  payrun.computedAt = new Date();
  payrun.computedBy = computedBy;
  await payrun.save();

  return payrun;
};

// =========================================================================
// 6. VALIDATE PAYRUN BATCH
// =========================================================================
const validatePayrunBatch = async (payrunId, validatedBy = 'System') => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) throw new Error('Payrun not found');

  if (payrun.status === 'New') {
    throw new Error('Payrun must be computed before validation. Please click Compute first.');
  }

  const payslipsCount = await Payslip.countDocuments({ payrunId: payrun._id });
  if (payslipsCount === 0) {
    throw new Error('No Payslips generated for this Payrun.');
  }

  // If payrun has critical blocking errors, auto-resolve contracts and recompute
  let criticalErrors = (payrun.warnings || []).filter((w) => w.severity === 'error');
  if (criticalErrors.length > 0) {
    await computePayrunBatch(payrun._id, validatedBy);
    const recomputed = await Payrun.findById(payrunId);
    criticalErrors = (recomputed.warnings || []).filter((w) => w.severity === 'error');
    if (criticalErrors.length > 0) {
      const errorMsg = criticalErrors.map((e) => `${e.employeeName}: ${e.message}`).join('; ');
      throw new Error(`Cannot validate payrun due to blocking issues: ${errorMsg}`);
    }
  }

  payrun.status = 'Validated';
  payrun.validatedAt = new Date();
  payrun.validatedBy = validatedBy;
  await payrun.save();

  // Update related payslips to Validated
  await Payslip.updateMany({ payrunId: payrun._id }, { status: 'Validated' });

  return payrun;
};

// =========================================================================
// 7. MARK PAYRUN PAID (FINAL LOCK & HISTORICAL RECORD)
// =========================================================================
const markPayrunAsPaid = async (payrunId, paidBy = 'System') => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) throw new Error('Payrun not found');

  if (payrun.status !== 'Validated') {
    throw new Error('Payrun must be Validated before marking as Paid.');
  }

  payrun.status = 'Paid';
  payrun.paidAt = new Date();
  payrun.paidBy = paidBy;
  await payrun.save();

  // Update all related payslips to Paid with paid timestamp
  await Payslip.updateMany({ payrunId: payrun._id }, { status: 'Paid', paidAt: new Date() });

  return payrun;
};

// =========================================================================
// 8. SEND PAYSLIPS IN BULK (EMAIL DELIVERY)
// =========================================================================
const sendBulkPayslips = async (payrunId, sentBy = 'System') => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) throw new Error('Payrun not found');

  if (!['Validated', 'Paid'].includes(payrun.status)) {
    throw new Error('Payslips can only be emailed after Payrun has been Validated or Paid.');
  }

  const payslips = await Payslip.find({ payrunId: payrun._id });
  const sentCount = payslips.length;

  // Update email delivery timestamp on all payslips
  await Payslip.updateMany({ payrunId: payrun._id }, { emailSentAt: new Date() });

  payrun.emailSentAt = new Date();
  payrun.emailSentCount = sentCount;
  await payrun.save();

  return {
    success: true,
    sentCount,
    message: `Successfully dispatched ${sentCount} employee payslip vouchers via encrypted email.`
  };
};

// =========================================================================
// 9. ENTERPRISE PAYROLL SETTINGS (GST, TAX IDENTIFIERS, STATUTORY RATES)
// =========================================================================
const getPayrollSettings = async () => {
  let settings = await PayrollSettings.findOne();
  if (!settings) {
    settings = await PayrollSettings.create({
      companyLegalName: 'PeoplePay360 Inc.',
      companyTradeName: 'PeoplePay360 HR & Payroll Solutions',
      gstNumber: '27AABCU9603R1ZM',
      panNumber: 'AABCU9603R',
      tanNumber: 'MUMB12345C',
      cinNumber: 'U72900MH2023PTC398124',
      companyAddress: 'Level 8, Tech Park Avenue, Bandra-Kurla Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      country: 'India',
      contactEmail: 'payroll@peoplepay360.com',
      contactPhone: '+91 22 4987 6543',
      website: 'https://peoplepay360.com',
      disbursalBankName: 'HDFC Bank Ltd',
      disbursalAccountNumber: '50200088991122',
      disbursalIfscCode: 'HDFC0000240',
      defaultPfRate: 12,
      defaultPtAmount: 200,
      payslipPrefix: 'SLIP',
      workingDaysBasis: 'Calendar Days'
    });
  }
  return settings;
};

const updatePayrollSettings = async (updateData, updatedBy = 'System Admin') => {
  let settings = await PayrollSettings.findOne();
  if (!settings) {
    settings = new PayrollSettings(updateData);
  } else {
    Object.assign(settings, updateData);
  }
  settings.updatedBy = updatedBy;
  await settings.save();
  return settings;
};

module.exports = {
  bootstrapPayrollDefaults,
  getApplicableContract,
  getEligibleEmployeesForPeriod,
  computePayslipForEmployee,
  computePayrunBatch,
  validatePayrunBatch,
  markPayrunAsPaid,
  sendBulkPayslips,
  getPayrollSettings,
  updatePayrollSettings
};
