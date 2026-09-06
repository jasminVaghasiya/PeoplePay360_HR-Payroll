const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authRepository = require('./auth.repository');
const { User, userRoles } = require('./auth.model');
const { canCreateRole, JWT_SECRET, JWT_REFRESH_SECRET } = require('./auth.middleware');
const { getIsConnected } = require('../../config/db');
const contractRepository = require('../contracts/contract.repository');

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
    let storedToken = await authRepository.findRefreshToken(oldRefreshToken);
    if (!storedToken) {
      // Graceful session recovery: If token signature is cryptographically valid and unexpired
      const user = (await authRepository.findById(decoded.id)) || (await authRepository.findByEmail(decoded.email));
      if (!user || user.status === 'INACTIVE') {
        throw { statusCode: 401, message: 'Session expired or user inactive. Please log in again.' };
      }

      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

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

    // 3. Check if token is revoked or expired
    if (storedToken.revoked) {
      // Concurrency Grace Period (30s): If token was recently rotated, return existing active replacement pair
      const rotatedTime = storedToken.rotatedAt ? new Date(storedToken.rotatedAt).getTime() : 0;
      const isWithinGracePeriod = rotatedTime > 0 && Date.now() - rotatedTime < 30000;

      if (isWithinGracePeriod && storedToken.replacedByToken) {
        let currentReplacement = await authRepository.findRefreshToken(storedToken.replacedByToken);
        // Follow replacement chain if multiple rapid rotations occurred within grace period
        while (currentReplacement && currentReplacement.revoked && currentReplacement.replacedByToken) {
          currentReplacement = await authRepository.findRefreshToken(currentReplacement.replacedByToken);
        }

        if (currentReplacement && !currentReplacement.revoked) {
          const user = (await authRepository.findById(decoded.id)) || (await authRepository.findByEmail(decoded.email));
          if (user && user.status !== 'INACTIVE') {
            const activeAccessToken = this.generateAccessToken(user);
            return {
              accessToken: activeAccessToken,
              refreshToken: currentReplacement.token
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
    const user = (await authRepository.findById(decoded.id)) || (await authRepository.findByEmail(decoded.email));
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

  async createUser(creatorUser, { name, email, password, role, department, jobPosition, photo, employeeType, contractStartDate, contractEndDate, contractDuration, salary, wage }) {
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

    // Parse salary / wage (Default fallback: 50,000 INR if not provided)
    const rawSalary = salary !== undefined ? salary : wage;
    const parsedSalary = Number(rawSalary);
    const monthlySalary = !isNaN(parsedSalary) && parsedSalary >= 0 ? parsedSalary : 50000;

    const newUser = await authRepository.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role,
      department: department || 'General',
      jobPosition: jobPosition || 'Employee',
      salary: monthlySalary,
      employeeType: empType,
      contractStartDate: startDate,
      contractEndDate: endDate,
      contractDuration: durationStr,
      status: 'ACTIVE',
      photo: photo || undefined,
      createdByName: creatorUser.name
    });

    // Automatically create/bind Active Employment Contract for Payroll & HR calculations
    try {
      const initials = (name.trim().split(' ').map((n) => n[0]).join('') || 'EMP').toUpperCase().slice(0, 3);
      const userRefId = (newUser._id || newUser.id || Date.now()).toString().slice(-4).toUpperCase();
      const contractRef = `CON-2026-${initials}-${userRefId}`;

      await contractRepository.create({
        contractRef,
        contractName: `${newUser.name} - Employment Agreement`,
        employeeId: newUser._id || newUser.id,
        employeeName: newUser.name,
        employeeEmail: newUser.email,
        employeeType: empType,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || '',
        department: newUser.department || 'General',
        jobPosition: newUser.jobPosition || 'Employee',
        wage: monthlySalary,
        wageType: 'Monthly',
        salaryStructure: empType === 'Contract' ? 'Contractor' : 'Regular Salary',
        salaryStructureName: empType === 'Contract' ? 'Contractor Fixed Structure' : 'Standard Employee Salary Structure',
        status: 'RUNNING',
        notes: `Contract initialized automatically upon employee onboarding with monthly wage ₹${monthlySalary.toLocaleString()}`,
        createdByName: creatorUser.name || 'HR Operations'
      });
    } catch (contractErr) {
      console.warn('[AuthService] Notice: Could not auto-generate contract for employee:', contractErr.message);
    }

    return newUser;
  }

  async getUsers(query) {
    return await authRepository.findAll(query);
  }

  async toggleUserStatus(actorUser, userId) {
    const targetUser = await authRepository.findById(userId);
    if (!targetUser) {
      throw { statusCode: 404, message: 'User not found' };
    }
    if (targetUser.role === 'Admin') {
      throw { statusCode: 403, message: 'Forbidden: System Admin account cannot be deactivated' };
    }
    if (actorUser) {
      const isSelf = actorUser.id === userId || 
                     actorUser._id?.toString() === userId || 
                     actorUser.email?.toLowerCase().trim() === targetUser.email?.toLowerCase().trim();
      if (isSelf) {
        throw { statusCode: 403, message: 'Forbidden: You cannot deactivate your own account' };
      }
    }
    const updatedUser = await authRepository.updateStatus(userId);
    return updatedUser;
  }

  async deleteUser(actorUser, userId) {
    const targetUser = await authRepository.findById(userId);
    if (!targetUser) {
      throw { statusCode: 404, message: 'User not found' };
    }
    if (targetUser.role === 'Admin') {
      throw { statusCode: 403, message: 'Forbidden: System Admin account cannot be deleted' };
    }
    if (actorUser) {
      const isSelf = actorUser.id === userId || 
                     actorUser._id?.toString() === userId || 
                     actorUser.email?.toLowerCase().trim() === targetUser.email?.toLowerCase().trim();
      if (isSelf) {
        throw { statusCode: 403, message: 'Forbidden: You cannot delete your own account' };
      }
    }
    await authRepository.deleteById(userId);
    return { success: true, message: `Employee ${targetUser.name} deleted successfully` };
  }

  async getUserById(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    return user;
  }

  async updateUserRole(creatorUser, targetUserId, newRole) {
    if (!newRole) {
      throw { statusCode: 400, message: 'New role is required' };
    }

    if (newRole === 'Admin' || newRole === 'admin') {
      if (creatorUser.role !== 'Admin') {
        throw { statusCode: 403, message: 'Forbidden: Only an Admin can assign the Admin role' };
      }
    }

    if (!userRoles.includes(newRole)) {
      throw { statusCode: 400, message: `Invalid role '${newRole}'` };
    }

    if (!canCreateRole(creatorUser.role, newRole)) {
      throw {
        statusCode: 403,
        message: `Forbidden: Your role (${creatorUser.role}) does not have permission to assign role '${newRole}'`
      };
    }

    const targetUser = await authRepository.findById(targetUserId);
    if (!targetUser) {
      throw { statusCode: 404, message: 'User not found' };
    }

    if (targetUser.role === 'Admin') {
      throw { statusCode: 403, message: 'Forbidden: System Admin role cannot be altered' };
    }

    const isSelf = creatorUser.id === targetUserId || 
                   creatorUser._id?.toString() === targetUserId || 
                   creatorUser.email?.toLowerCase().trim() === targetUser.email?.toLowerCase().trim();
    if (isSelf) {
      throw { statusCode: 403, message: 'Forbidden: You cannot change your own role' };
    }

    if (targetUser.employeeType === 'Contract') {
      throw {
        statusCode: 403,
        message: 'Forbidden: Role cannot be modified for contract-based employees'
      };
    }

    const updatedUser = await authRepository.updateRole(targetUserId, newRole);
    return updatedUser;
  }

  async updateUser(creatorUser, targetUserId, payload) {
    const targetUser = await authRepository.findById(targetUserId);
    if (!targetUser) {
      throw { statusCode: 404, message: 'User not found' };
    }

    if (targetUser.role === 'Admin') {
      throw { statusCode: 403, message: 'Forbidden: System Admin account cannot be modified or updated' };
    }

    const isSelf = creatorUser.id === targetUserId || 
                   creatorUser._id?.toString() === targetUserId || 
                   creatorUser.email?.toLowerCase().trim() === targetUser.email?.toLowerCase().trim();
    if (isSelf) {
      throw { statusCode: 403, message: 'Forbidden: You cannot modify your own administrative account via employee management' };
    }

    const updateData = {};
    if (payload.name && payload.name.trim()) updateData.name = payload.name.trim();
    if (payload.email && payload.email.trim()) updateData.email = payload.email.toLowerCase().trim();
    if (payload.department) updateData.department = payload.department;
    if (payload.jobPosition) updateData.jobPosition = payload.jobPosition;
    if (payload.salary !== undefined && payload.salary !== null && payload.salary !== '') {
      updateData.salary = Number(payload.salary);
    }
    if (payload.photo !== undefined) updateData.photo = payload.photo;

    // Handle Employee Type & Contract Dates
    const empType = payload.employeeType || targetUser.employeeType || 'Permanent';
    updateData.employeeType = empType;

    if (empType === 'Contract') {
      const start = payload.contractStartDate || targetUser.contractStartDate || new Date().toISOString().split('T')[0];
      const end = payload.contractEndDate !== undefined ? payload.contractEndDate : targetUser.contractEndDate;
      updateData.contractStartDate = start;
      updateData.contractEndDate = end || '';
      updateData.contractDuration = (start && end) ? `${start} to ${end}` : 'Active Contract';
    } else {
      updateData.contractStartDate = '';
      updateData.contractEndDate = '';
      updateData.contractDuration = '';
    }

    // Handle Password Update if provided
    if (payload.password && payload.password.trim()) {
      updateData.password = await bcrypt.hash(payload.password.trim(), 10);
    }

    // Role Change Authorization
    if (payload.role && payload.role !== targetUser.role) {
      if (targetUser.role === 'Admin') {
        throw { statusCode: 403, message: 'Forbidden: System Admin role cannot be altered' };
      }
      if (empType === 'Contract' || targetUser.employeeType === 'Contract') {
        throw {
          statusCode: 403,
          message: 'Forbidden: Role cannot be modified for contract-based employees'
        };
      }
      if (!canCreateRole(creatorUser.role, payload.role)) {
        throw {
          statusCode: 403,
          message: `Forbidden: Your role (${creatorUser.role}) does not have permission to assign role '${payload.role}'`
        };
      }
      updateData.role = payload.role;
    }

    const updatedUser = await authRepository.updateUser(targetUserId, updateData);

    // Sync active contract record if one exists
    try {
      if (getIsConnected()) {
        const Contract = require('../contracts/contract.model');
        const userEmail = (updateData.email || targetUser.email).toLowerCase();
        await Contract.updateMany(
          { employeeEmail: userEmail, status: 'RUNNING' },
          {
            $set: {
              employeeName: updateData.name || targetUser.name,
              department: updateData.department || targetUser.department,
              jobPosition: updateData.jobPosition || targetUser.jobPosition,
              wage: updateData.salary !== undefined ? updateData.salary : targetUser.salary,
              employeeType: empType,
              startDate: updateData.contractStartDate || targetUser.contractStartDate || undefined,
              endDate: updateData.contractEndDate || undefined
            }
          }
        );
      }
    } catch (syncErr) {
      console.warn('[AuthService] Notice: Could not sync contract record on user update:', syncErr.message);
    }

    return updatedUser;
  }
}

module.exports = new AuthService();

