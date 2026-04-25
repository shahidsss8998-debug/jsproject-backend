require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const apiRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

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
    console.log('🔍 Verifying email transporter...');
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    console.error('❌ Please check EMAIL_USER and EMAIL_PASS in environment variables');
  }
};

connectDB();
verifyEmailTransporter();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
