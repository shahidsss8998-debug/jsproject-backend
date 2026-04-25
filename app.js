// Load environment variables only in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const emailService = require('./services/emailService');
const apiRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Define BASE_URL with fallback
const BASE_URL = process.env.BASE_URL || 'https://spoonful-backend.onrender.com';

// Environment validation with detailed logging
console.log('🔧 Starting Spoonful Backend...');
console.log('🔧 NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('🔧 PORT:', PORT);
console.log('🔧 EMAIL_USER:', process.env.EMAIL_USER ? `${process.env.EMAIL_USER} (length: ${process.env.EMAIL_USER.length})` : 'NOT SET');
console.log('🔧 EMAIL_PASS:', process.env.EMAIL_PASS ? `Set (length: ${process.env.EMAIL_PASS.length})` : 'NOT SET');
console.log('🔧 MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
console.log('🔧 BASE_URL:', BASE_URL);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('❌ CRITICAL: Missing email credentials!');
  console.error('❌ EMAIL_USER and EMAIL_PASS must be set in environment variables');
  console.error('❌ For Gmail App Passwords:');
  console.error('❌ 1. Enable 2FA on your Gmail account');
  console.error('❌ 2. Generate an App Password: https://myaccount.google.com/apppasswords');
  console.error('❌ 3. Use the App Password (not your regular password) as EMAIL_PASS');
  process.exit(1);
}

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Content-Type: ${req.headers['content-type'] || 'none'}`);
  next();
});

// Routes
app.use('/api/order', apiRoutes);

// 404 Handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ message: "Route not found" });
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.warn('MongoDB connection failed. Running with in-memory fallback (data will not persist).');
  }
};

// Verify email transporter on startup
const verifyEmailTransporter = async () => {
  try {
    console.log('🔍 Verifying Gmail SMTP connection...');
    await emailService.verify();
    console.log('✅ Email service ready - Gmail authentication successful');
  } catch (error) {
    console.error('❌ EMAIL SERVICE INITIALIZATION FAILED');
    console.error('❌ This means emails will NOT work in production!');
    console.error('❌ Error details:', error.message);

    if (error.code === 'EAUTH') {
      console.error('❌ GMAIL AUTHENTICATION FAILED');
      console.error('❌ Possible causes:');
      console.error('❌ 1. Wrong EMAIL_USER or EMAIL_PASS');
      console.error('❌ 2. Not using Gmail App Password (required for Gmail)');
      console.error('❌ 3. 2FA not enabled on Gmail account');
      console.error('❌ 4. App Password expired or revoked');
      console.error('❌ Fix: Generate new App Password at https://myaccount.google.com/apppasswords');
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('❌ Cannot connect to Gmail SMTP servers');
      console.error('❌ Check internet connection and firewall settings');
    }

    console.error('❌ Server will continue but email functionality is DISABLED');
    console.error('❌ Check Render environment variables and redeploy if needed');
  }
};

connectDB();
verifyEmailTransporter();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  emailService.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  emailService.close();
  process.exit(0);
});
