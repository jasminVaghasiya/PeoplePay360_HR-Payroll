const { TimeOffType } = require('./timeoff-type.model');
const { Allocation } = require('./allocation.model');
const { TimeOffRequest } = require('./timeoff-request.model');
const { User } = require('../auth/auth.model');

// Calculate working days duration (excluding Saturday and Sunday)
const calculateDuration = (startDateStr, endDateStr, unit = 'Days', startTimeStr = '09:00', endTimeStr = '18:00') => {
  if (!startDateStr || !endDateStr) return 0;

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (end < start) return 0;

  if (unit === 'Hours') {
    const [startH, startM] = (startTimeStr || '09:00').split(':').map(Number);
    const [endH, endM] = (endTimeStr || '18:00').split(':').map(Number);
    const diffHours = (endH + endM / 60) - (startH + startM / 60);
    return Math.max(0.5, Number(diffHours.toFixed(1)));
  }

  // Calculate day-based duration
  let workingDays = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const targetEnd = new Date(end);
  targetEnd.setHours(0, 0, 0, 0);

  while (current <= targetEnd) {
    const dayOfWeek = current.getDay();
    // Exclude Sunday (0) and Saturday (6)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  // If start and end falls strictly on weekend, return at least 1 day if requested
  return workingDays > 0 ? workingDays : 1;
};

// Check for overlapping pending or approved leave requests
const checkOverlappingLeaves = async (employeeId, startDate, endDate, excludeRequestId = null) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const query = {
    employee: employeeId,
    status: { $in: ['Pending', 'Approved'] },
    startDate: { $lte: end },
    endDate: { $gte: start }
  };

  if (excludeRequestId) {
    query._id = { $ne: excludeRequestId };
  }

  const overlapping = await TimeOffRequest.find(query);
  return overlapping;
};

// Calculate real-time dynamic leave balance for an employee and leave type
const getEmployeeLeaveBalance = async (employeeId, timeOffTypeId) => {
  const timeOffType = await TimeOffType.findById(timeOffTypeId);
  if (!timeOffType) {
    throw new Error('Time off type not found');
  }

  // If leave type does not require allocation (e.g. Unpaid Leave), infinite balance
  if (!timeOffType.requiresAllocation) {
    const approvedRequests = await TimeOffRequest.find({
      employee: employeeId,
      timeOffType: timeOffTypeId,
      status: 'Approved'
    });
    const pendingRequests = await TimeOffRequest.find({
      employee: employeeId,
      timeOffType: timeOffTypeId,
      status: 'Pending'
    });

    const used = approvedRequests.reduce((acc, r) => acc + (r.duration || 0), 0);
    const pending = pendingRequests.reduce((acc, r) => acc + (r.duration || 0), 0);

    return {
      timeOffTypeId: timeOffType._id,
      timeOffTypeName: timeOffType.name,
      code: timeOffType.code,
      unit: timeOffType.unit,
      requiresAllocation: false,
      allowNegativeBalance: timeOffType.allowNegativeBalance,
      allocated: 999,
      used,
      pending,
      remaining: 999,
      expired: 0
    };
  }

  // 1. Sum approved allocations
  const approvedAllocations = await Allocation.find({
    employee: employeeId,
    timeOffType: timeOffTypeId,
    status: 'Approved'
  });

  const now = new Date();
  let totalAllocated = 0;
  let expiredAllocated = 0;

  approvedAllocations.forEach((alloc) => {
    if (alloc.endDate && new Date(alloc.endDate) < now) {
      expiredAllocated += (alloc.allocatedAmount || 0);
    } else {
      totalAllocated += (alloc.allocatedAmount || 0);
    }
  });

  // 2. Sum approved requests (used)
  const approvedRequests = await TimeOffRequest.find({
    employee: employeeId,
    timeOffType: timeOffTypeId,
    status: 'Approved'
  });
  const totalUsed = approvedRequests.reduce((acc, r) => acc + (r.duration || 0), 0);

  // 3. Sum pending requests
  const pendingRequests = await TimeOffRequest.find({
    employee: employeeId,
    timeOffType: timeOffTypeId,
    status: 'Pending'
  });
  const totalPending = pendingRequests.reduce((acc, r) => acc + (r.duration || 0), 0);

  const remaining = Math.max(0, totalAllocated - totalUsed);

  return {
    timeOffTypeId: timeOffType._id,
    timeOffTypeName: timeOffType.name,
    code: timeOffType.code,
    unit: timeOffType.unit,
    requiresAllocation: true,
    allowNegativeBalance: timeOffType.allowNegativeBalance,
    allocated: totalAllocated,
    used: totalUsed,
    pending: totalPending,
    remaining: timeOffType.allowNegativeBalance ? (totalAllocated - totalUsed) : remaining,
    expired: expiredAllocated
  };
};

