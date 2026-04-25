const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const Menu = require('../models/Menu');

// Define BASE_URL with strict production fallback
const BASE_URL = process.env.BASE_URL || 'https://spoonful-backend.onrender.com';

// GET /api/order/test -> Simple test route to confirm backend is working
router.get('/order/test', (req, res) => {
  res.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    routes: ['/api/order/test', '/api/order/send-order', '/api/order/approve', '/api/order/reject', '/api/menu']
  });
});

// Full menu data from seed.js as a fail-safe fallback (with unique _ids for React keys)
const fallbackMenu = [
  { _id: "f1", name: "Truffle Mushroom Risotto", description: "Creamy Arborio rice with wild mushrooms and black truffle oil.", price: 450, category: "Main Course", image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=800", isFeatured: true },
  { _id: "f2", name: "Crispy Calamari", description: "Freshly battered calamari served with spicy marinara sauce.", price: 320, category: "Starters", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=800", isFeatured: true },
  { _id: "f3", name: "Pan-Seared Salmon", description: "Atlantic salmon with asparagus and lemon-butter sauce.", price: 580, category: "Main Course", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800", isFeatured: false },
  { _id: "f4", name: "Classic Bruschetta", description: "Toasted sourdough with vine-ripened tomatoes, garlic, and basil.", price: 280, category: "Starters", image: "https://images.unsplash.com/photo-1572656631137-7935297eff55?q=80&w=800", isFeatured: false },
  { _id: "f5", name: "Signature Tiramisu", description: "Espresso-soaked ladyfingers with whipped mascarpone and cocoa.", price: 350, category: "Desserts", image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=800", isFeatured: true },
  { _id: "f6", name: "Virgin Mojito", description: "Refreshing lime, fresh mint, and sparkling soda.", price: 180, category: "Drinks", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800", isFeatured: false },
  { _id: "f7", name: "Caprese Salad", description: "Buffalo mozzarella, heirloom tomatoes, balsamic glaze, and basil.", price: 290, category: "Starters", image: "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?q=80&w=800" },
  { _id: "f8", name: "Stuffed Mushrooms", description: "Button mushrooms filled with herbs, garlic, and three cheeses.", price: 260, category: "Starters", image: "https://images.unsplash.com/photo-1541014741259-de529411b96a?q=80&w=800" },
  { _id: "f9", name: "Shrimp Cocktail", description: "Jumbo chilled shrimp served with zesty cocktail sauce.", price: 420, category: "Starters", image: "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?q=80&w=800" },
  { _id: "f10", name: "Beef Carpaccio", description: "Thinly sliced raw beef, capers, parmesan, and truffle oil.", price: 480, category: "Starters", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800" },
  { _id: "f11", name: "Miso Soup", description: "Traditional Japanese soup with tofu, seaweed, and green onions.", price: 150, category: "Starters", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800" },
  { _id: "f12", name: "Vegetable Tempura", description: "Lightly battered seasonal vegetables with dipping sauce.", price: 240, category: "Starters", image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=800" },
  { _id: "f13", name: "Crab Cakes", description: "Lump crab meat with remoulade sauce and microgreens.", price: 520, category: "Starters", image: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=800" },
  { _id: "f14", name: "French Onion Soup", description: "Rich beef broth, caramelized onions, and melted Gruyère.", price: 220, category: "Starters", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800" },
  { _id: "f15", name: "Lobster Thermidor", description: "Lobster meat in a creamy brandy sauce, topped with cheese.", price: 1200, category: "Main Course", image: "https://images.unsplash.com/photo-1570441101298-4900a3c4777f?w=800" },
  { _id: "f16", name: "Rack of Lamb", description: "Herb-crusted lamb chops with mint jus and mashed potatoes.", price: 950, category: "Main Course", image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800" },
  { _id: "f17", name: "Peking Duck", description: "Crispy duck skin served with pancakes and hoisin sauce.", price: 850, category: "Main Course", image: "https://images.unsplash.com/photo-1582034986517-30d163aa1da9?q=80&w=800" },
  { _id: "f18", name: "Vegetable Lasagna", description: "Layers of pasta, fresh vegetables, and ricotta cheese.", price: 420, category: "Main Course", image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800" },
  { _id: "f19", name: "Chicken Piccata", description: "Pan-fried chicken with lemon, butter, and capers.", price: 480, category: "Main Course", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800" },
  { _id: "f20", name: "Seafood Paella", description: "Saffron rice with shrimp, mussels, and calamari.", price: 650, category: "Main Course", image: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?q=80&w=800" },
  { _id: "f21", name: "Pad Thai", description: "Rice noodles with peanuts, bean sprouts, and lime.", price: 380, category: "Main Course", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800" },
  { _id: "f22", name: "Filet Mignon", description: "8oz center-cut beef tenderloin with red wine reduction.", price: 1100, category: "Main Course", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800" },
  { _id: "f23", name: "Crème Brûlée", description: "Vanilla bean custard with a burnt sugar crust.", price: 250, category: "Desserts", image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?q=80&w=800" },
  { _id: "f24", name: "Panna Cotta", description: "Silky Italian cream with wild berry coulis.", price: 220, category: "Desserts", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800" },
  { _id: "f25", name: "Apple Tarte Tatin", description: "Upside-down caramelized apple tart with vanilla ice cream.", price: 280, category: "Desserts", image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?q=80&w=800" },
  { _id: "f26", name: "Baklava", description: "Layers of phyllo pastry, nuts, and honey syrup.", price: 190, category: "Desserts", image: "https://images.unsplash.com/photo-1562440499-64c9a111f713?q=80&w=800" },
  { _id: "f27", name: "Macaron Tower", description: "Assorted flavors of delicate French macarons.", price: 320, category: "Desserts", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=800" },
  { _id: "f28", name: "Chocolate Soufflé", description: "Light and airy dark chocolate soufflé with cream.", price: 290, category: "Desserts", image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?q=80&w=800" },
  { _id: "f29", name: "Double Espresso", description: "Rich and intense shot of premium Arabica beans.", price: 120, category: "Drinks", image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=800" },
  { _id: "f30", name: "Matcha Latte", description: "Ceremonial grade matcha with steamed oat milk.", price: 210, category: "Drinks", image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?q=80&w=800" },
  { _id: "f31", name: "Classic Margarita", description: "Tequila, triple sec, and fresh lime juice with salt.", price: 450, category: "Drinks", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800" },
  { _id: "f32", name: "Pinot Noir", description: "Elegant red wine with notes of cherry and spice.", price: 650, category: "Drinks", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=800" },
  { _id: "f33", name: "Sparkling Water", description: "Pure mineral water with fine bubbles.", price: 90, category: "Drinks", image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=800" },
  { _id: "f34", name: "New York Cheesecake", description: "Classic creamy cheesecake with a graham cracker crust.", price: 320, category: "Desserts", image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800" },
  { _id: "f35", name: "Ribeye Steak", description: "12oz grilled ribeye with garlic herb butter.", price: 890, category: "Main Course", image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?q=80&w=800" },
  { _id: "f36", name: "Eggplant Parmesan", description: "Crispy eggplant slices layered with marinara and mozzarella.", price: 380, category: "Main Course", image: "https://images.unsplash.com/photo-1623341214825-9f4f963727da?q=80&w=800" }
];

// GET /api/menu -> Fetch all menu items
router.get('/menu', async (req, res) => {
  try {
    const items = await Menu.find({});
    if (items && items.length > 0) {
      return res.json(items);
    }
    res.json(fallbackMenu);
  } catch (error) {
    res.json(fallbackMenu);
  }
});

// POST /api/order/send-order -> Send order to admin
router.post('/order/send-order', async (req, res) => {
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
          <p style="font-size: 16px; margin-top: 20px; font-weight: bold; color: #15803d;">
            Thank You for Visiting our Website.
          </p>
        </div>
        <p style="margin-top: 30px; color: #166534; opacity: 0.7; font-size: 14px;">
          Spoonful Restaurant &bull; Culinary Excellence
        </p>
      </div>
    `;

    const emailResults = [];
    for (const email of emailsArray) {
      const result = await emailService.sendEmail(email, 'Your Order Successful ✅ - Spoonful Restaurant', approvalHtml);
      emailResults.push({ email, success: result.success, error: result.error });
    }

    const allSuccessful = emailResults.every(r => r.success);
    const failedEmails = emailResults.filter(r => !r.success).map(r => r.email);

    res.send(`
      <html>
        <body style="font-family: sans-serif; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: white; padding: 50px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: center; border-top: 8px solid #22c55e;">
            <div style="font-size: 70px; margin-bottom: 20px;">${allSuccessful ? '✅' : '⚠️'}</div>
            <h1 style="color: #1e293b; margin-bottom: 10px;">${allSuccessful ? 'Order Approved' : 'Approved with Warnings'}</h1>
            <p style="color: #64748b; font-size: 18px;">
              ${allSuccessful 
                ? 'Success! The customer has been notified via email.' 
                : `Order was approved, but emails failed to reach: ${failedEmails.join(', ')}`}
            </p>
            <div style="margin-top: 30px;">
              <a href="javascript:window.close()" style="color: #22c55e; font-weight: bold; text-decoration: none;">Close Tab</a>
            </div>
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
    const { emails, name, date, time } = req.query;
    const emailsArray = emails ? decodeURIComponent(emails).split(',').map(e => e.trim()).filter(e => e.length > 0) : [];

    if (emailsArray.length === 0) {
      return res.status(400).send('<h1>Error: No valid customer email found.</h1>');
    }

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

    const emailResults = [];
    for (const email of emailsArray) {
      const result = await emailService.sendEmail(email, 'Order Update ❌ - Spoonful Restaurant', rejectionHtml);
      emailResults.push({ email, success: result.success, error: result.error });
    }

    const allSuccessful = emailResults.every(r => r.success);
    const failedEmails = emailResults.filter(r => !r.success).map(r => r.email);

    res.send(`
      <html>
        <body style="font-family: sans-serif; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: white; padding: 50px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: center; border-top: 8px solid #ef4444;">
            <div style="font-size: 70px; margin-bottom: 20px;">${allSuccessful ? '❌' : '⚠️'}</div>
            <h1 style="color: #1e293b; margin-bottom: 10px;">${allSuccessful ? 'Order Rejected' : 'Rejected with Warnings'}</h1>
            <p style="color: #64748b; font-size: 18px;">
              ${allSuccessful 
                ? 'Order has been rejected and customer has been notified.' 
                : `Order was rejected, but emails failed to reach: ${failedEmails.join(', ')}`}
            </p>
            <div style="margin-top: 30px;">
              <a href="javascript:window.close()" style="color: #ef4444; font-weight: bold; text-decoration: none;">Close Tab</a>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('<h1>Internal server error.</h1>');
  }
};

router.get('/order/reject', sendRejectResponse);
router.post('/order/reject', sendRejectResponse);

module.exports = router;