'use strict';
// ---------- Accessibility, phone vibration, photo mode + clip recording, install as an app (PWA) ----------

// ================= new settings (kept with the other settings, so they survive New Game) =================
const V6_SETTINGS = { p2: 'off', cb: 'off', calm: false, uiScale: 1, contrast: false, assist: false, vibrate: true };
const _x_defaultSettings = defaultSettings;
defaultSettings = function () { return Object.assign(_x_defaultSettings(), V6_SETTINGS); };
for (const k in V6_SETTINGS) if (SETTINGS[k] === undefined) SETTINGS[k] = V6_SETTINGS[k];
ACTIONS.push({ id: 'photo', name: 'Photo mode', def: ['KeyV', ''] });
if (!SETTINGS.keys.photo) SETTINGS.keys.photo = ['KeyV', ''];
rebuildKeymap();

// ================= accessibility =================
// colour-correction matrices (daltonization) that move hard-to-tell hues into ranges each type can see
const CB_MATRIX = {
  protan: '1 0 0 0 0  -0.255 1.255 0 0 0  0.303 -0.545 1.242 0 0  0 0 0 1 0',
  deutan: '1 0 0 0 0  -0.4375 1.4375 0 0 0  0.2625 -0.5625 1.3 0 0  0 0 0 1 0',
  tritan: '1.05 -0.3825 0.3325 0 0  0 1.2345 -0.2345 0 0  0 0 1 0 0  0 0 0 1 0',
};
(function addCbFilters() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
  svg.innerHTML = Object.entries(CB_MATRIX).map(([k, m]) => `<filter id="cb-${k}" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="${m}"/></filter>`).join('');
  document.body.appendChild(svg);
})();
const PHOTO_FILTERS = { none: '', noir: 'grayscale(1) contrast(1.25)', vintage: 'sepia(0.7) saturate(1.2) contrast(1.05)', dream: 'saturate(1.4) brightness(1.08) blur(0.6px)', neon: 'saturate(2) contrast(1.2) hue-rotate(-15deg)', frost: 'hue-rotate(160deg) saturate(0.8) brightness(1.1)' };
function canvasFilter() {
  const f = [];
  if (SETTINGS.cb && SETTINGS.cb !== 'off') f.push(`url(#cb-${SETTINGS.cb})`);
  if (PHOTO.on && PHOTO_FILTERS[PHOTO.filter]) f.push(PHOTO_FILTERS[PHOTO.filter]);
  return f.join(' ');
}
function applyA11y() {
  const cbf = SETTINGS.cb && SETTINGS.cb !== 'off' ? `url(#cb-${SETTINGS.cb})` : '';
  $('game').style.filter = canvasFilter();
  for (const id of ['hud', 'screens']) { const el = $(id); if (el) el.style.filter = cbf; }
  document.documentElement.style.setProperty('--ui', SETTINGS.uiScale || 1);
  document.body.classList.toggle('hc', !!SETTINGS.contrast);
  document.body.classList.toggle('calm', !!SETTINGS.calm);
}
const _x_applyTouchMode = applyTouchMode;
applyTouchMode = function () { _x_applyTouchMode(); applyA11y(); };
// reduce flashing: no screen flashes, hurt flashes, bloom pulses or boss-phase strobes
const _x_bloom = GFX_ON.bloom;
GFX_ON.bloom = () => !SETTINGS.calm && _x_bloom();
// assist mode: slower enemies, auto-aimed summons, no falling in story stages, no stars or records
const plainStage = () => W && W.active && !W.isTower && !W.isRush && !W.isDaily && !W.isRaid;
const _x_startStage = startStage;
startStage = function (idx, kind) { _x_startStage(idx, kind); W.assist = !!SETTINGS.assist; if (W.assist) setTimeout(() => { if (W.active) toast('Assist mode is on: no stars or records this run', 'card'); }, 900); };
const _x_spawnEnemy = spawnEnemy;
spawnEnemy = function (type, x, y, elite) { const e = _x_spawnEnemy(type, x, y, elite); if (W.assist) { e.speed *= 0.7; e.dmg *= 0.75; } return e; };
const _x_summonPoint = summonPoint;
summonPoint = function () {
  if (!W.assist) return _x_summonPoint();
  const p = W.player, e = nearestEnemy(p.x, p.y, 420) || (W.boss && !W.boss.dead ? W.boss : null);
  if (!e) return _x_summonPoint();
  let dx = e.x - p.x, dy = e.y - p.y; const d = Math.hypot(dx, dy), max = 240;
  if (d > max) { dx *= max / d; dy *= max / d; }
  return { x: clamp(p.x + dx, -BOUND, BOUND), y: clamp(p.y + dy, -BOUND, BOUND) };
};
const _x_playerDie = playerDie;
playerDie = function () {
  const p = W.player;
  if (W.assist && plainStage()) { p.hp = Math.max(1, p.maxHp * 0.3); p.inv = 2; txt(p.x, p.y - 30, 'Assist: saved!', '#7fd0ff', 15, 1.2); return; }
  _x_playerDie();
};
const _x_finishStage = finishStage;
finishStage = function (won, retreat) {
  const idx = W.stageIdx, keep = W.assist && plainStage() && SAVE.stars[idx] ? { stars: [...SAVE.stars[idx]], best: SAVE.best[idx] } : null;
  _x_finishStage(won, retreat);
  if (keep) {
    SAVE.stars[idx] = keep.stars.map((b, k) => b || (k === 0 && !!SAVE.cleared[idx]));
    SAVE.best[idx] = keep.best;
    saveGame();
  }
};