// Get all leave balances for an employee across active leave types
const getAllEmployeeBalances = async (employeeId) => {
  const activeTypes = await TimeOffType.find({ status: 'Active' });
  const balances = await Promise.all(
    activeTypes.map((type) => getEmployeeLeaveBalance(employeeId, type._id))
  );
  return balances;
};

// Validate a leave request before creation or approval
const validateRequest = async ({ employeeId, timeOffTypeId, startDate, endDate, duration, isHROverride = false }) => {
  const type = await TimeOffType.findById(timeOffTypeId);
  if (!type) {
    return { valid: false, message: 'Selected Leave Type does not exist.' };
  }

  if (type.status !== 'Active') {
    return { valid: false, message: `Leave Type "${type.name}" is currently inactive.` };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, message: 'Invalid start or end date.' };
  }

  if (end < start) {
    return { valid: false, message: 'End date cannot be earlier than start date.' };
  }

  if (duration <= 0) {
    return { valid: false, message: 'Duration must be greater than 0.' };
  }

  // Check overlapping leave requests
  const overlapping = await checkOverlappingLeaves(employeeId, startDate, endDate);
  if (overlapping.length > 0 && !isHROverride) {
    const conflict = overlapping[0];
    const sStr = new Date(conflict.startDate).toLocaleDateString();
    const eStr = new Date(conflict.endDate).toLocaleDateString();
    return {
      valid: false,
      message: `Overlapping leave detected with existing request (${conflict.timeOffTypeName}: ${sStr} - ${eStr}, Status: ${conflict.status}).`
    };
  }

  // Check leave balance if allocation is required
  if (type.requiresAllocation && !type.allowNegativeBalance) {
    const balance = await getEmployeeLeaveBalance(employeeId, timeOffTypeId);
    if (balance.remaining < duration) {
      return {
        valid: false,
        message: `Insufficient leave balance for ${type.name}. Available: ${balance.remaining} ${type.unit}, Requested: ${duration} ${type.unit}.`
      };
    }
  }

  return { valid: true };
};

// Summary metrics across the system or specific department
const getDashboardSummary = async (filter = {}) => {
  const pendingRequestsCount = await TimeOffRequest.countDocuments({ ...filter, status: 'Pending' });
  const approvedRequestsCount = await TimeOffRequest.countDocuments({ ...filter, status: 'Approved' });
  const refusedRequestsCount = await TimeOffRequest.countDocuments({ ...filter, status: 'Refused' });

  // Aggregations for total allocated and used days
  const approvedAllocations = await Allocation.find({ ...filter, status: 'Approved', unit: 'Days' });
  const totalAllocatedDays = approvedAllocations.reduce((acc, a) => acc + (a.allocatedAmount || 0), 0);

  const approvedRequests = await TimeOffRequest.find({ ...filter, status: 'Approved', unit: 'Days' });
  const totalUsedDays = approvedRequests.reduce((acc, r) => acc + (r.duration || 0), 0);

  const totalRemainingDays = Math.max(0, totalAllocatedDays - totalUsedDays);

  // Employees currently on leave today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const activeLeavesToday = await TimeOffRequest.find({
    status: 'Approved',
    startDate: { $lte: todayEnd },
    endDate: { $gte: today }
  }).distinct('employee');

  return {
    pendingRequests: pendingRequestsCount,
    approvedRequests: approvedRequestsCount,
    refusedRequests: refusedRequestsCount,
    totalAllocatedDays,
    totalUsedDays,
    totalRemainingDays,
    employeesOnLeaveToday: activeLeavesToday.length
  };
};

