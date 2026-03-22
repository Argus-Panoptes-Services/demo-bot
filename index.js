const express = require('express');
const path = require('path');
const restaurant = require('./data/restaurant.json');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── AI Response Engine ───────────────────────────────────────────────────────

function getDayHours(day) {
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const today = days[new Date().getDay()];
  const target = day || today;
  return { day: target, hours: restaurant.hours[target] };
}

function generateResponse(message) {
  const msg = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hey|hello|howdy|sup|yo|hola)/.test(msg)) {
    return `👋 Hey there! Welcome to **${restaurant.name}** — ${restaurant.tagline}\n\nI can help you with:\n• 🕐 Hours & location\n• 🌮 Menu & specials\n• 📅 Reservations\n• 📞 Contact info\n\nWhat can I do for you?`;
  }

  // Hours
  if (/hour|open|close|when|schedule|time/.test(msg)) {
    const { day, hours } = getDayHours();
    const allHours = Object.entries(restaurant.hours)
      .map(([d, h]) => `• ${d.charAt(0).toUpperCase() + d.slice(1)}: ${h}`)
      .join('\n');
    return `🕐 **Our Hours:**\n\n${allHours}\n\nToday (${day}) we're open **${hours}**. Come hungry! 🤠`;
  }

  // Location / directions
  if (/where|location|address|direction|find|map/.test(msg)) {
    return `📍 **Find Us:**\n\n${restaurant.location.address}\n\n${restaurant.location.directions}\n\nNeed to call ahead? We're at **${restaurant.contact.phone}**`;
  }

  // Menu
  if (/menu|food|eat|dish|what do you|serve|offer/.test(msg)) {
    const starters = restaurant.menu.starters.map(i => `• ${i.name} — $${i.price}`).join('\n');
    const mains = restaurant.menu.mains.map(i => `• ${i.name} — $${i.price}`).join('\n');
    const drinks = restaurant.menu.drinks.map(i => `• ${i.name} — $${i.price}`).join('\n');
    return `🌮 **Our Menu:**\n\n**Starters**\n${starters}\n\n**Mains**\n${mains}\n\n**Drinks**\n${drinks}\n\nWant details on any dish? Just ask!`;
  }

  // Specific menu items
  if (/taco|brisket/.test(msg)) {
    const item = restaurant.menu.mains.find(i => i.name.toLowerCase().includes('taco'));
    return `🌮 **${item.name}** — $${item.price}\n${item.description}\n\nOne of our most popular dishes. Want to make a reservation?`;
  }
  if (/enchilada/.test(msg)) {
    const item = restaurant.menu.mains.find(i => i.name.toLowerCase().includes('enchilada'));
    return `🫔 **${item.name}** — $${item.price}\n${item.description}\n\nComfort food done right. 😋`;
  }
  if (/fajita/.test(msg)) {
    const item = restaurant.menu.mains.find(i => i.name.toLowerCase().includes('fajita'));
    return `🥩 **${item.name}** — $${item.price}\n${item.description}\n\nSizzling hot and absolutely worth it!`;
  }
  if (/margarita|marg/.test(msg)) {
    const item = restaurant.menu.drinks.find(i => i.name.toLowerCase().includes('margarita'));
    return `🍹 **${item.name}** — $${item.price}\n${item.description}\n\nFrozen or on the rocks? Either way, you won't regret it. 😄`;
  }
  if (/queso/.test(msg)) {
    const item = restaurant.menu.starters.find(i => i.name.toLowerCase().includes('queso'));
    return `🧀 **${item.name}** — $${item.price}\n${item.description}\n\nFair warning: it's addictive.`;
  }
  if (/guac|guacamole/.test(msg)) {
    const item = restaurant.menu.starters.find(i => i.name.toLowerCase().includes('guac'));
    return `🥑 **${item.name}** — $${item.price}\n${item.description}\n\nMade fresh right at your table!`;
  }

  // Specials
  if (/special|deal|discount|happy hour|brunch|tuesday|thursday/.test(msg)) {
    const specials = restaurant.menu.specials.join('\n');
    return `🎉 **Current Specials:**\n\n${specials}\n\nDon't miss out — these deals are too good to pass up!`;
  }

  // Reservations
  if (/reserv|book|table|party|group/.test(msg)) {
    return `📅 **Reservations:**\n\n${restaurant.reservations.note}\n\nTo book, give us a call at **${restaurant.contact.phone}** or just tell me:\n• Your name\n• Party size\n• Preferred date & time\n\nAnd I'll get that request sent over! 🤠`;
  }

  // Reservation intake
  if (/my name is|i'm|i am|party of|people|guests/.test(msg)) {
    return `Perfect! I've noted your request. 📝\n\nOur team will confirm your reservation shortly. You can also call us directly at **${restaurant.contact.phone}** to get an instant confirmation.\n\nSee you soon at ${restaurant.name}! 🌮`;
  }

  // Phone / contact
  if (/phone|call|number|contact|reach/.test(msg)) {
    return `📞 **Contact Us:**\n\nPhone: **${restaurant.contact.phone}**\nEmail: ${restaurant.contact.email}\n\nWe're here during business hours and happy to help!`;
  }

  // Price / cost
  if (/price|cost|how much|cheap|expensive/.test(msg)) {
    return `💰 Our prices are very reasonable!\n\n• Starters: $6.99 – $8.99\n• Mains: $11.99 – $17.99\n• Drinks: $3.99 – $9.99\n\nWant to see the full menu?`;
  }

  // Thanks / bye
  if (/thank|thanks|bye|goodbye|see you|later/.test(msg)) {
    return `You're welcome! 😊 Come see us soon at **${restaurant.name}**. We'll have a cold margarita waiting for you! 🍹🤠`;
  }

  // Fallback
  return `I'm not quite sure about that one, but I can help with:\n\n• 🕐 **Hours** — when we're open\n• 📍 **Location** — how to find us\n• 🌮 **Menu** — what we serve\n• 🎉 **Specials** — current deals\n• 📅 **Reservations** — book a table\n• 📞 **Contact** — get in touch\n\nWhat would you like to know?`;
}

// ─── API Routes ───────────────────────────────────────────────────────────────

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });
  const response = generateResponse(message);
  res.json({ response });
});

app.get('/api/restaurant', (req, res) => {
  res.json(restaurant);
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌮 Tex's Cantina bot running on port ${PORT}`);
});
