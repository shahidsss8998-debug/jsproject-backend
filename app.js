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

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  process.exit(1);
}

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log incoming requests (Removed logging)
app.use((req, res, next) => {
  next();
});

// Routes
app.use('/api', apiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    // MongoDB connection failed. Running with in-memory fallback.
  }
};

// Verify email transporter on startup
const verifyEmailTransporter = async () => {
  try {
    await emailService.verify();
  } catch (error) {
    // Email functionality is disabled
  }
};

connectDB();
verifyEmailTransporter();

app.listen(PORT, () => {
});

// Graceful shutdown
process.on('SIGINT', () => {
  emailService.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  emailService.close();
  process.exit(0);
});