// Default standard seed types
const DEFAULT_TYPES = [
  {
    name: 'Paid Annual Leave',
    code: 'PAL',
    description: 'Standard statutory annual paid vacation leave',
    unit: 'Days',
    requiresAllocation: true,
    approvalRequired: true,
    allowNegativeBalance: false,
    maxAllocation: 24,
    validityPeriod: 'Annual',
    payrollTreatment: 'Paid',
    color: '#10B981',
    status: 'Active'
  },
  {
    name: 'Sick Leave',
    code: 'SL',
    description: 'Leave for medical and health recovery',
    unit: 'Days',
    requiresAllocation: true,
    approvalRequired: true,
    allowNegativeBalance: true,
    maxAllocation: 12,
    validityPeriod: 'Annual',
    payrollTreatment: 'Paid',
    color: '#3B82F6',
    status: 'Active'
  },
  {
    name: 'Casual Leave',
    code: 'CL',
    description: 'Short notice urgent personal leaves',
    unit: 'Days',
    requiresAllocation: true,
    approvalRequired: true,
    allowNegativeBalance: false,
    maxAllocation: 10,
    validityPeriod: 'Annual',
    payrollTreatment: 'Paid',
    color: '#F59E0B',
    status: 'Active'
  },
  {
    name: 'Unpaid Leave',
    code: 'UL',
    description: 'Leave without pay / Loss of Pay (LOP)',
    unit: 'Days',
    requiresAllocation: false,
    approvalRequired: true,
    allowNegativeBalance: true,
    maxAllocation: 90,
    validityPeriod: 'None',
    payrollTreatment: 'Unpaid',
    color: '#EF4444',
    status: 'Active'
  },
  {
    name: 'Earned Leave',
    code: 'EL',
    description: 'Accumulated earned privilege leaves',
    unit: 'Days',
    requiresAllocation: true,
    approvalRequired: true,
    allowNegativeBalance: false,
    maxAllocation: 30,
    validityPeriod: 'Annual',
    payrollTreatment: 'Paid',
    color: '#8B5CF6',
    status: 'Active'
  },
  {
    name: 'Maternity Leave',
    code: 'ML',
    description: 'Statutory maternity leave for female employees',
    unit: 'Days',
    requiresAllocation: true,
    approvalRequired: true,
    allowNegativeBalance: false,
    maxAllocation: 180,
    validityPeriod: 'None',
    payrollTreatment: 'Paid',
    color: '#EC4899',
    status: 'Active'
  },
  {
    name: 'Emergency Leave',
    code: 'EML',
    description: 'Critical family or domestic emergency',
    unit: 'Days',
    requiresAllocation: false,
    approvalRequired: true,
    allowNegativeBalance: true,
    maxAllocation: 5,
    validityPeriod: 'Annual',
    payrollTreatment: 'Paid',
    color: '#F97316',
    status: 'Active'
  }
];

// Seed default policies and bootstrap initial allocations
const seedDefaultTimeOffTypes = async () => {
  try {
    const existingCount = await TimeOffType.countDocuments();
    if (existingCount === 0) {
      console.log('[TimeOff] Bootstrapping standard Time Off Types...');
      await TimeOffType.insertMany(DEFAULT_TYPES);
      console.log('[TimeOff] Successfully created 7 standard Time Off Types.');
    }

    // Ensure demo user accounts exist for login
    const { DEMO_USERS } = require('../../config/seed');
    for (const u of DEMO_USERS) {
      const exists = await User.findOne({ email: u.email.toLowerCase() });
      if (!exists) {
        await User.create({
          name: u.name,
          email: u.email.toLowerCase(),
          password: u.passwordRaw,
          role: u.role,
          department: u.department,
          jobPosition: u.jobPosition,
          status: u.status,
          createdByName: u.createdByName
        });
      }
    }

    // Clean up any legacy dummy sample requests/allocations if present
    await TimeOffRequest.deleteMany({ reason: { $in: ['Family vacation trip', 'Medical recovery after dental surgery'] } });
    await Allocation.deleteMany({ createdByName: 'System Bootstrapper' });
  } catch (error) {
    console.error('[TimeOff Seed Error]:', error.message);
  }
};

module.exports = {
  calculateDuration,
  checkOverlappingLeaves,
  getEmployeeLeaveBalance,
  getAllEmployeeBalances,
  validateRequest,
  getDashboardSummary,
  seedDefaultTimeOffTypes
};
