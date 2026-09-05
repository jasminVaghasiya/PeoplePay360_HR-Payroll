const jwt = require('jsonwebtoken');
const { User } = require('./auth.model');
const { ROLE } = require('../access-control/models/types');
const attachAbility = require('../access-control/middlewares/attachAbility');
const authRepository = require('./auth.repository');

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360_secret_jwt_key_hackathon_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'peoplepay360_secret_jwt_refresh_key_hackathon_2026';

const ROLE_HIERARCHY = {
  [ROLE.EMPLOYEE]: 1,
  [ROLE.HR_MANAGER]: 2,
  [ROLE.HR_PAYROLL_USER]: 2,
  [ROLE.HR_PAYROLL_MANAGER]: 3,
  [ROLE.ADMIN]: 4
};

// Authenticate JWT Access Token
const verifyToken = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'NO_TOKEN',
        message: 'Access denied. No authentication token provided.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired. Please refresh your session.'
        });
      }
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token.'
      });
    }

    // Check DB access token revocation status
    try {
      const storedAccessToken = await authRepository.findAccessToken(token);
      if (storedAccessToken && storedAccessToken.revoked) {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_REVOKED',
          message: 'Access token has been revoked.'
        });
      }
    } catch (e) {
      // Safe fallback if database query fails transiently
    }

    let user = null;
    try {
      user = await authRepository.findById(decoded.id);
    } catch (e) {
      // Safe fallback
    }

    if (!user) {
      user = decoded;
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        code: 'USER_INACTIVE',
        message: 'Your account has been deactivated. Please contact your system administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_FAILED',
      message: 'Authentication failed.'
    });
  }
};

// Authorize specific roles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
};

// Check if user has authority to create target role
const canCreateRole = (creatorRole, targetRole) => {
  if (targetRole === 'Admin' || targetRole === ROLE.ADMIN) return false;
  if (creatorRole === ROLE.ADMIN) {
    return [ROLE.HR_PAYROLL_MANAGER, ROLE.HR_PAYROLL_USER, ROLE.HR_MANAGER, ROLE.EMPLOYEE].includes(targetRole);
  }
  if (creatorRole === ROLE.HR_PAYROLL_MANAGER) {
    return [ROLE.HR_PAYROLL_USER, ROLE.HR_MANAGER, ROLE.EMPLOYEE].includes(targetRole);
  }
  if (creatorRole === ROLE.HR_MANAGER) {
    return targetRole === ROLE.EMPLOYEE;
  }
  return false;
};

module.exports = {
  verifyToken,
  authorizeRoles,
  attachAbility,
  canCreateRole,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  ROLE_HIERARCHY
};

