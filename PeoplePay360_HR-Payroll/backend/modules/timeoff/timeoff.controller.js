const { TimeOffType } = require('./timeoff-type.model');
const { Allocation } = require('./allocation.model');
const { TimeOffRequest } = require('./timeoff-request.model');
const { User } = require('../auth/auth.model');
const {
  calculateDuration,
  getEmployeeLeaveBalance,
  getAllEmployeeBalances,
  validateRequest,
  getDashboardSummary,
  checkOverlappingLeaves
} = require('./timeoff.service');

const isHRorAdmin = (role) => ['Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager'].includes(role);
const canManageApprovals = (role) => ['Admin', 'HR Payroll Manager', 'HR Manager'].includes(role);

// 1. Calculate duration helper
const calculateDurationController = async (req, res) => {
  try {
    const { startDate, endDate, unit, startTime, endTime } = req.body;
    const duration = calculateDuration(startDate, endDate, unit || 'Days', startTime, endTime);
    return res.status(200).json({ success: true, duration, unit: unit || 'Days' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Dashboard summary metrics
const getSummary = async (req, res) => {
  try {
    const filter = {};
    if (!isHRorAdmin(req.user.role)) {
      filter.employee = req.user.id || req.user._id;
    }
    const summary = await getDashboardSummary(filter);
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get leave balances
const getBalances = async (req, res) => {
  try {
    const isHR = isHRorAdmin(req.user.role);
    const { employeeId, all } = req.query;

    if (all === 'true' && isHR) {
      const users = await User.find({ status: { $ne: 'INACTIVE' } })
        .select('_id name email department role jobPosition photo employeeType contractEndDate contractDuration status')
        .sort({ name: 1 });
      const activeTypes = await TimeOffType.find({ status: 'Active' });

      const staffBalances = await Promise.all(
        users.map(async (u) => {
          const balances = await Promise.all(
            activeTypes.map((t) => getEmployeeLeaveBalance(u._id, t._id))
          );
          const totalAllocated = balances.reduce((sum, b) => sum + (b.allocated || 0), 0);
          const totalUsed = balances.reduce((sum, b) => sum + (b.used || 0), 0);

          // Direct aggregation of pending requests for this employee
          const pendingReqs = await TimeOffRequest.find({
            employee: u._id,
            status: { $in: ['Pending', 'Pending Approval'] }
          });
          const totalPending = pendingReqs.reduce((sum, r) => sum + (Number(r.duration) || Number(r.days) || 0), 0);
          const totalRemaining = Math.max(0, totalAllocated - totalUsed);

          const resolvedEmpType = (u.employeeType === 'Contract' && (u.contractEndDate || u.contractDuration))
            ? 'Contract'
            : (u.employeeType === 'Contract' && !u.contractEndDate && !u.contractDuration ? 'Permanent' : (u.employeeType || 'Permanent'));

          return {
            employee: {
              _id: u._id.toString(),
              id: u._id.toString(),
              name: u.name,
              email: u.email,
              department: u.department || 'General',
              role: u.role,
              jobPosition: u.jobPosition || 'Employee',
              photo: u.photo,
              employeeType: resolvedEmpType,
              status: u.status
            },
            totalAllocated,
            totalUsed,
            totalPending,
            totalRemaining,
            balances
          };
        })
      );

      return res.status(200).json({ success: true, staffBalances });
    }

    const targetEmpId = employeeId || req.user.id || req.user._id;

    // Non-HR users can only query their own balances
    if (!isHR && targetEmpId.toString() !== (req.user.id || req.user._id).toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view other employee balances.' });
    }

    const balances = await getAllEmployeeBalances(targetEmpId);
    return res.status(200).json({ success: true, balances });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Time Off Types CRUD
const getTimeOffTypes = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const types = await TimeOffType.find(query).sort({ createdAt: -1 });

    // Attach count of allocations and requests
    const typesWithStats = await Promise.all(
      types.map(async (t) => {
        const [allocationCount, requestCount] = await Promise.all([
          Allocation.countDocuments({ timeOffType: t._id }),
          TimeOffRequest.countDocuments({ timeOffType: t._id })
        ]);
        return {
          ...t.toObject(),
          allocationsCount: allocationCount,
          requestsCount: requestCount
        };
      })
    );

    return res.status(200).json({ success: true, count: typesWithStats.length, types: typesWithStats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createTimeOffType = async (req, res) => {
  try {
    if (!canManageApprovals(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only HR Managers or Admins can create Time Off Types.' });
    }

    const { name, code, description, unit, requiresAllocation, approvalRequired, allowNegativeBalance, maxAllocation, validityPeriod, payrollTreatment, color } = req.body;

    const existingCode = await TimeOffType.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ success: false, message: `Time Off Type code "${code}" already exists.` });
    }

    const newType = await TimeOffType.create({
      name,
      code: code.toUpperCase(),
      description,
      unit: unit || 'Days',
      requiresAllocation: requiresAllocation ?? true,
      approvalRequired: approvalRequired ?? true,
      allowNegativeBalance: allowNegativeBalance ?? false,
      maxAllocation: maxAllocation || 30,
      validityPeriod: validityPeriod || 'Annual',
      payrollTreatment: payrollTreatment || 'Paid',
      color: color || '#7C3AED',
      createdByName: req.user.name || 'System Admin'
    });

    return res.status(201).json({ success: true, message: 'Time Off Type created successfully.', timeOffType: newType });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTimeOffType = async (req, res) => {
  try {
    if (!canManageApprovals(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only HR Managers or Admins can modify Time Off Types.' });
    }

    const { id } = req.params;
    const type = await TimeOffType.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!type) {
      return res.status(404).json({ success: false, message: 'Time Off Type not found.' });
    }

    return res.status(200).json({ success: true, message: 'Time Off Type updated.', timeOffType: type });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleTimeOffTypeStatus = async (req, res) => {
  try {
    if (!canManageApprovals(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized action.' });
    }

    const { id } = req.params;
    const type = await TimeOffType.findById(id);
    if (!type) {
      return res.status(404).json({ success: false, message: 'Time Off Type not found.' });
    }

    type.status = type.status === 'Active' ? 'Inactive' : 'Active';
    await type.save();

    return res.status(200).json({ success: true, message: `Time Off Type set to ${type.status}.`, timeOffType: type });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Allocations Management
const getAllocations = async (req, res) => {
  try {
    const { employeeId, timeOffTypeId, status, search } = req.query;
    const query = {};

    // Non-HR users can only see their own allocations
    if (!isHRorAdmin(req.user.role)) {
      query.employee = req.user.id || req.user._id;
    } else if (employeeId) {
      query.employee = employeeId;
    }

    if (timeOffTypeId) query.timeOffType = timeOffTypeId;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { timeOffTypeName: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } }
      ];
    }

    const allocations = await Allocation.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: allocations.length, allocations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createAllocation = async (req, res) => {
  try {
    if (!canManageApprovals(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only HR Managers or Admins can assign leave allocations.' });
    }

    const {
      allocationTo = 'employee', // 'employee' | 'department' | 'company'
      employeeId,
      department,
      timeOffTypeId,
      allocatedAmount,
      startDate,
      endDate,
      validityPeriod,
      reason,
      autoApprove
    } = req.body;

    let targetTypes = [];
    if (timeOffTypeId === 'all' || timeOffTypeId === 'ALL') {
      targetTypes = await TimeOffType.find({ status: { $ne: 'Inactive' } });
      if (targetTypes.length === 0) {
        targetTypes = await TimeOffType.find({});
      }
    } else {
      const type = await TimeOffType.findById(timeOffTypeId);
      if (type) targetTypes = [type];
    }

    if (targetTypes.length === 0) {
      return res.status(404).json({ success: false, message: 'Selected Time Off Type not found.' });
    }

    let targetUsers = [];
    let resolvedMode = allocationTo;

    if (allocationTo === 'employee' && (employeeId === 'all' || employeeId === 'ALL')) {
      resolvedMode = 'company';
    } else if (allocationTo === 'department' && (department === 'all' || department === 'ALL')) {
      resolvedMode = 'company';
    }

    if (resolvedMode === 'employee') {
      if (!employeeId) return res.status(400).json({ success: false, message: 'Please select an employee.' });
      const emp = await User.findById(employeeId);
      if (!emp) return res.status(404).json({ success: false, message: 'Selected employee not found.' });
      targetUsers = [emp];
    } else if (resolvedMode === 'department') {
      if (!department) return res.status(400).json({ success: false, message: 'Please select a department.' });
      const escapedDept = department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      targetUsers = await User.find({
        department: new RegExp(`^${escapedDept}$`, 'i'),
        status: { $ne: 'INACTIVE' }
      });
      if (targetUsers.length === 0) {
        targetUsers = await User.find({ department: new RegExp(`^${escapedDept}$`, 'i') });
      }
      if (targetUsers.length === 0) {
        return res.status(404).json({ success: false, message: `No active employees found in department "${department}".` });
      }
    } else if (resolvedMode === 'company') {
      targetUsers = await User.find({ status: { $ne: 'INACTIVE' } });
      if (targetUsers.length === 0) {
        targetUsers = await User.find({});
      }
      if (targetUsers.length === 0) {
        return res.status(404).json({ success: false, message: 'No active employees found in the company.' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid allocation target mode.' });
    }

    const initialStatus = autoApprove ? 'Approved' : 'Pending Approval';
    const auditAction = autoApprove ? 'ALLOCATION_CREATED_AND_APPROVED' : 'ALLOCATION_CREATED_PENDING';

    const allocationsToCreate = [];
    for (const u of targetUsers) {
      for (const t of targetTypes) {
        allocationsToCreate.push({
          employee: u._id,
          employeeName: u.name,
          employeeEmail: u.email,
          department: u.department || 'General',
          timeOffType: t._id,
          timeOffTypeName: t.name,
          allocatedAmount: Number(allocatedAmount),
          unit: t.unit || 'Days',
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          validityPeriod: validityPeriod || t.validityPeriod || 'Annual',
          reason: reason || `Allocated ${t.name} to ${resolvedMode === 'company' ? 'Whole Company' : (resolvedMode === 'department' ? `Department: ${department}` : u.name)} by ${req.user.name}`,
          status: initialStatus,
          createdBy: req.user.id || req.user._id,
          createdByName: req.user.name,
          approvedBy: autoApprove ? (req.user.id || req.user._id) : null,
          approvedByName: autoApprove ? req.user.name : null,
          approvalDate: autoApprove ? new Date() : null,
          auditTrail: [
            {
              action: auditAction,
              performedBy: req.user.id || req.user._id,
              performedByName: req.user.name,
              previousStatus: 'Draft',
              newStatus: initialStatus,
              note: `Allocated ${allocatedAmount} ${t.unit} of ${t.name} (Target: ${resolvedMode.toUpperCase()})`
            }
          ]
        });
      }
    }

    const createdAllocations = await Promise.all(
      allocationsToCreate.map((item) => Allocation.create(item))
    );

    const typeDesc = targetTypes.length > 1 ? `all ${targetTypes.length} leave types` : `${targetTypes[0].name}`;
    const targetDesc =
      resolvedMode === 'company'
        ? `all ${targetUsers.length} employees across the company`
        : resolvedMode === 'department'
        ? `${targetUsers.length} employees in ${department}`
        : targetUsers[0].name;

    return res.status(201).json({
      success: true,
      message: `Successfully assigned ${allocatedAmount} Days of ${typeDesc} to ${targetDesc} (Status: "${initialStatus}").`,
      count: createdAllocations.length,
      allocations: createdAllocations,
      allocation: createdAllocations[0]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const approveAllocation = async (req, res) => {
  try {
    if (!canManageApprovals(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to approve leave allocations.' });
    }

    const { id } = req.params;
    const allocation = await Allocation.findById(id);
    if (!allocation) return res.status(404).json({ success: false, message: 'Allocation not found.' });

    if (allocation.status !== 'Pending Approval' && allocation.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve: Allocation is already ${allocation.status} and cannot be modified.`
      });
    }

    const previousStatus = allocation.status;
    allocation.status = 'Approved';
    allocation.approvedBy = req.user.id || req.user._id;
    allocation.approvedByName = req.user.name;
    allocation.approvalDate = new Date();
    allocation.auditTrail.push({
      action: 'ALLOCATION_APPROVED',
      performedBy: req.user.id || req.user._id,
      performedByName: req.user.name,
      previousStatus,
      newStatus: 'Approved',
      note: `Allocation approved by ${req.user.name}. ${allocation.allocatedAmount} ${allocation.unit} added to available balance.`
    });

    await allocation.save();

    return res.status(200).json({
      success: true,
      message: `Allocation approved. ${allocation.allocatedAmount} ${allocation.unit} now active in employee balance.`,
      allocation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const refuseAllocation = async (req, res) => {
  try {
    if (!canManageApprovals(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to refuse allocations.' });
    }

    const { id } = req.params;
    const { refusalReason } = req.body;
    const allocation = await Allocation.findById(id);
    if (!allocation) return res.status(404).json({ success: false, message: 'Allocation not found.' });

    if (allocation.status !== 'Pending Approval' && allocation.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot refuse: Allocation is already ${allocation.status} and cannot be modified.`
      });
    }
    allocation.status = 'Refused';
    allocation.refusalReason = refusalReason || 'Refused by HR Manager';
    allocation.auditTrail.push({
      action: 'ALLOCATION_REFUSED',
      performedBy: req.user.id || req.user._id,
      performedByName: req.user.name,
      previousStatus,
      newStatus: 'Refused',
      note: `Refused: ${refusalReason || 'No reason provided.'}`
    });

    await allocation.save();

    return res.status(200).json({
      success: true,
      message: 'Allocation refused. Balance will not be credited.',
      allocation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Requests Management
const getRequests = async (req, res) => {
  try {
    const { employeeId, timeOffTypeId, status, startDate, endDate, search } = req.query;
    const query = {};

    if (!isHRorAdmin(req.user.role)) {
      query.employee = req.user.id || req.user._id;
    } else if (employeeId) {
      query.employee = employeeId;
    }

    if (timeOffTypeId) query.timeOffType = timeOffTypeId;
    if (status) query.status = status;

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }

    if (search) {
      query.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { timeOffTypeName: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } }
      ];
    }

    const requests = await TimeOffRequest.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: requests.length, requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await TimeOffRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: 'Leave request not found.' });

    // Non-HR cannot view another employee's request
    if (!isHRorAdmin(req.user.role) && request.employee.toString() !== (req.user.id || req.user._id).toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // Include real-time balance for context
    const balance = await getEmployeeLeaveBalance(request.employee, request.timeOffType);

    return res.status(200).json({ success: true, request, balance });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createRequest = async (req, res) => {
  try {
    const { timeOffTypeId, startDate, endDate, startTime, endTime, reason, attachment, isDraft } = req.body;
    const employeeId = (req.body.employeeId && isHRorAdmin(req.user.role)) ? req.body.employeeId : (req.user.id || req.user._id);

    const [employee, type] = await Promise.all([
      User.findById(employeeId),
      TimeOffType.findById(timeOffTypeId)
    ]);

    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    if (!type) return res.status(404).json({ success: false, message: 'Time Off Type not found.' });

    // Calculate duration automatically
    const duration = calculateDuration(startDate, endDate, type.unit, startTime, endTime);

    // Validate request
    const validation = await validateRequest({
      employeeId: employee._id,
      timeOffTypeId: type._id,
      startDate,
      endDate,
      duration,
      isHROverride: isHRorAdmin(req.user.role)
    });

    if (!validation.valid && !isDraft) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const initialStatus = isDraft ? 'Draft' : 'Pending';

    const newRequest = await TimeOffRequest.create({
      employee: employee._id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      department: employee.department || 'General',
      timeOffType: type._id,
      timeOffTypeName: type.name,
      timeOffTypeCode: type.code,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime: startTime || '09:00',
      endTime: endTime || '18:00',
      duration,
      unit: type.unit,
      reason: reason || 'Personal leave request',
      attachment: attachment || '',
      status: initialStatus,
      requestedDate: new Date(),
      auditTrail: [
        {
          action: isDraft ? 'REQUEST_SAVED_DRAFT' : 'REQUEST_SUBMITTED',
          performedBy: req.user.id || req.user._id,
          performedByName: req.user.name,
          previousStatus: null,
          newStatus: initialStatus,
          note: `Requested ${duration} ${type.unit} of ${type.name} from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: isDraft ? 'Leave request saved as Draft.' : 'Leave request submitted successfully.',
      request: newRequest
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const approveRequest = async (req, res) => {
  try {
    if (!canManageApprovals(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to approve leave requests.' });
    }

    const { id } = req.params;
    const request = await TimeOffRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: 'Leave request not found.' });

    if (request.status !== 'Pending' && request.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve request: Leave request is already ${request.status} and cannot be modified.`
      });
    }

    // Verify balance again at approval time
    const balance = await getEmployeeLeaveBalance(request.employee, request.timeOffType);
    if (balance.requiresAllocation && !balance.allowNegativeBalance && balance.remaining < request.duration) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve: Insufficient balance. Available: ${balance.remaining} ${balance.unit}, Requested: ${request.duration} ${balance.unit}.`
      });
    }

    const previousStatus = request.status;
    request.status = 'Approved';
    request.approvedBy = req.user.id || req.user._id;
    request.approvedByName = req.user.name;
    request.approvalDate = new Date();
    request.auditTrail.push({
      action: 'REQUEST_APPROVED',
      performedBy: req.user.id || req.user._id,
      performedByName: req.user.name,
      previousStatus,
      newStatus: 'Approved',
      note: `Approved by ${req.user.name}. ${request.duration} ${request.unit} deducted from available balance.`
    });

    await request.save();

    return res.status(200).json({
      success: true,
      message: `Leave request approved. ${request.duration} ${request.unit} deducted from employee balance.`,
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const refuseRequest = async (req, res) => {
  try {
    if (!canManageApprovals(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to refuse leave requests.' });
    }

    const { id } = req.params;
    const { rejectionReason } = req.body;
    const request = await TimeOffRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: 'Leave request not found.' });

    if (request.status !== 'Pending' && request.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot refuse request: Leave request is already ${request.status} and cannot be modified.`
      });
    }

    const previousStatus = request.status;
    request.status = 'Refused';
    request.rejectionReason = rejectionReason || 'Refused by HR';
    request.auditTrail.push({
      action: 'REQUEST_REFUSED',
      performedBy: req.user.id || req.user._id,
      performedByName: req.user.name,
      previousStatus,
      newStatus: 'Refused',
      note: `Refusal Reason: ${rejectionReason || 'No reason provided.'}`
    });

    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Leave request refused. Balance remains unchanged.',
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    const request = await TimeOffRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: 'Leave request not found.' });

    // Non-HR can only cancel their own request
    if (!isHRorAdmin(req.user.role) && request.employee.toString() !== (req.user.id || req.user._id).toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (request.status !== 'Pending' && request.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel request: Leave request is already ${request.status} and cannot be modified.`
      });
    }

    const previousStatus = request.status;
    request.status = 'Cancelled';
    request.cancellationReason = cancellationReason || 'Cancelled by user';
    request.cancelledDate = new Date();

    request.auditTrail.push({
      action: 'REQUEST_CANCELLED',
      performedBy: req.user.id || req.user._id,
      performedByName: req.user.name,
      previousStatus,
      newStatus: 'Cancelled',
      note: `Cancelled by ${req.user.name}. ${cancellationReason ? 'Reason: ' + cancellationReason : 'No reason provided.'}`
    });

    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Leave request cancelled.',
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Calendar View Feed
const getCalendarEvents = async (req, res) => {
  try {
    const { start, end, employeeId, timeOffTypeId, status } = req.query;
    const query = {};

    if (!isHRorAdmin(req.user.role)) {
      query.employee = req.user.id || req.user._id;
    } else if (employeeId) {
      query.employee = employeeId;
    }

    if (timeOffTypeId) {
      query.timeOffType = timeOffTypeId;
    }

    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['Pending', 'Approved'] };
    }

    if (start && end) {
      query.startDate = { $lte: new Date(end) };
      query.endDate = { $gte: new Date(start) };
    }

    const requests = await TimeOffRequest.find(query).populate('timeOffType', 'color');

    const events = requests.map((r) => ({
      id: r._id,
      title: `${r.employeeName} — ${r.timeOffTypeName} (${r.duration} ${r.unit})`,
      start: r.startDate,
      end: r.endDate,
      employee: r.employeeName,
      department: r.department,
      type: r.timeOffTypeName,
      status: r.status,
      duration: r.duration,
      unit: r.unit,
      color: r.timeOffType?.color || (r.status === 'Approved' ? '#10B981' : '#F59E0B')
    }));

    return res.status(200).json({ success: true, count: events.length, events });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. History & Audit Trail
const getAuditHistory = async (req, res) => {
  try {
    const query = {};
    if (!isHRorAdmin(req.user.role)) {
      query.employee = req.user.id || req.user._id;
    }

    const [requests, allocations] = await Promise.all([
      TimeOffRequest.find(query).select('employeeName timeOffTypeName auditTrail updatedAt'),
      Allocation.find(query).select('employeeName timeOffTypeName auditTrail updatedAt')
    ]);

    const history = [];

    requests.forEach((r) => {
      r.auditTrail.forEach((log) => {
        history.push({
          type: 'Request',
          referenceId: r._id,
          employeeName: r.employeeName,
          timeOffTypeName: r.timeOffTypeName,
          ...log.toObject()
        });
      });
    });

    allocations.forEach((a) => {
      a.auditTrail.forEach((log) => {
        history.push({
          type: 'Allocation',
          referenceId: a._id,
          employeeName: a.employeeName,
          timeOffTypeName: a.timeOffTypeName,
          ...log.toObject()
        });
      });
    });

    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json({ success: true, count: history.length, history: history.slice(0, 100) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  calculateDurationController,
  getSummary,
  getBalances,
  getTimeOffTypes,
  createTimeOffType,
  updateTimeOffType,
  toggleTimeOffTypeStatus,
  getAllocations,
  createAllocation,
  approveAllocation,
  refuseAllocation,
  getRequests,
  getRequestById,
  createRequest,
  approveRequest,
  refuseRequest,
  cancelRequest,
  getCalendarEvents,
  getAuditHistory
};
