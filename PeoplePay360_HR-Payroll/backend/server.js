require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/employees', require('./modules/employees/employee.routes'));
app.use('/api/timeoff', require('./modules/timeoff/timeoff.routes'));

// System Health Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'PeoplePay360 HR & Payroll Backend API',
    timestamp: new Date().toISOString()
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const isConnected = await connectDB();
  if (isConnected) {
    const { seedDefaultTimeOffTypes } = require('./modules/timeoff/timeoff.service');
    await seedDefaultTimeOffTypes();
  }
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 PeoplePay360 Backend running on http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
};

startServer();
