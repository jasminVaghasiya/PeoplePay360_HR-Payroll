const express = require('express');
const router = express.Router();
const {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  updateContractStatus,
  deleteContract
} = require('./contract.controller');
const { verifyToken, authorizeRoles } = require('../auth/auth.middleware');
const validate = require('../../validation/joiValidator');
const { createContractSchema, updateContractSchema } = require('../../validation/schemas/contract.schema');

router.use(verifyToken);

router.get('/', getContracts);
router.get('/:id', getContractById);

// Policy & Access Control Layer: Protect write endpoints to authorized HR & Admin roles
router.post('/', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'), validate(createContractSchema), createContract);
router.put('/:id', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'), validate(updateContractSchema), updateContract);
router.put('/:id/status', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'), updateContractStatus);
router.delete('/:id', authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'), deleteContract);

module.exports = router;
