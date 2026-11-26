const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8765);
const ROOT_DIR = __dirname;
const DB_PATH = path.join(ROOT_DIR, 'db.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const DEFAULT_MENU = require('./menu-data.js');

function createDefaultDb() {
  const now = Date.now();
  return {
    settings: {
      restaurantName: 'Chatkaro Food Hub',
      rating: 4.9,
      reviewCount: 113,
      priceRange: '₹1–300 per person',
      address: 'Near Essar Petrol Pump, Opp. Shreeji Super Mart, Talala, Gujarat 362150',
      plusCode: '2GWF+GJ Talala, Gujarat',
      openHoursText: '12:00 PM – 3:00 PM (Break 3–6 PM) • 6:00 PM – 11:50 PM',
      phone: '919054633908',
      instagramHandle: 'chatkaro_the_food_hub',
      instagramReels: 'https://www.instagram.com/reels/DeoG7QDA2O3/\nhttps://www.instagram.com/reel/DfLrI3hzTGD/',
      adminPin: '9054', // Secure Owner PIN (last 4 digits of restaurant phone by default; changeable in Admin)
      googleClientId: '',
      googlePlacesApiKey: '',
      googlePlaceId: '',
      geminiApiKey: '',
      merchantUpiId: '',
      razorpayKeyId: '',
      razorpayKeySecret: '',
      phonepeMerchantId: '',
      phonepeSaltKey: '',
      phonepeSaltIndex: '1',
      phonepeEnv: 'sandbox',
      lastMapsSyncAt: now,
      announcement: '🌿 100% Pure Vegetarian • 🕒 12:00 PM–3:00 PM & 6:00 PM–11:50 PM (Break 3–6 PM)',
      dailyDeal: '🔥 Today’s Combo Deal: Classic Masala Dosa + Cold Coffee = ₹149! Use WELCOME5 for extra 5% OFF.',
      brandTheme: {
        preset: 'greenrush-3d',
        primary: '#dc2626',
        accent: '#fbbf24',
        bg: '#141414',
        surface: '#1d1d20',
        text: '#f9fafb',
        fxEnabled: true
      }
    },
    menu: DEFAULT_MENU.map((m) => ({ ...m })),
    tables: [
      { id: 1, label: 'Table 1', seats: 4, status: 'available', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now },
      { id: 2, label: 'Table 2', seats: 4, status: 'available', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now },
      { id: 3, label: 'Table 3', seats: 6, status: 'available', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now },
      { id: 4, label: 'Table 4', seats: 2, status: 'available', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now },
      { id: 5, label: 'Table 5', seats: 4, status: 'available', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now },
      { id: 6, label: 'Table 6', seats: 6, status: 'available', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now },
      { id: 7, label: 'Table 7', seats: 4, status: 'available', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now },
      { id: 8, label: 'Table 8 (Family)', seats: 8, status: 'available', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now }
    ],
    customers: {},
    orders: [],
    reviews: [
      {
        id: 'rev-1',
        author: 'Aman Kumar',
        rating: 5,
        text: 'Chatkaro Food Hub is an amazing place! The food is delicious, the service is excellent, and the atmosphere is wonderful. A perfect place to enjoy with family and friends.',
        source: 'Google Maps',
        meta: 'Dine-in • Dinner • ₹1–200',
        createdAt: now - 1440000
      },
      {
        id: 'rev-2',
        author: 'Devanshi Unadkat',
        rating: 5,
        text: 'Had just a beautiful experience from service to food. Everything was just top notch and Dosa was toh just amazing! It feels like I have to come here everyday ❤️',
        source: 'Google Maps',
        meta: '5 reviews • Local Foodie',
        createdAt: now - 2592000000
      },
      {
        id: 'rev-3',
        author: 'Piyu Kanabar',
        rating: 5,
        text: 'The taste of food is just too good and I love the food of this restaurant 😄 Please everyone come here and try the food 🥰',
        source: 'Google Maps',
        meta: 'Chinese • Punjabi • South Indian',
        createdAt: now - 1814400000
      },
      {
        id: 'rev-4',
        author: 'Manish Kakani',
        rating: 5,
        text: 'Super food and satisfied! Peaceful atmosphere, great quality and quick service for families.',
        source: 'Google Maps',
        meta: 'Free Parking • Pure Vegetarian',
        createdAt: now - 1209600000
      }
    ],
    mapPhotos: [
      {
        id: 'mp-1',
        title: 'Veg Kadai & Mix Veg Preparation (વેજ કડાઈ)',
        category: 'food',
        uploader: 'By Owner • Signature Menu Photo',
        url: 'assets/veg-kadai.jpg',
        createdAt: now - 86400000 * 2
      },
      {
        id: 'mp-2',
        title: 'Sizzling Veg Angara & Veg Kolhapuri (વેજ અંગારા)',
        category: 'food',
        uploader: 'By Owner • Signature Menu Photo',
        url: 'assets/veg-angara.jpg',
        createdAt: now - 86400000 * 3
      },
      {
        id: 'mp-3',
        title: 'Royal Kaju Curry & Kaju Butter Masala (કાજુ કરી)',
        category: 'food',
        uploader: 'By Owner • Signature Menu Photo',
        url: 'assets/kaju-curry.jpg',
        createdAt: now - 86400000 * 4
      },
      {
        id: 'mp-4',
        title: 'Cheese Butter Masala & Cheese Anguri (ચીઝ અંગુરી)',
        category: 'food',
        uploader: 'By Owner • Signature Menu Photo',
        url: 'assets/cheese-masala.jpg',
        createdAt: now - 86400000 * 5
      },
      {
        id: 'mp-5',
        title: 'Crispy Masala Dosa with Hot Sambar & Chutneys',
        category: 'food',
        uploader: 'Google Maps Photo',
        url: 'assets/dosa-platter.jpg',
        createdAt: now - 86400000 * 6
      },
      {
        id: 'mp-6',
        title: 'Peaceful Family Dining Lounge & Warm Vibe',
        category: 'vibe',
        uploader: 'Google Maps Photo',
        url: 'assets/dining-vibe.jpg',
        createdAt: now - 1440000
      }
    ],
    chatMessages: []
  };
}

function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      const def = createDefaultDb();
      if (!parsed.mapPhotos) parsed.mapPhotos = def.mapPhotos;
      if (!parsed.settings) parsed.settings = def.settings;
      if (!parsed.settings.brandTheme) parsed.settings.brandTheme = def.settings.brandTheme;
      if (!parsed.settings.dailyDeal) parsed.settings.dailyDeal = def.settings.dailyDeal;
      ['merchantUpiId', 'razorpayKeyId', 'razorpayKeySecret', 'phonepeMerchantId', 'phonepeSaltKey', 'phonepeSaltIndex', 'phonepeEnv'].forEach((k) => {
        if (parsed.settings[k] === undefined) parsed.settings[k] = def.settings[k];
      });
      if (!Array.isArray(parsed.menu)) parsed.menu = [];
      const existingById = new Map(parsed.menu.map((m) => [m.id, m]));
      const mergedMenu = DEFAULT_MENU.map((dm) => {
        const existing = existingById.get(dm.id);
        return existing ? { ...dm, ...existing, category: dm.category || existing.category, image: dm.image || existing.image, guName: dm.guName || existing.guName, portion: existing.portion || dm.portion, servedWith: existing.servedWith || dm.servedWith } : { ...dm };
      });
      const defaultIds = new Set(DEFAULT_MENU.map((m) => m.id));
      parsed.menu.forEach((m) => {
        if (!defaultIds.has(m.id) && m.id !== 'pun-kaju-curry') {
          mergedMenu.push(m);
        }
      });
      parsed.menu = mergedMenu;
      return parsed;
    }
  } catch (err) {
    console.error('Failed reading db.json, recreating default:', err.message);
  }
  const initial = createDefaultDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  return initial;
}

let db = loadDb();
saveDb();
const gameRooms = new Map();
const adminTokens = new Set();
const pinAttempts = new Map(); // ip -> { count, lockedUntil }
const pendingPayments = new Map(); // txnId -> checkout snapshot

function saveDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

const sseClients = new Set();

function broadcast(eventType, payload) {
  const data = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    try { res.write(data); } catch { sseClients.delete(res); }
  }
}

