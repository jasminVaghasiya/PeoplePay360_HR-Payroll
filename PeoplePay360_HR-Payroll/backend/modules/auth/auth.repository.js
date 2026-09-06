const { User, RefreshToken, AccessToken } = require('./auth.model');
const { getIsConnected } = require('../../config/db');
const mongoose = require('mongoose');

// In-Memory Backup Store for runtime cache / offline fallback
let memoryUsers = [];
let memoryRefreshTokens = [];
let memoryAccessTokens = [];

class AuthRepository {
  async findByEmail(email) {
    const cleanEmail = email.toLowerCase().trim();
    if (getIsConnected()) {
      const user = await User.findOne({ email: cleanEmail }).select('+password');
      if (user) return user;
    }
    return memoryUsers.find((u) => u.email === cleanEmail) || null;
  }

  async findById(id) {
    if (getIsConnected()) {
      try {
        let user = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          user = await User.findById(id).select('-password');
        }
        if (!user) {
          user = await User.findOne({ $or: [{ _id: id }, { id: id }, { email: String(id).toLowerCase() }] }).select('-password');
        }
        if (user) return user;
      } catch (e) {
        // Safe fallback to memory store
      }
    }
    return memoryUsers.find((u) => u._id === id || u.id === id || (u.email && u.email.toLowerCase() === String(id).toLowerCase())) || null;
  }

  async findAll({ search, role, status, employeeType }) {
    let list = [];

    if (getIsConnected()) {
      // 1. Auto-heal any misclassified employee records in MongoDB
      try {
        await User.updateMany(
          {
            role: { $in: ['Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'] },
            employeeType: { $ne: 'Permanent' }
          },
          { $set: { employeeType: 'Permanent', contractStartDate: '', contractEndDate: '', contractDuration: '' } }
        );
        const permanentCorporateEmails = [
          'rohit.verma@peoplepay360.com',
          'vikram.singh@peoplepay360.com',
          'rajesh.nair@peoplepay360.com',
          'sneha.reddy@peoplepay360.com',
          'alok.joshi@peoplepay360.com'
        ];
        await User.updateMany(
          { email: { $in: permanentCorporateEmails } },
          { $set: { employeeType: 'Permanent', contractStartDate: '', contractEndDate: '', contractDuration: '' } }
        );
      } catch (e) {
        // silent safe fallback
      }

      let query = {};
      if (role && role.trim()) query.role = role.trim();
      if (status && status.trim()) query.status = status.trim();

      if (search && search.trim()) {
        const s = search.trim();
        query.$or = [
          { name: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
          { department: { $regex: s, $options: 'i' } }
        ];
      }

      const rawUsers = await User.find(query).select('-password').sort({ createdAt: -1 });
      list = rawUsers.map((u) => (u.toObject ? u.toObject() : u));
    } else {
      // Memory Store query
      list = [...memoryUsers];
      if (role && role.trim()) list = list.filter((u) => u.role === role.trim());
      if (status && status.trim()) list = list.filter((u) => u.status === status.trim());
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.department && u.department.toLowerCase().includes(q))
        );
      }
    }

    // Resolve employeeType accurately across both DB and in-memory stores
    const resolvedUsers = list.map((u) => {
      const isContract = (u.employeeType || '').toLowerCase() === 'contract' &&
        Boolean(u.contractStartDate || u.contractEndDate || u.contractDuration);
      return {
        id: u._id || u.id,
        _id: u._id || u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        jobPosition: u.jobPosition,
        salary: u.salary || 50000,
        employeeType: isContract ? 'Contract' : 'Permanent',
        contractStartDate: isContract ? (u.contractStartDate || '') : '',
        contractEndDate: isContract ? (u.contractEndDate || '') : '',
        contractDuration: isContract ? (u.contractDuration || '') : '',
        status: u.status,
        photo: u.photo || '',
        createdByName: u.createdByName,
        createdAt: u.createdAt
      };
    });

    if (employeeType && employeeType.trim()) {
      const cleanFilter = employeeType.trim().toLowerCase();
      return resolvedUsers.filter((u) => (u.employeeType || 'Permanent').toLowerCase() === cleanFilter);
    }

    return resolvedUsers;
  }

  async create(userData) {
    let newUser = null;

    if (getIsConnected()) {
      const createdDbUser = await User.create(userData);
      newUser = {
        id: createdDbUser._id,
        _id: createdDbUser._id,
        name: createdDbUser.name,
        email: createdDbUser.email,
        role: createdDbUser.role,
        department: createdDbUser.department,
        jobPosition: createdDbUser.jobPosition,
        salary: createdDbUser.salary !== undefined ? createdDbUser.salary : (userData.salary || 50000),
        employeeType: createdDbUser.employeeType,
        contractStartDate: createdDbUser.contractStartDate,
        contractEndDate: createdDbUser.contractEndDate,
        contractDuration: createdDbUser.contractDuration,
        status: createdDbUser.status,
        photo: createdDbUser.photo,
        createdByName: createdDbUser.createdByName,
        createdAt: createdDbUser.createdAt
      };
    }

    // Keep memory store synced
    const memUser = {
      _id: userData._id || `user_mem_${Date.now()}`,
      id: userData.id || `user_mem_${Date.now()}`,
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: userData.role,
      department: userData.department || 'General',
      jobPosition: userData.jobPosition || 'Employee',
      salary: userData.salary !== undefined ? userData.salary : 50000,
      employeeType: userData.employeeType || 'Permanent',
      contractStartDate: userData.contractStartDate || '',
      contractEndDate: userData.contractEndDate || '',
      contractDuration: userData.contractDuration || '',
      status: userData.status || 'ACTIVE',
      photo: userData.photo || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80`,
      createdByName: userData.createdByName || 'System',
      createdAt: new Date().toISOString()
    };
    memoryUsers.unshift(memUser);

    return newUser || memUser;
  }

  async updateStatus(id) {
    let updatedUser = null;
    if (getIsConnected()) {
      const u = await User.findById(id);
      if (u) {
        u.status = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await u.save();
        updatedUser = u;
      }
    }

    const memUser = memoryUsers.find((u) => u._id === id || u.id === id);
    if (memUser) {
      memUser.status = memUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      if (!updatedUser) updatedUser = memUser;
    }

    return updatedUser;
  }

  async updateRole(id, newRole) {
    let updatedUser = null;
    if (getIsConnected()) {
      const u = await User.findById(id);
      if (u) {
        u.role = newRole;
        await u.save();
        updatedUser = u;
      }
    }

    const memUser = memoryUsers.find((u) => u._id === id || u.id === id);
    if (memUser) {
      memUser.role = newRole;
      if (!updatedUser) updatedUser = memUser;
    }

    return updatedUser;
  }

  async updateUser(id, updateData) {
    let updatedUser = null;
    if (getIsConnected()) {
      updatedUser = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select('-password');
    }

    const memUser = memoryUsers.find((u) => u._id === id || u.id === id);
    if (memUser) {
      Object.assign(memUser, updateData);
      if (!updatedUser) updatedUser = memUser;
    }

    return updatedUser;
  }

  async deleteById(id) {
    let deletedUser = null;
    if (getIsConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          deletedUser = await User.findByIdAndDelete(id).select('-password');
        }
        if (!deletedUser) {
          deletedUser = await User.findOneAndDelete({ $or: [{ _id: id }, { id: id }, { email: String(id).toLowerCase() }] }).select('-password');
        }
      } catch (e) {
        // Safe fallback
      }
    }
    const idx = memoryUsers.findIndex((u) => u._id === id || u.id === id || (u.email && u.email.toLowerCase() === String(id).toLowerCase()));
    if (idx !== -1) {
      const removed = memoryUsers.splice(idx, 1)[0];
      if (!deletedUser) deletedUser = removed;
    }
    return deletedUser;
  }

  // --- REFRESH TOKEN OPERATIONS (RESILIENT DUAL STORE) ---
  async saveRefreshToken(tokenData) {
    if (getIsConnected()) {
      try {
        const uId = tokenData.userId;
        const validId = mongoose.Types.ObjectId.isValid(uId) ? new mongoose.Types.ObjectId(uId) : undefined;
        return await RefreshToken.create({
          ...tokenData,
          userId: validId || new mongoose.Types.ObjectId()
        });
      } catch (e) {
        // Fallback to memory store below
      }
    }
    const memToken = { ...tokenData, createdAt: new Date(), revoked: false };
    memoryRefreshTokens.push(memToken);
    return memToken;
  }

  async findRefreshToken(token) {
    if (getIsConnected()) {
      try {
        const found = await RefreshToken.findOne({ token });
        if (found) return found;
      } catch (e) {
        // Fallback to memory
      }
    }
    return memoryRefreshTokens.find((t) => t.token === token) || null;
  }

  async revokeRefreshToken(token, replacedByToken = null) {
    const rotatedAt = new Date();
    if (getIsConnected()) {
      try {
        await RefreshToken.updateOne({ token }, { revoked: true, replacedByToken, rotatedAt });
      } catch (e) {
        // Fallback
      }
    }
    const mem = memoryRefreshTokens.find((t) => t.token === token);
    if (mem) {
      mem.revoked = true;
      mem.replacedByToken = replacedByToken;
      mem.rotatedAt = rotatedAt;
    }
    return true;
  }

  async revokeAllUserRefreshTokens(userId) {
    if (getIsConnected()) {
      try {
        await RefreshToken.updateMany({ userId }, { revoked: true });
      } catch (e) {
        // Fallback
      }
    }
    memoryRefreshTokens.forEach((t) => {
      if (String(t.userId) === String(userId)) {
        t.revoked = true;
      }
    });
    return true;
  }

  // --- ACCESS TOKEN OPERATIONS (RESILIENT DUAL STORE) ---
  async saveAccessToken(tokenData) {
    if (getIsConnected()) {
      try {
        const uId = tokenData.userId;
        const validId = mongoose.Types.ObjectId.isValid(uId) ? new mongoose.Types.ObjectId(uId) : undefined;
        return await AccessToken.create({
          ...tokenData,
          userId: validId || new mongoose.Types.ObjectId()
        });
      } catch (e) {
        // Fallback
      }
    }
    const memToken = { ...tokenData, createdAt: new Date(), revoked: false };
    memoryAccessTokens.push(memToken);
    return memToken;
  }

  async findAccessToken(token) {
    if (getIsConnected()) {
      try {
        const found = await AccessToken.findOne({ token });
        if (found) return found;
      } catch (e) {
        // Fallback
      }
    }
    return memoryAccessTokens.find((t) => t.token === token) || null;
  }

  async revokeAccessToken(token) {
    if (getIsConnected()) {
      try {
        await AccessToken.updateOne({ token }, { revoked: true });
      } catch (e) {
        // Fallback
      }
    }
    const mem = memoryAccessTokens.find((t) => t.token === token);
    if (mem) mem.revoked = true;
    return true;
  }

  async revokeAllUserAccessTokens(userId) {
    if (getIsConnected()) {
      try {
        await AccessToken.updateMany({ userId }, { revoked: true });
      } catch (e) {
        // Fallback
      }
    }
    memoryAccessTokens.forEach((t) => {
      if (String(t.userId) === String(userId)) {
        t.revoked = true;
      }
    });
    return true;
  }
}

module.exports = new AuthRepository();

