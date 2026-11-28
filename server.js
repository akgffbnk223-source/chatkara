const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const tls = require('tls');
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
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.apk': 'application/vnd.android.package-archive'
};

const DEFAULT_MENU = require('./menu-data.js');

function createDefaultDb() {
  const now = Date.now();
  return {
    settings: {
      restaurantName: 'Chatkaro Food Hub',
      ownerName: 'Het',
      rating: 4.9,
      reviewCount: 113,
      priceRange: '₹1–300 per person',
      address: 'Near Essar Petrol Pump, Opp. Shreeji Super Mart, Talala, Gujarat 362150',
      plusCode: '2GWF+GJ Talala, Gujarat',
      openHoursText: '12:00 PM – 3:00 PM (Break 3–6 PM) • 6:00 PM – 11:50 PM',
      phone: '919054633908',
      instagramHandle: 'chatkaro_the_food_hub',
      instagramReels: 'https://www.instagram.com/reels/DeoG7QDA2O3/\nhttps://www.instagram.com/reel/DfLrI3hzTGD/',
      bgMusicEnabled: true,
      bgMusicUrl: '',
      bgMusicVideoId: '',
      bgMusicPlaylistId: '',
      bgMusicTitle: 'Calm Cafe Music',
      bgVideoEnabled: true,
      bgVideoUrl: '',
      bgVideoVideoId: '',
      bgVideoPlaylistId: '',
      apkDownloadUrl: 'assets/app/Chatkaro-Customer.apk',
      deliveryApkUrl: 'assets/app/Chatkaro-Delivery.apk',
      waiterApkUrl: 'assets/app/Chatkaro-Waiter.apk',
      adminPin: '9054', // Secure Owner PIN (last 4 digits of restaurant phone by default; changeable in Admin)
      staffPin: '1234', // Waiter & Delivery Boy App PIN (changeable in Admin)
      smtpUser: '',
      smtpPass: '',
      resendApiKey: '',
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
    ads: [
      {
        id: 'ad-insta-1',
        title: 'Chatkaro Live Kitchen Reel #1',
        type: 'video',
        url: 'assets/ads/reel-1.mp4',
        linkedDishId: 'veg-angara',
        active: true,
        createdAt: now
      },
      {
        id: 'ad-insta-2',
        title: 'Chatkaro Special Dish Reel #2',
        type: 'video',
        url: 'assets/ads/reel-2.mp4',
        linkedDishId: 'cheese-anguri',
        active: true,
        createdAt: now - 1000
      }
    ],
    tables: [
      { id: 1, label: 'Table 1', seats: 4, status: 'available', photo: 'assets/tables/table-4seat.jpg', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now },
      { id: 2, label: 'Table 2', seats: 4, status: 'available', photo: 'assets/tables/table-4seat.jpg', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now },
      { id: 3, label: 'Table 3', seats: 6, status: 'available', photo: 'assets/tables/table-family.jpg', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now },
      { id: 4, label: 'Table 4', seats: 2, status: 'available', photo: 'assets/tables/table-2seat.jpg', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now },
      { id: 5, label: 'Table 5', seats: 4, status: 'available', photo: 'assets/tables/table-4seat.jpg', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now },
      { id: 6, label: 'Table 6', seats: 6, status: 'available', photo: 'assets/tables/table-family.jpg', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now },
      { id: 7, label: 'Table 7', seats: 4, status: 'available', photo: 'assets/tables/table-4seat.jpg', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now },
      { id: 8, label: 'Table 8 (Family)', seats: 8, status: 'available', photo: 'assets/tables/table-family.jpg', occupantName: '', occupantEmail: '', dishSummary: '', updatedAt: now }
    ],
    customers: {},
    orders: [],
    notifications: [],
    waiterCalls: [],
    waiterChats: [],
    deliveryChats: [],
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

const CP1252_EXTRA_MAP = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
  0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
  0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
  0x017E: 0x9E, 0x0178: 0x9F
};

function fixMojibakeString(str) {
  if (typeof str !== 'string' || !str) return str;
  let cur = str;
  for (let pass = 0; pass < 6; pass++) {
    if (!/[\u00C3\u00C2\u00E2\u00F0\u00E0\u0080-\u009F]/.test(cur)) break;
    const bytes = [];
    let ok = true;
    for (const ch of cur) {
      const code = ch.codePointAt(0);
      if (code <= 0xFF) bytes.push(code);
      else if (CP1252_EXTRA_MAP[code] !== undefined) bytes.push(CP1252_EXTRA_MAP[code]);
      else { ok = false; break; }
    }
    if (!ok) break;
    const next = Buffer.from(bytes).toString('utf8');
    if (!next || next === cur || next.includes('\uFFFD')) break;
    cur = next;
  }
  return cur;
}

function fixMojibakeDeep(val) {
  if (typeof val === 'string') return fixMojibakeString(val);
  if (Array.isArray(val)) return val.map(fixMojibakeDeep);
  if (val && typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) out[k] = fixMojibakeDeep(v);
    return out;
  }
  return val;
}

function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const rawText = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = fixMojibakeDeep(JSON.parse(rawText));
      const def = createDefaultDb();
      if (!parsed.mapPhotos) parsed.mapPhotos = def.mapPhotos;
      if (!parsed.settings) parsed.settings = def.settings;
      if (!parsed.settings.brandTheme) parsed.settings.brandTheme = def.settings.brandTheme;
      if (!parsed.settings.dailyDeal) parsed.settings.dailyDeal = def.settings.dailyDeal;
      ['ownerName', 'staffPin', 'smtpUser', 'smtpPass', 'resendApiKey', 'merchantUpiId', 'razorpayKeyId', 'razorpayKeySecret', 'phonepeMerchantId', 'phonepeSaltKey', 'phonepeSaltIndex', 'phonepeEnv', 'bgMusicEnabled', 'bgMusicUrl', 'bgMusicVideoId', 'bgMusicPlaylistId', 'bgMusicTitle', 'bgVideoEnabled', 'bgVideoUrl', 'bgVideoVideoId', 'bgVideoPlaylistId', 'apkDownloadUrl', 'instagramHandle', 'instagramReels'].forEach((k) => {
        if (parsed.settings[k] === undefined) parsed.settings[k] = def.settings[k];
      });
      if (!Array.isArray(parsed.notifications)) parsed.notifications = [];
      if (!Array.isArray(parsed.waiterCalls)) parsed.waiterCalls = [];
      if (!Array.isArray(parsed.waiterChats)) parsed.waiterChats = [];
      if (!Array.isArray(parsed.deliveryChats)) parsed.deliveryChats = [];
      if (Array.isArray(parsed.tables)) {
        const defTMap = new Map(def.tables.map((t) => [t.id, t]));
        parsed.tables = parsed.tables.map((t) => ({
          ...t,
          photo: t.photo || defTMap.get(t.id)?.photo || 'assets/dining-vibe.jpg'
        }));
      }
      if (!parsed.settings.smtpUser && process.env.SMTP_USER) parsed.settings.smtpUser = process.env.SMTP_USER.trim();
      if (!parsed.settings.smtpPass && process.env.SMTP_PASS) parsed.settings.smtpPass = process.env.SMTP_PASS.trim();
      if (!parsed.settings.resendApiKey && process.env.RESEND_API_KEY) parsed.settings.resendApiKey = process.env.RESEND_API_KEY.trim();
      if (process.env.STAFF_PIN) parsed.settings.staffPin = process.env.STAFF_PIN.trim();
      // Preserve env fallbacks if runtime settings are unset
      if (!parsed.settings.bgMusicUrl && process.env.BG_MUSIC_URL) {
        parsed.settings.bgMusicUrl = process.env.BG_MUSIC_URL.trim();
        parsed.settings.bgMusicVideoId = extractYoutubeVideoId(parsed.settings.bgMusicUrl);
        parsed.settings.bgMusicPlaylistId = extractYoutubePlaylistId(parsed.settings.bgMusicUrl);
      }
      if (!parsed.settings.bgVideoUrl && process.env.BG_VIDEO_URL) {
        parsed.settings.bgVideoUrl = process.env.BG_VIDEO_URL.trim();
        parsed.settings.bgVideoVideoId = extractYoutubeVideoId(parsed.settings.bgVideoUrl);
        parsed.settings.bgVideoPlaylistId = extractYoutubePlaylistId(parsed.settings.bgVideoUrl);
      }
      if (!parsed.settings.bgMusicTitle && process.env.BG_MUSIC_TITLE) parsed.settings.bgMusicTitle = process.env.BG_MUSIC_TITLE.trim();
      if (!parsed.settings.razorpayKeyId && process.env.RAZORPAY_KEY_ID) parsed.settings.razorpayKeyId = process.env.RAZORPAY_KEY_ID.trim();
      if (!parsed.settings.razorpayKeySecret && process.env.RAZORPAY_KEY_SECRET) parsed.settings.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET.trim();
      if (!parsed.settings.phonepeMerchantId && process.env.PHONEPE_MERCHANT_ID) parsed.settings.phonepeMerchantId = process.env.PHONEPE_MERCHANT_ID.trim();
      if (!parsed.settings.phonepeSaltKey && process.env.PHONEPE_SALT_KEY) parsed.settings.phonepeSaltKey = process.env.PHONEPE_SALT_KEY.trim();
      if (!parsed.settings.merchantUpiId && process.env.MERCHANT_UPI_ID) parsed.settings.merchantUpiId = process.env.MERCHANT_UPI_ID.trim();
      if (process.env.ADMIN_PIN) parsed.settings.adminPin = process.env.ADMIN_PIN.trim();

      if (!Array.isArray(parsed.menu)) parsed.menu = [];
      const existingById = new Map(parsed.menu.map((m) => [m.id, m]));
      const mergedMenu = DEFAULT_MENU.map((dm, idx) => {
        const existing = existingById.get(dm.id);
        const defaultDisc = dm.discountPct !== undefined ? dm.discountPct : (dm.bestseller ? 15 : (idx % 3 === 0 ? 10 : 5));
        const base = existing ? { ...dm, ...existing, category: dm.category || existing.category, image: dm.image || existing.image, guName: dm.guName || existing.guName, portion: existing.portion || dm.portion, servedWith: existing.servedWith || dm.servedWith } : { ...dm };
        if (base.discountPct === undefined) base.discountPct = defaultDisc;
        return base;
      });
      const defaultIds = new Set(DEFAULT_MENU.map((m) => m.id));
      parsed.menu.forEach((m) => {
        if (!defaultIds.has(m.id) && m.id !== 'pun-kaju-curry') {
          if (m.discountPct === undefined) m.discountPct = 10;
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
  initial.menu = initial.menu.map((m, idx) => ({
    ...m,
    discountPct: m.discountPct !== undefined ? m.discountPct : (m.bestseller ? 15 : (idx % 3 === 0 ? 10 : 5))
  }));
  if (process.env.BG_MUSIC_URL) {
    initial.settings.bgMusicUrl = process.env.BG_MUSIC_URL.trim();
    initial.settings.bgMusicVideoId = extractYoutubeVideoId(initial.settings.bgMusicUrl);
    initial.settings.bgMusicPlaylistId = extractYoutubePlaylistId(initial.settings.bgMusicUrl);
  }
  if (process.env.BG_VIDEO_URL) {
    initial.settings.bgVideoUrl = process.env.BG_VIDEO_URL.trim();
    initial.settings.bgVideoVideoId = extractYoutubeVideoId(initial.settings.bgVideoUrl);
    initial.settings.bgVideoPlaylistId = extractYoutubePlaylistId(initial.settings.bgVideoUrl);
  }
  if (process.env.BG_MUSIC_TITLE) initial.settings.bgMusicTitle = process.env.BG_MUSIC_TITLE.trim();
  if (process.env.RAZORPAY_KEY_ID) initial.settings.razorpayKeyId = process.env.RAZORPAY_KEY_ID.trim();
  if (process.env.RAZORPAY_KEY_SECRET) initial.settings.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET.trim();
  if (process.env.PHONEPE_MERCHANT_ID) initial.settings.phonepeMerchantId = process.env.PHONEPE_MERCHANT_ID.trim();
  if (process.env.PHONEPE_SALT_KEY) initial.settings.phonepeSaltKey = process.env.PHONEPE_SALT_KEY.trim();
  if (process.env.MERCHANT_UPI_ID) initial.settings.merchantUpiId = process.env.MERCHANT_UPI_ID.trim();
  if (process.env.ADMIN_PIN) initial.settings.adminPin = process.env.ADMIN_PIN.trim();
  if (process.env.STAFF_PIN) initial.settings.staffPin = process.env.STAFF_PIN.trim();
  if (process.env.SMTP_USER) initial.settings.smtpUser = process.env.SMTP_USER.trim();
  if (process.env.SMTP_PASS) initial.settings.smtpPass = process.env.SMTP_PASS.trim();
  if (process.env.RESEND_API_KEY) initial.settings.resendApiKey = process.env.RESEND_API_KEY.trim();
  fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  return initial;
}

let db = loadDb();
saveDb();
const gameRooms = new Map();
const adminTokens = new Set();
const staffTokens = new Set();
const pendingOtps = new Map(); // email -> { otp, name, phone, expiresAt, attempts }
const pinAttempts = new Map(); // ip -> { count, lockedUntil }
const pendingPayments = new Map(); // txnId -> checkout snapshot

function requireStaffOrAdmin(req, body) {
  if (requireAdmin(req, body)) return true;
  const st = req.headers['x-staff-token'] || body?.staffToken;
  if (st && staffTokens.has(st)) return true;
  const sp = req.headers['x-staff-pin'] || body?.staffPin;
  if (sp && String(sp) === String(db.settings.staffPin || '1234')) return true;
  return false;
}

function sendSmtpEmailTls({ user, pass, to, subject, html, text }) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(465, 'smtp.gmail.com', { servername: 'smtp.gmail.com' });
    let step = 0;
    let buf = '';
    const cleanup = (err) => {
      try { socket.destroy(); } catch {}
      if (err) reject(err);
    };
    socket.setTimeout(12000, () => cleanup(new Error('SMTP timeout')));
    socket.on('error', (err) => cleanup(err));
    socket.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      if (!buf.includes('\r\n')) return;
      const lines = buf.split('\r\n');
      const last = lines[lines.length - 2] || '';
      if (/^\d{3}-/.test(last)) return; // multiline response still coming
      buf = '';
      const code = parseInt(last.slice(0, 3), 10);
      if (code >= 400) return cleanup(new Error(`SMTP ${last}`));
      if (step === 0) { step = 1; socket.write(`EHLO chatkaro.local\r\n`); }
      else if (step === 1) { step = 2; socket.write(`AUTH LOGIN\r\n`); }
      else if (step === 2) { step = 3; socket.write(Buffer.from(user).toString('base64') + '\r\n'); }
      else if (step === 3) { step = 4; socket.write(Buffer.from(pass).toString('base64') + '\r\n'); }
      else if (step === 4) { step = 5; socket.write(`MAIL FROM:<${user}>\r\n`); }
      else if (step === 5) { step = 6; socket.write(`RCPT TO:<${to}>\r\n`); }
      else if (step === 6) { step = 7; socket.write(`DATA\r\n`); }
      else if (step === 7) {
        step = 8;
        const boundary = 'cb_' + Date.now();
        const msg = [
          `From: "${db.settings.restaurantName || 'Chatkaro Food Hub'}" <${user}>`,
          `To: <${to}>`,
          `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          ``,
          `--${boundary}`,
          `Content-Type: text/plain; charset="utf-8"`,
          ``,
          text || subject,
          `--${boundary}`,
          `Content-Type: text/html; charset="utf-8"`,
          ``,
          html || `<p>${text || subject}</p>`,
          `--${boundary}--`,
          `.`
        ].join('\r\n');
        socket.write(msg + '\r\n');
      } else if (step === 8) {
        step = 9;
        socket.write(`QUIT\r\n`);
        socket.end();
        resolve({ sent: true, method: 'gmail-smtp' });
      }
    });
  });
}

async function sendEmailViaGmailOrResend({ to, subject, html, text }) {
  const resendKey = String(db.settings.resendApiKey || process.env.RESEND_API_KEY || '').trim();
  const smtpUser = String(db.settings.smtpUser || process.env.SMTP_USER || '').trim();
  const smtpPass = String(db.settings.smtpPass || process.env.SMTP_PASS || '').replace(/\s+/g, '');
  if (resendKey) {
    const body = JSON.stringify({
      from: smtpUser ? `Chatkaro Food Hub <${smtpUser}>` : 'Chatkaro Food Hub <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
      text
    });
    const res = await httpsRequestJson({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, body);
    if (res.statusCode < 300) return { sent: true, method: 'resend' };
    throw new Error(res.data?.message || 'Resend email failed');
  }
  if (smtpUser && smtpPass) {
    return sendSmtpEmailTls({ user: smtpUser, pass: smtpPass, to, subject, html, text });
  }
  return { sent: false, method: 'none' };
}

function buildOrderBillEmailHtml(order) {
  const owner = db.settings.ownerName || 'Het';
  const rows = (order.items || []).map((i, idx) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${idx + 1}. ${i.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.qty}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${i.price}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;"><strong>₹${i.price * i.qty}</strong></td>
    </tr>`).join('');
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fffdf7;border:2px solid #991b1b;border-radius:14px;padding:22px;color:#1c1917;">
    <div style="text-align:center;border-bottom:2px double #b45309;padding-bottom:12px;">
      <h2 style="margin:0;color:#7f1d1d;">👑 ${db.settings.restaurantName || 'CHATKARO FOOD HUB'}</h2>
      <div style="color:#15803d;font-weight:bold;font-size:12px;">100% PURE VEGETARIAN FAMILY RESTAURANT</div>
      <div style="display:inline-block;margin-top:6px;background:#991b1b;color:#fef3c7;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:bold;">Proprietor / Owner: ${owner}</div>
      <div style="font-size:12px;color:#57534e;margin-top:6px;">${db.settings.address || 'Talala, Gujarat'} • +${db.settings.phone || '919054633908'}</div>
    </div>
    <p style="font-size:13px;"><strong>Invoice #${order.id}</strong> • ${new Date(order.createdAt).toLocaleString('en-IN')}<br/>
    Customer: <strong>${order.customerName}</strong> (${order.customerPhone || ''})<br/>
    Mode: <strong>${String(order.orderType || 'dine-in').toUpperCase()}${order.tableId ? ' • Table ' + order.tableId : ''}</strong> • Payment: <strong>${order.paymentStatus === 'paid' ? 'PAID ✓' : 'Counter / COD'}</strong></p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin:12px 0;">
      <thead><tr style="background:#fef2f2;color:#7f1d1d;"><th style="padding:8px;text-align:left;">Dish</th><th style="padding:8px;text-align:center;">Qty</th><th style="padding:8px;text-align:right;">Rate</th><th style="padding:8px;text-align:right;">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="background:#fef2f2;border-top:2px solid #991b1b;border-bottom:2px solid #991b1b;padding:10px;font-size:16px;font-weight:bold;color:#7f1d1d;display:flex;justify-content:space-between;">
      <span>GRAND TOTAL PAYABLE: ₹${order.total}/-</span>
    </div>
    <p style="font-size:12px;color:#57534e;margin-top:14px;">Authorized Signatory: <strong>${owner}</strong> • MOHAR SEAL VERIFIED ✓ (${order.paymentStatus === 'paid' ? 'PAID' : 'VERIFIED'})</p>
  </div>`;
}

async function sendOrderBillEmail(order) {
  try {
    if (!order || !order.customerEmail) return { sent: false };
    const html = buildOrderBillEmailHtml(order);
    const text = `Chatkaro Food Hub Official Bill #${order.id} (Owner: ${db.settings.ownerName || 'Het'}) | Total: ₹${order.total}/- | Items: ${(order.items || []).map(i => `${i.qty}x ${i.name}`).join(', ')}`;
    const r = await sendEmailViaGmailOrResend({
      to: order.customerEmail,
      subject: `🧾 Official Royal Bill #${order.id} — ${db.settings.restaurantName || 'Chatkaro Food Hub'}`,
      html,
      text
    });
    if (r.sent) {
      order.billEmailSent = true;
      saveDb();
    }
    return r;
  } catch (err) {
    console.error('Bill email failed:', err.message);
    return { sent: false, error: err.message };
  }
}

let cloudSyncTimer = null;
function syncDbToCloudGist() {
  const gistId = String(process.env.STATE_GIST_ID || '').trim();
  const token = String(process.env.GITHUB_TOKEN || '').trim();
  if (!gistId || !token) return;
  clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => {
    fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'ChatkaroFoodHub/1.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: { 'chatkaro-db-backup.json': { content: JSON.stringify(db) } }
      })
    }).catch(() => {});
  }, 1500);
}

