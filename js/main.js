'use strict';
// ---------- Boot, save data, input, main loop ----------

const cv = $('game');
const ctx = cv.getContext('2d');
let VW = 0, VH = 0, DPR = 1, ZOOM = 1;
const INPUT = { keys: new Set(), mx: 0, my: 0, joy: null, touchMode: false };

// ---------------- save ----------------
const SAVE_KEY = 'summoner_hellbound_v1';
let SAVE = null;
function defaultSave(mode) {
  const cards = {};
  for (const id of CARD_IDS) cards[id] = { lv: 1, exp: 0, enh: 0 };
  return {
    v: 7, mode, level: 1, exp: 0, stones: 0, cards,
    hotbar: ['spark_beetle', 'venom_mantis', null, null, null, null],
    cleared: STAGES.map(() => false), best: STAGES.map(() => null), stars: STAGES.map(() => [false, false, false]),
    talents: {}, fused: {}, bestiary: {}, ach: {}, seenStory: {},
    relics: {}, relicSlots: [null, null, null], essence: 0, awakened: {}, companion: null, curses: [],
    loadouts: [['spark_beetle', 'venom_mantis', null, null, null, null], ...Array.from({ length: 4 }, () => [null, null, null, null, null, null])], loadoutIdx: 0,
    rushBest: null, savedAt: 0, tier: 0, tierMax: 0, daily: null,
    sanctum: { cards: [null, null, null], since: Date.now() }, cosmetics: { outfit: 'default', circle: 'default' },
    cardStats: {}, history: [],
    mats: { shard: 0, horn: 0, star: 0 }, equip: { owned: {}, slots: { staff: null, robe: null, ring: null } },
    quests: { dayKey: '', daily: [], weekKey: '', weekly: [] }, worldBoss: { week: '', maxHp: 1, hpLeft: 1, claimed: [false, false, false, false], attempts: 0, bestDmg: 0 },
    counters: { summoned: {}, skills: 0, bosses: 0, flawless: 0, trial3: 0, rushDone: 0 },
    stats: { kills: 0, deaths: 0, runs: 0 }, towerBest: 0, tutorialDone: false, endingSeen: false, muted: false,
    evo: {}, altar: { pity: 0, draws: 0 }, village: {}, login: { day: 0, last: '' }, weeklyCh: { week: '', list: [] },
    arena: { rating: 1000, best: 1000, wins: 0, losses: 0, week: '', weekStart: 1000, tickets: 5, ticketDay: '' }, playStats: {}, trueEndingSeen: false,
    skins: { owned: {}, eq: {} }, events: {}, help: {}, tipsSeen: {}, rift: { best: 0, shards: 0, perks: {}, runs: 0 }, lang: null,
    auto: { run: false, runOrder: [], soul: false, soulOrder: [], q: false, f: false, skills: {} },
  };
}
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    const d = defaultSave(o.mode || 'normal');
    for (const k in d) if (o[k] === undefined) o[k] = d[k];
    for (const id of CARD_IDS) if (!o.cards[id]) o.cards[id] = d.cards[id];
    for (const k in d.counters) if (o.counters[k] === undefined) o.counters[k] = d.counters[k];
    return migrateSave(o);
  } catch (e) { return null; }
}
// bring any older or imported save up to the current shape
function migrateSave(o) {
  const d = defaultSave(o.mode || 'normal');
  for (const k in d) if (o[k] === undefined) o[k] = d[k];
  for (const id of CARD_IDS) if (!o.cards[id]) o.cards[id] = d.cards[id];
  for (const k in d.counters) if (o.counters[k] === undefined) o.counters[k] = d.counters[k];
  o.cleared = STAGES.map((s, i) => !!o.cleared[i]);
  o.best = STAGES.map((s, i) => o.best[i] ?? null);
  o.stars = STAGES.map((s, i) => (o.stars[i] || [false, false, false]).map((b, k) => b || (k === 0 && !!o.cleared[i])));
  if (o.v < 2) { o.tutorialDone = true; for (let i = 0; i < 8; i++) if (o.cleared[i]) o.seenStory[i] = true; }
  if (o.v < 3) { o.loadouts[0] = [...o.hotbar]; }
  while (o.loadouts.length < 5) o.loadouts.push([null, null, null, null, null, null]);
  o.relicSlots = [0, 1, 2].map(i => (o.relicSlots[i] && o.relics[o.relicSlots[i]] ? o.relicSlots[i] : null));
  o.level = Math.min(o.level, LEVEL_CAP);
  if (o.stats.playTime === undefined) o.stats.playTime = 0;
  if (!o.counters.rankKills) o.counters.rankKills = {};
  for (const k of ['shard', 'horn', 'star']) if (o.mats[k] === undefined) o.mats[k] = 0;
  if (o.level >= 40 && !o.tierMax) o.tierMax = 1;
  for (const k in d.arena) if (o.arena[k] === undefined) o.arena[k] = d.arena[k];
  for (const k of ["owned", "eq"]) if (!o.skins[k]) o.skins[k] = {};
  for (const k in d.rift) if (o.rift[k] === undefined) o.rift[k] = d.rift[k];
  o.v = 7;
  return o;
}
function saveGame() {
  if (!SAVE) return;
  SAVE.savedAt = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { /* storage unavailable */ }
}
// rolling backups: the last 3 snapshots, at most one every 3 minutes
const BACKUP_KEY = 'summoner_hellbound_backups';
function loadBackups() { try { return JSON.parse(localStorage.getItem(BACKUP_KEY)) || []; } catch (e) { return []; } }
function backupSave(force) {
  if (!SAVE) return;
  const list = loadBackups();
  if (!force && list[0] && Date.now() - list[0].t < 180000) return;
  list.unshift({ t: Date.now(), level: SAVE.level, cleared: SAVE.cleared.filter(Boolean).length, data: JSON.stringify(SAVE) });
  try { localStorage.setItem(BACKUP_KEY, JSON.stringify(list.slice(0, 3))); } catch (e) { /* storage full or blocked */ }
}
window.addEventListener('pagehide', saveGame);
window.addEventListener('beforeunload', saveGame);

