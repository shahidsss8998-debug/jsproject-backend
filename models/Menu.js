const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true, enum: ['Starters', 'Main Course', 'Desserts', 'Drinks'] },
  image: { type: String, required: true },
  isFeatured: { type: Boolean, default: false }
});

module.exports = mongoose.model('Menu', menuSchema);
