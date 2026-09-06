const Joi = require('joi');

const createContractSchema = Joi.object({
  employeeName: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Please enter employee full name.',
    'string.min': 'Employee name must be at least 2 characters long.',
    'any.required': 'Employee full name is required.'
  }),
  employeeEmail: Joi.string().trim().email().required().messages({
    'string.empty': 'Please enter employee email address.',
    'string.email': 'Please enter a valid email address.',
    'any.required': 'Employee email address is required.'
  }),
  password: Joi.string().min(1).optional().allow('').messages({
    'string.empty': 'Password cannot be empty.'
  }),
  employeeType: Joi.string().default('Contract'),
  startDate: Joi.string().trim().required().messages({
    'string.empty': 'Contract start date is required.',
    'any.required': 'Contract start date is required.'
  }),
  endDate: Joi.string().trim().required().messages({
    'string.empty': 'Contract end date is required.',
    'any.required': 'Contract end date is required.'
  }),
  department: Joi.string().trim().required().messages({
    'string.empty': 'Please select or specify a department.',
    'any.required': 'Department is required.'
  }),
  jobPosition: Joi.string().trim().required().messages({
    'string.empty': 'Please specify job position.',
    'any.required': 'Job position is required.'
  }),
  wage: Joi.number().min(0).required().messages({
    'number.base': 'Monthly wage must be a valid number.',
    'number.min': 'Monthly wage cannot be negative.',
    'any.required': 'Monthly wage is required.'
  }),
  contractName: Joi.string().trim().optional().allow(''),
  status: Joi.string().valid('DRAFT', 'Draft', 'RUNNING', 'Running', 'ACTIVE', 'Active', 'EXPIRED', 'Expired', 'CANCELLED', 'Cancelled', 'TERMINATED', 'Terminated').default('RUNNING'),
  notes: Joi.string().trim().optional().allow(''),
  isRenewal: Joi.boolean().optional().default(false)
});

const updateContractSchema = Joi.object({
  contractName: Joi.string().trim().optional().allow(''),
  employeeName: Joi.string().trim().min(2).optional(),
  employeeEmail: Joi.string().trim().email().optional(),
  password: Joi.string().optional().allow(''),
  employeeType: Joi.string().optional(),
  startDate: Joi.string().trim().optional(),
  endDate: Joi.string().trim().optional().allow(''),
  department: Joi.string().trim().optional(),
  jobPosition: Joi.string().trim().optional(),
  wage: Joi.number().min(0).optional(),
  status: Joi.string().valid('DRAFT', 'Draft', 'RUNNING', 'Running', 'ACTIVE', 'Active', 'EXPIRED', 'Expired', 'CANCELLED', 'Cancelled', 'TERMINATED', 'Terminated').optional(),
  notes: Joi.string().trim().optional().allow(''),
  isRenewal: Joi.boolean().optional()
});

module.exports = {
  createContractSchema,
  updateContractSchema
};