// ---------------- canvas sizing ----------------
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  VW = window.innerWidth; VH = window.innerHeight;
  cv.width = Math.floor(VW * DPR); cv.height = Math.floor(VH * DPR);
  ZOOM = clamp(Math.min(VW / 1280, VH / 760), 0.55, 1.25);
  buildVignette();
}
window.addEventListener('resize', resize);

// ---------------- input ----------------
window.addEventListener('keydown', ev => {
  SFX.init();
  const code = ev.code;
  if (REBIND) { handleRebindKey(ev); return; }
  if (INPUT.padMode) { INPUT.padMode = false; INPUT.joy = null; INPUT.aimV = null; }
  if (STATE === 'play' && (KEYMAP[code] || code === 'Tab' || code === 'Space' || code.startsWith('Arrow') || code.startsWith('Numpad'))) ev.preventDefault();
  if (STATE === 'dialogue') { if (code === 'Space' || code === 'Enter' || code === 'NumpadEnter') { ev.preventDefault(); advanceDialogue(); } else if (code === 'Escape') endDialogue(); return; }
  if (STATE === 'play') {
    INPUT.keys.add(code);
    if (ev.repeat) return;
    if (W.choosing) {
      const m = /^(Digit|Numpad)([1-3])$/.exec(code);
      if (m) pickBoost(+m[2] - 1);
      return;
    }
    const act = KEYMAP[code];
    if (!act) return;
    if (act.startsWith('slot')) {
      const i = +act.slice(4) - 1;
      if (actionHeld('skillMod') || (bound('skillMod', 'Shift') && ev.shiftKey)) useCardSkill(i); else trySummon(i);
    } else if (SKILL_ACTION[act]) useSkill(SKILL_ACTION[act]);
    else if (act === 'overdrive') useOverdrive();
    else if (act === 'pause') pauseGame();
    else if (act === 'mute') toggleMute();
    else if (act === 'map') { SETTINGS.minimap = !SETTINGS.minimap; saveSettings(); }
  } else if (STATE === 'pause' && KEYMAP[code] === 'pause') resumeGame();
  else if (STATE === 'grimoire' && KEYMAP[code] && KEYMAP[code].startsWith('slot') && !(ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName))) { ev.preventDefault(); SFX.click(); selectGrimSlot(+KEYMAP[code].slice(4) - 1); }
  else if ((STATE === 'grimoire' || STATE === 'codex') && code === 'Escape') showScreen('map');
  else if ((STATE === 'help' || STATE === 'settings') && code === 'Escape') showScreen(prevScreen);
});
window.addEventListener('keyup', ev => INPUT.keys.delete(ev.code));
window.addEventListener('mousemove', ev => { INPUT.mx = ev.clientX; INPUT.my = ev.clientY; });
window.addEventListener('blur', () => { INPUT.keys.clear(); pauseGame(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseGame(); saveGame(); } });
cv.addEventListener('contextmenu', ev => ev.preventDefault());

// ---------------- loop ----------------
let last = performance.now(), menuT = 0, autosaveT = 10;
function frame(now) {
  requestAnimationFrame(frame);   // scheduled first, so one bad frame can never stop the game loop
  if ((!VW || !VH || !cv.width) && window.innerWidth > 0 && window.innerHeight > 0) resize();
  const rawFrame = (now - last) / 1000;
  const dt = Math.min(0.05, rawFrame);
  last = now;
  pollGamepad();
  perfSample(rawFrame);
  if (STATE === 'play' && SAVE) { SAVE.stats.playTime = (SAVE.stats.playTime || 0) + dt; autosaveT -= dt; if (autosaveT <= 0) { autosaveT = 10; saveGame(); } }
  const overWorld = STATE === 'play' || STATE === 'pause' || STATE === 'result' || ((STATE === 'help' || STATE === 'settings') && prevScreen === 'pause');
  if (W.idx !== undefined && !W.ended && overWorld) {
    const live = STATE === 'play' && !W.choosing;
    if (live) updateWorld(dt);
    renderWorld(live ? dt : 0);
    if (STATE === 'play') updateHUD();
  } else {
    menuT += dt;
    renderMenuBG(menuT, dt);
  }
}

resize();
initMenus();
initTouch();
applyTouchMode();
SAVE = loadSave();
if (SAVE) SFX.setMuted(!!SAVE.muted);
showScreen('title');
requestAnimationFrame(frame);
