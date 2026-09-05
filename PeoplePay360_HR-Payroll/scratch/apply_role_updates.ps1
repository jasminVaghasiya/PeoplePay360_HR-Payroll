$root = "c:/Users/01/OneDrive/Desktop/prompt/PeoplePay360_HR-Payroll"

function ReplaceInFile($rel, $oldStr, $newStr) {
    $file = "$root/$rel"
    $txt = [System.IO.File]::ReadAllText($file)
    if ($txt.Contains($oldStr)) {
        $txt = $txt.Replace($oldStr, $newStr)
        $tmp = "$file.tmp"
        [System.IO.File]::WriteAllText($tmp, $txt)
        Move-Item -Path $tmp -Destination $file -Force
        Write-Host "Updated $rel"
    } else {
        Write-Host "Pattern not found in $rel"
    }
}

# 1. auth.repository.js
$repoOld = "  async updateStatus(id) {
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
  }"

$repoNew = "  async updateStatus(id) {
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
  }"

ReplaceInFile "backend/modules/auth/auth.repository.js" $repoOld $repoNew

# 2. auth.middleware.js
$midOld = "const canCreateRole = (creatorRole, targetRole) => {
  if (creatorRole === ROLE.ADMIN) return true;
  if (creatorRole === ROLE.HR_PAYROLL_MANAGER) {
    return [ROLE.HR_PAYROLL_USER, ROLE.HR_MANAGER, ROLE.EMPLOYEE].includes(targetRole);
  }
  if (creatorRole === ROLE.HR_MANAGER) {
    return targetRole === ROLE.EMPLOYEE;
  }
  return false;
};"

$midNew = "const canCreateRole = (creatorRole, targetRole) => {
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
};"

ReplaceInFile "backend/modules/auth/auth.middleware.js" $midOld $midNew

# 3. auth.service.js
$srvOld = "  async getUserById(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    return user;
  }
}"

$srvNew = "  async getUserById(userId) {
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
}"

ReplaceInFile "backend/modules/auth/auth.service.js" $srvOld $srvNew

# 4. auth.controller.js
$ctlOldBody = "// Get Single User Details by ID (Admin/HR or self)
const getUserById = async (req, res) => {"

$ctlNewBody = "// Update User Role Controller (Admin & Higher Authority)
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
const getUserById = async (req, res) => {"

$ctlOldFunc = "  getMe,
  getUserById
};"

$ctlNewFunc = "  getMe,
  getUserById,
  updateUserRole
};"

ReplaceInFile "backend/modules/auth/auth.controller.js" $ctlOldBody $ctlNewBody
ReplaceInFile "backend/modules/auth/auth.controller.js" $ctlOldFunc $ctlNewFunc

# 5. auth.routes.js
$rImpOld = "const { login, refreshToken, logout, createUser, getUsers, toggleUserStatus, getMe, getUserById } = require('./auth.controller');"
$rImpNew = "const { login, refreshToken, logout, createUser, getUsers, toggleUserStatus, getMe, getUserById, updateUserRole } = require('./auth.controller');"

$rRouteOld = "// Toggle User Status Active/Inactive (Admin & HR Payroll Manager)
router.patch(
  '/users/:id/status',
  verifyToken,
  authorizeRoles('Admin', 'HR Payroll Manager'),
  toggleUserStatus
);"

$rRouteNew = "// Toggle User Status Active/Inactive (Admin & HR Payroll Manager)
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
);"

ReplaceInFile "backend/modules/auth/auth.routes.js" $rImpOld $rImpNew
ReplaceInFile "backend/modules/auth/auth.routes.js" $rRouteOld $rRouteNew

# 6. AuthContext.jsx
$ctxOld = "  // Hierarchy check if current logged-in user can create specified role
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
  };"

$ctxNew = "  // Hierarchy check if current logged-in user can create/assign specified role (NEVER Admin)
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
  };"

$ctxValOld = "        toggleUserStatus,
        canCreateRole"

$ctxValNew = "        toggleUserStatus,
        canCreateRole,
        updateUserRole"

ReplaceInFile "frontend/src/context/AuthContext.jsx" $ctxOld $ctxNew
ReplaceInFile "frontend/src/context/AuthContext.jsx" $ctxValOld $ctxValNew

# 7. CreateUserModal.jsx
$cModalOld = "  const ALL_ROLES = [
    { value: 'Employee', label: 'Employee (Self-Service portal)' },
    { value: 'HR Manager', label: 'HR Manager (Full HR, Attendance & Time Off CRUD)' },
    { value: 'HR Payroll User', label: 'HR Payroll User (HR + Payruns/Payslips Read-Write)' },
    { value: 'HR Payroll Manager', label: 'HR Payroll Manager (Full HR & Payroll Operations)' },
    { value: 'Admin', label: 'Admin (Full System & User Management Access)' }
  ];"

$cModalNew = "  const ALL_ROLES = [
    { value: 'Employee', label: 'Employee (Self-Service portal)' },
    { value: 'HR Manager', label: 'HR Manager (Full HR, Attendance & Time Off CRUD)' },
    { value: 'HR Payroll User', label: 'HR Payroll User (HR + Payruns/Payslips Read-Write)' },
    { value: 'HR Payroll Manager', label: 'HR Payroll Manager (Full HR & Payroll Operations)' }
  ];"

ReplaceInFile "frontend/src/modules/auth/CreateUserModal.jsx" $cModalOld $cModalNew
