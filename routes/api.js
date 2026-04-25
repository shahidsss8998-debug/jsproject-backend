const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Menu = require('../models/Menu');
const Reservation = require('../models/Reservation');
const Cart = require('../models/Cart');

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
    await transporter.sendMail({
      from: `"Spoonful Restaurant" <${process.env.EMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

// ... (sampleMenu and other routes)

// GET /api/test-email -> Test email functionality
router.get('/test-email', async (req, res) => {
  try {
    const success = await sendEmail(process.env.EMAIL_USER, 'Test Email from Spoonful', '<h1>This is a test email</h1><p>If you see this, your email configuration is working correctly!</p>');
    if (success) {
      res.json({ message: 'Test email sent successfully to ' + process.env.EMAIL_USER });
    } else {
      res.status(500).json({ message: 'Failed to send test email. Check your EMAIL_USER and EMAIL_PASS.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// POST /api/send-order -> Send order to admin
router.post('/send-order', async (req, res) => {
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
                   style="display: inline-block; background-color: #22c55e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2); transition: all 0.3s ease;">
                   ✅ Approve
                </a>
              </td>
              <td align="center" style="padding: 10px;">
                <a href="${process.env.BASE_URL}/api/order/reject?emails=${emails.join(',')}&name=${encodeURIComponent(name)}&date=${date}&time=${time}&place=${encodeURIComponent(place)}" 
                   style="display: inline-block; background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2); transition: all 0.3s ease;">
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

// GET /api/order/approve -> Approve order and notify customers
router.get('/order/approve', async (req, res) => {
  try {
    const { emails, name, date, time, place } = req.query;
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
});

// GET /api/order/reject -> Reject order and notify customers
router.get('/order/reject', async (req, res) => {
  try {
    const { emails, name, date, time } = req.query;
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
});

// Sample Menu Data (Fallback with Indian Prices)
const sampleMenu = [
  { _id: "1", name: "Truffle Mushroom Risotto", description: "Creamy Arborio rice with wild mushrooms and black truffle oil.", price: 450, category: "Main Course", image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=800", isFeatured: true },
  { _id: "2", name: "Crispy Calamari", description: "Freshly battered calamari served with spicy marinara sauce.", price: 320, category: "Starters", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=800", isFeatured: true },
  { _id: "3", name: "Pan-Seared Salmon", description: "Atlantic salmon with asparagus and lemon-butter sauce.", price: 540, category: "Main Course", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800", isFeatured: false },
  { _id: "4", name: "Classic Bruschetta", description: "Toasted sourdough with vine-ripened tomatoes, garlic, and basil.", price: 280, category: "Starters", image: "https://images.unsplash.com/photo-1572656631137-7935297eff55?q=80&w=800", isFeatured: false },
  { _id: "5", name: "Signature Tiramisu", description: "Espresso-soaked ladyfingers with whipped mascarpone and cocoa.", price: 350, category: "Desserts", image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=800", isFeatured: true },
  { _id: "6", name: "Virgin Mojito", description: "Refreshing lime, fresh mint, and sparkling soda.", price: 210, category: "Drinks", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800", isFeatured: false },
  { _id: "7", name: "Caprese Salad", description: "Buffalo mozzarella, heirloom tomatoes, balsamic glaze, and basil.", price: 290, category: "Starters", image: "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?q=80&w=800" },
  { _id: "8", name: "Stuffed Mushrooms", description: "Button mushrooms filled with herbs, garlic, and three cheeses.", price: 260, category: "Starters", image: "https://images.unsplash.com/photo-1541014741259-de529411b96a?q=80&w=800" },
  { _id: "9", name: "Shrimp Cocktail", description: "Jumbo chilled shrimp served with zesty cocktail sauce.", price: 420, category: "Starters", image: "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?q=80&w=800" },
  { _id: "10", name: "Beef Carpaccio", description: "Thinly sliced raw beef, capers, parmesan, and truffle oil.", price: 480, category: "Starters", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800" },
  { _id: "11", name: "Miso Soup", description: "Traditional Japanese soup with tofu, seaweed, and green onions.", price: 220, category: "Starters", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800" },
  { _id: "12", name: "Vegetable Tempura", description: "Lightly battered seasonal vegetables with dipping sauce.", price: 310, category: "Starters", image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=800" },
  { _id: "13", name: "Crab Cakes", description: "Lump crab meat with remoulade sauce and microgreens.", price: 380, category: "Starters", image: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=800" },
  { _id: "14", name: "French Onion Soup", description: "Rich beef broth, caramelized onions, and melted Gruyère.", price: 270, category: "Starters", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800" },
  { _id: "15", name: "Lobster Thermidor", description: "Lobster meat in a creamy brandy sauce, topped with cheese.", price: 550, category: "Main Course", image: "https://images.unsplash.com/photo-1570441101298-4900a3c4777f?w=800" },
  { _id: "16", name: "Rack of Lamb", description: "Herb-crusted lamb chops with mint jus and mashed potatoes.", price: 520, category: "Main Course", image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800" },
  { _id: "17", name: "Peking Duck", description: "Crispy duck skin served with pancakes and hoisin sauce.", price: 490, category: "Main Course", image: "https://images.unsplash.com/photo-1582034986517-30d163aa1da9?q=80&w=800" },
  { _id: "18", name: "Vegetable Lasagna", description: "Layers of pasta, fresh vegetables, and ricotta cheese.", price: 380, category: "Main Course", image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800" },
  { _id: "19", name: "Chicken Piccata", description: "Pan-fried chicken with lemon, butter, and capers.", price: 420, category: "Main Course", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800" },
  { _id: "20", name: "Seafood Paella", description: "Saffron rice with shrimp, mussels, and calamari.", price: 510, category: "Main Course", image: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?q=80&w=800" },
  { _id: "21", name: "Pad Thai", description: "Rice noodles with peanuts, bean sprouts, and lime.", price: 340, category: "Main Course", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800" },
  { _id: "22", name: "Filet Mignon", description: "8oz center-cut beef tenderloin with red wine reduction.", price: 540, category: "Main Course", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800" },
  { _id: "23", name: "Crème Brûlée", description: "Vanilla bean custard with a burnt sugar crust.", price: 250, category: "Desserts", image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?q=80&w=800" },
  { _id: "24", name: "Panna Cotta", description: "Silky Italian cream with wild berry coulis.", price: 230, category: "Desserts", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800" },
  { _id: "25", name: "Apple Tarte Tatin", description: "Upside-down caramelized apple tart with vanilla ice cream.", price: 280, category: "Desserts", image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?q=80&w=800" },
  { _id: "26", name: "Baklava", description: "Layers of phyllo pastry, nuts, and honey syrup.", price: 210, category: "Desserts", image: "https://images.unsplash.com/photo-1562440499-64c9a111f713?q=80&w=800" },
  { _id: "27", name: "Macaron Tower", description: "Assorted flavors of delicate French macarons.", price: 320, category: "Desserts", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=800" },
  { _id: "28", name: "Chocolate Soufflé", description: "Light and airy dark chocolate soufflé with cream.", price: 350, category: "Desserts", image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?q=80&w=800" },
  { _id: "29", name: "Double Espresso", description: "Rich and intense shot of premium Arabica beans.", price: 150, category: "Drinks", image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=800" },
  { _id: "30", name: "Matcha Latte", description: "Ceremonial grade matcha with steamed oat milk.", price: 180, category: "Drinks", image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?q=80&w=800" },
  { _id: "31", name: "Classic Margarita", description: "Tequila, triple sec, and fresh lime juice with salt.", price: 450, category: "Drinks", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800" },
  { _id: "32", name: "Pinot Noir", description: "Elegant red wine with notes of cherry and spice.", price: 550, category: "Drinks", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=800" },
  { _id: "33", name: "Sparkling Water", description: "Pure mineral water with fine bubbles.", price: 120, category: "Drinks", image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=800" }
];

// Programmatically randomize fallback prices as requested (₹200 - ₹550)
const randomizedMenu = sampleMenu.map(item => ({
  ...item,
  price: Math.floor(Math.random() * (550 - 200 + 1)) + 200
}));

// GET /api/menu -> get menu items
router.get('/menu', async (req, res) => {
  try {
    let menuItems = await Menu.find();

    // If DB is empty, use sample data
    const baseItems = menuItems.length > 0 ? menuItems : sampleMenu;

    // ALWAYS randomize prices between ₹200 - ₹550 as requested
    const randomizedItems = baseItems.map(item => {
      const plainItem = item.toObject ? item.toObject() : item;
      return {
        ...plainItem,
        price: Math.floor(Math.random() * (550 - 200 + 1)) + 200
      };
    });

    res.json(randomizedItems);
  } catch (err) {
    console.warn('Database error, returning randomized sample menu.');
    const randomizedSample = sampleMenu.map(item => ({
      ...item,
      price: Math.floor(Math.random() * (550 - 200 + 1)) + 200
    }));
    res.json(randomizedSample);
  }
});

// POST /api/reservation -> store booking data
router.post('/reservation', async (req, res) => {
  const reservation = new Reservation(req.body);
  try {
    const newReservation = await reservation.save();
    res.status(201).json(newReservation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/cart -> get cart items for a session
router.get('/cart/:sessionId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ sessionId: req.params.sessionId }).populate('items.menuItem');
    res.json(cart || { sessionId: req.params.sessionId, items: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cart -> add/update item in cart
router.post('/cart', async (req, res) => {
  const { sessionId, menuItemId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = new Cart({ sessionId, items: [{ menuItem: menuItemId, quantity }] });
    } else {
      const itemIndex = cart.items.findIndex(p => p.menuItem.toString() === menuItemId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        if (cart.items[itemIndex].quantity <= 0) {
          cart.items.splice(itemIndex, 1);
        }
      } else {
        cart.items.push({ menuItem: menuItemId, quantity });
      }
    }
    await cart.save();
    const updatedCart = await Cart.findById(cart._id).populate('items.menuItem');
    res.status(200).json(updatedCart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/cart/:sessionId/:menuItemId -> remove item from cart
router.delete('/cart/:sessionId/:menuItemId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ sessionId: req.params.sessionId });
    if (cart) {
      cart.items = cart.items.filter(item => item.menuItem.toString() !== req.params.menuItemId);
      await cart.save();
    }
    const updatedCart = await Cart.findOne({ sessionId: req.params.sessionId }).populate('items.menuItem');
    res.json(updatedCart || { sessionId: req.params.sessionId, items: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
