const { User } = require('../auth/auth.model');
const authRepository = require('../auth/auth.repository');

const getEmployees = async (req, res) => {
  try {
    const { department, search, employeeType } = req.query;
    
    // Fetch dynamic users from repository/database
    let usersList = await authRepository.findAll({ search, department, employeeType });

    // Restrict Employee role to only view their own profile unless HR/Admin
    if (req.user.role === 'Employee') {
      usersList = usersList.filter(
        (u) => u.email.toLowerCase() === req.user.email.toLowerCase()
      );
    }

    if (department) {
      usersList = usersList.filter((u) => u.department === department);
    }

    if (employeeType) {
      usersList = usersList.filter((u) => u.employeeType === employeeType);
    }

    // Map dynamic user records to Employee hub data
    const employees = usersList.map((u) => ({
      id: u._id || u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department || 'General',
      jobPosition: u.jobPosition || 'Employee',
      employeeType: u.employeeType || 'Permanent',
      contractStartDate: u.contractStartDate || '',
      contractEndDate: u.contractEndDate || '',
      contractDuration: u.contractDuration || (u.contractStartDate && u.contractEndDate ? `${u.contractStartDate} to ${u.contractEndDate}` : ''),
      manager: u.createdByName || 'HR Operations',
      workingSchedule: 'Standard 40h/week (Mon-Fri 09:00 - 18:00)',
      activeContract: `${(u.department || 'GEN').toUpperCase().slice(0, 3)}-2026-ACTIVE`,
      status: u.status,
      photo: u.photo || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80`,
      attendanceHealth: u.status === 'ACTIVE' ? '100% (Active)' : 'Inactive',
      leaveBalanceDays: 20
    }));

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
