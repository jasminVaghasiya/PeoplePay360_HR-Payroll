const { User } = require('../auth/auth.model');
const authRepository = require('../auth/auth.repository');

const getEmployees = async (req, res) => {
  try {
    const { department, search, employeeType } = req.query;
    
    // Fetch dynamic users from repository/database
    let usersList = await authRepository.findAll({ search, department, employeeType });

    // Restrict standard Employee role from seeing other users if needed
    const isHrOrAdmin = ['Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager'].includes(req.user?.role);
    if (!isHrOrAdmin && req.user?.role === 'Employee') {
      usersList = usersList.filter(
        (u) => u.email.toLowerCase() === req.user.email.toLowerCase()
      );
    }

    if (department) {
      usersList = usersList.filter((u) => u.department === department);
    }

    const resolveEmployeeType = (u) => {
      const isContract = (u.employeeType || '').toLowerCase() === 'contract' &&
        Boolean(u.contractStartDate || u.contractEndDate || u.contractDuration);
      return isContract ? 'Contract' : 'Permanent';
    };

    if (employeeType) {
      usersList = usersList.filter((u) => resolveEmployeeType(u) === employeeType);
    }

    // Map dynamic user records to Employee hub data
    const employees = usersList.map((u) => {
      const uId = (u._id || u.id || '').toString();
      const empType = resolveEmployeeType(u);
      return {
        id: uId,
        _id: uId,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department || 'General',
        jobPosition: u.jobPosition || 'Employee',
        salary: u.salary || 50000,
        employeeType: empType,
        contractStartDate: u.contractStartDate || '',
        contractEndDate: u.contractEndDate || '',
        contractDuration: u.contractDuration || (u.contractStartDate && u.contractEndDate ? `${u.contractStartDate} to ${u.contractEndDate}` : ''),
        manager: u.createdByName || 'HR Operations',
        workingSchedule: 'Standard 40h/week (Mon-Fri 09:00 - 18:00)',
        activeContract: `${(u.department || 'GEN').toUpperCase().slice(0, 3)}-2026-ACTIVE`,
        status: u.status || 'ACTIVE',
        photo: u.photo || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80`,
        attendanceHealth: u.status === 'ACTIVE' || !u.status ? '100% (Active)' : 'Inactive',
        leaveBalanceDays: 20
      };
    });

    return res.status(200).json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch employees', error: error.message });
  }
};

module.exports = { getEmployees };
