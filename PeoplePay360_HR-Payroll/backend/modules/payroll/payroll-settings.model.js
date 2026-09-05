const mongoose = require('mongoose');

const payrollSettingsSchema = new mongoose.Schema(
  {
    companyLegalName: {
      type: String,
      default: 'PeoplePay360 Inc.',
      trim: true
    },
    companyTradeName: {
      type: String,
      default: 'PeoplePay360 HR & Payroll Solutions',
      trim: true
    },
    gstNumber: {
      type: String,
      default: '27AABCU9603R1ZM',
      trim: true,
      uppercase: true
    },
    panNumber: {
      type: String,
      default: 'AABCU9603R',
      trim: true,
      uppercase: true
    },
    tanNumber: {
      type: String,
      default: 'MUMB12345C',
      trim: true,
      uppercase: true
    },
    cinNumber: {
      type: String,
      default: 'U72900MH2023PTC398124',
      trim: true,
      uppercase: true
    },
    companyAddress: {
      type: String,
      default: 'Level 8, Tech Park Avenue, Bandra-Kurla Complex',
      trim: true
    },
    city: {
      type: String,
      default: 'Mumbai',
      trim: true
    },
    state: {
      type: String,
      default: 'Maharashtra',
      trim: true
    },
    pincode: {
      type: String,
      default: '400051',
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    },
    contactEmail: {
      type: String,
      default: 'payroll@peoplepay360.com',
      trim: true,
      lowercase: true
    },
    contactPhone: {
      type: String,
      default: '+91 22 4987 6543',
      trim: true
    },
    website: {
      type: String,
      default: 'https://peoplepay360.com',
      trim: true
    },
    disbursalBankName: {
      type: String,
      default: 'HDFC Bank Ltd',
      trim: true
    },
    disbursalAccountNumber: {
      type: String,
      default: '50200088991122',
      trim: true
    },
    disbursalIfscCode: {
      type: String,
      default: 'HDFC0000240',
      trim: true,
      uppercase: true
    },
    defaultPfRate: {
      type: Number,
      default: 12
    },
    defaultPtAmount: {
      type: Number,
      default: 200
    },
    payslipPrefix: {
      type: String,
      default: 'SLIP',
      trim: true,
      uppercase: true
    },
    workingDaysBasis: {
      type: String,
      enum: ['Calendar Days', 'Fixed 26 Days', 'Exclude Weekends'],
      default: 'Calendar Days'
    },
    updatedBy: {
      type: String,
      default: 'System Admin'
    }
  },
  {
    timestamps: true
  }
);

const PayrollSettings = mongoose.model('PayrollSettings', payrollSettingsSchema);

module.exports = { PayrollSettings };
