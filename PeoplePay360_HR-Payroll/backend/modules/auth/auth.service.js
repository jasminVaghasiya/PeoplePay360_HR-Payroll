const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authRepository = require('./auth.repository');
const { userRoles } = require('./auth.model');
const { canCreateRole, JWT_SECRET, JWT_REFRESH_SECRET } = require('./auth.middleware');

// Token Lifecycles (Industry Standard)
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // 7 days

class AuthService {
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      {
        id: user._id || user.id,
        email: user.email,
        jti: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      },
      JWT_REFRESH_SECRET,
      { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` }
    );
  }

  async login({ email, password, ipAddress = '', userAgent = '' }) {
    if (!email || !password) {
      throw { statusCode: 400, message: 'Please provide both email and password' };
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await authRepository.findByEmail(cleanEmail);

    if (!user) {
      throw { statusCode: 401, message: 'Invalid email address or password' };
    }

    let isMatch = false;
    if (typeof user.comparePassword === 'function') {
      isMatch = await user.comparePassword(password);
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid email address or password' };
    }

    if (user.status === 'INACTIVE') {
      throw { statusCode: 403, message: 'Account is deactivated. Please contact your Administrator.' };
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    // Save refresh token record in Database & memory store
    await authRepository.saveRefreshToken({
      userId: user._id || user.id,
      userEmail: user.email,
      token: refreshToken,
      expiresAt,
      revoked: false,
      ipAddress,
      userAgent
    });

    const userResponse = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      jobPosition: user.jobPosition,
      status: user.status,
      photo: user.photo,
      createdByName: user.createdByName
    };

    return {
      accessToken,
      refreshToken,
      user: userResponse
    };
  }

  async refreshAccessToken({ refreshToken: oldRefreshToken, ipAddress = '', userAgent = '' }) {
    if (!oldRefreshToken) {
      throw { statusCode: 400, message: 'Refresh token is required' };
    }

    // 1. Verify JWT signature of old refresh token
    let decoded;
    try {
      decoded = jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      throw { statusCode: 401, message: 'Refresh token is invalid or expired. Please log in again.' };
    }

    // 2. Find refresh token in DB/repository
    const storedToken = await authRepository.findRefreshToken(oldRefreshToken);
    if (!storedToken) {
      throw { statusCode: 401, message: 'Refresh token not recognized or already used.' };
    }

    // 3. Check if token is revoked or expired
    if (storedToken.revoked) {
      // Possible token reuse attack! Revoke all tokens for user safety
      await authRepository.revokeAllUserRefreshTokens(storedToken.userId);
      throw { statusCode: 403, message: 'Security alert: Invalid refresh token attempt. Please log in again.' };
    }

    if (new Date(storedToken.expiresAt) < new Date()) {
      throw { statusCode: 401, message: 'Refresh token expired. Please log in again.' };
    }

    // 4. Fetch associated user
    const user = await authRepository.findById(decoded.id);
    if (!user || user.status === 'INACTIVE') {
      throw { statusCode: 403, message: 'User account not active' };
    }

    // 5. Industry-Standard Refresh Token Rotation (RTR)
    // Generate new Access Token & NEW Refresh Token
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    // Revoke old refresh token & store replacedBy reference
    await authRepository.revokeRefreshToken(oldRefreshToken, newRefreshToken);

    // Save new refresh token in DB
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await authRepository.saveRefreshToken({
      userId: user._id || user.id,
      userEmail: user.email,
      token: newRefreshToken,
      expiresAt: newExpiresAt,
      revoked: false,
      ipAddress,
      userAgent
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout({ refreshToken }) {
    if (refreshToken) {
      await authRepository.revokeRefreshToken(refreshToken);
    }
    return true;
  }

  async createUser(creatorUser, { name, email, password, role, department, jobPosition, photo }) {
    if (!name || !email || !password || !role) {
      throw { statusCode: 400, message: 'Name, email, password, and role are required fields' };
    }

    if (password.length < 4) {
      throw { statusCode: 400, message: 'Password must be at least 4 characters long' };
    }

    if (!userRoles.includes(role)) {
      throw { statusCode: 400, message: `Invalid role '${role}'. Valid roles are: ${userRoles.join(', ')}` };
    }

    if (!canCreateRole(creatorUser.role, role)) {
      throw {
        statusCode: 403,
        message: `Forbidden: Your role (${creatorUser.role}) does not have permission to create users with role '${role}'`
      };
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await authRepository.findByEmail(cleanEmail);
    if (existingUser) {
      throw { statusCode: 409, message: `A user with email '${cleanEmail}' already exists in the system` };
    }

    const newUser = await authRepository.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role,
      department: department || 'General',
      jobPosition: jobPosition || 'Employee',
      status: 'ACTIVE',
      photo: photo || undefined,
      createdByName: creatorUser.name
    });

    return newUser;
  }

  async getUsers(query) {
    return await authRepository.findAll(query);
  }

  async toggleUserStatus(userId) {
    const updatedUser = await authRepository.updateStatus(userId);
    if (!updatedUser) {
      throw { statusCode: 404, message: 'User not found' };
    }
    return updatedUser;
  }
}

module.exports = new AuthService();

