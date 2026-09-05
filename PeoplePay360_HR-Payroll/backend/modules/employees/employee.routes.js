const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth/auth.middleware');
const AppError = require('../../errors/AppError');

router.get('/', verifyToken, (req, res, next) => {
  next(AppError.notFound('Employee directory module has been disabled.'));
});

module.exports = router;
