const attendanceRepository = require('./attendance.repository');

class AttendanceService {
  // Helper to format Date to YYYY-MM-DD
  getFormattedDate(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getConfig() {
    return await attendanceRepository.getConfig();
  }

  async updateConfig(user, data) {
    if (!['Admin', 'HR Payroll Manager', 'HR Manager'].includes(user.role)) {
      throw { statusCode: 403, message: 'Forbidden: Only Admin and HR Managers can update attendance settings.' };
    }
    return await attendanceRepository.updateConfig(data);
  }

  // Calculate Late Minutes based on scheduled start time and grace period
  calculateLateMinutes(checkInDate, scheduledStartStr = '09:00', graceMinutes = 15) {
    const [schedHours, schedMins] = scheduledStartStr.split(':').map(Number);
    const schedDate = new Date(checkInDate);
    schedDate.setHours(schedHours, schedMins, 0, 0);

    if (checkInDate > schedDate) {
      const diffMs = checkInDate.getTime() - schedDate.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins > (graceMinutes || 0) ? diffMins : 0;
    }
    return 0;
  }

  // Calculate worked hours, overtime, and AUTO-ASSIGN attendance status
  calculateWorkedAndStatus({
    checkIn,
    checkOut,
    scheduledHours = 8.0,
    breakHours = 0,
    lateMinutes = 0,
    isCorrected = false,
    dateStr = '',
    weeklyOffDays = ['Sunday'],
    holidays = []
  }) {
    // 1. Auto-detect Weekly Off (e.g. Sunday) or Custom Holiday
    const checkInDateObj = checkIn ? new Date(checkIn) : (dateStr ? new Date(`${dateStr}T00:00:00`) : new Date());
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekStr = dayNames[checkInDateObj.getDay()];

    const isWeeklyOff = weeklyOffDays && weeklyOffDays.includes(dayOfWeekStr);
    const isCustomHoliday = dateStr && holidays.some((h) => h.date === dateStr);

    if (isWeeklyOff || isCustomHoliday) {
      return { workedHours: 0, overtimeHours: 0, status: 'Holiday' };
    }

    if (!checkOut) {
      return {
        workedHours: 0,
        overtimeHours: 0,
        status: lateMinutes > 0 ? 'Late' : 'Present'
      };
    }

    const durationMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    if (durationMs < 0) {
      throw { statusCode: 400, message: 'Check-out time cannot be earlier than check-in time.' };
    }

    const durationHours = durationMs / (1000 * 60 * 60);
    
    // Deduct break only if breakHours is explicitly configured > 0
    let effectiveBreak = 0;
    if (breakHours > 0) {
      if (durationHours >= 5.0) {
        effectiveBreak = breakHours;
      } else if (durationHours > 1.0) {
        effectiveBreak = Math.min(breakHours, durationHours - 1.0);
      }
    }

    const rawWorked = Math.max(0.01, durationHours - effectiveBreak);
    const workedHours = parseFloat(rawWorked.toFixed(2));
    const overtimeHours = Math.max(0, parseFloat((workedHours - scheduledHours).toFixed(2)));

    // AUTO-ASSIGN STATUS
    let status = 'Present';
    if (isCorrected) {
      status = 'Corrected';
    } else if (workedHours < 4.0 && workedHours > 0) {
      status = 'Half Day';
    } else if (overtimeHours > 0) {
      status = 'Overtime';
    } else if (lateMinutes > 0) {
      status = 'Late';
    }

    return { workedHours, overtimeHours, status };
  }

  // 1. Employee Check-In
  async checkIn(user, { scheduledStart = '09:00', notes = '' }) {
    const todayStr = this.getFormattedDate();
    const employeeId = user._id || user.id;

    // Check for existing attendance today
    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, todayStr);
    if (existing) {
      throw {
        statusCode: 409,
        message: `Duplicate Check-In Error: An attendance record already exists for ${user.name} on ${todayStr}. Multiple check-ins on the same date are prevented.`
      };
    }

    const checkInTime = new Date();
    const lateMinutes = this.calculateLateMinutes(checkInTime, scheduledStart);
    const initialStatus = lateMinutes > 0 ? 'Late' : 'Present';

    const attendanceData = {
      employeeId,
      employeeName: user.name,
      employeeEmail: user.email,
      department: user.department || 'General',
      jobPosition: user.jobPosition || 'Employee',
      date: todayStr,
      checkIn: checkInTime,
      checkOut: null,
      scheduledHours: 8.0,
      breakHours: 1.0,
      workedHours: 0,
      overtimeHours: 0,
      lateMinutes,
      status: initialStatus,
      source: 'Web Kiosk',
      notes: notes || (lateMinutes > 0 ? `Late check-in by ${lateMinutes} mins` : 'Standard web check-in'),
      correctionStatus: 'None',
      createdBy: user.name,
      updatedBy: user.name,
      auditTrail: [
        {
          action: 'Checked In',
          changedBy: user.name,
          changedDate: checkInTime,
          newCheckIn: checkInTime
        }
      ]
    };

    return await attendanceRepository.create(attendanceData);
  }

