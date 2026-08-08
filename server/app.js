const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const roomRoutes = require('./routes/roomRoutes');
const guestRoutes = require('./routes/guestRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const billRoutes = require('./routes/billRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), message: 'Hotel Management System Backend API is active' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/reports', reportRoutes);

// Error Handler
app.use(errorHandler);

// Start Server with keep-alive socket timeout configuration to prevent Vite proxy socket hangup
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` Hotel Management API Server running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` MySQL Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}`);
    console.log(`=======================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`=======================================================`);
      console.warn(` ⚠️  Port ${PORT} is already in use by a running process.`);
      console.warn(` An existing backend server is already active on port ${PORT}.`);
      console.warn(`=======================================================`);
      process.exit(1);
    }
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

module.exports = app;
