const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    contractRef: {
      type: String,
      required: [true, 'Contract reference number is required'],
      unique: true,
      trim: true
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
      default: ''
    },
    employeeType: {
      type: String,
      enum: ['Permanent', 'Contract'],
      default: 'Permanent'
    },
    startDate: {
      type: String,
      required: [true, 'Contract start date is required']
    },
    endDate: {
      type: String,
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
      default: 5000
    },
    salaryStructure: {
      type: String,
      default: 'Standard Full-Time Structure'
    },
    status: {
      type: String,
      enum: ['DRAFT', 'RUNNING', 'EXPIRED', 'CANCELLED'],
      default: 'DRAFT'
    },
    notes: {
      type: String,
      default: ''
    },
    createdByName: {
      type: String,
      default: 'HR Manager'
    }
  },
  {
    timestamps: true
  }
);

contractSchema.index({ employeeId: 1, status: 1 });

const Contract = mongoose.model('Contract', contractSchema);

module.exports = { Contract };
