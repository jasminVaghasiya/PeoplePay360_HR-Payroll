import os

root_dir = r"c:\Users\01\OneDrive\Desktop\prompt\PeoplePay360_HR-Payroll"

def update_file(rel_path, old_str, new_str):
    abs_path = os.path.join(root_dir, rel_path)
    with open(abs_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if old_str not in content:
        print(f"Warning: target substring not found in {rel_path}")
        return False
    content = content.replace(old_str, new_str)
    tmp_path = abs_path + ".tmp"
    with open(tmp_path, 'w', encoding='utf-8') as f:
        f.write(content)
    os.replace(tmp_path, abs_path)
    print(f"Successfully updated {rel_path}")
    return True

# 1. Update auth.repository.js
repo_path = r"backend\modules\auth\auth.repository.js"
repo_old = """  async updateStatus(id) {
    let updatedUser = null;
    if (getIsConnected()) {
      const u = await User.findById(id);
      if (u) {
        u.status = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await u.save();
        updatedUser = u;
      }
    }

    const memUser = memoryUsers.find((u) => u._id === id || u.id === id);
    if (memUser) {
      memUser.status = memUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      if (!updatedUser) updatedUser = memUser;
    }

    return updatedUser;
  }"""

repo_new = """  async updateStatus(id) {
    let updatedUser = null;
    if (getIsConnected()) {
      const u = await User.findById(id);
      if (u) {
        u.status = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await u.save();
        updatedUser = u;
      }
    }

    const memUser = memoryUsers.find((u) => u._id === id || u.id === id);
    if (memUser) {
      memUser.status = memUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      if (!updatedUser) updatedUser = memUser;
    }

    return updatedUser;
  }

  async updateRole(id, newRole) {
    let updatedUser = null;
    if (getIsConnected()) {
      const u = await User.findById(id);
      if (u) {
        u.role = newRole;
        await u.save();
        updatedUser = u;
      }
    }

    const memUser = memoryUsers.find((u) => u._id === id || u.id === id);
    if (memUser) {
      memUser.role = newRole;
      if (!updatedUser) updatedUser = memUser;
    }

    return updatedUser;
  }"""

update_file(repo_path, repo_old, repo_new)

# 2. Update auth.middleware.js
middleware_path = r"backend\modules\auth\auth.middleware.js"
middleware_old = """const canCreateRole = (creatorRole, targetRole) => {
  if (creatorRole === ROLE.ADMIN) return true;
  if (creatorRole === ROLE.HR_PAYROLL_MANAGER) {
    return [ROLE.HR_PAYROLL_USER, ROLE.HR_MANAGER, ROLE.EMPLOYEE].includes(targetRole);
  }
  if (creatorRole === ROLE.HR_MANAGER) {
    return targetRole === ROLE.EMPLOYEE;
  }
  return false;
};"""

middleware_new = """const canCreateRole = (creatorRole, targetRole) => {
  if (targetRole === 'Admin' || targetRole === ROLE.ADMIN) return false;
  if (creatorRole === ROLE.ADMIN) {
    return [ROLE.HR_PAYROLL_MANAGER, ROLE.HR_PAYROLL_USER, ROLE.HR_MANAGER, ROLE.EMPLOYEE].includes(targetRole);
  }
  if (creatorRole === ROLE.HR_PAYROLL_MANAGER) {
    return [ROLE.HR_PAYROLL_USER, ROLE.HR_MANAGER, ROLE.EMPLOYEE].includes(targetRole);
  }
  if (creatorRole === ROLE.HR_MANAGER) {
    return targetRole === ROLE.EMPLOYEE;
  }
  return false;
};"""

update_file(middleware_path, middleware_old, middleware_new)

# 3. Update auth.service.js
service_path = r"backend\modules\auth\auth.service.js"
service_old = """  async getUserById(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    return user;
  }
}"""

service_new = """  async getUserById(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    return user;
  }

  async updateUserRole(creatorUser, targetUserId, newRole) {
    if (!newRole) {
      throw { statusCode: 400, message: 'New role is required' };
    }

    if (newRole === 'Admin' || newRole === 'admin') {
      throw { statusCode: 403, message: 'Forbidden: Admin role cannot be assigned to any user' };
    }

    if (!userRoles.includes(newRole)) {
      throw { statusCode: 400, message: `Invalid role '${newRole}'` };
    }

    if (!canCreateRole(creatorUser.role, newRole)) {
      throw {
        statusCode: 403,
        message: `Forbidden: Your role (${creatorUser.role}) does not have permission to assign role '${newRole}'`
      };
    }

    const targetUser = await authRepository.findById(targetUserId);
    if (!targetUser) {
      throw { statusCode: 404, message: 'User not found' };
    }

    if (targetUser.role === 'Admin') {
      throw { statusCode: 403, message: 'Forbidden: System Admin role cannot be altered' };
    }

    const updatedUser = await authRepository.updateRole(targetUserId, newRole);
    return updatedUser;
  }
}"""

update_file(service_path, service_old, service_new)

# 4. Update auth.controller.js
controller_path = r"backend\modules\auth\auth.controller.js"
controller_old_func = """  getMe,
  getUserById
};"""

controller_new_func = """  getMe,
  getUserById,
  updateUserRole
};"""

controller_old_body = """// Get Single User Details by ID (Admin/HR or self)
const getUserById = async (req, res) => {"""

controller_new_body = """// Update User Role Controller (Admin & Higher Authority)
const updateUserRole = async (req, res) => {
  try {
    const updatedUser = await authService.updateUserRole(req.user, req.params.id, req.body.role);
    return res.status(200).json({
      success: true,
      message: `Role for '${updatedUser.name}' updated to '${updatedUser.role}' successfully`,
      user: updatedUser
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update user role'
    });
  }
};

// Get Single User Details by ID (Admin/HR or self)
const getUserById = async (req, res) => {"""

update_file(controller_path, controller_old_body, controller_new_body)
update_file(controller_path, controller_old_func, controller_new_func)

# 5. Update auth.routes.js
routes_path = r"backend\modules\auth\auth.routes.js"
routes_old_import = "const { login, refreshToken, logout, createUser, getUsers, toggleUserStatus, getMe, getUserById } = require('./auth.controller');"
routes_new_import = "const { login, refreshToken, logout, createUser, getUsers, toggleUserStatus, getMe, getUserById, updateUserRole } = require('./auth.controller');"

routes_old_route = """// Toggle User Status Active/Inactive (Admin & HR Payroll Manager)
router.patch(
  '/users/:id/status',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager'),
  toggleUserStatus
);"""

routes_new_route = """// Toggle User Status Active/Inactive (Admin & HR Payroll Manager)
router.patch(
  '/users/:id/status',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager'),
  toggleUserStatus
);

// Update User Role Endpoint (Admin, HR Payroll Manager, HR Manager)
router.patch(
  '/users/:id/role',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager', 'HR Manager'),
  updateUserRole
);"""

update_file(routes_path, routes_old_import, routes_new_import)
update_file(routes_path, routes_old_route, routes_new_route)

# 6. Update AuthContext.jsx
auth_ctx_path = r"frontend\src\context\AuthContext.jsx"
auth_ctx_old = """  // Hierarchy check if current logged-in user can create specified role
  const canCreateRole = (targetRole) => {
    if (!user) return false;
    const role = user.role;
    if (role === 'Admin') return true;
    if (role === 'HR Payroll Manager') {
      return ['HR Payroll User', 'HR Manager', 'Employee'].includes(targetRole);
    }
    if (role === 'HR Manager') {
      return targetRole === 'Employee';
    }
    return false;
  };"""

auth_ctx_new = """  // Hierarchy check if current logged-in user can create/assign specified role (NEVER Admin)
  const canCreateRole = (targetRole) => {
    if (targetRole === 'Admin') return false;
    if (!user) return false;
    const role = user.role;
    if (role === 'Admin') {
      return ['HR Payroll Manager', 'HR Payroll User', 'HR Manager', 'Employee'].includes(targetRole);
    }
    if (role === 'HR Payroll Manager') {
      return ['HR Payroll User', 'HR Manager', 'Employee'].includes(targetRole);
    }
    if (role === 'HR Manager') {
      return targetRole === 'Employee';
    }
    return false;
  };

  // Update User Role
  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await api.patch(`/auth/users/${userId}/role`, { role: newRole });
      return response.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update user role'
      };
    }
  };"""

auth_ctx_value_old = "        toggleUserStatus,\n        canCreateRole"
auth_ctx_value_new = "        toggleUserStatus,\n        canCreateRole,\n        updateUserRole"

update_file(auth_ctx_path, auth_ctx_old, auth_ctx_new)
update_file(auth_ctx_path, auth_ctx_value_old, auth_ctx_value_new)

# 7. Update CreateUserModal.jsx
create_modal_path = r"frontend\src\modules\auth\CreateUserModal.jsx"
create_modal_old = """  const ALL_ROLES = [
    { value: 'Employee', label: 'Employee (Self-Service portal)' },
    { value: 'HR Manager', label: 'HR Manager (Full HR, Attendance & Time Off CRUD)' },
    { value: 'HR Payroll User', label: 'HR Payroll User (HR + Payruns/Payslips Read-Write)' },
    { value: 'HR Payroll Manager', label: 'HR Payroll Manager (Full HR & Payroll Operations)' },
    { value: 'Admin', label: 'Admin (Full System & User Management Access)' }
  ];"""

create_modal_new = """  const ALL_ROLES = [
    { value: 'Employee', label: 'Employee (Self-Service portal)' },
    { value: 'HR Manager', label: 'HR Manager (Full HR, Attendance & Time Off CRUD)' },
    { value: 'HR Payroll User', label: 'HR Payroll User (HR + Payruns/Payslips Read-Write)' },
    { value: 'HR Payroll Manager', label: 'HR Payroll Manager (Full HR & Payroll Operations)' }
  ];"""

update_file(create_modal_path, create_modal_old, create_modal_new)

print("All Python code replacements pre-processed.")
