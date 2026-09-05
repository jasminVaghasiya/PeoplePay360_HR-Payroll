const { User, RefreshToken } = require('./auth.model');
const { getIsConnected } = require('../../config/db');

const bcrypt = require('bcryptjs');

// In-Memory Backup Store for offline fallback
let memoryUsers = [
  {
    _id: 'user_admin_001',
    id: 'user_admin_001',
    name: 'jemin vaghasiya',
    email: 'jaiminvaghasiya9023@gmail.com',
    password: bcrypt.hashSync('admin123', 10),
    role: 'Admin',
    department: 'Executive Management',
    jobPosition: 'Chief System Administrator',
    status: 'ACTIVE',
    photo: '',
    createdByName: 'System Bootstrapper',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'user_emp_001',
    id: 'user_emp_001',
    name: 'Sarah Jenkins',
    email: 'employee@peoplepay360.com',
    password: bcrypt.hashSync('emp123', 10),
    role: 'Employee',
    department: 'Engineering',
    jobPosition: 'Senior Full Stack Engineer',
    status: 'ACTIVE',
    photo: '',
    createdByName: 'HR Operations',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'user_emp_002',
    id: 'user_emp_002',
    name: 'Alex Morgan',
    email: 'alex@peoplepay360.com',
    password: bcrypt.hashSync('emp123', 10),
    role: 'Employee',
    department: 'Marketing',
    jobPosition: 'Product Marketing Lead',
    status: 'ACTIVE',
    photo: '',
    createdByName: 'HR Operations',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'user_emp_003',
    id: 'user_emp_003',
    name: 'Elena Rostova',
    email: 'hrmanager@peoplepay360.com',
    password: bcrypt.hashSync('hr123', 10),
    role: 'HR Manager',
    department: 'Human Resources',
    jobPosition: 'Principal HR Business Partner',
    status: 'ACTIVE',
    photo: '',
    createdByName: 'Admin',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'user_emp_004',
    id: 'user_emp_004',
    name: 'David Chen',
    email: 'payroll@peoplepay360.com',
    password: bcrypt.hashSync('payroll123', 10),
    role: 'HR Payroll Manager',
    department: 'Finance & Payroll',
    jobPosition: 'Payroll Operations Director',
    status: 'ACTIVE',
    photo: '',
    createdByName: 'Admin',
    createdAt: new Date().toISOString()
  }
];
let memoryRefreshTokens = [];

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
      const user = await User.findById(id).select('-password');
      if (user) return user;
    }
    return memoryUsers.find((u) => u._id === id || u.id === id) || null;
  }

  async findAll({ search, role, status, employeeType }) {
    if (getIsConnected()) {
      let query = {};
      if (role) query.role = role;
      if (status) query.status = status;
      if (employeeType) query.employeeType = employeeType;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } }
        ];
      }
      return await User.find(query).select('-password').sort({ createdAt: -1 });
    }

    // Memory Store query
    let list = memoryUsers.map((u) => ({
      id: u._id || u.id,
      _id: u._id || u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      jobPosition: u.jobPosition,
      employeeType: u.employeeType || 'Permanent',
      contractStartDate: u.contractStartDate || '',
      contractEndDate: u.contractEndDate || '',
      contractDuration: u.contractDuration || (u.contractStartDate && u.contractEndDate ? `${u.contractStartDate} to ${u.contractEndDate}` : ''),
      status: u.status,
      createdByName: u.createdByName,
      createdAt: u.createdAt
    }));

    if (role) list = list.filter((u) => u.role === role);
    if (status) list = list.filter((u) => u.status === status);
    if (employeeType) list = list.filter((u) => u.employeeType === employeeType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q)
      );
    }
    return list;
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

  // --- REFRESH TOKEN OPERATIONS ---
  async saveRefreshToken(tokenData) {
    if (getIsConnected()) {
      await RefreshToken.create(tokenData);
    }
    memoryRefreshTokens.push(tokenData);
  }

  async findRefreshToken(token) {
    if (getIsConnected()) {
      const dbToken = await RefreshToken.findOne({ token });
      if (dbToken) return dbToken;
    }
    return memoryRefreshTokens.find((t) => t.token === token) || null;
  }

  async revokeRefreshToken(token, replacedByToken = null) {
    if (getIsConnected()) {
      await RefreshToken.updateOne({ token }, { revoked: true, replacedByToken });
    }
    const mem = memoryRefreshTokens.find((t) => t.token === token);
    if (mem) {
      mem.revoked = true;
      mem.replacedByToken = replacedByToken;
    }
  }

  async revokeAllUserRefreshTokens(userId) {
    if (getIsConnected()) {
      await RefreshToken.updateMany({ userId }, { revoked: true });
    }
    memoryRefreshTokens.forEach((t) => {
      if (t.userId.toString() === userId.toString()) {
        t.revoked = true;
      }
    });
  }
}

module.exports = new AuthRepository();

