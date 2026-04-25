const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper to send emails
const sendEmail = async (to, subject, html) => {
  try {
    console.log('📧 Attempting to send email to:', to);
    console.log('📧 Subject:', subject);
    console.log('📧 Using EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'NOT SET');
    console.log('📧 Using EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set (length: ' + process.env.EMAIL_PASS.length + ')' : 'NOT SET');

    const result = await transporter.sendMail({
      from: `"Spoonful Restaurant" <${process.env.EMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      html
    });

    console.log('✅ Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ EMAIL ERROR:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error response:', error.response);
    console.error('❌ Error command:', error.command);
    return false;
  }
};

// GET /api/order/test -> Simple test route to confirm backend is working
router.get('/test', (req, res) => {
  console.log('GET /api/order/test hit - Testing backend health');
  res.json({ 
    message: 'Backend is working!', 
    timestamp: new Date().toISOString(),
    routes: ['/api/order/test', '/api/order/send-order', '/api/order/approve', '/api/order/reject', '/api/order/test-email']
  });
});

// POST /api/order/send-order -> Send order to admin
router.post('/send-order', async (req, res) => {
  console.log('POST /api/order/send-order hit - Sending order email');
  try {
    console.log("REQUEST BODY:", req.body);
    const { name, emails, phone, place, date, time, cartItems, totalAmount } = req.body;
    console.log("Place:", place);

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
                <a href="${process.env.BASE_URL}/api/order/approve?emails=${emails.join(',')}&name=${encodeURIComponent(name)}&date=${date}&time=${time}&place=${encodeURIComponent(place)}"
                   style="display: inline-block; background-color: #22c55e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                   ✅ Approve
                </a>
              </td>
              <td align="center" style="padding: 10px;">
                <a href="${process.env.BASE_URL}/api/order/reject?emails=${emails.join(',')}&name=${encodeURIComponent(name)}&date=${date}&time=${time}&place=${encodeURIComponent(place)}"
                   style="display: inline-block; background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                   ❌ Reject
                </a>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `;

    const success = await sendEmail(process.env.EMAIL_USER, `New Order from ${name}`, adminHtml);

    if (success) {
      res.status(200).json({ message: 'Order sent to admin' });
    } else {
      res.status(500).json({ message: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const extractOrderParams = (req) => {
  return req.method === 'POST' ? req.body : req.query;
};

const sendApprovalResponse = async (req, res) => {
  console.log(`${req.method} /api/order/approve hit - Method: ${req.method}, Params:`, extractOrderParams(req));
  try {
    const { emails, name, date, time, place } = extractOrderParams(req);
    const emailsArray = emails ? emails.split(',') : [];

    const approvalHtml = `
      <div style="background-color: #f0fdf4; color: #166534; padding: 40px; font-family: sans-serif; border-radius: 16px; border: 1px solid #bbf7d0; text-align: center; max-width: 600px; margin: 20px auto;">
        <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
        <h1 style="color: #15803d; margin-bottom: 10px;">Order Approved!</h1>
        <p style="font-size: 18px; margin-bottom: 30px;">Hello <strong>${name || 'Customer'}</strong>,</p>
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Transaction Was Successful. Your booking for <strong>${date || 'your chosen date'}</strong> at <strong>${time || 'chosen time'}</strong> in <strong>${place || 'your chosen place'}</strong> has been <strong>Confirmed</strong>.
          </p>
          <p style="font-size: 16px; margin-top: 20px; font-weight: bold; color: #15803d;">
            Thank You for Visiting our Website.
          </p>
        </div>
        <p style="margin-top: 30px; color: #166534; opacity: 0.7; font-size: 14px;">
          Spoonful Restaurant &bull; Culinary Excellence
        </p>
      </div>
    `;

    // Notify each customer individually
    for (const email of emailsArray) {
      await sendEmail(email.trim(), 'Your Order Successful ✅ - Spoonful Restaurant', approvalHtml);
    }

    const responsePage = `
      <html>
        <body style="font-family: sans-serif; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: white; padding: 50px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: center; border-top: 8px solid #22c55e;">
            <div style="font-size: 70px; margin-bottom: 20px;">✅</div>
            <h1 style="color: #1e293b; margin-bottom: 10px;">Order Approved</h1>
            <p style="color: #64748b; font-size: 18px;">Success! The customer has been notified via email.</p>
            <div style="margin-top: 30px;">
              <a href="javascript:window.close()" style="color: #22c55e; font-weight: bold; text-decoration: none;">Close Tab</a>
            </div>
          </div>
        </body>
      </html>
    `;

    res.send(responsePage);
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).send('<h1>Internal server error.</h1>');
  }
};

router.get('/approve', sendApprovalResponse);
router.post('/approve', sendApprovalResponse);

// POST /api/order/reject -> Reject order and notify customers
const sendRejectResponse = async (req, res) => {
  console.log(`${req.method} /api/order/reject hit - Method: ${req.method}, Params:`, extractOrderParams(req));
  try {
    const { emails, name, date, time } = extractOrderParams(req);
    const emailsArray = emails ? emails.split(',') : [];

    const rejectionHtml = `
      <div style="background-color: #fef2f2; color: #991b1b; padding: 40px; font-family: sans-serif; border-radius: 16px; border: 1px solid #fecaca; text-align: center; max-width: 600px; margin: 20px auto;">
        <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
        <h1 style="color: #b91c1c; margin-bottom: 10px;">Order Rejected</h1>
        <p style="font-size: 18px; margin-bottom: 30px;">Hello <strong>${name || 'Customer'}</strong>,</p>
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            You didn't make Payment for your booking on <strong>${date || 'the requested date'}</strong>. Your order was <strong>Rejected</strong>.
          </p>
          <p style="font-size: 16px; margin-top: 20px; font-weight: bold; color: #b91c1c;">
            Thank You for Visiting our Website.
          </p>
        </div>
        <p style="margin-top: 30px; color: #991b1b; opacity: 0.7; font-size: 14px;">
          Spoonful Restaurant &bull; Culinary Excellence
        </p>
      </div>
    `;

    // Notify each customer individually
    for (const email of emailsArray) {
      await sendEmail(email.trim(), 'Order Update ❌ - Spoonful Restaurant', rejectionHtml);
    }

    const responsePage = `
      <html>
        <body style="font-family: sans-serif; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: white; padding: 50px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: center; border-top: 8px solid #ef4444;">
            <div style="font-size: 70px; margin-bottom: 20px;">❌</div>
            <h1 style="color: #1e293b; margin-bottom: 10px;">Order Rejected</h1>
            <p style="color: #64748b; font-size: 18px;">Order has been rejected and customer has been notified.</p>
            <div style="margin-top: 30px;">
              <a href="javascript:window.close()" style="color: #ef4444; font-weight: bold; text-decoration: none;">Close Tab</a>
            </div>
          </div>
        </body>
      </html>
    `;

    res.send(responsePage);
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).send('<h1>Internal server error.</h1>');
  }
};

router.get('/reject', sendRejectResponse);
router.post('/reject', sendRejectResponse);

module.exports = router;