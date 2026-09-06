const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { User } = require('./modules/auth/auth.model');
const { Contract } = require('./modules/contracts/contract.model');
const { Attendance } = require('./modules/attendance/attendance.model');
const { TimeOffRequest } = require('./modules/timeoff/timeoff-request.model');
const { TimeOffType } = require('./modules/timeoff/timeoff-type.model');
const { Allocation: TimeOffAllocation } = require('./modules/timeoff/allocation.model');
const { SalaryStructure } = require('./modules/payroll/salary-structure.model');
const { SalaryRule } = require('./modules/payroll/salary-rule.model');
const { Payrun } = require('./modules/payroll/payrun.model');
const { Payslip } = require('./modules/payroll/payslip.model');
const Department = require('./modules/settings/department.model');

const ADMIN_EMAIL = 'jaiminvaghasiya9023@gmail.com';
const ADMIN_PASSWORD_RAW = 'admin123';

const PRESENTATION_USERS = [
  // 1. Executive Leadership & HR Operations (Permanent)
  {
    name: 'jemin vaghasiya',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD_RAW,
    role: 'Admin',
    department: 'Executive Management',
    jobPosition: 'Chief System Administrator',
    salary: 125000,
    employeeType: 'Permanent',
    contractStartDate: '',
    contractEndDate: '',
    contractDuration: '',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@peoplepay360.com',
    password: 'password123',
    role: 'HR Payroll Manager',
    department: 'HR',
    jobPosition: 'HR Payroll Manager',
    salary: 95000,
    employeeType: 'Permanent',
    contractStartDate: '',
    contractEndDate: '',
    contractDuration: '',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@peoplepay360.com',
    password: 'password123',
    role: 'HR Manager',
    department: 'HR',
    jobPosition: 'HR Manager',
    salary: 85000,
    employeeType: 'Permanent',
    contractStartDate: '',
    contractEndDate: '',
    contractDuration: '',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Neha Gupta',
    email: 'neha.gupta@peoplepay360.com',
    password: 'password123',
    role: 'HR Payroll User',
    department: 'HR',
    jobPosition: 'HR Payroll User',
    salary: 60000,
    employeeType: 'Permanent',
    contractStartDate: '',
    contractEndDate: '',
    contractDuration: '',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },

  // 2. Full-Time Permanent Employees
  {
    name: 'Rohit Verma',
    email: 'rohit.verma@peoplepay360.com',
    password: 'password123',
    role: 'Employee',
    department: 'IT',
    jobPosition: 'Full Stack Developer',
    salary: 90000,
    employeeType: 'Permanent',
    contractStartDate: '',
    contractEndDate: '',
    contractDuration: '',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@peoplepay360.com',
    password: 'password123',
    role: 'Employee',
    department: 'IT',
    jobPosition: 'Software Engineer',
    salary: 70000,
    employeeType: 'Permanent',
    contractStartDate: '',
    contractEndDate: '',
    contractDuration: '',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Rajesh Nair',
    email: 'rajesh.nair@peoplepay360.com',
    password: 'password123',
    role: 'Employee',
    department: 'Selling',
    jobPosition: 'Business Development Lead',
    salary: 85000,
    employeeType: 'Permanent',
    contractStartDate: '',
    contractEndDate: '',
    contractDuration: '',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@peoplepay360.com',
    password: 'password123',
    role: 'Employee',
    department: 'Selling',
    jobPosition: 'Account Manager',
    salary: 65000,
    employeeType: 'Permanent',
    contractStartDate: '',
    contractEndDate: '',
    contractDuration: '',
    photo: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Alok Joshi',
    email: 'alok.joshi@peoplepay360.com',
    password: 'password123',
    role: 'Employee',
    department: 'Finance',
    jobPosition: 'Financial Controller',
    salary: 110000,
    employeeType: 'Permanent',
    contractStartDate: '',
    contractEndDate: '',
    contractDuration: '',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
  },

  // 3. Contract-Based Fixed-Term Specialists
  {
    name: 'Ananya Iyer',
    email: 'ananya.iyer@peoplepay360.com',
    password: 'password123',
    role: 'Employee',
    department: 'IT',
    jobPosition: 'DevOps Engineer',
    salary: 95000,
    employeeType: 'Contract',
    contractStartDate: '2026-01-01',
    contractEndDate: '2026-12-31',
    contractDuration: '12 Months',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Pooja Deshmukh',
    email: 'pooja.deshmukh@peoplepay360.com',
    password: 'password123',
    role: 'Employee',
    department: 'IT',
    jobPosition: 'QA Specialist',
    salary: 55000,
    employeeType: 'Contract',
    contractStartDate: '2026-03-01',
    contractEndDate: '2026-09-30',
    contractDuration: '6 Months',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Karan Malhotra',
    email: 'karan.malhotra@peoplepay360.com',
    password: 'password123',
    role: 'Employee',
    department: 'Selling',
    jobPosition: 'Sales Executive',
    salary: 45000,
    employeeType: 'Contract',
    contractStartDate: '2026-02-01',
    contractEndDate: '2026-12-31',
    contractDuration: '11 Months',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Meera Kulkarni',
    email: 'meera.kulkarni@peoplepay360.com',
    password: 'password123',
    role: 'Employee',
    department: 'Finance',
    jobPosition: 'Payroll Accountant',
    salary: 65000,
    employeeType: 'Contract',
    contractStartDate: '2026-01-15',
    contractEndDate: '2026-12-31',
    contractDuration: '12 Months',
    photo: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Tanya Kapoor',
    email: 'tanya.kapoor@peoplepay360.com',
    password: 'password123',
    role: 'Employee',
    department: 'HR',
    jobPosition: 'HR Specialist',
    salary: 50000,
    employeeType: 'Contract',
    contractStartDate: '2026-04-01',
    contractEndDate: '2026-10-31',
    contractDuration: '7 Months',
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80'
  }
];