  // 2. Employee Check-Out
  async checkOut(user, { breakHours = 1.0, notes = '' }) {
    const todayStr = this.getFormattedDate();
    const employeeId = user._id || user.id;

    // Find active session today
    const activeSession = await attendanceRepository.findActiveTodaySession(employeeId, todayStr);
    if (!activeSession) {
      throw {
        statusCode: 404,
        message: 'No active check-in found for today. You must check in before checking out.'
      };
    }

    const checkOutTime = new Date();
    const { workedHours, overtimeHours, status } = this.calculateWorkedAndStatus({
      checkIn: activeSession.checkIn,
      checkOut: checkOutTime,
      scheduledHours: activeSession.scheduledHours || 8.0,
      breakHours: parseFloat(breakHours) || 1.0,
      lateMinutes: activeSession.lateMinutes || 0
    });

    const auditTrail = activeSession.auditTrail || [];
    auditTrail.push({
      action: 'Checked Out',
      changedBy: user.name,
      changedDate: checkOutTime,
      oldCheckOut: null,
      newCheckOut: checkOutTime
    });

    const updateData = {
      checkOut: checkOutTime,
      breakHours: parseFloat(breakHours) || 1.0,
      workedHours,
      overtimeHours,
      status,
      updatedBy: user.name,
      auditTrail
    };

    if (notes) updateData.notes = `${activeSession.notes} | Check-out note: ${notes}`;

    return await attendanceRepository.update(activeSession._id || activeSession.id, updateData);
  }

  // 3. Get Attendance History & Filtered List
  async getAttendanceList(user, query = {}) {
    let filter = { ...query };

    const authorizedRoles = ['Admin', 'HR Payroll Manager', 'HR Manager', 'HOD', 'Manager'];
    const isAuthorized = authorizedRoles.includes(user.role);

    // Non-authorized regular employees can ONLY view their own attendance records
    if (!isAuthorized) {
      filter.employeeId = user._id || user.id;
    }

    const records = await attendanceRepository.findAll(filter);

    // Auto-detect missing check-out for past records
    const todayStr = this.getFormattedDate();
    records.forEach((rec) => {
      if (rec.date < todayStr && rec.checkIn && !rec.checkOut && rec.status !== 'Missing Check-Out') {
        rec.status = 'Missing Check-Out';
      }
    });

    return records;
  }

  // 4. Get Today's Status for Current User
  async getTodayStatus(user) {
    const todayStr = this.getFormattedDate();
    const employeeId = user._id || user.id;

    const record = await attendanceRepository.findByEmployeeAndDate(employeeId, todayStr);
    return {
      todayDate: todayStr,
      hasRecord: !!record,
      isCheckedIn: !!(record && record.checkIn && !record.checkOut),
      isCheckedOut: !!(record && record.checkOut),
      record: record || null
    };
  }

