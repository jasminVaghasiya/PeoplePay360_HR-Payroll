const authService = require('./auth.service');

// Login Controller
const login = async (req, res) => {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await authService.login({
      ...req.body,
      ipAddress,
      userAgent
    });

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${result.user.name}!`,
      token: result.accessToken, // Legacy alias
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error during authentication'
    });
  }
};

// Refresh Access Token Controller
const refreshToken = async (req, res) => {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await authService.refreshAccessToken({
      refreshToken: req.body.refreshToken,
      ipAddress,
      userAgent
    });

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      token: result.accessToken, // Legacy alias
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    const statusCode = error.statusCode || 401;
    return res.status(statusCode).json({
      success: false,
      code: 'REFRESH_FAILED',
      message: error.message || 'Failed to refresh token'
    });
  }
};

// Logout Controller
const logout = async (req, res) => {
  try {
    await authService.logout({ refreshToken: req.body.refreshToken });
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      message: 'Logged out'
    });
  }
};

// Create User Controller (Admin & Higher Authority)
const createUser = async (req, res) => {
  try {
    const newUser = await authService.createUser(req.user, req.body);
    return res.status(201).json({
      success: true,
      message: `User '${newUser.name}' (${newUser.role}) created successfully`,
      user: newUser
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create user'
    });
  }
};

// Get All Users Directory Controller
const getUsers = async (req, res) => {
  try {
    const users = await authService.getUsers(req.query);
    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch users'
    });
  }
};

// Toggle User Active/Inactive Status Controller
const toggleUserStatus = async (req, res) => {
  try {
    const updatedUser = await authService.toggleUserStatus(req.params.id);
    return res.status(200).json({
      success: true,
      message: `User status changed to ${updatedUser.status}`,
      user: updatedUser
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update user status'
    });
  }
};

// Get Current Logged-in User Profile
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

// Update User Role Controller (Admin & Higher Authority)
const updateUserRole = async (req, res) => {
  try {
    const updatedUser = await authService.updateUserRole(req.user, req.params.id, req.body.role);
    return res.status(200).json({
      success: true,
      message: Role for '' updated to '' successfully,
      user: updatedUser
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update user role'
    });
  }
};

// Get Single User Details by ID (Admin/HR or self)
const getUserById = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const isSelf = req.user.id === targetUserId || req.user._id?.toString() === targetUserId;
    const isHRorAdmin = ['Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager'].includes(req.user.role);

    if (!isSelf && !isHRorAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only view your own profile details.'
      });
    }

    const user = await authService.getUserById(targetUserId);
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch user details'
    });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  createUser,
  getUsers,
  toggleUserStatus,
  getMe,
  getUserById,
  updateUserRole
};
