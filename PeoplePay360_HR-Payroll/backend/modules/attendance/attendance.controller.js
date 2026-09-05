const attendanceService = require('./attendance.service');

// 1. Employee Check-In
const checkIn = async (req, res) => {
  try {
    const record = await attendanceService.checkIn(req.user, req.body);
    return res.status(201).json({
      success: true,
      message: `Checked in successfully at ${new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      attendance: record
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to check in'
    });
  }
};

// 2. Employee Check-Out
const checkOut = async (req, res) => {
  try {
    const record = await attendanceService.checkOut(req.user, req.body);
    return res.status(200).json({
      success: true,
      message: `Checked out successfully. Worked ${record.workedHours} hours today!`,
      attendance: record
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to check out'
    });
  }
};

// 3. Get Attendance List (Filtered & Searchable)
const getAttendanceList = async (req, res) => {
  try {
    const attendances = await attendanceService.getAttendanceList(req.user, req.query);
    return res.status(200).json({
      success: true,
      count: attendances.length,
      attendances
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch attendance records'
    });
  }
};

// 4. Get Current User's Today Status
const getTodayStatus = async (req, res) => {
  try {
    const status = await attendanceService.getTodayStatus(req.user);
    return res.status(200).json({
      success: true,
      ...status
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch today attendance status'
    });
  }
};

// 5. Get My Personal Attendance History
const getMyAttendance = async (req, res) => {
  try {
    const attendances = await attendanceService.getAttendanceList(req.user, { employeeId: req.user._id || req.user.id, ...req.query });
    return res.status(200).json({
      success: true,
      count: attendances.length,
      attendances
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch personal attendance history'
    });
  }
};

// 6. Get Attendance Summary Metrics
const getSummary = async (req, res) => {
  try {
    const summary = await attendanceService.getSummary(req.user, req.query);
    return res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate attendance summary'
    });
  }
};

// 7. Get Attendance by ID
const getAttendanceById = async (req, res) => {
  try {
    const records = await attendanceService.getAttendanceList(req.user, { id: req.params.id });
    const record = records.find((r) => r._id === req.params.id || r.id === req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    return res.status(200).json({
      success: true,
      attendance: record
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance details'
    });
  }
};

// 8. Create Manual Attendance (HR / Admin)
const createAttendance = async (req, res) => {
  try {
    const record = await attendanceService.createManualAttendance(req.user, req.body);
    return res.status(201).json({
      success: true,
      message: 'Manual attendance record created successfully',
      attendance: record
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create attendance'
    });
  }
};

// 9. Update Attendance Record (HR / Admin)
const updateAttendance = async (req, res) => {
  try {
    const record = await attendanceService.updateAttendance(req.user, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      attendance: record
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update attendance'
    });
  }
};

// 10. Delete Attendance Record (HR / Admin)
const deleteAttendance = async (req, res) => {
  try {
    await attendanceService.deleteAttendance(req.user, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete attendance'
    });
  }
};

// 11. Request Correction
const requestCorrection = async (req, res) => {
  try {
    const record = await attendanceService.requestCorrection(req.user, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Attendance correction request submitted for HR review',
      attendance: record
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to request correction'
    });
  }
};

// 12. Approve Correction (HR / Admin)
const approveCorrection = async (req, res) => {
  try {
    const record = await attendanceService.approveCorrection(req.user, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Attendance correction approved successfully',
      attendance: record
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to approve correction'
    });
  }
};

// 13. Reject Correction (HR / Admin)
const rejectCorrection = async (req, res) => {
  try {
    const record = await attendanceService.refuseCorrection(req.user, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Attendance correction request refused',
      attendance: record
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to reject correction'
    });
  }
};

// 14. Get Settings / Config
const getConfig = async (req, res) => {
  try {
    const config = await attendanceService.getConfig();
    return res.status(200).json({ success: true, config });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance configuration' });
  }
};

// 15. Update Settings / Config (HR / Admin)
const updateConfig = async (req, res) => {
  try {
    const config = await attendanceService.updateConfig(req.user, req.body);
    return res.status(200).json({
      success: true,
      message: 'Attendance schedule & holiday settings updated successfully',
      config
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update attendance configuration'
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendanceList,
  getTodayStatus,
  getMyAttendance,
  getSummary,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  requestCorrection,
  approveCorrection,
  rejectCorrection,
  getConfig,
  updateConfig
};
