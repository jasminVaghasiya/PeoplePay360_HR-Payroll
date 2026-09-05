const express = require('express');
const router = express.Router();
const { getEmployees } = require('./employee.controller');
const { verifyToken } = require('../auth/auth.middleware');

router.get('/', verifyToken, getEmployees);

module.exports = router;
