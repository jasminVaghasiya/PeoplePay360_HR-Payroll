const { ROLE } = require("../models/types");
const Policy = require("./policy");

class HRPayrollPolicy extends Policy {
  allow() {
    return { state: true };
  }

  deny(reason) {
    return { state: false, reason };
  }

  // -------------------------------------------------------------
  // 1) Employee Role Policy Methods
  // -------------------------------------------------------------
  canViewOwnEmployeeDetails(user, targetEmployee) {
    if (this.isAdmin(user) || this.isHRManager(user)) return this.allow();
    if (this.isOwner(user, targetEmployee)) return this.allow();
    return this.deny("Employees can only view their own employee details");
  }
  canviewownemployeedetails(user, targetEmployee) { return this.canViewOwnEmployeeDetails(user, targetEmployee); }

  canCreateAttendance(user) {
    if (user?.role) return this.allow();
    return this.deny("Authentication required to check in/out");
  }
  cancreateattendance(user) { return this.canCreateAttendance(user); }

  canCreateTimeOffRequest(user) {
    if (user?.role) return this.allow();
    return this.deny("Authentication required to submit time off request");
  }
  cancreatetimeoffrequest(user) { return this.canCreateTimeOffRequest(user); }

  // -------------------------------------------------------------
  // 2) HR Manager Role Policy Methods (Full HR CRUD, No Payroll)
  // -------------------------------------------------------------
  canManageEmployees(user) {
    if (this.isAdmin(user) || this.isHRManager(user)) return this.allow();
    return this.deny("HR Manager or Admin privileges required for Employee management");
  }
  canmanageemployees(user) { return this.canManageEmployees(user); }

  canManageAttendance(user) {
    if (this.isAdmin(user) || this.isHRManager(user)) return this.allow();
    return this.deny("HR Manager or Admin privileges required for Attendance management");
  }
  canmanageattendance(user) { return this.canManageAttendance(user); }

  canManageContracts(user) {
    if (this.isAdmin(user) || this.isHRManager(user)) return this.allow();
    return this.deny("HR Manager or Admin privileges required for Contract management");
  }
  canmanagecontracts(user) { return this.canManageContracts(user); }

  canManageSchedules(user) {
    if (this.isAdmin(user) || this.isHRManager(user)) return this.allow();
    return this.deny("HR Manager or Admin privileges required for Working Schedule setup");
  }
  canmanageschedules(user) { return this.canManageSchedules(user); }

  canManageTimeOff(user) {
    if (this.isAdmin(user) || this.isHRManager(user)) return this.allow();
    return this.deny("HR Manager or Admin privileges required for Time Off module");
  }
  canmanagetimeoff(user) { return this.canManageTimeOff(user); }

  canApproveTimeOff(user) {
    if (this.isAdmin(user) || this.isHRManager(user)) return this.allow();
    return this.deny("Only HR Managers, HR Payroll Managers, and Admins can approve or refuse Time Off Requests");
  }
  canapprovetimeoff(user) { return this.canApproveTimeOff(user); }

  // -------------------------------------------------------------
  // 3) HR Payroll User Role Policy Methods
  // -------------------------------------------------------------
  canManagePayruns(user, action = "read") {
    if (this.isAdmin(user) || user?.role === ROLE.HR_PAYROLL_MANAGER) {
      return this.allow();
    }
    if (user?.role === ROLE.HR_PAYROLL_USER) {
      if (["create", "read", "update"].includes(action.toLowerCase())) {
        return this.allow();
      }
      return this.deny("HR Payroll User cannot delete Payruns or Payslips");
    }
    if (user?.role === ROLE.HR_MANAGER) {
      return this.deny("HR Manager has no access to payroll features");
    }
    return this.deny("Payroll access denied for this role");
  }
  canmanagepayruns(user, action) { return this.canManagePayruns(user, action); }

  canManageSalaryStructures(user, action = "read") {
    if (this.isAdmin(user) || user?.role === ROLE.HR_PAYROLL_MANAGER) {
      return this.allow();
    }
    if (user?.role === ROLE.HR_PAYROLL_USER) {
      if (action.toLowerCase() === "read") {
        return this.allow();
      }
      return this.deny("HR Payroll User has read-only access to Salary Structures and Salary Rules");
    }
    return this.deny("Salary Structure configuration restricted");
  }
  canmanagesalarystructures(user, action) { return this.canManageSalaryStructures(user, action); }

  // -------------------------------------------------------------
  // 4) HR Payroll Manager & 5) Admin System Administration
  // -------------------------------------------------------------
  canManageSystemUsers(user) {
    if (this.isAdmin(user)) return this.allow();
    if (user?.role === ROLE.HR_PAYROLL_MANAGER || user?.role === ROLE.HR_MANAGER) return this.allow();
    return this.deny("System user management is restricted to Admin & HR management authorities");
  }
  canmanagesystemusers(user) { return this.canManageSystemUsers(user); }
}

module.exports = HRPayrollPolicy;
