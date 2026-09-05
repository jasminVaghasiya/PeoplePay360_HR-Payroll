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

const timeOffRequestSchema = new mongoose.Schema(
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
      required: [true, 'Time off type is required']
    },
    timeOffTypeName: {
      type: String,
      required: true
    },
    timeOffTypeCode: {
      type: String,
      default: ''
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    startTime: {
      type: String,
      default: '09:00'
    },
    endTime: {
      type: String,
      default: '18:00'
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [0.5, 'Duration must be at least 0.5']
    },
    unit: {
      type: String,
      enum: ['Days', 'Hours'],
      default: 'Days'
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true
    },
    attachment: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending', 'Approved', 'Refused', 'Cancelled'],
      default: 'Pending'
    },
    requestedDate: {
      type: Date,
      default: Date.now
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedByName: {
      type: String,
      default: null
    },
    approvalDate: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    cancellationReason: {
      type: String,
      default: null
    },
    cancelledDate: {
      type: Date,
      default: null
    },
    auditTrail: [auditLogSchema]
  },
  {
    timestamps: true
  }
);

// Helpful indexes
timeOffRequestSchema.index({ employee: 1, startDate: 1, endDate: 1 });
timeOffRequestSchema.index({ status: 1 });

const TimeOffRequest = mongoose.model('TimeOffRequest', timeOffRequestSchema);

module.exports = { TimeOffRequest };
