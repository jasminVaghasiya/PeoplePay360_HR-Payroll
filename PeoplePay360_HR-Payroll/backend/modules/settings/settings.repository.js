const mongoose = require('mongoose');
const Department = require('./department.model');
const crypto = require('crypto');

const DEFAULT_DEPARTMENTS = [
  {
    _id: 'dept_it',
    name: 'IT',
    code: 'IT',
    description: 'Information Technology, Cloud Infrastructure & Software Engineering',
    color: '#3B82F6', // Vibrant Blue
    icon: 'Terminal',
    headOfDepartment: 'CTO / Engineering Lead',
    isActive: true,
    positions: [
      {
        _id: 'pos_it_1',
        title: 'Software Engineer',
        code: 'SWE',
        description: 'Design, develop, and maintain core software applications and microservices.',
        level: 'Mid-Level',
        defaultSalary: 70000
      },
      {
        _id: 'pos_it_2',
        title: 'Full Stack Developer',
        code: 'FSD',
        description: 'Build end-to-end features across React frontend and Node.js backend.',
        level: 'Senior',
        defaultSalary: 90000
      },
      {
        _id: 'pos_it_3',
        title: 'DevOps Engineer',
        code: 'DEVOPS',
        description: 'Manage CI/CD automation pipelines, cloud architecture, and system security.',
        level: 'Senior',
        defaultSalary: 95000
      },
      {
        _id: 'pos_it_4',
        title: 'QA Specialist',
        code: 'QA',
        description: 'Execute automated tests, end-to-end regression testing, and quality assurance.',
        level: 'Mid-Level',
        defaultSalary: 55000
      }
    ]
  },
  {
    _id: 'dept_selling',
    name: 'Selling',
    code: 'SALES',
    description: 'Sales, Customer Acquisition, Enterprise Partnerships & Revenue Growth',
    color: '#10B981', // Emerald Green
    icon: 'TrendingUp',
    headOfDepartment: 'VP of Sales',
    isActive: true,
    positions: [
      {
        _id: 'pos_sale_1',
        title: 'Sales Executive',
        code: 'SE',
        description: 'Drive outbound lead generation, demo products, and close client contracts.',
        level: 'Mid-Level',
        defaultSalary: 45000
      },
      {
        _id: 'pos_sale_2',
        title: 'Account Manager',
        code: 'AM',
        description: 'Cultivate ongoing client relationships, renewals, and upselling opportunities.',
        level: 'Senior',
        defaultSalary: 65000
      },
      {
        _id: 'pos_sale_3',
        title: 'Business Development Lead',
        code: 'BDL',
        description: 'Lead strategic enterprise client acquisitions and regional revenue expansion.',
        level: 'Lead',
        defaultSalary: 85000
      }
    ]
  },
  {
    _id: 'dept_hr',
    name: 'HR',
    code: 'HR',
    description: 'Human Resources, Talent Acquisition, People Operations & Payroll Administration',
    color: '#8B5CF6', // Purple
    icon: 'Users',
    headOfDepartment: 'Chief People Officer',
    isActive: true,
    positions: [
      {
        _id: 'pos_hr_1',
        title: 'HR Manager',
        code: 'HRM',
        description: 'Lead Human Resources operations, employee relations, policy enforcement, and talent management.',
        level: 'Manager',
        defaultSalary: 85000
      },
      {
        _id: 'pos_hr_2',
        title: 'HR Payroll Manager',
        code: 'HRPM',
        description: 'Direct payroll processing, statutory tax compliance, compensation structures, and audits.',
        level: 'Manager',
        defaultSalary: 95000
      },
      {
        _id: 'pos_hr_3',
        title: 'HR Payroll User',
        code: 'HRPU',
        description: 'Process monthly timesheets, wage calculations, payrun batches, and payslip distribution.',
        level: 'Mid-Level',
        defaultSalary: 60000
      },
      {
        _id: 'pos_hr_4',
        title: 'HR Specialist',
        code: 'HRS',
        description: 'Coordinate employee onboarding, workplace culture, and compliance.',
        level: 'Mid-Level',
        defaultSalary: 50000
      },
      {
        _id: 'pos_hr_5',
        title: 'Talent Acquisition Partner',
        code: 'TAP',
        description: 'Source, screen, and interview prospective talent across technical and sales departments.',
        level: 'Mid-Level',
        defaultSalary: 55000
      },
      {
        _id: 'pos_hr_6',
        title: 'Payroll Officer',
        code: 'PO',
        description: 'Oversee monthly payruns, statutory deductions, tax allowances, and payslip generation.',
        level: 'Senior',
        defaultSalary: 65000
      }
    ]
  }
];

