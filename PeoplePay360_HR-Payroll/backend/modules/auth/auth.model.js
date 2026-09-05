const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userRoles = ['Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager', 'Employee'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [4, 'Password must be at least 4 characters long'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: userRoles,
        message: '{VALUE} is not a valid user role'
      },
      default: 'Employee'
    },
    department: {
      type: String,
      default: 'General',
      trim: true
    },
    jobPosition: {
      type: String,
      default: 'Team Member',
      trim: true
    },
    employeeType: {
      type: String,
      enum: ['Permanent', 'Contract'],
      default: 'Permanent'
    },
    contractStartDate: {
      type: String,
      default: '',
      trim: true
    },
    contractEndDate: {
      type: String,
      default: '',
      trim: true
    },
    contractDuration: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    },
    photo: {
      type: String,
      default: ''
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

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    revoked: {
      type: Boolean,
      default: false
    },
    replacedByToken: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically purge expired tokens from MongoDB
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = { User, RefreshToken, userRoles };