function serializeRoom(room) {
  return {
    code: room.code,
    mode: room.mode,
    status: room.status,
    startedAt: room.startedAt,
    durationSec: room.durationSec,
    players: Object.values(room.players)
  };
}

function isParcelOrder(o) {
  return o.orderType === 'parcel' || o.orderType === 'drive-through' || o.orderType === 'delivery';
}

function computeSalesAnalytics() {
  const realOrders = db.orders.filter((o) => !o.isFake);
  const fakeOrdersCount = db.orders.filter((o) => Boolean(o.isFake)).length;
  const validOrders = realOrders.filter((o) => o.status !== 'cancelled');
  const cancelledOrders = realOrders.filter((o) => o.status === 'cancelled');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const totalRevenue = validOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const todayRevenue = validOrders
    .filter((o) => (o.createdAt || 0) >= todayStart.getTime())
    .reduce((s, o) => s + Number(o.total || 0), 0);
  const totalDiscounts = validOrders.reduce((s, o) => s + Number(o.discountAmt || 0), 0);
  const avgOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

  // Parcel vs Dine-In & Payment Breakdown (Real only)
  const parcelOrders = validOrders.filter(isParcelOrder);
  const dineInOrders = validOrders.filter((o) => !isParcelOrder(o));
  const parcelRevenue = parcelOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const dineInRevenue = dineInOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const parcelPaidOnline = parcelOrders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((s, o) => s + Number(o.total || 0), 0);
  const parcelPendingOrCod = parcelOrders
    .filter((o) => o.paymentStatus !== 'paid')
    .reduce((s, o) => s + Number(o.total || 0), 0);
  const onlinePaidOrders = validOrders.filter((o) => o.paymentStatus === 'paid');
  const onlinePaidRevenue = onlinePaidOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const razorpayRevenue = onlinePaidOrders
    .filter((o) => o.paymentMethod === 'razorpay')
    .reduce((s, o) => s + Number(o.total || 0), 0);
  const phonepeRevenue = onlinePaidOrders
    .filter((o) => o.paymentMethod === 'phonepe')
    .reduce((s, o) => s + Number(o.total || 0), 0);

  const itemMap = new Map();
  const catMap = new Map();

  for (const order of validOrders) {
    for (const item of order.items || []) {
      const qty = Number(item.qty || 0);
      const rev = Number(item.price || 0) * qty;
      const menuMatch = db.menu.find((m) => m.id === item.id || m.name === item.name);
      const category = menuMatch ? menuMatch.category : 'other';
      const emoji = menuMatch ? menuMatch.emoji : '🍽️';

      const prev = itemMap.get(item.name) || { name: item.name, category, emoji, qtySold: 0, revenue: 0 };
      prev.qtySold += qty;
      prev.revenue += rev;
      itemMap.set(item.name, prev);

      const cPrev = catMap.get(category) || { category, qtySold: 0, revenue: 0 };
      cPrev.qtySold += qty;
      cPrev.revenue += rev;
      catMap.set(category, cPrev);
    }
  }

  return {
    totalRevenue,
    todayRevenue,
    totalOrders: realOrders.length,
    validOrdersCount: validOrders.length,
    cancelledOrdersCount: cancelledOrders.length,
    fakeOrdersExcluded: fakeOrdersCount,
    servedOrdersCount: validOrders.filter((o) => o.status === 'served').length,
    totalDiscounts,
    avgOrderValue,
    parcelStats: {
      totalCount: parcelOrders.length,
      parcelCount: parcelOrders.filter((o) => o.orderType === 'parcel' || o.orderType === 'drive-through').length,
      deliveryCount: parcelOrders.filter((o) => o.orderType === 'delivery').length,
      servedCount: parcelOrders.filter((o) => o.status === 'served').length,
      activeCount: parcelOrders.filter((o) => o.status !== 'served').length,
      revenue: parcelRevenue,
      paidOnlineRevenue: parcelPaidOnline,
      codOrPendingRevenue: parcelPendingOrCod
    },
    dineInStats: {
      totalCount: dineInOrders.length,
      revenue: dineInRevenue
    },
    paymentStats: {
      onlinePaidCount: onlinePaidOrders.length,
      onlinePaidRevenue,
      razorpayRevenue,
      phonepeRevenue,
      codRevenue: Math.max(0, totalRevenue - onlinePaidRevenue)
    },
    itemSales: Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue),
    categorySales: Array.from(catMap.values()).sort((a, b) => b.revenue - a.revenue)
  };
}

function getPublicSnapshot() {
  const realOrders = db.orders.filter((o) => !o.isFake);
  const topCustomers = Object.values(db.customers)
    .filter((c) => !c.isFake)
    .sort((a, b) => (b.ordersCount * 50 + (b.bestGameScore || 0)) - (a.ordersCount * 50 + (a.bestGameScore || 0)))
    .slice(0, 15);

  return {
    settings: {
      restaurantName: db.settings.restaurantName,
      rating: db.settings.rating,
      reviewCount: db.settings.reviewCount,
      priceRange: db.settings.priceRange || '₹1–300 per person',
      address: db.settings.address || 'Near Essar Petrol Pump, Opp. Shreeji Super Mart, Talala, Gujarat 362150',
      plusCode: db.settings.plusCode || '2GWF+GJ Talala, Gujarat',
      openHoursText: db.settings.openHoursText,
      phone: db.settings.phone,
      instagramHandle: db.settings.instagramHandle || 'chatkaro_the_food_hub',
      instagramReels: db.settings.instagramReels || 'https://www.instagram.com/reels/DeoG7QDA2O3/\nhttps://www.instagram.com/reel/DfLrI3hzTGD/',
      googleClientId: db.settings.googleClientId,
      lastMapsSyncAt: db.settings.lastMapsSyncAt,
      announcement: db.settings.announcement,
      dailyDeal: db.settings.dailyDeal,
      brandTheme: db.settings.brandTheme,
      hasPlacesKey: Boolean(db.settings.googlePlacesApiKey && db.settings.googlePlaceId),
      hasGeminiKey: Boolean(db.settings.geminiApiKey),
      merchantUpiId: db.settings.merchantUpiId || '',
      razorpayKeyId: db.settings.razorpayKeyId || '',
      hasRazorpay: Boolean(db.settings.razorpayKeyId && db.settings.razorpayKeySecret),
      hasPhonePeGateway: Boolean(db.settings.phonepeMerchantId && db.settings.phonepeSaltKey),
      phonepeEnv: db.settings.phonepeEnv || 'sandbox'
    },
    menu: db.menu,
    tables: db.tables,
    orders: realOrders.slice(0, 60),
    reviews: db.reviews.slice(0, 50),
    mapPhotos: db.mapPhotos.slice(0, 40),
    chatMessages: db.chatMessages.slice(-60),
    topCustomers,
    customersAll: Object.values(db.customers).filter((c) => !c.isFake),
    gameRooms: Array.from(gameRooms.values()).map(serializeRoom)
  };
}

