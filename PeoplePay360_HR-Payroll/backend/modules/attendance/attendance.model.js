const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    changedBy: { type: String, required: true },
    changedDate: { type: Date, default: Date.now },
    oldCheckIn: Date,
    newCheckIn: Date,
    oldCheckOut: Date,
    newCheckOut: Date,
    reason: { type: String, default: '' }
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
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
    date: {
      type: String, // YYYY-MM-DD format
      required: true
    },
    checkIn: {
      type: Date,
      required: true
    },
    checkOut: {
      type: Date,
      default: null
    },
    scheduledHours: {
      type: Number,
      default: 8.0
    },
    breakHours: {
      type: Number,
      default: 1.0
    },
    workedHours: {
      type: Number,
      default: 0
    },
    overtimeHours: {
      type: Number,
      default: 0
    },
    lateMinutes: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Present', 'Late', 'Absent', 'Half Day', 'Overtime', 'Missing Check-Out', 'Corrected'],
      default: 'Present'
    },
    source: {
      type: String,
      enum: ['Web Kiosk', 'Manual Correction', 'System Auto'],
      default: 'Web Kiosk'
    },
    notes: {
      type: String,
      default: ''
    },
    correctionStatus: {
      type: String,
      enum: ['None', 'Requested', 'Approved', 'Refused'],
      default: 'None'
    },
    correctionReason: {
      type: String,
      default: ''
    },
    correctedCheckIn: {
      type: Date,
      default: null
    },
    correctedCheckOut: {
      type: Date,
      default: null
    },
    originalCheckIn: Date,
    originalCheckOut: Date,
    correctedBy: String,
    correctedAt: Date,
    createdBy: {
      type: String,
      default: 'System'
    },
    updatedBy: {
      type: String,
      default: 'System'
    },
    auditTrail: [auditLogSchema]
  },
  {
    timestamps: true
  }
);

// Prevent duplicate attendance records for the same employee on the same date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ date: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    isPaid: { type: Boolean, default: true }
  },
  { _id: true }
);

const attendanceConfigSchema = new mongoose.Schema(
  {
    standardCheckIn: { type: String, default: '09:00' },
    standardCheckOut: { type: String, default: '18:00' },
    scheduledHours: { type: Number, default: 8.0 },
    breakHours: { type: Number, default: 1.0 },
    lateGraceMinutes: { type: Number, default: 15 },
    weeklyOffDays: { type: [String], default: ['Sunday'] },
    holidays: [holidaySchema]
  },
  { timestamps: true }
);

const AttendanceConfig = mongoose.model('AttendanceConfig', attendanceConfigSchema);

module.exports = { Attendance, AttendanceConfig };
