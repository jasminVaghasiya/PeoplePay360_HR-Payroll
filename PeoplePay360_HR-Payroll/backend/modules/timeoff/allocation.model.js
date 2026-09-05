const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedByName: { type: String, default: 'System' },
    timestamp: { type: Date, default: Date.now },
    previousStatus: { type: String, default: null },
    newStatus: { type: String, default: null },
    note: { type: String, default: '' }
  },
  { _id: false }
);

const allocationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee reference is required']
    },
    employeeName: {
      type: String,
      required: true
    },
    employeeEmail: {
      type: String,
      required: true
    },
    department: {
      type: String,
      default: 'General'
    },
    timeOffType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeOffType',
      required: [true, 'Time off type reference is required']
    },
    timeOffTypeName: {
      type: String,
      required: true
    },
    allocatedAmount: {
      type: Number,
      required: [true, 'Allocated amount is required'],
      min: [0.5, 'Allocated amount must be at least 0.5']
    },
    unit: {
      type: String,
      enum: ['Days', 'Hours'],
      default: 'Days'
    },
    startDate: {
      type: Date,
      required: [true, 'Validity start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Validity end date is required']
    },
    validityPeriod: {
      type: String,
      default: 'Annual'
    },
    reason: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Refused', 'Expired'],
      default: 'Pending Approval'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdByName: {
      type: String,
      default: 'HR Admin'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedByName: {
      type: String,
      default: null
    },
    approvalDate: {
      type: Date,
      default: null
    },
    refusalReason: {
      type: String,
      default: null
    },
    auditTrail: [auditLogSchema]
  },
  {
    timestamps: true
  }
);

const Allocation = mongoose.model('Allocation', allocationSchema);

module.exports = { Allocation };
