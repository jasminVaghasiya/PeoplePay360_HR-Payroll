const ROLE = Object.freeze({
  ADMIN: "Admin",
  HR_PAYROLL_MANAGER: "HR Payroll Manager",
  HR_PAYROLL_USER: "HR Payroll User",
  HR_MANAGER: "HR Manager",
  EMPLOYEE: "Employee"
});

const ACCESS = Object.freeze({
  PUBLIC: "public",
  PRIVATE: "private",
  PROTECTED: "protected"
});

const SUBJECTS = Object.freeze({
  USER: "user",
  EMPLOYEE: "employee",
  CONTRACT: "contract",
  SCHEDULE: "schedule",
  ATTENDANCE: "attendance",
  TIMEOFF: "timeoff",
  PAYRUN: "payrun",
  PAYSLIP: "payslip",
  SALARY_STRUCTURE: "salary_structure",
  SALARY_RULE: "salary_rule",
  DASHBOARD: "dashboard"
});

const ACTIONS = Object.freeze({
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  MANAGE: "manage",
  APPROVE: "approve",
  REFUSE: "refuse"
});

module.exports = {
  ROLE,
  ACCESS,
  SUBJECTS,
  ACTIONS
};