let memoryDepartments = JSON.parse(JSON.stringify(DEFAULT_DEPARTMENTS));

class SettingsRepository {
  async getDepartments() {
    if (mongoose.connection.readyState === 1) {
      try {
        let count = await Department.countDocuments();
        if (count === 0) {
          // Seed defaults
          for (const d of DEFAULT_DEPARTMENTS) {
            const copy = { ...d };
            delete copy._id;
            copy.positions = copy.positions.map(p => {
              const pCopy = { ...p };
              delete pCopy._id;
              return pCopy;
            });
            await Department.create(copy);
          }
        } else {
          // Auto-sync missing default HR positions
          const hrDept = await Department.findOne({ code: 'HR' });
          if (hrDept) {
            const existingTitles = new Set((hrDept.positions || []).map(p => p.title.toLowerCase()));
            const hrDefault = DEFAULT_DEPARTMENTS.find(d => d.code === 'HR');
            const missing = (hrDefault?.positions || []).filter(p => !existingTitles.has(p.title.toLowerCase()));
            if (missing.length > 0) {
              for (const m of missing) {
                const mCopy = { ...m };
                delete mCopy._id;
                hrDept.positions.push(mCopy);
              }
              await hrDept.save();
            }
          }
        }
        return await Department.find({ isActive: { $ne: false } }).sort({ name: 1 }).lean();
      } catch (err) {
        console.error('SettingsRepository.getDepartments error, falling back to memory:', err.message);
      }
    }
    return memoryDepartments.filter(d => d.isActive !== false);
  }