function httpsRequestJson(options, bodyStr = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (resp) => {
      let raw = '';
      resp.on('data', (c) => (raw += c));
      resp.on('end', () => {
        try {
          const parsed = raw ? JSON.parse(raw) : {};
          resolve({ statusCode: resp.statusCode || 200, data: parsed });
        } catch (err) {
          reject(new Error(`Invalid response (${resp.statusCode}): ${raw.slice(0, 140)}`));
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function createOrderFromPayload(body, paymentOverride = {}) {
  const email = String(body.customerEmail || '').trim().toLowerCase();
  if (!email) throw new Error('Google login required before ordering.');
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) throw new Error('Cart is empty.');

  const subtotal = items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
  const discountAmt = Number(body.discountAmt || 0);
  const deliveryFee = Number(body.deliveryFee || 0);
  const total = Math.max(0, subtotal - discountAmt + deliveryFee);
  const etaMinutes = Number(body.etaMinutes || 18);
  const now = Date.now();
  const orderType = body.orderType === 'drive-through' ? 'parcel' : (body.orderType || 'dine-in');

  const order = {
    id: 'CFH-' + Math.floor(1000 + Math.random() * 9000),
    customerName: String(body.customerName || 'Guest').trim(),
    customerEmail: email,
    customerPhone: String(body.customerPhone || '').trim(),
    orderType,
    tableId: orderType === 'dine-in' && body.tableId ? Number(body.tableId) : null,
    detail: String(body.detail || '').trim(),
    items,
    subtotal,
    discountAmt,
    deliveryFee,
    total,
    promoCode: String(body.promoCode || ''),
    paymentMethod: paymentOverride.paymentMethod || body.paymentMethod || 'cod',
    paymentStatus: paymentOverride.paymentStatus || body.paymentStatus || 'cod',
    paymentId: paymentOverride.paymentId || body.paymentId || '',
    isFake: false,
    status: 'confirmed',
    etaMinutes,
    etaEndsAt: now + etaMinutes * 60000,
    createdAt: now
  };

  db.orders.unshift(order);
  if (!db.customers[email]) {
    db.customers[email] = {
      email,
      name: order.customerName,
      phone: order.customerPhone,
      bio: 'Chatkaro Foodie',
      favoriteDish: items[0]?.name || 'Masala Dosa',
      avatarColor: '#ea580c',
      ordersCount: 0,
      totalSpent: 0,
      bestGameScore: 0,
      tableId: order.tableId
    };
  }
  db.customers[email].ordersCount += 1;
  db.customers[email].totalSpent += total;
  if (order.customerPhone) db.customers[email].phone = order.customerPhone;

  if (order.orderType === 'dine-in' && order.tableId) {
    const tbl = db.tables.find((t) => t.id === order.tableId);
    if (tbl) {
      tbl.status = 'occupied';
      tbl.occupantName = order.customerName;
      tbl.occupantEmail = email;
      tbl.dishSummary = items.map((i) => `${i.qty}× ${i.name}`).slice(0, 2).join(', ');
      tbl.updatedAt = now;
    }
  }
  recalculateTopAndBroadcast();
  return order;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 6e6) reject(new Error('Body too large'));
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin, X-Admin-Token'
  });
  res.end(JSON.stringify(data));
}

function fetchGooglePlaces(placeId, apiKey) {
  return new Promise((resolve, reject) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,rating,user_ratings_total,reviews,opening_hours,photos,formatted_address&key=${encodeURIComponent(apiKey)}`;
    https.get(url, (resp) => {
      let body = '';
      resp.on('data', (c) => (body += c));
      resp.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function buildAiSystemContext() {
  const availableItems = db.menu.filter((m) => m.available !== false);
  const soldOutItems = db.menu.filter((m) => m.available === false);
  const freeTables = db.tables.filter((t) => t.status === 'available').map((t) => `${t.label} (${t.seats} seats)`);
  const busyTables = db.tables.filter((t) => t.status === 'occupied').map((t) => `${t.label} (${t.occupantName})`);

  return [
    `You are "Chatkaro AI", the friendly, helpful pure-vegetarian restaurant assistant for ${db.settings.restaurantName} in Talala, Gujarat.`,
    `Reply warmly in the same language as the user (Hinglish, Hindi, Gujarati, or English). Keep replies concise, clear, and appetizing.`,
    `Restaurant Details:`,
    `- Pure Vegetarian (100% All-Veg)`,
    `- Address: ${db.settings.address} (Plus Code: ${db.settings.plusCode})`,
    `- Timing: ${db.settings.openHoursText}`,
    `- Phone / WhatsApp: +${db.settings.phone}`,
    `- Rating: ${db.settings.rating}★ (${db.settings.reviewCount} reviews) | Price: ${db.settings.priceRange}`,
    `- Today's Deal: ${db.settings.dailyDeal || 'Use WELCOME5 for 5% OFF'}`,
    `- Live Tables Available: ${freeTables.length ? freeTables.join(', ') : 'All tables currently busy'}`,
    `- Currently Occupied Tables: ${busyTables.length ? busyTables.join(', ') : 'None'}`,
    `- How to Order: 1) Click "Sign in" (Google Sign-In required to order), 2) Add dishes from Full Menu, 3) Open Cart & select Dine-In / Drive-Thru / No-Contact Delivery, 4) Apply promo code (WELCOME5, or play Tawa Rush game for CHATKARO10 10% OFF / CHATKARO20 20% OFF), 5) Click Order & Send on WhatsApp + track live countdown!`,
    `- AVAILABLE MENU (${availableItems.length} items):`,
    ...availableItems.map((m) => `  * ${m.name} [${m.category}] — ₹${m.price}${m.bestseller ? ' (Bestseller)' : ''}${m.spicy ? ' (Spicy)' : ''}`),
    `- CURRENTLY SOLD OUT / UNAVAILABLE (${soldOutItems.length} items): ${soldOutItems.length ? soldOutItems.map((m) => m.name).join(', ') : 'None — everything on the menu is available right now!'}`
  ].join('\n');
}

function callGeminiApi(apiKey, userMessage, history = []) {
  return new Promise((resolve, reject) => {
    const contents = [
      ...history.slice(-6).map((h) => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(h.text || '') }]
      })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const payload = JSON.stringify({
      system_instruction: { parts: [{ text: buildAiSystemContext() }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 420 }
    });

    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (resp) => {
        let raw = '';
        resp.on('data', (c) => (raw += c));
        resp.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) return reject(new Error(parsed.error.message || 'Gemini API error'));
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) return reject(new Error('Empty Gemini response'));
            resolve(text);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function smartMenuFallbackReply(query) {
  const q = query.toLowerCase();
  const avail = db.menu.filter((m) => m.available !== false);
  const soldOut = db.menu.filter((m) => m.available === false);
  const freeTables = db.tables.filter((t) => t.status === 'available');

  if (q.includes('sold') || q.includes('nahi') || q.includes('nhe') || q.includes('unavailable') || q.includes('khatam')) {
    return soldOut.length
      ? `Abhi ye dishes Sold Out hain: ${soldOut.map((m) => m.name).join(', ')}. Baaki saari ${avail.length} pure-veg dishes available hain!`
      : `Good news! Abhi koi bhi dish Sold Out nahi hai — saari ${avail.length} pure-veg dishes fresh available hain! 🍲`;
  }
  if (q.includes('order') || q.includes('owder') || q.includes('kaise') || q.includes('kese') || q.includes('book')) {
    return `Order karna bahut aasaan hai:\n1️⃣ Header se **Google Sign-In** karein.\n2️⃣ Menu se apni favorite dishes **+ Add** karein.\n3️⃣ Cart khol kar **Dine-In / Drive-Thru / Delivery** chunein (promo \`WELCOME5\` ya game se \`CHATKARO10\`/\`CHATKARO20\` lagayein).\n4️⃣ **Order & Send to WhatsApp** par click karein — live countdown timer turant start ho jayega!`;
  }
  if (q.includes('table') || q.includes('seat') || q.includes('khali') || q.includes('teval')) {
    return freeTables.length
      ? `Abhi ${freeTables.length} tables khali hain: ${freeTables.map((t) => `${t.label} (${t.seats} seats)`).join(', ')}. Aap "Live Hotel Tables" section mein **Sit Here** click karke check-in kar sakte hain!`
      : `Abhi saari tables full hain, par aap Drive-Through ya Delivery order kar sakte hain!`;
  }
  if (q.includes('time') || q.includes('open') || q.includes('khula') || q.includes('kab') || q.includes('address') || q.includes('map') || q.includes('kaha')) {
    return `📍 **Address:** ${db.settings.address} (Plus Code: \`${db.settings.plusCode}\`)\n🕒 **Timing:** ${db.settings.openHoursText}\n📞 **Phone/WhatsApp:** +${db.settings.phone}`;
  }
  if (q.includes('dosa') || q.includes('south')) {
    const dosas = avail.filter((m) => m.category === 'south-indian').slice(0, 5);
    return `South Indian Specials (100% Pure Veg):\n${dosas.map((d) => `• ${d.emoji} ${d.name} — ₹${d.price}`).join('\n')}\nSabhi ke saath garam Sambar aur Coconut Chutney milti hai!`;
  }
  if (q.includes('chinese') || q.includes('noodle') || q.includes('manchurian')) {
    const chi = avail.filter((m) => m.category === 'chinese');
    return `Sizzling Indo-Chinese Menu:\n${chi.map((d) => `• ${d.emoji} ${d.name} — ₹${d.price}`).join('\n')}`;
  }
  if (q.includes('punjabi') || q.includes('paneer') || q.includes('thali') || q.includes('naan')) {
    const pun = avail.filter((m) => m.category === 'punjabi');
    return `Rich Punjabi Specials:\n${pun.map((d) => `• ${d.emoji} ${d.name} — ₹${d.price}`).join('\n')}`;
  }
  if (q.includes('game') || q.includes('discount') || q.includes('offer') || q.includes('coupon')) {
    return `${db.settings.dailyDeal}\n🎮 **Tawa Rush Game** khel kar 150+ score par **CHATKARO10 (10% OFF)** aur 300+ score par **CHATKARO20 (20% OFF)** jeet sakte hain!`;
  }
  const bestsellers = avail.filter((m) => m.bestseller).slice(0, 6);
  return `Namaste! 🙏 **Chatkaro Food Hub** mein aapka swagat hai (100% Pure Veg • ${db.settings.openHoursText}).\nHamare Bestsellers:\n${bestsellers.map((d) => `• ${d.emoji} ${d.name} — ₹${d.price}`).join('\n')}\nAap mujhse Dosa, Chinese, Punjabi, Sold Out items, Tables ya Order karne ka tarika pooch sakte hain!`;
}

function requireAdmin(req, body) {
  const token = req.headers['x-admin-token'] || body?.adminToken;
  if (token && adminTokens.has(token)) return true;
  const pin = req.headers['x-admin-pin'] || body?.adminPin;
  return Boolean(pin && String(pin) === String(db.settings.adminPin));
}

function recalculateTopAndBroadcast() {
  saveDb();
  broadcast('state', getPublicSnapshot());
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin, X-Admin-Token'
    });
    return res.end();
  }

  if (pathname === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(`event: state\ndata: ${JSON.stringify(getPublicSnapshot())}\n\n`);
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  if (pathname === '/api/maps-photo' && req.method === 'GET') {
    const ref = parsedUrl.searchParams.get('ref');
    if (!ref || !db.settings.googlePlacesApiKey) {
      res.writeHead(404);
      return res.end('Not configured');
    }
    const gUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${encodeURIComponent(ref)}&key=${encodeURIComponent(db.settings.googlePlacesApiKey)}`;
    https.get(gUrl, (gRes) => {
      if (gRes.statusCode >= 300 && gRes.statusCode < 400 && gRes.headers.location) {
        https.get(gRes.headers.location, (imgRes) => {
          res.writeHead(200, { 'Content-Type': imgRes.headers['content-type'] || 'image/jpeg' });
          imgRes.pipe(res);
        }).on('error', () => res.end());
      } else {
        res.writeHead(gRes.statusCode || 200, { 'Content-Type': gRes.headers['content-type'] || 'image/jpeg' });
        gRes.pipe(res);
      }
    }).on('error', () => {
      res.writeHead(502);
      res.end('Photo fetch failed');
    });
    return;
  }

  if (pathname === '/api/state' && req.method === 'GET') {
    return sendJson(res, 200, getPublicSnapshot());
  }

  try {
    // Gemini AI Chat Endpoint
    if (pathname === '/api/ai-chat' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const message = String(body.message || '').trim();
      const history = Array.isArray(body.history) ? body.history : [];
      if (!message) return sendJson(res, 400, { error: 'Ask a question first.' });

      if (db.settings.geminiApiKey) {
        try {
          const reply = await callGeminiApi(db.settings.geminiApiKey, message, history);
          return sendJson(res, 200, { reply, engine: 'gemini-2.5-flash' });
        } catch (err) {
          const fallback = smartMenuFallbackReply(message);
          return sendJson(res, 200, { reply: fallback, engine: 'smart-fallback', note: err.message });
        }
      }
      return sendJson(res, 200, { reply: smartMenuFallbackReply(message), engine: 'smart-menu-ai' });
    }

    // Customer Auth & Profile (Real Google OAuth ID Token or Verified Gmail)
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await readJsonBody(req);
      let email = String(body.email || '').trim().toLowerCase();
      let name = String(body.name || '').trim();
      let picture = body.picture ? String(body.picture) : '';
      let authProvider = 'gmail';

      if (body.credential) {
        const tokenResp = await httpsRequestJson({
          hostname: 'oauth2.googleapis.com',
          path: `/tokeninfo?id_token=${encodeURIComponent(String(body.credential))}`,
          method: 'GET'
        });
        const info = tokenResp.data || {};
        if (tokenResp.statusCode !== 200 || !info.email) {
          return sendJson(res, 401, { error: 'Google token verification failed.' });
        }
        if (db.settings.googleClientId && info.aud !== db.settings.googleClientId) {
          return sendJson(res, 401, { error: 'Google Client ID mismatch.' });
        }
        if (String(info.email_verified) !== 'true') {
          return sendJson(res, 401, { error: 'Google account email is not verified.' });
        }
        email = String(info.email).trim().toLowerCase();
        name = String(info.name || email.split('@')[0]).trim();
        picture = info.picture ? String(info.picture) : picture;
        authProvider = 'google-oauth';
      } else {
        if (!email || !name) return sendJson(res, 400, { error: 'Name and Gmail address required.' });
        if (!/^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(email)) {
          return sendJson(res, 400, { error: 'Please sign in with a valid @gmail.com address.' });
        }
      }

      const existing = db.customers[email] || {
        email,
        name,
        phone: '',
        bio: 'Foodie at Chatkaro Food Hub',
        favoriteDish: 'Mix Veg',
        avatarColor: '#ea580c',
        ordersCount: 0,
        totalSpent: 0,
        bestGameScore: 0,
        tableId: null
      };
      existing.name = name;
      existing.authProvider = authProvider;
      if (picture) existing.picture = picture;
      if (body.phone) existing.phone = String(body.phone).trim();
      db.customers[email] = existing;
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { customer: existing });
    }

    if (pathname === '/api/profile' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      if (!email || !db.customers[email]) return sendJson(res, 404, { error: 'Profile not found.' });
      const c = db.customers[email];
      if (body.name) c.name = String(body.name).trim();
      if (body.phone !== undefined) c.phone = String(body.phone).trim();
      if (body.bio !== undefined) c.bio = String(body.bio).trim();
      if (body.favoriteDish !== undefined) c.favoriteDish = String(body.favoriteDish).trim();
      if (body.avatarColor) c.avatarColor = String(body.avatarColor);
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { customer: c });
    }

    // Table Check-in
    if (pathname === '/api/tables/checkin' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const tableId = Number(body.tableId);
      const email = String(body.email || '').trim().toLowerCase();
      const name = String(body.name || 'Guest').trim();
      const action = body.action || 'occupy';

      db.tables.forEach((t) => {
        if (email && t.occupantEmail === email) {
          t.status = 'available'; t.occupantName = ''; t.occupantEmail = ''; t.dishSummary = ''; t.updatedAt = Date.now();
        }
      });
      const table = db.tables.find((t) => t.id === tableId);
      if (!table) return sendJson(res, 404, { error: 'Table not found' });

      if (action === 'occupy') {
        table.status = 'occupied'; table.occupantName = name; table.occupantEmail = email;
        table.dishSummary = body.dishSummary || 'Browsing menu...'; table.updatedAt = Date.now();
        if (db.customers[email]) db.customers[email].tableId = tableId;
      } else if (db.customers[email]) {
        db.customers[email].tableId = null;
      }
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { tables: db.tables });
    }

    // Create Order (COD / Counter / Direct)
    if (pathname === '/api/orders' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const order = createOrderFromPayload(body, {
        paymentMethod: body.paymentMethod === 'razorpay' || body.paymentMethod === 'phonepe' ? body.paymentMethod : 'cod',
        paymentStatus: body.paymentStatus === 'paid' ? 'paid' : 'cod'
      });
      return sendJson(res, 201, { order });
    }

    // Razorpay Gateway: Create Order
    if (pathname === '/api/payments/razorpay/create-order' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!db.settings.razorpayKeyId || !db.settings.razorpayKeySecret) {
        return sendJson(res, 400, { error: 'Razorpay Key ID & Secret not configured in Admin Settings.', needsSetup: true });
      }
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length === 0) return sendJson(res, 400, { error: 'Cart is empty.' });
      const subtotal = items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
      const total = Math.max(1, subtotal - Number(body.discountAmt || 0) + Number(body.deliveryFee || 0));
      const authHeader = 'Basic ' + Buffer.from(`${db.settings.razorpayKeyId}:${db.settings.razorpayKeySecret}`).toString('base64');
      const payload = JSON.stringify({
        amount: Math.round(total * 100),
        currency: 'INR',
        receipt: 'rcpt_' + Date.now()
      });
      const rzpRes = await httpsRequestJson({
        hostname: 'api.razorpay.com',
        path: '/v1/orders',
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, payload);
      if (rzpRes.statusCode >= 400 || !rzpRes.data?.id) {
        return sendJson(res, 400, { error: rzpRes.data?.error?.description || 'Failed to create Razorpay order.' });
      }
      return sendJson(res, 200, {
        orderId: rzpRes.data.id,
        amount: rzpRes.data.amount,
        currency: rzpRes.data.currency || 'INR',
        keyId: db.settings.razorpayKeyId
      });
    }

    // Razorpay Gateway: Verify HMAC Signature & Finalize Order
    if (pathname === '/api/payments/razorpay/verify' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderPayload } = body;
      if (!db.settings.razorpayKeySecret) return sendJson(res, 400, { error: 'Razorpay not configured.' });
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return sendJson(res, 400, { error: 'Missing Razorpay payment signature.' });
      }
      const expected = crypto
        .createHmac('sha256', db.settings.razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      const valid = expected.length === String(razorpay_signature).length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(razorpay_signature)));
      if (!valid) {
        return sendJson(res, 400, { error: 'Invalid Razorpay signature! Payment verification failed.' });
      }
      const order = createOrderFromPayload(orderPayload || {}, {
        paymentMethod: 'razorpay',
        paymentStatus: 'paid',
        paymentId: razorpay_payment_id
      });
      return sendJson(res, 201, { order });
    }

    // PhonePe Gateway / UPI QR Initiation
    if (pathname === '/api/payments/phonepe/initiate' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const orderPayload = body.orderPayload || {};
      const items = Array.isArray(orderPayload.items) ? orderPayload.items : [];
      if (items.length === 0) return sendJson(res, 400, { error: 'Cart is empty.' });
      const subtotal = items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
      const total = Math.max(1, subtotal - Number(orderPayload.discountAmt || 0) + Number(orderPayload.deliveryFee || 0));
      const txnId = 'PP' + Date.now() + Math.floor(100 + Math.random() * 900);
      pendingPayments.set(txnId, { orderPayload, total, createdAt: Date.now() });

      // 1) Official PhonePe PG v1 API if Merchant ID + Salt Key are configured
      if (db.settings.phonepeMerchantId && db.settings.phonepeSaltKey) {
        const origin = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host || `localhost:${PORT}`}`;
        const pgPayload = {
          merchantId: db.settings.phonepeMerchantId,
          merchantTransactionId: txnId,
          merchantUserId: String(orderPayload.customerEmail || 'GUEST').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'GUEST1',
          amount: Math.round(total * 100),
          redirectUrl: `${origin}/?phonepeTxn=${encodeURIComponent(txnId)}`,
          redirectMode: 'REDIRECT',
          callbackUrl: `${origin}/api/payments/phonepe/callback`,
          mobileNumber: String(orderPayload.customerPhone || '').replace(/\D/g, '').slice(-10),
          paymentInstrument: { type: 'PAY_PAGE' }
        };
        const base64 = Buffer.from(JSON.stringify(pgPayload)).toString('base64');
        const saltIndex = db.settings.phonepeSaltIndex || '1';
        const checksum = crypto.createHash('sha256').update(base64 + '/pg/v1/pay' + db.settings.phonepeSaltKey).digest('hex') + '###' + saltIndex;
        const isProd = db.settings.phonepeEnv === 'production';
        const hostname = isProd ? 'api.phonepe.com' : 'api-preprod.phonepe.com';
        const apiPath = isProd ? '/apis/hermes/pg/v1/pay' : '/apis/pg-sandbox/pg/v1/pay';
        const reqBody = JSON.stringify({ request: base64 });
        const ppRes = await httpsRequestJson({
          hostname,
          path: apiPath,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'Content-Length': Buffer.byteLength(reqBody)
          }
        }, reqBody);
        const redirectUrl = ppRes.data?.data?.instrumentResponse?.redirectInfo?.url;
        if (!ppRes.data?.success || !redirectUrl) {
          return sendJson(res, 400, { error: ppRes.data?.message || 'PhonePe gateway error.' });
        }
        return sendJson(res, 200, { mode: 'gateway', redirectUrl, merchantTransactionId: txnId, amount: total });
      }

      // 2) Instant PhonePe / UPI QR Intent if Merchant UPI ID is configured
      if (db.settings.merchantUpiId) {
        const pa = encodeURIComponent(db.settings.merchantUpiId);
        const pn = encodeURIComponent(db.settings.restaurantName || 'Chatkaro Food Hub');
        const tn = encodeURIComponent(`Chatkaro Order ${txnId}`);
        const upiUri = `upi://pay?pa=${pa}&pn=${pn}&am=${total}&cu=INR&tn=${tn}&tr=${encodeURIComponent(txnId)}`;
        const phonepeUri = `phonepe://pay?pa=${pa}&pn=${pn}&am=${total}&cu=INR&tn=${tn}&tr=${encodeURIComponent(txnId)}`;
        return sendJson(res, 200, {
          mode: 'upi-qr',
          merchantTransactionId: txnId,
          merchantUpiId: db.settings.merchantUpiId,
          amount: total,
          upiUri,
          phonepeUri
        });
      }

      return sendJson(res, 400, { error: 'PhonePe Merchant keys or Merchant UPI ID not configured in Admin Settings.', needsSetup: true });
    }

    // PhonePe Gateway Status Verification (after redirect back from PhonePe)
    if (pathname === '/api/payments/phonepe/status' && req.method === 'GET') {
      const txnId = parsedUrl.searchParams.get('txnId') || '';
      const pending = pendingPayments.get(txnId);
      if (!txnId || !pending) return sendJson(res, 404, { error: 'Transaction session not found or already completed.' });
      if (!db.settings.phonepeMerchantId || !db.settings.phonepeSaltKey) {
        return sendJson(res, 400, { error: 'PhonePe gateway not configured.' });
      }
      const isProd = db.settings.phonepeEnv === 'production';
      const hostname = isProd ? 'api.phonepe.com' : 'api-preprod.phonepe.com';
      const statusPath = isProd
        ? `/apis/hermes/pg/v1/status/${db.settings.phonepeMerchantId}/${txnId}`
        : `/apis/pg-sandbox/pg/v1/status/${db.settings.phonepeMerchantId}/${txnId}`;
      const endpointForHash = `/pg/v1/status/${db.settings.phonepeMerchantId}/${txnId}`;
      const saltIndex = db.settings.phonepeSaltIndex || '1';
      const checksum = crypto.createHash('sha256').update(endpointForHash + db.settings.phonepeSaltKey).digest('hex') + '###' + saltIndex;
      const ppRes = await httpsRequestJson({
        hostname,
        path: statusPath,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': db.settings.phonepeMerchantId
        }
      });
      if (ppRes.data?.code !== 'PAYMENT_SUCCESS') {
        return sendJson(res, 400, { error: ppRes.data?.message || 'PhonePe payment not completed.' });
      }
      pendingPayments.delete(txnId);
      const order = createOrderFromPayload(pending.orderPayload, {
        paymentMethod: 'phonepe',
        paymentStatus: 'paid',
        paymentId: ppRes.data?.data?.transactionId || txnId
      });
      return sendJson(res, 200, { order });
    }

    // PhonePe / UPI QR UTR Confirmation
    if (pathname === '/api/payments/phonepe/confirm-upi' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const txnId = String(body.txnId || '').trim();
      const utr = String(body.utr || '').trim();
      const pending = pendingPayments.get(txnId);
      if (!pending) return sendJson(res, 400, { error: 'Payment session expired. Please try again.' });
      if (utr.length < 6) return sendJson(res, 400, { error: 'Please enter valid UPI / PhonePe UTR Reference No. (min 6 chars).' });
      pendingPayments.delete(txnId);
      const order = createOrderFromPayload(pending.orderPayload, {
        paymentMethod: 'phonepe',
        paymentStatus: 'paid',
        paymentId: `UPI-${utr}`
      });
      return sendJson(res, 201, { order });
    }

    // Update or Cancel Order
    if (pathname.startsWith('/api/orders/') && req.method === 'PUT') {
      const orderId = pathname.split('/').pop();
      const body = await readJsonBody(req);
      const order = db.orders.find((o) => o.id === orderId);
      if (!order) return sendJson(res, 404, { error: 'Order not found.' });

      const isAdmin = requireAdmin(req, body);
      const callerEmail = String(body.customerEmail || '').trim().toLowerCase();
      if (!isAdmin && (!callerEmail || callerEmail !== order.customerEmail)) {
        return sendJson(res, 403, { error: 'Unauthorized.' });
      }
      if (body.items && Array.isArray(body.items) && body.items.length > 0) {
        order.items = body.items;
        order.subtotal = order.items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
        order.total = Math.max(0, order.subtotal - (order.discountAmt || 0) + (order.deliveryFee || 0));
      }
      if (body.detail !== undefined) order.detail = String(body.detail);

      if (body.action === 'cancel' || body.status === 'cancelled') {
        order.status = 'cancelled';
        order.cancelReason = String(body.cancelReason || (isAdmin ? 'Cancelled by owner' : 'Cancelled by customer'));
        order.etaMinutes = 0; order.etaEndsAt = Date.now();
      } else if (isAdmin) {
        if (body.status) order.status = String(body.status);
        if (body.etaMinutes !== undefined) {
          const mins = Math.max(0, Number(body.etaMinutes));
          order.etaMinutes = mins; order.etaEndsAt = Date.now() + mins * 60000;
        }
      }
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { order });
    }

    if (pathname === '/api/admin/orders/purge-fake' && req.method === 'DELETE') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      db.orders = db.orders.filter((o) => !o.isFake);
      Object.keys(db.customers).forEach((k) => {
        if (db.customers[k]?.isFake) delete db.customers[k];
      });
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true });
    }

    if (pathname.startsWith('/api/admin/orders/') && pathname.endsWith('/fake') && req.method === 'POST') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      const parts = pathname.split('/');
      const orderId = parts[parts.length - 2];
      const ord = db.orders.find((o) => o.id === orderId);
      if (!ord) return sendJson(res, 404, { error: 'Order not found.' });
      ord.isFake = true;
      ord.status = 'cancelled';
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true });
    }

    if (pathname.startsWith('/api/admin/orders/') && req.method === 'DELETE') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      const orderId = pathname.split('/').pop();
      db.orders = db.orders.filter((o) => o.id !== orderId);
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true });
    }

    // Reviews & Maps Sync
    if (pathname === '/api/reviews' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const author = String(body.author || 'Guest').trim();
      const text = String(body.text || '').trim();
      const rating = Math.min(5, Math.max(1, Number(body.rating || 5)));
      if (!text) return sendJson(res, 400, { error: 'Review text required.' });
      const rev = { id: 'rev-' + Date.now(), author, rating, text, source: body.source === 'Google Maps' ? 'Google Maps' : 'Website Guest', meta: body.meta || 'Pure Vegetarian • Talala', createdAt: Date.now() };
      db.reviews.unshift(rev);
      db.settings.reviewCount += 1;
      db.settings.lastMapsSyncAt = Date.now();
      recalculateTopAndBroadcast();
      return sendJson(res, 201, { review: rev });
    }

    if (pathname === '/api/maps-sync' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (db.settings.googlePlacesApiKey && db.settings.googlePlaceId) {
        try {
          const placesRes = await fetchGooglePlaces(db.settings.googlePlaceId, db.settings.googlePlacesApiKey);
          if (placesRes.status === 'OK' && placesRes.result) {
            const r = placesRes.result;
            if (r.name) db.settings.restaurantName = r.name;
            if (r.rating) db.settings.rating = r.rating;
            if (r.user_ratings_total) db.settings.reviewCount = r.user_ratings_total;
            if (r.formatted_address) db.settings.address = r.formatted_address;
            if (r.opening_hours?.weekday_text) {
              const todayIdx = (new Date().getDay() + 6) % 7;
              db.settings.openHoursText = r.opening_hours.weekday_text[todayIdx] || db.settings.openHoursText;
            }
            if (Array.isArray(r.reviews)) {
              r.reviews.forEach((gr) => {
                if (gr.text && !db.reviews.some((lr) => lr.author === gr.author_name && lr.text === gr.text)) {
                  db.reviews.unshift({
                    id: 'gmap-' + (gr.time || Date.now()), author: gr.author_name || 'Google Maps Reviewer',
                    rating: gr.rating || 5, text: gr.text, source: 'Google Maps',
                    meta: gr.relative_time_description || 'Google Maps Live Sync',
                    createdAt: (gr.time || Math.floor(Date.now() / 1000)) * 1000
                  });
                }
              });
            }
            if (Array.isArray(r.photos)) {
              r.photos.slice(0, 10).forEach((ph, idx) => {
                const photoUrl = `/api/maps-photo?ref=${encodeURIComponent(ph.photo_reference)}`;
                if (!db.mapPhotos.some((p) => p.url === photoUrl)) {
                  db.mapPhotos.unshift({
                    id: 'gph-' + Date.now() + '-' + idx, title: 'Google Maps Photo',
                    category: idx % 2 === 0 ? 'food' : 'vibe', uploader: 'Google Maps Live Sync',
                    url: photoUrl, createdAt: Date.now()
                  });
                }
              });
            }
            db.settings.lastMapsSyncAt = Date.now();
            recalculateTopAndBroadcast();
            return sendJson(res, 200, { synced: true, mode: 'google-places-api' });
          }
          return sendJson(res, 400, { error: `Places API: ${placesRes.status || 'Error'}` });
        } catch (err) {
          return sendJson(res, 500, { error: err.message });
        }
      }
      if (body.author && body.text) {
        db.reviews.unshift({
          id: 'gmap-' + Date.now(), author: String(body.author).trim(),
          rating: Math.min(5, Math.max(1, Number(body.rating || 5))), text: String(body.text).trim(),
          source: 'Google Maps', meta: 'Synced from Google Maps', createdAt: Date.now()
        });
        db.settings.reviewCount += 1;
      }
      db.settings.lastMapsSyncAt = Date.now();
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { synced: true, mode: 'local-bridge' });
    }

    // Live Chat
    if (pathname === '/api/chat' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const text = String(body.text || '').trim();
      const senderName = String(body.senderName || 'Guest').trim();
      const senderEmail = String(body.senderEmail || '').trim().toLowerCase();
      if (!text) return sendJson(res, 400, { error: 'Message empty.' });
      const msg = {
        id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        senderName, senderEmail, tableId: body.tableId ? Number(body.tableId) : null,
        isOwner: Boolean(body.isOwner && requireAdmin(req, body)),
        text: text.slice(0, 280), createdAt: Date.now()
      };
      db.chatMessages.push(msg);
      if (db.chatMessages.length > 80) db.chatMessages = db.chatMessages.slice(-80);
      recalculateTopAndBroadcast();
      return sendJson(res, 201, { message: msg });
    }

    if (pathname.startsWith('/api/admin/chat/') && req.method === 'DELETE') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      const msgId = pathname.split('/').pop();
      db.chatMessages = db.chatMessages.filter((m) => m.id !== msgId);
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true });
    }

    // ================= ADMIN SECURITY & ANALYTICS =================
    if (pathname === '/api/admin/verify' && req.method === 'POST') {
      const ip = req.socket.remoteAddress || 'local';
      const attempt = pinAttempts.get(ip) || { count: 0, lockedUntil: 0 };
      if (Date.now() < attempt.lockedUntil) {
        const secs = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
        return sendJson(res, 429, { error: `Too many wrong PIN attempts. Wait ${secs}s.` });
      }
      const body = await readJsonBody(req);
      if (String(body.adminPin || '') !== String(db.settings.adminPin)) {
        attempt.count += 1;
        if (attempt.count >= 5) {
          attempt.lockedUntil = Date.now() + 30000;
          attempt.count = 0;
        }
        pinAttempts.set(ip, attempt);
        return sendJson(res, 401, { error: 'Wrong Owner PIN! Access denied.' });
      }
      pinAttempts.delete(ip);
      const token = crypto.randomBytes(24).toString('hex');
      adminTokens.add(token);
      return sendJson(res, 200, {
        ok: true,
        adminToken: token,
        settings: { ...db.settings, adminPin: undefined },
        sales: computeSalesAnalytics()
      });
    }

    if (pathname === '/api/admin/logout' && req.method === 'POST') {
      const token = req.headers['x-admin-token'];
      if (token) adminTokens.delete(token);
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/admin/change-pin' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      if (String(body.currentPin || '') !== String(db.settings.adminPin)) {
        return sendJson(res, 400, { error: 'Current PIN does not match.' });
      }
      const nextPin = String(body.newPin || '').trim();
      if (nextPin.length < 4) return sendJson(res, 400, { error: 'New PIN must be at least 4 characters.' });
      db.settings.adminPin = nextPin;
      adminTokens.clear();
      const token = crypto.randomBytes(24).toString('hex');
      adminTokens.add(token);
      saveDb();
      return sendJson(res, 200, { ok: true, adminToken: token });
    }

    if (pathname === '/api/admin/sales' && req.method === 'GET') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      return sendJson(res, 200, { sales: computeSalesAnalytics() });
    }

    if (pathname === '/api/admin/theme' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      db.settings.brandTheme = { ...db.settings.brandTheme, ...(body.brandTheme || {}) };
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { brandTheme: db.settings.brandTheme });
    }

