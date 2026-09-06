const mongoose = require('mongoose');
const { Contract } = require('./contract.model');
const { getIsConnected } = require('../../config/db');

// In-Memory Backup Store with Initial Seed Contracts
let memoryContracts = [
  {
    _id: 'cnt_001',
    id: 'cnt_001',
    contractRef: 'CNT-2026-001',
    employeeId: 'user_admin_001',
    employeeName: 'jemin vaghasiya',
    employeeType: 'Permanent',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    department: 'Executive Management',
    jobPosition: 'Chief System Administrator',
    wage: 8500,
    salaryStructure: 'Executive Salary Structure',
    status: 'RUNNING',
    notes: 'Primary executive employment agreement with full benefits.',
    createdByName: 'System Admin',
    createdAt: new Date().toISOString()
  }
];

class ContractRepository {
  async findAll({ search, status, employeeId, department, employeeType }) {
    if (getIsConnected()) {
      let query = {};
      if (status) query.status = status;
      if (employeeId) query.employeeId = employeeId;
      if (department) {
        query.department = { $regex: new RegExp(`^${department.trim()}$`, 'i') };
      }
      if (employeeType) query.employeeType = employeeType;
      if (search) {
        query.$or = [
          { contractRef: { $regex: search, $options: 'i' } },
          { employeeName: { $regex: search, $options: 'i' } },
          { jobPosition: { $regex: search, $options: 'i' } }
        ];
      }
      return await Contract.find(query).sort({ createdAt: -1 });
    }

    // Memory Store Query
    let list = [...memoryContracts];
    if (status) list = list.filter((c) => c.status === status);
    if (employeeId) list = list.filter((c) => String(c.employeeId) === String(employeeId));
    if (department) {
      const d = department.trim().toLowerCase();
      list = list.filter((c) => (c.department || '').trim().toLowerCase() === d);
    }
    if (employeeType) list = list.filter((c) => (c.employeeType || 'Permanent') === employeeType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.contractRef.toLowerCase().includes(q) ||
          c.employeeName.toLowerCase().includes(q) ||
          c.jobPosition.toLowerCase().includes(q)
      );
    }
    return list;
  }

  async findById(id) {
    if (getIsConnected()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const c = await Contract.findById(id);
        if (c) return c;
      } else {
        const c = await Contract.findOne({ $or: [{ _id: id }, { id }] });
        if (c) return c;
      }
    }
    return memoryContracts.find((c) => c._id === id || c.id === id) || null;
  }

  async findActiveContractByEmployeeId(employeeId) {
    if (getIsConnected()) {
      const c = await Contract.findOne({
        employeeId,
        status: { $in: ['RUNNING', 'Running', 'Active', 'ACTIVE'] }
      }).sort({ createdAt: -1 });
      if (c) return c;
    }
    return memoryContracts.find((c) => String(c.employeeId) === String(employeeId) && ['RUNNING', 'Running', 'Active', 'ACTIVE'].includes(c.status)) || null;
  }

  async setOtherContractsExpired(employeeId, activeContractId, employeeName, employeeEmail) {
    const activeStatuses = ['RUNNING', 'Running', 'Active', 'ACTIVE'];
    if (getIsConnected()) {
      const orConditions = [];
      if (employeeId) orConditions.push({ employeeId });
      if (employeeEmail) orConditions.push({ employeeEmail: employeeEmail.trim() });
      if (employeeName) orConditions.push({ employeeName: employeeName.trim() });

      if (orConditions.length > 0) {
        await Contract.updateMany(
          { _id: { $ne: activeContractId }, status: { $in: activeStatuses }, $or: orConditions },
          { $set: { status: 'EXPIRED' } }
        );
      }
    }

    // Memory Store Sync
    memoryContracts.forEach((c) => {
      const isSameEmp = (employeeEmail && c.employeeEmail?.toLowerCase() === employeeEmail.toLowerCase()) ||
                        (employeeName && c.employeeName?.toLowerCase() === employeeName.toLowerCase()) ||
                        (employeeId && String(c.employeeId) === String(employeeId));
      if (isSameEmp && c._id !== activeContractId && c.id !== activeContractId && activeStatuses.includes(c.status)) {
        c.status = 'EXPIRED';
      }
    });
  }

  async create(data) {
    let newContract = null;

    if (getIsConnected()) {
      const dbDoc = await Contract.create(data);
      newContract = dbDoc;
    } else {
      newContract = {
        _id: `cnt_mem_${Date.now()}`,
        id: `cnt_mem_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString()
      };
      memoryContracts.unshift(newContract);
    }

    // Avoid concurrent active contracts: If created as active/running, expire all other contracts for this employee
    const activeStatuses = ['RUNNING', 'Running', 'Active', 'ACTIVE'];
    if (activeStatuses.includes(data.status)) {
      await this.setOtherContractsExpired(data.employeeId, newContract._id || newContract.id, data.employeeName, data.employeeEmail);
    }

    return newContract;
  }

  async update(id, updateData) {
    let updated = null;

    if (getIsConnected()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        updated = await Contract.findByIdAndUpdate(id, updateData, { new: true });
      } else {
        updated = await Contract.findOneAndUpdate({ $or: [{ _id: id }, { id }] }, updateData, { new: true });
      }
    }

    const index = memoryContracts.findIndex((c) => c._id === id || c.id === id);
    if (index !== -1) {
      memoryContracts[index] = { ...memoryContracts[index], ...updateData };
      if (!updated) updated = memoryContracts[index];
    }

    const activeStatuses = ['RUNNING', 'Running', 'Active', 'ACTIVE'];
    if (activeStatuses.includes(updateData.status) && updated) {
      await this.setOtherContractsExpired(updated.employeeId, id, updated.employeeName, updated.employeeEmail);
    }

    return updated;
  }

  async updateStatus(id, newStatus) {
    return await this.update(id, { status: newStatus });
  }

  async delete(id) {
    if (getIsConnected()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        await Contract.findByIdAndDelete(id);
      } else {
        await Contract.findOneAndDelete({ $or: [{ _id: id }, { id }] });
      }
    }
    memoryContracts = memoryContracts.filter((c) => c._id !== id && c.id !== id);
    return true;
  }
}

module.exports = new ContractRepository();
