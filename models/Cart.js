const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  items: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
      quantity: { type: Number, required: true, default: 1 }
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', cartSchema);
