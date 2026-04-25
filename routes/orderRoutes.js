const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const Menu = require('../models/Menu');

// Define BASE_URL with strict production fallback
const BASE_URL = process.env.BASE_URL || 'https://spoonful-backend.onrender.com';

console.log('🌐 Production BASE_URL:', BASE_URL);

// GET /api/order/test -> Simple test route to confirm backend is working
router.get('/order/test', (req, res) => {
  console.log('GET /api/order/test hit - Testing backend health');
  res.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    routes: ['/api/order/test', '/api/order/send-order', '/api/order/approve', '/api/order/reject', '/api/menu']
  });
});

// Hardcoded menu fallback data
const fallbackMenu = [
  { name: "Truffle Mushroom Risotto", description: "Creamy Arborio rice with wild mushrooms and black truffle oil.", price: 450, category: "Main Course", image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=800", isFeatured: true },
  { name: "Crispy Calamari", description: "Freshly battered calamari served with spicy marinara sauce.", price: 320, category: "Starters", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=800", isFeatured: true },
  { name: "Pan-Seared Salmon", description: "Atlantic salmon with asparagus and lemon-butter sauce.", price: 580, category: "Main Course", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800", isFeatured: false },
  { name: "Signature Tiramisu", description: "Espresso-soaked ladyfingers with whipped mascarpone and cocoa.", price: 280, category: "Desserts", image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=800", isFeatured: true }
];

// GET /api/menu -> Fetch all menu items
router.get('/menu', async (req, res) => {
  console.log('GET /api/menu hit - Fetching menu items');
  try {
    const items = await Menu.find({});
    if (items && items.length > 0) {
      console.log(`✅ Success: Found ${items.length} menu items in DB`);
      return res.json(items);
    }
    console.warn('⚠️ Warning: No items found in DB, using fallback');
    res.json(fallbackMenu);
  } catch (error) {
    console.error('❌ Database error fetching menu:', error.message);
    console.log('💡 Serving fail-safe fallback menu');
    res.json(fallbackMenu);
  }
});

// POST /api/order/send-order -> Send order to admin
router.post('/order/send-order', async (req, res) => {
  console.log('POST /api/order/send-order hit - Sending order email');
  try {
    const { name, emails, phone, place, date, time, cartItems, totalAmount } = req.body;

    if (!place) {
      return res.status(400).json({ message: 'Place (location) is required' });
    }

    const adminHtml = `
      <div style="background-color: #0f172a; color: #f8f8f8; padding: 40px; font-family: sans-serif; border-radius: 16px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #facc15; text-align: center; font-style: italic;">New Order Received!</h1>

        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-top: 20px; border: 1px solid rgba(250, 204, 21, 0.2);">
          <h2 style="color: #facc15; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; font-size: 18px;">Customer Information</h2>
          <p style="margin: 8px 0;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 8px 0;"><strong>Emails:</strong> ${emails.join(', ')}</p>
          <p style="margin: 8px 0;"><strong>Phone:</strong> ${phone}</p>
          <p style="margin: 8px 0;"><strong>Place:</strong> ${place}</p>
          <p style="margin: 8px 0;"><strong>Date & Time:</strong> ${date} at ${time}</p>
        </div>

        <div style="margin-top: 30px;">
          <h2 style="color: #facc15; font-size: 18px;">Order Items</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; color: #f8f8f8;">
            <thead>
              <tr style="border-bottom: 2px solid rgba(250, 204, 21, 0.3);">
                <th style="text-align: left; padding: 10px;">Item</th>
                <th style="text-align: center; padding: 10px;">Qty</th>
                <th style="text-align: right; padding: 10px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${cartItems.map(item => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 10px;">${item.name}</td>
                  <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                  <td style="padding: 10px; text-align: right;">₹${(item.price * item.quantity).toFixed(0)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 20px 10px; font-size: 18px; font-weight: bold;">Total Amount</td>
                <td style="padding: 20px 10px; font-size: 20px; font-weight: bold; color: #facc15; text-align: right;">₹${totalAmount.toFixed(0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="margin-top: 40px; text-align: center;">
          <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
            <tr>
              <td align="center" style="padding: 10px;">
                <a href="${BASE_URL}/api/order/approve?emails=${encodeURIComponent(emails.join(','))}&name=${encodeURIComponent(name)}&date=${date}&time=${time}&place=${encodeURIComponent(place)}"
                   style="display: inline-block; background-color: #22c55e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                   ✅ Approve
                </a>
              </td>
              <td align="center" style="padding: 10px;">
                <a href="${BASE_URL}/api/order/reject?emails=${encodeURIComponent(emails.join(','))}&name=${encodeURIComponent(name)}&date=${date}&time=${time}&place=${encodeURIComponent(place)}"
                   style="display: inline-block; background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                   ❌ Reject
                </a>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `;

    const emailResult = await emailService.sendEmail(process.env.EMAIL_USER, `New Order from ${name}`, adminHtml);

    if (emailResult.success) {
      return res.status(200).json({ message: 'Order sent to admin successfully' });
    } else {
      return res.status(200).json({
        message: 'Order received but admin notification email failed.',
        warning: 'Email failure',
        error: emailResult.error
      });
    }
  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const sendApprovalResponse = async (req, res) => {
  try {
    const { emails, name, date, time, place } = req.query;
    const emailsArray = emails ? decodeURIComponent(emails).split(',').map(e => e.trim()).filter(e => e.length > 0) : [];

    if (emailsArray.length === 0) {
      return res.status(400).send('<h1>Error: No valid customer email found.</h1>');
    }

    const approvalHtml = `
      <div style="background-color: #f0fdf4; color: #166534; padding: 40px; font-family: sans-serif; border-radius: 16px; border: 1px solid #bbf7d0; text-align: center; max-width: 600px; margin: 20px auto;">
        <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
        <h1 style="color: #15803d; margin-bottom: 10px;">Order Approved!</h1>
        <p style="font-size: 18px; margin-bottom: 30px;">Hello <strong>${name || 'Customer'}</strong>,</p>
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Transaction Was Successful. Your booking for <strong>${date || 'your chosen date'}</strong> at <strong>${time || 'chosen time'}</strong> in <strong>${place || 'your chosen place'}</strong> has been <strong>Confirmed</strong>.
          </p>
        </div>
        <p style="margin-top: 30px; color: #166534; opacity: 0.7; font-size: 14px;">Spoonful Restaurant</p>
      </div>
    `;

    const emailResults = [];
    for (const email of emailsArray) {
      const result = await emailService.sendEmail(email, 'Your Order Successful ✅', approvalHtml);
      emailResults.push({ email, success: result.success });
    }

    const allSuccessful = emailResults.every(r => r.success);
    res.send(`
      <html>
        <body style="font-family: sans-serif; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: white; padding: 50px; border-radius: 20px; text-align: center; border-top: 8px solid #22c55e;">
            <h1>${allSuccessful ? 'Order Approved' : 'Approved with Warnings'}</h1>
            <p>The customer has been notified.</p>
            <a href="javascript:window.close()">Close Tab</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('<h1>Internal server error.</h1>');
  }
};

router.get('/order/approve', sendApprovalResponse);
router.post('/order/approve', sendApprovalResponse);

const sendRejectResponse = async (req, res) => {
  try {
    const { emails, name, date } = req.query;
    const emailsArray = emails ? decodeURIComponent(emails).split(',').map(e => e.trim()).filter(e => e.length > 0) : [];

    if (emailsArray.length === 0) {
      return res.status(400).send('<h1>Error: No valid customer email found.</h1>');
    }

    const rejectionHtml = `<div style="text-align: center;"><h1>Order Rejected</h1><p>Booking on ${date} was rejected.</p></div>`;
    
    for (const email of emailsArray) {
      await emailService.sendEmail(email, 'Order Update ❌', rejectionHtml);
    }

    res.send(`<h1>Order Rejected</h1><p>Customer has been notified.</p><a href="javascript:window.close()">Close Tab</a>`);
  } catch (error) {
    res.status(500).send('<h1>Internal server error.</h1>');
  }
};

router.get('/order/reject', sendRejectResponse);
router.post('/order/reject', sendRejectResponse);

module.exports = router;