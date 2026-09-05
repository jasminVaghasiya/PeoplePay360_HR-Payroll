const contractRepository = require('./contract.repository');
const authRepository = require('../auth/auth.repository');

class ContractService {
  async ensureUserAccountForContract(contractData, inputPassword) {
    if (!contractData.employeeEmail) return null;

    const cleanEmail = contractData.employeeEmail.trim().toLowerCase();
    try {
      let userAccount = await authRepository.findByEmail(cleanEmail);

      if (!userAccount) {
        const userPassword = inputPassword && inputPassword.trim() ? inputPassword.trim() : 'password123';
        userAccount = await authRepository.create({
          name: contractData.employeeName.trim(),
          email: cleanEmail,
          password: userPassword,
          role: 'Employee',
          department: contractData.department || 'Engineering',
          jobPosition: contractData.jobPosition || 'Software Engineer',
          employeeType: 'Contract',
          contractStartDate: contractData.startDate || '',
          contractEndDate: contractData.endDate || '',
          contractDuration: contractData.startDate && contractData.endDate ? `${contractData.startDate} to ${contractData.endDate}` : '',
          status: 'ACTIVE',
          createdByName: contractData.createdByName || 'HR Manager'
        });
      } else {
        if (inputPassword && inputPassword.trim()) {
          userAccount.password = inputPassword.trim();
        }
        userAccount.employeeType = 'Contract';
        userAccount.department = contractData.department || userAccount.department;
        userAccount.jobPosition = contractData.jobPosition || userAccount.jobPosition;
        userAccount.status = 'ACTIVE';
        if (typeof userAccount.save === 'function') {
          await userAccount.save();
        }
      }
      return userAccount ? (userAccount._id || userAccount.id) : null;
    } catch (err) {
      console.error('[Sync Contract User Error]', err);
      return null;
    }
  }

  async getContracts(query = {}) {
    const contracts = await contractRepository.findAll(query);
    // Ensure all contract employees have an active User account for login capability
    for (const c of contracts) {
      if (c.employeeEmail) {
        await this.ensureUserAccountForContract(c);
      }
    }
    return contracts;
  }

  async getContractById(id) {
    const contract = await contractRepository.findById(id);
    if (!contract) {
      throw { statusCode: 404, message: `Contract with ID '${id}' not found` };
    }
    return contract;
  }

  async getActiveContractForEmployee(employeeId) {
    return await contractRepository.findActiveContractByEmployeeId(employeeId);
  }

  async createContract(creatorUser, data) {
    const { isRenewal, employeeId, employeeName, employeeEmail, password, employeeType, startDate, endDate, department, jobPosition, wage, salaryStructure, status, notes } = data;

    if (!employeeName) {
      throw { statusCode: 400, message: 'Employee name is required' };
    }

    if (!startDate) {
      throw { statusCode: 400, message: 'Contract start date is required' };
    }

    if (wage === undefined || wage < 0) {
      throw { statusCode: 400, message: 'Valid monthly wage is required' };
    }

    // PREVENT DUPLICATE CONTRACT CREATION WHEN NOT A RENEWAL
    if (!isRenewal && employeeEmail && employeeEmail.trim()) {
      const cleanEmail = employeeEmail.trim().toLowerCase();

      // 1. Check if User account already exists
      const existingUser = await authRepository.findByEmail(cleanEmail);
      if (existingUser) {
        throw {
          statusCode: 409,
          message: `An employee account already exists for email '${cleanEmail}'. Duplicate contract records are prohibited. Please use 'Renew Plan' on their existing contract record.`
        };
      }

      // 2. Check if a Contract record already exists with this email
      const allContracts = await contractRepository.findAll({});
      const existingContract = allContracts.find(
        (c) => c.employeeEmail && c.employeeEmail.trim().toLowerCase() === cleanEmail
      );
      if (existingContract) {
        throw {
          statusCode: 409,
          message: `A contract record (${existingContract.contractRef}) already exists for email '${cleanEmail}'. Please use 'Renew Plan' on their existing contract record instead of creating a duplicate.`
        };
      }
    }

    // Auto-generate contractRef
    const existing = await contractRepository.findAll({});
    const refNum = String(existing.length + 1).padStart(3, '0');
    const autoRef = `CNT-2026-${refNum}`;

    const contractData = {
      contractRef: autoRef,
      employeeId: employeeId || null,
      employeeName: employeeName.trim(),
      employeeEmail: employeeEmail ? employeeEmail.trim() : '',
      employeeType: employeeType || 'Contract',
      startDate,
      endDate: endDate || '',
      department: department || 'Engineering',
      jobPosition: jobPosition || 'Software Engineer',
      wage: Number(wage) || 5000,
      salaryStructure: salaryStructure || 'Standard Structure',
      status: status || 'DRAFT',
      notes: notes || '',
      createdByName: creatorUser?.name || 'HR Manager'
    };

    // Ensure user login account exists for this contract employee
    const userId = await this.ensureUserAccountForContract(contractData, password);
    if (userId) {
      contractData.employeeId = userId;
    }

    return await contractRepository.create(contractData);
  }

  async updateContract(id, data) {
    const existing = await contractRepository.findById(id);
    if (!existing) {
      throw { statusCode: 404, message: `Contract '${id}' not found` };
    }

    return await contractRepository.update(id, data);
  }

  async updateContractStatus(id, newStatus) {
    const validStatuses = ['DRAFT', 'RUNNING', 'EXPIRED', 'CANCELLED'];
    if (!validStatuses.includes(newStatus)) {
      throw { statusCode: 400, message: `Invalid contract status '${newStatus}'. Valid statuses are: ${validStatuses.join(', ')}` };
    }

    return await contractRepository.updateStatus(id, newStatus);
  }

  async deleteContract(id) {
    return await contractRepository.delete(id);
  }
}

module.exports = new ContractService();
