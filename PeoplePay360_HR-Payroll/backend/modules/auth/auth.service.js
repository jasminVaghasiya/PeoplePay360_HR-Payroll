const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authRepository = require('./auth.repository');
const { userRoles } = require('./auth.model');
const { canCreateRole, JWT_SECRET, JWT_REFRESH_SECRET } = require('./auth.middleware');

const crypto = require('crypto');

// Token Lifecycles (Industry Standard)
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // 7 days

class AuthService {
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        jti: crypto.randomUUID()
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
        jti: crypto.randomUUID()
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

    // Calculate expiry dates
    const accessExpiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MS);
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    // Save Access Token & Refresh Token in Database
    await authRepository.saveAccessToken({
      userId: user._id || user.id,
      userEmail: user.email,
      token: accessToken,
      expiresAt: accessExpiresAt,
      revoked: false,
      ipAddress,
      userAgent
    });

    await authRepository.saveRefreshToken({
      userId: user._id || user.id,
      userEmail: user.email,
      token: refreshToken,
      expiresAt: refreshExpiresAt,
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
      // Concurrency Grace Period (3s): If token was recently rotated, return existing replacement pair gracefully
      const rotatedTime = storedToken.rotatedAt ? new Date(storedToken.rotatedAt).getTime() : 0;
      const isWithinGracePeriod = rotatedTime > 0 && Date.now() - rotatedTime < 3000;

      if (isWithinGracePeriod && storedToken.replacedByToken) {
        const replacementRefreshToken = await authRepository.findRefreshToken(storedToken.replacedByToken);
        if (replacementRefreshToken) {
          const user = await authRepository.findById(decoded.id);
          if (user && user.status !== 'INACTIVE') {
            const activeAccessToken = this.generateAccessToken(user);
            return {
              accessToken: activeAccessToken,
              refreshToken: replacementRefreshToken.token
            };
          }
        }
      }

      // Security alert: Genuine reuse attack outside grace period
      await authRepository.revokeAllUserRefreshTokens(storedToken.userId);
      await authRepository.revokeAllUserAccessTokens(storedToken.userId);
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
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    // Revoke old refresh token & store replacedBy reference
    await authRepository.revokeRefreshToken(oldRefreshToken, newRefreshToken);

    // Save new Access Token & Refresh Token in DB
    const newAccessExpiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MS);
    const newRefreshExpiresAt = new Date();
    newRefreshExpiresAt.setDate(newRefreshExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await authRepository.saveAccessToken({
      userId: user._id || user.id,
      userEmail: user.email,
      token: newAccessToken,
      expiresAt: newAccessExpiresAt,
      revoked: false,
      ipAddress,
      userAgent
    });

    await authRepository.saveRefreshToken({
      userId: user._id || user.id,
      userEmail: user.email,
      token: newRefreshToken,
      expiresAt: newRefreshExpiresAt,
      revoked: false,
      ipAddress,
      userAgent
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout({ refreshToken, accessToken }) {
    if (refreshToken) {
      await authRepository.revokeRefreshToken(refreshToken);
    }
    if (accessToken) {
      await authRepository.revokeAccessToken(accessToken);
    }
    return true;
  }

  async createUser(creatorUser, { name, email, password, role, department, jobPosition, photo, employeeType, contractStartDate, contractEndDate, contractDuration }) {
    if (!name || !email || !password || !role) {
      throw { statusCode: 400, message: 'Name, email, password, and role are required fields' };
    }

    if (!password || password.length < 1) {
      throw { statusCode: 400, message: 'Password is required' };
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

    const empType = employeeType === 'Contract' ? 'Contract' : 'Permanent';
    const startDate = empType === 'Contract' ? (contractStartDate || '').trim() : '';
    const endDate = empType === 'Contract' ? (contractEndDate || '').trim() : '';
    const durationStr = startDate && endDate ? `${startDate} to ${endDate}` : (contractDuration || '').trim();

    const newUser = await authRepository.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role,
      department: department || 'General',
      jobPosition: jobPosition || 'Employee',
      employeeType: empType,
      contractStartDate: startDate,
      contractEndDate: endDate,
      contractDuration: durationStr,
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

