const contractService = require('./contract.service');

const getContracts = async (req, res) => {
  try {
    let contracts = await contractService.getContracts(req.query);

    // Data Isolation: Restrict Employee/Contractor role to only view their own contract records
    if (req.user && req.user.role === 'Employee') {
      const userEmail = (req.user.email || '').toLowerCase().trim();
      const userId = String(req.user.id || req.user._id || '');
      const userName = (req.user.name || '').toLowerCase().trim();

      contracts = contracts.filter(
        (c) =>
          (c.employeeEmail && c.employeeEmail.toLowerCase().trim() === userEmail) ||
          (c.employeeId && String(c.employeeId) === userId) ||
          (c.employeeName && c.employeeName.toLowerCase().trim() === userName)
      );
    }

    return res.status(200).json({
      success: true,
      count: contracts.length,
      contracts
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch contracts'
    });
  }
};

const getContractById = async (req, res) => {
  try {
    const contract = await contractService.getContractById(req.params.id);

    // Security & Data Isolation: Ensure Employee/Contractor role can only view their own contract
    if (req.user && req.user.role === 'Employee') {
      const userEmail = (req.user.email || '').toLowerCase().trim();
      const userId = String(req.user.id || req.user._id || '');
      const userName = (req.user.name || '').toLowerCase().trim();

      const isOwner =
        (contract.employeeEmail && contract.employeeEmail.toLowerCase().trim() === userEmail) ||
        (contract.employeeId && String(contract.employeeId) === userId) ||
        (contract.employeeName && contract.employeeName.toLowerCase().trim() === userName);

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are only authorized to view your own contract details.'
        });
      }
    }

    return res.status(200).json({ success: true, contract });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch contract'
    });
  }
};

const createContract = async (req, res) => {
  try {
    const newContract = await contractService.createContract(req.user, req.body);
    return res.status(201).json({
      success: true,
      message: `Contract '${newContract.contractRef}' created successfully`,
      contract: newContract
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create contract'
    });
  }
};

const updateContract = async (req, res) => {
  try {
    const updatedContract = await contractService.updateContract(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Contract updated successfully',
      contract: updatedContract
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update contract'
    });
  }
};

const updateContractStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updatedContract = await contractService.updateContractStatus(req.params.id, status);
    return res.status(200).json({
      success: true,
      message: `Contract status updated to '${status}'`,
      contract: updatedContract
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update contract status'
    });
  }
};

const deleteContract = async (req, res) => {
  try {
    await contractService.deleteContract(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Contract deleted successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete contract'
    });
  }
};

module.exports = {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  updateContractStatus,
  deleteContract
};
