(function () {
  const isHttp = window.location.protocol.startsWith('http');
  const API_BASE = isHttp ? '' : null;

  const appState = {
    theme: localStorage.getItem('chatkaro_theme') || 'dark',
    userOverrideTheme: localStorage.getItem('chatkaro_user_theme_override') === '1',
    user: JSON.parse(localStorage.getItem('chatkaro_user') || 'null'),
    adminToken: sessionStorage.getItem('chatkaro_admin_token') || '',
    salesData: null,
    aiHistory: [],
    category: 'all',
    filter: null,
    search: '',
    photoCategory: 'all',
    cart: JSON.parse(localStorage.getItem('chatkaro_cart') || '{}'),
    orderType: 'dine-in',
    paymentMethod: 'cod',
    adminOrderFilter: 'all',
    pendingPhonepeTxn: null,
    promoCode: localStorage.getItem('chatkaro_active_promo') || '',
    unlockedCoupons: JSON.parse(localStorage.getItem('chatkaro_coupons') || '[]'),
    pendingOrderAfterLogin: false,
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
      announcement: '🌿 100% Pure Vegetarian • ★ 4.9 (113+ Reviews) • 12:00 PM–3:00 PM & 6:00 PM–11:50 PM',
      dailyDeal: '🔥 Today’s Combo Deal: Classic Masala Dosa + Cold Coffee = ₹149! Use WELCOME5 for extra 5% OFF.',
      googleClientId: '',
      hasGeminiKey: false,
      lastMapsSyncAt: Date.now(),
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
    menu: [],
    ads: [],
    notifications: [],
    waiterCalls: [],
    waiterChats: [],
    deliveryChats: [],
    activeTableId: Number(new URLSearchParams(window.location.search).get('table') || sessionStorage.getItem('chatkaro_qr_table') || 0) || null,
    dailyAiAd: null,
    tables: [],
    orders: [],
    reviews: [],
    mapPhotos: [],
    chatMessages: [],
    topCustomers: [],
    customersAll: [],
    gameRooms: [],
    staticMode: !isHttp
  };

  window.ChatkaroBridge = {
    getUser: () => appState.user,
    getTables: () => appState.tables,
    getApiBase: () => API_BASE,
    onGameRoomsUpdate: null,
    unlockCoupon: (code) => {
      unlockCoupon(code);
      launchConfetti();
    },
    showToast: (msg) => showToast(msg),
    reportScore: async (score) => {
      if (!API_BASE || !appState.user) return;
      try {
        await api('/api/game/score', 'POST', { email: appState.user.email, score });
      } catch {}
    }
  };

  const $ = (id) => document.getElementById(id);
  const escapeHtml = (str) =>
    String(str ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  let toastTimer = null;
  function showToast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2800);
  }

  function handleStaticApi(url, method, body) {
    if (url === '/api/auth/login' && method === 'POST') {
      const email = String(body?.email || '').trim().toLowerCase();
      if (!email || !/^[^\s@]+@(gmail|googlemail)\.com$/i.test(email)) {
        throw new Error('Please sign in with a valid @gmail.com email address.');
      }
      const customer = {
        ...(appState.user && appState.user.email === email ? appState.user : {}),
        email,
        name: String(body?.name || email.split('@')[0]).trim(),
        phone: String(body?.phone || '').trim(),
        picture: body?.picture || '',
        bio: appState.user?.bio || 'Chatkaro Foodie',
        favoriteDish: appState.user?.favoriteDish || 'Mix Veg',
        avatarColor: appState.user?.avatarColor || '#ea580c',
        ordersCount: appState.user?.ordersCount || 0,
        totalSpent: appState.user?.totalSpent || 0,
        bestGameScore: appState.user?.bestGameScore || 0,
        tableId: appState.user?.tableId || null
      };
      return { customer };
    }
    if (url === '/api/profile' && method === 'POST') {
      const customer = { ...(appState.user || {}), ...body };
      return { customer };
    }
    if (url === '/api/orders' && method === 'POST') {
      const items = Array.isArray(body?.items) ? body.items : [];
      const subtotal = items.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0);
      const discountAmt = Number(body?.discountAmt || 0);
      const deliveryFee = Number(body?.deliveryFee || 0);
      const order = {
        id: 'CFH-' + String(Date.now()).slice(-4),
        customerName: body?.customerName || 'Guest',
        customerEmail: body?.customerEmail || '',
        customerPhone: body?.customerPhone || '',
        orderType: body?.orderType || 'dine-in',
        tableId: body?.tableId || null,
        detail: body?.detail || '',
        items,
        subtotal,
        discountAmt,
        deliveryFee,
        total: Math.max(0, subtotal - discountAmt + deliveryFee),
        promoCode: body?.promoCode || '',
        paymentMethod: body?.paymentMethod || 'cod',
        paymentStatus: body?.paymentStatus || 'cod',
        paymentId: body?.paymentId || '',
        isFake: false,
        status: 'confirmed',
        etaMinutes: Number(body?.etaMinutes || 18),
        etaEndsAt: Date.now() + Number(body?.etaMinutes || 18) * 60000,
        createdAt: Date.now()
      };
      appState.orders.unshift(order);
      renderLiveOrders();
      renderMyOrderBanner();
      return { order };
    }
    if (url === '/api/tables/checkin' && method === 'POST') {
      const tbl = appState.tables.find((t) => t.id === Number(body?.tableId));
      if (!tbl) throw new Error('Table not found.');
      if (body?.action === 'leave') {
        tbl.status = 'available';
        tbl.occupantName = '';
        tbl.occupantEmail = '';
        tbl.dishSummary = '';
      } else {
        appState.tables.forEach((t) => {
          if (t.occupantEmail === body?.email) {
            t.status = 'available';
            t.occupantName = '';
            t.occupantEmail = '';
            t.dishSummary = '';
          }
        });
        tbl.status = 'occupied';
        tbl.occupantName = body?.name || 'Guest';
        tbl.occupantEmail = body?.email || '';
        tbl.dishSummary = 'Dining in';
      }
      renderTables();
      renderCart();
      return { ok: true };
    }
    if (url === '/api/chat' && method === 'POST') {
      appState.chatMessages.push({
        id: 'msg-' + Date.now(),
        senderName: body?.senderName || 'Guest',
        senderEmail: body?.senderEmail || '',
        tableId: body?.tableId || null,
        text: String(body?.text || '').trim(),
        createdAt: Date.now()
      });
      renderChat();
      return { ok: true };
    }
    if (url === '/api/reviews' && method === 'POST') {
      appState.reviews.unshift({
        id: 'rev-' + Date.now(),
        author: String(body?.author || 'Guest').trim(),
        rating: Math.min(5, Math.max(1, Number(body?.rating || 5))),
        text: String(body?.text || '').trim(),
        source: body?.source || 'Website Guest',
        meta: 'Guest Review',
        createdAt: Date.now()
      });
      renderReviews();
      return { ok: true };
    }
    if (url === '/api/ai-chat' && method === 'POST') {
      const q = String(body?.message || '').toLowerCase();
      const avail = appState.menu.filter((m) => m.available !== false);
      const freeTables = appState.tables.filter((t) => t.status === 'available');
      let reply = `Namaste! 🙏 Chatkaro Food Hub mein ${avail.length} pure-veg dishes available hain (South Indian, Chinese, Punjabi, Fast Food & Beverages). Order karne ke liye dishes '+' karke Cart se WhatsApp par bhej sakte hain!`;
      if (q.includes('sold') || q.includes('khatam')) {
        const soldOut = appState.menu.filter((m) => m.available === false);
        reply = soldOut.length ? `Sold out items: ${soldOut.map((m) => m.name).join(', ')}.` : 'Abhi saare menu items available hain! 😊';
      } else if (q.includes('table') || q.includes('khali') || q.includes('seat')) {
        reply = freeTables.length ? `Abhi ${freeTables.length} tables khali hain: ${freeTables.map((t) => t.label).join(', ')}.` : 'Abhi saari tables occupied hain, par aap Takeaway ya Delivery order kar sakte hain!';
      } else if (q.includes('menu') || q.includes('milega') || q.includes('price')) {
        const top = avail.slice(0, 6).map((m) => `${m.name} (₹${m.price})`).join(', ');
        reply = `Popular dishes: ${top}. Poore menu ke liye upar Menu section dekhein!`;
      }
      return { reply, engine: 'local-helper' };
    }
    if (url === '/api/game/score' && method === 'POST') {
      return { ok: true };
    }
    throw new Error('This live feature requires Node server (deploy on Render/Railway).');
  }

  async function api(url, method = 'GET', body = null, headers = {}) {
    if (appState.staticMode || !API_BASE && API_BASE !== '') {
      return handleStaticApi(url, method, body);
    }
    const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    let data = null;
    try {
      data = await res.json();
    } catch {
      throw new Error('Live server unavailable.');
    }
    if (!res.ok) throw new Error(data?.error || 'Request failed');
    return data;
  }

  // ================= VISUAL EFFECTS: HERO PARTICLES, SCROLL REVEAL & CONFETTI =================
  function initScrollReveal() {
    const els = document.querySelectorAll('.reveal');
    const showAll = () => els.forEach((el) => el.classList.add('visible'));
    if (!('IntersectionObserver' in window)) {
      showAll();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '140px 0px' }
    );
    els.forEach((el) => io.observe(el));
    // Guarantee every section becomes visible even on tall mobile viewports
    setTimeout(showAll, 550);
  }

  function initHeroParticles() {
    const canvas = $('heroFxCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isMobile = window.innerWidth <= 640;
    let sparks = [];
    let heroVisible = true;
    let rafId = 0;
    let cachedPrimary = '#dc2626';
    let cachedAccent = '#fbbf24';

    function refreshThemeCache() {
      const st = getComputedStyle(document.documentElement);
      cachedPrimary = st.getPropertyValue('--primary').trim() || '#dc2626';
      cachedAccent = st.getPropertyValue('--accent').trim() || '#fbbf24';
    }
    refreshThemeCache();
    window.addEventListener('chatkaro-theme-updated', refreshThemeCache);

    function resize() {
      canvas.width = canvas.offsetWidth || 1000;
      canvas.height = canvas.offsetHeight || 500;
    }
    resize();
    let resizeT = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(resize, 180);
    }, { passive: true });

    const sparkCount = isMobile ? 10 : 22;
    for (let i = 0; i < sparkCount; i++) {
      sparks.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 1.5 + Math.random() * 2.5,
        vy: -0.35 - Math.random() * 0.55,
        vx: (Math.random() - 0.5) * 0.35,
        alpha: 0.16 + Math.random() * 0.38
      });
    }

    function tick() {
      rafId = 0;
      if (!heroVisible || document.hidden || document.body.classList.contains('no-fx') || document.body.classList.contains('admin-open')) {
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let idx = 0; idx < sparks.length; idx++) {
        const s = sparks[idx];
        s.y += s.vy;
        s.x += s.vx;
        if (s.y < -10) {
          s.y = canvas.height + 10;
          s.x = Math.random() * canvas.width;
        }
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = idx % 2 === 0 ? cachedPrimary : cachedAccent;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      rafId = requestAnimationFrame(tick);
    }

    function startIfNeeded() {
      if (!rafId && heroVisible && !document.hidden) rafId = requestAnimationFrame(tick);
    }

    if ('IntersectionObserver' in window) {
      const heroEl = $('home');
      if (heroEl) {
        new IntersectionObserver((entries) => {
          heroVisible = Boolean(entries[0]?.isIntersecting);
          if (heroVisible) startIfNeeded();
        }, { threshold: 0.02 }).observe(heroEl);
      }
    }
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) startIfNeeded();
    });
    startIfNeeded();
  }

  function launchConfetti() {
    if (document.body.classList.contains('no-fx')) return;
    const canvas = $('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#f97316', '#fbbf24', '#22c55e', '#38bdf8', '#f43f5e'];
    const bits = Array.from({ length: 75 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 80,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 6,
      vx: (Math.random() - 0.5) * 4,
      vy: 3 + Math.random() * 4.5,
      rot: Math.random() * Math.PI,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    let frames = 0;
    function step() {
      frames++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bits.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
        b.rot += 0.08;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      });
      if (frames < 110) requestAnimationFrame(step);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(step);
  }

  // ================= LIVE BRAND THEME & DARK/WHITE TOGGLE =================
  const COLOR_PRESETS = {
    'greenrush-3d': { label: 'GreenRush 3D Crimson', mode: 'dark', primary: '#dc2626', accent: '#fbbf24', bg: '#141414', surface: '#1d1d20', text: '#f9fafb' },
    'saffron-night': { label: 'Saffron Night', mode: 'dark', primary: '#f97316', accent: '#fbbf24', bg: '#0f0a07', surface: '#1b120d', text: '#fbf4ec' },
    'pure-white': { label: 'Pure White', mode: 'light', primary: '#ea580c', accent: '#b45309', bg: '#ffffff', surface: '#ffffff', text: '#1c130d' },
    'royal-emerald': { label: 'Royal Emerald', mode: 'dark', primary: '#10b981', accent: '#facc15', bg: '#071510', surface: '#0f241c', text: '#ecfdf5' },
    'midnight-berry': { label: 'Midnight Berry', mode: 'dark', primary: '#ec4899', accent: '#a855f7', bg: '#130716', surface: '#220f26', text: '#fdf2f8' },
    'tandoori-gold': { label: 'Tandoori Gold', mode: 'dark', primary: '#dc2626', accent: '#f59e0b', bg: '#160908', surface: '#261210', text: '#fff5f5' }
  };

  function isLightColor(hex) {
    const c = (hex || '#000000').replace('#', '');
    if (c.length !== 6) return false;
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 145;
  }

  function applyBrandColors(bt) {
    if (!bt) return;
    const root = document.documentElement;
    document.body.classList.toggle('no-fx', bt.fxEnabled === false);

    if (appState.userOverrideTheme) {
      // User manually clicked Dark/White toggle — keep primary/accent from Admin, use crisp Dark/White surface
      root.style.setProperty('--primary', bt.primary || '#f97316');
      root.style.setProperty('--accent', bt.accent || '#fbbf24');
      root.style.removeProperty('--bg');
      root.style.removeProperty('--surface');
      root.style.removeProperty('--surface-alt');
      root.style.removeProperty('--text');
      root.style.removeProperty('--text-strong');
      root.style.removeProperty('--border');
      root.setAttribute('data-theme', appState.theme);
      $('themeToggleBtn').textContent = appState.theme === 'dark' ? '☀️ White' : '🌙 Dark';
      return;
    }

    const light = isLightColor(bt.bg);
    root.setAttribute('data-theme', light ? 'light' : 'dark');
    appState.theme = light ? 'light' : 'dark';
    $('themeToggleBtn').textContent = light ? '🌙 Dark' : '☀️ White';

    root.style.setProperty('--primary', bt.primary);
    root.style.setProperty('--accent', bt.accent);
    root.style.setProperty('--bg', bt.bg);
    root.style.setProperty('--surface', bt.surface);
    root.style.setProperty('--text', bt.text);
    root.style.setProperty('--text-strong', bt.text);
    root.style.setProperty('--surface-alt', light ? '#f3ece3' : 'rgba(255,255,255,0.06)');
    root.style.setProperty('--border', light ? '#d5c4b1' : 'rgba(255,255,255,0.14)');
    window.dispatchEvent(new Event('chatkaro-theme-updated'));
  }

  $('themeToggleBtn').addEventListener('click', () => {
    appState.userOverrideTheme = true;
    localStorage.setItem('chatkaro_user_theme_override', '1');
    appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('chatkaro_theme', appState.theme);
    applyBrandColors(appState.settings.brandTheme);
  });

  // ================= SSE REAL-TIME SYNC =================
  function connectRealtime() {
    if (!isHttp || appState.staticMode) {
      $('syncStatusBadge').textContent = '● Static Mode';
      return;
    }
    const es = new EventSource('/api/events');
    es.addEventListener('state', (ev) => {
      try {
        const snap = JSON.parse(ev.data);
        applySnapshot(snap);
        persistSnapshotToCache(snap);
        $('syncStatusBadge').textContent = '● Live Sync';
      } catch {}
    });
    es.addEventListener('game', (ev) => {
      try {
        const room = JSON.parse(ev.data);
        if (window.ChatkaroBridge.onGameRoomsUpdate) window.ChatkaroBridge.onGameRoomsUpdate(room);
      } catch {}
    });
    es.addEventListener('notice', (ev) => {
      try {
        const note = JSON.parse(ev.data);
        if (typeof handleIncomingNotice === 'function') handleIncomingNotice(note, true);
      } catch {}
    });
    es.addEventListener('waiter-call', (ev) => {
      try {
        const c = JSON.parse(ev.data);
        if (!Array.isArray(appState.waiterCalls)) appState.waiterCalls = [];
        const idx = appState.waiterCalls.findIndex((x) => x.id === c.id);
        if (idx >= 0) appState.waiterCalls[idx] = c; else appState.waiterCalls.unshift(c);
        if (typeof renderWaiterServicePanel === 'function') renderWaiterServicePanel();
      } catch {}
    });
    es.addEventListener('waiter-chat', (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (!Array.isArray(appState.waiterChats)) appState.waiterChats = [];
        appState.waiterChats.push(m);
        if (typeof renderWaiterServicePanel === 'function') renderWaiterServicePanel();
      } catch {}
    });
    es.addEventListener('delivery-chat', (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (!Array.isArray(appState.deliveryChats)) appState.deliveryChats = [];
        appState.deliveryChats.push(m);
        if (!$('profileModal').classList.contains('hidden')) renderMyOrdersList();
        if (!$('orderModal').classList.contains('hidden') && appState.activeTrackOrderId === m.orderId) {
          const ord = appState.orders.find((o) => o.id === m.orderId);
          if (ord) refreshOrderModalTracking(ord);
        }
      } catch {}
    });
    es.addEventListener('delivery-location', (ev) => {
      try {
        const d = JSON.parse(ev.data);
        const ord = appState.orders.find((o) => o.id === d.orderId);
        if (ord) {
          ord.driverLocation = d.driverLocation;
          if (d.driverName) ord.driverName = d.driverName;
          if (d.driverPhone) ord.driverPhone = d.driverPhone;
        }
        if (!$('profileModal').classList.contains('hidden')) renderMyOrdersList();
        if (!$('orderModal').classList.contains('hidden') && appState.activeTrackOrderId === d.orderId && ord) {
          refreshOrderModalTracking(ord);
        }
      } catch {}
    });
    es.onerror = () => {
      $('syncStatusBadge').textContent = '● Reconnecting...';
    };
  }

  function activateStaticMode() {
    appState.staticMode = true;
    $('syncStatusBadge').textContent = '● Static Mode';
    const menuItems = Array.isArray(window.CHATKARO_MENU)
      ? window.CHATKARO_MENU.map((m) => ({ ...m, available: m.available !== false }))
      : [];
    const now = Date.now();
    applySnapshot({
      settings: appState.settings,
      menu: menuItems,
      ads: [
        { id: 'ad-insta-1', title: 'Chatkaro Live Kitchen Reel #1', type: 'video', url: 'assets/ads/reel-1.mp4', linkedDishId: 'veg-angara', active: true },
        { id: 'ad-insta-2', title: 'Chatkaro Special Dish Reel #2', type: 'video', url: 'assets/ads/reel-2.mp4', linkedDishId: 'cheese-anguri', active: true }
      ],
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
      orders: [],
      reviews: [
        { id: 'rev-1', author: 'Aman Kumar', rating: 5, text: 'Chatkaro Food Hub is an amazing place! Delicious pure-veg food and wonderful atmosphere.', source: 'Google Maps', meta: 'Dine-in • ₹1–200', createdAt: now - 3600000 },
        { id: 'rev-2', author: 'Devanshi Unadkat', rating: 5, text: 'Everything was top notch and Dosa was just amazing! ❤️', source: 'Google Maps', meta: 'Local Foodie', createdAt: now - 86400000 },
        { id: 'rev-3', author: 'Piyu Kanabar', rating: 5, text: 'The taste of food is just too good 😄 Chinese, Punjabi & South Indian all great!', source: 'Google Maps', meta: 'Pure Vegetarian', createdAt: now - 172800000 },
        { id: 'rev-4', author: 'Manish Kakani', rating: 5, text: 'Super food and satisfied! Peaceful atmosphere and quick family service.', source: 'Google Maps', meta: 'Free Parking', createdAt: now - 259200000 }
      ],
      mapPhotos: [
        { id: 'mp-1', title: 'Veg Kadai & Mix Veg Preparation (વેજ કડાઈ)', category: 'food', uploader: 'By Owner • Signature Menu', url: 'assets/veg-kadai.jpg', createdAt: now },
        { id: 'mp-2', title: 'Sizzling Veg Angara & Veg Kolhapuri (વેજ અંગારા)', category: 'food', uploader: 'By Owner • Signature Menu', url: 'assets/veg-angara.jpg', createdAt: now },
        { id: 'mp-3', title: 'Royal Kaju Curry & Kaju Butter Masala (કાજુ કરી)', category: 'food', uploader: 'By Owner • Signature Menu', url: 'assets/kaju-curry.jpg', createdAt: now },
        { id: 'mp-4', title: 'Cheese Butter Masala & Cheese Anguri (ચીઝ અંગુરી)', category: 'food', uploader: 'By Owner • Signature Menu', url: 'assets/cheese-masala.jpg', createdAt: now },
        { id: 'mp-5', title: 'Crispy Masala Dosa with Hot Sambar & Chutneys', category: 'food', uploader: 'Google Maps Photo', url: 'assets/dosa-platter.jpg', createdAt: now },
        { id: 'mp-6', title: 'Peaceful Family Dining Lounge & Warm Vibe', category: 'vibe', uploader: 'Google Maps Photo', url: 'assets/dining-vibe.jpg', createdAt: now }
      ],
      chatMessages: [],
      topCustomers: []
    });
  }

  function applySnapshot(snap) {
    if (snap.settings) appState.settings = snap.settings;
    if (snap.menu) appState.menu = snap.menu;
    if (snap.ads) appState.ads = snap.ads;
    if (snap.notifications) {
      appState.notifications = snap.notifications;
      if (typeof syncNotificationsUI === 'function') syncNotificationsUI(snap.notifications);
    }
    if (snap.waiterCalls) appState.waiterCalls = snap.waiterCalls;
    if (snap.waiterChats) appState.waiterChats = snap.waiterChats;
    if (snap.deliveryChats) appState.deliveryChats = snap.deliveryChats;
    if (snap.dailyAiAd) appState.dailyAiAd = snap.dailyAiAd;
    if (snap.tables) appState.tables = snap.tables;
    if (snap.orders) appState.orders = snap.orders;
    if (snap.reviews) appState.reviews = snap.reviews;
    if (snap.mapPhotos) appState.mapPhotos = snap.mapPhotos;
    if (snap.chatMessages) appState.chatMessages = snap.chatMessages;
    if (snap.topCustomers) appState.topCustomers = snap.topCustomers;
    if (snap.customersAll) appState.customersAll = snap.customersAll;
    if (snap.gameRooms) appState.gameRooms = snap.gameRooms;

    if (appState.user) {
      const userTable = appState.tables.find((t) => t.occupantEmail === appState.user.email);
      appState.user.tableId = userTable ? userTable.id : null;
      localStorage.setItem('chatkaro_user', JSON.stringify(appState.user));
    }

    applyBrandColors(appState.settings.brandTheme);
    renderSettingsBanner();
    renderMenu();
    refreshHeroAdReel();
    renderCart();
    renderTables();
    renderLiveOrders();
    renderTopCustomers();
    renderChat();
    renderMapPhotos();
    renderReviews();
    renderMyOrderBanner();
    renderAuthUI();
    if (typeof renderTableQrBanner === 'function') renderTableQrBanner();
    if (typeof renderWaiterServicePanel === 'function') renderWaiterServicePanel();
    syncBgMusicPlayer();
    syncBgVideoPlayer();
    if (typeof syncDownloadAppUI === 'function') syncDownloadAppUI();
    if (!$('adminModal').classList.contains('hidden') && appState.adminToken) {
      refreshSalesAndRenderAdmin();
    }
    if (!$('profileModal').classList.contains('hidden')) {
      renderMyOrdersList();
    }
    if (!$('orderModal').classList.contains('hidden') && appState.activeTrackOrderId) {
      const tracked = appState.orders.find((o) => o.id === appState.activeTrackOrderId);
      if (tracked) refreshOrderModalTracking(tracked);
    }
    initGoogleIdentityIfConfigured();
  }

  function persistSnapshotToCache(snap) {
    try {
      if (!snap || !Array.isArray(snap.menu) || !snap.menu.length) return;
      localStorage.setItem(
        'chatkaro_cached_snap_v2',
        JSON.stringify({
          settings: snap.settings,
          menu: snap.menu,
          ads: snap.ads,
          tables: snap.tables,
          reviews: snap.reviews,
          mapPhotos: snap.mapPhotos,
          savedAt: Date.now()
        })
      );
    } catch {}
  }

  function bootInstantFromCacheOrMenu() {
    try {
      const raw = localStorage.getItem('chatkaro_cached_snap_v2');
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && Array.isArray(cached.menu) && cached.menu.length) {
          applySnapshot(cached);
          return true;
        }
      }
    } catch {}
    activateStaticMode();
    return false;
  }

  async function fetchStateWithTimeout(timeoutMs = 9000) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch('/api/state', { signal: ctrl.signal, cache: 'no-store' });
      if (!res.ok) throw new Error('State HTTP ' + res.status);
      return await res.json();
    } finally {
      clearTimeout(tid);
    }
  }

  async function initialFetch() {
    // 1. Instant 0ms render so all 76 dishes load immediately even on slow 2G/3G or sleeping server
    bootInstantFromCacheOrMenu();

    if ('serviceWorker' in navigator && isHttp) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if (!isHttp) return;

    const tryLiveSync = async (attempt = 0) => {
      try {
        const snap = await fetchStateWithTimeout(9000);
        appState.staticMode = false;
        $('syncStatusBadge').textContent = '● Live Sync';
        applySnapshot(snap);
        persistSnapshotToCache(snap);
        connectRealtime();
      } catch {
        // Render free tier cold-start retry silently in background while menu is already usable
        if (attempt < 8) {
          setTimeout(() => tryLiveSync(attempt + 1), 6000);
        }
      }
    };
    tryLiveSync(0);

    // Keep all phones & PCs auto-synced even if mobile 4G throttles SSE
    const syncQuietly = async () => {
      try {
        const snap = await fetchStateWithTimeout(8000);
        appState.staticMode = false;
        $('syncStatusBadge').textContent = '● Live Sync';
        applySnapshot(snap);
        persistSnapshotToCache(snap);
      } catch {}
    };
    setInterval(syncQuietly, 15000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') syncQuietly();
    });
    window.addEventListener('online', syncQuietly);
  }

  function getLiveOpenStatusText() {
    try {
      const istStr = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' });
      const [hh, mm] = istStr.split(':').map(Number);
      const mins = hh * 60 + mm;
      if (mins >= 720 && mins < 900) return '🟢 Open Now (Lunch till 3:00 PM)';
      if (mins >= 900 && mins < 1080) return '☕ Break (3–6 PM) • Opens 6:00 PM';
      if (mins >= 1080 && mins <= 1430) return '🟢 Open Now (Dinner till 11:50 PM)';
      return '🕒 Opens 12:00 PM • 12–3 PM & 6–11:50 PM';
    } catch {
      return '🕒 12:00 PM–3:00 PM & 6:00 PM–11:50 PM';
    }
  }

  function renderSettingsBanner() {
    const s = appState.settings;
    const defaultHours = '12:00 PM – 3:00 PM (Break 3–6 PM) • 6:00 PM – 11:50 PM';
    $('brandTitle').textContent = (s.restaurantName || 'Chatkaro').split(' ')[0];
    $('topAnnouncement').textContent = s.announcement || '';
    if ($('dailyDealBanner')) {
      const dailyMsg = appState.dailyAiAd?.headline ? `${appState.dailyAiAd.headline} — ${appState.dailyAiAd.subline}` : (s.dailyDeal || '');
      $('dailyDealBanner').textContent = dailyMsg;
      $('dailyDealBanner').classList.toggle('hidden', !dailyMsg);
    }
    if ($('aiEngineBadge')) {
      $('aiEngineBadge').textContent = s.hasGeminiKey ? 'Gemini AI Live ✨' : 'Live Menu & Ordering Helper';
    }
    $('topHoursText').textContent = s.openHoursText || defaultHours;
    $('heroHoursBadge').textContent = getLiveOpenStatusText();
    if ($('heroPriceRange')) $('heroPriceRange').textContent = s.priceRange || '₹1–300 per person';
    $('visitHoursText').textContent = s.openHoursText || defaultHours;
    $('visitPriceText').textContent = `${s.priceRange || '₹1–300 per person'} • 100% Pure Vegetarian`;
    $('visitRestName').textContent = s.restaurantName || 'Chatkaro Food Hub';
    $('visitFullAddress').textContent = s.address || '';
    $('visitAddressLead').textContent = s.address || '';
    $('visitPlusCode').textContent = s.plusCode || '2GWF+GJ Talala, Gujarat';
    $('topPhoneLink').href = `tel:+${s.phone || '919054633908'}`;
    $('visitCallLink').href = `tel:+${s.phone || '919054633908'}`;
    $('heroRatingBadge').innerHTML = `⭐ ${s.rating || 4.9} <span>(${s.reviewCount || 113} Reviews)</span>`;
    $('reviewsAvgRating').textContent = s.rating || 4.9;
    $('reviewsTotalCount').textContent = `Based on ${s.reviewCount || 113} Google & Guest Reviews`;
    if (s.lastMapsSyncAt) {
      $('lastSyncTimeLabel').textContent = 'Synced ' + new Date(s.lastMapsSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const handle = String(s.instagramHandle || 'chatkaro_the_food_hub').replace(/^@+/, '').trim() || 'chatkaro_the_food_hub';
    const instaUrl = `https://www.instagram.com/${handle}/`;
    if ($('heroInstaLink')) { $('heroInstaLink').href = instaUrl; $('heroInstaLink').textContent = `📸 @${handle}`; }
    if ($('momentsInstaBtn')) { $('momentsInstaBtn').href = instaUrl; $('momentsInstaBtn').textContent = `📸 Follow @${handle}`; }
    if ($('instaFollowProfileBtn')) { $('instaFollowProfileBtn').href = instaUrl; $('instaFollowProfileBtn').textContent = `📸 @${handle}`; }
    if ($('visitInstaLink')) { $('visitInstaLink').href = instaUrl; $('visitInstaLink').textContent = `📸 Instagram @${handle}`; }
    if ($('footerInstaLink')) { $('footerInstaLink').href = instaUrl; }
    renderInstagramReelsShowcase();
  }

  function parseInstagramReelIds(rawStr) {
    const fallback = ['DeoG7QDA2O3', 'DfLrI3hzTGD'];
    const text = String(rawStr || '').trim();
    if (!text) return fallback;
    const found = [];
    const lines = text.split(/[\r\n,\s]+/).map((x) => x.trim()).filter(Boolean);
    lines.forEach((line) => {
      const m = line.match(/instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i);
      const id = m ? m[1] : (/^[A-Za-z0-9_-]{6,25}$/.test(line) ? line : '');
      if (id && !found.includes(id)) found.push(id);
    });
    return found.length ? found : fallback;
  }

  let renderedReelsSig = '';
  function renderInstagramReelsShowcase() {
    const grid = $('instaReelsGrid');
    if (!grid) return;
    const handle = String(appState.settings.instagramHandle || 'chatkaro_the_food_hub').replace(/^@+/, '').trim() || 'chatkaro_the_food_hub';
    const videoAds = (appState.ads || []).filter((a) => a.type === 'video' && a.active !== false);
    const items = videoAds.length
      ? videoAds
      : [
          { id: 'reel-1', title: `@${handle} Live Kitchen Reel #1`, url: 'assets/ads/reel-1.mp4' },
          { id: 'reel-2', title: `Chatkaro Food Hub Special Reel #2`, url: 'assets/ads/reel-2.mp4' }
        ];
    const sig = `${handle}:${items.map((x) => `${x.id}:${x.url}`).join('|')}`;
    if (sig === renderedReelsSig) return;
    renderedReelsSig = sig;
    grid.innerHTML = items
      .map(
        (v, i) => `
      <article class="insta-reel-card card-hover">
        <div class="insta-reel-embed-box">
          <video src="${escapeHtml(v.url)}" controls muted autoplay loop playsinline preload="metadata"></video>
        </div>
        <div class="insta-reel-card-foot">
          <span>🎬 ${escapeHtml(v.title || `Reel #${i + 1}`)}</span>
          <a href="https://www.instagram.com/${encodeURIComponent(handle)}/" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-xs">@${escapeHtml(handle)} ↗</a>
        </div>
      </article>`
      )
      .join('');
  }

  // ================= SHARED YOUTUBE IFRAME API + BACKGROUND SONG & VIDEO PLAYERS =================
  const ytCallbacks = [];
  let ytApiLoading = false;
  let ytApiReady = false;

  function ensureYtApiLoaded(cb) {
    if (window.YT && window.YT.Player) {
      ytApiReady = true;
      cb();
      return;
    }
    ytCallbacks.push(cb);
    if (!ytApiLoading) {
      ytApiLoading = true;
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        ytApiReady = true;
        if (typeof prevReady === 'function') { try { prevReady(); } catch {} }
        while (ytCallbacks.length) {
          const fn = ytCallbacks.shift();
          try { fn(); } catch {}
        }
      };
      const sc = document.createElement('script');
      sc.src = 'https://www.youtube.com/iframe_api';
      sc.async = true;
      document.head.appendChild(sc);
    }
  }

  function clientExtractYtId(rawUrl) {
    let s = String(rawUrl || '').trim();
    if (!s) return '';
    const iframeSrc = s.match(/src=["']([^"']+)["']/i);
    if (iframeSrc) s = iframeSrc[1].trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
    const m = s.match(/(?:(?:www\.|m\.|music\.)?(?:youtube\.com|youtube-nocookie\.com)\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i)
      || s.match(/[?&](?:v|vi)=([A-Za-z0-9_-]{11})/i);
    return m ? m[1] : '';
  }

  function clientExtractYtList(rawUrl) {
    let s = String(rawUrl || '').trim();
    const iframeSrc = s.match(/src=["']([^"']+)["']/i);
    if (iframeSrc) s = iframeSrc[1].trim();
    const m = s.match(/[?&]list=([A-Za-z0-9_-]+)/i);
    return m ? m[1] : '';
  }

  const bgMusicState = {
    player: null,
    audioEl: null,
    ready: false,
    currentSig: '',
    userOff: localStorage.getItem('chatkaro_music_off') === '1',
    audioUnmuted: false
  };

  function updateMusicButtonUI() {
    const btn = $('musicFloatBtn');
    const lbl = $('musicFloatLabel');
    if (!btn) return;
    const s = appState.settings || {};
    const vid = String(s.bgMusicVideoId || clientExtractYtId(s.bgMusicUrl) || '').trim();
    const pid = String(s.bgMusicPlaylistId || clientExtractYtList(s.bgMusicUrl) || '').trim();
    const isDirectAudio = /\.(mp3|m4a|ogg|wav|aac)(\?|$)/i.test(String(s.bgMusicUrl || ''));
    if ((!vid && !pid && !isDirectAudio) || s.bgMusicEnabled === false) {
      btn.classList.add('hidden');
      btn.classList.remove('playing');
      return;
    }
    btn.classList.remove('hidden');
    if (bgMusicState.userOff) {
      btn.classList.remove('playing');
      if (lbl) lbl.textContent = 'Music Off';
      btn.querySelector('.music-eq').textContent = '🔇';
    } else if (!bgMusicState.audioUnmuted) {
      btn.classList.add('playing');
      if (lbl) lbl.textContent = 'Tap for Song';
      btn.querySelector('.music-eq').textContent = '🔊';
    } else {
      btn.classList.add('playing');
      const title = String(s.bgMusicTitle || 'Shop Music').slice(0, 18);
      if (lbl) lbl.textContent = title;
      btn.querySelector('.music-eq').textContent = '🎵';
    }
  }

  function createOrLoadYtPlayer(videoId, playlistId = '') {
    if (!videoId && !playlistId) return;
    ensureYtApiLoaded(() => {
      const targetSig = `${videoId || ''}:${playlistId || ''}`;
      if (bgMusicState.player && bgMusicState.currentSig === targetSig) {
        applyBgMusicPlayState(false);
        return;
      }
      if (bgMusicState.player && bgMusicState.ready && typeof bgMusicState.player.loadVideoById === 'function' && videoId) {
        bgMusicState.currentSig = targetSig;
        try {
          bgMusicState.player.loadVideoById({ videoId, startSeconds: 0 });
          applyBgMusicPlayState(false);
          return;
        } catch {}
      }
      const host = $('bgMusicPlayerHost');
      if (!host) return;
      if (bgMusicState.player && typeof bgMusicState.player.destroy === 'function') {
        try { bgMusicState.player.destroy(); } catch {}
      }
      host.innerHTML = '<div id="ytMusicInner"></div>';
      bgMusicState.ready = false;
      bgMusicState.currentSig = targetSig;
      const pVars = {
        autoplay: 1,
        mute: 1,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        loop: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin
      };
      if (playlistId && !videoId) {
        pVars.listType = 'playlist';
        pVars.list = playlistId;
      } else if (videoId) {
        pVars.playlist = playlistId || videoId;
      }
      bgMusicState.player = new window.YT.Player('ytMusicInner', {
        height: '118',
        width: '210',
        videoId: videoId || undefined,
        playerVars: pVars,
        events: {
          onReady: (e) => {
            bgMusicState.ready = true;
            // Always start muted first so Chrome/iOS/Android autoplay cleanly; gesture unlocks sound reliably
            try { e.target.mute(); } catch {}
            if (!bgMusicState.userOff && appState.settings?.bgMusicEnabled !== false) {
              try { e.target.playVideo(); } catch {}
            }
            updateMusicButtonUI();
          },
          onStateChange: (e) => {
            const shouldPlay = !bgMusicState.userOff && appState.settings?.bgMusicEnabled !== false;
            if (!shouldPlay) return;
            if (e.data === window.YT.PlayerState.ENDED || e.data === window.YT.PlayerState.PAUSED) {
              try {
                if (e.data === window.YT.PlayerState.ENDED) e.target.seekTo(0, true);
                e.target.playVideo();
              } catch {}
            }
          },
          onError: () => {
            showToast('YouTube blocked embed for this song link; try another YouTube song link.');
          }
        }
      });
    });
  }

  function applyBgMusicPlayState(fromUserGesture = false) {
    const s = appState.settings || {};
    const urlStr = String(s.bgMusicUrl || '');
    const isDirectAudio = /\.(mp3|m4a|ogg|wav|aac)(\?|$)/i.test(urlStr);
    const hasYt = Boolean(s.bgMusicVideoId || s.bgMusicPlaylistId || clientExtractYtId(urlStr) || clientExtractYtList(urlStr));

    if ((!hasYt && !isDirectAudio) || s.bgMusicEnabled === false || bgMusicState.userOff) {
      if (bgMusicState.audioEl) { try { bgMusicState.audioEl.pause(); } catch {} }
      if (bgMusicState.player && typeof bgMusicState.player.pauseVideo === 'function') {
        try { bgMusicState.player.pauseVideo(); } catch {}
      }
      updateMusicButtonUI();
      return;
    }

    if (isDirectAudio && bgMusicState.audioEl) {
      try {
        bgMusicState.audioEl.volume = 0.55;
        bgMusicState.audioEl.play().then(() => {
          bgMusicState.audioUnmuted = true;
          updateMusicButtonUI();
        }).catch(() => {});
      } catch {}
      return;
    }

    const p = bgMusicState.player;
    if (p && bgMusicState.ready && typeof p.playVideo === 'function') {
      try {
        if (fromUserGesture) {
          p.unMute();
          p.setVolume(65);
          bgMusicState.audioUnmuted = true;
        } else if (bgMusicState.audioUnmuted) {
          p.unMute();
          p.setVolume(65);
        }
        p.playVideo();
      } catch {}
    }
    updateMusicButtonUI();
  }

  function syncBgMusicPlayer() {
    const s = appState.settings || {};
    const urlStr = String(s.bgMusicUrl || '').trim();
    const isDirectAudio = /\.(mp3|m4a|ogg|wav|aac)(\?|$)/i.test(urlStr);
    const vid = String(s.bgMusicVideoId || clientExtractYtId(urlStr) || '').trim();
    const pid = String(s.bgMusicPlaylistId || clientExtractYtList(urlStr) || '').trim();
    updateMusicButtonUI();
    if ((!vid && !pid && !isDirectAudio) || s.bgMusicEnabled === false) {
      if (bgMusicState.audioEl) { try { bgMusicState.audioEl.pause(); } catch {} }
      if (bgMusicState.player && typeof bgMusicState.player.pauseVideo === 'function') {
        try { bgMusicState.player.pauseVideo(); } catch {}
      }
      return;
    }
    if (isDirectAudio) {
      if (bgMusicState.player && typeof bgMusicState.player.pauseVideo === 'function') {
        try { bgMusicState.player.pauseVideo(); } catch {}
      }
      if (!bgMusicState.audioEl) {
        bgMusicState.audioEl = new Audio();
        bgMusicState.audioEl.loop = true;
      }
      if (bgMusicState.audioEl.src !== urlStr) bgMusicState.audioEl.src = urlStr;
      if (!bgMusicState.userOff) applyBgMusicPlayState(false);
      return;
    }
    createOrLoadYtPlayer(vid, pid);
  }

  // Background Music Heartbeat: keeps song continuously looping and never stalls
  setInterval(() => {
    const s = appState.settings || {};
    if (bgMusicState.userOff || s.bgMusicEnabled === false) return;
    const p = bgMusicState.player;
    if (p && bgMusicState.ready && typeof p.getPlayerState === 'function') {
      const st = p.getPlayerState();
      if (st === 0 || st === 2 || st === 5 || st === -1) {
        try {
          if (st === 0) p.seekTo(0, true);
          p.playVideo();
        } catch {}
      }
    }
  }, 3000);

  // ================= CONTINUOUS LOOPING WEBSITE BACKGROUND YOUTUBE VIDEO =================
  const bgVideoState = {
    player: null,
    ready: false,
    currentSig: ''
  };

  function syncBgVideoPlayer() {
    const wrap = $('siteBgVideoWrap');
    const host = $('siteBgVideoHost');
    const directVid = $('siteBgDirectVideo');
    if (!wrap || !host) return;
    const s = appState.settings || {};
    const urlStr = String(s.bgVideoUrl || '').trim();
    const isDirectMp4 = /\.(mp4|webm|mov)(\?|$)/i.test(urlStr);
    const vid = String(s.bgVideoVideoId || clientExtractYtId(urlStr) || '').trim();
    const pid = String(s.bgVideoPlaylistId || clientExtractYtList(urlStr) || '').trim();
    const enabled = s.bgVideoEnabled !== false && Boolean(vid || pid || isDirectMp4);

    if (!enabled) {
      bgVideoState.currentSig = '';
      if (bgVideoState.player && typeof bgVideoState.player.pauseVideo === 'function') {
        try { bgVideoState.player.pauseVideo(); } catch {}
      }
      if (directVid) {
        directVid.pause();
        directVid.removeAttribute('src');
        directVid.classList.add('hidden');
      }
      wrap.classList.add('hidden');
      document.body.classList.remove('has-bg-video');
      return;
    }

    wrap.classList.remove('hidden');
    document.body.classList.add('has-bg-video');

    if (isDirectMp4 && directVid) {
      if (bgVideoState.player && typeof bgVideoState.player.destroy === 'function') {
        try { bgVideoState.player.destroy(); } catch {}
        bgVideoState.player = null;
      }
      host.innerHTML = '';
      directVid.classList.remove('hidden');
      if (bgVideoState.currentSig !== urlStr) {
        bgVideoState.currentSig = urlStr;
        directVid.src = urlStr;
        directVid.muted = true;
        directVid.loop = true;
        directVid.play().catch(() => {});
      }
      return;
    }

    if (directVid) {
      directVid.pause();
      directVid.removeAttribute('src');
      directVid.classList.add('hidden');
    }

    const sig = `${vid}:${pid}`;
    if (bgVideoState.currentSig === sig && bgVideoState.player && bgVideoState.ready) {
      try {
        bgVideoState.player.mute();
        bgVideoState.player.playVideo();
      } catch {}
      return;
    }

    bgVideoState.currentSig = sig;
    ensureYtApiLoaded(() => {
      if (bgVideoState.currentSig !== sig) return;
      if (bgVideoState.player && bgVideoState.ready && typeof bgVideoState.player.loadVideoById === 'function' && vid) {
        try {
          bgVideoState.player.mute();
          bgVideoState.player.loadVideoById({ videoId: vid, startSeconds: 0 });
          bgVideoState.player.playVideo();
          return;
        } catch {}
      }
      if (bgVideoState.player && typeof bgVideoState.player.destroy === 'function') {
        try { bgVideoState.player.destroy(); } catch {}
      }
      host.innerHTML = '<div id="siteBgVideoInner"></div>';
      bgVideoState.ready = false;
      const pVars = {
        autoplay: 1,
        mute: 1,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        loop: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        iv_load_policy: 3,
        origin: window.location.origin
      };
      if (pid && !vid) {
        pVars.listType = 'playlist';
        pVars.list = pid;
      } else if (vid) {
        pVars.playlist = pid || vid;
      }
      bgVideoState.player = new window.YT.Player('siteBgVideoInner', {
        height: '720',
        width: '1280',
        videoId: vid || undefined,
        playerVars: pVars,
        events: {
          onReady: (e) => {
            bgVideoState.ready = true;
            try {
              e.target.mute();
              e.target.playVideo();
            } catch {}
          },
          onStateChange: (e) => {
            if (appState.settings?.bgVideoEnabled === false) return;
            if (e.data === window.YT.PlayerState.ENDED || e.data === window.YT.PlayerState.PAUSED) {
              try {
                if (e.data === window.YT.PlayerState.ENDED) e.target.seekTo(0, true);
                e.target.playVideo();
              } catch {}
            }
          },
          onError: () => {
            showToast('YouTube blocked embed on this background video link; try another YouTube link.');
          }
        }
      });
    });
  }

  // Watchdog to ensure website background video keeps looping infinitely
  setInterval(() => {
    const s = appState.settings || {};
    if (s.bgVideoEnabled === false || (!s.bgVideoVideoId && !s.bgVideoPlaylistId)) return;
    const p = bgVideoState.player;
    if (p && bgVideoState.ready && typeof p.getPlayerState === 'function') {
      const st = p.getPlayerState();
      if (st === 0 || st === 2 || st === 5 || st === -1) {
        try {
          if (st === 0) p.seekTo(0, true);
          p.mute();
          p.playVideo();
        } catch {}
      }
    }
  }, 3000);

  $('musicFloatBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!bgMusicState.userOff && !bgMusicState.audioUnmuted) {
      // Waiting for tap-to-unmute: unmute immediately instead of turning off!
      applyBgMusicPlayState(true);
      showToast('🎵 Song unmuted & playing!');
      return;
    }
    bgMusicState.userOff = !bgMusicState.userOff;
    localStorage.setItem('chatkaro_music_off', bgMusicState.userOff ? '1' : '0');
    applyBgMusicPlayState(!bgMusicState.userOff);
    showToast(bgMusicState.userOff ? '🔇 Background music off' : '🎵 Background music playing!');
  });

  // Unlock background music sound cleanly on ANY user tap until player actually unmutes
  ['pointerdown', 'touchstart', 'click', 'keydown'].forEach((evt) => {
    window.addEventListener(
      evt,
      () => {
        if (bgMusicState.userOff || appState.settings?.bgMusicEnabled === false) return;
        const s = appState.settings || {};
        if (!s.bgMusicUrl && !s.bgMusicVideoId && !s.bgMusicPlaylistId) return;
        if (bgMusicState.audioUnmuted) return;
        if (bgMusicState.player && bgMusicState.ready) {
          applyBgMusicPlayState(true);
        } else if (bgMusicState.audioEl) {
          applyBgMusicPlayState(true);
        }
      },
      { passive: true }
    );
  });

  // ================= GOOGLE / GMAIL LOGIN & PROFILE =================
  let gisInitializedFor = '';
  function initGoogleIdentityIfConfigured() {
    const cid = appState.settings.googleClientId;
    if (!cid || cid === gisInitializedFor || !window.google?.accounts?.id) return;
    gisInitializedFor = cid;
    try {
      window.google.accounts.id.initialize({
        client_id: cid,
        callback: async (response) => {
          const payload = JSON.parse(atob(response.credential.split('.')[1]));
          await performLogin({
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            credential: response.credential
          });
        }
      });
      const wrap = $('realGoogleBtnWrap');
      wrap.classList.remove('hidden');
      wrap.innerHTML = '';
      window.google.accounts.id.renderButton(wrap, { theme: 'filled_blue', size: 'large', shape: 'pill', text: 'continue_with' });
      if ($('googleClientDivider')) $('googleClientDivider').classList.remove('hidden');
    } catch {}
  }

  async function performLogin({ name, email, phone = '', picture = '', credential = '' }) {
    try {
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!credential && !/^[^\s@]+@(gmail|googlemail)\.com$/i.test(cleanEmail)) {
        return showToast('Please enter a valid @gmail.com email address.');
      }
      const res = await api('/api/auth/login', 'POST', { name, email: cleanEmail, phone, picture, credential });
      appState.user = res.customer;
      localStorage.setItem('chatkaro_user', JSON.stringify(appState.user));
      $('googleLoginModal').classList.add('hidden');
      renderAuthUI();
      renderCart();
      renderMyOrderBanner();
      showToast(`Welcome ${appState.user.name}! Signed in with Gmail.`);
      if (appState.pendingOrderAfterLogin) {
        appState.pendingOrderAfterLogin = false;
        openCart();
      }
    } catch (err) {
      showToast(err.message);
    }
  }

  function buildGmailInitialAvatar(name, color = '#dc2626') {
    const ch = String(name || 'G').trim().charAt(0).toUpperCase() || 'G';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="${color}"/><text x="32" y="42" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="800" fill="#ffffff">${ch}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function renderAuthUI() {
    const u = appState.user;
    const avImg = $('authHeaderAvatar');
    const avBadge = $('authHeaderBadge');
    if (u) {
      const tId = appState.activeTableId || u.tableId;
      const tBadge = tId ? ` • T${tId}` : '';
      $('authHeaderLabel').textContent = `${u.name.split(' ')[0]}${tBadge}`;
      if (avImg) {
        avImg.src = u.picture || buildGmailInitialAvatar(u.name, u.avatarColor || '#ea580c');
        avImg.classList.remove('hidden');
      }
      if (avBadge) avBadge.classList.add('hidden');
      $('cartAuthStatusLabel').textContent = `Signed in as ${u.name} (${u.email})`;
      $('chatIdentityBadge').textContent = `${u.name}${tId ? ' • Table ' + tId : ''}`;
    } else {
      $('authHeaderLabel').textContent = 'Sign in';
      if (avImg) avImg.classList.add('hidden');
      if (avBadge) avBadge.classList.remove('hidden');
      $('cartAuthStatusLabel').textContent = 'Gmail Sign-In required to order';
      $('chatIdentityBadge').textContent = 'Sign in to chat';
    }
  }

  $('authHeaderBtn').addEventListener('click', () => {
    if (!appState.user) $('googleLoginModal').classList.remove('hidden');
    else openProfileModal('profile');
  });
  $('closeGoogleLoginBtn').addEventListener('click', () => $('googleLoginModal').classList.add('hidden'));

  $('sendGmailOtpBtn')?.addEventListener('click', async () => {
    const name = $('gNameInput').value.trim();
    const email = $('gEmailInput').value.trim().toLowerCase();
    const phone = $('gPhoneInput').value.trim();
    if (!email || !/^[^\s@]+@(gmail|googlemail)\.com$/i.test(email)) {
      return showToast('Please enter a valid @gmail.com email first!');
    }
    const btn = $('sendGmailOtpBtn');
    btn.disabled = true;
    btn.textContent = 'Sending OTP...';
    try {
      const res = await api('/api/auth/send-otp', 'POST', { name, email, phone });
      $('otpVerifyBox')?.classList.remove('hidden');
      $('gOtpInput')?.focus();
      showToast(res.message || '📩 6-Digit OTP sent to your Gmail!');
    } catch (err) {
      showToast(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '📩 Resend OTP';
    }
  });

  $('verifyGmailOtpBtn')?.addEventListener('click', async () => {
    const email = $('gEmailInput').value.trim().toLowerCase();
    const otp = $('gOtpInput').value.trim();
    if (!otp) return showToast('Enter the 6-digit OTP code from your Gmail!');
    try {
      const res = await api('/api/auth/verify-otp', 'POST', { email, otp });
      appState.user = res.customer;
      localStorage.setItem('chatkaro_user', JSON.stringify(appState.user));
      $('googleLoginModal').classList.add('hidden');
      $('otpVerifyBox')?.classList.add('hidden');
      renderAuthUI();
      renderCart();
      renderMyOrderBanner();
      showToast(`✅ Gmail Verified! Welcome ${appState.user.name}`);
      if (appState.pendingOrderAfterLogin) {
        appState.pendingOrderAfterLogin = false;
        openCart();
      }
    } catch (err) {
      showToast(err.message);
    }
  });

  $('googleQuickForm').addEventListener('submit', (e) => {
    e.preventDefault();
    performLogin({ name: $('gNameInput').value.trim(), email: $('gEmailInput').value.trim(), phone: $('gPhoneInput').value.trim() });
  });

  function openProfileModal(defaultTab = 'profile') {
    if (!appState.user) return $('googleLoginModal').classList.remove('hidden');
    $('profName').value = appState.user.name || '';
    $('profPhone').value = appState.user.phone || '';
    $('profFavDish').value = appState.user.favoriteDish || '';
    $('profBio').value = appState.user.bio || '';
    $('profColor').value = appState.user.avatarColor || '#ea580c';
    switchProfileTab(defaultTab);
    renderMyOrdersList();
    $('profileModal').classList.remove('hidden');
  }
  function switchProfileTab(tab) {
    document.querySelectorAll('[data-ptab]').forEach((b) => b.classList.toggle('active', b.dataset.ptab === tab));
    $('profileTabContent').classList.toggle('hidden', tab !== 'profile');
    $('myOrdersTabContent').classList.toggle('hidden', tab !== 'orders');
  }
  document.querySelectorAll('[data-ptab]').forEach((b) => b.addEventListener('click', () => switchProfileTab(b.dataset.ptab)));
  $('closeProfileModalBtn').addEventListener('click', () => $('profileModal').classList.add('hidden'));

  $('profileUpdateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!appState.user) return;
    try {
      const res = await api('/api/profile', 'POST', {
        email: appState.user.email,
        name: $('profName').value.trim(),
        phone: $('profPhone').value.trim(),
        favoriteDish: $('profFavDish').value.trim(),
        bio: $('profBio').value.trim(),
        avatarColor: $('profColor').value
      });
      appState.user = res.customer;
      localStorage.setItem('chatkaro_user', JSON.stringify(appState.user));
      renderAuthUI();
      showToast('Profile updated & synced!');
    } catch (err) {
      showToast(err.message);
    }
  });
  $('logoutBtn').addEventListener('click', () => {
    appState.user = null;
    localStorage.removeItem('chatkaro_user');
    $('profileModal').classList.add('hidden');
    renderAuthUI();
    renderCart();
    renderMyOrderBanner();
    showToast('Signed out.');
  });

  // ================= MENU & CART =================
  function saveCart() {
    localStorage.setItem('chatkaro_cart', JSON.stringify(appState.cart));
  }
  function getCartItems() {
    return Object.entries(appState.cart)
      .map(([id, qty]) => {
        const item = appState.menu.find((m) => m.id === id && m.available !== false);
        return item && qty > 0 ? { ...item, qty } : null;
      })
      .filter(Boolean);
  }
  function updateQty(id, delta) {
    const dish = appState.menu.find((m) => m.id === id);
    if (delta > 0 && dish && dish.available === false) return showToast('Sorry, this dish is Sold Out.');
    const next = Math.max(0, (appState.cart[id] || 0) + delta);
    if (next === 0) delete appState.cart[id];
    else appState.cart[id] = next;
    saveCart();
    renderMenu();
    renderCart();
    if (delta > 0 && dish) showToast(`Added ${dish.name}`);
  }
  function getDiscountPercent(code) {
    if (code === 'CHATKARO20' && appState.unlockedCoupons.includes('CHATKARO20')) return 20;
    if (code === 'CHATKARO10' && appState.unlockedCoupons.includes('CHATKARO10')) return 10;
    if (code === 'WELCOME5') return 5;
    return 0;
  }
  function unlockCoupon(code) {
    if (!appState.unlockedCoupons.includes(code)) {
      appState.unlockedCoupons.push(code);
      localStorage.setItem('chatkaro_coupons', JSON.stringify(appState.unlockedCoupons));
      showToast(`🎉 Unlocked ${code}!`);
    }
    syncCouponUI();
  }
  function syncCouponUI() {
    ['CHATKARO10', 'CHATKARO20'].forEach((code) => {
      const unlocked = appState.unlockedCoupons.includes(code);
      const itemEl = document.querySelector(`.coupon-item[data-code="${code}"]`);
      const btnEl = document.querySelector(`.apply-coupon-btn[data-code="${code}"]`);
      if (itemEl && btnEl) {
        itemEl.classList.toggle('locked', !unlocked);
        itemEl.classList.toggle('unlocked', unlocked);
        btnEl.disabled = !unlocked;
        btnEl.textContent = unlocked ? 'Apply' : 'Locked';
      }
    });
  }

  const CATEGORY_FALLBACK_IMG = {
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

  function getDishImage(item) {
    if (!item || item.image === '__NONE__') return '';
    const raw = item.image || CATEGORY_FALLBACK_IMG[item.category] || 'assets/veg-kadai.jpg';
    return String(raw).startsWith('/assets/') ? raw.slice(1) : raw;
  }

  function compressImageFile(file, maxDim = 900) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('No file selected'));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Invalid image file'));
        img.onload = () => {
          const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.86));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const DEFAULT_SERVED_WITH = {
    'veg-prep': 'Onion-Lemon Salad, Green Mint Chutney & Achar',
    'kaju-prep': 'Kachumber Salad, Mint Chutney & Roasted Papad',
    'cheese-prep': 'Onion-Lemon Salad, Mint Chutney & Pickle',
    'tandoor': 'Green Mint Chutney, Laccha Onion Salad & Amul Butter',
    'south-indian': 'Piping Hot Sambar, Fresh Coconut Chutney & Red Chutney',
    'chinese': 'Spicy Schezwan Dip, Spring Onion & Vinegar Chillies',
    'punjabi': 'Vinegar Onion Salad, Mint Chutney & Roasted Papad',
    'fast-food': 'Tangy Green Chutney, Tomato Ketchup & Masala Seasoning',
    'beverages': 'Freshly Prepared Chilled / Warm Serving'
  };

  // ================= HERO LIVE VIDEO-AD DISH & CUSTOM MEDIA REEL ENGINE =================
  const heroAdState = {
    idx: 0,
    paused: false,
    muted: true,
    elapsed: 0,
    duration: 3600,
    timer: null,
    currentDishId: 'veg-angara',
    lastSrc: '',
    isCurrentVideo: false,
    shuffledIds: [],
    lastMotionIdx: -1,
    lastTransIdx: -1
  };
  const REEL_MOTIONS = ['ken-zoom-in', 'ken-pan-left', 'ken-pan-right', 'ken-zoom-out', 'ken-diag-tl', 'ken-diag-br'];
  const REEL_TRANSITIONS = ['trans-fade', 'trans-slide-right', 'trans-slide-left', 'trans-slide-up', 'trans-zoom-burst', 'trans-blur-focus', 'trans-tilt-flip', 'trans-wipe-curtain'];
  const CAT_LABELS = {
    'veg-prep': '🥘 VEG PREPARATION',
    'kaju-prep': '🥜 KAJU SPECIAL',
    'cheese-prep': '🧀 CHEESE SPECIAL',
    'tandoor': '🔥 TANDOOR & ROTI-NAAN',
    'south-indian': '🥞 SOUTH INDIAN DOSA',
    'chinese': '🥡 INDO-CHINESE',
    'punjabi': '🍛 PUNJABI SPECIAL',
    'fast-food': '🍔 FAST FOOD',
    'beverages': '🥤 DRINKS & SWEETS'
  };

  function pickDifferentIdx(len, lastIdx) {
    if (len <= 1) return 0;
    let next = Math.floor(Math.random() * len);
    if (next === lastIdx) next = (next + 1 + Math.floor(Math.random() * (len - 1))) % len;
    return next;
  }

  function shuffleIds(ids) {
    const arr = [...ids];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function getOrderedReelList() {
    const valid = appState.menu.filter((m) => m.available !== false && m.image !== '__NONE__');
    if (!valid.length) return [];
    const validMap = new Map(valid.map((m) => [m.id, m]));
    const needsInit = !heroAdState.shuffledIds.length || heroAdState.shuffledIds.some((id) => !validMap.has(id)) || heroAdState.shuffledIds.length !== valid.length;
    if (needsInit) {
      heroAdState.shuffledIds = shuffleIds(valid.map((m) => m.id));
    }
    const dishes = heroAdState.shuffledIds.map((id) => validMap.get(id)).filter(Boolean);

    const activeCustomAds = (appState.ads || []).filter((a) => a.active !== false && a.url);
    const customList = activeCustomAds.length
      ? activeCustomAds
      : [
          { id: 'ad-insta-1', title: 'Chatkaro Live Kitchen Reel #1', type: 'video', url: 'assets/ads/reel-1.mp4', linkedDishId: 'veg-angara' },
          { id: 'ad-insta-2', title: 'Chatkaro Special Dish Reel #2', type: 'video', url: 'assets/ads/reel-2.mp4', linkedDishId: 'cheese-anguri' }
        ];

    // Interleave downloaded Video Ads & Admin Photo/Video Ads naturally between Dish Ads
    const mixed = [];
    let adCursor = 0;
    dishes.forEach((d, i) => {
      if (i === 1 || (i > 1 && (i - 1) % 5 === 0)) {
        const customAd = customList[adCursor % customList.length];
        mixed.push({ kind: 'ad', ad: customAd });
        adCursor += 1;
      }
      mixed.push({ kind: 'dish', dish: d });
    });
    return mixed;
  }

  function advanceHeroAdSlide(step = 1) {
    heroAdState.elapsed = 0;
    heroAdState.idx += step;
    renderHeroAdSlide();
  }

  function renderHeroAdSlide() {
    const playlist = getOrderedReelList();
    const dishList = appState.menu.filter((m) => m.available !== false && m.image !== '__NONE__');
    if (!playlist.length || !$('heroAdStage')) return;
    if (heroAdState.idx >= playlist.length) {
      heroAdState.shuffledIds = shuffleIds(dishList.map((m) => m.id));
      heroAdState.idx = 0;
    }
    heroAdState.idx = ((heroAdState.idx % playlist.length) + playlist.length) % playlist.length;
    const entry = playlist[heroAdState.idx];

    const stage = $('heroAdStage');
    const imgEl = $('heroAdImg');
    const prevEl = $('heroAdImgPrev');
    const wrapEl = $('heroAdMediaWrap');
    const videoEl = $('heroAdVideo');
    const ytEl = $('heroAdYtFrame');
    const muteBtn = $('heroAdMuteBtn');

    if (entry.kind === 'ad' && (entry.ad.type === 'video' || entry.ad.type === 'youtube')) {
      const ad = entry.ad;
      const linked = dishList.find((d) => d.id === ad.linkedDishId) || dishList[0];
      heroAdState.isCurrentVideo = true;
      heroAdState.currentDishId = linked?.id || 'veg-angara';
      heroAdState.duration = 45000;

      stage.classList.add('is-video');
      if (wrapEl) wrapEl.classList.add('hidden');
      if (prevEl) prevEl.classList.add('hidden');

      const ytId = ad.youtubeId || clientExtractYtId(ad.url);
      if (ad.type === 'youtube' || ytId) {
        if (videoEl) { videoEl.pause(); videoEl.removeAttribute('src'); videoEl.classList.add('hidden'); }
        if (muteBtn) muteBtn.classList.add('hidden');
        if (ytEl && ytId) {
          const nextSrc = `https://www.youtube.com/embed/${encodeURIComponent(ytId)}?autoplay=1&mute=1&loop=1&playlist=${encodeURIComponent(ytId)}&controls=0&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
          if (ytEl.src !== nextSrc) ytEl.src = nextSrc;
          ytEl.classList.remove('hidden');
        }
        heroAdState.duration = 25000;
      } else {
        if (ytEl) { ytEl.removeAttribute('src'); ytEl.classList.add('hidden'); }
        if (muteBtn) muteBtn.classList.add('hidden');
        if (videoEl) {
          videoEl.classList.remove('hidden');
          videoEl.muted = true;
          videoEl.volume = 0;
          videoEl.loop = false;
          videoEl.src = ad.url;
          videoEl.currentTime = 0;
          videoEl.onloadedmetadata = () => {
            videoEl.muted = true;
            videoEl.volume = 0;
            if (videoEl.duration && isFinite(videoEl.duration)) {
              heroAdState.duration = Math.min(60000, Math.max(3000, Math.round(videoEl.duration * 1000)));
            }
          };
          videoEl.onended = () => advanceHeroAdSlide(1);
          videoEl.onerror = () => advanceHeroAdSlide(1);
          if (!heroAdState.paused) {
            videoEl.play().catch(() => {});
          }
        }
      }

      if ($('heroAdCat')) $('heroAdCat').textContent = '🎬 VIDEO REEL AD';
      if ($('heroAdCounter')) $('heroAdCounter').textContent = `${heroAdState.idx + 1} / ${playlist.length}`;
      if ($('heroAdTitle')) $('heroAdTitle').textContent = ad.title || 'Chatkaro Live Kitchen Video';
      if ($('heroAdServed')) $('heroAdServed').textContent = linked ? `🍲 Featured: ${linked.name} (₹${linked.price})` : '🔥 100% Pure Veg Kitchen';
      if ($('heroAdPrice')) $('heroAdPrice').textContent = linked ? `₹${linked.price}/-` : 'LIVE AD';
    } else {
      heroAdState.isCurrentVideo = false;
      if (ytEl) { ytEl.removeAttribute('src'); ytEl.classList.add('hidden'); }
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.classList.add('hidden');
      }
      if (muteBtn) muteBtn.classList.add('hidden');
      stage.classList.remove('is-video');
      if (wrapEl) wrapEl.classList.remove('hidden');
      if (prevEl) prevEl.classList.remove('hidden');

      const isCustomImgAd = entry.kind === 'ad';
      const dish = isCustomImgAd ? (dishList.find((d) => d.id === entry.ad.linkedDishId) || dishList[0]) : entry.dish;
      heroAdState.currentDishId = dish?.id || 'veg-angara';
      heroAdState.duration = 3400 + Math.floor(Math.random() * 1100);

      const nextSrc = isCustomImgAd ? entry.ad.url : (getDishImage(dish) || 'assets/veg-angara.jpg');
      if (prevEl && heroAdState.lastSrc && heroAdState.lastSrc !== nextSrc) {
        prevEl.src = heroAdState.lastSrc;
      }

      const mIdx = pickDifferentIdx(REEL_MOTIONS.length, heroAdState.lastMotionIdx);
      const tIdx = pickDifferentIdx(REEL_TRANSITIONS.length, heroAdState.lastTransIdx);
      heroAdState.lastMotionIdx = mIdx;
      heroAdState.lastTransIdx = tIdx;

      const motionClass = REEL_MOTIONS[mIdx];
      const transClass = REEL_TRANSITIONS[tIdx];

      if (wrapEl) {
        wrapEl.classList.remove(...REEL_TRANSITIONS);
        void wrapEl.offsetWidth;
        wrapEl.classList.add(transClass);
      }
      imgEl.classList.remove(...REEL_MOTIONS, 'ken-burns');
      void imgEl.offsetWidth;
      imgEl.src = nextSrc;
      imgEl.alt = isCustomImgAd ? entry.ad.title : dish.name;
      imgEl.onerror = () => { imgEl.src = 'assets/veg-angara.jpg'; };
      imgEl.classList.add(motionClass);
      heroAdState.lastSrc = nextSrc;

      const isDailyPick = !isCustomImgAd && (appState.dailyAiAd?.featuredIds || []).includes(dish.id);
      if ($('heroAdCat')) {
        $('heroAdCat').textContent = isCustomImgAd
          ? '📸 SPECIAL PHOTO AD'
          : isDailyPick
          ? `🤖 TODAY AI AD • ${CAT_LABELS[dish.category] || 'PURE VEG'}`
          : (CAT_LABELS[dish.category] || '🍲 PURE VEG');
      }
      if ($('heroAdCounter')) $('heroAdCounter').textContent = `${heroAdState.idx + 1} / ${playlist.length}`;
      if ($('heroAdTitle')) $('heroAdTitle').textContent = isCustomImgAd ? entry.ad.title : (dish.guName ? `${dish.name} (${dish.guName})` : dish.name);
      if ($('heroAdServed')) {
        $('heroAdServed').textContent = isCustomImgAd
          ? (dish ? `🍲 Special: ${dish.name} (₹${dish.price})` : '🔥 100% Pure Veg')
          : `🎁 ${dish.servedWith || DEFAULT_SERVED_WITH[dish.category] || 'Fresh Chutney & Salad'}`;
      }
      if ($('heroAdPrice')) $('heroAdPrice').textContent = dish ? `₹${dish.price}/-` : 'SPECIAL';
    }

    // Preload next 2 image slides for seamless transitions
    [1, 2].forEach((offset) => {
      const nextItem = playlist[(heroAdState.idx + offset) % playlist.length];
      if (nextItem?.kind === 'dish') {
        const u = getDishImage(nextItem.dish);
        if (u) { const pre = new Image(); pre.src = u; }
      } else if (nextItem?.kind === 'ad' && nextItem.ad.type === 'image') {
        const pre = new Image();
        pre.src = nextItem.ad.url;
      }
    });

    const miniWrap = $('heroMiniReelList');
    if (miniWrap && dishList.length >= 3) {
      const baseDishIdx = Math.max(0, dishList.findIndex((d) => d.id === heroAdState.currentDishId));
      const nextThree = [1, 2, 3].map((offset) => dishList[(baseDishIdx + offset) % dishList.length]);
      miniWrap.innerHTML = nextThree
        .map(
          (d) => `
        <div class="mini-dish" data-quick-add="${escapeHtml(d.id)}">
          <span>${escapeHtml(d.emoji)} ${escapeHtml(d.name)}${d.guName ? ' (' + escapeHtml(d.guName) + ')' : ''}</span>
          <strong>₹${d.price} <button type="button" class="mini-add-btn">+ Add</button></strong>
        </div>`
        )
        .join('');
    }
  }

  function refreshHeroAdReel() {
    renderHeroAdSlide();
  }

  function initHeroAdReel() {
    if (!$('heroAdStage')) return;
    if (heroAdState.timer) clearInterval(heroAdState.timer);
    heroAdState.timer = setInterval(() => {
      if (heroAdState.paused) return;
      const videoEl = $('heroAdVideo');
      if (heroAdState.isCurrentVideo && videoEl && videoEl.duration && isFinite(videoEl.duration)) {
        const pct = Math.min(100, (videoEl.currentTime / videoEl.duration) * 100);
        if ($('heroAdProgress')) $('heroAdProgress').style.width = `${pct}%`;
        return;
      }
      heroAdState.elapsed += 50;
      const pct = Math.min(100, (heroAdState.elapsed / heroAdState.duration) * 100);
      if ($('heroAdProgress')) $('heroAdProgress').style.width = `${pct}%`;
      if (heroAdState.elapsed >= heroAdState.duration) {
        advanceHeroAdSlide(1);
      }
    }, 50);

    // Force ALL Hero Ad videos permanently silent so their audio never overlaps shop music
    const vGuard = $('heroAdVideo');
    if (vGuard) {
      vGuard.muted = true;
      vGuard.volume = 0;
      vGuard.addEventListener('volumechange', () => {
        if (!vGuard.muted || vGuard.volume !== 0) {
          vGuard.muted = true;
          vGuard.volume = 0;
        }
      });
    }
    heroAdState.muted = true;
  }

  function getDishPricing(item) {
    const price = Math.max(1, Number(item?.price || 0));
    const pct = Math.min(80, Math.max(0, Number(item?.discountPct ?? (item?.bestseller ? 15 : 10))));
    const mrp = pct > 0 ? Math.max(price + 5, Math.round(price / (1 - pct / 100))) : price;
    const save = Math.max(0, mrp - price);
    return { price, pct, mrp, save };
  }

  let activeDetailDishId = null;
  let detailModalQty = 1;

  function openDishDetailModal(dishId) {
    const dish = appState.menu.find((m) => m.id === dishId);
    if (!dish) return;
    activeDetailDishId = dish.id;
    detailModalQty = 1;
    const { price, pct, mrp, save } = getDishPricing(dish);
    const dishImg = getDishImage(dish) || 'assets/veg-kadai.jpg';
    const servedWith = dish.servedWith || DEFAULT_SERVED_WITH[dish.category] || 'Fresh Chutney & Salad';
    const portion = dish.portion || (dish.category === 'beverages' ? '1 Glass / 2 Pcs' : 'Full Portion');

    if ($('ddImg')) $('ddImg').src = dishImg;
    if ($('ddImgDiscBadge')) {
      if (pct > 0) {
        $('ddImgDiscBadge').textContent = `${pct}% OFF`;
        $('ddImgDiscBadge').classList.remove('hidden');
      } else {
        $('ddImgDiscBadge').classList.add('hidden');
      }
    }
    if ($('ddBadges')) {
      $('ddBadges').innerHTML = `
        <span class="dish-tag veg">🥬 100% Pure Veg</span>
        ${dish.bestseller ? '<span class="dish-tag">⭐ Bestseller</span>' : ''}
        ${dish.spicy ? '<span class="dish-tag spicy">🌶️ Spicy</span>' : ''}
        ${dish.available === false ? '<span class="dish-tag spicy">Sold Out</span>' : ''}`;
    }
    if ($('ddTitle')) $('ddTitle').textContent = `${dish.emoji || '🍲'} ${dish.name}`;
    if ($('ddGuName')) $('ddGuName').textContent = dish.guName || '';
    if ($('ddPortion')) $('ddPortion').textContent = `🍽️ ${portion}`;
    if ($('ddDiscBadge')) $('ddDiscBadge').textContent = pct > 0 ? `-${pct}%` : 'FRESH';
    if ($('ddPrice')) $('ddPrice').textContent = `₹${price}`;
    if ($('ddMrp')) $('ddMrp').textContent = `₹${mrp}`;
    if ($('ddSaveText')) $('ddSaveText').textContent = save > 0 ? `You Save ₹${save}` : 'Kitchen Direct Price';
    if ($('ddServedBox')) $('ddServedBox').innerHTML = `<strong>🎁 Saath Mein Milega:</strong> ${escapeHtml(servedWith)}`;
    if ($('ddDesc')) $('ddDesc').textContent = dish.desc || 'Freshly prepared to order in our 100% Pure Veg Talala Kitchen.';
    if ($('ddQtyVal')) $('ddQtyVal').textContent = String(detailModalQty);

    const addBtn = $('ddAddCartBtn');
    const buyBtn = $('ddBuyNowBtn');
    const soldOut = dish.available === false;
    if (addBtn) addBtn.disabled = soldOut;
    if (buyBtn) buyBtn.disabled = soldOut;

    const sameCat = appState.menu.filter((m) => m.id !== dish.id && m.category === dish.category && m.available !== false);
    const otherTop = appState.menu.filter((m) => m.id !== dish.id && m.category !== dish.category && m.available !== false && (m.bestseller || m.category === 'beverages' || m.category === 'tandoor'));
    const similar = [...sameCat.slice(0, 5), ...otherTop.slice(0, 4)].slice(0, 8);
    if ($('ddSimilarGrid')) {
      $('ddSimilarGrid').innerHTML = similar
        .map((s) => {
          const sp = getDishPricing(s);
          const simImg = getDishImage(s) || 'assets/veg-kadai.jpg';
          return `
            <div class="amazon-sim-card" data-sim-id="${escapeHtml(s.id)}">
              <div class="amazon-sim-img-wrap">
                <img src="${escapeHtml(simImg)}" alt="${escapeHtml(s.name)}" loading="lazy" />
                ${sp.pct > 0 ? `<span class="amazon-sim-disc">${sp.pct}% OFF</span>` : ''}
              </div>
              <div class="amazon-sim-body">
                <strong>${escapeHtml(s.name)}</strong>
                <div class="amazon-sim-price-row">
                  <span>₹${sp.price}</span>
                  ${sp.pct > 0 ? `<s>₹${sp.mrp}</s>` : ''}
                </div>
                <button type="button" class="btn btn-primary btn-xs amazon-sim-add" data-sim-add="${escapeHtml(s.id)}">+ Add</button>
              </div>
            </div>`;
        })
        .join('');
    }

    $('dishDetailModal')?.classList.remove('hidden');
  }

  function renderMenu() {
    const q = appState.search.trim().toLowerCase();
    const filtered = appState.menu.filter((item) => {
      if (appState.category !== 'all' && item.category !== appState.category) return false;
      if (appState.filter === 'bestseller' && !item.bestseller) return false;
      if (appState.filter === 'under100' && item.price > 100) return false;
      if (appState.filter === 'spicy' && !item.spicy) return false;
      if (q && !`${item.name} ${item.guName || ''} ${item.desc} ${item.servedWith || ''} ${item.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
    $('menuCount').textContent = `Showing ${filtered.length} pure veg dishes`;
    const grid = $('menuGrid');
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="cart-empty" style="grid-column:1/-1;"><h3>No dishes found</h3></div>`;
      return;
    }
    grid.innerHTML = filtered
      .map((item, idx) => {
        const qty = appState.cart[item.id] || 0;
        const soldOut = item.available === false;
        const dishImg = getDishImage(item);
        const { price, pct, mrp } = getDishPricing(item);
        const servedWith = item.servedWith || DEFAULT_SERVED_WITH[item.category] || 'Fresh Chutney & Salad';
        const portion = item.portion || (item.category === 'beverages' ? '1 Glass / 2 Pcs' : 'Full Portion');
        const actionHtml = soldOut
          ? `<span class="dish-tag spicy">Sold Out</span>`
          : qty > 0
          ? `<div class="qty-control">
               <button type="button" data-action="dec" data-id="${item.id}">−</button>
               <span>${qty}</span>
               <button type="button" data-action="inc" data-id="${item.id}">+</button>
             </div>`
          : `<button type="button" class="btn btn-primary btn-sm menu-order-btn" data-action="inc" data-id="${item.id}">+ Order Now</button>`;

        const mediaHtml = dishImg
          ? `<img class="dish-photo-img" src="${escapeHtml(dishImg)}" alt="${escapeHtml(item.name)}" loading="${idx < 14 ? 'eager' : 'lazy'}" decoding="async" onerror="if(!this.dataset.r){this.dataset.r='1';const u=this.src;setTimeout(()=>{this.src=u+(u.includes('?')?'&':'?')+'t=1';},700);}else{this.onerror=null;this.src='assets/veg-kadai.jpg';}" />`
          : `<div class="dish-no-photo-placeholder" aria-label="No dish photo"><span>${escapeHtml(item.emoji)}</span><small>100% Pure Veg</small></div>`;

        return `
          <article class="menu-card ${soldOut ? 'sold-out' : ''}" data-dish-id="${escapeHtml(item.id)}">
            <div class="dish-photo-wrap">
              ${mediaHtml}
              <div class="dish-photo-overlay"></div>
              <div class="dish-photo-top-badges">
                <div class="dish-photo-badges-left">
                  ${pct > 0 ? `<span class="dish-disc-pill">${pct}% OFF</span>` : ''}
                  ${item.bestseller ? '<span class="dish-tag">⭐ Best</span>' : ''}
                  ${item.spicy ? '<span class="dish-tag spicy">🌶️ Spicy</span>' : ''}
                </div>
                <span class="veg-square" title="100% Pure Veg"></span>
              </div>
              ${item.guName ? `<span class="dish-gu-badge">${escapeHtml(item.guName)}</span>` : ''}
              <span class="dish-photo-price">₹${price}/-</span>
            </div>
            <div class="menu-card-body">
              <div>
                <div class="menu-card-top">
                  <div>
                    <div class="dish-title-row">
                      <h3>${escapeHtml(item.name)}</h3>
                    </div>
                    <span class="dish-portion-pill">🍽️ ${escapeHtml(portion)}</span>
                  </div>
                  <span class="dish-emoji">${escapeHtml(item.emoji)}</span>
                </div>
                <p class="dish-desc">${escapeHtml(item.desc)}</p>
                <div class="dish-served-box">
                  <strong>🎁 Saath Mein Milega:</strong> ${escapeHtml(servedWith)}
                </div>
              </div>
              <div class="menu-card-bottom">
                <div class="dish-mrp-row">
                  <span class="dish-price">₹${price}</span>
                  ${pct > 0 ? `<s class="dish-mrp-cut">₹${mrp}</s>` : '<small class="muted" style="font-size:0.72rem;">Pure Veg</small>'}
                </div>
                ${actionHtml}
              </div>
            </div>
          </article>`;
      })
      .join('');
  }

  function renderCart() {
    const items = getCartItems();
    const totalCount = items.reduce((s, i) => s + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    $('headerCartCount').textContent = totalCount;
    if ($('mobileNavCartCount')) $('mobileNavCartCount').textContent = totalCount;

    if (totalCount > 0) {
      $('floatingCartBar').classList.remove('hidden');
      $('floatCartSummary').textContent = `${totalCount} items • ₹${subtotal}`;
    } else {
      $('floatingCartBar').classList.add('hidden');
    }

    if (items.length === 0) {
      $('cartDrawerBody').innerHTML = `<div class="cart-empty"><h3>Your plate is empty!</h3><p>Add Dosas, Punjabi or Chinese dishes from the menu.</p></div>`;
      $('cartDrawerFooter').innerHTML = '';
      return;
    }

    $('cartDrawerBody').innerHTML = items
      .map(
        (item) => `
      <div class="cart-item-row">
        <div>
          <strong>${escapeHtml(item.emoji)} ${escapeHtml(item.name)}</strong>
          <small class="muted">₹${item.price} × ${item.qty} = ₹${item.price * item.qty}</small>
        </div>
        <div class="qty-control">
          <button type="button" data-cart-action="dec" data-id="${item.id}">−</button>
          <span>${item.qty}</span>
          <button type="button" data-cart-action="inc" data-id="${item.id}">+</button>
        </div>
      </div>`
      )
      .join('');

    const discountPct = getDiscountPercent(appState.promoCode);
    const mrpSavings = items.reduce((s, i) => s + getDishPricing(i).save * i.qty, 0);
    const discountAmt = Math.round((subtotal * discountPct) / 100);
    const deliveryFee = appState.orderType === 'delivery' && subtotal < 250 ? 20 : 0;
    const grandTotal = Math.max(0, subtotal - discountAmt + deliveryFee);

    const activeTid = appState.activeTableId || appState.user?.tableId || null;
    const tableOptions = appState.tables
      .map((t) => `<option value="${t.id}" ${activeTid === t.id ? 'selected' : ''}>${escapeHtml(t.label)} (${t.status})</option>`)
      .join('');

    $('cartDrawerFooter').innerHTML = `
      <div class="order-type-pills">
        <button type="button" class="order-mode-btn ${appState.orderType === 'dine-in' ? 'active' : ''}" data-mode="dine-in">🍽️ Dine-In</button>
        <button type="button" class="order-mode-btn ${appState.orderType === 'parcel' ? 'active' : ''}" data-mode="parcel">📦 Parcel</button>
        <button type="button" class="order-mode-btn ${appState.orderType === 'delivery' ? 'active' : ''}" data-mode="delivery">🛵 Delivery</button>
      </div>
      <div class="checkout-inputs">
        ${appState.orderType === 'dine-in' ? `<select id="custTableSelect"><option value="">Select Table (Optional)</option>${tableOptions}</select>` : ''}
        <input type="tel" id="custPhone" placeholder="Mobile / WhatsApp *" value="${escapeHtml(appState.user?.phone || '')}" />
        <input type="text" id="custDetail" placeholder="${appState.orderType === 'delivery' ? 'Delivery Address in Talala *' : 'Cooking notes (e.g. Less spicy)'}" />
      </div>
      <div class="promo-row">
        <input type="text" id="promoInput" placeholder="Promo (WELCOME5 / CHATKARO10)" value="${escapeHtml(appState.promoCode)}" />
        <button type="button" class="btn btn-outline btn-sm" id="applyPromoBtn">Apply</button>
      </div>
      <div class="payment-method-pills" aria-label="Payment Gateway">
        <button type="button" class="pay-opt-btn ${appState.paymentMethod === 'razorpay' ? 'active' : ''}" data-pay="razorpay">💳 Razorpay</button>
        <button type="button" class="pay-opt-btn ${appState.paymentMethod === 'phonepe' ? 'active' : ''}" data-pay="phonepe">📱 PhonePe</button>
        <button type="button" class="pay-opt-btn ${appState.paymentMethod === 'upi-qr' ? 'active' : ''}" data-pay="upi-qr">📷 UPI QR</button>
        <button type="button" class="pay-opt-btn ${appState.paymentMethod === 'cod' ? 'active' : ''}" data-pay="cod">💵 Counter/COD</button>
      </div>
      <div class="bill-lines">
        <div class="bill-line"><span>Subtotal</span><span>₹${subtotal}</span></div>
        ${mrpSavings > 0 ? `<div class="bill-line discount"><span>🏷️ Menu MRP Discount Saved</span><span>−₹${mrpSavings}</span></div>` : ''}
        ${discountAmt > 0 ? `<div class="bill-line discount"><span>Promo (${appState.promoCode} ${discountPct}%)</span><span>−₹${discountAmt}</span></div>` : ''}
        ${deliveryFee > 0 ? `<div class="bill-line"><span>Delivery Fee (Free ₹250+)</span><span>₹${deliveryFee}</span></div>` : ''}
        <div class="bill-line total"><span>Total Payable</span><span>₹${grandTotal}</span></div>
      </div>
      <button type="button" class="btn ${appState.paymentMethod === 'phonepe' ? 'btn-phonepe' : 'btn-primary'} glow-btn" style="width:100%;" id="placeOrderBtn">
        ${!appState.user
          ? 'Sign in with Gmail to Order →'
          : appState.paymentMethod === 'razorpay'
          ? `Pay via Razorpay • ₹${grandTotal} →`
          : appState.paymentMethod === 'phonepe'
          ? `Pay via PhonePe • ₹${grandTotal} →`
          : appState.paymentMethod === 'upi-qr'
          ? `Show UPI QR & Pay • ₹${grandTotal} →`
          : `Order & Send to WhatsApp • ₹${grandTotal} →`}
      </button>`;
  }

  function openCart() {
    $('cartBackdrop').classList.remove('hidden');
    $('cartDrawer').classList.remove('hidden');
  }
  function closeCart() {
    $('cartBackdrop').classList.add('hidden');
    $('cartDrawer').classList.add('hidden');
  }

  function completeOrderUI(order) {
    appState.cart = {};
    saveCart();
    renderMenu();
    renderCart();
    closeCart();
    launchConfetti();
    showOrderConfirmationModal(order);
  }

  async function placeOrder() {
    if (!appState.user) {
      appState.pendingOrderAfterLogin = true;
      closeCart();
      $('googleLoginModal').classList.remove('hidden');
      return showToast('Sign in with Gmail before placing an order.');
    }
    const phone = ($('custPhone')?.value || appState.user.phone || '').trim();
    const detail = ($('custDetail')?.value || '').trim();
    const tableId = appState.orderType === 'dine-in' && $('custTableSelect')?.value ? Number($('custTableSelect').value) : null;
    if (!phone) {
      showToast('Please enter your mobile number.');
      return $('custPhone')?.focus();
    }

    const items = getCartItems();
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const discountPct = getDiscountPercent(appState.promoCode);
    const discountAmt = Math.round((subtotal * discountPct) / 100);
    const deliveryFee = appState.orderType === 'delivery' && subtotal < 250 ? 20 : 0;
    const orderPayload = {
      customerName: appState.user.name,
      customerEmail: appState.user.email,
      customerPhone: phone,
      orderType: appState.orderType,
      tableId,
      detail,
      items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      discountAmt,
      deliveryFee,
      promoCode: appState.promoCode,
      etaMinutes: 18
    };

    try {
      // 1. Razorpay Gateway Flow
      if (appState.paymentMethod === 'razorpay') {
        const rzpOrder = await api('/api/payments/razorpay/create-order', 'POST', orderPayload);
        if (!window.Razorpay) throw new Error('Razorpay SDK failed to load. Check internet connection.');
        const rzp = new window.Razorpay({
          key: rzpOrder.keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || 'INR',
          name: appState.settings.restaurantName || 'Chatkaro Food Hub',
          description: `Pure Veg Order (${appState.orderType.toUpperCase()})`,
          prefill: { name: appState.user.name, email: appState.user.email, contact: phone },
          theme: { color: appState.settings.brandTheme?.primary || '#f97316' },
          handler: async (response) => {
            try {
              const verified = await api('/api/payments/razorpay/verify', 'POST', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderPayload
              });
              showToast('Razorpay payment verified! ✅');
              completeOrderUI(verified.order);
            } catch (err) {
              showToast(err.message);
            }
          }
        });
        rzp.on('payment.failed', (resp) => {
          showToast(resp?.error?.description || 'Razorpay payment failed.');
        });
        rzp.open();
        return;
      }

      // 2. PhonePe Gateway / Direct UPI QR Flow
      if (appState.paymentMethod === 'phonepe' || appState.paymentMethod === 'upi-qr') {
        const pp = await api('/api/payments/phonepe/initiate', 'POST', { orderPayload });
        if (appState.paymentMethod === 'phonepe' && pp.mode === 'gateway' && pp.redirectUrl) {
          window.location.href = pp.redirectUrl;
          return;
        }
        if (pp.upiUri || pp.mode === 'upi-qr') {
          appState.pendingPhonepeTxn = pp.merchantTransactionId;
          $('phonepeAmountLabel').textContent = `Total Payable: ₹${pp.amount}`;
          $('phonepeUpiText').textContent = pp.merchantUpiId;
          $('phonepeDeepLink').href = pp.phonepeUri || pp.upiUri;
          $('phonepeQrImg').src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pp.upiUri)}`;
          $('phonepeUtrInput').value = '';
          $('phonepeModal').classList.remove('hidden');
          return;
        }
      }

      // 3. Pay at Counter / Cash on Delivery
      const res = await api('/api/orders', 'POST', {
        ...orderPayload,
        paymentMethod: 'cod',
        paymentStatus: 'cod'
      });
      completeOrderUI(res.order);
    } catch (err) {
      showToast(err.message);
    }
  }

  function calcDistKm(lat1, lng1, lat2, lng2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function buildLiveDeliveryTrackerHtml(order, opts = {}) {
    const st = order.deliveryStage || 'placed';
    const s2 = ['picked_up', 'on_the_way', 'delivered'].includes(st);
    const s3 = ['on_the_way', 'delivered'].includes(st);
    const s4 = st === 'delivered' || order.status === 'served';
    const loc = order.driverLocation && Number.isFinite(Number(order.driverLocation.lat)) && Number.isFinite(Number(order.driverLocation.lng))
      ? {
          lat: Number(order.driverLocation.lat),
          lng: Number(order.driverLocation.lng),
          updatedAt: order.driverLocation.updatedAt
        }
      : null;
    const distKm = loc ? calcDistKm(21.057, 70.531, loc.lat, loc.lng).toFixed(2) : null;
    const updatedStr = loc?.updatedAt
      ? new Date(loc.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '';
    const mapHtml = loc
      ? `
        <div class="live-gps-wrap">
          <div class="live-gps-bar">
            <span>📡 <strong>Live Rider GPS</strong> • ${distKm} km from Talala Hub${updatedStr ? ` • ${updatedStr}` : ''}</span>
            <a href="https://maps.google.com/?q=${loc.lat},${loc.lng}" target="_blank" rel="noopener" class="btn btn-outline btn-xs">🗺️ Open Google Maps</a>
          </div>
          ${
            opts.compact
              ? ''
              : `<iframe class="live-gps-iframe" title="Live Rider Map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.openstreetmap.org/export/embed.html?bbox=${(loc.lng - 0.008).toFixed(5)}%2C${(loc.lat - 0.008).toFixed(5)}%2C${(loc.lng + 0.008).toFixed(5)}%2C${(loc.lat + 0.008).toFixed(5)}&layer=mapnik&marker=${loc.lat.toFixed(5)}%2C${loc.lng.toFixed(5)}"></iframe>`
          }
        </div>`
      : `<div class="small muted" style="margin-top:0.35rem;">📡 Waiting for Delivery Boy to start live GPS tracking...</div>`;

    const proofHtml = order.paymentProofImg
      ? `
        <div class="delivery-proof-box">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:0.4rem;flex-wrap:wrap;">
            <strong>📸 Doorstep Payment / Delivery Proof (SS)</strong>
            <a href="${escapeHtml(order.paymentProofImg)}" target="_blank" rel="noopener" class="btn btn-outline btn-xs">🔍 View Full SS</a>
          </div>
          <img src="${escapeHtml(order.paymentProofImg)}" alt="Payment Proof Screenshot" class="delivery-proof-thumb" />
        </div>`
      : '';

    const chats = (appState.deliveryChats || []).filter((c) => c.orderId === order.id).slice(-4);
    const chatHtml = opts.compact
      ? ''
      : `
        <div class="driver-chat-mini">
          <div class="small" style="font-weight:700;margin-bottom:0.25rem;">💬 Live Chat with Delivery Boy</div>
          <div class="driver-chat-msgs">
            ${
              chats.length
                ? chats.map((c) => `<div class="small"><strong>${escapeHtml(c.senderName || c.sender)}:</strong> ${escapeHtml(c.text)}</div>`).join('')
                : `<div class="small muted">Message rider about gate/landmark directions.</div>`
            }
          </div>
          <form class="cust-driver-chat-form" data-order-id="${escapeHtml(order.id)}" style="display:flex;gap:0.35rem;margin-top:0.35rem;">
            <input type="text" class="cust-driver-chat-inp" placeholder="Message rider..." required style="flex:1;min-width:0;padding:0.35rem 0.55rem;border-radius:8px;" />
            <button type="submit" class="btn btn-primary btn-xs">Send</button>
          </form>
        </div>`;

    return `
      <div class="amazon-track-card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;">
          <strong>🛵 Amazon-Style Live Delivery Tracking</strong>
          <span class="badge badge-veg">Delivery PIN: ${escapeHtml(order.deliveryOtp || '----')}</span>
        </div>
        <div class="amazon-track-steps">
          <div class="amazon-t-step done">1. Confirmed</div>
          <div class="amazon-t-step ${s2 ? 'done' : ''}">2. Picked Up</div>
          <div class="amazon-t-step ${s3 ? 'done' : ''}">3. On the Way</div>
          <div class="amazon-t-step ${s4 ? 'done' : ''}">4. Delivered</div>
        </div>
        <div class="small muted" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;">
          <span>${order.driverName ? `Delivery Partner: <strong>${escapeHtml(order.driverName)}</strong> ${order.driverPhone ? `(${escapeHtml(order.driverPhone)})` : ''}` : 'Kitchen packing — delivery partner assigning soon!'}</span>
          ${order.driverPhone ? `<a href="tel:${escapeHtml(order.driverPhone)}" class="btn btn-outline btn-xs">📞 Call Rider</a>` : ''}
        </div>
        ${mapHtml}
        ${proofHtml}
        ${chatHtml}
      </div>`;
  }

  function refreshOrderModalTracking(order) {
    const trackBox = $('orderAmazonTrackingBox');
    if (!trackBox || !order) return;
    if (order.orderType === 'delivery') {
      trackBox.classList.remove('hidden');
      trackBox.innerHTML = buildLiveDeliveryTrackerHtml(order);
    } else {
      trackBox.classList.add('hidden');
      trackBox.innerHTML = '';
    }
  }

  function showOrderConfirmationModal(order) {
    appState.activeTrackOrderId = order.id;
    const payLabel = order.paymentStatus === 'paid'
      ? `PAID via ${(order.paymentMethod || 'online').toUpperCase()}`
      : 'Pay at Counter / COD';
    const isPaid = order.paymentStatus === 'paid';
    const ownerName = String(appState.settings.ownerName || 'Het').trim() || 'Het';
    const ownerUpper = ownerName.toUpperCase().slice(0, 14);
    const dt = order.createdAt ? new Date(order.createdAt) : new Date();
    const dateStr = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const subtotalCalc = order.items.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 1), 0);
    const mrpSaved = order.items.reduce((s, i) => {
      const m = appState.menu.find((x) => x.id === i.id || x.name === i.name);
      return s + (m ? getDishPricing(m).save : Math.round(Number(i.price || 0) * 0.1)) * Number(i.qty || 1);
    }, 0);

    $('orderConfirmMeta').textContent = `Official Royal Bill #${order.id} • Owner: ${ownerName} • ${order.orderType.toUpperCase()}${order.tableId ? ' • Table ' + order.tableId : ''}`;
    $('modalLiveEta').dataset.endsAt = order.etaEndsAt || '';
    $('orderReceiptBox').innerHTML = `
      <div class="royal-bill-card">
        <div class="royal-bill-watermark">100% PURE VEG • ${escapeHtml(ownerUpper)}</div>
        <div class="royal-bill-header">
          <div class="royal-bill-emblem">👑</div>
          <h4>${escapeHtml(appState.settings.restaurantName || 'CHATKARO FOOD HUB')}</h4>
          <p>100% PURE VEGETARIAN ROYAL FAMILY RESTAURANT</p>
          <div class="royal-owner-pill">✨ Proprietor / Owner: ${escapeHtml(ownerName)}</div>
          <small>${escapeHtml(appState.settings.address || 'Beside Swaminarayan Mandir, Sasan Road, Talala')} • +91 ${(appState.settings.phone || '919054633908').replace(/^91/, '')}</small>
        </div>

        <div class="royal-bill-meta">
          <div><span>Invoice No:</span> <strong>#${escapeHtml(order.id)}</strong></div>
          <div><span>Date &amp; Time:</span> <strong>${dateStr}, ${timeStr}</strong></div>
          <div><span>Customer:</span> <strong>${escapeHtml(order.customerName)}</strong> (${escapeHtml(order.customerPhone)})</div>
          <div><span>Order Mode:</span> <strong>${escapeHtml(order.orderType.toUpperCase())}${order.tableId ? ' • Table ' + escapeHtml(order.tableId) : ''}</strong></div>
          <div><span>Payment:</span> <strong style="color:${isPaid ? '#15803d' : '#b45309'};">${escapeHtml(payLabel)}${order.paymentId ? ' • ' + escapeHtml(order.paymentId) : ''}</strong></div>
          <div><span>Owner:</span> <strong>${escapeHtml(ownerName)}</strong></div>
        </div>

        <table class="royal-bill-table">
          <thead>
            <tr>
              <th># Dish Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Rate</th>
              <th style="text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((i, idx) => `
              <tr>
                <td><span class="royal-veg-dot"></span> ${idx + 1}. ${escapeHtml(i.name)}</td>
                <td style="text-align:center;">${i.qty}</td>
                <td style="text-align:right;">₹${i.price}</td>
                <td style="text-align:right;"><strong>₹${i.price * i.qty}</strong></td>
              </tr>`).join('')}
          </tbody>
        </table>

        <div class="royal-bill-summary">
          <div class="bill-line"><span>Items Subtotal</span><span>₹${subtotalCalc}</span></div>
          ${mrpSaved > 0 ? `<div class="bill-line discount"><span>🏷️ Menu MRP Discount Saved</span><span>−₹${mrpSaved}</span></div>` : ''}
          ${order.discount > 0 ? `<div class="bill-line discount"><span>🎟️ Promo Discount</span><span>−₹${order.discount}</span></div>` : ''}
          ${order.deliveryFee > 0 ? `<div class="bill-line"><span>🛵 Delivery Charge</span><span>₹${order.deliveryFee}</span></div>` : ''}
          <div class="bill-line royal-grand-total"><span>GRAND TOTAL PAYABLE</span><span>₹${order.total}/-</span></div>
        </div>

        <div class="royal-bill-footer">
          <div class="royal-bill-thanks">
            <strong>🙏 Thank You for Dining With Us!</strong>
            <small>${escapeHtml(order.detail || 'Freshly cooked in pure veg kitchen')}</small>
            <small>FSSAI Hygienic Standard • Talala, Gujarat</small>
            <div class="royal-sign-box">
              <div class="royal-sign-script">${escapeHtml(ownerName)}</div>
              <small style="color:#78716c;font-weight:700;">Authorized Signatory • Owner (${escapeHtml(ownerName)})</small>
            </div>
          </div>
          <div class="mohar-stamp ${isPaid ? 'paid-stamp' : 'verified-stamp'}" aria-label="Official Restaurant Seal">
            <svg viewBox="0 0 120 120" width="102" height="102">
              <defs>
                <path id="moharTopArc" d="M 16,60 A 44,44 0 1,1 104,60" />
                <path id="moharBotArc" d="M 104,60 A 44,44 0 1,1 16,60" />
              </defs>
              <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="3" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 2" />
              <circle cx="60" cy="60" r="31" fill="none" stroke="currentColor" stroke-width="1.5" />
              <text font-size="7.8" font-weight="800" fill="currentColor" letter-spacing="1.1">
                <textPath href="#moharTopArc" startOffset="50%" text-anchor="middle">★ CHATKARO FOOD HUB ★</textPath>
              </text>
              <text font-size="6.9" font-weight="800" fill="currentColor" letter-spacing="0.9">
                <textPath href="#moharBotArc" startOffset="50%" text-anchor="middle">OWNER: ${escapeHtml(ownerUpper)} • TALALA</textPath>
              </text>
              <text x="60" y="56" text-anchor="middle" font-size="10.2" font-weight="900" fill="currentColor">${isPaid ? 'PAID ✓' : 'VERIFIED'}</text>
              <text x="60" y="69" text-anchor="middle" font-size="6.8" font-weight="800" fill="currentColor">100% PURE VEG</text>
            </svg>
          </div>
        </div>
      </div>`;

    const waPhone = appState.settings.phone || '919054633908';
    const waText = [
      `*Royal Official Bill — Chatkaro Food Hub (#${order.id})*`,
      `Owner: ${ownerName}`,
      `Customer: ${order.customerName} (${order.customerEmail || ''})`,
      `Phone: ${order.customerPhone}`,
      `Mode: ${order.orderType.toUpperCase()}${order.tableId ? ' | Table ' + order.tableId : ''}`,
      `Payment: ${payLabel}${order.paymentId ? ' | Ref: ' + order.paymentId : ''}`,
      order.detail ? `Notes: ${order.detail}` : '',
      `--- Items ---`,
      ...order.items.map((i) => `• ${i.qty}x ${i.name} = ₹${i.price * i.qty}`),
      `*Grand Total: ₹${order.total}/-*`
    ].filter(Boolean).join('\n');
    $('whatsappOrderLink').href = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;
    const custDigits = String(order.customerPhone || '').replace(/\D/g, '').slice(-10);
    if ($('whatsappCustomerBillLink')) {
      $('whatsappCustomerBillLink').href = `https://wa.me/${custDigits ? '91' + custDigits : waPhone}?text=${encodeURIComponent(waText)}`;
    }
    if ($('resendEmailBillBtn')) {
      $('resendEmailBillBtn').dataset.orderId = order.id;
      $('resendEmailBillBtn').textContent = order.billEmailSent ? '📧 Bill Emailed to Gmail ✓ (Resend)' : '📧 Send Royal Bill to My Gmail';
    }

    refreshOrderModalTracking(order);
    $('orderModal').classList.remove('hidden');
  }

  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('.cust-driver-chat-form');
    if (!form) return;
    e.preventDefault();
    const orderId = form.dataset.orderId;
    const inp = form.querySelector('.cust-driver-chat-inp');
    const text = (inp?.value || '').trim();
    if (!orderId || !text) return;
    const ord = appState.orders.find((o) => o.id === orderId);
    try {
      await api('/api/delivery/chat', 'POST', {
        orderId,
        sender: 'customer',
        senderName: appState.user?.name || ord?.customerName || 'Customer',
        text
      });
      if (inp) inp.value = '';
    } catch (err) {
      showToast(err.message);
    }
  });

  $('resendEmailBillBtn')?.addEventListener('click', async () => {
    const id = $('resendEmailBillBtn')?.dataset?.orderId;
    if (!id) return;
    try {
      await api(`/api/orders/${id}/resend-bill`, 'POST', {});
      showToast('📧 Official Royal Bill sent to your Gmail!');
      $('resendEmailBillBtn').textContent = '📧 Bill Emailed to Gmail ✓ (Resend)';
    } catch (err) {
      showToast(err.message);
    }
  });

  // ================= TABLES WITH PHOTOS, QR ORDERING & WAITER BELL =================
  function renderTableQrBanner() {
    const banner = $('menuTableQrBanner');
    if (!banner) return;
    const tid = appState.activeTableId;
    if (!tid) {
      banner.classList.add('hidden');
      return;
    }
    const tbl = appState.tables.find((t) => t.id === Number(tid));
    banner.classList.remove('hidden');
    if ($('menuTableQrText')) {
      $('menuTableQrText').textContent = `🪑 Ordering from ${tbl ? tbl.label : 'Table ' + tid}${tbl ? ` (${tbl.seats} Seats)` : ''}`;
    }
  }
  $('clearQrTableBtn')?.addEventListener('click', () => {
    appState.activeTableId = null;
    sessionStorage.removeItem('chatkaro_qr_table');
    renderTableQrBanner();
    renderAuthUI();
    renderCart();
  });

  function openTableQrModal(tableId) {
    const tbl = appState.tables.find((t) => t.id === Number(tableId));
    if (!tbl) return;
    const url = `${window.location.origin}${window.location.pathname}?table=${tbl.id}#menu`;
    if ($('tableQrPhoto')) $('tableQrPhoto').src = tbl.photo || 'assets/tables/table-4seat.jpg';
    if ($('tableQrHeading')) $('tableQrHeading').textContent = `${tbl.label} (${tbl.seats} Seats) — QR Menu`;
    if ($('tableQrImg')) $('tableQrImg').src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
    if ($('tableQrUrlText')) $('tableQrUrlText').textContent = url;
    if ($('useThisTableNowBtn')) $('useThisTableNowBtn').dataset.tid = String(tbl.id);
    $('tableQrModal')?.classList.remove('hidden');
  }
  $('closeTableQrBtn')?.addEventListener('click', () => $('tableQrModal')?.classList.add('hidden'));
  $('tableQrModal')?.addEventListener('click', (e) => {
    if (e.target === $('tableQrModal')) $('tableQrModal')?.classList.add('hidden');
  });
  $('useThisTableNowBtn')?.addEventListener('click', () => {
    const tid = Number($('useThisTableNowBtn').dataset.tid || 1);
    appState.activeTableId = tid;
    appState.orderType = 'dine-in';
    sessionStorage.setItem('chatkaro_qr_table', String(tid));
    $('tableQrModal')?.classList.add('hidden');
    renderTableQrBanner();
    renderWaiterServicePanel();
    renderAuthUI();
    renderCart();
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    showToast(`🪑 Table ${tid} selected! Every dish you add goes to Table ${tid}.`);
  });
  $('printTableQrBtn')?.addEventListener('click', () => window.print());

  function renderTables() {
    $('tablesGrid').innerHTML = appState.tables
      .map((t) => {
        const isMine = (appState.user && t.occupantEmail === appState.user.email) || appState.activeTableId === t.id;
        const avail = t.status === 'available';
        return `
        <div class="table-tile ${avail ? 'available' : 'occupied'}">
          <img class="table-photo-thumb" src="${escapeHtml(t.photo || 'assets/tables/table-4seat.jpg')}" alt="${escapeHtml(t.label)}" loading="lazy" />
          <div class="table-top">
            <span>${escapeHtml(t.label)} <small class="muted">(${t.seats}s)</small></span>
            <span class="table-status-pill ${avail ? 'avail' : 'occ'}">${avail ? 'Available' : 'Occupied'}</span>
          </div>
          <div class="table-body-info">
            ${avail ? 'Ready for dine-in guests' : `<strong>${escapeHtml(t.occupantName)}</strong><br/>${escapeHtml(t.dishSummary || 'Dining')}`}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-top:0.35rem;">
            ${
              avail
                ? `<button type="button" class="btn btn-outline btn-xs table-action-btn" data-table-id="${t.id}" data-act="occupy">Sit Here</button>`
                : isMine
                ? `<button type="button" class="btn btn-danger btn-xs table-action-btn" data-table-id="${t.id}" data-act="leave">Leave</button>`
                : `<span class="muted small">Guest dining</span>`
            }
            <button type="button" class="btn btn-primary btn-xs table-qr-open-btn" data-table-id="${t.id}">📱 QR</button>
          </div>
        </div>`;
      })
      .join('');
  }

  $('tablesGrid').addEventListener('click', async (e) => {
    const qrBtn = e.target.closest('.table-qr-open-btn');
    if (qrBtn) return openTableQrModal(qrBtn.dataset.tableId);
    const btn = e.target.closest('.table-action-btn');
    if (!btn) return;
    if (!appState.user) {
      $('googleLoginModal').classList.remove('hidden');
      return showToast('Sign in with Google / Gmail OTP to check in at a table.');
    }
    try {
      await api('/api/tables/checkin', 'POST', {
        tableId: Number(btn.dataset.tableId),
        email: appState.user.email,
        name: appState.user.name,
        action: btn.dataset.act
      });
      if (btn.dataset.act === 'occupy') {
        appState.activeTableId = Number(btn.dataset.tableId);
        sessionStorage.setItem('chatkaro_qr_table', String(appState.activeTableId));
      } else {
        appState.activeTableId = null;
        sessionStorage.removeItem('chatkaro_qr_table');
      }
      renderTableQrBanner();
      renderWaiterServicePanel();
      showToast(btn.dataset.act === 'occupy' ? `Checked into Table ${btn.dataset.tableId}!` : 'Table available.');
    } catch (err) {
      showToast(err.message);
    }
  });

  function renderWaiterServicePanel() {
    const sel = $('serviceTableSelect');
    if (sel && appState.tables.length) {
      const prev = sel.value || String(appState.activeTableId || appState.user?.tableId || appState.tables[0].id);
      sel.innerHTML = appState.tables.map((t) => `<option value="${t.id}">${escapeHtml(t.label)} (${t.seats}s)</option>`).join('');
      if (appState.tables.some((t) => String(t.id) === String(prev))) sel.value = String(prev);
    }
    const tid = Number(sel?.value || appState.activeTableId || 1);
    const statusWrap = $('myWaiterCallsStatus');
    if (statusWrap) {
      const recentCalls = (appState.waiterCalls || []).filter((c) => Number(c.tableId) === tid).slice(0, 5);
      statusWrap.innerHTML = recentCalls.map((c) => `
        <span class="waiter-call-chip ${escapeHtml(c.status)}">
          ${c.status === 'ringing' ? '🔔 Ringing Waiter:' : c.status === 'accepted' ? '🏃 Waiter Coming:' : '✅ Served:'} ${escapeHtml(c.requestType)}
        </span>`).join('');
    }
    const chatLog = $('tableWaiterChatMsgs');
    if (chatLog) {
      const msgs = (appState.waiterChats || []).filter((m) => Number(m.tableId) === tid).slice(-15);
      chatLog.innerHTML = msgs.length
        ? msgs.map((m) => `<div><strong style="color:${m.senderRole === 'waiter' ? '#22c55e' : 'var(--accent)'};">${escapeHtml(m.senderName)}:</strong> ${escapeHtml(m.text)}</div>`).join('')
        : '<span class="muted">Table ' + tid + ' — Waiter ko direct message bhejein (e.g. extra chutney, jaldi laiye)...</span>';
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  }

  $('serviceTableSelect')?.addEventListener('change', renderWaiterServicePanel);
  $('waiterQuickBtns')?.addEventListener('click', async (e) => {
    const b = e.target.closest('.waiter-req-btn');
    if (!b) return;
    const tid = Number($('serviceTableSelect')?.value || appState.activeTableId || 1);
    try {
      await api('/api/waiter/call', 'POST', {
        tableId: tid,
        customerName: appState.user?.name || `Table ${tid} Guest`,
        requestType: b.dataset.req
      });
      showToast(`🔔 Sent "${b.dataset.req}" to Waiter App for Table ${tid}!`);
    } catch (err) {
      showToast(err.message);
    }
  });
  $('customWaiterReqForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = $('customWaiterReqInput').value.trim();
    if (!note) return;
    const tid = Number($('serviceTableSelect')?.value || appState.activeTableId || 1);
    $('customWaiterReqInput').value = '';
    try {
      await api('/api/waiter/call', 'POST', {
        tableId: tid,
        customerName: appState.user?.name || `Table ${tid} Guest`,
        requestType: '🛎️ Special Request',
        note
      });
      showToast(`🔔 Waiter Bell rung for Table ${tid}!`);
    } catch (err) {
      showToast(err.message);
    }
  });
  $('tableWaiterChatForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = $('tableWaiterChatInput').value.trim();
    if (!text) return;
    const tid = Number($('serviceTableSelect')?.value || appState.activeTableId || 1);
    $('tableWaiterChatInput').value = '';
    try {
      await api('/api/waiter/chat', 'POST', {
        tableId: tid,
        senderRole: 'customer',
        senderName: appState.user?.name ? `${appState.user.name} (T${tid})` : `Table ${tid}`,
        text
      });
    } catch (err) {
      showToast(err.message);
    }
  });

  function formatEtaText(order) {
    if (order.status === 'cancelled') return 'Cancelled';
    if (order.status === 'served') return 'Served / Completed';
    if (order.status === 'ready') return 'Ready for Pickup / Table!';
    const msLeft = (order.etaEndsAt || 0) - Date.now();
    if (msLeft <= 0) return 'Arriving any moment!';
    const mins = Math.floor(msLeft / 60000);
    const secs = Math.floor((msLeft % 60000) / 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} left`;
  }

  function renderLiveOrders() {
    const list = $('liveOrdersList');
    if (appState.orders.length === 0) {
      list.innerHTML = `<p class="muted">No orders yet today.</p>`;
      return;
    }
    list.innerHTML = appState.orders
      .filter((o) => !o.isFake)
      .slice(0, 14)
      .map((o) => {
        const isMine = appState.user && o.customerEmail === appState.user.email;
        const canEdit = isMine && o.status !== 'cancelled' && o.status !== 'served';
        const modeBadge = o.orderType === 'parcel' || o.orderType === 'drive-through'
          ? '📦 Parcel'
          : o.orderType === 'delivery'
          ? '🛵 Delivery'
          : (o.tableId ? `🍽️ Table ${o.tableId}` : '🍽️ Dine-In');
        return `
        <div class="live-order-card">
          <div class="live-order-top">
            <strong>#${escapeHtml(o.id)} • ${escapeHtml(o.customerName)}</strong>
            <span class="status-chip status-${escapeHtml(o.status)}">${escapeHtml(o.status)}</span>
          </div>
          <div class="muted small">${modeBadge} • ${o.items.map((i) => `${i.qty}× ${escapeHtml(i.name)}`).join(', ')}</div>
          <div class="live-order-top" style="margin-top:0.35rem;margin-bottom:0;">
            <span class="eta-countdown" data-order-eta="${escapeHtml(o.id)}">⏱️ ${formatEtaText(o)}</span>
            <span>
              <strong>₹${o.total}</strong>
              ${canEdit ? `<button type="button" class="btn btn-outline btn-xs edit-my-order-btn" data-id="${escapeHtml(o.id)}">Edit / Cancel</button>` : ''}
            </span>
          </div>
        </div>`;
      })
      .join('');
  }

  function renderMyOrderBanner() {
    const banner = $('myLiveOrderBanner');
    if (!appState.user) return banner.classList.add('hidden');
    const active = appState.orders.find((o) => o.customerEmail === appState.user.email && o.status !== 'cancelled' && o.status !== 'served');
    if (!active) return banner.classList.add('hidden');
    banner.classList.remove('hidden');
    $('myBannerTitle').textContent = `Order #${active.id} (${active.status.toUpperCase()}) • ₹${active.total}`;
    $('myBannerEta').dataset.orderId = active.id;
    $('myBannerEta').textContent = `⏱️ ${formatEtaText(active)}`;
  }
  $('viewMyOrdersBtn').addEventListener('click', () => openProfileModal('orders'));

  setInterval(() => {
    document.querySelectorAll('[data-order-eta]').forEach((el) => {
      const o = appState.orders.find((ord) => ord.id === el.dataset.orderEta);
      if (o) el.textContent = '⏱️ ' + formatEtaText(o);
    });
    const bannerEta = $('myBannerEta');
    if (bannerEta && bannerEta.dataset.orderId) {
      const o = appState.orders.find((ord) => ord.id === bannerEta.dataset.orderId);
      if (o) bannerEta.textContent = '⏱️ ' + formatEtaText(o);
    }
    const modalEta = $('modalLiveEta');
    if (modalEta && modalEta.dataset.endsAt && !$('orderModal').classList.contains('hidden')) {
      const ms = Number(modalEta.dataset.endsAt) - Date.now();
      modalEta.textContent = ms > 0 ? `⏱️ Live Kitchen Countdown: ${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s` : '⏱️ Almost Ready!';
    }
  }, 1000);

  function renderMyOrdersList() {
    if (!appState.user) return;
    const mine = appState.orders.filter((o) => o.customerEmail === appState.user.email);
    const wrap = $('myOrdersList');
    if (mine.length === 0) {
      wrap.innerHTML = `<p class="muted">You haven't placed any orders yet.</p>`;
      return;
    }
    wrap.innerHTML = mine
      .map((o) => {
        const editable = o.status !== 'cancelled' && o.status !== 'served';
        const dtStr = o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
        const isDel = o.orderType === 'delivery';
        return `
        <div class="admin-row-card" style="flex-direction:column;align-items:stretch;gap:0.45rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;">
            <div>
              <strong>#${escapeHtml(o.id)} • ₹${o.total}</strong>
              <span class="status-chip status-${escapeHtml(o.status)}">${escapeHtml(o.status)}</span>
              <small class="muted"> • ${dtStr}</small>
            </div>
            <div class="admin-controls-inline">
              <button type="button" class="btn btn-outline btn-xs view-bill-btn" data-id="${escapeHtml(o.id)}">🧾 Official Bill</button>
              <button type="button" class="btn btn-primary btn-xs reorder-hist-btn" data-id="${escapeHtml(o.id)}">🔁 Reorder</button>
              ${
                editable
                  ? `<button type="button" class="btn btn-outline btn-xs edit-my-order-btn" data-id="${escapeHtml(o.id)}">✏️ Edit</button>
                     <button type="button" class="btn btn-danger btn-xs cancel-my-order-btn" data-id="${escapeHtml(o.id)}">Cancel</button>`
                  : ''
              }
            </div>
          </div>
          <div class="muted small">${o.items.map((i) => `${i.qty}× ${escapeHtml(i.name)}`).join(', ')}</div>
          <div class="eta-countdown" data-order-eta="${escapeHtml(o.id)}">⏱️ ${formatEtaText(o)}</div>
          ${isDel ? buildLiveDeliveryTrackerHtml(o, { compact: true }) : ''}
        </div>`;
      })
      .join('');
  }

  function openEditOrderModal(orderId) {
    const order = appState.orders.find((o) => o.id === orderId);
    if (!order) return;
    const draftItems = order.items.map((i) => ({ ...i }));
    $('editOrderHeading').textContent = `Modify Order #${order.id}`;
    const body = $('editOrderBody');

    const renderEditBody = () => {
      body.innerHTML = `
        ${draftItems
          .map(
            (item, idx) => `
          <div class="cart-item-row">
            <span>${escapeHtml(item.name)} (₹${item.price})</span>
            <div class="qty-control">
              <button type="button" data-eidx="${idx}" data-edelta="-1">−</button>
              <span>${item.qty}</span>
              <button type="button" data-eidx="${idx}" data-edelta="1">+</button>
            </div>
          </div>`
          )
          .join('')}
        <label>Special Notes / Table</label>
        <input type="text" id="editOrderDetailInput" value="${escapeHtml(order.detail || '')}" />
        <div class="two-col">
          <button type="button" class="btn btn-primary" id="saveOrderChangesBtn">Save Changes</button>
          <button type="button" class="btn btn-danger" id="cancelThisOrderBtn">Cancel Order</button>
        </div>`;
    };
    renderEditBody();
    $('editOrderModal').classList.remove('hidden');

    body.onclick = async (e) => {
      const qBtn = e.target.closest('[data-eidx]');
      if (qBtn) {
        const idx = Number(qBtn.dataset.eidx);
        const delta = Number(qBtn.dataset.edelta);
        draftItems[idx].qty = Math.max(1, draftItems[idx].qty + delta);
        renderEditBody();
        return;
      }
      if (e.target.id === 'saveOrderChangesBtn') {
        try {
          await api(`/api/orders/${order.id}`, 'PUT', {
            customerEmail: appState.user?.email,
            adminToken: appState.adminToken || undefined,
            items: draftItems,
            detail: $('editOrderDetailInput').value
          });
          $('editOrderModal').classList.add('hidden');
          showToast(`Order #${order.id} updated!`);
        } catch (err) {
          showToast(err.message);
        }
      }
      if (e.target.id === 'cancelThisOrderBtn') {
        try {
          await api(`/api/orders/${order.id}`, 'PUT', {
            customerEmail: appState.user?.email,
            adminToken: appState.adminToken || undefined,
            action: 'cancel'
          });
          $('editOrderModal').classList.add('hidden');
          showToast(`Order #${order.id} cancelled.`);
        } catch (err) {
          showToast(err.message);
        }
      }
    };
  }

  document.body.addEventListener('click', async (e) => {
    const reorderBtn = e.target.closest('.reorder-hist-btn');
    if (reorderBtn) {
      const ord = appState.orders.find((o) => o.id === reorderBtn.dataset.id);
      if (ord && Array.isArray(ord.items)) {
        ord.items.forEach((it) => { if (it.id) updateQty(it.id, Number(it.qty || 1)); });
        $('profileModal')?.classList.add('hidden');
        openCart();
        showToast('🔁 Added items from past order to Cart!');
      }
      return;
    }
    const billBtn = e.target.closest('.view-bill-btn');
    if (billBtn) {
      const ord = appState.orders.find((o) => o.id === billBtn.dataset.id);
      if (ord) showOrderConfirmationModal(ord);
      return;
    }
    const editBtn = e.target.closest('.edit-my-order-btn');
    if (editBtn) return openEditOrderModal(editBtn.dataset.id);
    const cancelBtn = e.target.closest('.cancel-my-order-btn');
    if (cancelBtn && appState.user) {
      try {
        await api(`/api/orders/${cancelBtn.dataset.id}`, 'PUT', { customerEmail: appState.user.email, action: 'cancel' });
        showToast('Order cancelled.');
      } catch (err) {
        showToast(err.message);
      }
    }
  });
  $('closeEditOrderBtn').addEventListener('click', () => $('editOrderModal').classList.add('hidden'));

  function renderTopCustomers() {
    $('topCustomersList').innerHTML = appState.topCustomers
      .map(
        (c, i) => `
      <div class="leader-row rank-${i + 1}">
        <span class="rank-badge">#${i + 1}</span>
        <div style="flex:1;min-width:0;">
          <strong>${escapeHtml(c.name)}</strong>
          <div class="muted small">${c.ordersCount} orders • Game Best: ${c.bestGameScore || 0}</div>
        </div>
        <strong style="color:var(--primary);font-size:0.84rem;">₹${c.totalSpent || 0}</strong>
      </div>`
      )
      .join('');
  }

  function renderChat() {
    const box = $('chatMessages');
    box.innerHTML = appState.chatMessages
      .map(
        (m) => `
      <div class="chat-msg ${m.isOwner ? 'owner-msg' : ''}">
        <div class="chat-msg-head">
          <span>${m.isOwner ? '👑 ' : ''}${escapeHtml(m.senderName)}${m.tableId ? ' • Table ' + m.tableId : ''}</span>
          <span class="muted">${new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div>${escapeHtml(m.text)}</div>
      </div>`
      )
      .join('');
    box.scrollTop = box.scrollHeight;
  }

  async function sendChatText(text) {
    if (!appState.user) {
      $('googleLoginModal').classList.remove('hidden');
      return showToast('Sign in with Google to chat.');
    }
    try {
      await api('/api/chat', 'POST', {
        senderName: appState.user.name,
        senderEmail: appState.user.email,
        tableId: appState.user.tableId || null,
        text
      });
    } catch (err) {
      showToast(err.message);
    }
  }
  $('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = $('chatInput').value.trim();
    if (!txt) return;
    $('chatInput').value = '';
    sendChatText(txt);
  });
  document.querySelectorAll('.quick-chat-btn').forEach((btn) => btn.addEventListener('click', () => sendChatText(btn.dataset.msg)));

  // ================= GOOGLE MAPS PHOTOS GALLERY =================
  function renderMapPhotos() {
    const grid = $('mapPhotosGrid');
    const items = appState.mapPhotos.filter((p) => appState.photoCategory === 'all' || p.category === appState.photoCategory);
    if (items.length === 0) {
      grid.innerHTML = `<p class="muted">No photos in this category yet.</p>`;
      return;
    }
    grid.innerHTML = items
      .map(
        (p) => {
          const imgSrc = String(p.url || '').startsWith('/assets/') ? p.url.slice(1) : p.url;
          return `
      <article class="photo-card card-hover" data-photo-id="${escapeHtml(p.id)}">
        <div class="photo-thumb-wrap">
          <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.title)}" loading="lazy" onerror="this.onerror=null;this.src='assets/dosa-platter.jpg';" />
          <span class="photo-cat-badge">${escapeHtml(p.category.toUpperCase())}</span>
        </div>
        <div class="photo-card-body">
          <strong>${escapeHtml(p.title)}</strong>
          <small>${escapeHtml(p.uploader || 'Google Maps')}</small>
        </div>
      </article>`;
        }
      )
      .join('');
  }

  $('photoCategoryTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab-btn');
    if (!tab) return;
    $('photoCategoryTabs').querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    tab.classList.add('active');
    appState.photoCategory = tab.dataset.pcat;
    renderMapPhotos();
  });

  $('mapPhotosGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.photo-card');
    if (!card) return;
    const p = appState.mapPhotos.find((x) => x.id === card.dataset.photoId);
    if (!p) return;
    const imgSrc = String(p.url || '').startsWith('/assets/') ? p.url.slice(1) : p.url;
    $('lightboxImg').src = imgSrc;
    $('lightboxTitle').textContent = p.title;
    $('lightboxMeta').textContent = `${p.uploader || 'Google Maps'} • Category: ${p.category}`;
    $('photoLightboxModal').classList.remove('hidden');
  });
  $('closeLightboxBtn').addEventListener('click', () => $('photoLightboxModal').classList.add('hidden'));

  // ================= REVIEWS & MAPS SYNC =================
  function renderReviews() {
    const revThumbsPool = [
      ['assets/veg-angara.jpg', 'assets/dosa-platter.jpg', 'assets/kaju-curry.jpg'],
      ['assets/cheese-masala.jpg', 'assets/dishes/pun-butter-naan.jpg', 'assets/dishes/bev-mango-lassi.jpg'],
      ['assets/indo-chinese.jpg', 'assets/dishes/tan-paneer-tikka.jpg', 'assets/dishes/dosa-mysore.jpg'],
      ['assets/punjabi-paneer.jpg', 'assets/dishes/chi-hakka.jpg', 'assets/dishes/bev-gulab-jamun.jpg']
    ];
    $('reviewsGrid').innerHTML = appState.reviews
      .slice(0, 8)
      .map((r, idx) => {
        const initials = r.author.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
        const thumbs = revThumbsPool[idx % revThumbsPool.length];
        return `
        <article class="review-card card-hover">
          <div class="review-quote-mark" aria-hidden="true">“</div>
          <p>"${escapeHtml(r.text)}"</p>
          <div class="rev-thumb-strip" aria-hidden="true">
            ${thumbs.map((t) => `<img src="${t}" alt="Pure Veg Dish" loading="lazy" />`).join('')}
          </div>
          <div class="review-top">
            <div class="avatar">${escapeHtml(initials)}</div>
            <div>
              <strong>${escapeHtml(r.author)}</strong>
              <small>${escapeHtml(r.source || 'Google Maps')} • ${escapeHtml(r.meta || 'Verified Guest')}</small>
            </div>
            <span class="rev-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
          </div>
        </article>`;
      })
      .join('');
  }

  $('syncMapsNowBtn').addEventListener('click', async () => {
    try {
      const res = await api('/api/maps-sync', 'POST', {});
      showToast(res.mode === 'google-places-api' ? 'Synced reviews & photos from Google Places API!' : 'Google Maps live bridge synced!');
    } catch (err) {
      showToast(err.message);
    }
  });
  $('toggleMapBridgeBtn').addEventListener('click', () => $('mapBridgeForm').classList.toggle('hidden'));
  $('mapBridgeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/api/maps-sync', 'POST', {
        author: $('mapRevAuthor').value.trim(),
        rating: Number($('mapRevRating').value),
        text: $('mapRevText').value.trim()
      });
      $('mapBridgeForm').reset();
      $('mapBridgeForm').classList.add('hidden');
      showToast('Google Maps review synced to website!');
    } catch (err) {
      showToast(err.message);
    }
  });
  $('toggleReviewFormBtn').addEventListener('click', () => $('quickReviewForm').classList.toggle('hidden'));
  $('quickReviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/api/reviews', 'POST', {
        author: $('revName').value.trim(),
        rating: Number($('revRating').value),
        text: $('revText').value.trim(),
        source: 'Website Guest'
      });
      $('quickReviewForm').reset();
      $('quickReviewForm').classList.add('hidden');
      showToast('Review published live!');
    } catch (err) {
      showToast(err.message);
    }
  });

  // ================= OWNER FULL CONTROL ADMIN DASHBOARD =================
  let activeAdminTab = 'sales';

  async function refreshSalesAndRenderAdmin() {
    if (!appState.adminToken) return;
    try {
      const res = await api('/api/admin/sales', 'GET', null, { 'X-Admin-Token': appState.adminToken });
      appState.salesData = res.sales;
    } catch (err) {
      if (String(err.message).toLowerCase().includes('unauth')) {
        lockAdminPanel();
        return;
      }
    }
    renderAdminDashboard();
  }

  function lockAdminPanel() {
    if (appState.adminToken) {
      fetch('/api/admin/logout', { method: 'POST', headers: { 'X-Admin-Token': appState.adminToken } }).catch(() => {});
    }
    appState.adminToken = '';
    sessionStorage.removeItem('chatkaro_admin_token');
    $('adminLockScreen').classList.remove('hidden');
    $('adminDashboard').classList.add('hidden');
    $('lockAdminBtn').classList.add('hidden');
    $('adminPinInput').value = '';
  }

  $('openAdminBtn').addEventListener('click', () => {
    $('adminModal').classList.remove('hidden');
    document.body.classList.add('admin-open');
    if (appState.adminToken) {
      $('adminLockScreen').classList.add('hidden');
      $('adminDashboard').classList.remove('hidden');
      $('lockAdminBtn').classList.remove('hidden');
      refreshSalesAndRenderAdmin();
    } else {
      $('adminLockScreen').classList.remove('hidden');
      $('adminDashboard').classList.add('hidden');
      $('lockAdminBtn').classList.add('hidden');
    }
  });
  $('closeAdminBtn').addEventListener('click', () => {
    $('adminModal').classList.add('hidden');
    document.body.classList.remove('admin-open');
  });
  $('lockAdminBtn').addEventListener('click', () => {
    lockAdminPanel();
    showToast('Admin Panel locked 🔒');
  });

  $('adminPinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = $('adminPinInput').value.trim();
    try {
      const res = await api('/api/admin/verify', 'POST', { adminPin: pin });
      appState.adminToken = res.adminToken;
      appState.adminFullSettings = res.settings;
      appState.salesData = res.sales;
      sessionStorage.setItem('chatkaro_admin_token', res.adminToken);
      $('adminPinInput').value = '';
      $('adminLockScreen').classList.add('hidden');
      $('adminDashboard').classList.remove('hidden');
      $('lockAdminBtn').classList.remove('hidden');
      renderAdminDashboard();
      showToast('Admin Control Center unlocked!');
    } catch (err) {
      showToast(err.message);
    }
  });

  document.querySelectorAll('[data-atab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeAdminTab = btn.dataset.atab;
      document.querySelectorAll('[data-atab]').forEach((b) => b.classList.toggle('active', b.dataset.atab === activeAdminTab));
      refreshSalesAndRenderAdmin();
    });
  });

  if ($('acruCollapseBtn')) {
    $('acruCollapseBtn').addEventListener('click', () => {
      const sb = $('acruSidebar');
      const collapsed = sb.classList.toggle('collapsed');
      $('acruCollapseBtn').textContent = collapsed ? '»' : '« Collapse sidebar';
    });
  }
  if ($('admTopRefreshBtn')) {
    $('admTopRefreshBtn').addEventListener('click', () => {
      refreshSalesAndRenderAdmin();
      showToast('Dashboard refreshed!');
    });
  }
  if ($('admTopSettingsBtn')) {
    $('admTopSettingsBtn').addEventListener('click', () => {
      document.querySelector('[data-atab="colors"]')?.click();
    });
  }
  if ($('admTopCsvBtn')) {
    $('admTopCsvBtn').addEventListener('click', () => {
      if ($('exportSalesCsvBtn')) $('exportSalesCsvBtn').click();
      else {
        document.querySelector('[data-atab="sales"]')?.click();
        setTimeout(() => $('exportSalesCsvBtn')?.click(), 250);
      }
    });
  }
  if ($('adminQuickSearch')) {
    $('adminQuickSearch').addEventListener('input', () => {
      if (activeAdminTab === 'sales') {
        activeAdminTab = 'orders';
        document.querySelectorAll('[data-atab]').forEach((b) => b.classList.toggle('active', b.dataset.atab === 'orders'));
      }
      renderAdminDashboard();
    });
  }

  function renderAdminDashboard() {
    const realOrders = appState.orders.filter((o) => !o.isFake);
    const activeOrders = realOrders.filter((o) => o.status !== 'cancelled' && o.status !== 'served').length;
    const validReal = realOrders.filter((o) => o.status !== 'cancelled');
    const totalRev = validReal.reduce((s, o) => s + (o.total || 0), 0);
    const occupiedTables = appState.tables.filter((t) => t.status === 'occupied').length;
    const defaultParcelStats = (() => {
      const pList = validReal.filter((o) => o.orderType === 'parcel' || o.orderType === 'drive-through' || o.orderType === 'delivery');
      return {
        totalCount: pList.length,
        parcelCount: pList.filter((o) => o.orderType !== 'delivery').length,
        deliveryCount: pList.filter((o) => o.orderType === 'delivery').length,
        servedCount: pList.filter((o) => o.status === 'served').length,
        activeCount: pList.filter((o) => o.status !== 'served').length,
        revenue: pList.reduce((s, o) => s + (o.total || 0), 0),
        paidOnlineRevenue: pList.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + (o.total || 0), 0),
        codOrPendingRevenue: pList.filter((o) => o.paymentStatus !== 'paid').reduce((s, o) => s + (o.total || 0), 0)
      };
    })();
    const sales = appState.salesData || {
      totalRevenue: totalRev,
      todayRevenue: totalRev,
      totalOrders: realOrders.length,
      validOrdersCount: validReal.length,
      cancelledOrdersCount: realOrders.filter((o) => o.status === 'cancelled').length,
      fakeOrdersExcluded: 0,
      servedOrdersCount: validReal.filter((o) => o.status === 'served').length,
      totalDiscounts: 0,
      avgOrderValue: validReal.length ? Math.round(totalRev / validReal.length) : 0,
      parcelStats: defaultParcelStats,
      dineInStats: {
        totalCount: validReal.length - defaultParcelStats.totalCount,
        revenue: Math.max(0, totalRev - defaultParcelStats.revenue)
      },
      paymentStats: {
        onlinePaidCount: validReal.filter((o) => o.paymentStatus === 'paid').length,
        onlinePaidRevenue: validReal.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + (o.total || 0), 0),
        razorpayRevenue: validReal.filter((o) => o.paymentStatus === 'paid' && o.paymentMethod === 'razorpay').reduce((s, o) => s + (o.total || 0), 0),
        phonepeRevenue: validReal.filter((o) => o.paymentStatus === 'paid' && o.paymentMethod === 'phonepe').reduce((s, o) => s + (o.total || 0), 0),
        codRevenue: validReal.filter((o) => o.paymentStatus !== 'paid').reduce((s, o) => s + (o.total || 0), 0)
      },
      itemSales: [],
      categorySales: []
    };
    const ps = sales.parcelStats || defaultParcelStats;
    const ds = sales.dineInStats || { totalCount: 0, revenue: 0 };
    const payS = sales.paymentStats || { onlinePaidCount: 0, onlinePaidRevenue: 0, razorpayRevenue: 0, phonepeRevenue: 0, codRevenue: 0 };

    $('adminKpiGrid').innerHTML = `
      <div class="kpi-card kpi-highlight">
        <span>Real Net Sell</span>
        <strong>₹${sales.totalRevenue}</strong>
        <small>Today: ₹${sales.todayRevenue} • ${sales.validOrdersCount} orders</small>
      </div>
      <div class="kpi-card kpi-green">
        <span>Parcel &amp; Delivery</span>
        <strong>₹${ps.revenue}</strong>
        <small>${ps.totalCount} Real Parcels • Paid: ₹${ps.paidOnlineRevenue}</small>
      </div>
      <div class="kpi-card">
        <span>Dine-In Sell</span>
        <strong>₹${ds.revenue}</strong>
        <small>${ds.totalCount} Table Orders</small>
      </div>
      <div class="kpi-card">
        <span>Razorpay + PhonePe</span>
        <strong>₹${payS.onlinePaidRevenue}</strong>
        <small>Rzp ₹${payS.razorpayRevenue} • PP ₹${payS.phonepeRevenue}</small>
      </div>
      <div class="kpi-card">
        <span>Booked Tables</span>
        <strong>${occupiedTables}/${appState.tables.length}</strong>
        <small>Live real bookings only</small>
      </div>
      <div class="kpi-card">
        <span>Active Kitchen</span>
        <strong>${activeOrders}</strong>
        <small>Served: ${sales.servedOrdersCount} • Menu: ${appState.menu.length}</small>
      </div>`;

    ['Sales', 'Orders', 'Menu', 'Ads', 'Tables', 'Photos', 'Reviews', 'Chat', 'Apps', 'Colors'].forEach((name) => {
      $('adminTab' + name)?.classList.toggle('hidden', activeAdminTab !== name.toLowerCase());
    });

    const pinHeaders = { 'X-Admin-Token': appState.adminToken };
    if ($('admNavOrderBadge')) {
      $('admNavOrderBadge').textContent = realOrders.length;
    }

    // Helper for quick search filter inside Orders/Menu
    const qAdm = ($('adminQuickSearch')?.value || '').trim().toLowerCase();

    // 0. SALES & ANALYTICS TAB (ACRU-Style Bento Dashboard)
    if (activeAdminTab === 'sales') {
      // Build 7-day bar chart buckets from real orders (Sun..Sat)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const nowDate = new Date();
      const dayBuckets = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(nowDate);
        d.setDate(nowDate.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const start = d.getTime();
        const end = start + 86400000;
        const dayOrders = validReal.filter((o) => (o.createdAt || 0) >= start && (o.createdAt || 0) < end);
        const rev = dayOrders.reduce((s, o) => s + Number(o.total || 0), 0);
        dayBuckets.push({ label: days[d.getDay()], rev, count: dayOrders.length, isToday: i === 0 });
      }
      const maxDayRev = Math.max(100, ...dayBuckets.map((b) => b.rev));

      // Daily Target Progress
      const dailyTarget = 5000;
      const targetPct = Math.min(100, Math.round((sales.todayRevenue / dailyTarget) * 100));

      // Health / Fulfillment %
      const healthPct = sales.validOrdersCount > 0
        ? Math.round((sales.servedOrdersCount / sales.validOrdersCount) * 100)
        : 100;

      // Category Mix Colors
      const segColors = ['#84cc16', '#65a30d', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
      const totalCatRev = Math.max(1, sales.categorySales.reduce((s, c) => s + c.revenue, 0));

      const sConf = appState.adminFullSettings || appState.settings;
      const gwConfigured = sConf.hasRazorpay || sConf.hasPhonePeGateway || Boolean(sConf.merchantUpiId);

      $('adminTabSales').innerHTML = `
        <div class="acru-bento-grid">
          <div class="acru-left-col">
            <!-- Row 1: Revenue 7d Bar Chart + 3-Stack Stats -->
            <div class="acru-hero-row">
              <div class="acru-card">
                <div class="acru-card-head">
                  <div>
                    <div class="acru-card-title">Real Net Revenue</div>
                    <div class="acru-big-num">₹${sales.totalRevenue.toLocaleString('en-IN')}</div>
                    <div class="acru-card-sub">7-day real sales overview (zero fake orders)</div>
                  </div>
                  <div class="admin-controls-inline">
                    <span class="acru-pill-tag">7d Live</span>
                    ${sales.fakeOrdersExcluded ? `<button type="button" class="btn btn-danger btn-xs" id="purgeFakeOrdersBtn">Purge ${sales.fakeOrdersExcluded} Fake</button>` : ''}
                  </div>
                </div>
                <div class="acru-bar-chart">
                  ${dayBuckets
                    .map((b) => {
                      const h = b.rev > 0 ? Math.max(14, Math.round((b.rev / maxDayRev) * 100)) : 8;
                      return `
                    <div class="acru-bar-col" title="${b.label}: ₹${b.rev} (${b.count} orders)">
                      <div class="acru-bar-track">
                        <div class="acru-bar-fill ${b.rev === 0 ? 'muted-bar' : ''}" style="height:${h}%"></div>
                      </div>
                      <span class="acru-bar-lbl">${b.isToday ? 'Today' : b.label}</span>
                    </div>`;
                    })
                    .join('')}
                </div>
              </div>

              <div class="acru-card acru-stat-stack">
                <div class="acru-stat-item">
                  <small>Today’s Real Sell</small>
                  <strong>₹${sales.todayRevenue.toLocaleString('en-IN')}</strong>
                  <span class="acru-delta-up">● ${sales.validOrdersCount} verified real orders</span>
                </div>
                <div class="acru-stat-item">
                  <small>📦 Parcel &amp; Delivery</small>
                  <strong>₹${ps.revenue.toLocaleString('en-IN')}</strong>
                  <span class="acru-delta-up">${ps.totalCount} parcels • Paid ₹${ps.paidOnlineRevenue} • COD ₹${ps.codOrPendingRevenue}</span>
                </div>
                <div class="acru-stat-item">
                  <small>🍽️ Dine-In &amp; Tables</small>
                  <strong>₹${ds.revenue.toLocaleString('en-IN')}</strong>
                  <span class="acru-delta-up">${ds.totalCount} table orders • ${occupiedTables}/${appState.tables.length} tables live</span>
                </div>
              </div>
            </div>

            <!-- Row 2: Daily Target + Gateway Quick Setup -->
            <div class="acru-mid-row">
              <div class="acru-card">
                <div class="acru-card-head">
                  <div>
                    <div class="acru-card-title">Daily Revenue Target</div>
                    <div class="acru-card-sub">Real sales progress toward ₹${dailyTarget.toLocaleString('en-IN')} daily goal</div>
                  </div>
                  <span class="acru-pill-tag">${targetPct}%</span>
                </div>
                <div class="acru-progress-track">
                  <div class="acru-progress-fill" style="width:${targetPct}%"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:0.74rem;color:#6b7280;font-weight:700;">
                  <span>₹${sales.todayRevenue} achieved</span>
                  <span>Goal: ₹${dailyTarget}</span>
                </div>
              </div>

              <div class="acru-card">
                <div class="acru-card-head">
                  <div>
                    <div class="acru-card-title">Parcel &amp; Gateway Health</div>
                    <div class="acru-card-sub">${gwConfigured ? 'Razorpay / PhonePe UPI ready for live checkout.' : 'Add Razorpay / PhonePe UPI keys in Gateways & Theme.'}</div>
                  </div>
                  <span class="acru-pill-tag">${gwConfigured ? 'Active' : 'Setup'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem;">
                  <div style="font-size:0.76rem;color:#374151;">
                    <div>💳 Razorpay: <strong>₹${payS.razorpayRevenue}</strong></div>
                    <div>📱 PhonePe/UPI: <strong>₹${payS.phonepeRevenue}</strong></div>
                  </div>
                  <button type="button" class="btn btn-outline btn-xs" id="acruGoGatewaysBtn">Configure Gateways →</button>
                </div>
              </div>
            </div>

            <!-- Row 3: Category Mix + Fulfillment Gauge + Top Dish Tracker -->
            <div class="acru-bottom-row">
              <div class="acru-card">
                <div class="acru-card-head">
                  <div>
                    <div class="acru-card-title">Category Mix</div>
                    <div class="acru-card-sub">What sold most</div>
                  </div>
                  <span class="acru-pill-tag">₹${sales.totalRevenue}</span>
                </div>
                ${sales.categorySales.length
                  ? `
                  <div class="acru-seg-bar">
                    ${sales.categorySales.slice(0, 6).map((c, idx) => `<span style="width:${Math.max(8, Math.round((c.revenue / totalCatRev) * 100))}%;background:${segColors[idx % segColors.length]};"></span>`).join('')}
                  </div>
                  <div class="acru-cat-legend">
                    ${sales.categorySales.slice(0, 5).map((c, idx) => `
                      <div class="acru-cat-row">
                        <span><i class="acru-dot" style="background:${segColors[idx % segColors.length]};"></i>${escapeHtml(c.category)}</span>
                        <strong>${Math.round((c.revenue / totalCatRev) * 100)}% (₹${c.revenue})</strong>
                      </div>`).join('')}
                  </div>`
                  : '<p class="muted small" style="margin:0.8rem 0 0;">No real sales yet today.</p>'}
              </div>

              <div class="acru-card" style="text-align:center;">
                <div class="acru-card-head" style="text-align:left;">
                  <div>
                    <div class="acru-card-title">Kitchen Health</div>
                    <div class="acru-card-sub">Served vs active</div>
                  </div>
                  <span class="acru-pill-tag">${sales.servedOrdersCount}/${sales.validOrdersCount}</span>
                </div>
                <svg viewBox="0 0 180 100" style="width:165px;max-width:100%;margin:0.2rem auto 0;display:block;">
                  <path d="M 20 88 A 70 70 0 0 1 160 88" fill="none" stroke="#e5e7eb" stroke-width="14" stroke-linecap="round" />
                  <path d="M 20 88 A 70 70 0 0 1 160 88" fill="none" stroke="#84cc16" stroke-width="14" stroke-linecap="round" stroke-dasharray="220" stroke-dashoffset="${Math.round(220 - (220 * healthPct) / 100)}" />
                  <text x="90" y="76" text-anchor="middle" font-size="24" font-weight="800" fill="#0f172a">${healthPct}%</text>
                  <text x="90" y="94" text-anchor="middle" font-size="9.5" font-weight="600" fill="#6b7280">Orders Completed</text>
                </svg>
                <div class="acru-card-sub" style="margin-top:0.35rem;">Avg Bill: <strong>₹${sales.avgOrderValue}</strong> • Cancelled: <strong>${sales.cancelledOrdersCount}</strong></div>
              </div>

              <div class="acru-card">
                <div class="acru-card-head">
                  <div>
                    <div class="acru-card-title">Top Dishes Sold</div>
                    <div class="acru-card-sub">Live item tracker</div>
                  </div>
                  <span class="acru-pill-tag">${appState.menu.length} items</span>
                </div>
                <div>
                  ${sales.itemSales.length
                    ? sales.itemSales.slice(0, 4).map((it) => {
                        const menuItem = appState.menu.find((m) => m.name === it.name) || {};
                        const thumb = getDishImage(menuItem);
                        const pct = Math.min(100, Math.round((it.revenue / Math.max(1, sales.itemSales[0].revenue)) * 100));
                        return `
                      <div class="acru-goal-row">
                        <img class="acru-goal-thumb" src="${escapeHtml(thumb)}" alt="" />
                        <div style="flex:1;min-width:0;">
                          <div style="display:flex;justify-content:space-between;gap:0.25rem;">
                            <strong style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(it.name)}</strong>
                            <span>₹${it.revenue}</span>
                          </div>
                          <div class="acru-progress-track" style="height:7px;margin:0.25rem 0 0;">
                            <div class="acru-progress-fill" style="width:${pct}%"></div>
                          </div>
                        </div>
                      </div>`;
                      }).join('')
                    : `<div class="muted small">Place your first real order to see top dishes here with live photos!</div>`}
                </div>
              </div>
            </div>
          </div>

          <!-- Right Rail: Merchant Gateway Card + Real Transaction History -->
          <div class="acru-right-col">
            <div class="acru-card">
              <div class="acru-card-head">
                <div>
                  <div class="acru-card-title">Merchant Gateways</div>
                  <div class="acru-card-sub">Razorpay &amp; PhonePe UPI</div>
                </div>
                <button type="button" class="acru-pill-tag" id="acruAddGwBtn" style="cursor:pointer;">+ Setup</button>
              </div>
              <div class="acru-merchant-card">
                <small>CHATKARO MERCHANT PAY</small>
                <strong>₹${payS.onlinePaidRevenue.toLocaleString('en-IN')} Online</strong>
                <div style="display:flex;justify-content:space-between;font-size:0.72rem;font-weight:700;">
                  <span>UPI: ${escapeHtml(sConf.merchantUpiId || 'Not set')}</span>
                  <span>${sConf.hasRazorpay ? 'RZP ✓' : 'RZP —'} • ${sConf.hasPhonePeGateway ? 'PP ✓' : 'PP QR'}</span>
                </div>
              </div>
              <div class="acru-quick-actions">
                <button type="button" class="acru-qa-btn" data-jump="orders"><span>📋</span>Orders</button>
                <button type="button" class="acru-qa-btn" data-jump="parcels"><span>📦</span>Parcels</button>
                <a class="acru-qa-btn" href="waiter.html" target="_blank" style="text-decoration:none;"><span>🛎️</span>Waiter App</a>
                <a class="acru-qa-btn" href="delivery.html" target="_blank" style="text-decoration:none;"><span>🛵</span>Rider App</a>
              </div>
            </div>

            <div class="acru-card" style="background:linear-gradient(135deg,#f8fafc,#ecfdf5);">
              <div class="acru-card-head">
                <div>
                  <div class="acru-card-title">🤖 Daily AI Ads &amp; 🎵 Music</div>
                  <div class="acru-card-sub">${escapeHtml(appState.dailyAiAd?.tag || 'Auto Daily Spotlight')}</div>
                </div>
                <span class="acru-pill-tag">${sConf.hasGeminiKey ? 'Gemini Live' : 'Auto Mode'}</span>
              </div>
              <p class="small" style="margin:0 0 0.65rem;color:#334155;">${escapeHtml(appState.dailyAiAd?.headline || 'Daily rotating pure-veg dish ads active!')}</p>
              <div class="admin-controls-inline" style="margin-bottom:0.55rem;">
                <button type="button" class="btn btn-primary btn-xs" id="admRefreshAiAdBtn">🤖 Refresh Today's AI Ad</button>
                <button type="button" class="btn btn-outline btn-xs" id="admQuickMusicToggleBtn">${sConf.bgMusicEnabled !== false ? '🎵 Shop Music: ON' : '🔇 Shop Music: OFF'}</button>
              </div>
              <div class="small muted">${sConf.bgMusicVideoId ? `Playing: ${escapeHtml(sConf.bgMusicTitle || 'YouTube Song')}` : 'Set YouTube song link in Gateways & Settings'}</div>
            </div>

            <div class="acru-card">
              <div class="acru-card-head">
                <div>
                  <div class="acru-card-title">Real Order History</div>
                  <div class="acru-card-sub">Live verified orders &amp; parcels</div>
                </div>
                <span class="acru-pill-tag">${realOrders.length}</span>
              </div>
              <div class="acru-tx-list">
                ${realOrders.length
                  ? realOrders.slice(0, 8).map((o) => {
                      const isP = o.orderType === 'parcel' || o.orderType === 'drive-through' || o.orderType === 'delivery';
                      return `
                    <div class="acru-tx-row">
                      <div class="acru-tx-left">
                        <span class="acru-tx-ico">${isP ? '📦' : '🍽️'}</span>
                        <div style="min-width:0;">
                          <strong style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(o.customerName)}</strong>
                          <small class="muted">${isP ? 'Parcel' : 'Table ' + (o.tableId || '-')} • ${o.paymentStatus === 'paid' ? 'Paid' : 'COD'}</small>
                        </div>
                      </div>
                      <strong style="color:${o.status === 'cancelled' ? '#dc2626' : '#16a34a'};">+₹${o.total}</strong>
                    </div>`;
                    }).join('')
                  : '<p class="muted small" style="margin:0.5rem 0;">No real orders yet. Only genuine orders appear here.</p>'}
              </div>
            </div>
          </div>
        </div>`;

      if ($('purgeFakeOrdersBtn')) {
        $('purgeFakeOrdersBtn').addEventListener('click', async () => {
          await api('/api/admin/orders/purge-fake', 'DELETE', null, pinHeaders);
          showToast('Fake/test records permanently removed!');
          refreshSalesAndRenderAdmin();
        });
      }
      if ($('admRefreshAiAdBtn')) {
        $('admRefreshAiAdBtn').addEventListener('click', async () => {
          $('admRefreshAiAdBtn').disabled = true;
          $('admRefreshAiAdBtn').textContent = 'Generating AI Ad...';
          try {
            await api('/api/admin/daily-ai-ad', 'POST', {}, pinHeaders);
            showToast('🤖 Fresh Daily AI Ad created & live!');
          } catch (err) {
            showToast(err.message);
          } finally {
            $('admRefreshAiAdBtn').disabled = false;
            $('admRefreshAiAdBtn').textContent = "🤖 Refresh Today's AI Ad";
          }
        });
      }
      if ($('admQuickMusicToggleBtn')) {
        $('admQuickMusicToggleBtn').addEventListener('click', async () => {
          const cur = (appState.adminFullSettings || appState.settings).bgMusicEnabled !== false;
          await api('/api/admin/settings', 'POST', { settings: { bgMusicEnabled: !cur } }, pinHeaders);
          if (appState.adminFullSettings) appState.adminFullSettings.bgMusicEnabled = !cur;
          showToast(!cur ? '🎵 Background music enabled for shop!' : '🔇 Background music turned off for shop.');
        });
      }
      if ($('acruGoGatewaysBtn')) {
        $('acruGoGatewaysBtn').addEventListener('click', () => {
          document.querySelector('[data-atab="colors"]')?.click();
        });
      }
      if ($('acruAddGwBtn')) {
        $('acruAddGwBtn').addEventListener('click', () => {
          document.querySelector('[data-atab="colors"]')?.click();
        });
      }
      $('adminTabSales').querySelectorAll('[data-jump]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const j = btn.dataset.jump;
          if (j === 'parcels') {
            appState.adminOrderFilter = 'parcel';
            document.querySelector('[data-atab="orders"]')?.click();
          } else {
            document.querySelector(`[data-atab="${j}"]`)?.click();
          }
        });
      });

      $('exportSalesCsvBtn')?.addEventListener('click', () => {
        const rows = [['Dish', 'Category', 'Qty Sold', 'Revenue INR'], ...sales.itemSales.map((i) => [i.name, i.category, i.qtySold, i.revenue])];
        const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `chatkaro-sales-report.csv`;
        a.click();
        showToast('Sales CSV downloaded!');
      });
    }

    // 1. ORDERS TAB (Real Orders Only + Parcel Filter + Search + Payment Status)
    if (activeAdminTab === 'orders') {
      const filteredOrders = realOrders.filter((o) => {
        if (appState.adminOrderFilter === 'parcel' && !(o.orderType === 'parcel' || o.orderType === 'drive-through' || o.orderType === 'delivery')) return false;
        if (appState.adminOrderFilter === 'dine-in' && o.orderType !== 'dine-in') return false;
        if (qAdm && !`${o.id} ${o.customerName} ${o.customerPhone} ${o.orderType}`.toLowerCase().includes(qAdm)) return false;
        return true;
      });
      $('adminTabOrders').innerHTML = `
        <div class="modal-tabs" style="margin-bottom:0.85rem;justify-content:space-between;align-items:center;">
          <div style="display:flex;gap:0.45rem;flex-wrap:wrap;">
            <button type="button" class="tab-btn ${appState.adminOrderFilter === 'all' ? 'active' : ''}" data-aof="all">All Real Orders (${realOrders.length})</button>
            <button type="button" class="tab-btn ${appState.adminOrderFilter === 'parcel' ? 'active' : ''}" data-aof="parcel">📦 Parcel &amp; Delivery (${ps.totalCount})</button>
            <button type="button" class="tab-btn ${appState.adminOrderFilter === 'dine-in' ? 'active' : ''}" data-aof="dine-in">🍽️ Dine-In (${ds.totalCount})</button>
          </div>
          <a href="delivery.html" target="_blank" class="btn btn-primary btn-xs">🛵 Open Delivery Boy App</a>
        </div>
        <div class="admin-grid-list">
          ${filteredOrders.length
            ? filteredOrders
                .map((o) => {
                  const isParcel = o.orderType === 'parcel' || o.orderType === 'drive-through' || o.orderType === 'delivery';
                  const payBadge = o.paymentStatus === 'paid'
                    ? `<span class="mini-pill paid">${escapeHtml((o.paymentMethod || 'online').toUpperCase())} PAID</span>`
                    : `<span class="mini-pill cod">COUNTER / COD</span>`;
                  const typeBadge = isParcel
                    ? `<span class="mini-pill parcel">${o.orderType === 'delivery' ? '🛵 DELIVERY' : '📦 PARCEL'}</span>`
                    : `<span class="mini-pill dine">🍽️ DINE-IN${o.tableId ? ' T' + o.tableId : ''}</span>`;
                  return `
            <div class="admin-row-card">
              <div>
                <strong>#${escapeHtml(o.id)} • ${escapeHtml(o.customerName)} (${escapeHtml(o.customerPhone)})</strong>
                <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin:0.3rem 0;">
                  ${typeBadge} ${payBadge} <strong style="color:var(--primary);">₹${o.total}</strong>
                  ${o.paymentId ? `<small class="muted">Ref: ${escapeHtml(o.paymentId)}</small>` : ''}
                  ${o.paymentProofImg ? `<a href="${escapeHtml(o.paymentProofImg)}" target="_blank" rel="noopener" class="mini-pill paid">📸 Payment SS</a>` : ''}
                  ${o.driverLocation?.lat ? `<a href="https://maps.google.com/?q=${Number(o.driverLocation.lat)},${Number(o.driverLocation.lng)}" target="_blank" rel="noopener" class="mini-pill dine">📍 Live Rider GPS</a>` : ''}
                </div>
                <div class="muted small">${o.items.map((i) => `${i.qty}× ${escapeHtml(i.name)}`).join(', ')}</div>
              </div>
              <div class="admin-controls-inline">
                <select class="adm-status-sel" data-id="${escapeHtml(o.id)}">
                  ${['confirmed', 'cooking', 'ready', 'served', 'cancelled'].map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
                <input type="number" class="adm-eta-input" data-id="${escapeHtml(o.id)}" value="${o.etaMinutes || 15}" min="0" max="120" style="width:65px;" title="ETA mins" />
                <button type="button" class="btn btn-primary btn-xs adm-save-order-btn" data-id="${escapeHtml(o.id)}">Save</button>
                <button type="button" class="btn btn-outline btn-xs view-bill-btn" data-id="${escapeHtml(o.id)}">🧾 Bill</button>
                <button type="button" class="btn btn-outline btn-xs edit-my-order-btn" data-id="${escapeHtml(o.id)}">Edit</button>
                <button type="button" class="btn btn-outline btn-xs adm-fake-order-btn" data-id="${escapeHtml(o.id)}" title="Hide fake/test order from Admin">Mark Fake</button>
                <button type="button" class="btn btn-danger btn-xs adm-del-order-btn" data-id="${escapeHtml(o.id)}">Delete</button>
              </div>
            </div>`;
                })
                .join('')
            : '<div class="admin-row-card"><span class="muted">No real orders in this filter yet.</span></div>'}
        </div>`;

      $('adminTabOrders').querySelectorAll('[data-aof]').forEach((btn) => {
        btn.addEventListener('click', () => {
          appState.adminOrderFilter = btn.dataset.aof;
          renderAdminDashboard();
        });
      });
      $('adminTabOrders').querySelectorAll('.adm-save-order-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const status = $('adminTabOrders').querySelector(`.adm-status-sel[data-id="${id}"]`).value;
          const etaMinutes = Number($('adminTabOrders').querySelector(`.adm-eta-input[data-id="${id}"]`).value);
          await api(`/api/orders/${id}`, 'PUT', { status, etaMinutes }, pinHeaders);
          showToast(`Order #${id} updated!`);
        });
      });
      $('adminTabOrders').querySelectorAll('.adm-fake-order-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await api(`/api/admin/orders/${btn.dataset.id}/fake`, 'POST', {}, pinHeaders);
          showToast('Marked as fake/test & hidden from Admin.');
          refreshSalesAndRenderAdmin();
        });
      });
      $('adminTabOrders').querySelectorAll('.adm-del-order-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await api(`/api/admin/orders/${btn.dataset.id}`, 'DELETE', null, pinHeaders);
          showToast('Order deleted.');
        });
      });
    }

    // 2. MENU MANAGER TAB (Full Add / Auto-Photo / Edit Name, Price, Category, Flags, Sold-Out / Delete)
    if (activeAdminTab === 'menu') {
      const cats = ['veg-prep', 'kaju-prep', 'cheese-prep', 'tandoor', 'south-indian', 'chinese', 'punjabi', 'fast-food', 'beverages'];
      $('adminTabMenu').innerHTML = `
        <form id="admAddDishForm" class="admin-row-card" style="margin-bottom:1rem;background:var(--surface);">
          <strong style="width:100%;">➕ Add New Dish <small class="muted" style="font-weight:500;">(Photo Upload karein, URL daalein, ya khali chhodein to automatic photo ban kar add hogi!)</small></strong>
          <div class="admin-controls-inline" style="width:100%;">
            <input type="text" id="newDishName" placeholder="Dish Name *" required />
            <input type="number" id="newDishPrice" placeholder="Price ₹ *" required style="width:85px;" />
            <input type="number" id="newDishDisc" placeholder="% OFF" value="10" min="0" max="80" style="width:72px;" title="Discount % OFF" />
            <select id="newDishCat">
              <option value="veg-prep">Veg Preparation</option>
              <option value="kaju-prep">Kaju Preparation</option>
              <option value="cheese-prep">Cheese Preparation</option>
              <option value="tandoor">Tandoor, Roti &amp; Naan</option>
              <option value="south-indian">South Indian Dosas</option>
              <option value="chinese">Indo-Chinese</option>
              <option value="punjabi">Punjabi</option>
              <option value="fast-food">Fast Food</option>
              <option value="beverages">Beverages</option>
            </select>
            <input type="text" id="newDishEmoji" value="🍲" style="width:55px;" />
            <input type="text" id="newDishServed" placeholder="Saath Mein Milega (e.g. Chutney &amp; Salad)" style="flex:1;min-width:170px;" />
            <input type="text" id="newDishDesc" placeholder="Description" style="flex:1;min-width:160px;" />
            <input type="url" id="newDishImg" placeholder="Photo URL (Optional — auto if empty)" style="flex:1;min-width:180px;" />
            <label class="btn btn-outline btn-xs" style="cursor:pointer;">
              📁 Choose Photo <input type="file" id="newDishFile" accept="image/*" style="display:none;" />
            </label>
            <span id="newDishFileLabel" class="small muted"></span>
            <label class="small"><input type="checkbox" id="newDishBest" /> ⭐ Best</label>
            <label class="small"><input type="checkbox" id="newDishSpicy" /> 🌶️ Spicy</label>
            <button type="submit" class="btn btn-primary btn-sm" id="admAddDishSubmitBtn">Add Dish + Photo</button>
          </div>
        </form>
        <div class="admin-row-card" style="margin-bottom:0.75rem;background:var(--surface-alt);justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
          <strong>🏷️ All Dishes Discount (% OFF — Auto Sends Alert to Everyone!)</strong>
          <div class="admin-controls-inline">
            <input type="number" id="admBulkDiscInput" value="15" min="0" max="80" style="width:78px;" />
            <span class="small muted">% OFF on all</span>
            <button type="button" class="btn btn-primary btn-xs" id="admBulkDiscBtn">Apply &amp; Notify Everyone</button>
          </div>
        </div>
        <form id="admManualNotifForm" class="admin-row-card" style="margin-bottom:1rem;background:var(--surface);flex-wrap:wrap;gap:0.5rem;">
          <strong>📢 Send Custom Offer Notice to All Phones &amp; Browsers</strong>
          <div class="admin-controls-inline" style="width:100%;">
            <input type="text" id="admNotifTitle" placeholder="Alert Title (e.g. 🎉 Sunday Special 20% OFF!)" style="flex:1;min-width:170px;" required />
            <input type="text" id="admNotifBody" placeholder="Message (e.g. Aaj raat sabhi Paneer dishes par 20% OFF)" style="flex:1.4;min-width:200px;" required />
            <button type="submit" class="btn btn-primary btn-xs">🔔 Send Notice to All</button>
          </div>
        </form>
        <div class="admin-grid-list">
          ${appState.menu
            .map(
              (m) => {
                const thumbSrc = getDishImage(m);
                const thumbHtml = thumbSrc
                  ? `<img src="${escapeHtml(thumbSrc)}" alt="" style="width:48px;height:40px;object-fit:cover;border-radius:8px;flex-shrink:0;border:1px solid #d1d5db;" />`
                  : `<div style="width:48px;height:40px;border-radius:8px;background:#f3f4f6;border:1px dashed #9ca3af;display:grid;place-items:center;font-size:1.1rem;flex-shrink:0;" title="Photo Deleted">${escapeHtml(m.emoji)}</div>`;
                const curDisc = Number(m.discountPct ?? (m.bestseller ? 15 : 10));
                return `
            <div class="admin-row-card" style="flex-direction:column;align-items:stretch;gap:0.55rem;">
              <div class="admin-controls-inline" style="width:100%;">
                ${thumbHtml}
                <input type="text" class="adm-demoji" data-id="${escapeHtml(m.id)}" value="${escapeHtml(m.emoji)}" style="width:44px;text-align:center;" />
                <input type="text" class="adm-dname" data-id="${escapeHtml(m.id)}" value="${escapeHtml(m.name)}" style="min-width:140px;flex:1;" />
                <select class="adm-dcat" data-id="${escapeHtml(m.id)}">
                  ${cats.map((c) => `<option value="${c}" ${m.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
                <span>₹</span>
                <input type="number" class="adm-price-input" data-id="${escapeHtml(m.id)}" value="${m.price}" style="width:72px;" />
                <input type="number" class="adm-ddisc" data-id="${escapeHtml(m.id)}" value="${curDisc}" min="0" max="80" style="width:60px;" title="Discount %" />
                <span class="small muted">%</span>
              </div>
              <div class="admin-controls-inline" style="width:100%;justify-content:space-between;">
                <div class="admin-controls-inline" style="flex:1;">
                  <input type="text" class="adm-dimg" data-id="${escapeHtml(m.id)}" value="${m.image === '__NONE__' ? '' : escapeHtml(m.image || '')}" placeholder="Photo path or URL..." style="flex:1;min-width:160px;" />
                  <label class="btn btn-outline btn-xs" style="cursor:pointer;" title="Upload new photo from device">
                    📁 Upload Photo <input type="file" accept="image/*" class="adm-photo-file" data-id="${escapeHtml(m.id)}" style="display:none;" />
                  </label>
                  <button type="button" class="btn btn-outline btn-xs adm-auto-photo-btn" data-id="${escapeHtml(m.id)}" title="Auto fetch fresh dish photo">✨ Auto Photo</button>
                  <button type="button" class="btn btn-danger btn-xs adm-del-photo-btn" data-id="${escapeHtml(m.id)}" title="Delete dish photo">🗑️ Del Photo</button>
                </div>
                <div class="admin-controls-inline">
                  <button type="button" class="btn btn-primary btn-xs adm-save-dish-btn" data-id="${escapeHtml(m.id)}">Save</button>
                  <button type="button" class="btn btn-outline btn-xs adm-toggle-avail-btn" data-id="${escapeHtml(m.id)}">${m.available === false ? 'Enable' : 'Sold Out'}</button>
                  <button type="button" class="btn btn-danger btn-xs adm-del-dish-btn" data-id="${escapeHtml(m.id)}" title="Delete full dish">✕</button>
                </div>
              </div>
            </div>`;
              }
            )
            .join('')}
        </div>`;

      let pendingNewDishFile = null;
      $('newDishFile')?.addEventListener('change', () => {
        pendingNewDishFile = $('newDishFile').files?.[0] || null;
        if ($('newDishFileLabel')) $('newDishFileLabel').textContent = pendingNewDishFile ? `📎 ${pendingNewDishFile.name}` : '';
      });

      $('admBulkDiscBtn')?.addEventListener('click', async () => {
        const discountPct = Number($('admBulkDiscInput')?.value || 0);
        try {
          const res = await api('/api/admin/menu/bulk-discount', 'POST', { discountPct }, pinHeaders);
          if (res?.state) { applySnapshot(res.state); persistSnapshotToCache(res.state); }
          showToast(`Updated ${discountPct}% OFF & sent alert to everyone! 🔔`);
        } catch (err) {
          showToast(err.message);
        }
      });

      $('admManualNotifForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const res = await api('/api/admin/notify', 'POST', {
            title: $('admNotifTitle').value.trim(),
            body: $('admNotifBody').value.trim(),
            type: 'offer'
          }, pinHeaders);
          $('admManualNotifForm').reset();
          if (res?.state) { applySnapshot(res.state); persistSnapshotToCache(res.state); }
          showToast('📢 Notification sent to all phones & browsers!');
        } catch (err) {
          showToast(err.message);
        }
      });

      $('admAddDishForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = $('admAddDishSubmitBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Adding + Saving Photo...'; }
        try {
          const res = await api('/api/admin/menu', 'POST', {
            item: {
              name: $('newDishName').value.trim(),
              price: Number($('newDishPrice').value),
              discountPct: Number($('newDishDisc')?.value || 10),
              category: $('newDishCat').value,
              emoji: $('newDishEmoji').value || '🍲',
              servedWith: $('newDishServed').value.trim(),
              desc: $('newDishDesc').value.trim(),
              image: $('newDishImg').value.trim(),
              bestseller: $('newDishBest').checked,
              spicy: $('newDishSpicy').checked
            }
          }, pinHeaders);
          const createdDish = res?.menu?.[0];
          if (pendingNewDishFile && createdDish?.id) {
            const dataUrl = await compressImageFile(pendingNewDishFile);
            await api('/api/admin/upload-dish-photo', 'POST', { dishId: createdDish.id, dataUrl, filename: pendingNewDishFile.name }, pinHeaders);
          }
          pendingNewDishFile = null;
          showToast('New dish added with photo! 📸');
        } catch (err) {
          showToast(err.message);
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = 'Add Dish + Photo'; }
        }
      });

      $('adminTabMenu').querySelectorAll('.adm-save-dish-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const dish = appState.menu.find((m) => m.id === id);
          const name = $('adminTabMenu').querySelector(`.adm-dname[data-id="${id}"]`).value.trim();
          const emoji = $('adminTabMenu').querySelector(`.adm-demoji[data-id="${id}"]`).value.trim();
          const category = $('adminTabMenu').querySelector(`.adm-dcat[data-id="${id}"]`).value;
          const price = Number($('adminTabMenu').querySelector(`.adm-price-input[data-id="${id}"]`).value);
          const discountPct = Number($('adminTabMenu').querySelector(`.adm-ddisc[data-id="${id}"]`)?.value || 0);
          const imgVal = $('adminTabMenu').querySelector(`.adm-dimg[data-id="${id}"]`).value.trim();
          const image = imgVal === '' ? '__NONE__' : imgVal;
          const res = await api('/api/admin/menu', 'POST', { item: { ...dish, name, emoji, category, price, discountPct, image } }, pinHeaders);
          if (res?.state) { applySnapshot(res.state); persistSnapshotToCache(res.state); }
          showToast(`Saved ${name} (₹${price}, ${discountPct}% OFF)`);
        });
      });

      $('adminTabMenu').querySelectorAll('.adm-photo-file').forEach((inp) => {
        inp.addEventListener('change', async () => {
          const file = inp.files?.[0];
          const id = inp.dataset.id;
          if (!file || !id) return;
          try {
            showToast('Uploading dish photo...');
            const dataUrl = await compressImageFile(file);
            await api('/api/admin/upload-dish-photo', 'POST', { dishId: id, dataUrl, filename: file.name }, pinHeaders);
            showToast('Dish photo updated! 📸');
          } catch (err) {
            showToast(err.message || 'Upload failed');
          }
        });
      });

      $('adminTabMenu').querySelectorAll('.adm-auto-photo-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          btn.disabled = true;
          btn.textContent = 'Finding...';
          try {
            await api(`/api/admin/menu/${id}/auto-photo`, 'POST', {}, pinHeaders);
            showToast('Fresh dish photo set automatically! ✨');
          } catch (err) {
            showToast(err.message);
          } finally {
            btn.disabled = false;
            btn.textContent = '✨ Auto Photo';
          }
        });
      });

      $('adminTabMenu').querySelectorAll('.adm-del-photo-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            await api(`/api/admin/menu/${id}/photo`, 'DELETE', null, pinHeaders);
            showToast('Dish photo deleted! 🗑️');
          } catch (err) {
            showToast(err.message);
          }
        });
      });

      $('adminTabMenu').querySelectorAll('.adm-toggle-avail-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const dish = appState.menu.find((m) => m.id === btn.dataset.id);
          await api('/api/admin/menu', 'POST', { item: { ...dish, available: dish.available === false } }, pinHeaders);
          showToast('Availability updated.');
        });
      });

      $('adminTabMenu').querySelectorAll('.adm-del-dish-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await api(`/api/admin/menu/${btn.dataset.id}`, 'DELETE', null, pinHeaders);
          showToast('Dish deleted.');
        });
      });
    }

    // 2B. VIDEO & PHOTO ADS MANAGER TAB
    if (activeAdminTab === 'ads') {
      const adsList = appState.ads || [];
      $('adminTabAds').innerHTML = `
        <form id="admUploadAdForm" class="admin-row-card" style="margin-bottom:1rem;background:var(--surface);flex-direction:column;align-items:stretch;gap:0.65rem;">
          <strong>🎬 Upload Video Ad (MP4/WebM/MOV) ya Photo Ad (JPG/PNG) — Direct Hero Ads Mein Chalegi!</strong>
          <div class="admin-controls-inline" style="width:100%;">
            <input type="text" id="newAdTitle" placeholder="Ad Title (e.g. Today's Paneer Sizzler Video)" style="flex:1;min-width:170px;" required />
            <select id="newAdLinkedDish" style="max-width:200px;">
              ${appState.menu.map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)} (₹${m.price})</option>`).join('')}
            </select>
          </div>
          <div class="admin-controls-inline" style="width:100%;">
            <label class="btn btn-outline btn-sm" style="cursor:pointer;">
              📁 Choose Video / Photo File <input type="file" id="newAdFile" accept="video/mp4,video/webm,video/quicktime,image/*" style="display:none;" />
            </label>
            <span id="newAdFileLabel" class="small muted">No file chosen</span>
            <input type="url" id="newAdUrl" placeholder="Or paste YouTube / Video (.mp4) / Photo URL..." style="flex:1;min-width:180px;" />
            <button type="submit" class="btn btn-primary btn-sm" id="admAddAdSubmitBtn">+ Add &amp; Play in Ads</button>
          </div>
        </form>
        <div class="admin-grid-list">
          ${adsList.length === 0 ? '<p class="muted">No custom video/photo ads yet. Upload one above!</p>' : adsList.map((a) => `
            <div class="admin-row-card" style="justify-content:space-between;gap:0.75rem;">
              <div class="admin-controls-inline" style="flex:1;min-width:0;">
                ${a.type === 'youtube'
                  ? `<div style="width:72px;height:54px;border-radius:8px;background:#b91c1c;color:#fff;display:grid;place-items:center;font-weight:800;font-size:0.75rem;flex-shrink:0;">▶ YT</div>`
                  : a.type === 'video'
                  ? `<video src="${escapeHtml(a.url)}" muted playsinline style="width:72px;height:54px;object-fit:cover;border-radius:8px;background:#000;flex-shrink:0;"></video>`
                  : `<img src="${escapeHtml(a.url)}" alt="" style="width:72px;height:54px;object-fit:cover;border-radius:8px;flex-shrink:0;" />`}
                <div style="min-width:0;flex:1;">
                  <strong>${a.type === 'youtube' ? '📺 YOUTUBE AD' : a.type === 'video' ? '🎬 VIDEO AD' : '📸 PHOTO AD'}: ${escapeHtml(a.title)}</strong>
                  <div class="muted small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(a.url)}</div>
                </div>
              </div>
              <div class="admin-controls-inline">
                <button type="button" class="btn btn-outline btn-xs adm-toggle-ad-btn" data-id="${escapeHtml(a.id)}">${a.active === false ? '▶ Enable' : '⏸ Pause'}</button>
                <button type="button" class="btn btn-danger btn-xs adm-del-ad-btn" data-id="${escapeHtml(a.id)}">🗑️ Delete</button>
              </div>
            </div>
          `).join('')}
        </div>`;

      $('newAdFile')?.addEventListener('change', () => {
        const f = $('newAdFile').files?.[0];
        if ($('newAdFileLabel')) $('newAdFileLabel').textContent = f ? `📎 ${f.name} (${(f.size / 1048576).toFixed(1)} MB)` : 'No file chosen';
      });

      $('admUploadAdForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = $('newAdFile')?.files?.[0];
        const url = $('newAdUrl')?.value.trim();
        const title = $('newAdTitle')?.value.trim() || 'Chatkaro Special Ad';
        const linkedDishId = $('newAdLinkedDish')?.value || 'veg-angara';
        const btn = $('admAddAdSubmitBtn');
        if (!file && !url) return showToast('Please choose a Video/Photo file or paste a URL!');
        if (btn) { btn.disabled = true; btn.textContent = 'Uploading...'; }
        try {
          if (file) {
            const res = await fetch('/api/admin/upload-ad-media', {
              method: 'POST',
              headers: {
                ...pinHeaders,
                'Content-Type': 'application/octet-stream',
                'X-File-Name': encodeURIComponent(file.name),
                'X-Ad-Title': encodeURIComponent(title),
                'X-Media-Type': file.type || '',
                'X-Linked-Dish': linkedDishId
              },
              body: file
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
          } else {
            await api('/api/admin/ads', 'POST', { ad: { title, url, linkedDishId } }, pinHeaders);
          }
          showToast('Ad added & playing live! 🎬');
        } catch (err) {
          showToast(err.message);
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = '+ Add & Play in Ads'; }
        }
      });

      $('adminTabAds').querySelectorAll('.adm-toggle-ad-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const ad = (appState.ads || []).find((x) => x.id === btn.dataset.id);
          if (!ad) return;
          await api('/api/admin/ads', 'POST', { ad: { ...ad, active: ad.active === false } }, pinHeaders);
          showToast(ad.active === false ? 'Ad enabled!' : 'Ad paused.');
        });
      });

      $('adminTabAds').querySelectorAll('.adm-del-ad-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await api(`/api/admin/ads/${btn.dataset.id}`, 'DELETE', null, pinHeaders);
          showToast('Ad deleted! 🗑️');
        });
      });
    }

    // 3. TABLES & CUSTOMERS CRUD TAB
    if (activeAdminTab === 'tables') {
      $('adminTabTables').innerHTML = `
        <div class="admin-row-card" style="margin-bottom:0.85rem;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
          <strong>🛎️ Live Waiter Calls (${(appState.waiterCalls || []).filter((c) => c.status === 'ringing').length} ringing now)</strong>
          <a href="waiter.html" target="_blank" class="btn btn-primary btn-xs">🛎️ Open Waiter Bell App</a>
        </div>
        <form id="admAddTableForm" class="admin-row-card" style="margin-bottom:1rem;background:var(--surface);">
          <strong>➕ Add Hotel Table</strong>
          <div class="admin-controls-inline">
            <input type="text" id="newTblLabel" placeholder="Table Name (e.g. Table 9 VIP)" required />
            <input type="number" id="newTblSeats" value="4" min="1" max="20" style="width:70px;" />
            <input type="text" id="newTblPhoto" placeholder="Photo URL (Optional)" style="min-width:150px;" />
            <button type="submit" class="btn btn-primary btn-sm">Add Table</button>
          </div>
        </form>
        <div class="admin-grid-list" style="margin-bottom:1.2rem;">
          ${appState.tables
            .map(
              (t) => `
            <div class="admin-row-card" style="flex-direction:column;align-items:stretch;gap:0.5rem;">
              <div class="admin-controls-inline" style="justify-content:space-between;">
                <div class="admin-controls-inline">
                  <img src="${escapeHtml(t.photo || 'assets/tables/table-4seat.jpg')}" alt="" style="width:56px;height:42px;border-radius:8px;object-fit:cover;border:1px solid #d1d5db;" />
                  <input type="text" class="adm-tlabel" data-tid="${t.id}" value="${escapeHtml(t.label)}" style="width:130px;" />
                  <input type="number" class="adm-tseats" data-tid="${t.id}" value="${t.seats}" style="width:60px;" />
                  <span class="muted small">${t.status === 'occupied' ? 'Occupied: ' + escapeHtml(t.occupantName) : 'Available'}</span>
                </div>
                <div class="admin-controls-inline">
                  <button type="button" class="btn btn-outline btn-xs adm-tbl-qr-btn" data-tid="${t.id}">📱 Table QR</button>
                  <button type="button" class="btn btn-primary btn-xs adm-save-tbl-btn" data-tid="${t.id}">Save</button>
                  ${t.status === 'occupied' ? `<button type="button" class="btn btn-outline btn-xs adm-clear-tbl-btn" data-tid="${t.id}">Clear</button>` : ''}
                  <button type="button" class="btn btn-danger btn-xs adm-del-tbl-btn" data-tid="${t.id}">✕</button>
                </div>
              </div>
              <div class="admin-controls-inline">
                <input type="text" class="adm-tphoto" data-tid="${t.id}" value="${escapeHtml(t.photo || '')}" placeholder="Table photo path or URL..." style="flex:1;min-width:160px;" />
                <label class="btn btn-outline btn-xs" style="cursor:pointer;">
                  📷 Upload Photo <input type="file" accept="image/*" class="adm-tphoto-file" data-tid="${t.id}" style="display:none;" />
                </label>
              </div>
            </div>`
            )
            .join('')}
        </div>
        <h3>👥 Customers, Gmail Profiles &amp; Complete Purchase History</h3>
        <div class="admin-grid-list">
          ${appState.customersAll
            .map((c) => {
              const custOrders = appState.orders.filter((o) => o.customerEmail === c.email && !o.isFake);
              const avSrc = c.picture || buildGmailInitialAvatar(c.name, c.avatarColor || '#dc2626');
              return `
            <div class="admin-row-card" style="flex-direction:column;align-items:stretch;gap:0.45rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
                <div style="display:flex;align-items:center;gap:0.6rem;">
                  <img src="${escapeHtml(avSrc)}" alt="" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:1.5px solid #22c55e;" />
                  <div>
                    <strong>${escapeHtml(c.name)}</strong> <span class="muted small">(${escapeHtml(c.email)}) ${c.phone ? '• 📞 ' + escapeHtml(c.phone) : ''}</span>
                    <div class="muted small">Orders: ${c.ordersCount} • Total Spent: ₹${c.totalSpent} • Game Best: ${c.bestGameScore || 0}</div>
                  </div>
                </div>
                <div class="admin-controls-inline">
                  <button type="button" class="btn btn-outline btn-xs adm-toggle-chist-btn" data-email="${escapeHtml(c.email)}">📜 History (${custOrders.length})</button>
                  <input type="number" class="adm-corders" data-email="${escapeHtml(c.email)}" value="${c.ordersCount}" style="width:60px;" title="Orders" />
                  <input type="number" class="adm-cscore" data-email="${escapeHtml(c.email)}" value="${c.bestGameScore || 0}" style="width:68px;" title="Game Score" />
                  <button type="button" class="btn btn-primary btn-xs adm-save-cust-btn" data-email="${escapeHtml(c.email)}">Save</button>
                  <button type="button" class="btn btn-danger btn-xs adm-del-cust-btn" data-email="${escapeHtml(c.email)}">Delete</button>
                </div>
              </div>
              <div class="hidden adm-cust-history-box" data-email="${escapeHtml(c.email)}" style="background:rgba(0,0,0,0.05);padding:0.55rem;border-radius:10px;font-size:0.78rem;">
                ${custOrders.length ? custOrders.map((co) => `
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:0.4rem;padding:0.25rem 0;border-bottom:1px dotted rgba(128,128,128,0.25);flex-wrap:wrap;">
                    <span><strong>#${escapeHtml(co.id)}</strong> (${new Date(co.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}) — ${co.items.map((i) => `${i.qty}× ${escapeHtml(i.name)}`).join(', ')}</span>
                    <span><strong>₹${co.total}</strong> <button type="button" class="btn btn-outline btn-xs view-bill-btn" data-id="${escapeHtml(co.id)}">🧾 Bill</button></span>
                  </div>`).join('') : '<span class="muted">No orders placed yet.</span>'}
              </div>
            </div>`;
            })
            .join('')}
        </div>`;

      $('admAddTableForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await api('/api/admin/tables', 'POST', {
          table: { label: $('newTblLabel').value.trim(), seats: Number($('newTblSeats').value), photo: $('newTblPhoto')?.value.trim() || undefined }
        }, pinHeaders);
        showToast('Table added!');
      });
      $('adminTabTables').querySelectorAll('.adm-tbl-qr-btn').forEach((btn) => {
        btn.addEventListener('click', () => openTableQrModal(btn.dataset.tid));
      });
      $('adminTabTables').querySelectorAll('.adm-save-tbl-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const tid = Number(btn.dataset.tid);
          const label = $('adminTabTables').querySelector(`.adm-tlabel[data-tid="${tid}"]`).value.trim();
          const seats = Number($('adminTabTables').querySelector(`.adm-tseats[data-tid="${tid}"]`).value);
          const photo = $('adminTabTables').querySelector(`.adm-tphoto[data-tid="${tid}"]`)?.value.trim();
          await api('/api/admin/tables', 'POST', { table: { id: tid, label, seats, photo } }, pinHeaders);
          showToast('Table updated!');
        });
      });
      $('adminTabTables').querySelectorAll('.adm-tphoto-file').forEach((inp) => {
        inp.addEventListener('change', async () => {
          const file = inp.files?.[0];
          const tableId = Number(inp.dataset.tid);
          if (!file || !tableId) return;
          try {
            showToast('Uploading table photo...');
            const dataUrl = await compressImageFile(file);
            await api('/api/admin/upload-table-photo', 'POST', { tableId, dataUrl }, pinHeaders);
            showToast('Table photo updated! 📸');
          } catch (err) {
            showToast(err.message);
          }
        });
      });
      $('adminTabTables').querySelectorAll('.adm-toggle-chist-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const box = $('adminTabTables').querySelector(`.adm-cust-history-box[data-email="${btn.dataset.email}"]`);
          if (box) box.classList.toggle('hidden');
        });
      });
      $('adminTabTables').querySelectorAll('.adm-clear-tbl-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const tbl = appState.tables.find((t) => t.id === Number(btn.dataset.tid));
          await api('/api/tables/checkin', 'POST', { tableId: tbl.id, email: tbl.occupantEmail, action: 'leave' });
          showToast('Table cleared!');
        });
      });
      $('adminTabTables').querySelectorAll('.adm-del-tbl-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await api(`/api/admin/tables/${btn.dataset.tid}`, 'DELETE', null, pinHeaders);
          showToast('Table deleted.');
        });
      });
      $('adminTabTables').querySelectorAll('.adm-save-cust-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const email = btn.dataset.email;
          const c = appState.customersAll.find((x) => x.email === email);
          const ordersCount = Number($('adminTabTables').querySelector(`.adm-corders[data-email="${email}"]`).value);
          const bestGameScore = Number($('adminTabTables').querySelector(`.adm-cscore[data-email="${email}"]`).value);
          await api('/api/admin/customers', 'POST', { customer: { ...c, ordersCount, bestGameScore } }, pinHeaders);
          showToast('Customer updated!');
        });
      });
      $('adminTabTables').querySelectorAll('.adm-del-cust-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await api(`/api/admin/customers/${encodeURIComponent(btn.dataset.email)}`, 'DELETE', null, pinHeaders);
          showToast('Customer deleted.');
        });
      });
    }

    // 4. GOOGLE MAPS PHOTOS CRUD TAB
    if (activeAdminTab === 'photos') {
      $('adminTabPhotos').innerHTML = `
        <form id="admAddPhotoForm" class="admin-row-card" style="margin-bottom:1rem;background:var(--surface);">
          <strong style="width:100%;">📸 Add Google Maps Photo (Upload File or Paste Image URL)</strong>
          <div class="admin-controls-inline" style="width:100%;">
            <input type="text" id="newPhotoTitle" placeholder="Photo Title (e.g. Special Masala Dosa) *" required style="flex:1;min-width:160px;" />
            <select id="newPhotoCat">
              <option value="food">Food &amp; Drink</option>
              <option value="vibe">Vibe</option>
              <option value="owner">By Owner</option>
            </select>
            <input type="url" id="newPhotoUrl" placeholder="Image URL (or upload file ->)" style="flex:1;min-width:180px;" />
            <input type="file" id="newPhotoFile" accept="image/*" style="max-width:210px;" />
            <button type="submit" class="btn btn-primary btn-sm">Add Photo</button>
          </div>
        </form>
        <div class="admin-grid-list">
          ${appState.mapPhotos
            .map(
              (p) => `
            <div class="admin-row-card">
              <div class="admin-controls-inline" style="flex:1;">
                <img src="${escapeHtml(p.url)}" alt="" style="width:60px;height:42px;object-fit:cover;border-radius:8px;" />
                <input type="text" class="adm-ptitle" data-pid="${escapeHtml(p.id)}" value="${escapeHtml(p.title)}" style="flex:1;min-width:150px;" />
                <select class="adm-pcat" data-pid="${escapeHtml(p.id)}">
                  ${['food', 'vibe', 'owner'].map((c) => `<option value="${c}" ${p.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>
              <div class="admin-controls-inline">
                <button type="button" class="btn btn-primary btn-xs adm-save-photo-btn" data-pid="${escapeHtml(p.id)}">Save</button>
                <button type="button" class="btn btn-danger btn-xs adm-del-photo-btn" data-pid="${escapeHtml(p.id)}">Delete</button>
              </div>
            </div>`
            )
            .join('')}
        </div>`;

      $('admAddPhotoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = $('newPhotoTitle').value.trim();
        const category = $('newPhotoCat').value;
        const file = $('newPhotoFile').files[0];
        let url = $('newPhotoUrl').value.trim();
        if (file) {
          url = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
        }
        if (!url) return showToast('Provide an image URL or choose a photo file.');
        await api('/api/admin/photos', 'POST', { photo: { title, category, url, uploader: 'By Owner • Google Maps' } }, pinHeaders);
        showToast('Photo added & live on website!');
      });

      $('adminTabPhotos').querySelectorAll('.adm-save-photo-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const pid = btn.dataset.pid;
          const p = appState.mapPhotos.find((x) => x.id === pid);
          const title = $('adminTabPhotos').querySelector(`.adm-ptitle[data-pid="${pid}"]`).value.trim();
          const category = $('adminTabPhotos').querySelector(`.adm-pcat[data-pid="${pid}"]`).value;
          await api('/api/admin/photos', 'POST', { photo: { ...p, title, category } }, pinHeaders);
          showToast('Photo updated!');
        });
      });
      $('adminTabPhotos').querySelectorAll('.adm-del-photo-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await api(`/api/admin/photos/${btn.dataset.pid}`, 'DELETE', null, pinHeaders);
          showToast('Photo deleted.');
        });
      });
    }

    // 5. REVIEWS & MAPS SYNC TAB
    if (activeAdminTab === 'reviews') {
      $('adminTabReviews').innerHTML = `
        <div class="admin-row-card" style="margin-bottom:1rem;background:var(--surface);">
          <div>
            <strong>📍 Google Maps Auto-Sync</strong>
            <div class="muted small">Pull latest Reviews, Rating, Hours &amp; Photos from Google Maps (if Places API Key configured)</div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="admSyncMapsBtn">🔄 Sync Google Maps Now</button>
        </div>
        <form id="admAddReviewForm" class="admin-row-card" style="margin-bottom:1rem;background:var(--surface);">
          <strong style="width:100%;">➕ Add Review / Map Update</strong>
          <div class="admin-controls-inline" style="width:100%;">
            <input type="text" id="admRevAuthor" placeholder="Reviewer Name *" required />
            <select id="admRevRating"><option value="5">5 ★</option><option value="4">4 ★</option><option value="3">3 ★</option></select>
            <input type="text" id="admRevText" placeholder="Review text *" required style="flex:1;min-width:200px;" />
            <button type="submit" class="btn btn-primary btn-sm">Add Review</button>
          </div>
        </form>
        <div class="admin-grid-list">
          ${appState.reviews
            .map(
              (r) => `
            <div class="admin-row-card">
              <div style="flex:1;">
                <strong>${escapeHtml(r.author)}</strong> (${r.rating}★) • <small class="muted">${escapeHtml(r.source)}</small>
                <div class="muted small">"${escapeHtml(r.text)}"</div>
              </div>
              <button type="button" class="btn btn-danger btn-xs adm-del-rev-btn" data-rid="${escapeHtml(r.id)}">Delete</button>
            </div>`
            )
            .join('')}
        </div>`;

      $('admSyncMapsBtn').addEventListener('click', () => $('syncMapsNowBtn').click());
      $('admAddReviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await api('/api/admin/reviews', 'POST', {
          review: { author: $('admRevAuthor').value.trim(), rating: Number($('admRevRating').value), text: $('admRevText').value.trim(), source: 'Google Maps' }
        }, pinHeaders);
        showToast('Review added live!');
      });
      $('adminTabReviews').querySelectorAll('.adm-del-rev-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await api(`/api/admin/reviews/${btn.dataset.rid}`, 'DELETE', null, pinHeaders);
          showToast('Review deleted.');
        });
      });
    }

    // 6. CHAT MODERATION TAB
    if (activeAdminTab === 'chat') {
      $('adminTabChat').innerHTML = `
        <form id="admOwnerChatForm" class="promo-row" style="margin-bottom:1rem;">
          <input type="text" id="admOwnerMsgInput" placeholder="Send official 👑 Owner announcement to Customer Lounge Chat..." required />
          <button type="submit" class="btn btn-primary btn-sm">Send as Owner</button>
        </form>
        <div class="admin-grid-list">
          ${appState.chatMessages
            .slice()
            .reverse()
            .map(
              (m) => `
            <div class="admin-row-card">
              <div>
                <strong>${m.isOwner ? '👑 ' : ''}${escapeHtml(m.senderName)}</strong> ${m.tableId ? `(Table ${m.tableId})` : ''}
                <div class="muted small">${escapeHtml(m.text)}</div>
              </div>
              <button type="button" class="btn btn-danger btn-xs adm-del-chat-btn" data-mid="${escapeHtml(m.id)}">Delete</button>
            </div>`
            )
            .join('')}
        </div>`;

      $('admOwnerChatForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await api('/api/chat', 'POST', {
          senderName: 'Chatkaro Owner',
          senderEmail: 'owner@chatkaro',
          isOwner: true,
          text: $('admOwnerMsgInput').value.trim()
        }, pinHeaders);
        $('admOwnerMsgInput').value = '';
        showToast('Owner message sent to lounge!');
      });
      $('adminTabChat').querySelectorAll('.adm-del-chat-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await api(`/api/admin/chat/${btn.dataset.mid}`, 'DELETE', null, pinHeaders);
          showToast('Chat message removed.');
        });
      });
    }

    // 7. OWNER APPS, BUILT APKs & STAFF SHARE HUB
    if (activeAdminTab === 'apps') {
      const s = appState.adminFullSettings || appState.settings || {};
      const origin = window.location.origin;
      const staffPin = s.staffPin || '1234';
      const toAbs = (rel) => (String(rel || '').startsWith('http') ? rel : `${origin}/${String(rel || '').replace(/^\/+/, '')}`);
      const appsList = [
        {
          id: 'delivery',
          icon: '🛵',
          title: 'Delivery Boy App (Amazon-Style)',
          desc: 'Live GPS sharing, Razorpay QR, PhonePe/UPI QR, Cash COD + Screenshot Proof upload & Customer Chat.',
          apkUrl: toAbs(s.deliveryApkUrl || 'assets/app/Chatkaro-Delivery.apk'),
          webUrl: `${origin}/delivery.html`,
          apkFileName: 'Chatkaro-Delivery.apk',
          pinNote: `Staff PIN: ${staffPin}`
        },
        {
          id: 'waiter',
          icon: '🛎️',
          title: 'Waiter Bell & Table Service App',
          desc: 'Instant ringtone bell alerts for water, tissue, spoon, bill, table QR orders & live customer chat.',
          apkUrl: toAbs(s.waiterApkUrl || 'assets/app/Chatkaro-Waiter.apk'),
          webUrl: `${origin}/waiter.html`,
          apkFileName: 'Chatkaro-Waiter.apk',
          pinNote: `Staff PIN: ${staffPin}`
        },
        {
          id: 'customer',
          icon: '🍲',
          title: 'Customer Food Ordering App',
          desc: 'Menu, Cart, Table QR menu, Live Amazon-Style GPS Tracking, Gmail OTP, Royal Het Bill & Games.',
          apkUrl: toAbs(s.apkDownloadUrl || 'assets/app/Chatkaro-Customer.apk'),
          webUrl: `${origin}/`,
          apkFileName: 'Chatkaro-Customer.apk',
          pinNote: 'No PIN needed for customers'
        }
      ];

      $('adminTabApps').innerHTML = `
        <h3>📱 Owner App Distribution Hub (.APK + QR + WhatsApp Share)</h3>
        <div class="admin-row-card" style="flex-wrap:wrap;gap:0.75rem;align-items:flex-end;">
          <div style="flex:1;min-width:210px;">
            <label class="small" style="display:block;font-weight:700;margin-bottom:0.25rem;">📲 Staff WhatsApp Number (optional — leave blank to pick contact)</label>
            <input type="tel" id="admAppSharePhone" placeholder="10-digit WhatsApp e.g. 9876543210" style="width:100%;" />
          </div>
          <div style="width:180px;">
            <label class="small" style="display:block;font-weight:700;margin-bottom:0.25rem;">🔑 Delivery & Waiter Staff PIN</label>
            <input type="text" id="admHubStaffPin" value="${escapeHtml(staffPin)}" style="width:100%;" />
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="admSaveHubPinBtn">Save Staff PIN</button>
          <label class="btn btn-outline btn-sm" style="cursor:pointer;margin:0;">
            📤 Upload Custom Customer .APK
            <input type="file" id="admHubApkUpload" accept=".apk,application/vnd.android.package-archive" hidden />
          </label>
        </div>

        <div class="apps-hub-grid">
          ${appsList
            .map(
              (a) => `
            <div class="app-dist-card">
              <div style="display:flex;align-items:center;gap:0.5rem;">
                <span style="font-size:1.5rem;">${a.icon}</span>
                <div>
                  <strong>${escapeHtml(a.title)}</strong>
                  <div class="small muted">${escapeHtml(a.pinNote)}</div>
                </div>
              </div>
              <p class="small muted" style="margin:0.45rem 0;">${escapeHtml(a.desc)}</p>
              <div style="display:flex;justify-content:center;padding:0.5rem;background:#fff;border-radius:12px;margin:0.4rem 0;">
                <img class="app-qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=165x165&data=${encodeURIComponent(a.apkUrl)}" alt="${escapeHtml(a.title)} APK QR" />
              </div>
              <small class="muted" style="word-break:break-all;text-align:center;display:block;">Scan QR to install ${escapeHtml(a.apkFileName)}</small>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.4rem;margin-top:0.65rem;">
                <a href="${escapeHtml(a.apkUrl)}" download="${escapeHtml(a.apkFileName)}" class="btn btn-primary btn-xs" style="text-align:center;">⬇️ Download .APK</a>
                <a href="${escapeHtml(a.webUrl)}" target="_blank" rel="noopener" class="btn btn-outline btn-xs" style="text-align:center;">🚀 Open Web App</a>
                <button type="button" class="btn btn-outline btn-xs adm-wa-share-app-btn" data-app-id="${a.id}" style="grid-column:span 2;background:#16a34a;color:#fff;border-color:#16a34a;">💬 Share APK + PIN on WhatsApp</button>
              </div>
            </div>`
            )
            .join('')}
        </div>`;

      $('admSaveHubPinBtn')?.addEventListener('click', async () => {
        const nextPin = $('admHubStaffPin').value.trim();
        if (!nextPin) return showToast('Enter Staff PIN');
        try {
          const res = await api('/api/admin/settings', 'POST', { settings: { staffPin: nextPin } }, pinHeaders);
          appState.adminFullSettings = { ...(appState.adminFullSettings || {}), staffPin: nextPin };
          if (res?.state) { applySnapshot(res.state); persistSnapshotToCache(res.state); }
          showToast(`✅ Staff PIN updated to ${nextPin}`);
          renderAdminDashboard();
        } catch (err) {
          showToast(err.message);
        }
      });

      $('admHubApkUpload')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const r = await fetch('/api/admin/upload-apk', {
            method: 'POST',
            headers: {
              ...pinHeaders,
              'Content-Type': 'application/octet-stream',
              'x-file-name': encodeURIComponent(file.name)
            },
            body: file
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || 'APK upload failed');
          if (data.state) { applySnapshot(data.state); persistSnapshotToCache(data.state); }
          showToast('✅ Customer .APK uploaded & updated!');
          renderAdminDashboard();
        } catch (err) {
          showToast(err.message);
        }
      });

      $('adminTabApps').querySelectorAll('.adm-wa-share-app-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const appObj = appsList.find((x) => x.id === btn.dataset.appId);
          if (!appObj) return;
          const livePin = $('admHubStaffPin')?.value.trim() || staffPin;
          const rawPhone = ($('admAppSharePhone')?.value || '').replace(/\D/g, '');
          const waTarget = rawPhone.length >= 10 ? (rawPhone.length === 10 ? '91' + rawPhone : rawPhone) : '';
          const msg =
            appObj.id === 'customer'
              ? `👑 *${appState.settings.restaurantName || 'CHATKARO FOOD HUB'} — Customer App*\n📲 Download Android APK: ${appObj.apkUrl}\n🌐 Web App: ${appObj.webUrl}\nOrder fresh veg food, track live delivery & get official Het bill!`
              : `${appObj.icon} *${appState.settings.restaurantName || 'CHATKARO FOOD HUB'} — ${appObj.title}*\n📲 Download Android APK: ${appObj.apkUrl}\n🌐 Open directly in Chrome: ${appObj.webUrl}\n🔑 Staff Login PIN: *${livePin}*`;
          window.open(`https://wa.me/${waTarget}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
        });
      });
    }

    // 8. LIVE WEBSITE COLORS & SETTINGS TAB
    if (activeAdminTab === 'colors') {
      const bt = appState.settings.brandTheme || COLOR_PRESETS['greenrush-3d'];
      const s = appState.adminFullSettings || appState.settings;
      $('adminTabColors').innerHTML = `
        <h3>🎨 Live Website Color Studio (Visible to All Visitors Instantly!)</h3>
        <div class="color-presets-grid">
          ${Object.entries(COLOR_PRESETS)
            .map(
              ([key, p]) => `
            <button type="button" class="preset-btn" data-preset="${key}">
              <span class="preset-swatch" style="background:${p.primary};"></span>
              <span class="preset-swatch" style="background:${p.bg};"></span>
              ${p.label}
            </button>`
            )
            .join('')}
        </div>
        <form id="admColorForm">
          <div class="color-picker-grid">
            <label class="color-field">Primary Color <input type="color" id="colPrimary" value="${bt.primary}" /></label>
            <label class="color-field">Accent Glow <input type="color" id="colAccent" value="${bt.accent}" /></label>
            <label class="color-field">Background <input type="color" id="colBg" value="${bt.bg}" /></label>
            <label class="color-field">Card Surface <input type="color" id="colSurface" value="${bt.surface}" /></label>
            <label class="color-field">Text Color <input type="color" id="colText" value="${bt.text}" /></label>
            <label class="color-field">Visual FX &amp; Glow <input type="checkbox" id="colFx" ${bt.fxEnabled !== false ? 'checked' : ''} /></label>
          </div>
          <button type="submit" class="btn btn-primary">Apply Colors to Live Website →</button>
        </form>
        <hr style="border:none;border-top:1px dashed var(--border);margin:1.3rem 0;" />
        <h3>⚙️ Restaurant, Gateways (Razorpay &amp; PhonePe), Gemini AI &amp; Gmail Login</h3>
        <form id="admSettingsForm" class="stack-form">
          <div class="two-col">
            <div><label>Restaurant Name</label><input type="text" id="admRestName" value="${escapeHtml(s.restaurantName || '')}" /></div>
            <div><label>Owner / Proprietor Full Name (Printed on Royal Bills)</label><input type="text" id="admOwnerName" value="${escapeHtml(s.ownerName || 'Het')}" placeholder="Het" /></div>
          </div>
          <label>Price Range</label>
          <input type="text" id="admPriceRange" value="${escapeHtml(s.priceRange || '')}" />
          <label>Top Announcement Banner</label>
          <input type="text" id="admAnnounce" value="${escapeHtml(s.announcement || '')}" />
          <label>Today’s Special Combo Deal</label>
          <input type="text" id="admDailyDeal" value="${escapeHtml(s.dailyDeal || '')}" />
          <div class="two-col">
            <div><label>Opening Hours Text</label><input type="text" id="admHours" value="${escapeHtml(s.openHoursText || '')}" /></div>
            <div><label>WhatsApp Number (91...)</label><input type="text" id="admPhone" value="${escapeHtml(s.phone || '919054633908')}" /></div>
          </div>
          <label>Instagram Handle (@username)</label>
          <input type="text" id="admInstaHandle" value="${escapeHtml(s.instagramHandle || 'chatkaro_the_food_hub')}" placeholder="chatkaro_the_food_hub" />
          <label>Instagram Reels URLs (One per line — auto plays in Hero Ads &amp; Reels Showcase)</label>
          <textarea id="admInstaReels" rows="2" placeholder="https://www.instagram.com/reels/DeoG7QDA2O3/">${escapeHtml(s.instagramReels || '')}</textarea>
          <label>Address</label>
          <input type="text" id="admAddress" value="${escapeHtml(s.address || '')}" />

          <hr style="border:none;border-top:1px dashed var(--border);margin:0.8rem 0;" />
          <strong>💳 Razorpay &amp; PhonePe Payment Gateways</strong>
          <div class="two-col">
            <div><label>Merchant UPI ID (Instant PhonePe / UPI QR)</label><input type="text" id="admMerchantUpi" value="${escapeHtml(s.merchantUpiId || '')}" placeholder="e.g. 9054633908@ybl" /></div>
            <div><label>Razorpay Key ID</label><input type="text" id="admRzpKeyId" value="${escapeHtml(s.razorpayKeyId || '')}" placeholder="rzp_test_... / rzp_live_..." /></div>
          </div>
          <label>Razorpay Key Secret</label>
          <input type="password" id="admRzpSecret" value="${escapeHtml(s.razorpayKeySecret || '')}" placeholder="Razorpay Secret Key" />
          <div class="two-col">
            <div><label>PhonePe Merchant ID (PG)</label><input type="text" id="admPpMerchantId" value="${escapeHtml(s.phonepeMerchantId || '')}" placeholder="PGTESTPAYUAT / Merchant ID" /></div>
            <div><label>PhonePe Salt Key</label><input type="password" id="admPpSaltKey" value="${escapeHtml(s.phonepeSaltKey || '')}" placeholder="PhonePe Salt Key" /></div>
          </div>
          <div class="two-col">
            <div><label>PhonePe Salt Index</label><input type="text" id="admPpSaltIndex" value="${escapeHtml(s.phonepeSaltIndex || '1')}" /></div>
            <div><label>PhonePe Environment</label>
              <select id="admPpEnv">
                <option value="sandbox" ${(s.phonepeEnv || 'sandbox') === 'sandbox' ? 'selected' : ''}>Sandbox (Testing)</option>
                <option value="production" ${s.phonepeEnv === 'production' ? 'selected' : ''}>Production (Live)</option>
              </select>
            </div>
          </div>

          <hr style="border:none;border-top:1px dashed var(--border);margin:0.8rem 0;" />
          <strong>🎵 Shop Background YouTube Music (Continuous Audio Loop)</strong>
          <div class="two-col">
            <div><label>YouTube Song / MP3 Link (Watch / Share / Shorts URL)</label><input type="text" id="admMusicUrl" value="${escapeHtml(s.bgMusicUrl || '')}" placeholder="https://www.youtube.com/watch?v=... or MP3 URL" /></div>
            <div><label>Song Display Name</label><input type="text" id="admMusicTitle" value="${escapeHtml(s.bgMusicTitle || 'Calm Cafe Music')}" placeholder="e.g. Lofi Instrumental" /></div>
          </div>
          <div class="admin-controls-inline" style="justify-content:space-between;margin-top:0.2rem;">
            <label class="small" style="display:flex;align-items:center;gap:0.45rem;">
              <input type="checkbox" id="admMusicEnabled" ${s.bgMusicEnabled !== false ? 'checked' : ''} style="width:auto;" />
              🎵 Play song for all shop visitors
            </label>
            <button type="button" class="btn btn-primary btn-xs" id="admQuickSaveMusicBtn">▶ Save &amp; Play Song Now</button>
          </div>
          ${s.bgMusicVideoId ? `<small class="muted">✅ Active Song ID: <code>${escapeHtml(s.bgMusicVideoId)}</code></small>` : ''}

          <hr style="border:none;border-top:1px dashed var(--border);margin:0.8rem 0;" />
          <strong>🎬 Website Background YouTube Video (Visible Everywhere, Continuous Loop)</strong>
          <div>
            <label>YouTube Background Video / MP4 Link (Watch / Share / Shorts / Playlist URL)</label>
            <input type="text" id="admBgVideoUrl" value="${escapeHtml(s.bgVideoUrl || '')}" placeholder="https://www.youtube.com/watch?v=... or youtu.be/..." />
          </div>
          <div class="admin-controls-inline" style="justify-content:space-between;margin-top:0.2rem;">
            <label class="small" style="display:flex;align-items:center;gap:0.45rem;">
              <input type="checkbox" id="admBgVideoEnabled" ${s.bgVideoEnabled !== false ? 'checked' : ''} style="width:auto;" />
              🎬 Show looping video behind shop on all phones &amp; PCs
            </label>
            <button type="button" class="btn btn-primary btn-xs" id="admQuickSaveVideoBtn">▶ Save &amp; Play Video Now</button>
          </div>
          ${s.bgVideoVideoId ? `<small class="muted">✅ Active Background Video ID: <code>${escapeHtml(s.bgVideoVideoId)}</code></small>` : ''}

          <hr style="border:none;border-top:1px dashed var(--border);margin:0.8rem 0;" />
          <strong>📲 Customer Mobile App (.APK Download Optional — WebApp Install Always Active)</strong>
          <div class="admin-controls-inline" style="width:100%;">
            <input type="text" id="admApkUrl" value="${escapeHtml(s.apkDownloadUrl || '')}" placeholder="Optional direct .apk URL or upload .apk below..." style="flex:1;min-width:180px;" />
            <label class="btn btn-outline btn-xs" style="cursor:pointer;">
              🤖 Upload .APK File <input type="file" id="admApkFile" accept=".apk,application/vnd.android.package-archive" style="display:none;" />
            </label>
          </div>
          <span id="admApkStatusLabel" class="small muted">${s.apkDownloadUrl ? `✅ Direct APK Active: ${escapeHtml(s.apkDownloadUrl)}` : '1-Tap Phone WebApp Install is already live on website!'}</span>

          <hr style="border:none;border-top:1px dashed var(--border);margin:0.8rem 0;" />
          <strong>📩 Gmail OTP &amp; Auto Royal Bill Email + Staff App PIN (Waiter &amp; Delivery)</strong>
          <div class="two-col">
            <div><label>Waiter &amp; Delivery Boy App PIN</label><input type="text" id="admStaffPin" value="${escapeHtml(s.staffPin || '1234')}" placeholder="1234" /></div>
            <div><label>Gmail Address (For Sending OTP &amp; Bills)</label><input type="email" id="admSmtpUser" value="${escapeHtml(s.smtpUser || '')}" placeholder="yourshop@gmail.com" /></div>
          </div>
          <div class="two-col">
            <div><label>Gmail App Password (16-char from Google Security)</label><input type="password" id="admSmtpPass" value="${escapeHtml(s.smtpPass || '')}" placeholder="xxxx xxxx xxxx xxxx" /></div>
            <div><label>Or Resend API Key (Optional Email API)</label><input type="password" id="admResendKey" value="${escapeHtml(s.resendApiKey || '')}" placeholder="re_..." /></div>
          </div>

          <hr style="border:none;border-top:1px dashed var(--border);margin:0.8rem 0;" />
          <label>✨ Gemini API Key (Enables Real AI Chat, Daily Ads &amp; Smart Dish Photos)</label>
          <div class="admin-controls-inline">
            <input type="password" id="admGeminiKey" value="${escapeHtml(s.geminiApiKey || '')}" placeholder="AQ.Ab8... or AIza..." style="flex:1;" />
            <button type="button" class="btn btn-outline btn-xs" id="admTestGeminiBtn">⚡ Test Gemini AI</button>
          </div>
          <div class="two-col">
            <div><label>Google OAuth Client ID (1-Tap Gmail Login)</label><input type="text" id="admGClient" value="${escapeHtml(s.googleClientId || '')}" placeholder="xxx.apps.googleusercontent.com" /></div>
            <div><label>Google Place ID</label><input type="text" id="admPlaceId" value="${escapeHtml(s.googlePlaceId || '')}" placeholder="ChIJ..." /></div>
          </div>
          <label>Google Places API Key (Auto-syncs Maps Reviews, Photos &amp; Hours)</label>
          <input type="password" id="admPlacesKey" value="${escapeHtml(s.googlePlacesApiKey || '')}" placeholder="AIza..." />
          <button type="submit" class="btn btn-primary">Save Settings, Gateways &amp; Keys</button>
        </form>

        <hr style="border:none;border-top:1px dashed var(--border);margin:1.3rem 0;" />
        <h3>💾 Permanent Settings Backup &amp; Sync</h3>
        <p class="muted small" style="margin-top:0;">Settings (Gateways, YouTube Song, Gemini AI, Menu &amp; Ads) sync to all phones &amp; PCs automatically. For permanent survival across Render server restarts, set Render Env Vars (<code>BG_MUSIC_URL</code>, <code>GEMINI_API_KEY</code>, <code>RAZORPAY_KEY_ID</code>, <code>STATE_GIST_ID</code>) OR export a backup JSON here:</p>
        <div class="admin-controls-inline" style="margin-bottom:0.8rem;">
          <button type="button" class="btn btn-outline btn-sm" id="admExportBackupBtn">⬇️ Download Full Backup JSON</button>
          <label class="btn btn-outline btn-sm" style="cursor:pointer;">
            ⬆️ Restore Backup JSON <input type="file" id="admImportBackupFile" accept=".json,application/json" style="display:none;" />
          </label>
        </div>

        <hr style="border:none;border-top:1px dashed var(--border);margin:1.3rem 0;" />
        <h3>🔐 Change Owner Admin PIN</h3>
        <form id="admChangePinForm" class="stack-form">
          <div class="two-col">
            <div><label>Current PIN</label><input type="password" id="admCurPin" required /></div>
            <div><label>New Owner PIN (min 4 chars)</label><input type="password" id="admNewPinOnly" minlength="4" required /></div>
          </div>
          <button type="submit" class="btn btn-outline">Update Owner PIN</button>
        </form>`;

      $('adminTabColors').querySelectorAll('.preset-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const p = COLOR_PRESETS[btn.dataset.preset];
          if (!p) return;
          appState.userOverrideTheme = false;
          localStorage.removeItem('chatkaro_user_theme_override');
          await api('/api/admin/theme', 'POST', { brandTheme: { ...p, preset: btn.dataset.preset, fxEnabled: $('colFx').checked } }, pinHeaders);
          showToast(`Applied "${p.label}" theme live for all users!`);
        });
      });

      $('admColorForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        appState.userOverrideTheme = false;
        localStorage.removeItem('chatkaro_user_theme_override');
        await api('/api/admin/theme', 'POST', {
          brandTheme: {
            preset: 'custom',
            primary: $('colPrimary').value,
            accent: $('colAccent').value,
            bg: $('colBg').value,
            surface: $('colSurface').value,
            text: $('colText').value,
            fxEnabled: $('colFx').checked
          }
        }, pinHeaders);
        showToast('Custom colors published live to website!');
      });

      $('admSettingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          restaurantName: $('admRestName').value,
          ownerName: $('admOwnerName')?.value || 'Het',
          priceRange: $('admPriceRange').value,
          announcement: $('admAnnounce').value,
          dailyDeal: $('admDailyDeal').value,
          openHoursText: $('admHours').value,
          phone: $('admPhone').value,
          instagramHandle: $('admInstaHandle').value,
          instagramReels: $('admInstaReels').value,
          bgMusicUrl: $('admMusicUrl').value,
          bgMusicTitle: $('admMusicTitle').value,
          bgMusicEnabled: $('admMusicEnabled').checked,
          bgVideoUrl: $('admBgVideoUrl').value,
          bgVideoEnabled: $('admBgVideoEnabled').checked,
          apkDownloadUrl: $('admApkUrl')?.value || '',
          staffPin: $('admStaffPin')?.value || '1234',
          smtpUser: $('admSmtpUser')?.value || '',
          smtpPass: $('admSmtpPass')?.value || '',
          resendApiKey: $('admResendKey')?.value || '',
          address: $('admAddress').value,
          merchantUpiId: $('admMerchantUpi').value,
          razorpayKeyId: $('admRzpKeyId').value,
          razorpayKeySecret: $('admRzpSecret').value,
          phonepeMerchantId: $('admPpMerchantId').value,
          phonepeSaltKey: $('admPpSaltKey').value,
          phonepeSaltIndex: $('admPpSaltIndex').value,
          phonepeEnv: $('admPpEnv').value,
          geminiApiKey: $('admGeminiKey').value,
          googleClientId: $('admGClient').value,
          googlePlaceId: $('admPlaceId').value,
          googlePlacesApiKey: $('admPlacesKey').value
        };
        const res = await api('/api/admin/settings', 'POST', { settings: payload }, pinHeaders);
        appState.adminFullSettings = { ...(appState.adminFullSettings || {}), ...payload };
        if (res?.state) {
          applySnapshot(res.state);
          persistSnapshotToCache(res.state);
        }
        showToast('Settings, Music, Video, Gateways & Gemini saved for all devices! ✅');
      });

      $('admQuickSaveMusicBtn')?.addEventListener('click', async () => {
        const bgMusicUrl = $('admMusicUrl').value.trim();
        const bgMusicTitle = $('admMusicTitle').value.trim() || 'Shop Music';
        const bgMusicEnabled = $('admMusicEnabled').checked;
        bgMusicState.userOff = false;
        localStorage.setItem('chatkaro_music_off', '0');
        try {
          const res = await api('/api/admin/settings', 'POST', { settings: { bgMusicUrl, bgMusicTitle, bgMusicEnabled } }, pinHeaders);
          appState.adminFullSettings = { ...(appState.adminFullSettings || {}), bgMusicUrl, bgMusicTitle, bgMusicEnabled };
          if (res?.state) { applySnapshot(res.state); persistSnapshotToCache(res.state); }
          setTimeout(() => applyBgMusicPlayState(true), 250);
          showToast(bgMusicUrl ? '🎵 Song saved & playing for everyone!' : '🔇 Song cleared!');
        } catch (err) {
          showToast(err.message);
        }
      });

      $('admQuickSaveVideoBtn')?.addEventListener('click', async () => {
        const bgVideoUrl = $('admBgVideoUrl').value.trim();
        const bgVideoEnabled = $('admBgVideoEnabled').checked;
        try {
          const res = await api('/api/admin/settings', 'POST', { settings: { bgVideoUrl, bgVideoEnabled } }, pinHeaders);
          appState.adminFullSettings = { ...(appState.adminFullSettings || {}), bgVideoUrl, bgVideoEnabled };
          if (res?.state) { applySnapshot(res.state); persistSnapshotToCache(res.state); }
          showToast(bgVideoUrl ? '🎬 Background Video saved & looping behind shop!' : '🛑 Background Video turned off!');
        } catch (err) {
          showToast(err.message);
        }
      });

      $('admApkFile')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const lbl = $('admApkStatusLabel');
        if (lbl) lbl.textContent = `Uploading ${file.name}...`;
        try {
          const r = await fetch('/api/admin/upload-apk', {
            method: 'POST',
            headers: {
              ...pinHeaders,
              'Content-Type': 'application/octet-stream',
              'x-file-name': encodeURIComponent(file.name)
            },
            body: file
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || 'APK upload failed');
          if ($('admApkUrl')) $('admApkUrl').value = data.apkDownloadUrl;
          if (lbl) lbl.textContent = `✅ Direct APK Uploaded: ${data.apkDownloadUrl}`;
          if (data.state) { applySnapshot(data.state); persistSnapshotToCache(data.state); }
          showToast('🤖 Android APK uploaded! Customers can download it from the website.');
        } catch (err) {
          if (lbl) lbl.textContent = `❌ ${err.message}`;
          showToast(err.message);
        }
      });

      $('admTestGeminiBtn')?.addEventListener('click', async () => {
        const keyVal = $('admGeminiKey')?.value.trim();
        $('admTestGeminiBtn').disabled = true;
        $('admTestGeminiBtn').textContent = 'Testing...';
        try {
          const res = await api('/api/admin/test-gemini', 'POST', { apiKey: keyVal }, pinHeaders);
          showToast(`✅ Working (${res.model}): ${res.sample}`);
        } catch (err) {
          showToast(`❌ Gemini Test Failed: ${err.message}`);
        } finally {
          $('admTestGeminiBtn').disabled = false;
          $('admTestGeminiBtn').textContent = '⚡ Test Gemini AI';
        }
      });

      $('admExportBackupBtn')?.addEventListener('click', async () => {
        try {
          const res = await fetch('/api/admin/backup', { headers: pinHeaders });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Backup download failed');
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `chatkaro-backup-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          showToast('Full Settings, Menu & Ads backup downloaded! 💾');
        } catch (err) {
          showToast(err.message);
        }
      });

      $('admImportBackupFile')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          const res = await api('/api/admin/backup', 'POST', { db: parsed.db || parsed }, pinHeaders);
          if (res?.state) { applySnapshot(res.state); persistSnapshotToCache(res.state); }
          showToast('Backup restored across all devices! ✅');
        } catch (err) {
          showToast(err.message || 'Invalid backup file');
        }
      });

      $('admChangePinForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const res = await api('/api/admin/change-pin', 'POST', {
            currentPin: $('admCurPin').value.trim(),
            newPin: $('admNewPinOnly').value.trim()
          }, pinHeaders);
          appState.adminToken = res.adminToken;
          sessionStorage.setItem('chatkaro_admin_token', res.adminToken);
          $('admChangePinForm').reset();
          showToast('🔐 Owner Admin PIN updated securely!');
        } catch (err) {
          showToast(err.message);
        }
      });
    }
  }

  // ================= FLOATING GEMINI AI ASSISTANT =================
  function formatAiMessageHtml(raw) {
    let html = escapeHtml(String(raw || ''));
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px;">$1</code>');
    html = html.replace(/\n/g, '<br/>');
    return html;
  }

  function setAiWidgetOpen(open) {
    $('aiWidget').classList.toggle('hidden', !open);
    document.body.classList.toggle('ai-chat-open', Boolean(open));
    if (open) $('aiChatInput')?.focus();
  }

  $('openAiFab').addEventListener('click', () => {
    const isHidden = $('aiWidget').classList.contains('hidden');
    setAiWidgetOpen(isHidden);
  });
  $('closeAiBtn').addEventListener('click', () => setAiWidgetOpen(false));

  // Prevent AI chat scroll from ever scrolling the shop behind it
  (function trapAiChatScroll() {
    const box = $('aiMessages');
    if (!box) return;
    box.addEventListener('wheel', (e) => {
      const atTop = box.scrollTop <= 0 && e.deltaY < 0;
      const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 1 && e.deltaY > 0;
      if (atTop || atBottom) e.preventDefault();
      e.stopPropagation();
    }, { passive: false });
    let touchStartY = 0;
    box.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) touchStartY = e.touches[0].clientY;
    }, { passive: true });
    box.addEventListener('touchmove', (e) => {
      if (!e.touches || !e.touches[0]) return;
      const dy = e.touches[0].clientY - touchStartY;
      const atTop = box.scrollTop <= 0 && dy > 0;
      const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 1 && dy < 0;
      if (atTop || atBottom) e.preventDefault();
      e.stopPropagation();
    }, { passive: false });
  })();

  $('clearAiBtn')?.addEventListener('click', () => {
    appState.aiHistory = [];
    const box = $('aiMessages');
    if (box) {
      box.innerHTML = `<div class="ai-bubble bot">Namaste! 🙏 Nayi conversation shuru ho gayi hai. Poochhein kuch bhi!</div>`;
    }
  });

  async function askAiAssistant(question) {
    const q = question.trim();
    if (!q) return;
    const box = $('aiMessages');

    const userBubble = document.createElement('div');
    userBubble.className = 'ai-bubble user';
    userBubble.textContent = q;
    box.appendChild(userBubble);

    const typingBubble = document.createElement('div');
    typingBubble.className = 'ai-bubble bot';
    typingBubble.innerHTML = '<em>Thinking... ✨</em>';
    box.appendChild(typingBubble);
    box.scrollTop = box.scrollHeight;

    try {
      let res;
      if (isHttp) {
        const r = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: q, history: appState.aiHistory })
        });
        res = await r.json();
        if (!r.ok) throw new Error(res.error || 'AI error');
      } else {
        res = await api('/api/ai-chat', 'POST', { message: q, history: appState.aiHistory });
      }
      typingBubble.innerHTML = formatAiMessageHtml(res.reply);

      // Direct AI Order Action -> Add dishes to Cart & show interactive checkout buttons
      const act = res.aiOrderAction;
      if (act && Array.isArray(act.items) && act.items.length > 0) {
        let addedSummary = [];
        for (const it of act.items) {
          const dish = appState.menu.find((m) => m.id === it.id);
          if (dish && dish.available !== false) {
            const count = Math.max(1, Math.min(20, Number(it.qty || 1)));
            updateQty(dish.id, count);
            addedSummary.push(`${count}× ${dish.name}`);
          }
        }
        if (act.orderType && ['dine-in', 'parcel', 'delivery'].includes(act.orderType)) {
          appState.orderType = act.orderType;
          renderCart();
        }
        if (addedSummary.length > 0) {
          showToast(`🤖 AI added: ${addedSummary.join(', ')}`);
          const bar = document.createElement('div');
          bar.className = 'ai-order-actions';
          const viewBtn = document.createElement('button');
          viewBtn.type = 'button';
          viewBtn.className = 'btn btn-outline btn-xs';
          viewBtn.textContent = '🛒 View Cart';
          viewBtn.addEventListener('click', () => { setAiWidgetOpen(false); openCart(); });

          const orderBtn = document.createElement('button');
          orderBtn.type = 'button';
          orderBtn.className = 'btn btn-primary btn-xs';
          orderBtn.textContent = '⚡ Checkout & Bill';
          orderBtn.addEventListener('click', () => {
            setAiWidgetOpen(false);
            openCart();
            if (appState.user && appState.user.phone) {
              placeOrder();
            }
          });
          bar.appendChild(viewBtn);
          bar.appendChild(orderBtn);
          typingBubble.appendChild(bar);

          if (act.placeNow) {
            setTimeout(() => {
              setAiWidgetOpen(false);
              openCart();
            }, 600);
          }
        }
      }

      appState.aiHistory.push({ role: 'user', text: q }, { role: 'model', text: res.reply });
      if (res.engine && !res.engine.includes('fallback') && !res.engine.includes('smart-menu')) {
        $('aiEngineBadge').textContent = `● Gemini Live (${res.engine})`;
      }
    } catch (err) {
      typingBubble.textContent = 'Error: ' + err.message;
    }
    box.scrollTop = box.scrollHeight;
  }

  $('aiChatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = $('aiChatInput').value;
    $('aiChatInput').value = '';
    askAiAssistant(val);
  });
  document.querySelectorAll('.quick-ai-btn').forEach((btn) => {
    btn.addEventListener('click', () => askAiAssistant(btn.dataset.q));
  });

  // ================= EVENT BINDINGS =================
  $('menuGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (btn) {
      e.stopPropagation();
      updateQty(btn.dataset.id, btn.dataset.action === 'inc' ? 1 : -1);
      return;
    }
    const card = e.target.closest('.menu-card[data-dish-id]');
    if (card) openDishDetailModal(card.dataset.dishId);
  });

  $('closeDishDetailBtn')?.addEventListener('click', () => $('dishDetailModal')?.classList.add('hidden'));
  $('dishDetailModal')?.addEventListener('click', (e) => {
    if (e.target === $('dishDetailModal')) $('dishDetailModal').classList.add('hidden');
  });
  $('ddQtyDec')?.addEventListener('click', () => {
    detailModalQty = Math.max(1, detailModalQty - 1);
    if ($('ddQtyVal')) $('ddQtyVal').textContent = String(detailModalQty);
  });
  $('ddQtyInc')?.addEventListener('click', () => {
    detailModalQty = Math.min(20, detailModalQty + 1);
    if ($('ddQtyVal')) $('ddQtyVal').textContent = String(detailModalQty);
  });
  $('ddAddCartBtn')?.addEventListener('click', () => {
    if (!activeDetailDishId) return;
    updateQty(activeDetailDishId, detailModalQty);
    showToast(`Added ${detailModalQty}× to Cart! 🛒`);
  });
  $('ddBuyNowBtn')?.addEventListener('click', () => {
    if (!activeDetailDishId) return;
    updateQty(activeDetailDishId, detailModalQty);
    $('dishDetailModal')?.classList.add('hidden');
    openCart();
  });
  $('ddSimilarGrid')?.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-sim-add]');
    if (addBtn) {
      e.stopPropagation();
      updateQty(addBtn.dataset.simAdd, 1);
      showToast('Added similar dish to Cart! 🍽️');
      return;
    }
    const simCard = e.target.closest('[data-sim-id]');
    if (simCard) openDishDetailModal(simCard.dataset.simId);
  });
  $('menuTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab-btn');
    if (!tab) return;
    $('menuTabs').querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    tab.classList.add('active');
    appState.category = tab.dataset.category;
    renderMenu();
  });
  document.querySelectorAll('.chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.filter;
      if (appState.filter === val) {
        appState.filter = null;
        btn.classList.remove('active');
      } else {
        document.querySelectorAll('.chip-btn').forEach((b) => b.classList.remove('active'));
        appState.filter = val;
        btn.classList.add('active');
      }
      renderMenu();
    });
  });
  $('menuSearch').addEventListener('input', (e) => {
    appState.search = e.target.value;
    renderMenu();
  });

  $('openCartBtn').addEventListener('click', openCart);
  $('floatOpenCartBtn').addEventListener('click', openCart);
  $('closeCartBtn').addEventListener('click', closeCart);
  $('cartBackdrop').addEventListener('click', closeCart);

  $('cartDrawerBody').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cart-action]');
    if (btn) updateQty(btn.dataset.id, btn.dataset.cartAction === 'inc' ? 1 : -1);
  });
  $('cartDrawerFooter').addEventListener('click', (e) => {
    const modeBtn = e.target.closest('.order-mode-btn');
    if (modeBtn) {
      appState.orderType = modeBtn.dataset.mode;
      return renderCart();
    }
    const payBtn = e.target.closest('.pay-opt-btn');
    if (payBtn) {
      appState.paymentMethod = payBtn.dataset.pay;
      return renderCart();
    }
    if (e.target.id === 'applyPromoBtn') {
      const code = ($('promoInput').value || '').trim().toUpperCase();
      if (!code) {
        appState.promoCode = '';
        localStorage.removeItem('chatkaro_active_promo');
        return renderCart();
      }
      const pct = getDiscountPercent(code);
      if (pct > 0) {
        appState.promoCode = code;
        localStorage.setItem('chatkaro_active_promo', code);
        showToast(`Applied ${code} (${pct}% OFF)!`);
      } else {
        showToast('Invalid or locked code! Try WELCOME5 or play the game.');
      }
      return renderCart();
    }
    if (e.target.id === 'placeOrderBtn') placeOrder();
  });

  $('closePhonepeModalBtn').addEventListener('click', () => $('phonepeModal').classList.add('hidden'));
  $('phonepeUtrForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const utr = $('phonepeUtrInput').value.trim();
    if (!appState.pendingPhonepeTxn) return showToast('Payment session expired.');
    try {
      const res = await api('/api/payments/phonepe/confirm-upi', 'POST', {
        txnId: appState.pendingPhonepeTxn,
        utr
      });
      appState.pendingPhonepeTxn = null;
      $('phonepeModal').classList.add('hidden');
      showToast('PhonePe / UPI Payment Confirmed! ✅');
      completeOrderUI(res.order);
    } catch (err) {
      showToast(err.message);
    }
  });

  async function checkPhonePeRedirectReturn() {
    const params = new URLSearchParams(window.location.search);
    const txnId = params.get('phonepeTxn');
    if (!txnId || appState.staticMode) return;
    try {
      const res = await api(`/api/payments/phonepe/status?txnId=${encodeURIComponent(txnId)}`);
      if (res.order) {
        showToast('PhonePe payment verified! ✅');
        completeOrderUI(res.order);
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  $('unlockedCoupons').addEventListener('click', (e) => {
    const btn = e.target.closest('.apply-coupon-btn');
    if (!btn || btn.disabled) return;
    appState.promoCode = btn.dataset.code;
    localStorage.setItem('chatkaro_active_promo', appState.promoCode);
    renderCart();
    openCart();
    showToast(`Coupon ${appState.promoCode} applied!`);
  });
  $('closeOrderModalBtn').addEventListener('click', () => $('orderModal').classList.add('hidden'));
  $('printReceiptBtn').addEventListener('click', () => window.print());

  $('mobileMenuBtn').addEventListener('click', () => {
    const open = $('navLinks').classList.toggle('open');
    $('mobileMenuBtn').setAttribute('aria-expanded', String(open));
  });
  $('navLinks').querySelectorAll('a').forEach((a) => a.addEventListener('click', () => $('navLinks').classList.remove('open')));

  $('btnGoogleMap').addEventListener('click', () => {
    $('btnGoogleMap').classList.add('active');
    $('btnLandmarkMap').classList.remove('active');
    $('googleMapWrap').classList.remove('hidden');
    $('landmarkMapWrap').classList.add('hidden');
  });
  $('btnLandmarkMap').addEventListener('click', () => {
    $('btnLandmarkMap').classList.add('active');
    $('btnGoogleMap').classList.remove('active');
    $('landmarkMapWrap').classList.remove('hidden');
    $('googleMapWrap').classList.add('hidden');
  });
  document.querySelectorAll('.map-pin-node').forEach((node) => {
    node.addEventListener('click', () => ($('landmarkInfo').textContent = '📍 ' + node.dataset.info));
  });
  $('copyPlusCodeBtn').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(appState.settings.plusCode || '2GWF+GJ Talala, Gujarat'); } catch {}
    showToast('Copied Plus Code!');
  });

  // ================= CLIENT SOURCE & RIGHT-CLICK PROTECTION =================
  function initClientProtection() {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showToast('🔒 Right-click & inspect are disabled.');
    });

    document.addEventListener('dragstart', (e) => {
      if (e.target && e.target.tagName === 'IMG') e.preventDefault();
    });

    document.addEventListener('keydown', (e) => {
      const key = (e.key || '').toUpperCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      const blocked =
        key === 'F12' ||
        (ctrlOrMeta && ['U', 'S'].includes(key)) ||
        (ctrlOrMeta && e.shiftKey && ['I', 'J', 'C', 'K'].includes(key)) ||
        (e.metaKey && e.altKey && ['I', 'J', 'C', 'U'].includes(key));
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        showToast('🔒 Source inspection shortcuts are disabled.');
      }
    });
  }

  // ================= FULL PHONE APP (PWA INSTALLER + DIRECT APK DOWNLOAD) =================
  let deferredInstallPrompt = null;

  function isAppInstalledStandalone() {
    return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
  }

  function syncDownloadAppUI() {
    const apkUrl = String(appState.settings?.apkDownloadUrl || '').trim();
    const isInstalled = isAppInstalledStandalone();
    const appShareUrl = window.location.origin + window.location.pathname;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(appShareUrl)}`;

    if ($('sectionAppQrImg') && !$('sectionAppQrImg').src) $('sectionAppQrImg').src = qrSrc;
    if ($('modalAppQrImg') && !$('modalAppQrImg').src) $('modalAppQrImg').src = qrSrc;

    ['sectionDirectApkBtn', 'modalDirectApkBtn'].forEach((id) => {
      const el = $(id);
      if (!el) return;
      if (apkUrl) {
        el.href = apkUrl;
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    if ($('modalAppStatusText')) {
      $('modalAppStatusText').textContent = isInstalled
        ? '✅ App already installed on this device!'
        : deferredInstallPrompt
        ? '⚡ Ready for instant 1-tap phone install!'
        : '📱 Install straight from your phone browser (Free & Safe)';
    }
    if ($('appInstallStatusHint')) {
      $('appInstallStatusHint').textContent = isInstalled
        ? '✅ You are using the installed Chatkaro Phone App!'
        : deferredInstallPrompt
        ? '⚡ 1-Tap Android / PC App Install ready — click above!'
        : 'Works on Android Chrome, Samsung Internet, iPhone Safari & Desktop';
    }
    if ($('modalInstallNowBtn')) {
      $('modalInstallNowBtn').textContent = isInstalled
        ? '✅ App Already Installed!'
        : deferredInstallPrompt
        ? '📲 Install Chatkaro App Now (1-Tap Free)'
        : '📲 How to Add App to Phone Home Screen';
    }
  }

  async function triggerAppInstall() {
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          showToast('🎉 Installing Chatkaro Food Hub App on your phone!');
          deferredInstallPrompt = null;
          $('downloadAppModal')?.classList.add('hidden');
        }
        syncDownloadAppUI();
        return;
      } catch {}
    }
    openDownloadAppModal();
  }

  function openDownloadAppModal() {
    syncDownloadAppUI();
    $('downloadAppModal')?.classList.remove('hidden');
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    syncDownloadAppUI();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    syncDownloadAppUI();
    $('downloadAppModal')?.classList.add('hidden');
    showToast('🎉 Chatkaro Phone App installed successfully!');
  });

  $('headerDownloadAppBtn')?.addEventListener('click', openDownloadAppModal);
  $('heroDownloadAppBtn')?.addEventListener('click', triggerAppInstall);
  $('sectionDownloadAppBtn')?.addEventListener('click', triggerAppInstall);
  $('mobileNavAppBtn')?.addEventListener('click', triggerAppInstall);
  $('mobileNavCartBtn')?.addEventListener('click', openCart);
  $('closeDownloadAppModalBtn')?.addEventListener('click', () => $('downloadAppModal')?.classList.add('hidden'));
  $('downloadAppModal')?.addEventListener('click', (e) => {
    if (e.target === $('downloadAppModal')) $('downloadAppModal')?.classList.add('hidden');
  });
  $('modalInstallNowBtn')?.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      await triggerAppInstall();
    } else if (appState.settings?.apkDownloadUrl) {
      $('modalDirectApkBtn')?.click();
    } else {
      showToast('📱 Tap your browser menu (⋮ or Share ⬆️) → "Install app / Add to Home Screen"!');
    }
  });
  $('copyAppLinkBtn')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(window.location.origin + window.location.pathname); } catch {}
    showToast('🔗 App download link copied! Share it on WhatsApp.');
  });

  // ================= LIVE NEW DISH & DISCOUNT NOTIFICATIONS (ALL USERS + PUSH ALERTS) =================
  let seenNoticeIds = new Set(JSON.parse(localStorage.getItem('chatkaro_seen_notices') || '[]'));
  let lastReadNoticeAt = Number(localStorage.getItem('chatkaro_read_notice_at') || 0);
  let activePopupDishId = '';
  let liveNoticeHideTimer = null;

  function persistSeenNotice(id) {
    seenNoticeIds.add(id);
    const trimmed = Array.from(seenNoticeIds).slice(-30);
    seenNoticeIds = new Set(trimmed);
    localStorage.setItem('chatkaro_seen_notices', JSON.stringify(trimmed));
  }

  function showOsPushNotification(note) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const icon = note.image && note.image.startsWith('assets/') ? note.image : 'assets/app-icon-192.png';
    const opts = {
      body: note.body || 'Tap to check new dish or discount at Chatkaro Food Hub!',
      icon,
      badge: 'assets/app-icon-192.png',
      data: { url: './#menu' }
    };
    if (navigator.serviceWorker?.ready) {
      navigator.serviceWorker.ready
        .then((reg) => reg.showNotification(note.title || 'Chatkaro Food Hub', opts))
        .catch(() => { try { new Notification(note.title, opts); } catch {} });
    } else {
      try { new Notification(note.title, opts); } catch {}
    }
  }

  function showLiveNoticePopup(note) {
    if (!note || !note.id) return;
    activePopupDishId = note.dishId || '';
    if ($('liveNoticeImg')) $('liveNoticeImg').src = note.image || 'assets/app-icon-192.png';
    if ($('liveNoticeTitle')) $('liveNoticeTitle').textContent = note.title || '🆕 Shop Offer Alert!';
    if ($('liveNoticeText')) $('liveNoticeText').textContent = note.body || '';
    $('liveNoticeCard')?.classList.remove('hidden');
    clearTimeout(liveNoticeHideTimer);
    liveNoticeHideTimer = setTimeout(() => $('liveNoticeCard')?.classList.add('hidden'), 11000);
  }

  function handleIncomingNotice(note, isRealTimeEvent = false) {
    if (!note || !note.id) return;
    if (!Array.isArray(appState.notifications)) appState.notifications = [];
    if (!appState.notifications.some((n) => n.id === note.id)) {
      appState.notifications.unshift(note);
      appState.notifications = appState.notifications.slice(0, 12);
    }
    if (!seenNoticeIds.has(note.id)) {
      persistSeenNotice(note.id);
      if (isRealTimeEvent || Date.now() - Number(note.createdAt || 0) < 120000) {
        showLiveNoticePopup(note);
        showOsPushNotification(note);
      }
    }
    syncNotificationsUI(appState.notifications);
  }

  function syncNotificationsUI(list) {
    const items = Array.isArray(list) ? list : (appState.notifications || []);
    const unread = items.filter((n) => Number(n.createdAt || 0) > lastReadNoticeAt).length;
    const badge = $('notifUnreadBadge');
    if (badge) {
      if (unread > 0) {
        badge.textContent = String(Math.min(9, unread));
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
    // Check if an unseen very recent (< 2 min) notice arrived while user was synced via snapshot
    const fresh = items[0];
    if (fresh && !seenNoticeIds.has(fresh.id)) {
      persistSeenNotice(fresh.id);
      if (Date.now() - Number(fresh.createdAt || 0) < 120000) {
        showLiveNoticePopup(fresh);
        showOsPushNotification(fresh);
      }
    }
    if ($('notifListWrap')) {
      $('notifListWrap').innerHTML = items.length
        ? items.map((n) => `
          <div class="notif-list-item" data-ntf-dish="${escapeHtml(n.dishId || '')}">
            <img src="${escapeHtml(n.image || 'assets/app-icon-192.png')}" alt="" />
            <div style="flex:1;min-width:0;">
              <strong style="display:block;font-size:0.86rem;">${escapeHtml(n.title)}</strong>
              <div class="muted small">${escapeHtml(n.body)}</div>
              <small class="muted" style="font-size:0.7rem;">${new Date(n.createdAt || Date.now()).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
            </div>
          </div>`).join('')
        : '<p class="muted small">Abhi tak koi naya dish ya offer notification nahi hai — naya dish/discount aate hi yahan turant dikhega!</p>';
    }
  }

  $('headerNotifBtn')?.addEventListener('click', () => {
    lastReadNoticeAt = Date.now();
    localStorage.setItem('chatkaro_read_notice_at', String(lastReadNoticeAt));
    syncNotificationsUI(appState.notifications || []);
    $('notifModal')?.classList.remove('hidden');
  });
  $('closeNotifModalBtn')?.addEventListener('click', () => $('notifModal')?.classList.add('hidden'));
  $('notifModal')?.addEventListener('click', (e) => {
    if (e.target === $('notifModal')) $('notifModal')?.classList.add('hidden');
  });
  $('notifListWrap')?.addEventListener('click', (e) => {
    const row = e.target.closest('[data-ntf-dish]');
    if (!row) return;
    $('notifModal')?.classList.add('hidden');
    if (row.dataset.ntfDish) {
      openDishDetailModal(row.dataset.ntfDish);
    } else {
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    }
  });
  $('enablePushAlertsBtn')?.addEventListener('click', async () => {
    if (!('Notification' in window)) return showToast('Browser alerts supported nahi hain — live popup notifications chal rahe hain!');
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      showToast('🔔 Phone & Browser Alerts ON! Har new dish & offer ki notice aayegi.');
      showOsPushNotification({
        title: 'Chatkaro Alerts Active! 🔔',
        body: 'Nayi dish ya discount aate hi aapko turant notice milegi.',
        image: 'assets/app-icon-192.png'
      });
    } else {
      showToast('Alert permission allow karein browser settings se.');
    }
  });
  $('liveNoticeCloseBtn')?.addEventListener('click', () => $('liveNoticeCard')?.classList.add('hidden'));
  $('liveNoticeActionBtn')?.addEventListener('click', () => {
    $('liveNoticeCard')?.classList.add('hidden');
    if (activePopupDishId) {
      openDishDetailModal(activePopupDishId);
    } else {
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Automatically offer alert permission softly after 1st click if not decided yet
  window.addEventListener('pointerdown', () => {
    if ('Notification' in window && Notification.permission === 'default' && !localStorage.getItem('chatkaro_asked_notif')) {
      localStorage.setItem('chatkaro_asked_notif', '1');
      Notification.requestPermission().catch(() => {});
    }
  }, { once: true, passive: true });

  initClientProtection();
  syncDownloadAppUI();
  initScrollReveal();
  initHeroParticles();
  initHeroAdReel();
  syncCouponUI();
  renderAuthUI();
  initialFetch().then(() => {
    checkPhonePeRedirectReturn();
    const urlTbl = Number(new URLSearchParams(window.location.search).get('table') || 0);
    if (urlTbl > 0) {
      appState.activeTableId = urlTbl;
      appState.orderType = 'dine-in';
      sessionStorage.setItem('chatkaro_qr_table', String(urlTbl));
      renderTableQrBanner();
      renderWaiterServicePanel();
      renderAuthUI();
      renderCart();
      setTimeout(() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }), 350);
      showToast(`🪑 Scanned Table ${urlTbl} QR! Orders go straight to Table ${urlTbl}.`);
    }
  });
})();