// ================= vibration (phones and controllers that support it) =================
let VIB_T = 0;
function vibrate(pattern, minGap = 0.12) {
  if (!SETTINGS.vibrate || !navigator.vibrate || !INPUT.touchMode) return;
  const now = performance.now() / 1000;
  if (now - VIB_T < minGap) return;
  VIB_T = now;
  try { navigator.vibrate(pattern); } catch (e) { /* not allowed here */ }
}
const _x_hitAlly = hitAlly;
hitAlly = function (t, dmg, src) {
  const hp0 = t === W.player ? t.hp : 0;
  _x_hitAlly(t, dmg, src);
  if (t === W.player && t.hp < hp0) vibrate(t.hp <= 0 ? [120, 60, 200] : 35, 0.18);
};
const _x_spawnBoss = spawnBoss;
spawnBoss = function () { _x_spawnBoss(); vibrate([90, 50, 90, 50, 160], 0); };
const _x_bossDefeated = bossDefeated;
bossDefeated = function (e) { _x_bossDefeated(e); vibrate([60, 40, 250], 0); };

// ================= photo mode + clip recording =================
const PHOTO = { on: false, filter: 'none', frame: true, zk: 1, rec: null };
function enterPhoto() {
  if (STATE !== 'play' || !W.active || W.choosing || PHOTO.on) return;
  PHOTO.on = true; PHOTO.zk = W.zk || 1; PHOTO.cx = W.camX; PHOTO.cy = W.camY;
  INPUT.keys.clear();
  $('hud').classList.add('photo');
  let bar = $('photoBar');
  if (!bar) {
    bar = document.createElement('div'); bar.id = 'photoBar'; bar.className = 'photo-bar';
    bar.innerHTML = `<div class="ph-title">Photo mode <span class="muted">WASD / arrows move · scroll or slider zooms</span></div>
      <div class="ph-row">${Object.keys(PHOTO_FILTERS).map(k => `<button class="btn small ph-f" data-f="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
      <div class="ph-row"><label class="set-row">Zoom <input type="range" min="0.6" max="1.8" step="0.05" id="phZoom"></label><label class="set-row">Frame <input type="checkbox" id="phFrame"></label></div>
      <div class="ph-row"><button class="btn small primary" id="phSave">Save photo</button><button class="btn small" id="phClip">Record 10 s clip</button><button class="btn small ghost" id="phExit">Back to battle</button></div>`;
    document.body.appendChild(bar);
    bar.querySelectorAll('.ph-f').forEach(b => b.onclick = () => { PHOTO.filter = b.dataset.f; SFX.click(); refreshPhotoBar(); });
    $('phZoom').oninput = ev => { PHOTO.zk = +ev.target.value; };
    $('phFrame').onchange = ev => { PHOTO.frame = ev.target.checked; refreshPhotoBar(); };
    $('phSave').onclick = () => { SFX.click(); savePhoto(); };
    $('phClip').onclick = () => { SFX.click(); exitPhoto(); recordClip(10); };
    $('phExit').onclick = () => { SFX.click(); exitPhoto(); };
  }
  bar.classList.remove('hidden');
  refreshPhotoBar();
  SFX.uiOpen();
}
function refreshPhotoBar() {
  document.querySelectorAll('#photoBar .ph-f').forEach(b => b.classList.toggle('primary', b.dataset.f === PHOTO.filter));
  $('phZoom').value = PHOTO.zk; $('phFrame').checked = PHOTO.frame;
  let fr = $('photoFrame');
  if (!fr) { fr = document.createElement('div'); fr.id = 'photoFrame'; fr.className = 'photo-frame'; fr.innerHTML = '<span>Summoner: Hellbound Grimoire</span>'; document.body.appendChild(fr); }
  fr.classList.toggle('hidden', !(PHOTO.on && PHOTO.frame));
  applyA11y();
}
function exitPhoto() {
  if (!PHOTO.on) return;
  PHOTO.on = false;
  W.zk = PHOTO.zk;
  $('hud').classList.remove('photo');
  $('photoBar').classList.add('hidden');
  $('photoFrame').classList.add('hidden');
  INPUT.keys.clear();
  applyA11y();
}
function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
const stamp = () => new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
function savePhoto() {
  const src = $('game'), out = document.createElement('canvas');
  out.width = src.width; out.height = src.height;
  const c = out.getContext('2d');
  c.filter = canvasFilter() || 'none';
  c.drawImage(src, 0, 0);
  c.filter = 'none';
  if (PHOTO.frame) {
    const w = out.width, h = out.height, b = Math.round(Math.min(w, h) * 0.025);
    c.strokeStyle = '#ffd66b'; c.lineWidth = b * 0.35; c.strokeRect(b, b, w - 2 * b, h - 2 * b);
    c.font = `800 ${Math.round(b * 0.9)}px Cinzel, Georgia, serif`; c.fillStyle = '#ffd66b'; c.textAlign = 'right';
    c.fillText('Summoner: Hellbound Grimoire', w - b * 1.6, h - b * 1.6);
  }
  out.toBlob(blob => { if (blob) { downloadBlob(blob, `summoner-${stamp()}.png`); toast('Photo saved', 'card'); } }, 'image/png');
}
function recordClip(sec) {
  const cvs = $('game');
  if (PHOTO.rec || !cvs.captureStream || typeof MediaRecorder === 'undefined') { toast('Clip recording is not supported in this browser', 'fail'); return false; }
  const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(t => MediaRecorder.isTypeSupported(t));
  if (!type) { toast('Clip recording is not supported in this browser', 'fail'); return false; }
  const rec = new MediaRecorder(cvs.captureStream(30), { mimeType: type, videoBitsPerSecond: 6e6 }), parts = [];
  PHOTO.rec = rec;
  rec.ondataavailable = ev => { if (ev.data && ev.data.size) parts.push(ev.data); };
  rec.onstop = () => {
    PHOTO.rec = null; $('hud').classList.remove('recording');
    if (parts.length) { downloadBlob(new Blob(parts, { type }), `summoner-clip-${stamp()}.${type.includes('mp4') ? 'mp4' : 'webm'}`); toast('Clip saved', 'card'); }
  };
  rec.start(500);
  $('hud').classList.add('recording');
  toast(`Recording ${sec} seconds…`, 'card');
  setTimeout(() => { if (rec.state !== 'inactive') rec.stop(); }, sec * 1000);
  return true;
}
// photo mode freezes the battle but keeps drawing it, with a free camera
const _x_updateWorld = updateWorld;
updateWorld = function (rawDt) {
  if (PHOTO.on) {
    const sp = 520 * rawDt / (PHOTO.zk || 1);
    if (actionHeld('left')) W.camX -= sp; if (actionHeld('right')) W.camX += sp;
    if (actionHeld('up')) W.camY -= sp; if (actionHeld('down')) W.camY += sp;
    W.zk = PHOTO.zk;
    return;
  }
  _x_updateWorld(rawDt);
  if (SETTINGS.calm) { W.flashT = 0; W.hurtFlash = Math.min(W.hurtFlash, 0.1); }
};
window.addEventListener('keydown', ev => {
  if (STATE !== 'play') return;
  if (PHOTO.on) {
    if (ev.code === 'Escape' || KEYMAP[ev.code] === 'photo') { ev.preventDefault(); exitPhoto(); }
    else if (KEYMAP[ev.code] && /^(up|down|left|right)$/.test(KEYMAP[ev.code])) { INPUT.keys.add(ev.code); ev.preventDefault(); }
    ev.stopImmediatePropagation();
    return;
  }
  if (KEYMAP[ev.code] === 'photo' && !ev.repeat && !W.choosing) { ev.preventDefault(); ev.stopImmediatePropagation(); enterPhoto(); }
});
window.addEventListener('wheel', ev => { if (PHOTO.on) { PHOTO.zk = clamp(PHOTO.zk * (ev.deltaY > 0 ? 0.92 : 1.08), 0.6, 1.8); $('phZoom').value = PHOTO.zk; } }, { passive: true });
// a camera button in the HUD for touch and mouse players
(function addPhotoButton() {
  const row = document.querySelector('#hud .tr-row');
  if (!row) return;
  const b = document.createElement('button');
  b.className = 'icon-btn'; b.id = 'btnPhoto'; b.title = 'Photo mode (V)'; b.textContent = '◉';
  b.onclick = () => { SFX.click(); enterPhoto(); };
  row.insertBefore(b, $('btnMute'));
})();
const _x_pauseGame = pauseGame;
pauseGame = function () { if (PHOTO.on) return; _x_pauseGame(); };

// ================= install as an app (PWA) =================
const APP_V = ((document.querySelector('script[src*="extras.js"]') || {}).src || '').split('v=')[1] || '0';
const PWA = { waiting: null, prompt: null };
(function registerSW() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol) || /\/tests\//.test(location.pathname)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js?v=' + APP_V).then(reg => {
      const watch = sw => sw && sw.addEventListener('statechange', () => { if (sw.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(sw); });
      if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
      reg.addEventListener('updatefound', () => watch(reg.installing));
    }).catch(() => { /* offline support is optional */ });
    // only reload when the player pressed "Reload" on the update banner (not on the very first install)
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!PWA.reloading) return; PWA.reloading = false; saveGame(); location.reload(); });
  });
})();
function showUpdateBanner(sw) {
  PWA.waiting = sw;
  let b = $('updateBanner');
  if (!b) {
    b = document.createElement('div'); b.id = 'updateBanner'; b.className = 'update-banner';
    b.innerHTML = '<span>A new version of the game is ready.</span><button class="btn small primary" id="btnUpdateNow">Reload</button><button class="btn small ghost" id="btnUpdateLater">Later</button>';
    document.body.appendChild(b);
    $('btnUpdateNow').onclick = () => { saveGame(); PWA.reloading = true; if (PWA.waiting) PWA.waiting.postMessage('skipWaiting'); };
    $('btnUpdateLater').onclick = () => b.classList.add('hidden');
  }
  b.classList.remove('hidden');
}
// "Install app" button on the title screen when the browser offers it
window.addEventListener('beforeinstallprompt', ev => {
  ev.preventDefault(); PWA.prompt = ev;
  let b = $('btnInstall');
  if (!b) {
    b = document.createElement('button'); b.id = 'btnInstall'; b.className = 'btn small ghost'; b.textContent = 'Install app';
    b.onclick = async () => { if (!PWA.prompt) return; PWA.prompt.prompt(); try { await PWA.prompt.userChoice; } catch (e) { /* dismissed */ } PWA.prompt = null; b.remove(); };
    const host = document.querySelector('#scr-title .menu-row') || document.querySelector('#scr-title');
    host.appendChild(b);
  }
});
window.addEventListener('appinstalled', () => { const b = $('btnInstall'); if (b) b.remove(); toast('Installed! You can now play from your home screen, even offline.', 'ach'); });
applyA11y();