  async findDepartmentById(id) {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        return await Department.findById(id).lean();
      } catch (err) {
        console.error('SettingsRepository.findDepartmentById error:', err.message);
      }
    }
    return memoryDepartments.find(d => String(d._id) === String(id) || d.code.toLowerCase() === String(id).toLowerCase());
  }

  async createDepartment(data) {
    if (mongoose.connection.readyState === 1) {
      try {
        const created = await Department.create({
          name: data.name,
          code: (data.code || data.name).toUpperCase().replace(/\s+/g, '_'),
          description: data.description || '',
          color: data.color || '#7C3AED',
          icon: data.icon || 'Building',
          headOfDepartment: data.headOfDepartment || '',
          positions: Array.isArray(data.positions) ? data.positions : []
        });
        return created.toObject();
      } catch (err) {
        console.error('SettingsRepository.createDepartment error, saving to memory:', err.message);
      }
    }

    const newDept = {
      _id: 'dept_' + Date.now(),
      name: data.name,
      code: (data.code || data.name).toUpperCase().replace(/\s+/g, '_'),
      description: data.description || '',
      color: data.color || '#7C3AED',
      icon: data.icon || 'Building',
      headOfDepartment: data.headOfDepartment || '',
      isActive: true,
      positions: Array.isArray(data.positions) ? data.positions : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryDepartments.push(newDept);
    return newDept;
  }

  async updateDepartment(id, data) {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const updated = await Department.findByIdAndUpdate(
          id,
          {
            $set: {
              ...(data.name && { name: data.name }),
              ...(data.code && { code: data.code.toUpperCase() }),
              ...(data.description !== undefined && { description: data.description }),
              ...(data.color && { color: data.color }),
              ...(data.icon && { icon: data.icon }),
              ...(data.headOfDepartment !== undefined && { headOfDepartment: data.headOfDepartment }),
              ...(data.isActive !== undefined && { isActive: data.isActive })
            }
          },
          { new: true }
        ).lean();
        if (updated) return updated;
      } catch (err) {
        console.error('SettingsRepository.updateDepartment error:', err.message);
      }
    }

    const idx = memoryDepartments.findIndex(d => String(d._id) === String(id));
    if (idx !== -1) {
      memoryDepartments[idx] = {
        ...memoryDepartments[idx],
        ...data,
        updatedAt: new Date()
      };
      return memoryDepartments[idx];
    }
    return null;
  }

  async deleteDepartment(id) {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        return await Department.findByIdAndDelete(id).lean();
      } catch (err) {
        console.error('SettingsRepository.deleteDepartment error:', err.message);
      }
    }

    const idx = memoryDepartments.findIndex(d => String(d._id) === String(id));
    if (idx !== -1) {
      const removed = memoryDepartments.splice(idx, 1);
      return removed[0];
    }
    return null;
  }

  async addPosition(deptId, positionData) {
    const posPayload = {
      title: positionData.title,
      code: (positionData.code || positionData.title).toUpperCase().replace(/\s+/g, '_').substring(0, 10),
      description: positionData.description || '',
      level: positionData.level || 'Mid-Level',
      defaultSalary: Number(positionData.defaultSalary) || 50000,
      createdAt: new Date()
    };

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(deptId)) {
      try {
        const updated = await Department.findByIdAndUpdate(
          deptId,
          { $push: { positions: posPayload } },
          { new: true }
        ).lean();
        if (updated) return updated;
      } catch (err) {
        console.error('SettingsRepository.addPosition error:', err.message);
      }
    }

    const dept = memoryDepartments.find(d => String(d._id) === String(deptId));
    if (dept) {
      if (!dept.positions) dept.positions = [];
      const newPos = {
        _id: 'pos_' + Date.now(),
        ...posPayload
      };
      dept.positions.push(newPos);
      dept.updatedAt = new Date();
      return dept;
    }
    return null;
  }

  async updatePosition(deptId, posId, positionData) {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(deptId)) {
      try {
        const updateFields = {};
        if (positionData.title) updateFields['positions.$.title'] = positionData.title;
        if (positionData.code) updateFields['positions.$.code'] = positionData.code;
        if (positionData.description !== undefined) updateFields['positions.$.description'] = positionData.description;
        if (positionData.level) updateFields['positions.$.level'] = positionData.level;
        if (positionData.defaultSalary !== undefined) updateFields['positions.$.defaultSalary'] = Number(positionData.defaultSalary);

        const updated = await Department.findOneAndUpdate(
          { _id: deptId, 'positions._id': posId },
          { $set: updateFields },
          { new: true }
        ).lean();
        if (updated) return updated;
      } catch (err) {
        console.error('SettingsRepository.updatePosition error:', err.message);
      }
    }

    const dept = memoryDepartments.find(d => String(d._id) === String(deptId));
    if (dept && dept.positions) {
      const posIdx = dept.positions.findIndex(p => String(p._id) === String(posId));
      if (posIdx !== -1) {
        dept.positions[posIdx] = {
          ...dept.positions[posIdx],
          ...positionData,
          ...(positionData.defaultSalary && { defaultSalary: Number(positionData.defaultSalary) })
        };
        dept.updatedAt = new Date();
        return dept;
      }
    }
    return null;
  }

  async deletePosition(deptId, posId) {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(deptId)) {
      try {
        const updated = await Department.findByIdAndUpdate(
          deptId,
          { $pull: { positions: { _id: posId } } },
          { new: true }
        ).lean();
        if (updated) return updated;
      } catch (err) {
        console.error('SettingsRepository.deletePosition error:', err.message);
      }
    }

    const dept = memoryDepartments.find(d => String(d._id) === String(deptId));
    if (dept && dept.positions) {
      dept.positions = dept.positions.filter(p => String(p._id) !== String(posId));
      dept.updatedAt = new Date();
      return dept;
    }
    return null;
  }
}

module.exports = new SettingsRepository();