async function hydrateFromCloudGistOnBoot() {
  const gistId = String(process.env.STATE_GIST_ID || '').trim();
  const token = String(process.env.GITHUB_TOKEN || '').trim();
  if (!gistId || !token) return;
  try {
    const r = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ChatkaroFoodHub/1.0' }
    });
    if (!r.ok) return;
    const j = await r.json();
    const raw = j.files?.['chatkaro-db-backup.json']?.content;
    if (!raw) return;
    const remoteDb = JSON.parse(raw);
    if (remoteDb && Array.isArray(remoteDb.menu) && remoteDb.settings) {
      db = { ...db, ...remoteDb, settings: { ...db.settings, ...remoteDb.settings } };
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
      broadcast('state', getPublicSnapshot());
      console.log('Hydrated live database from Cloud Gist backup!');
    }
  } catch {}
}

function saveDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  syncDbToCloudGist();
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
      ownerName: db.settings.ownerName || 'Het',
      rating: db.settings.rating,
      reviewCount: db.settings.reviewCount,
      priceRange: db.settings.priceRange || '₹1–300 per person',
      address: db.settings.address || 'Near Essar Petrol Pump, Opp. Shreeji Super Mart, Talala, Gujarat 362150',
      plusCode: db.settings.plusCode || '2GWF+GJ Talala, Gujarat',
      openHoursText: db.settings.openHoursText,
      phone: db.settings.phone,
      instagramHandle: db.settings.instagramHandle || 'chatkaro_the_food_hub',
      instagramReels: db.settings.instagramReels || 'https://www.instagram.com/reels/DeoG7QDA2O3/\nhttps://www.instagram.com/reel/DfLrI3hzTGD/',
      bgMusicEnabled: db.settings.bgMusicEnabled !== false,
      bgMusicUrl: db.settings.bgMusicUrl || process.env.BG_MUSIC_URL || '',
      bgMusicVideoId: db.settings.bgMusicVideoId || extractYoutubeVideoId(db.settings.bgMusicUrl || process.env.BG_MUSIC_URL || ''),
      bgMusicPlaylistId: db.settings.bgMusicPlaylistId || extractYoutubePlaylistId(db.settings.bgMusicUrl || process.env.BG_MUSIC_URL || ''),
      bgMusicTitle: db.settings.bgMusicTitle || process.env.BG_MUSIC_TITLE || 'Calm Cafe Music',
      bgVideoEnabled: db.settings.bgVideoEnabled !== false,
      bgVideoUrl: db.settings.bgVideoUrl || process.env.BG_VIDEO_URL || '',
      bgVideoVideoId: db.settings.bgVideoVideoId || extractYoutubeVideoId(db.settings.bgVideoUrl || process.env.BG_VIDEO_URL || ''),
      bgVideoPlaylistId: db.settings.bgVideoPlaylistId || extractYoutubePlaylistId(db.settings.bgVideoUrl || process.env.BG_VIDEO_URL || ''),
      apkDownloadUrl: db.settings.apkDownloadUrl || 'assets/app/Chatkaro-Customer.apk',
      deliveryApkUrl: db.settings.deliveryApkUrl || 'assets/app/Chatkaro-Delivery.apk',
      waiterApkUrl: db.settings.waiterApkUrl || 'assets/app/Chatkaro-Waiter.apk',
      googleClientId: db.settings.googleClientId || process.env.GOOGLE_CLIENT_ID || '',
      lastMapsSyncAt: db.settings.lastMapsSyncAt,
      announcement: db.settings.announcement,
      dailyDeal: db.settings.dailyDeal,
      brandTheme: db.settings.brandTheme,
      hasPlacesKey: Boolean(db.settings.googlePlacesApiKey && db.settings.googlePlaceId),
      hasGeminiKey: Boolean(getActiveGeminiKey()),
      hasEmailOtp: Boolean((db.settings.smtpUser || process.env.SMTP_USER) && (db.settings.smtpPass || process.env.SMTP_PASS) || (db.settings.resendApiKey || process.env.RESEND_API_KEY)),
      merchantUpiId: db.settings.merchantUpiId || process.env.MERCHANT_UPI_ID || '',
      razorpayKeyId: db.settings.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '',
      hasRazorpay: Boolean((db.settings.razorpayKeyId || process.env.RAZORPAY_KEY_ID) && (db.settings.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET)),
      hasPhonePeGateway: Boolean(db.settings.phonepeMerchantId && db.settings.phonepeSaltKey),
      phonepeEnv: db.settings.phonepeEnv || 'sandbox'
    },
    menu: db.menu,
    ads: Array.isArray(db.ads) ? db.ads : [],
    notifications: Array.isArray(db.notifications) ? db.notifications.slice(0, 12) : [],
    waiterCalls: Array.isArray(db.waiterCalls) ? db.waiterCalls.slice(0, 40) : [],
    waiterChats: Array.isArray(db.waiterChats) ? db.waiterChats.slice(-80) : [],
    deliveryChats: Array.isArray(db.deliveryChats) ? db.deliveryChats.slice(-80) : [],
    dailyAiAd: db.dailyAiAd || null,
    tables: db.tables,
    orders: realOrders.slice(0, 200),
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
    deliveryStage: 'placed',
    deliveryOtp: String(Math.floor(1000 + Math.random() * 9000)),
    driverName: '',
    driverPhone: '',
    deliveryTimeline: [{ stage: 'placed', label: 'Order Placed', at: now }],
    billEmailSent: false,
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
  sendOrderBillEmail(order).catch(() => {});
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
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin, X-Admin-Token, X-File-Name, X-Ad-Title, X-Media-Type, X-Linked-Dish'
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

