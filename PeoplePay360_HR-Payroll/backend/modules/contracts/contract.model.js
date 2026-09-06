const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    contractRef: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: () => 'CON-' + Date.now().toString().slice(-6)
    },
    contractName: {
      type: String,
      trim: true,
      default: function() { return this.contractRef || 'Standard Contract'; }
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    employeeName: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true
    },
    employeeEmail: {
      type: String,
      default: '',
      lowercase: true,
      trim: true
    },
    employeeType: {
      type: String,
      enum: ['Permanent', 'Contract'],
      default: 'Permanent'
    },
    startDate: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Contract start date is required']
    },
    endDate: {
      type: mongoose.Schema.Types.Mixed,
      default: ''
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      default: 'Engineering'
    },
    jobPosition: {
      type: String,
      required: [true, 'Job position is required'],
      default: 'Software Engineer'
    },
    wage: {
      type: Number,
      required: [true, 'Monthly wage is required'],
      min: [0, 'Wage cannot be negative'],
      default: 5000
    },
    wageType: {
      type: String,
      enum: ['Monthly', 'Hourly'],
      default: 'Monthly'
    },
    salaryStructure: {
      type: String,
      default: 'Standard Full-Time Structure'
    },
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      default: null
    },
    salaryStructureName: {
      type: String,
      default: 'Standard Employee Salary Structure'
    },
    status: {
      type: String,
      enum: [
        'Active', 'ACTIVE',
        'RUNNING', 'Running',
        'Draft', 'DRAFT',
        'Expired', 'EXPIRED',
        'Cancelled', 'CANCELLED',
        'Terminated', 'TERMINATED'
      ],
      default: 'RUNNING'
    },
    workingSchedule: {
      type: String,
      default: 'Standard 40h/week (Mon-Fri 09:00 - 18:00)'
    },
    bankName: {
      type: String,
      default: '',
      trim: true
    },
    bankAccountNumber: {
      type: String,
      default: '',
      trim: true
    },
    bankIFSC: {
      type: String,
      default: '',
      trim: true
    },
    panNumber: {
      type: String,
      default: '',
      trim: true
    },
    taxId: {
      type: String,
      default: '',
      trim: true
    },
    notes: {
      type: String,
      default: ''
    },
    createdByName: {
      type: String,
      default: 'HR Manager'
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

contractSchema.index({ employeeId: 1, status: 1 });

const Contract = mongoose.models.Contract || mongoose.model('Contract', contractSchema);

module.exports = { Contract };
