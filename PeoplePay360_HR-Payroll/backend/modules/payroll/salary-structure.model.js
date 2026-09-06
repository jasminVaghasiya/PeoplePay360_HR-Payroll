const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Salary Structure Name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Salary Structure Code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    ruleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryRule'
      }
    ],
    rulesSnapshot: [
      {
        ruleId: mongoose.Schema.Types.ObjectId,
        code: String,
        name: String,
        category: String,
        sequence: Number,
        computationType: String,
        amountPercentage: Number,
        amountFixed: Number,
        formula: String
      }
    ],
    isDefault: {
      type: Boolean,
      default: false
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

const SalaryStructure = mongoose.model('SalaryStructure', salaryStructureSchema);

module.exports = { SalaryStructure };