function getActiveGeminiKey() {
  return String(db?.settings?.geminiApiKey || process.env.GEMINI_API_KEY || '').trim();
}

function extractYoutubeVideoId(rawUrl) {
  let s = String(rawUrl || '').trim();
  if (!s) return '';
  const iframeSrc = s.match(/src=["']([^"']+)["']/i);
  if (iframeSrc) s = iframeSrc[1].trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:(?:www\.|m\.|music\.)?(?:youtube\.com|youtube-nocookie\.com)\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i)
    || s.match(/[?&](?:v|vi)=([A-Za-z0-9_-]{11})/i);
  return m ? m[1] : '';
}

function extractYoutubePlaylistId(rawUrl) {
  let s = String(rawUrl || '').trim();
  const iframeSrc = s.match(/src=["']([^"']+)["']/i);
  if (iframeSrc) s = iframeSrc[1].trim();
  const m = s.match(/[?&]list=([A-Za-z0-9_-]+)/i);
  return m ? m[1] : '';
}

function getIstDateKey() {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const DAILY_AI_THEMES = [
  { tag: '🔥 MASALA MONDAY', accent: '#ef4444', line: 'Spicy Veg Angara & smoky Tandoori specials hot off the flame today!' },
  { tag: '🫓 TANDOOR TUESDAY', accent: '#f97316', line: 'Crispy Butter Naan, Stuffed Kulcha & sizzling Paneer Tikka combos!' },
  { tag: '🧀 CHEESE WEDNESDAY', accent: '#eab308', line: 'Extra loaded Cheese Anguri, Cheese Butter Masala & Cheese Dosa!' },
  { tag: '🥞 DOSA THURSDAY', accent: '#22c55e', line: 'Paper-thin Mysore Masala & Ghee Roast Dosas with piping hot Sambar!' },
  { tag: '🥡 INDO-CHINESE FRIDAY', accent: '#ec4899', line: 'Wok-tossed Hakka Noodles, Dry Manchurian & fiery Schezwan Rice!' },
  { tag: '🥜 ROYAL SATURDAY', accent: '#a855f7', line: 'Weekend family feast: Rich Kaju Curry, Kaju Paneer & Punjabi Thali!' },
  { tag: '👨‍👩‍👧‍👦 FAMILY SUNDAY', accent: '#dc2626', line: 'Full Talala Pure-Veg celebration — order online or book your table live!' }
];

async function refreshDailyAiCampaign(force = false) {
  const today = getIstDateKey();
  if (!force && db.dailyAiAd && db.dailyAiAd.date === today) return db.dailyAiAd;

  const avail = (db.menu || []).filter((m) => m.available !== false);
  const dayIdx = new Date().getDay();
  const baseTheme = DAILY_AI_THEMES[(dayIdx + 6) % 7];
  const seed = Number(today.replace(/-/g, '')) || 1;
  const picks = [];
  if (avail.length) {
    for (let i = 0; i < Math.min(4, avail.length); i++) {
      picks.push(avail[(seed + i * 17) % avail.length]);
    }
  }

  let headline = `${baseTheme.tag}: ${picks[0]?.name || 'Chef Special'} + Fresh Sides!`;
  let subline = baseTheme.line;
  const key = getActiveGeminiKey();
  if (key && force) {
    try {
      const prompt = `Write a catchy 1-line pure-veg restaurant daily promo headline (max 9 words) and 1 short appetizing subline (max 14 words) in Hinglish/English for Chatkaro Food Hub Talala featuring: ${picks.map((p) => `${p.name} (₹${p.price})`).join(', ')}. Return plain JSON: {"headline":"...","subline":"..."}`;
      const { text } = await callGeminiApi(key, prompt, [], 180);
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        if (parsed.headline) headline = String(parsed.headline).slice(0, 90);
        if (parsed.subline) subline = String(parsed.subline).slice(0, 140);
      }
    } catch {}
  }

  db.dailyAiAd = {
    date: today,
    tag: baseTheme.tag,
    accent: baseTheme.accent,
    headline,
    subline,
    featuredIds: picks.map((p) => p.id),
    updatedAt: Date.now()
  };
  saveDb();
  return db.dailyAiAd;
}

