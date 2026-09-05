import React from 'react';
import { UserProfileDetailModal } from '../auth/UserProfileDetailModal';

export const EmployeeContractDetailsModal = ({ isOpen, onClose, contractData, onRenewPlan, onEditContract }) => {
  if (!isOpen || !contractData) return null;

  // Normalize contract object into full user format for identical interface
  const normalizedUser = {
    ...contractData,
    id: contractData.id || contractData._id || contractData.employeeId,
    name: contractData.employeeName || contractData.name || 'Contract Employee',
    email: contractData.employeeEmail || contractData.email || 'contractor@company.com',
    role: contractData.role || 'Employee',
    employeeType: 'Contract',
    department: contractData.department || 'Engineering',
    jobPosition: contractData.jobPosition || 'Contractor',
    status: contractData.status === 'RUNNING' ? 'ACTIVE' : (contractData.status || 'ACTIVE'),
    contractStartDate: contractData.startDate || contractData.contractStartDate || '2026-01-01',
    contractEndDate: contractData.endDate || contractData.contractEndDate || '2026-12-31',
    contractDuration: contractData.contractDuration || '12 Months',
    contractRef: contractData.contractRef || 'CNT-2026-001',
    wage: contractData.wage || 75000,
    createdByName: contractData.createdByName || 'HR Administrator'
  };

  return (
    <UserProfileDetailModal
      isOpen={isOpen}
      onClose={onClose}
      user={normalizedUser}
    />
  );
};
