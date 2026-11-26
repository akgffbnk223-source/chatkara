(function () {
  const canvas = document.getElementById('chatkaroGameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('gameScore');
  const comboEl = document.getElementById('gameCombo');
  const timeEl = document.getElementById('gameTime');
  const livesEl = document.getElementById('gameLives');
  const bestEl = document.getElementById('gameBest');
  const soundBtn = document.getElementById('gameSoundBtn');
  const overlay = document.getElementById('gameOverlay');
  const overlayContent = document.getElementById('gameOverlayContent');
  const startBtn = document.getElementById('startGameBtn');
  const restartQuickBtn = document.getElementById('restartQuickBtn');
  const moveLeftBtn = document.getElementById('moveLeftBtn');
  const moveRightBtn = document.getElementById('moveRightBtn');

  // Multiplayer UI
  const modeSoloBtn = document.getElementById('modeSoloBtn');
  const modeMultiBtn = document.getElementById('modeMultiBtn');
  const multiRoomBar = document.getElementById('multiRoomBar');
  const roomCodeInput = document.getElementById('roomCodeInput');
  const multiModeSelect = document.getElementById('multiModeSelect');
  const joinRoomBtn = document.getElementById('joinRoomBtn');
  const startMultiRoundBtn = document.getElementById('startMultiRoundBtn');
  const roomPlayersStrip = document.getElementById('roomPlayersStrip');

  let bestScore = Number(localStorage.getItem('chatkaro_game_best') || 0);
  bestEl.textContent = bestScore;

  let soundEnabled = true;
  let audioCtx = null;
  let isMultiplayer = false;
  let activeRoom = null;
  let lastSyncSentAt = 0;
  const localPlayerId = 'p-' + Math.random().toString(36).slice(2, 8);

  function playTone(freq, duration, type = 'sine', gainVal = 0.08) {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {}
  }

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? '🔊 Sound On' : '🔇 Muted';
  });

  const ITEMS = [
    { emoji: '🥞', pts: 15, speed: 2.7, weight: 32 },
    { emoji: '🍛', pts: 20, speed: 3.1, weight: 25 },
    { emoji: '🥡', pts: 25, speed: 3.4, weight: 20 },
    { emoji: '🌶️', pts: 40, speed: 4.1, weight: 10 },
    { emoji: '💣', pts: -1, speed: 3.6, weight: 15, hazard: true }
  ];

  function pickItemType() {
    const total = ITEMS.reduce((s, i) => s + i.weight, 0);
    let r = Math.random() * total;
    for (const item of ITEMS) {
      if (r < item.weight) return item;
      r -= item.weight;
    }
    return ITEMS[0];
  }

  let running = false;
  let rafId = null;
  let timerId = null;
  let score = 0;
  let combo = 1;
  let streak = 0;
  let lives = 3;
  let timeLeft = 45;
  let spawnTick = 0;

  const player = { x: canvas.width / 2 - 58, y: canvas.height - 54, w: 116, h: 22, speed: 8 };
  const keys = { left: false, right: false };
  let falling = [];
  let popups = [];

  function resetState() {
    score = 0;
    combo = 1;
    streak = 0;
    lives = 3;
    timeLeft = 45;
    spawnTick = 0;
    falling = [];
    popups = [];
    player.x = canvas.width / 2 - player.w / 2;
    updateHUD();
  }

  function updateHUD() {
    scoreEl.textContent = score;
    if (isMultiplayer && activeRoom) {
      const others = activeRoom.players || [];
      const teamTotal = others.reduce((s, p) => s + (p.id === localPlayerId ? score : p.score || 0), 0);
      comboEl.textContent = activeRoom.mode === 'coop' ? `Team: ${teamTotal}` : `x${combo}`;
    } else {
      comboEl.textContent = `x${combo}`;
    }
    timeEl.textContent = `${timeLeft}s`;
    livesEl.textContent = lives > 0 ? '❤️'.repeat(lives) : '💔';
    bestEl.textContent = bestScore;
  }

  function spawnItem() {
    const spec = pickItemType();
    const speedBoost = 1 + (45 - timeLeft) * 0.015;
    falling.push({ ...spec, x: 34 + Math.random() * (canvas.width - 68), y: -28, vy: spec.speed * speedBoost });
  }

  function addPopup(x, y, text, color) {
    popups.push({ x, y, text, color, life: 36 });
  }

  function syncMultiplayerState() {
    if (!isMultiplayer || !activeRoom) return;
    const now = Date.now();
    if (now - lastSyncSentAt < 120) return;
    lastSyncSentAt = now;
    const user = window.ChatkaroBridge?.getUser?.();
    fetch('/api/game/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: activeRoom.code,
        playerId: localPlayerId,
        x: Math.round(player.x),
        score,
        bestScore,
        email: user?.email || ''
      })
    }).catch(() => {});
  }

  function endGame(reason) {
    running = false;
    clearInterval(timerId);
    cancelAnimationFrame(rafId);

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('chatkaro_game_best', String(bestScore));
    }
    window.ChatkaroBridge?.reportScore?.(score);
    syncMultiplayerState();
    updateHUD();

    let effectiveScore = score;
    if (isMultiplayer && activeRoom && activeRoom.mode === 'coop') {
      effectiveScore = (activeRoom.players || []).reduce((s, p) => s + (p.id === localPlayerId ? score : p.score || 0), 0);
    }

    if (effectiveScore >= 300) {
      window.ChatkaroBridge?.unlockCoupon?.('CHATKARO10');
      window.ChatkaroBridge?.unlockCoupon?.('CHATKARO20');
    } else if (effectiveScore >= 150) {
      window.ChatkaroBridge?.unlockCoupon?.('CHATKARO10');
    }

    let summaryLine = `Your Score: <strong style="color:#fbbf24;">${score}</strong>`;
    if (isMultiplayer && activeRoom) {
      const board = (activeRoom.players || [])
        .map((p) => `${p.name}: ${p.id === localPlayerId ? score : p.score}`)
        .join(' | ');
      summaryLine += `<br/><small>${board}</small>`;
    }

    overlayContent.innerHTML = `
      <span class="overlay-emoji">${effectiveScore >= 150 ? '🎉🍽️' : '👨‍🍳🔥'}</span>
      <h3>${reason === 'lives' ? 'Kitchen Burnout!' : 'Time Up — Great Match!'}</h3>
      <p>${summaryLine}</p>
      <p>${effectiveScore >= 300 ? '🥇 Unlocked CHATKARO20 (20% OFF)!' : effectiveScore >= 150 ? '🥉 Unlocked CHATKARO10 (10% OFF)!' : 'Score 150+ solo or team for 10% OFF!'}</p>
      <button type="button" class="btn btn-primary btn-lg" id="playAgainBtn">Play Again</button>
    `;
    overlay.classList.remove('hidden');
    document.getElementById('playAgainBtn').addEventListener('click', startGame);
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#2a1810');
    grad.addColorStop(1, '#150b07');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#3b2116';
    ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
  }

  function drawRemotePlayers() {
    if (!isMultiplayer || !activeRoom || !Array.isArray(activeRoom.players)) return;
    activeRoom.players.forEach((rp) => {
      if (rp.id === localPlayerId) return;
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(rp.x || 300, player.y - 24, player.w, 16, 8);
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${rp.name} (${rp.score || 0})`, (rp.x || 300) + player.w / 2, player.y - 30);
      ctx.restore();
    });
  }

  function drawPlayer() {
    ctx.save();
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 11);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.roundRect(player.x + 8, player.y + 4, player.w - 16, 6, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    const me = window.ChatkaroBridge?.getUser?.();
    ctx.fillText(me ? me.name.split(' ')[0].toUpperCase() : 'TAWA CATCHER', player.x + player.w / 2, player.y + 18);
    ctx.restore();
  }

  function loop() {
    if (!running) return;
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    player.x = Math.max(8, Math.min(canvas.width - player.w - 18, player.x));
    syncMultiplayerState();

    spawnTick++;
    if (spawnTick >= 28) {
      spawnTick = 0;
      spawnItem();
    }

    drawBackground();
    drawRemotePlayers();

    for (let i = falling.length - 1; i >= 0; i--) {
      const f = falling[i];
      f.y += f.vy;

      ctx.beginPath();
      ctx.arc(f.x, f.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = f.hazard ? 'rgba(220, 38, 38, 0.25)' : 'rgba(251, 191, 36, 0.16)';
      ctx.fill();
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.emoji, f.x, f.y);

      const hitX = f.x + 14 > player.x && f.x - 14 < player.x + player.w;
      const hitY = f.y + 14 >= player.y && f.y - 14 <= player.y + player.h;

      if (hitX && hitY) {
        falling.splice(i, 1);
        if (f.hazard) {
          lives -= 1;
          streak = 0;
          combo = 1;
          addPopup(f.x, f.y - 10, '💥 -1 Life!', '#fca5a5');
          playTone(140, 0.22, 'sawtooth', 0.11);
          updateHUD();
          if (lives <= 0) return endGame('lives');
        } else {
          streak += 1;
          combo = streak >= 8 ? 3 : streak >= 4 ? 2 : 1;
          const gained = f.pts * combo;
          score += gained;
          addPopup(f.x, f.y - 12, `+${gained}`, '#fde68a');
          playTone(440 + combo * 110, 0.12, 'triangle', 0.08);
          updateHUD();
        }
        continue;
      }

      if (f.y > canvas.height + 24) {
        falling.splice(i, 1);
        if (!f.hazard) {
          streak = 0;
          combo = 1;
          updateHUD();
        }
      }
    }

    drawPlayer();

    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i];
      p.y -= 1.2;
      p.life -= 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / 36);
      ctx.fillStyle = p.color;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
      if (p.life <= 0) popups.splice(i, 1);
    }

    rafId = requestAnimationFrame(loop);
  }

  function startGame() {
    clearInterval(timerId);
    cancelAnimationFrame(rafId);
    resetState();
    overlay.classList.add('hidden');
    running = true;
    playTone(520, 0.15, 'sine', 0.08);
    timerId = setInterval(() => {
      if (!running) return;
      timeLeft -= 1;
      updateHUD();
      if (timeLeft <= 0) endGame('time');
    }, 1000);
    rafId = requestAnimationFrame(loop);
  }

  // Multiplayer Room Controls
  function renderRoomStrip() {
    if (!activeRoom) return;
    const players = activeRoom.players || [];
    roomPlayersStrip.innerHTML =
      `Room <strong>#${activeRoom.code}</strong> (${activeRoom.mode === 'coop' ? 'Co-Op' : 'Versus'}) • Players (${players.length}): ` +
      players.map((p) => `${p.name}${p.tableId ? ' [T' + p.tableId + ']' : ''}: ${p.score || 0}`).join(' • ');
  }

  async function joinRoom() {
    const code = (roomCodeInput.value || 'CHEF1').trim().toUpperCase();
    const user = window.ChatkaroBridge?.getUser?.();
    const playerName = user ? user.name : 'Guest-' + localPlayerId.slice(-3);
    try {
      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          playerId: localPlayerId,
          playerName,
          tableId: user?.tableId || null,
          mode: multiModeSelect.value
        })
      });
      const data = await res.json();
      if (data.room) {
        activeRoom = data.room;
        renderRoomStrip();
        window.ChatkaroBridge?.showToast?.(`Joined Room #${activeRoom.code}!`);
      }
    } catch {
      window.ChatkaroBridge?.showToast?.('Multiplayer requires live server.');
    }
  }

  if (window.ChatkaroBridge) {
    window.ChatkaroBridge.onGameRoomsUpdate = (room) => {
      if (!activeRoom || room.code !== activeRoom.code) return;
      const prevStatus = activeRoom.status;
      activeRoom = room;
      renderRoomStrip();
      updateHUD();
      if (prevStatus !== 'playing' && room.status === 'playing' && !running) {
        startGame();
      }
    };
  }

  modeSoloBtn.addEventListener('click', () => {
    isMultiplayer = false;
    modeSoloBtn.classList.add('active');
    modeMultiBtn.classList.remove('active');
    multiRoomBar.classList.add('hidden');
  });

  modeMultiBtn.addEventListener('click', () => {
    isMultiplayer = true;
    modeMultiBtn.classList.add('active');
    modeSoloBtn.classList.remove('active');
    multiRoomBar.classList.remove('hidden');
    joinRoom();
  });

  joinRoomBtn.addEventListener('click', joinRoom);
  startMultiRoundBtn.addEventListener('click', async () => {
    if (!activeRoom) await joinRoom();
    if (!activeRoom) return;
    await fetch('/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: activeRoom.code })
    });
    if (!running) startGame();
  });

  // Input listeners
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  });

  function movePointer(clientX) {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (clientX - rect.left) * (canvas.width / rect.width);
    player.x = Math.max(8, Math.min(canvas.width - player.w - 18, cx - player.w / 2));
  }
  canvas.addEventListener('mousemove', (e) => movePointer(e.clientX));
  canvas.addEventListener('touchmove', (e) => { if (e.touches[0]) movePointer(e.touches[0].clientX); }, { passive: true });

  const bindHold = (btn, dir) => {
    const on = () => (keys[dir] = true);
    const off = () => (keys[dir] = false);
    btn.addEventListener('mousedown', on);
    btn.addEventListener('mouseup', off);
    btn.addEventListener('mouseleave', off);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); on(); }, { passive: false });
    btn.addEventListener('touchend', off);
  };
  bindHold(moveLeftBtn, 'left');
  bindHold(moveRightBtn, 'right');

  startBtn.addEventListener('click', startGame);
  restartQuickBtn.addEventListener('click', startGame);

  drawBackground();
  drawPlayer();
})();
