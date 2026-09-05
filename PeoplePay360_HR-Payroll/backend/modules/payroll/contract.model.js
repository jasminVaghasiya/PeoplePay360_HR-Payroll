const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required']
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
    contractName: {
      type: String,
      required: [true, 'Contract Name/Reference is required'],
      trim: true
    },
    wage: {
      type: Number,
      required: [true, 'Base Wage is required'],
      min: [0, 'Wage cannot be negative']
    },
    wageType: {
      type: String,
      enum: ['Monthly', 'Hourly'],
      default: 'Monthly'
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
    startDate: {
      type: Date,
      required: [true, 'Contract Start Date is required']
    },
    endDate: {
      type: Date,
      default: null // null indicates ongoing / permanent contract
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Expired', 'Terminated'],
      default: 'Active'
    },
    workingSchedule: {
      type: String,
      default: 'Standard 40h/week (Mon-Fri 09:00 - 18:00)'
    },
    // Banking & Compliance Details (for payroll warnings)
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