function buildAiSystemContext() {
  const availableItems = db.menu.filter((m) => m.available !== false);
  const soldOutItems = db.menu.filter((m) => m.available === false);
  const freeTables = db.tables.filter((t) => t.status === 'available').map((t) => `${t.label} (${t.seats} seats)`);
  const busyTables = db.tables.filter((t) => t.status === 'occupied').map((t) => `${t.label} (${t.occupantName})`);

  return [
    `You are "Chatkaro AI", the warm, witty, super-helpful assistant and friendly conversational host for ${db.settings.restaurantName} in Talala (Gir), Gujarat.`,
    `IMPORTANT: You can talk naturally with customers about ANYTHING they ask — whether it is general conversation (greetings, jokes, weather, Sasan Gir trip tips, spicy vs mild moods, health/veg info, birthday/party advice) OR restaurant questions (menu, prices, tables, timings, ordering, payments, live music). Always reply warmly in the customer's language (Hinglish, Hindi, Gujarati, or English), natural and engaging, never robotic!`,
    `Restaurant Live Facts:`,
    `- Pure Vegetarian (100% Pure Veg Kitchen)`,
    `- Address: ${db.settings.address} (Plus Code: ${db.settings.plusCode})`,
    `- Timing: ${db.settings.openHoursText}`,
    `- Phone / WhatsApp: +${db.settings.phone} | Instagram: @${db.settings.instagramHandle || 'chatkaro_the_food_hub'}`,
    `- Rating: ${db.settings.rating}★ (${db.settings.reviewCount} reviews) | Price: ${db.settings.priceRange}`,
    `- Today's Deal: ${db.settings.dailyDeal || 'Use WELCOME5 for 5% OFF'}`,
    `- Live Tables Available: ${freeTables.length ? freeTables.join(', ') : 'All tables currently busy'}`,
    `- Currently Occupied Tables: ${busyTables.length ? busyTables.join(', ') : 'None'}`,
    `- Ordering & Payment: Customer signs in with Gmail, adds dishes to Cart, picks Dine-In / Drive-Thru / No-Contact Delivery, pays via Razorpay, PhonePe/UPI, or Counter Cash, and gets a live countdown timer + WhatsApp confirmation. Game Tawa Rush unlocks CHATKARO10 (10% OFF) & CHATKARO20 (20% OFF).`,
    `- AI ORDER PLACEMENT CAPABILITY: If the customer says they want to add items or place an order (e.g. "2 masala dosa order karo", "add veg angara", "1 paneer chilli aur butter naan dal do"), ALWAYS match the exact dish IDs from the menu below and include ONE hidden action tag at the VERY END of your reply in this exact format:`,
    `  [[ORDER_ACTION:{"items":[{"id":"EXACT_ID","qty":2}],"orderType":"dine-in","openCart":true}]]`,
    `  Use "orderType": "parcel" if they ask for parcel/takeaway, "delivery" if delivery, else "dine-in". Set "placeNow": true ONLY if the user explicitly says "confirm order now" / "seedha order place kardo".`,
    `- AVAILABLE MENU (${availableItems.length} items):`,
    ...availableItems.map((m) => `  * [id:${m.id}] ${m.name} [${m.category}] — ₹${m.price}${m.discountPct ? ` (${m.discountPct}% OFF)` : ''}${m.bestseller ? ' (Bestseller)' : ''}${m.spicy ? ' (Spicy)' : ''}${m.servedWith ? ' | Comes with: ' + m.servedWith : ''}`),
    `- SOLD OUT ITEMS: ${soldOutItems.length ? soldOutItems.map((m) => m.name).join(', ') : 'None — all dishes available!'}`
  ].join('\n');
}

