require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const { assignRequestId, globalErrorHandler } = require('./middleware/globalErrorHandler');
const AppError = require('./errors/AppError');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(assignRequestId);

// Routes
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/employees', require('./modules/employees/employee.routes'));
app.use('/api/attendance', require('./modules/attendance/attendance.routes'));
app.use('/api/timeoff', require('./modules/timeoff/timeoff.routes'));
app.use('/api/payroll/structures', require('./modules/payroll/payroll.routes'));
app.use('/api/payroll', require('./modules/payroll/payroll.routes'));
app.use('/api/structures', require('./modules/payroll/payroll.routes'));
app.use('/api/contracts', require('./modules/contracts/contract.routes'));
app.use('/api/settings', require('./modules/settings/settings.routes'));
app.use('/api/departments', require('./modules/settings/settings.routes'));

// System Health Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'PeoplePay360 HR & Payroll Backend API',
    timestamp: new Date().toISOString()
  });
});

// 404 Route Handler
app.use((req, res, next) => {
  next(AppError.notFound(`Route '${req.originalUrl}' not found.`));
});

// Centralized Global Error Handler Middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const isConnected = await connectDB();
  if (isConnected) {
    const { seedDefaultTimeOffTypes } = require('./modules/timeoff/timeoff.service');
    await seedDefaultTimeOffTypes();

    const { bootstrapPayrollDefaults } = require('./modules/payroll/payroll.service');
    await bootstrapPayrollDefaults();
  }
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 PeoplePay360 Backend running on http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
};

startServer();
