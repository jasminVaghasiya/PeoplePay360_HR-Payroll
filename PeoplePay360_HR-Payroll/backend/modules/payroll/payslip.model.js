const mongoose = require('mongoose');

const payslipLineSchema = new mongoose.Schema(
  {
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryRule'
    },
    ruleCode: {
      type: String,
      required: true
    },
    ruleName: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Basic', 'Allowance', 'Gross', 'Deduction', 'Net'],
      required: true
    },
    sequence: {
      type: Number,
      required: true
    },
    ratePercentage: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    description: String
  },
  { _id: true }
);

const payslipSchema = new mongoose.Schema(
  {
    payslipNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    payrunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payrun',
      required: true
    },
    payrunName: {
      type: String,
      required: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    employeeName: {
      type: String,
      required: true,
      trim: true
    },
    employeeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    department: {
      type: String,
      default: 'General'
    },
    jobPosition: {
      type: String,
      default: 'Employee'
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true
    },
    contractName: {
      type: String,
      required: true
    },
    baseWage: {
      type: Number,
      required: true
    },
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: true
    },
    salaryStructureName: {
      type: String,
      required: true
    },
    periodStart: {
      type: Date,
      required: true
    },
    periodEnd: {
      type: Date,
      required: true
    },
    periodName: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Draft', 'Computed', 'Validated', 'Paid', 'Cancelled'],
      default: 'Draft'
    },
    // Working Days and Attendance Stats
    totalWorkingDays: {
      type: Number,
      default: 22
    },
    workedDays: {
      type: Number,
      default: 22
    },
    paidLeaveDays: {
      type: Number,
      default: 0
    },
    unpaidLeaveDays: {
      type: Number,
      default: 0
    },
    overtimeHours: {
      type: Number,
      default: 0
    },
    // Banking Details Snapshot
    bankName: {
      type: String,
      default: ''
    },
    bankAccountNumber: {
      type: String,
      default: ''
    },
    bankIFSC: {
      type: String,
      default: ''
    },
    panNumber: {
      type: String,
      default: ''
    },
    // Salary Calculation Breakdown
    lines: [payslipLineSchema],
    basic: {
      type: Number,
      default: 0
    },
    allowances: {
      type: Number,
      default: 0
    },
    gross: {
      type: Number,
      default: 0
    },
    deductions: {
      type: Number,
      default: 0
    },
    net: {
      type: Number,
      default: 0
    },
    warnings: [String],
    paidAt: Date,
    emailSentAt: Date,
    createdBy: {
      type: String,
      default: 'System'
    }
  },
  {
    timestamps: true
  }
);

payslipSchema.index({ payrunId: 1 });
payslipSchema.index({ employeeId: 1, periodStart: 1, periodEnd: 1 });

const Payslip = mongoose.model('Payslip', payslipSchema);

module.exports = { Payslip };