function parseAiOrderAction(rawText, userMessage) {
  let cleanReply = String(rawText || '').trim();
  let action = null;
  const tagMatch = cleanReply.match(/\[\[ORDER_ACTION:([\s\S]*?)\]\]/i);
  if (tagMatch) {
    cleanReply = cleanReply.replace(tagMatch[0], '').trim();
    try {
      const parsed = JSON.parse(tagMatch[1]);
      if (parsed && Array.isArray(parsed.items)) {
        const menuMap = new Map(db.menu.filter((m) => m.available !== false).map((m) => [m.id, m]));
        const validItems = parsed.items
          .map((it) => {
            const dish = menuMap.get(String(it.id || '').trim());
            if (!dish) return null;
            return { id: dish.id, name: dish.name, price: dish.price, qty: Math.max(1, Math.min(20, Number(it.qty || 1))) };
          })
          .filter(Boolean);
        if (validItems.length) {
          action = {
            items: validItems,
            orderType: ['dine-in', 'parcel', 'delivery'].includes(parsed.orderType) ? parsed.orderType : 'dine-in',
            openCart: parsed.openCart !== false,
            placeNow: Boolean(parsed.placeNow)
          };
        }
      }
    } catch {}
  }
  // Fallback intent matcher when user clearly asks to order/add specific dish names
  if (!action && /(order|owder|add|cart|pack|parcel|bhej|chahiye|mangwa|dal\s*do|de\s*do)/i.test(userMessage)) {
    const msgLow = String(userMessage || '').toLowerCase();
    const matched = [];
    for (const m of db.menu) {
      if (m.available === false) continue;
      const cleanName = m.name.replace(/\(.*?\)/g, '').trim().toLowerCase();
      const variants = cleanName.split(/\s*\/\s*/).map((s) => s.trim()).filter((s) => s.length >= 4);
      const exactHit = variants.find((v) => msgLow.includes(v));
      const tokens = cleanName.split(/[\s/&,+()-]+/).filter((w) => w.length >= 3);
      const tokenHits = tokens.filter((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(msgLow));
      const allDishTokensHit = tokens.length >= 2 && tokenHits.length === tokens.length;
      const phraseHit = tokenHits.length >= 2 && msgLow.includes(tokenHits.join(' '));
      if (exactHit || allDishTokensHit || phraseHit) {
        const anchor = exactHit || tokenHits[0];
        const qtyMatch = msgLow.match(new RegExp(`(\\d+)\\s*(?:x|pc|pcs|plate|plates)?\\s*(?:[a-z\\s]{0,16})?${anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
        const score = (exactHit ? 100 + exactHit.length : tokenHits.length * 20) - (tokens.length - tokenHits.length) * 5;
        matched.push({
          id: m.id,
          name: m.name,
          price: m.price,
          qty: qtyMatch ? Math.max(1, Math.min(20, Number(qtyMatch[1]))) : 1,
          score
        });
      }
    }
    matched.sort((a, b) => b.score - a.score);
    const dedup = [];
    for (const item of matched) {
      if (!dedup.some((d) => d.id === item.id)) dedup.push({ id: item.id, name: item.name, price: item.price, qty: item.qty });
    }
    if (dedup.length) {
      // Keep only top matched dish if no conjunction ('and', 'aur', ',', '+') separates distinct dishes
      const multiDishIntent = /(?:,|&|\+|\band\b|\baur\b)/i.test(msgLow);
      action = {
        items: multiDishIntent ? dedup.slice(0, 6) : dedup.slice(0, 1),
        orderType: /parcel|pack|takeaway/i.test(msgLow) ? 'parcel' : /delivery|ghar/i.test(msgLow) ? 'delivery' : 'dine-in',
        openCart: true,
        placeNow: /confirm|final|place\s*order\s*now/i.test(msgLow)
      };
    }
  }
  return { cleanReply, action };
}

const GEMINI_CHAT_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemma-4-26b-a4b-it'
];

async function callSingleGeminiModel(apiKey, model, sysPrompt, contents, maxTokens = 650, externalSignal = null) {
  const isGemma = model.startsWith('gemma');
  const finalContents = isGemma
    ? [
        { role: 'user', parts: [{ text: `${sysPrompt}\n\nCustomer says: ${contents[0]?.parts?.[0]?.text || ''}` }] },
        ...contents.slice(1)
      ]
    : contents;

  const payloadObj = {
    contents: finalContents,
    generationConfig: { temperature: 0.78, maxOutputTokens: maxTokens }
  };
  if (!isGemma) payloadObj.system_instruction = { parts: [{ text: sysPrompt }] };

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(new Error('Gemini request timeout')), 14000);
  if (externalSignal) {
    if (externalSignal.aborted) ctrl.abort();
    else externalSignal.addEventListener('abort', () => ctrl.abort(), { once: true });
  }
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadObj),
        signal: ctrl.signal
      }
    );
    const parsed = await resp.json();
    if (parsed.error) throw new Error(parsed.error.message || `HTTP ${resp.status}`);
    const text = parsed.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
    if (!text) throw new Error('Empty model response');
    return { text, model };
  } finally {
    clearTimeout(tid);
  }
}

async function callGeminiApi(apiKey, userMessage, history = [], maxTokens = 650) {
  const sysPrompt = buildAiSystemContext();
  const contents = [
    ...history.slice(-12).map((h) => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(h.text || '') }]
    })),
    { role: 'user', parts: [{ text: userMessage }] }
  ];

  // Race top models in parallel so whichever is fastest/uncongested answers cleanly
  const masterCtrl = new AbortController();
  try {
    const winner = await Promise.any(
      GEMINI_CHAT_MODELS.map((model) => callSingleGeminiModel(apiKey, model, sysPrompt, contents, maxTokens, masterCtrl.signal))
    );
    masterCtrl.abort();
    return winner;
  } catch (aggErr) {
    masterCtrl.abort();
    const firstMsg = aggErr?.errors?.[0]?.message || aggErr?.message || 'All Gemini models unavailable';
    throw new Error(firstMsg);
  }
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

      const activeKey = getActiveGeminiKey();
      if (activeKey) {
        try {
          const { text, model } = await callGeminiApi(activeKey, message, history);
          const { cleanReply, action } = parseAiOrderAction(text, message);
          return sendJson(res, 200, { reply: cleanReply, engine: model, aiOrderAction: action });
        } catch (err) {
          const fallback = smartMenuFallbackReply(message);
          const { cleanReply, action } = parseAiOrderAction(fallback, message);
          return sendJson(res, 200, { reply: cleanReply, engine: 'smart-fallback', aiOrderAction: action, note: err.message });
        }
      }
      const fb = smartMenuFallbackReply(message);
      const { cleanReply, action } = parseAiOrderAction(fb, message);
      return sendJson(res, 200, { reply: cleanReply, engine: 'smart-menu-ai', aiOrderAction: action });
    }

    // Gmail OTP Auth (Send 6-Digit Verification Code to @gmail.com)
    if (pathname === '/api/auth/send-otp' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const name = String(body.name || email.split('@')[0] || 'Guest').trim();
      const phone = String(body.phone || '').trim();
      if (!email || !/^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(email)) {
        return sendJson(res, 400, { error: 'Please enter a valid @gmail.com address.' });
      }
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:460px;margin:0 auto;border:2px solid #dc2626;border-radius:14px;padding:20px;background:#fffdf7;color:#111;">
          <h2 style="margin:0 0 8px;color:#991b1b;">🍲 Chatkaro Food Hub</h2>
          <p>Namaste <strong>${name}</strong>, aapka Gmail Login OTP code neeche hai:</p>
          <div style="font-size:32px;font-weight:900;letter-spacing:8px;color:#dc2626;background:#fef2f2;padding:12px;text-align:center;border-radius:10px;margin:14px 0;">${otp}</div>
          <p style="font-size:12px;color:#555;">Yeh OTP 10 minute ke liye valid hai. Owner: ${db.settings.ownerName || 'Het'}</p>
        </div>`;
      try {
        const resMail = await sendEmailViaGmailOrResend({
          to: email,
          subject: `${otp} is your Chatkaro Food Hub Login OTP`,
          html,
          text: `Your Chatkaro Food Hub Login OTP is: ${otp} (Valid 10 minutes).`
        });
        if (!resMail.sent) {
          return sendJson(res, 503, {
            error: 'Gmail OTP email sender (SMTP App Password / Resend API Key) abhi Admin Settings me set nahi hai. Admin Settings me SMTP_USER + SMTP_PASS dalwayein ya Google 1-Tap se sign in karein.',
            needsSetup: true
          });
        }
        pendingOtps.set(email, { otp, name, phone, expiresAt: Date.now() + 600000, attempts: 0 });
        return sendJson(res, 200, { ok: true, message: `6-digit OTP sent to ${email}` });
      } catch (err) {
        return sendJson(res, 500, { error: 'Could not send Gmail OTP: ' + err.message });
      }
    }

    if (pathname === '/api/auth/verify-otp' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const otp = String(body.otp || '').trim();
      const rec = pendingOtps.get(email);
      if (!rec || Date.now() > rec.expiresAt) {
        pendingOtps.delete(email);
        return sendJson(res, 400, { error: 'OTP expired or not requested. Request a new OTP.' });
      }
      rec.attempts += 1;
      if (rec.attempts > 5) {
        pendingOtps.delete(email);
        return sendJson(res, 429, { error: 'Too many wrong OTP attempts. Request a new OTP.' });
      }
      if (rec.otp !== otp) {
        return sendJson(res, 401, { error: 'Incorrect 6-digit OTP code!' });
      }
      pendingOtps.delete(email);
      const existing = db.customers[email] || {
        email,
        name: rec.name || email.split('@')[0],
        phone: rec.phone || '',
        bio: 'Foodie at Chatkaro Food Hub',
        favoriteDish: 'Mix Veg',
        avatarColor: '#ea580c',
        ordersCount: 0,
        totalSpent: 0,
        bestGameScore: 0,
        tableId: null
      };
      if (rec.name) existing.name = rec.name;
      if (rec.phone) existing.phone = rec.phone;
      existing.authProvider = 'gmail-otp';
      existing.emailVerified = true;
      db.customers[email] = existing;
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { customer: existing });
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
      if (body.picture) c.picture = String(body.picture).slice(0, 50000);
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { customer: c });
    }

    // Staff Auth (Waiter Bell App & Delivery Boy App)
    if (pathname === '/api/staff/verify' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const pin = String(body.pin || '').trim();
      if (!pin || (pin !== String(db.settings.staffPin || '1234') && pin !== String(db.settings.adminPin))) {
        return sendJson(res, 401, { error: 'Wrong Staff / Owner PIN!' });
      }
      const staffToken = crypto.randomBytes(20).toString('hex');
      staffTokens.add(staffToken);
      return sendJson(res, 200, { ok: true, staffToken, state: getPublicSnapshot() });
    }

    // Waiter Bell Calls & Table Service Chat
    if (pathname === '/api/waiter/call' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const tableId = Number(body.tableId || 0);
      const tbl = db.tables.find((t) => t.id === tableId);
      const requestType = String(body.requestType || 'Call Waiter').trim().slice(0, 60);
      const note = String(body.note || '').trim().slice(0, 180);
      const call = {
        id: 'wc-' + Date.now() + '-' + Math.floor(Math.random() * 99),
        tableId: tableId || 0,
        tableLabel: tbl ? tbl.label : (tableId ? `Table ${tableId}` : 'Counter / Table'),
        tablePhoto: tbl?.photo || 'assets/tables/table-4seat.jpg',
        customerName: String(body.customerName || tbl?.occupantName || 'Guest').trim(),
        requestType,
        note,
        status: 'ringing',
        waiterName: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      if (!Array.isArray(db.waiterCalls)) db.waiterCalls = [];
      db.waiterCalls.unshift(call);
      db.waiterCalls = db.waiterCalls.slice(0, 50);
      broadcast('waiter-call', call);
      recalculateTopAndBroadcast();
      return sendJson(res, 201, { ok: true, call });
    }

    if (pathname === '/api/waiter/action' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireStaffOrAdmin(req, body)) return sendJson(res, 401, { error: 'Staff PIN required.' });
      const call = (db.waiterCalls || []).find((c) => c.id === body.callId);
      if (!call) return sendJson(res, 404, { error: 'Request not found.' });
      call.status = ['ringing', 'accepted', 'served'].includes(body.status) ? body.status : 'accepted';
      if (body.waiterName) call.waiterName = String(body.waiterName).trim();
      call.updatedAt = Date.now();
      broadcast('waiter-call', call);
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true, call });
    }

    if (pathname === '/api/waiter/chat' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const tableId = Number(body.tableId || 0);
      const text = String(body.text || '').trim().slice(0, 240);
      if (!text) return sendJson(res, 400, { error: 'Message empty.' });
      const role = body.senderRole === 'waiter' && requireStaffOrAdmin(req, body) ? 'waiter' : 'customer';
      const msg = {
        id: 'wmsg-' + Date.now() + '-' + Math.floor(Math.random() * 99),
        tableId,
        senderRole: role,
        senderName: String(body.senderName || (role === 'waiter' ? 'Waiter' : `Table ${tableId}`)).trim(),
        text,
        createdAt: Date.now()
      };
      if (!Array.isArray(db.waiterChats)) db.waiterChats = [];
      db.waiterChats.push(msg);
      db.waiterChats = db.waiterChats.slice(-100);
      broadcast('waiter-chat', msg);
      recalculateTopAndBroadcast();
      return sendJson(res, 201, { ok: true, message: msg });
    }

    // Amazon-Style Delivery Boy App Endpoints
    if (pathname === '/api/delivery/action' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireStaffOrAdmin(req, body)) return sendJson(res, 401, { error: 'Staff PIN required.' });
      const ord = db.orders.find((o) => o.id === body.orderId);
      if (!ord) return sendJson(res, 404, { error: 'Order not found.' });
      const stage = String(body.deliveryStage || '').trim();
      const stageLabels = {
        placed: 'Order Placed',
        preparing: 'Kitchen Preparing',
        ready: 'Packed & Ready for Pickup',
        picked_up: 'Picked Up by Delivery Boy',
        on_the_way: 'Out for Delivery (On the Way)',
        delivered: 'Delivered Successfully ✓'
      };
      if (stage && stageLabels[stage]) {
        ord.deliveryStage = stage;
        if (!Array.isArray(ord.deliveryTimeline)) ord.deliveryTimeline = [];
        if (!ord.deliveryTimeline.some((x) => x.stage === stage)) {
          ord.deliveryTimeline.push({ stage, label: stageLabels[stage], at: Date.now() });
        }
        if (stage === 'preparing') ord.status = 'cooking';
        if (stage === 'ready' || stage === 'picked_up' || stage === 'on_the_way') ord.status = 'ready';
        if (stage === 'delivered') {
          ord.status = 'served';
          if (body.markPaid) ord.paymentStatus = 'paid';
          ord.etaMinutes = 0;
          ord.etaEndsAt = Date.now();
        }
      }
      if (body.driverName) ord.driverName = String(body.driverName).trim();
      if (body.driverPhone) ord.driverPhone = String(body.driverPhone).trim();
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true, order: ord });
    }

    if (pathname === '/api/delivery/chat' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const orderId = String(body.orderId || '').trim();
      const text = String(body.text || '').trim().slice(0, 240);
      if (!orderId || !text) return sendJson(res, 400, { error: 'Order ID & message required.' });
      const role = body.senderRole === 'driver' && requireStaffOrAdmin(req, body) ? 'driver' : 'customer';
      const msg = {
        id: 'dmsg-' + Date.now() + '-' + Math.floor(Math.random() * 99),
        orderId,
        senderRole: role,
        senderName: String(body.senderName || (role === 'driver' ? 'Delivery Partner' : 'Customer')).trim(),
        text,
        createdAt: Date.now()
      };
      if (!Array.isArray(db.deliveryChats)) db.deliveryChats = [];
      db.deliveryChats.push(msg);
      db.deliveryChats = db.deliveryChats.slice(-100);
      broadcast('delivery-chat', msg);
      recalculateTopAndBroadcast();
      return sendJson(res, 201, { ok: true, message: msg });
    }

    // Delivery Boy Live GPS Location Broadcast (Amazon-Style Live Tracking)
    if (pathname === '/api/delivery/location' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireStaffOrAdmin(req, body)) return sendJson(res, 401, { error: 'Staff PIN required.' });
      const ord = db.orders.find((o) => o.id === body.orderId);
      if (!ord) return sendJson(res, 404, { error: 'Order not found.' });
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      if (!isFinite(lat) || !isFinite(lng)) return sendJson(res, 400, { error: 'Valid GPS coordinates required.' });
      const loc = {
        lat,
        lng,
        accuracy: Number(body.accuracy || 0),
        speed: Number(body.speed || 0),
        updatedAt: Date.now()
      };
      ord.driverLocation = loc;
      if (!Array.isArray(ord.driverTrail)) ord.driverTrail = [];
      ord.driverTrail.push({ lat, lng, at: loc.updatedAt });
      ord.driverTrail = ord.driverTrail.slice(-25);
      if (body.driverName) ord.driverName = String(body.driverName).trim();
      if (body.driverPhone) ord.driverPhone = String(body.driverPhone).trim();
      saveDb();
      broadcast('delivery-location', {
        orderId: ord.id,
        driverLocation: loc,
        driverName: ord.driverName,
        driverPhone: ord.driverPhone
      });
      return sendJson(res, 200, { ok: true, driverLocation: loc });
    }

    // Delivery Boy Doorstep Razorpay Payment Link / QR Generator
    if (pathname === '/api/delivery/payment/razorpay-qr' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireStaffOrAdmin(req, body)) return sendJson(res, 401, { error: 'Staff PIN required.' });
      const ord = db.orders.find((o) => o.id === body.orderId);
      if (!ord) return sendJson(res, 404, { error: 'Order not found.' });
      if (!db.settings.razorpayKeyId || !db.settings.razorpayKeySecret) {
        return sendJson(res, 400, { error: 'Razorpay Key ID & Secret Admin Settings me set karein pehle.' });
      }
      const authHeader = 'Basic ' + Buffer.from(`${db.settings.razorpayKeyId}:${db.settings.razorpayKeySecret}`).toString('base64');
      const payload = JSON.stringify({
        amount: Math.max(100, Math.round(Number(ord.total || 1) * 100)),
        currency: 'INR',
        description: `Chatkaro Food Hub Delivery #${ord.id}`,
        customer: {
          name: ord.customerName || 'Customer',
          contact: ord.customerPhone ? `+91${String(ord.customerPhone).replace(/\D/g, '').slice(-10)}` : undefined,
          email: ord.customerEmail || undefined
        },
        notify: { sms: false, email: false }
      });
      const rzpRes = await httpsRequestJson({
        hostname: 'api.razorpay.com',
        path: '/v1/payment_links',
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, payload);
      if (rzpRes.statusCode >= 400 || !rzpRes.data?.short_url) {
        return sendJson(res, 400, { error: rzpRes.data?.error?.description || 'Razorpay QR link create failed.' });
      }
      ord.razorpayLinkId = rzpRes.data.id;
      saveDb();
      return sendJson(res, 200, {
        ok: true,
        paymentUrl: rzpRes.data.short_url,
        razorpayLinkId: rzpRes.data.id,
        amount: ord.total
      });
    }

    if (pathname === '/api/delivery/payment/check-razorpay' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireStaffOrAdmin(req, body)) return sendJson(res, 401, { error: 'Staff PIN required.' });
      const ord = db.orders.find((o) => o.id === body.orderId);
      if (!ord || !ord.razorpayLinkId) return sendJson(res, 404, { error: 'No Razorpay link created for this order.' });
      const authHeader = 'Basic ' + Buffer.from(`${db.settings.razorpayKeyId}:${db.settings.razorpayKeySecret}`).toString('base64');
      const rzpRes = await httpsRequestJson({
        hostname: 'api.razorpay.com',
        path: `/v1/payment_links/${encodeURIComponent(ord.razorpayLinkId)}`,
        method: 'GET',
        headers: { Authorization: authHeader }
      });
      const isPaid = rzpRes.data?.status === 'paid';
      if (isPaid) {
        ord.paymentStatus = 'paid';
        ord.paymentMethod = 'razorpay-qr';
        ord.paymentId = rzpRes.data?.payments?.[0]?.payment_id || ord.razorpayLinkId;
        recalculateTopAndBroadcast();
        sendOrderBillEmail(ord).catch(() => {});
      }
      return sendJson(res, 200, { ok: true, paid: isPaid, status: rzpRes.data?.status || 'created', order: ord });
    }

    // Delivery Boy Doorstep PhonePe / UPI QR Generator
    if (pathname === '/api/delivery/payment/upi-qr' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireStaffOrAdmin(req, body)) return sendJson(res, 401, { error: 'Staff PIN required.' });
      const ord = db.orders.find((o) => o.id === body.orderId);
      if (!ord) return sendJson(res, 404, { error: 'Order not found.' });
      const upiId = String(db.settings.merchantUpiId || process.env.MERCHANT_UPI_ID || '').trim();
      if (!upiId) {
        return sendJson(res, 400, { error: 'Merchant UPI ID Admin Settings -> Gateways me set karein pehle.' });
      }
      const total = Math.max(1, Number(ord.total || 0));
      const pa = encodeURIComponent(upiId);
      const pn = encodeURIComponent(db.settings.restaurantName || 'Chatkaro Food Hub');
      const tn = encodeURIComponent(`Delivery #${ord.id}`);
      const upiUri = `upi://pay?pa=${pa}&pn=${pn}&am=${total}&cu=INR&tn=${tn}`;
      const phonepeUri = `phonepe://pay?pa=${pa}&pn=${pn}&am=${total}&cu=INR&tn=${tn}`;
      return sendJson(res, 200, { ok: true, amount: total, merchantUpiId: upiId, upiUri, phonepeUri });
    }

    // Delivery Boy Payment Screenshot (SS) + Proof Photo + Complete Delivery
    if (pathname === '/api/delivery/proof' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireStaffOrAdmin(req, body)) return sendJson(res, 401, { error: 'Staff PIN required.' });
      const ord = db.orders.find((o) => o.id === body.orderId);
      if (!ord) return sendJson(res, 404, { error: 'Order not found.' });

      if (body.dataUrl) {
        const match = String(body.dataUrl).match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/i);
        if (!match) return sendJson(res, 400, { error: 'Invalid screenshot image.' });
        const buf = Buffer.from(match[2], 'base64');
        if (buf.length > 5e6) return sendJson(res, 400, { error: 'Screenshot under 5 MB required.' });
        const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
        const proofsDir = path.join(ROOT_DIR, 'assets', 'proofs');
        if (!fs.existsSync(proofsDir)) fs.mkdirSync(proofsDir, { recursive: true });
        const fileName = `proof-${ord.id}-${Date.now()}.${ext}`;
        fs.writeFileSync(path.join(proofsDir, fileName), buf);
        ord.paymentProofImg = `assets/proofs/${fileName}`;
      }
      if (body.paymentMethod) ord.paymentMethod = String(body.paymentMethod).trim();
      if (body.paymentRef) ord.paymentId = String(body.paymentRef).trim();
      if (body.markPaid !== false) ord.paymentStatus = 'paid';
      if (body.markDelivered !== false) {
        ord.deliveryStage = 'delivered';
        ord.status = 'served';
        ord.etaMinutes = 0;
        ord.etaEndsAt = Date.now();
        if (!Array.isArray(ord.deliveryTimeline)) ord.deliveryTimeline = [];
        if (!ord.deliveryTimeline.some((x) => x.stage === 'delivered')) {
          ord.deliveryTimeline.push({ stage: 'delivered', label: 'Delivered & Payment Confirmed ✓', at: Date.now() });
        }
      }
      if (body.driverName) ord.driverName = String(body.driverName).trim();
      if (body.driverPhone) ord.driverPhone = String(body.driverPhone).trim();
      recalculateTopAndBroadcast();
      sendOrderBillEmail(ord).catch(() => {});
      return sendJson(res, 200, { ok: true, order: ord });
    }

    if (pathname.startsWith('/api/orders/') && pathname.endsWith('/resend-bill') && req.method === 'POST') {
      const parts = pathname.split('/').filter(Boolean);
      const ordId = parts[parts.length - 2];
      const ord = db.orders.find((o) => o.id === ordId);
      if (!ord) return sendJson(res, 404, { error: 'Order not found.' });
      const resMail = await sendOrderBillEmail(ord);
      if (!resMail.sent) {
        return sendJson(res, 503, { error: resMail.error || 'Email service not configured in Admin Settings (SMTP or Resend Key).' });
      }
      return sendJson(res, 200, { ok: true, method: resMail.method });
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

function generateCustomDishSvgPhoto(dishName, category, dishId, dishesDir) {
  const safeName = String(dishName || 'Pure Veg Special').replace(/[<>&"']/g, '').slice(0, 34);
  const slug = safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'dish';
  const fileName = `ai-${slug}-${String(dishId).slice(-5)}.svg`;
  const palettes = {
    'veg-prep': ['#14532d', '#dc2626', '#fbbf24'],
    'kaju-prep': ['#78350f', '#d97706', '#fde68a'],
    'cheese-prep': ['#713f12', '#f59e0b', '#fef08a'],
    'tandoor': ['#7f1d1d', '#ea580c', '#fed7aa'],
    'south-indian': ['#1e3a8a', '#059669', '#fde047'],
    'chinese': ['#4c0519', '#e11d48', '#fb923c'],
    'punjabi': ['#7c2d12', '#b91c1c', '#fcd34d'],
    'fast-food': ['#3b0764', '#dc2626', '#facc15'],
    'beverages': ['#0f172a', '#0284c7', '#67e8f9']
  };
  const [c1, c2, c3] = palettes[category] || palettes['veg-prep'];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 480">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="72%">
      <stop offset="0%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c1}"/>
    </radialGradient>
    <radialGradient id="bowl" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="60%" stop-color="#b91c1c"/>
      <stop offset="100%" stop-color="#450a0a"/>
    </radialGradient>
  </defs>
  <rect width="720" height="480" fill="url(#bg)"/>
  <circle cx="360" cy="235" r="158" fill="rgba(0,0,0,0.42)"/>
  <circle cx="360" cy="222" r="148" fill="#18181b" stroke="${c3}" stroke-width="5"/>
  <circle cx="360" cy="222" r="126" fill="url(#bowl)"/>
  <circle cx="322" cy="195" r="18" fill="#fde047" opacity="0.9"/>
  <circle cx="395" cy="202" r="20" fill="#fef3c7" opacity="0.9"/>
  <circle cx="354" cy="248" r="17" fill="#22c55e" opacity="0.85"/>
  <circle cx="406" cy="248" r="13" fill="#fde047" opacity="0.85"/>
  <circle cx="315" cy="242" r="14" fill="#ef4444" opacity="0.9"/>
  <path d="M320 92 Q310 66 326 42 M360 85 Q350 56 368 30 M400 92 Q390 66 406 42" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="5" stroke-linecap="round"/>
  <rect x="28" y="24" width="24" height="24" rx="4" fill="#fff" stroke="#16a34a" stroke-width="3"/>
  <circle cx="40" cy="36" r="7" fill="#16a34a"/>
  <rect x="90" y="394" width="540" height="58" rx="29" fill="rgba(12,12,14,0.86)" stroke="${c3}" stroke-width="2"/>
  <text x="360" y="431" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="800">${safeName}</text>
</svg>`;
  if (!fs.existsSync(dishesDir)) fs.mkdirSync(dishesDir, { recursive: true });
  fs.writeFileSync(path.join(dishesDir, fileName), svg);
  return `assets/dishes/${fileName}`;
}

async function generateDishPhotoWithGemini(dishName, dishId, dishesDir) {
  const key = getActiveGeminiKey();
  if (!key) return null;
  for (const model of ['gemini-3.1-flash-image', 'gemini-2.5-flash-image', 'gemini-3.1-flash-lite-image']) {
    try {
      const prompt = `Photorealistic restaurant food photography of Indian 100% pure vegetarian dish "${dishName}", served hot in an appetizing bowl or plate on a dark rustic wooden dining table, garnished freshly, warm lighting, zero text or watermarks`;
      const payload = JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
      });
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        signal: AbortSignal.timeout(6000)
      });
      if (!r.ok) {
        if (r.status === 429 || r.status === 403) continue;
        continue;
      }
      const j = await r.json();
      const part = (j.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData || p.inline_data);
      const inline = part?.inlineData || part?.inline_data;
      if (!inline?.data) continue;
      const buf = Buffer.from(inline.data, 'base64');
      if (buf.length < 4000) continue;
      const ext = (inline.mimeType || '').includes('png') ? 'png' : 'jpg';
      const slug = String(dishName || 'dish').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'dish';
      const fileName = `ai-${slug}-${String(dishId).slice(-5)}.${ext}`;
      if (!fs.existsSync(dishesDir)) fs.mkdirSync(dishesDir, { recursive: true });
      fs.writeFileSync(path.join(dishesDir, fileName), buf);
      return `assets/dishes/${fileName}`;
    } catch {}
  }
  return null;
}

async function autoFetchDishPhoto(dishName, category, dishId) {
  const dishesDir = path.join(ROOT_DIR, 'assets', 'dishes');
  try {
    const cleanQuery = String(dishName || '').replace(/\(.*?\)/g, '').trim();
    if (!cleanQuery) return generateCustomDishSvgPhoto(dishName, category, dishId, dishesDir);

    // 1. Try Gemini AI Dish Image Generation first if configured
    const aiGenerated = await generateDishPhotoWithGemini(cleanQuery, dishId, dishesDir);
    if (aiGenerated) return aiGenerated;

    // 2. Fallback to curated food-verified Wikimedia Commons photo
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(cleanQuery + ' indian dish food filetype:bitmap')}&gsrlimit=12&prop=imageinfo|categories&iiprop=url|mime|size&iiurlwidth=720&cllimit=20&format=json`;
    const r = await fetch(searchUrl, { headers: { 'User-Agent': 'ChatkaroFoodHub/1.0' } });
    if (r.ok) {
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
      if (candidates.length) {
        const imgRes = await fetch(candidates[0].url, { headers: { 'User-Agent': 'ChatkaroFoodHub/1.0' } });
        if (imgRes.ok) {
          const buf = Buffer.from(await imgRes.arrayBuffer());
          if (buf.length >= 7000) {
            if (!fs.existsSync(dishesDir)) fs.mkdirSync(dishesDir, { recursive: true });
            const slug = cleanQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'dish';
            const fileName = `${slug}-${String(dishId).slice(-5)}.jpg`;
            fs.writeFileSync(path.join(dishesDir, fileName), buf);
            return `assets/dishes/${fileName}`;
          }
        }
      }
    }
    // 3. Always create a dish-specific pure-veg AI SVG card if neither above returned an image
    return generateCustomDishSvgPhoto(cleanQuery, category, dishId, dishesDir);
  } catch {
    return generateCustomDishSvgPhoto(dishName, category, dishId, dishesDir);
  }
}

function pushShopNotification({ type = 'offer', title, body, dishId = '', image = '' }) {
  if (!Array.isArray(db.notifications)) db.notifications = [];
  const note = {
    id: 'ntf-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    type,
    title: String(title || 'Chatkaro Food Hub Update').trim(),
    body: String(body || '').trim(),
    dishId: String(dishId || '').trim(),
    image: String(image || '').trim(),
    createdAt: Date.now()
  };
  db.notifications.unshift(note);
  db.notifications = db.notifications.slice(0, 25);
  broadcast('notice', note);
  return note;
}

    if (pathname === '/api/admin/menu' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const item = body.item || {};
      if (!item.name || item.price === undefined) return sendJson(res, 400, { error: 'Name and price required.' });
      let notice = null;
      if (item.id && db.menu.some((m) => m.id === item.id)) {
        const prev = db.menu.find((m) => m.id === item.id);
        const newDisc = item.discountPct !== undefined ? Math.max(0, Math.min(80, Number(item.discountPct || 0))) : prev.discountPct;
        const updatedItem = { ...prev, ...item, price: Number(item.price), discountPct: newDisc };
        db.menu = db.menu.map((m) => (m.id === item.id ? updatedItem : m));
        if (newDisc > 0 && Number(prev.discountPct || 0) !== newDisc) {
          notice = pushShopNotification({
            type: 'discount',
            title: `🏷️ ${newDisc}% OFF on ${updatedItem.name}!`,
            body: `Special Discount Live! Ab sirf ₹${updatedItem.price} mein — Order Now!`,
            dishId: updatedItem.id,
            image: updatedItem.image && updatedItem.image !== '__NONE__' ? updatedItem.image : 'assets/app-icon-192.png'
          });
        }
      } else {
        const newId = 'dish-' + Date.now();
        const cat = item.category || 'fast-food';
        const customImg = String(item.image || '').trim();
        const resolvedImg = customImg || (await autoFetchDishPhoto(item.name, cat, newId));
        const created = {
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
          discountPct: Math.max(0, Math.min(80, Number(item.discountPct || 0))),
          available: item.available !== false
        };
        db.menu.unshift(created);
        notice = pushShopNotification({
          type: 'new-dish',
          title: `🆕 New Dish Added: ${created.name}!`,
          body: `Fresh 100% Pure Veg @ ₹${created.price}${created.discountPct ? ` (${created.discountPct}% OFF)` : ''} — Tap to Order!`,
          dishId: created.id,
          image: created.image && created.image !== '__NONE__' ? created.image : 'assets/app-icon-192.png'
        });
      }
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { menu: db.menu, notice, state: getPublicSnapshot() });
    }

    if (pathname === '/api/admin/menu/bulk-discount' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const pct = Math.max(0, Math.min(75, Number(body.discountPct || 0)));
      db.menu = db.menu.map((m) => ({ ...m, discountPct: pct }));
      let notice = null;
      if (pct > 0) {
        notice = pushShopNotification({
          type: 'discount',
          title: `🔥 Mega Offer: Flat ${pct}% OFF on All Dishes!`,
          body: `Har 100% Pure Veg dish par ${pct}% OFF shuru ho gaya hai — Abhi Order Karein!`,
          image: 'assets/app-icon-192.png'
        });
      }
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true, discountPct: pct, notice, menu: db.menu, state: getPublicSnapshot() });
    }

    if (pathname === '/api/admin/notify' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const title = String(body.title || '').trim();
      const msg = String(body.body || '').trim();
      if (!title && !msg) return sendJson(res, 400, { error: 'Notification title or message required.' });
      const notice = pushShopNotification({
        type: body.type || 'offer',
        title: title || '📢 Chatkaro Food Hub Special Alert!',
        body: msg,
        dishId: body.dishId || '',
        image: 'assets/app-icon-192.png'
      });
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true, notice, state: getPublicSnapshot() });
    }

    if (pathname === '/api/admin/backup' && req.method === 'GET') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      return sendJson(res, 200, { exportedAt: Date.now(), db });
    }

    if (pathname === '/api/admin/backup' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const incoming = body.db || body.backup?.db || body.backup;
      if (!incoming || !Array.isArray(incoming.menu) || !incoming.settings) {
        return sendJson(res, 400, { error: 'Invalid backup JSON file.' });
      }
      db = { ...db, ...incoming, settings: { ...db.settings, ...incoming.settings } };
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true, state: getPublicSnapshot() });
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
        db.tables = db.tables.map((x) => x.id === Number(t.id) ? {
          ...x,
          label: t.label || x.label,
          seats: Number(t.seats || x.seats),
          status: t.status || x.status,
          photo: t.photo !== undefined ? String(t.photo).trim() : x.photo
        } : x);
      } else {
        const nextId = db.tables.reduce((max, x) => Math.max(max, x.id), 0) + 1;
        db.tables.push({
          id: nextId,
          label: String(t.label || `Table ${nextId}`).trim(),
          seats: Number(t.seats || 4),
          status: 'available',
          photo: String(t.photo || 'assets/tables/table-4seat.jpg').trim(),
          occupantName: '',
          occupantEmail: '',
          dishSummary: '',
          updatedAt: Date.now()
        });
      }
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { tables: db.tables });
    }

    if (pathname === '/api/admin/upload-table-photo' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const tableId = Number(body.tableId);
      const dataUrl = String(body.dataUrl || '').trim();
      const match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/i);
      if (!match) return sendJson(res, 400, { error: 'Invalid image format.' });
      const buf = Buffer.from(match[2], 'base64');
      if (buf.length > 5e6) return sendJson(res, 400, { error: 'Image must be under 5 MB.' });
      const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
      const tblDir = path.join(ROOT_DIR, 'assets', 'tables');
      if (!fs.existsSync(tblDir)) fs.mkdirSync(tblDir, { recursive: true });
      const fileName = `upload-table-${tableId}-${Date.now()}.${ext}`;
      fs.writeFileSync(path.join(tblDir, fileName), buf);
      const photoPath = `assets/tables/${fileName}`;
      db.tables = db.tables.map((t) => (t.id === tableId ? { ...t, photo: photoPath } : t));
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true, photo: photoPath, tables: db.tables });
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

    if (pathname === '/api/admin/ads' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      if (!Array.isArray(db.ads)) db.ads = [];
      const ad = body.ad || {};
      if (ad.id && db.ads.some((a) => a.id === ad.id)) {
        db.ads = db.ads.map((a) => (a.id === ad.id ? { ...a, ...ad } : a));
      } else {
        const url = String(ad.url || '').trim();
        if (!url) return sendJson(res, 400, { error: 'Ad video or photo URL required.' });
        const ytId = extractYoutubeVideoId(url);
        const type = ytId ? 'youtube' : (ad.type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(url) ? 'video' : 'image');
        db.ads.unshift({
          id: 'ad-' + Date.now(),
          title: String(ad.title || 'Chatkaro Special Ad').trim(),
          type,
          url,
          youtubeId: ytId || undefined,
          linkedDishId: String(ad.linkedDishId || 'veg-angara').trim(),
          active: ad.active !== false,
          createdAt: Date.now()
        });
      }
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true, ads: db.ads });
    }

    if (pathname === '/api/admin/upload-ad-media' && req.method === 'POST') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      const chunks = [];
      let totalBytes = 0;
      const maxBytes = 40 * 1024 * 1024; // 40 MB
      await new Promise((resolve, reject) => {
        req.on('data', (c) => {
          totalBytes += c.length;
          if (totalBytes > maxBytes) {
            reject(new Error('File too large (max 40 MB)'));
            req.destroy();
            return;
          }
          chunks.push(c);
        });
        req.on('end', resolve);
        req.on('error', reject);
      });
      const buf = Buffer.concat(chunks);
      if (!buf.length) return sendJson(res, 400, { error: 'Empty file uploaded.' });

      const rawName = decodeURIComponent(String(req.headers['x-file-name'] || 'ad.mp4'));
      const extMatch = rawName.toLowerCase().match(/\.(mp4|webm|mov|jpg|jpeg|png|webp|gif)$/);
      const hdrType = String(req.headers['x-media-type'] || '').toLowerCase();
      const isVideo = hdrType.startsWith('video/') || (extMatch && ['mp4', 'webm', 'mov'].includes(extMatch[1]));
      const ext = extMatch ? (extMatch[1] === 'jpeg' ? 'jpg' : extMatch[1]) : (isVideo ? 'mp4' : 'jpg');

      const adsDir = path.join(ROOT_DIR, 'assets', 'ads');
      if (!fs.existsSync(adsDir)) fs.mkdirSync(adsDir, { recursive: true });
      const fileName = `custom-ad-${Date.now()}.${ext}`;
      fs.writeFileSync(path.join(adsDir, fileName), buf);
      const url = `assets/ads/${fileName}`;

      if (!Array.isArray(db.ads)) db.ads = [];
      const title = decodeURIComponent(String(req.headers['x-ad-title'] || (isVideo ? 'Custom Video Ad' : 'Custom Photo Ad'))).trim() || 'Custom Ad';
      const linkedDishId = String(req.headers['x-linked-dish'] || 'veg-angara').trim();
      const newAd = {
        id: 'ad-' + Date.now(),
        title,
        type: isVideo ? 'video' : 'image',
        url,
        linkedDishId,
        active: true,
        createdAt: Date.now()
      };
      db.ads.unshift(newAd);
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true, ad: newAd, ads: db.ads });
    }

    if (pathname === '/api/admin/upload-apk' && req.method === 'POST') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      const chunks = [];
      let totalBytes = 0;
      const maxBytes = 60 * 1024 * 1024;
      await new Promise((resolve, reject) => {
        req.on('data', (c) => {
          totalBytes += c.length;
          if (totalBytes > maxBytes) {
            reject(new Error('APK file too large (max 60 MB)'));
            req.destroy();
            return;
          }
          chunks.push(c);
        });
        req.on('end', resolve);
        req.on('error', reject);
      });
      const buf = Buffer.concat(chunks);
      if (!buf.length) return sendJson(res, 400, { error: 'Empty APK uploaded.' });
      const appDir = path.join(ROOT_DIR, 'assets', 'app');
      if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });
      const apkPath = path.join(appDir, 'chatkaro-food-hub.apk');
      fs.writeFileSync(apkPath, buf);
      db.settings.apkDownloadUrl = 'assets/app/chatkaro-food-hub.apk';
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true, apkDownloadUrl: db.settings.apkDownloadUrl, state: getPublicSnapshot() });
    }

    if (pathname.startsWith('/api/admin/ads/') && req.method === 'DELETE') {
      if (!requireAdmin(req, {})) return sendJson(res, 401, { error: 'Unauthorized.' });
      const id = pathname.split('/').pop();
      if (!Array.isArray(db.ads)) db.ads = [];
      const target = db.ads.find((a) => a.id === id);
      if (target && String(target.url || '').startsWith('assets/ads/custom-ad-')) {
        const f = path.join(ROOT_DIR, target.url);
        if (fs.existsSync(f)) { try { fs.unlinkSync(f); } catch {} }
      }
      db.ads = db.ads.filter((a) => a.id !== id);
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true, ads: db.ads });
    }

    if (pathname === '/api/admin/settings' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const s = body.settings || {};
      [
        'restaurantName', 'ownerName', 'staffPin', 'smtpUser', 'openHoursText', 'announcement', 'dailyDeal', 'phone', 'priceRange',
        'instagramHandle', 'instagramReels',
        'bgMusicUrl', 'bgMusicTitle', 'bgVideoUrl', 'apkDownloadUrl',
        'address', 'plusCode', 'googleClientId', 'googlePlaceId',
        'merchantUpiId', 'razorpayKeyId',
        'phonepeMerchantId', 'phonepeSaltIndex', 'phonepeEnv'
      ].forEach((k) => {
        if (s[k] !== undefined) db.settings[k] = String(s[k]).trim();
      });
      // Preserve secrets unless non-empty replacement value is sent
      ['geminiApiKey', 'razorpayKeySecret', 'phonepeSaltKey', 'googlePlacesApiKey', 'smtpPass', 'resendApiKey'].forEach((k) => {
        if (s[k] !== undefined && String(s[k]).trim() !== '') {
          db.settings[k] = String(s[k]).trim();
        }
      });
      if (s.bgMusicEnabled !== undefined) db.settings.bgMusicEnabled = Boolean(s.bgMusicEnabled);
      if (s.bgMusicUrl !== undefined) {
        db.settings.bgMusicVideoId = extractYoutubeVideoId(s.bgMusicUrl);
        db.settings.bgMusicPlaylistId = extractYoutubePlaylistId(s.bgMusicUrl);
      }
      if (s.bgVideoEnabled !== undefined) db.settings.bgVideoEnabled = Boolean(s.bgVideoEnabled);
      if (s.bgVideoUrl !== undefined) {
        db.settings.bgVideoVideoId = extractYoutubeVideoId(s.bgVideoUrl);
        db.settings.bgVideoPlaylistId = extractYoutubePlaylistId(s.bgVideoUrl);
      }
      if (s.rating !== undefined) db.settings.rating = Number(s.rating);
      if (s.reviewCount !== undefined) db.settings.reviewCount = Number(s.reviewCount);
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true, state: getPublicSnapshot() });
    }

    if (pathname === '/api/admin/daily-ai-ad' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const campaign = await refreshDailyAiCampaign(true);
      recalculateTopAndBroadcast();
      return sendJson(res, 200, { ok: true, dailyAiAd: campaign, state: getPublicSnapshot() });
    }

    if (pathname === '/api/admin/test-gemini' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!requireAdmin(req, body)) return sendJson(res, 401, { error: 'Unauthorized.' });
      const testKey = String(body.apiKey || '').trim() || getActiveGeminiKey();
      if (!testKey) return sendJson(res, 400, { error: 'No Gemini API Key provided.' });
      const { text, model } = await callGeminiApi(testKey, 'Say Namaste from Chatkaro AI in 6 words!', []);
      return sendJson(res, 200, { ok: true, model, sample: text });
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
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  const isAsset = pathname.startsWith('/assets/');
  const cacheControl = pathname === '/sw.js'
    ? 'no-cache, no-store, must-revalidate'
    : isAsset
    ? 'public, max-age=604800, stale-while-revalidate=86400'
    : 'public, max-age=60';
  const stat = fs.statSync(fullPath);
  const range = req.headers.range;
  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? Math.min(parseInt(m[2], 10), stat.size - 1) : stat.size - 1;
      if (start <= end && start < stat.size) {
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Type': mime,
          'Cache-Control': cacheControl
        });
        return fs.createReadStream(fullPath, { start, end }).pipe(res);
      }
    }
  }
  res.writeHead(200, {
    'Content-Type': mime,
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': cacheControl,
    ...(ext === '.apk' ? { 'Content-Disposition': 'attachment; filename="Chatkaro-Food-Hub.apk"' } : {})
  });
  fs.createReadStream(fullPath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Chatkaro Food Hub live server running at http://localhost:${PORT}`);
  hydrateFromCloudGistOnBoot();
  refreshDailyAiCampaign(false).catch(() => {});
  setInterval(() => {
    refreshDailyAiCampaign(false).then(() => broadcast('state', getPublicSnapshot())).catch(() => {});
  }, 3600 * 1000);
  // Keep SSE connections alive across mobile networks & Render proxies
  setInterval(() => {
    for (const client of sseClients) {
      try { client.write(': ping\n\n'); } catch { sseClients.delete(client); }
    }
  }, 20000);
});