const DEPARTMENTS_DATA = [
  {
    name: 'IT',
    code: 'IT',
    description: 'Information Technology, Cloud Infrastructure & Software Engineering',
    color: '#3B82F6',
    headOfDepartment: 'CTO / Engineering Lead',
    positions: [
      { title: 'Software Engineer', code: 'SWE', level: 'Mid-Level', defaultSalary: 70000, description: 'Core application microservices and features.' },
      { title: 'Full Stack Developer', code: 'FSD', level: 'Senior', defaultSalary: 90000, description: 'End-to-end full stack architecture.' },
      { title: 'DevOps Engineer', code: 'DEVOPS', level: 'Senior', defaultSalary: 95000, description: 'Kubernetes, CI/CD and AWS infrastructure.' },
      { title: 'QA Specialist', code: 'QA', level: 'Mid-Level', defaultSalary: 55000, description: 'Automated regression testing and QA.' }
    ]
  },
  {
    name: 'Selling',
    code: 'SALES',
    description: 'Sales, Customer Acquisition, Enterprise Partnerships & Revenue Growth',
    color: '#10B981',
    headOfDepartment: 'VP of Sales',
    positions: [
      { title: 'Sales Executive', code: 'SE', level: 'Mid-Level', defaultSalary: 45000, description: 'Outbound sales and software demos.' },
      { title: 'Account Manager', code: 'AM', level: 'Senior', defaultSalary: 65000, description: 'Enterprise client relationships and renewals.' },
      { title: 'Business Development Lead', code: 'BDL', level: 'Lead', defaultSalary: 85000, description: 'Strategic revenue growth and partner deals.' }
    ]
  },
  {
    name: 'HR',
    code: 'HR',
    description: 'Human Resources, Talent Acquisition, People Operations & Payroll Administration',
    color: '#8B5CF6',
    headOfDepartment: 'Chief People Officer',
    positions: [
      { title: 'HR Manager', code: 'HRM', level: 'Manager', defaultSalary: 85000, description: 'People management and HR operations.' },
      { title: 'HR Payroll Manager', code: 'HRPM', level: 'Manager', defaultSalary: 95000, description: 'Payroll processing and compensation audits.' },
      { title: 'HR Payroll User', code: 'HRPU', level: 'Mid-Level', defaultSalary: 60000, description: 'Payrun calculations and timesheets.' },
      { title: 'HR Specialist', code: 'HRS', level: 'Mid-Level', defaultSalary: 50000, description: 'Employee engagement and onboarding.' }
    ]
  },
  {
    name: 'Finance',
    code: 'FIN',
    description: 'Corporate Financial Planning, Accounting, Statutory Audits & Budgeting',
    color: '#F59E0B',
    headOfDepartment: 'Chief Financial Officer',
    positions: [
      { title: 'Financial Controller', code: 'FC', level: 'Lead', defaultSalary: 110000, description: 'Corporate accounting, tax reporting and budgets.' },
      { title: 'Payroll Accountant', code: 'PA', level: 'Senior', defaultSalary: 65000, description: 'Statutory taxes, EPF and deductions.' }
    ]
  }
];

