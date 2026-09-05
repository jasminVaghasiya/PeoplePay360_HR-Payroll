const { Attendance, AttendanceConfig } = require('./attendance.model');
const { getIsConnected } = require('../../config/db');

// In-Memory Backup Store for offline fallback
let memoryAttendances = [];
let memoryConfig = {
  standardCheckIn: '09:00',
  standardCheckOut: '18:00',
  scheduledHours: 8.0,
  breakHours: 1.0,
  lateGraceMinutes: 15,
  weeklyOffDays: ['Sunday'],
  holidays: [
    { _id: 'h1', name: 'New Year Day', date: '2026-01-01', isPaid: true },
    { _id: 'h2', name: 'Independence Day', date: '2026-08-15', isPaid: true },
    { _id: 'h3', name: 'Christmas Day', date: '2026-12-25', isPaid: true }
  ]
};

class AttendanceRepository {
  async getConfig() {
    if (getIsConnected()) {
      try {
        let conf = await AttendanceConfig.findOne();
        if (!conf) {
          conf = await AttendanceConfig.create(memoryConfig);
        }
        return conf;
      } catch (e) {}
    }
    return memoryConfig;
  }

  async updateConfig(newConfigData) {
    if (getIsConnected()) {
      try {
        let conf = await AttendanceConfig.findOne();
        if (conf) {
          conf = await AttendanceConfig.findByIdAndUpdate(conf._id, { $set: newConfigData }, { new: true });
        } else {
          conf = await AttendanceConfig.create(newConfigData);
        }
        return conf;
      } catch (e) {}
    }
    memoryConfig = { ...memoryConfig, ...newConfigData };
    return memoryConfig;
  }
  async findByEmployeeAndDate(employeeId, date) {
    if (getIsConnected()) {
      const record = await Attendance.findOne({ employeeId, date });
      if (record) return record;
    }
    return memoryAttendances.find(
      (a) =>
        (a.employeeId?.toString() === employeeId?.toString() ||
          a.employeeEmail?.toLowerCase() === employeeId?.toString().toLowerCase()) &&
        a.date === date
    ) || null;
  }

  async findActiveTodaySession(employeeId, date) {
    if (getIsConnected()) {
      const record = await Attendance.findOne({ employeeId, date, checkOut: null });
      if (record) return record;
    }
    return memoryAttendances.find(
      (a) =>
        (a.employeeId?.toString() === employeeId?.toString() ||
          a.employeeEmail?.toLowerCase() === employeeId?.toString().toLowerCase()) &&
        a.date === date &&
        !a.checkOut
    ) || null;
  }

  async findById(id) {
    if (getIsConnected()) {
      try {
        const record = await Attendance.findById(id);
        if (record) return record;
      } catch (e) {}
    }
    return memoryAttendances.find((a) => a._id === id || a.id === id) || null;
  }

  async findAll({ employeeId, department, date, startDate, endDate, status, search }) {
    if (getIsConnected()) {
      let query = {};
      if (employeeId) query.employeeId = employeeId;
      if (department) query.department = department;
      if (status) query.status = status;
      if (date) query.date = date;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }
      if (search) {
        query.$or = [
          { employeeName: { $regex: search, $options: 'i' } },
          { employeeEmail: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ];
      }
      return await Attendance.find(query).sort({ date: -1, createdAt: -1 });
    }

    // Memory Store Query
    let list = [...memoryAttendances];
    if (employeeId) {
      list = list.filter(
        (a) =>
          a.employeeId?.toString() === employeeId?.toString() ||
          a.employeeEmail?.toLowerCase() === employeeId?.toString().toLowerCase()
      );
    }
    if (department) list = list.filter((a) => a.department === department);
    if (status) list = list.filter((a) => a.status === status);
    if (date) list = list.filter((a) => a.date === date);
    if (startDate) list = list.filter((a) => a.date >= startDate);
    if (endDate) list = list.filter((a) => a.date <= endDate);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.employeeName?.toLowerCase().includes(q) ||
          a.employeeEmail?.toLowerCase().includes(q) ||
          a.department?.toLowerCase().includes(q) ||
          a.notes?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  async create(data) {
    let createdRecord = null;
    if (getIsConnected()) {
      try {
        createdRecord = await Attendance.create(data);
      } catch (err) {
        if (err.code === 11000) {
          throw { statusCode: 409, message: `An attendance record already exists for this employee on ${data.date}. Duplicate entries are prevented.` };
        }
        throw err;
      }
    }

    const memObj = {
      _id: createdRecord?._id || `att_mem_${Date.now()}`,
      id: createdRecord?._id || `att_mem_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Check duplicate in memory
    const existingIndex = memoryAttendances.findIndex(
      (a) =>
        (a.employeeId?.toString() === data.employeeId?.toString() ||
          a.employeeEmail?.toLowerCase() === data.employeeEmail?.toLowerCase()) &&
        a.date === data.date
    );

    if (existingIndex !== -1 && !getIsConnected()) {
      throw { statusCode: 409, message: `An attendance record already exists for this employee on ${data.date}. Duplicate entries are prevented.` };
    }

    memoryAttendances.unshift(memObj);
    return createdRecord || memObj;
  }

  async update(id, updateData) {
    let updated = null;
    if (getIsConnected()) {
      try {
        updated = await Attendance.findByIdAndUpdate(id, { $set: updateData }, { new: true });
      } catch (e) {}
    }

    const idx = memoryAttendances.findIndex((a) => a._id === id || a.id === id);
    if (idx !== -1) {
      memoryAttendances[idx] = {
        ...memoryAttendances[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      if (!updated) updated = memoryAttendances[idx];
    }

    return updated;
  }

  async delete(id) {
    let deleted = false;
    if (getIsConnected()) {
      try {
        const res = await Attendance.findByIdAndDelete(id);
        if (res) deleted = true;
      } catch (e) {}
    }

    const initialLen = memoryAttendances.length;
    memoryAttendances = memoryAttendances.filter((a) => a._id !== id && a.id !== id);
    if (memoryAttendances.length < initialLen) deleted = true;

    return deleted;
  }

  async findCorrections() {
    if (getIsConnected()) {
      return await Attendance.find({ correctionStatus: { $in: ['Requested', 'Approved', 'Refused'] } }).sort({ updatedAt: -1 });
    }
    return memoryAttendances
      .filter((a) => ['Requested', 'Approved', 'Refused'].includes(a.correctionStatus))
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }
}

module.exports = new AttendanceRepository();