  // 5. Get Attendance Summary Analytics
  async getSummary(user, query = {}) {
    const records = await this.getAttendanceList(user, query);

    const summary = {
      totalRecords: records.length,
      totalWorkingDays: new Set(records.map((r) => r.date)).size,
      presentDays: records.filter((r) => r.status === 'Present').length,
      lateDays: records.filter((r) => r.status === 'Late').length,
      absentDays: records.filter((r) => r.status === 'Absent').length,
      halfDays: records.filter((r) => r.status === 'Half Day').length,
      overtimeDays: records.filter((r) => r.status === 'Overtime').length,
      missingCheckOuts: records.filter((r) => r.status === 'Missing Check-Out').length,
      correctedRecords: records.filter((r) => r.status === 'Corrected').length,
      totalWorkedHours: parseFloat(records.reduce((acc, r) => acc + (r.workedHours || 0), 0).toFixed(2)),
      totalOvertimeHours: parseFloat(records.reduce((acc, r) => acc + (r.overtimeHours || 0), 0).toFixed(2))
    };

    return summary;
  }

  // 6. Request Attendance Correction (Employee or HR)
  async requestCorrection(user, id, { correctedCheckIn, correctedCheckOut, reason }) {
    if (!reason || reason.trim().length < 5) {
      throw { statusCode: 400, message: 'Please provide a valid reason (at least 5 characters) for the attendance correction request.' };
    }

    const record = await attendanceRepository.findById(id);
    if (!record) {
      throw { statusCode: 404, message: 'Attendance record not found.' };
    }

    if (user.role === 'Employee' && record.employeeEmail?.toLowerCase() !== user.email.toLowerCase()) {
      throw { statusCode: 403, message: 'Forbidden: You can only request corrections for your own attendance records.' };
    }

    const newCheckIn = correctedCheckIn ? new Date(correctedCheckIn) : record.checkIn;
    const newCheckOut = correctedCheckOut ? new Date(correctedCheckOut) : record.checkOut;

    if (newCheckIn && newCheckOut && newCheckIn >= newCheckOut) {
      throw { statusCode: 400, message: 'Corrected Check-Out time must be after Corrected Check-In time.' };
    }

    const auditTrail = record.auditTrail || [];
    auditTrail.push({
      action: 'Correction Requested',
      changedBy: user.name,
      changedDate: new Date(),
      oldCheckIn: record.checkIn,
      newCheckIn,
      oldCheckOut: record.checkOut,
      newCheckOut,
      reason
    });

    const updateData = {
      correctionStatus: 'Requested',
      correctionReason: reason,
      correctedCheckIn: newCheckIn,
      correctedCheckOut: newCheckOut,
      updatedBy: user.name,
      auditTrail
    };

    return await attendanceRepository.update(id, updateData);
  }

  // 7. Approve Correction (HR / Admin)
  async approveCorrection(hrUser, id, { notes = '' }) {
    const record = await attendanceRepository.findById(id);
    if (!record) throw { statusCode: 404, message: 'Attendance record not found.' };

    const finalCheckIn = record.correctedCheckIn || record.checkIn;
    const finalCheckOut = record.correctedCheckOut || record.checkOut;

    if (!finalCheckIn || !finalCheckOut) {
      throw { statusCode: 400, message: 'Cannot approve correction without complete Check-In and Check-Out timestamps.' };
    }

    const { workedHours, overtimeHours } = this.calculateWorkedAndStatus({
      checkIn: finalCheckIn,
      checkOut: finalCheckOut,
      scheduledHours: record.scheduledHours || 8.0,
      breakHours: record.breakHours || 1.0,
      isCorrected: true
    });

    const auditTrail = record.auditTrail || [];
    auditTrail.push({
      action: 'Correction Approved',
      changedBy: hrUser.name,
      changedDate: new Date(),
      oldCheckIn: record.checkIn,
      newCheckIn: finalCheckIn,
      oldCheckOut: record.checkOut,
      newCheckOut: finalCheckOut,
      reason: notes || record.correctionReason || 'HR Approved'
    });

    const updateData = {
      originalCheckIn: record.originalCheckIn || record.checkIn,
      originalCheckOut: record.originalCheckOut || record.checkOut,
      checkIn: finalCheckIn,
      checkOut: finalCheckOut,
      workedHours,
      overtimeHours,
      status: 'Corrected',
      correctionStatus: 'Approved',
      correctedBy: hrUser.name,
      correctedAt: new Date(),
      updatedBy: hrUser.name,
      notes: notes ? `${record.notes} | Correction Note: ${notes}` : record.notes,
      auditTrail
    };

    return await attendanceRepository.update(id, updateData);
  }