async function seedPresentationData() {
  console.log('=======================================================');
  console.log('🚀 PeoplePay360: Generating Presentation Dataset (10-20 Records/Screen)');
  console.log('=======================================================');

  const isConnected = await connectDB();
  if (!isConnected) {
    console.error('❌ Could not connect to MongoDB. Please ensure MongoDB is running.');
    process.exit(1);
  }

  try {
    // 1. Clean previous presentation/test data
    console.log('🧹 Purging outdated records...');
    await User.deleteMany({});
    await Contract.deleteMany({});
    await Attendance.deleteMany({});
    await TimeOffRequest.deleteMany({});
    await TimeOffAllocation.deleteMany({});
    await TimeOffType.deleteMany({});
    await Payrun.deleteMany({});
    await Payslip.deleteMany({});
    await Department.deleteMany({});
    console.log('✅ Collections reset cleanly.');

    // 2. Seed Departments
    console.log('🏢 Seeding Organization Departments & Positions...');
    for (const d of DEPARTMENTS_DATA) {
      await Department.create(d);
    }
    console.log(`✅ ${DEPARTMENTS_DATA.length} Departments seeded.`);

    // 3. Seed Users
    console.log('👥 Seeding 14 Users across all roles & departments...');
    const createdUsers = [];
    for (const u of PRESENTATION_USERS) {
      const isContract = u.employeeType === 'Contract';
      const userDoc = await User.create({
        name: u.name,
        email: u.email.toLowerCase(),
        password: u.password,
        role: u.role,
        department: u.department,
        jobPosition: u.jobPosition,
        salary: u.salary,
        employeeType: isContract ? 'Contract' : 'Permanent',
        contractStartDate: isContract ? (u.contractStartDate || '') : '',
        contractEndDate: isContract ? (u.contractEndDate || '') : '',
        contractDuration: isContract ? (u.contractDuration || '') : '',
        photo: u.photo,
        status: 'ACTIVE',
        createdByName: 'jemin vaghasiya'
      });
      createdUsers.push({ ...u, _id: userDoc._id, employeeType: isContract ? 'Contract' : 'Permanent' });
    }
    console.log(`✅ ${createdUsers.length} Users seeded. System Admin: ${ADMIN_EMAIL}`);

    // 4. Ensure Salary Structure & Rules exist
    let salaryStructure = await SalaryStructure.findOne({ $or: [{ isDefault: true }, { code: 'REGULAR_SALARY' }] });
    if (!salaryStructure) {
      salaryStructure = await SalaryStructure.create({
        name: 'Regular Salary',
        code: 'REGULAR_SALARY',
        description: 'Standard sequence-driven corporate compensation structure',
        isDefault: true,
        active: true
      });
    }

    // 5. Seed Contracts for each user
    console.log('📑 Seeding 14 Employment Contracts...');
    const createdContracts = [];
    for (let i = 0; i < createdUsers.length; i++) {
      const u = createdUsers[i];
      const deptCode = (u.department || 'GEN').toUpperCase().substring(0, 3);
      const contractRef = `CON-2026-${deptCode}-${String(i + 1).padStart(3, '0')}`;
      const isContract = u.employeeType === 'Contract';

      const contractDoc = await Contract.create({
        employeeId: u._id,
        employeeName: u.name,
        employeeEmail: u.email,
        employeeType: u.employeeType || 'Permanent',
        department: u.department,
        jobPosition: u.jobPosition,
        contractRef: contractRef,
        contractName: `${u.name} - ${isContract ? 'Fixed-Term Contract' : 'Permanent Employment Agreement'}`,
        wage: u.salary || 65000,
        wageType: 'Monthly',
        salaryStructureId: salaryStructure._id,
        salaryStructureName: salaryStructure.name,
        startDate: isContract && u.contractStartDate ? new Date(u.contractStartDate) : new Date('2026-01-01'),
        endDate: isContract && u.contractEndDate ? new Date(u.contractEndDate) : null,
        status: 'RUNNING',
        workingSchedule: 'Standard 40h/week (Mon-Fri 09:00 - 18:00)',
        bankName: ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'][i % 4],
        bankAccountNumber: `50100${Math.floor(1000000 + Math.random() * 9000000)}`,
        bankIFSC: ['HDFC0001234', 'ICIC0005678', 'SBIN0009988', 'UTIB0003322'][i % 4],
        panNumber: `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`,
        taxId: `TX-2026-${String(i + 1).padStart(3, '0')}`,
        createdBy: 'jemin vaghasiya'
      });
      createdContracts.push(contractDoc);
    }
    console.log(`✅ ${createdContracts.length} Active Contracts seeded.`);

    // 6. Seed Attendance (18 Records across recent workdays)
    console.log('⏰ Seeding 18 Attendance Records...');
    const attendanceRecords = [
      { userIdx: 4, date: '2026-09-04', checkIn: '08:55', checkOut: '18:05', status: 'Present', hours: 9.1 },
      { userIdx: 5, date: '2026-09-04', checkIn: '09:02', checkOut: '18:12', status: 'Present', hours: 9.1 },
      { userIdx: 6, date: '2026-09-04', checkIn: '09:25', checkOut: '18:00', status: 'Late', hours: 8.5 },
      { userIdx: 7, date: '2026-09-04', checkIn: '08:50', checkOut: '18:00', status: 'Present', hours: 9.1 },
      { userIdx: 8, date: '2026-09-04', checkIn: '09:12', checkOut: '18:30', status: 'Present', hours: 9.3 },
      { userIdx: 9, date: '2026-09-04', checkIn: '09:05', checkOut: '17:55', status: 'Present', hours: 8.8 },
      { userIdx: 10, date: '2026-09-04', checkIn: '09:40', checkOut: '18:15', status: 'Late', hours: 8.5 },
      { userIdx: 11, date: '2026-09-04', checkIn: '08:45', checkOut: '18:00', status: 'Present', hours: 9.2 },
      { userIdx: 12, date: '2026-09-04', checkIn: '09:00', checkOut: '18:00', status: 'Present', hours: 9.0 },
      { userIdx: 13, date: '2026-09-04', checkIn: '09:10', checkOut: '18:10', status: 'Present', hours: 9.0 },
      { userIdx: 1, date: '2026-09-05', checkIn: '08:58', checkOut: '18:02', status: 'Present', hours: 9.0 },
      { userIdx: 2, date: '2026-09-05', checkIn: '09:00', checkOut: '18:00', status: 'Present', hours: 9.0 },
      { userIdx: 3, date: '2026-09-05', checkIn: '09:05', checkOut: '18:15', status: 'Present', hours: 9.1 },
      { userIdx: 4, date: '2026-09-05', checkIn: '08:52', checkOut: '18:00', status: 'Present', hours: 9.1 },
      { userIdx: 5, date: '2026-09-05', checkIn: '09:18', checkOut: '18:25', status: 'Late', hours: 9.1 },
      { userIdx: 6, date: '2026-09-05', checkIn: '08:48', checkOut: '18:05', status: 'Present', hours: 9.2 },
      { userIdx: 7, date: '2026-09-05', checkIn: '09:30', checkOut: '14:00', status: 'Half Day', hours: 4.5 },
      { userIdx: 8, date: '2026-09-05', checkIn: '09:01', checkOut: '18:08', status: 'Present', hours: 9.1 }
    ];

    for (const att of attendanceRecords) {
      const u = createdUsers[att.userIdx];
      const checkInDate = new Date(`${att.date}T${att.checkIn}:00.000Z`);
      const checkOutDate = att.checkOut ? new Date(`${att.date}T${att.checkOut}:00.000Z`) : null;

      await Attendance.create({
        employeeId: u._id,
        employeeName: u.name,
        employeeEmail: u.email,
        department: u.department,
        jobPosition: u.jobPosition,
        date: att.date,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        workedHours: att.hours,
        totalHours: att.hours,
        status: att.status,
        scheduledHours: 8.0,
        breakHours: 1.0,
        workingSchedule: 'Standard 40h/week'
      });
    }
    console.log(`✅ 18 Attendance records seeded.`);

    // 7. Seed Time Off Types & 12 Leave Requests
    console.log('🌴 Seeding Time Off Types & 12 Leave Requests...');
    let paidType = await TimeOffType.findOne({ $or: [{ code: 'PAID' }, { name: 'Paid Time Off' }] });
    if (!paidType) {
      paidType = await TimeOffType.create({ name: 'Paid Time Off', code: 'PAID', defaultDays: 20, color: '#3B82F6' });
    }
    let sickType = await TimeOffType.findOne({ $or: [{ code: 'SICK' }, { name: 'Sick Leave' }] });
    if (!sickType) {
      sickType = await TimeOffType.create({ name: 'Sick Leave', code: 'SICK', defaultDays: 10, color: '#EF4444' });
    }
    let casualType = await TimeOffType.findOne({ $or: [{ code: 'CASUAL' }, { name: 'Casual Leave' }] });
    if (!casualType) {
      casualType = await TimeOffType.create({ name: 'Casual Leave', code: 'CASUAL', defaultDays: 8, color: '#10B981' });
    }

    const leaveRequests = [
      { userIdx: 4, type: paidType, start: '2026-09-15', end: '2026-09-18', days: 4, reason: 'Annual family vacation to Himachal Pradesh', status: 'Approved' },
      { userIdx: 5, type: sickType, start: '2026-09-08', end: '2026-09-09', days: 2, reason: 'High viral fever and doctor mandated rest', status: 'Approved' },
      { userIdx: 6, type: casualType, start: '2026-09-11', end: '2026-09-11', days: 1, reason: 'Urgent municipal document registration', status: 'Approved' },
      { userIdx: 7, type: paidType, start: '2026-09-22', end: '2026-09-24', days: 3, reason: 'Attending cousin wedding in Jaipur', status: 'Approved' },
      { userIdx: 8, type: casualType, start: '2026-09-18', end: '2026-09-18', days: 1, reason: 'Vehicle registration & annual RTO inspection', status: 'Approved' },
      { userIdx: 9, type: sickType, start: '2026-09-02', end: '2026-09-03', days: 2, reason: 'Dental root canal treatment', status: 'Approved' },
      { userIdx: 10, type: paidType, start: '2026-09-28', end: '2026-09-30', days: 3, reason: 'Personal travel & downtime', status: 'Pending' },
      { userIdx: 11, type: casualType, start: '2026-09-14', end: '2026-09-14', days: 1, reason: 'Apartment agreement signing', status: 'Approved' },
      { userIdx: 12, type: sickType, start: '2026-09-10', end: '2026-09-10', days: 1, reason: 'Migraine and vision checkup', status: 'Pending' },
      { userIdx: 13, type: paidType, start: '2026-09-25', end: '2026-09-26', days: 2, reason: 'Family engagement function', status: 'Approved' },
      { userIdx: 1, type: casualType, start: '2026-09-16', end: '2026-09-16', days: 1, reason: 'Personal family emergency', status: 'Approved' },
      { userIdx: 2, type: paidType, start: '2026-09-29', end: '2026-10-01', days: 3, reason: 'Festival holidays & homecoming', status: 'Pending' }
    ];

    for (const lr of leaveRequests) {
      const u = createdUsers[lr.userIdx];
      await TimeOffRequest.create({
        employee: u._id,
        employeeName: u.name,
        employeeEmail: u.email,
        department: u.department,
        timeOffType: lr.type._id,
        timeOffTypeName: lr.type.name,
        timeOffTypeCode: lr.type.code,
        startDate: new Date(lr.start),
        endDate: new Date(lr.end),
        days: lr.days,
        duration: lr.days,
        unit: 'Days',
        reason: lr.reason,
        status: lr.status,
        auditTrail: [
          {
            action: lr.status === 'Approved' ? 'APPROVED' : 'SUBMITTED',
            performedByName: 'jemin vaghasiya',
            timestamp: new Date()
          }
        ]
      });
    }
    console.log(`✅ 12 Time Off Requests seeded.`);

    // 8. Seed Payroll Operations: 2 Batches + 14 Detailed Payslips
    console.log('💰 Seeding Payroll Batches & Payslips...');
    
    // Batch 1: August 2026 (Paid)
    const payrunAugust = await Payrun.create({
      name: 'August 2026 Regular Payrun',
      batchReference: 'PAY-2026-08-REG',
      salaryStructureId: salaryStructure._id,
      salaryStructureName: salaryStructure.name,
      periodStart: new Date('2026-08-01'),
      periodEnd: new Date('2026-08-31'),
      periodName: 'August 2026',
      paymentDate: new Date('2026-08-31'),
      status: 'Paid',
      selectedEmployeeIds: createdUsers.map(u => u._id),
      totalEmployees: createdUsers.length,
      totalGross: 0,
      totalNet: 0,
      totalDeductions: 0,
      payslipCount: createdUsers.length,
      warningsCount: 0,
      warnings: [],
      createdBy: 'jemin vaghasiya'
    });

    // Batch 2: September 2026 (Computed)
    const payrunSept = await Payrun.create({
      name: 'September 2026 Regular Payrun',
      batchReference: 'PAY-2026-09-REG',
      salaryStructureId: salaryStructure._id,
      salaryStructureName: salaryStructure.name,
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-09-30'),
      periodName: 'September 2026',
      paymentDate: new Date('2026-09-30'),
      status: 'Computed',
      selectedEmployeeIds: createdUsers.map(u => u._id),
      totalEmployees: createdUsers.length,
      totalGross: 0,
      totalNet: 0,
      totalDeductions: 0,
      payslipCount: createdUsers.length,
      warningsCount: 0,
      warnings: [],
      createdBy: 'jemin vaghasiya'
    });

    let augTotalGross = 0;
    let augTotalNet = 0;
    let augTotalDed = 0;

    let septTotalGross = 0;
    let septTotalNet = 0;
    let septTotalDed = 0;

    for (let i = 0; i < createdUsers.length; i++) {
      const u = createdUsers[i];
      const wage = u.salary || 65000;
      const basic = Math.round(wage * 0.5);
      const hra = Math.round(wage * 0.2);
      const allowance = wage - basic - hra;
      const gross = wage;
      const epf = Math.round(basic * 0.12);
      const pt = 200;
      const deductions = epf + pt;
      const net = gross - deductions;

      const lines = [
        { ruleCode: 'BASIC', ruleName: 'Basic Salary', category: 'Basic', sequence: 10, amount: basic, description: '50% of monthly base wage' },
        { ruleCode: 'HRA', ruleName: 'House Rent Allowance (HRA)', category: 'Allowance', sequence: 20, amount: hra, description: '40% of Basic wage' },
        { ruleCode: 'SPECIAL_ALLOW', ruleName: 'Special Standard Allowance', category: 'Allowance', sequence: 30, amount: allowance, description: 'Flexible corporate allowance' },
        { ruleCode: 'GROSS', ruleName: 'Gross Earnings', category: 'Gross', sequence: 40, amount: gross, description: 'Total gross payable before statutory deductions' },
        { ruleCode: 'EPF', ruleName: 'Employee Provident Fund (EPF)', category: 'Deduction', sequence: 50, amount: epf, description: '12% of Basic salary statutory deduction' },
        { ruleCode: 'PT', ruleName: 'Professional Tax', category: 'Deduction', sequence: 60, amount: pt, description: 'State statutory professional tax' },
        { ruleCode: 'NET', ruleName: 'Net Take-Home Salary', category: 'Net', sequence: 70, amount: net, description: 'Final payable net take-home salary' }
      ];

      // August Payslip
      await Payslip.create({
        payslipNumber: `SLIP-2026-08-${String(i + 1).padStart(3, '0')}`,
        payrunId: payrunAugust._id,
        payrunName: payrunAugust.name,
        employeeId: u._id,
        employeeName: u.name,
        employeeEmail: u.email,
        department: u.department,
        jobPosition: u.jobPosition,
        contractId: createdContracts[i]._id,
        contractRef: createdContracts[i].contractRef,
        contractName: createdContracts[i].contractName,
        baseWage: wage,
        salaryStructureId: salaryStructure._id,
        salaryStructureName: salaryStructure.name,
        periodStart: payrunAugust.periodStart,
        periodEnd: payrunAugust.periodEnd,
        periodName: payrunAugust.periodName,
        paymentDate: payrunAugust.paymentDate,
        totalWorkingDays: 22,
        workedDays: 22,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        overtimeHours: 0,
        basic: basic,
        basicSalary: basic,
        allowances: allowance + hra,
        gross: gross,
        grossSalary: gross,
        deductions: deductions,
        totalDeductions: deductions,
        net: net,
        netSalary: net,
        status: 'Paid',
        lines: lines,
        bankName: createdContracts[i].bankName,
        bankAccountNumber: createdContracts[i].bankAccountNumber,
        bankIFSC: createdContracts[i].bankIFSC,
        panNumber: createdContracts[i].panNumber
      });
      augTotalGross += gross;
      augTotalNet += net;
      augTotalDed += deductions;

      // September Payslip
      await Payslip.create({
        payslipNumber: `SLIP-2026-09-${String(i + 1).padStart(3, '0')}`,
        payrunId: payrunSept._id,
        payrunName: payrunSept.name,
        employeeId: u._id,
        employeeName: u.name,
        employeeEmail: u.email,
        department: u.department,
        jobPosition: u.jobPosition,
        contractId: createdContracts[i]._id,
        contractRef: createdContracts[i].contractRef,
        contractName: createdContracts[i].contractName,
        baseWage: wage,
        salaryStructureId: salaryStructure._id,
        salaryStructureName: salaryStructure.name,
        periodStart: payrunSept.periodStart,
        periodEnd: payrunSept.periodEnd,
        periodName: payrunSept.periodName,
        paymentDate: payrunSept.paymentDate,
        totalWorkingDays: 22,
        workedDays: 22,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        overtimeHours: 0,
        basic: basic,
        basicSalary: basic,
        allowances: allowance + hra,
        gross: gross,
        grossSalary: gross,
        deductions: deductions,
        totalDeductions: deductions,
        net: net,
        netSalary: net,
        status: 'Computed',
        lines: lines,
        bankName: createdContracts[i].bankName,
        bankAccountNumber: createdContracts[i].bankAccountNumber,
        bankIFSC: createdContracts[i].bankIFSC,
        panNumber: createdContracts[i].panNumber
      });
      septTotalGross += gross;
      septTotalNet += net;
      septTotalDed += deductions;
    }

    payrunAugust.totalGross = augTotalGross;
    payrunAugust.totalNet = augTotalNet;
    payrunAugust.totalDeductions = augTotalDed;
    await payrunAugust.save();

    payrunSept.totalGross = septTotalGross;
    payrunSept.totalNet = septTotalNet;
    payrunSept.totalDeductions = septTotalDed;
    await payrunSept.save();

    console.log(`✅ 2 Payrun Batches & 28 Payslips generated with full calculations.`);
    console.log(`   Monthly Gross Outlay: ₹${septTotalGross.toLocaleString()}`);
    console.log(`   Monthly Net Disbursed: ₹${septTotalNet.toLocaleString()}`);

    console.log('=======================================================');
    console.log('🎉 PRESENTATION SEEDING SUCCESSFULLY COMPLETED!');
    console.log('=======================================================');
    console.log(`👑 PRIMARY SYSTEM ADMIN:`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD_RAW}`);
    console.log('=======================================================');
    console.log(`📊 TOTAL RECORDS SUMMARY:`);
    console.log(`   - Users:        14 Active Profiles`);
    console.log(`   - Contracts:    14 Bound & Active`);
    console.log(`   - Attendance:   18 Time Logs`);
    console.log(`   - Leave:        12 Requests (Approved & Pending)`);
    console.log(`   - Payroll:      2 Payruns + 28 Payslips`);
    console.log(`   - Departments:  4 Departments + 16 Job Positions`);
    console.log('=======================================================');

  } catch (error) {
    console.error('❌ Error during presentation seeding:', error);
  } finally {
    await mongoose.connection.close();
    console.log('[Seed Script] Database connection closed.');
    process.exit(0);
  }
}

seedPresentationData();
