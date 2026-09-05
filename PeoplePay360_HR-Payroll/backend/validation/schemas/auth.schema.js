const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Please enter your email address.',
    'string.email': 'Please enter a valid email address.',
    'any.required': 'Email address is required.'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Please enter your password.',
    'any.required': 'Password is required.'
  })
});

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Please enter full name.',
    'string.min': 'Full name must be at least 2 characters long.',
    'any.required': 'Full name is required.'
  }),
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Please enter an email address.',
    'string.email': 'Please enter a valid email address.',
    'any.required': 'Email address is required.'
  }),
  password: Joi.string().min(1).required().messages({
    'string.empty': 'Please enter a password.',
    'any.required': 'Password is required.'
  }),
  role: Joi.string().valid('Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager', 'Employee').required().messages({
    'any.only': 'Please select a valid user role.',
    'any.required': 'User role is required.'
  }),
  department: Joi.string().trim().optional().allow(''),
  jobPosition: Joi.string().trim().optional().allow(''),
  employeeType: Joi.string().valid('Permanent', 'Contract').optional(),
  contractStartDate: Joi.string().trim().optional().allow(''),
  contractEndDate: Joi.string().trim().optional().allow('')
});

module.exports = {
  loginSchema,
  createUserSchema
};
