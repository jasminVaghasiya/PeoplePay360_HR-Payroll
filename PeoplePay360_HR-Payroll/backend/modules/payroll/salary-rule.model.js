const mongoose = require('mongoose');

const salaryRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Salary Rule Name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Salary Rule Code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['Basic', 'Allowance', 'Gross', 'Deduction', 'Net'],
      required: true
    },
    sequence: {
      type: Number,
      required: true,
      default: 10
    },
    conditionType: {
      type: String,
      enum: ['Always True', 'Has Value', 'Condition Expression'],
      default: 'Always True'
    },
    computationType: {
      type: String,
      enum: ['Percentage of Base', 'Percentage of Gross', 'Fixed Amount', 'Formula Expression'],
      default: 'Percentage of Base'
    },
    amountPercentage: {
      type: Number,
      default: 0
    },
    amountFixed: {
      type: Number,
      default: 0
    },
    formula: {
      type: String,
      default: '',
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

salaryRuleSchema.index({ sequence: 1 });

const SalaryRule = mongoose.model('SalaryRule', salaryRuleSchema);

module.exports = { SalaryRule };
