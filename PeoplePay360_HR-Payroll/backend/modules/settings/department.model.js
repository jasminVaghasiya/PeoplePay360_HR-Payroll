const mongoose = require('mongoose');

const positionSubSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  level: {
    type: String,
    enum: ['Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager', 'Executive'],
    default: 'Mid-Level'
  },
  defaultSalary: {
    type: Number,
    default: 50000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: '#7C3AED'
    },
    icon: {
      type: String,
      default: 'Building'
    },
    headOfDepartment: {
      type: String,
      default: ''
    },
    positions: [positionSubSchema],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