  // 8. Refuse Correction (HR / Admin)
  async refuseCorrection(hrUser, id, { reason = '' }) {
    const record = await attendanceRepository.findById(id);
    if (!record) throw { statusCode: 404, message: 'Attendance record not found.' };

    const auditTrail = record.auditTrail || [];
    auditTrail.push({
      action: 'Correction Refused',
      changedBy: hrUser.name,
      changedDate: new Date(),
      reason: reason || 'Correction request refused by HR'
    });

    const updateData = {
      correctionStatus: 'Refused',
      updatedBy: hrUser.name,
      auditTrail
    };

    return await attendanceRepository.update(id, updateData);
  }

  // 9. Manual Create Attendance (HR / Admin)
  async createManualAttendance(hrUser, data) {
    const { employeeId, employeeName, employeeEmail, department, jobPosition, date, checkIn, checkOut, scheduledHours, breakHours, notes } = data;

    if (!employeeId || !date || !checkIn) {
      throw { statusCode: 400, message: 'Employee, Date, and Check-In time are required.' };
    }

    const cIn = new Date(checkIn);
    const cOut = checkOut ? new Date(checkOut) : null;
    const lateMins = this.calculateLateMinutes(cIn, '09:00');

    const { workedHours, overtimeHours, status } = this.calculateWorkedAndStatus({
      checkIn: cIn,
      checkOut: cOut,
      scheduledHours: scheduledHours || 8.0,
      breakHours: breakHours || 1.0,
      lateMinutes: lateMins
    });

    const recordObj = {
      employeeId,
      employeeName: employeeName || 'Employee',
      employeeEmail: employeeEmail || 'employee@peoplepay360.com',
      department: department || 'General',
      jobPosition: jobPosition || 'Staff',
      date,
      checkIn: cIn,
      checkOut: cOut,
      scheduledHours: scheduledHours || 8.0,
      breakHours: breakHours || 1.0,
      workedHours,
      overtimeHours,
      lateMinutes: lateMins,
      status,
      source: 'Manual Correction',
      notes: notes || 'HR Manual Attendance Creation',
      correctionStatus: 'None',
      createdBy: hrUser.name,
      updatedBy: hrUser.name,
      auditTrail: [
        {
          action: 'Manual Record Created',
          changedBy: hrUser.name,
          changedDate: new Date(),
          newCheckIn: cIn,
          newCheckOut: cOut
        }
      ]
    };

    return await attendanceRepository.create(recordObj);
  }

  // 10. Manual Edit Attendance (HR / Admin)
  async updateAttendance(hrUser, id, data) {
    const record = await attendanceRepository.findById(id);
    if (!record) throw { statusCode: 404, message: 'Attendance record not found.' };

    const cIn = data.checkIn ? new Date(data.checkIn) : record.checkIn;
    const cOut = data.checkOut ? new Date(data.checkOut) : record.checkOut;
    const lateMins = this.calculateLateMinutes(cIn, '09:00');

    const { workedHours, overtimeHours, status } = this.calculateWorkedAndStatus({
      checkIn: cIn,
      checkOut: cOut,
      scheduledHours: data.scheduledHours || record.scheduledHours || 8.0,
      breakHours: data.breakHours !== undefined ? data.breakHours : record.breakHours || 1.0,
      lateMinutes: lateMins
    });

    const auditTrail = record.auditTrail || [];
    auditTrail.push({
      action: 'Record Updated by HR',
      changedBy: hrUser.name,
      changedDate: new Date(),
      oldCheckIn: record.checkIn,
      newCheckIn: cIn,
      oldCheckOut: record.checkOut,
      newCheckOut: cOut,
      reason: data.notes || 'HR Edit'
    });

    const updateData = {
      ...data,
      checkIn: cIn,
      checkOut: cOut,
      lateMinutes: lateMins,
      workedHours,
      overtimeHours,
      status,
      updatedBy: hrUser.name,
      auditTrail
    };

    return await attendanceRepository.update(id, updateData);
  }

  // 11. Delete Attendance (HR / Admin)
  async deleteAttendance(hrUser, id) {
    const record = await attendanceRepository.findById(id);
    if (!record) throw { statusCode: 404, message: 'Attendance record not found.' };

    return await attendanceRepository.delete(id);
  }
}

module.exports = new AttendanceService();
