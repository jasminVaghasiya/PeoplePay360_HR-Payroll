const mongoose = require('mongoose');

const payrunWarningSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    employeeName: String,
    type: {
      type: String,
      enum: ['Missing Bank Info', 'Missing Contract', 'Duplicate Payslip', 'Contract Expiring', 'Incomplete Info', 'Notice'],
      default: 'Notice'
    },
    message: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['warning', 'error', 'info'],
      default: 'warning'
    }
  },
  { _id: true }
);

const payrunSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Payrun Name is required'],
      trim: true
    },
    batchReference: {
      type: String,
      unique: true,
      trim: true
    },
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: [true, 'Salary Structure is required']
    },
    salaryStructureName: {
      type: String,
      required: true
    },
    periodStart: {
      type: Date,
      required: [true, 'Payroll Period Start Date is required']
    },
    periodEnd: {
      type: Date,
      required: [true, 'Payroll Period End Date is required']
    },
    periodName: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['New', 'Computed', 'Validated', 'Paid', 'Closed'],
      default: 'New'
    },
    selectedEmployeeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    payslipCount: {
      type: Number,
      default: 0
    },
    totalBasic: {
      type: Number,
      default: 0
    },
    totalAllowances: {
      type: Number,
      default: 0
    },
    totalGross: {
      type: Number,
      default: 0
    },
    totalDeductions: {
      type: Number,
      default: 0
    },
    totalNet: {
      type: Number,
      default: 0
    },
    warnings: [payrunWarningSchema],
    computedAt: Date,
    computedBy: String,
    validatedAt: Date,
    validatedBy: String,
    paidAt: Date,
    paidBy: String,
    emailSentAt: Date,
    emailSentCount: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ''
    },
    createdBy: {
      type: String,
      default: 'System'
    }
  },
  {
    timestamps: true
  }
);

payrunSchema.index({ status: 1 });
payrunSchema.index({ periodStart: 1, periodEnd: 1 });

const Payrun = mongoose.model('Payrun', payrunSchema);

module.exports = { Payrun };
