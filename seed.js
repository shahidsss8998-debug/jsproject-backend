const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Menu = require('./models/Menu');

dotenv.config();

const menuItems = [
  { name: "Truffle Mushroom Risotto", description: "Creamy Arborio rice with wild mushrooms and black truffle oil.", price: 24.99, category: "Main Course", image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=800", isFeatured: true },
  { name: "Crispy Calamari", description: "Freshly battered calamari served with spicy marinara sauce.", price: 14.50, category: "Starters", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=800", isFeatured: true },
  { name: "Pan-Seared Salmon", description: "Atlantic salmon with asparagus and lemon-butter sauce.", price: 29.00, category: "Main Course", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800", isFeatured: false },
  { name: "Classic Bruschetta", description: "Toasted sourdough with vine-ripened tomatoes, garlic, and basil.", price: 12.00, category: "Starters", image: "https://images.unsplash.com/photo-1572656631137-7935297eff55?q=80&w=800", isFeatured: false },
  { name: "Signature Tiramisu", description: "Espresso-soaked ladyfingers with whipped mascarpone and cocoa.", price: 11.00, category: "Desserts", image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=800", isFeatured: true },
  { name: "Virgin Mojito", description: "Refreshing lime, fresh mint, and sparkling soda.", price: 8.50, category: "Drinks", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800", isFeatured: false },
  // New Starters
  { name: "Caprese Salad", description: "Buffalo mozzarella, heirloom tomatoes, balsamic glaze, and basil.", price: 15.00, category: "Starters", image: "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?q=80&w=800" },
  { name: "Stuffed Mushrooms", description: "Button mushrooms filled with herbs, garlic, and three cheeses.", price: 13.00, category: "Starters", image: "https://images.unsplash.com/photo-1541014741259-de529411b96a?q=80&w=800" },
  { name: "Shrimp Cocktail", description: "Jumbo chilled shrimp served with zesty cocktail sauce.", price: 18.00, category: "Starters", image: "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?q=80&w=800" },
  { name: "Beef Carpaccio", description: "Thinly sliced raw beef, capers, parmesan, and truffle oil.", price: 19.00, category: "Starters", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800" },
  { name: "Miso Soup", description: "Traditional Japanese soup with tofu, seaweed, and green onions.", price: 7.00, category: "Starters", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800" },
  { name: "Vegetable Tempura", description: "Lightly battered seasonal vegetables with dipping sauce.", price: 12.00, category: "Starters", image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=800" },
  { name: "Crab Cakes", description: "Lump crab meat with remoulade sauce and microgreens.", price: 21.00, category: "Starters", image: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=800" },
  { name: "French Onion Soup", description: "Rich beef broth, caramelized onions, and melted Gruyère.", price: 11.00, category: "Starters", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800" },
  // New Main Courses
  { name: "Lobster Thermidor", description: "Lobster meat in a creamy brandy sauce, topped with cheese.", price: 45.00, category: "Main Course", image: "https://images.unsplash.com/photo-1570441101298-4900a3c4777f?w=800" },
  { name: "Rack of Lamb", description: "Herb-crusted lamb chops with mint jus and mashed potatoes.", price: 38.00, category: "Main Course", image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800" },
  { name: "Peking Duck", description: "Crispy duck skin served with pancakes and hoisin sauce.", price: 34.00, category: "Main Course", image: "https://images.unsplash.com/photo-1582034986517-30d163aa1da9?q=80&w=800" },
  { name: "Vegetable Lasagna", description: "Layers of pasta, fresh vegetables, and ricotta cheese.", price: 22.00, category: "Main Course", image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800" },
  { name: "Chicken Piccata", description: "Pan-fried chicken with lemon, butter, and capers.", price: 25.00, category: "Main Course", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800" },
  { name: "Seafood Paella", description: "Saffron rice with shrimp, mussels, and calamari.", price: 32.00, category: "Main Course", image: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?q=80&w=800" },
  { name: "Pad Thai", description: "Rice noodles with peanuts, bean sprouts, and lime.", price: 18.00, category: "Main Course", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800" },
  { name: "Filet Mignon", description: "8oz center-cut beef tenderloin with red wine reduction.", price: 42.00, category: "Main Course", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800" },
  // New Desserts
  { name: "Crème Brûlée", description: "Vanilla bean custard with a burnt sugar crust.", price: 10.00, category: "Desserts", image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?q=80&w=800" },
  { name: "Panna Cotta", description: "Silky Italian cream with wild berry coulis.", price: 9.00, category: "Desserts", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800" },
  { name: "Apple Tarte Tatin", description: "Upside-down caramelized apple tart with vanilla ice cream.", price: 12.00, category: "Desserts", image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?q=80&w=800" },
  { name: "Baklava", description: "Layers of phyllo pastry, nuts, and honey syrup.", price: 8.00, category: "Desserts", image: "https://images.unsplash.com/photo-1562440499-64c9a111f713?q=80&w=800" },
  { name: "Macaron Tower", description: "Assorted flavors of delicate French macarons.", price: 14.00, category: "Desserts", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=800" },
  { name: "Chocolate Soufflé", description: "Light and airy dark chocolate soufflé with cream.", price: 13.00, category: "Desserts", image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?q=80&w=800" },
  // New Drinks
  { name: "Double Espresso", description: "Rich and intense shot of premium Arabica beans.", price: 5.00, category: "Drinks", image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=800" },
  { name: "Matcha Latte", description: "Ceremonial grade matcha with steamed oat milk.", price: 6.50, category: "Drinks", image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?q=80&w=800" },
  { name: "Classic Margarita", description: "Tequila, triple sec, and fresh lime juice with salt.", price: 12.00, category: "Drinks", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800" },
  { name: "Pinot Noir", description: "Elegant red wine with notes of cherry and spice.", price: 14.00, category: "Drinks", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=800" },
  { name: "Sparkling Water", description: "Pure mineral water with fine bubbles.", price: 4.50, category: "Drinks", image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=800" },
  { name: "New York Cheesecake", description: "Classic creamy cheesecake with a graham cracker crust.", price: 11.50, category: "Desserts", image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800" },
  { name: "Ribeye Steak", description: "12oz grilled ribeye with garlic herb butter.", price: 39.00, category: "Main Course", image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?q=80&w=800" },
  { name: "Eggplant Parmesan", description: "Crispy eggplant slices layered with marinara and mozzarella.", price: 20.00, category: "Main Course", image: "https://images.unsplash.com/photo-1623341214825-9f4f963727da?q=80&w=800" }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Menu.deleteMany({});
    const itemsWithIndianPrices = menuItems.map(item => ({
      ...item,
      price: Math.floor(Math.random() * (550 - 200 + 1)) + 200
    }));
    await Menu.insertMany(itemsWithIndianPrices);
    console.log('Database seeded successfully!');
    process.exit();
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
