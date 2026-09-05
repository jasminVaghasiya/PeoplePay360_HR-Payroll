const { ROLE } = require("../models/types");

class Policy {
  /**
   * Safely extracts string representation of an ID from string, ObjectId, or object with _id/id.
   */
  extractId(entity) {
    if (!entity) return null;
    if (typeof entity === "string") return entity.toString();
    if (entity.payload?.user) return entity.payload.user.toString();
    if (entity.user) return entity.user.toString();
    if (entity._id) return entity._id.toString();
    if (entity.id) return entity.id.toString();
    if (typeof entity.toString === "function") return entity.toString();
    return null;
  }

  isAdmin(user) {
    return user?.role === ROLE.ADMIN;
  }

  isHRPayrollManager(user) {
    return user?.role === ROLE.HR_PAYROLL_MANAGER || this.isAdmin(user);
  }

  isHRPayrollUser(user) {
    return user?.role === ROLE.HR_PAYROLL_USER || this.isHRPayrollManager(user);
  }

  isHRManager(user) {
    return user?.role === ROLE.HR_MANAGER || this.isHRPayrollManager(user);
  }

  isEmployee(user) {
    return user?.role === ROLE.EMPLOYEE;
  }

  isOwner(user, resource) {
    const userId = this.extractId(user);
    const ownerId = this.extractId(resource?.userId || resource?.employeeId || resource?.createdBy);
    if (!userId || !ownerId) return false;
    return userId === ownerId;
  }
}

module.exports = Policy;
