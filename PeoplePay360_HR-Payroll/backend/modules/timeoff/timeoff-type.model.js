const mongoose = require('mongoose');

const timeOffTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Time off type name is required'],
      trim: true,
      unique: true
    },
    code: {
      type: String,
      required: [true, 'Time off type code is required'],
      trim: true,
      uppercase: true,
      unique: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    unit: {
      type: String,
      enum: ['Days', 'Hours'],
      default: 'Days'
    },
    requiresAllocation: {
      type: Boolean,
      default: true
    },
    approvalRequired: {
      type: Boolean,
      default: true
    },
    allowNegativeBalance: {
      type: Boolean,
      default: false
    },
    maxAllocation: {
      type: Number,
      default: 30,
      min: 0
    },
    validityPeriod: {
      type: String,
      enum: ['None', 'Annual', 'Quarterly', 'Monthly'],
      default: 'Annual'
    },
    payrollTreatment: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Compensatory', 'Special'],
      default: 'Paid'
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    color: {
      type: String,
      default: '#7C3AED'
    },
    createdByName: {
      type: String,
      default: 'System Admin'
    }
  },
  {
    timestamps: true
  }
);

const TimeOffType = mongoose.model('TimeOffType', timeOffTypeSchema);

module.exports = { TimeOffType };