const CATEGORY_DEFAULT_PHOTO = {
  'veg-prep': 'assets/veg-kadai.jpg',
  'kaju-prep': 'assets/kaju-curry.jpg',
  'cheese-prep': 'assets/cheese-masala.jpg',
  'tandoor': 'assets/dishes/pun-butter-naan.jpg',
  'south-indian': 'assets/dosa-platter.jpg',
  'chinese': 'assets/indo-chinese.jpg',
  'punjabi': 'assets/punjabi-paneer.jpg',
  'fast-food': 'assets/fastfood-drinks.jpg',
  'beverages': 'assets/dishes/bev-mango-lassi.jpg'
};

async function autoFetchDishPhoto(dishName, category, dishId) {
  const fallback = CATEGORY_DEFAULT_PHOTO[category] || 'assets/veg-kadai.jpg';
  try {
    const cleanQuery = String(dishName || '').replace(/\(.*?\)/g, '').trim();
    if (!cleanQuery) return fallback;
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(cleanQuery + ' indian dish food filetype:bitmap')}&gsrlimit=12&prop=imageinfo|categories&iiprop=url|mime|size&iiurlwidth=720&cllimit=20&format=json`;
    const r = await fetch(searchUrl, { headers: { 'User-Agent': 'ChatkaroFoodHub/1.0' } });
    if (!r.ok) return fallback;
    const j = await r.json();
    const badWords = /chicken|egg|meat|fish|prawn|shrimp|mutton|beef|pork|crab|ham|bacon|sausage|turkey|salmon|tuna|duck|beer|wine|alcohol|kingfisher|bottle|burger king|mcdonald|kfc|subway|book|cookery|1919|portrait|person|man|woman|boy|girl|selfie|cosplay|japanimes|festival|event|logo|icon|map|chart/i;
    const goodCats = /food|dish|cuisine|indian|soup|rice|dosa|curry|paneer|burger|sandwich|vegetarian|noodle|street food|meals|snacks|masala|bread|naan|roti|dessert|drink|beverage/i;
    const candidates = Object.values(j.query?.pages || {})
      .map((p) => ({
        title: p.title || '',
        url: p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url || '',
        mime: p.imageinfo?.[0]?.mime || '',
        w: p.imageinfo?.[0]?.width || 0,
        cats: (p.categories || []).map((c) => c.title).join(' | ')
      }))
      .filter((x) => (
        x.url &&
        x.mime === 'image/jpeg' &&
        x.w >= 400 &&
        !badWords.test(x.title) &&
        !badWords.test(x.cats) &&
        goodCats.test(`${x.cats} ${x.title}`)
      ));
    if (!candidates.length) return fallback;

    const imgRes = await fetch(candidates[0].url, { headers: { 'User-Agent': 'ChatkaroFoodHub/1.0' } });
    if (!imgRes.ok) return fallback;
    const buf = Buffer.from(await imgRes.arrayBuffer());
    if (buf.length < 7000) return fallback;

    const dishesDir = path.join(ROOT_DIR, 'assets', 'dishes');
    if (!fs.existsSync(dishesDir)) fs.mkdirSync(dishesDir, { recursive: true });
    const slug = cleanQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'dish';
    const fileName = `${slug}-${String(dishId).slice(-5)}.jpg`;
    fs.writeFileSync(path.join(dishesDir, fileName), buf);
    return `assets/dishes/${fileName}`;
  } catch {
    return fallback;
  }
}

    if (pathname === '/api/admin/menu' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const item = body.item || {};
      if (!item.name || item.price === undefined) return sendJson(res, 400, { error: 'Name and price required.' });
      if (item.id && db.menu.some((m) => m.id === item.id)) {
        db.menu = db.menu.map((m) => (m.id === item.id ? { ...m, ...item, price: Number(item.price) } : m));
      } else {
        const newId = 'dish-' + Date.now();
        const cat = item.category || 'fast-food';
        const customImg = String(item.image || '').trim();
        const resolvedImg = customImg || (await autoFetchDishPhoto(item.name, cat, newId));
        db.menu.unshift({
          id: newId,
          name: String(item.name).trim(),
          guName: String(item.guName || '').trim(),
          category: cat,
          price: Number(item.price),
          emoji: item.emoji || '🍲',
          image: resolvedImg,
          portion: String(item.portion || 'Full Portion').trim(),
          servedWith: String(item.servedWith || 'Fresh Chutney & Onion-Lemon Salad').trim(),
          desc: String(item.desc || 'Freshly prepared pure vegetarian dish at Chatkaro Food Hub.'),
          bestseller: Boolean(item.bestseller),
          spicy: Boolean(item.spicy),
          available: item.available !== false
        });
      }
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { menu: db.menu });
    }

    if (pathname === '/api/admin/upload-dish-photo' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const dishId = String(body.dishId || '').trim();
      const dataUrl = String(body.dataUrl || '').trim();
      const match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/i);
      if (!match) return sendJson(res, 400, { error: 'Invalid image format. Please choose JPG, PNG, or WebP.' });
      const buf = Buffer.from(match[2], 'base64');
      if (buf.length > 5e6) return sendJson(res, 400, { error: 'Image must be under 5 MB.' });

      const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
      const dishesDir = path.join(ROOT_DIR, 'assets', 'dishes');
      if (!fs.existsSync(dishesDir)) fs.mkdirSync(dishesDir, { recursive: true });
      const safeId = (dishId || 'dish').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 28) || 'dish';
      const fileName = `upload-${safeId}-${Date.now()}.${ext}`;
      fs.writeFileSync(path.join(dishesDir, fileName), buf);
      const imagePath = `assets/dishes/${fileName}`;

      if (dishId) {
        db.menu = db.menu.map((m) => (m.id === dishId ? { ...m, image: imagePath } : m));
        recalculateTopAndBroadcast();
      }
      return sendJson(res, 200, { ok: true, image: imagePath, menu: db.menu });
    }

    if (pathname.startsWith('/api/admin/menu/') && pathname.endsWith('/auto-photo') && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const parts = pathname.split('/').filter(Boolean);
      const id = parts[parts.length - 2];
      const dish = db.menu.find((m) => m.id === id);
      if (!dish) return sendJson(res, 404, { error: 'Dish not found.' });
      const newImg = await autoFetchDishPhoto(dish.name, dish.category, dish.id);
      dish.image = newImg;
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true, image: newImg, menu: db.menu });
    }

    if (pathname.startsWith('/api/admin/menu/') && pathname.endsWith('/photo') && req.method === 'DELETE') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      const parts = pathname.split('/').filter(Boolean);
      const id = parts[parts.length - 2];
      const dish = db.menu.find((m) => m.id === id);
      if (!dish) return sendJson(res, 404, { error: 'Dish not found.' });
      if (dish.image && String(dish.image).startsWith('assets/dishes/upload-')) {
        const oldPath = path.join(ROOT_DIR, dish.image);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch {}
        }
      }
      dish.image = '__NONE__';
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true, menu: db.menu });
    }

    if (pathname.startsWith('/api/admin/menu/') && req.method === 'DELETE') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      const id = pathname.split('/').pop();
      db.menu = db.menu.filter((m) => m.id !== id);
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { menu: db.menu });
    }

    if (pathname === '/api/admin/tables' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const t = body.table || {};
      if (t.id && db.tables.some((x) => x.id === Number(t.id))) {
        db.tables = db.tables.map((x) => x.id === Number(t.id) ? { ...x, label: t.label || x.label, seats: Number(t.seats || x.seats), status: t.status || x.status } : x);
      } else {
        const nextId = db.tables.reduce((max, x) => Math.max(max, x.id), 0) + 1;
        db.tables.push({ id: nextId, label: String(t.label || `Table ${nextId}`).trim(), seats: Number(t.seats || 4), status: 'available', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: Date.now() });
      }
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { tables: db.tables });
    }

    if (pathname.startsWith('/api/admin/tables/') && req.method === 'DELETE') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      const tid = Number(pathname.split('/').pop());
      db.tables = db.tables.filter((t) => t.id !== tid);
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { tables: db.tables });
    }

    if (pathname === '/api/admin/reviews' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const r = body.review || {};
      if (r.id && db.reviews.some((x) => x.id === r.id)) {
        db.reviews = db.reviews.map((x) => (x.id === r.id ? { ...x, ...r, rating: Number(r.rating || x.rating) } : x));
      } else {
        db.reviews.unshift({ id: 'rev-' + Date.now(), author: String(r.author || 'Guest').trim(), rating: Math.min(5, Math.max(1, Number(r.rating || 5))), text: String(r.text || '').trim(), source: r.source || 'Google Maps', meta: r.meta || 'Verified Review', createdAt: Date.now() });
        db.settings.reviewCount += 1;
      }
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { reviews: db.reviews });
    }

    if (pathname.startsWith('/api/admin/reviews/') && req.method === 'DELETE') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      const rid = pathname.split('/').pop();
      db.reviews = db.reviews.filter((r) => r.id !== rid);
      db.settings.reviewCount = Math.max(0, db.settings.reviewCount - 1);
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { reviews: db.reviews });
    }

    if (pathname === '/api/admin/photos' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const p = body.photo || {};
      if (!p.title || !p.url) return sendJson(res, 400, { error: 'Photo title and image required.' });
      if (p.id && db.mapPhotos.some((x) => x.id === p.id)) {
        db.mapPhotos = db.mapPhotos.map((x) => (x.id === p.id ? { ...x, ...p } : x));
      } else {
        db.mapPhotos.unshift({ id: 'mp-' + Date.now(), title: String(p.title).trim(), category: p.category || 'owner', uploader: String(p.uploader || 'By Owner • Google Maps'), url: String(p.url), createdAt: Date.now() });
      }
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { mapPhotos: db.mapPhotos });
    }

    if (pathname.startsWith('/api/admin/photos/') && req.method === 'DELETE') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      const pid = pathname.split('/').pop();
      db.mapPhotos = db.mapPhotos.filter((p) => p.id !== pid);
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { mapPhotos: db.mapPhotos });
    }

    if (pathname === '/api/admin/customers' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const c = body.customer || {};
      const email = String(c.email || '').trim().toLowerCase();
      if (!email) return sendJson(res, 400, { error: 'Customer email required.' });
      db.customers[email] = { ...(db.customers[email] || { email, bio: 'Chatkaro Foodie', favoriteDish: 'Masala Dosa', avatarColor: '#ea580c', tableId: null }), ...c, email, ordersCount: Number(c.ordersCount || 0), totalSpent: Number(c.totalSpent || 0), bestGameScore: Number(c.bestGameScore || 0) };
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true });
    }

    if (pathname.startsWith('/api/admin/customers/') && req.method === 'DELETE') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      const email = decodeURIComponent(pathname.split('/').pop()).toLowerCase();
      delete db.customers[email];
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/admin/settings' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const s = body.settings || {};
      [
        'restaurantName', 'openHoursText', 'announcement', 'dailyDeal', 'phone', 'priceRange',
        'instagramHandle', 'instagramReels',
        'address', 'plusCode', 'googleClientId', 'googlePlacesApiKey', 'googlePlaceId', 'geminiApiKey',
        'merchantUpiId', 'razorpayKeyId', 'razorpayKeySecret',
        'phonepeMerchantId', 'phonepeSaltKey', 'phonepeSaltIndex', 'phonepeEnv'
      ].forEach((k) => {
        if (s[k] !== undefined) db.settings[k] = String(s[k]).trim();
      });
      if (s.rating !== undefined) db.settings.rating = Number(s.rating);
      if (s.reviewCount !== undefined) db.settings.reviewCount = Number(s.reviewCount);
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true });
    }

    // Multiplayer Game Room
    if (pathname === '/api/game/join' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const code = String(body.roomCode || 'CHEF1').trim().toUpperCase().slice(0, 10);
      const playerId = String(body.playerId || 'p-' + Date.now());
      const playerName = String(body.playerName || 'Chef').trim();
      const mode = body.mode === 'coop' ? 'coop' : 'versus';
      let room = gameRooms.get(code);
      if (!room) {
        room = { code, mode, status: 'waiting', startedAt: null, durationSec: 45, players: {} };
        gameRooms.set(code, room);
      }
      room.players[playerId] = { id: playerId, name: playerName, x: 320, score: 0, tableId: body.tableId || null, lastSeen: Date.now() };
      broadcast('game', serializeRoom(room));
      return sendJson(res, 200, { room: serializeRoom(room) });
    }

    if (pathname === '/api/game/start' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const code = String(body.roomCode || 'CHEF1').trim().toUpperCase();
      const room = gameRooms.get(code);
      if (!room) return sendJson(res, 404, { error: 'Room not found' });
      room.status = 'playing'; room.startedAt = Date.now();
      Object.values(room.players).forEach((p) => (p.score = 0));
      broadcast('game', serializeRoom(room));
      return sendJson(res, 200, { room: serializeRoom(room) });
    }

    if (pathname === '/api/game/state' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const code = String(body.roomCode || '').trim().toUpperCase();
      const room = gameRooms.get(code);
      if (!room) return sendJson(res, 404, { error: 'Room not found' });
      const p = room.players[body.playerId];
      if (p) {
        if (typeof body.x === 'number') p.x = body.x;
        if (typeof body.score === 'number') p.score = body.score;
        p.lastSeen = Date.now();
      }
      if (body.bestScore && body.email && db.customers[body.email.toLowerCase()]) {
        const c = db.customers[body.email.toLowerCase()];
        if (Number(body.bestScore) > (c.bestGameScore || 0)) {
          c.bestGameScore = Number(body.bestScore);
          recalculateTopAndBroadcast();
        }
      }
      broadcast('game', serializeRoom(room));
      return sendJson(res, 200, { room: serializeRoom(room) });
    }

    if (pathname === '/api/game/score' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const score = Number(body.score || 0);
      if (email && db.customers[email] && score > (db.customers[email].bestGameScore || 0)) {
        db.customers[email].bestGameScore = score;
        recalculateTopAndBroadcast();
      }
      return sendJson(res, 200, { ok: true });
    }
  } catch (err) {
    return sendJson(res, 400, { error: err.message });
  }

  let filePath = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, '');
  const fullPath = path.join(ROOT_DIR, safePath);
  if (!fullPath.startsWith(ROOT_DIR) || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not found');
  }
  const ext = path.extname(fullPath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(fullPath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Chatkaro Food Hub live server running at http://localhost:${PORT}`);
});
