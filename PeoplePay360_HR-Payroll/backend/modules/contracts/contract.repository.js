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
  async findAll({ search, status, employeeId, department }) {
    if (getIsConnected()) {
      let query = {};
      if (status) query.status = status;
      if (employeeId) query.employeeId = employeeId;
      if (department) query.department = department;
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
    if (department) list = list.filter((c) => c.department === department);
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
      const c = await Contract.findById(id);
      if (c) return c;
    }
    return memoryContracts.find((c) => c._id === id || c.id === id) || null;
  }

  async findActiveContractByEmployeeId(employeeId) {
    if (getIsConnected()) {
      const c = await Contract.findOne({ employeeId, status: 'RUNNING' });
      if (c) return c;
    }
    return memoryContracts.find((c) => String(c.employeeId) === String(employeeId) && c.status === 'RUNNING') || null;
  }

  async setOtherContractsExpired(employeeId, activeContractId, employeeName, employeeEmail) {
    if (getIsConnected()) {
      const orConditions = [];
      if (employeeId) orConditions.push({ employeeId });
      if (employeeEmail) orConditions.push({ employeeEmail: employeeEmail.trim() });
      if (employeeName) orConditions.push({ employeeName: employeeName.trim() });

      if (orConditions.length > 0) {
        await Contract.updateMany(
          { _id: { $ne: activeContractId }, status: 'RUNNING', $or: orConditions },
          { $set: { status: 'EXPIRED' } }
        );
      }
    }

    // Memory Store Sync
    memoryContracts.forEach((c) => {
      const isSameEmp = (employeeEmail && c.employeeEmail?.toLowerCase() === employeeEmail.toLowerCase()) ||
                        (employeeName && c.employeeName?.toLowerCase() === employeeName.toLowerCase()) ||
                        (employeeId && String(c.employeeId) === String(employeeId));
      if (isSameEmp && c._id !== activeContractId && c.id !== activeContractId && c.status === 'RUNNING') {
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

    // Avoid concurrent active contracts: If created as RUNNING, expire all other contracts for this employee
    if (data.status === 'RUNNING') {
      await this.setOtherContractsExpired(data.employeeId, newContract._id || newContract.id, data.employeeName, data.employeeEmail);
    }

    return newContract;
  }

  async update(id, updateData) {
    let updated = null;

    if (getIsConnected()) {
      updated = await Contract.findByIdAndUpdate(id, updateData, { new: true });
    }

    const index = memoryContracts.findIndex((c) => c._id === id || c.id === id);
    if (index !== -1) {
      memoryContracts[index] = { ...memoryContracts[index], ...updateData };
      if (!updated) updated = memoryContracts[index];
    }

    if (updateData.status === 'RUNNING' && updated) {
      await this.setOtherContractsExpired(updated.employeeId, id, updated.employeeName, updated.employeeEmail);
    }

    return updated;
  }

  async updateStatus(id, newStatus) {
    return await this.update(id, { status: newStatus });
  }

  async delete(id) {
    if (getIsConnected()) {
      await Contract.findByIdAndDelete(id);
    }
    memoryContracts = memoryContracts.filter((c) => c._id !== id && c.id !== id);
    return true;
  }
}

module.exports = new ContractRepository();
