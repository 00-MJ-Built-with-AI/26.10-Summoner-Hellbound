'use strict';
// ---------- v5: materials, equipment, quests, World Boss, graphics quality, lighting, weather ----------

// ================= boss materials =================
const MATS = {
  shard: { name: 'Abyss Shard',   icon: '◈', color: '#c78bff', from: 'Act I bosses' },
  horn:  { name: 'Demon Horn',    icon: '♆', color: '#ff6b7f', from: 'Act II bosses' },
  star:  { name: 'Star Fragment', icon: '✶', color: '#fff2a8', from: 'Act III bosses' },
};
function bossMaterial(stageIdx) { return stageIdx < 8 ? 'shard' : stageIdx < 18 ? 'horn' : 'star'; }
function grantMat(id, n, x, y) {
  if (!n) return;
  SAVE.mats[id] = (SAVE.mats[id] || 0) + n;
  if (W.active) { W.mats[id] = (W.mats[id] || 0) + n; if (x !== undefined) txt(x, y, `+${n} ${MATS[id].name}`, MATS[id].color, 15, 1.6); }
}

// ================= equipment for Allen =================
const EQUIP = [
  { id: 'oak_staff',       slot: 'staff', name: 'Oakroot Staff',     icon: '⚚', base: { sumDmg: 0.06 },               per: { sumDmg: 0.02 },                 mat: 'shard', craft: 200 },
  { id: 'ember_scepter',   slot: 'staff', name: 'Ember Scepter',     icon: '⚚', base: { sumDmg: 0.05, crit: 0.05 },   per: { sumDmg: 0.015, crit: 0.01 },    mat: 'horn',  craft: 500 },
  { id: 'astral_rod',      slot: 'staff', name: 'Astral Rod',        icon: '⚚', base: { sumDmg: 0.08, skillCdr: 0.08 }, per: { sumDmg: 0.02, skillCdr: 0.01 }, mat: 'star',  craft: 900 },
  { id: 'apprentice_robe', slot: 'robe',  name: 'Apprentice Robe',   icon: '⛨', base: { hp: 0.08 },                   per: { hp: 0.03 },                     mat: 'shard', craft: 150 },
  { id: 'demonhide',       slot: 'robe',  name: 'Demonhide Coat',    icon: '⛨', base: { hp: 0.06, armor: 0.06 },      per: { hp: 0.02, armor: 0.015 },       mat: 'horn',  craft: 500 },
  { id: 'starweave',       slot: 'robe',  name: 'Starweave Mantle',  icon: '⛨', base: { hp: 0.1, regen: 1 },          per: { hp: 0.03, regen: 0.3 },         mat: 'star',  craft: 900 },
  { id: 'mana_ring',       slot: 'ring',  name: 'Ring of Mana',      icon: '◯', base: { mp: 15, mpRegen: 0.08 },      per: { mp: 5, mpRegen: 0.03 },         mat: 'shard', craft: 150 },
  { id: 'haste_ring',      slot: 'ring',  name: 'Ring of Haste',     icon: '◯', base: { cdr: 0.05, speed: 0.05 },     per: { cdr: 0.015, speed: 0.01 },      mat: 'horn',  craft: 500 },
  { id: 'soul_ring',       slot: 'ring',  name: 'Ring of Souls',     icon: '◯', base: { soul: 0.15, od: 0.2 },        per: { soul: 0.04, od: 0.05 },         mat: 'star',  craft: 900 },
];
const EQUIP_MAX = 10;
const STAT_TEXT = {
  sumDmg: v => `+${pct(v)} summon damage`, crit: v => `+${pct(v)} critical hit chance`, skillCdr: v => `−${pct(v)} special skill cooldowns`,
  hp: v => `+${pct(v)} max HP`, armor: v => `−${pct(v)} damage taken`, regen: v => `+${v.toFixed(1)} HP regeneration/s`,
  mp: v => `+${Math.round(v)} max mana`, mpRegen: v => `+${pct(v)} mana regeneration`, cdr: v => `−${pct(v)} summon cooldowns`,
  speed: v => `+${pct(v)} move speed`, soul: v => `+${pct(v)} soul gauge gain`, od: v => `+${pct(v)} Overdrive charge`,
};
function itemStats(it, lv) { const out = {}; for (const k in it.base) out[k] = it.base[k] + (it.per[k] || 0) * (lv - 1); return out; }
function eqv(stat) {
  if (!SAVE || !SAVE.equip) return 0;
  let v = 0;
  for (const slot in SAVE.equip.slots) {
    const id = SAVE.equip.slots[slot]; if (!id) continue;
    const it = EQUIP.find(x => x.id === id), lv = SAVE.equip.owned[id] || 0;
    if (it && lv) v += itemStats(it, lv)[stat] || 0;
  }
  return v;
}
const craftMats = it => (it.mat === 'shard' ? 5 : it.mat === 'horn' ? 8 : 10);
const upgradeCost = (it, lv) => ({ stones: Math.round(it.craft * 0.3 * Math.pow(lv, 1.4)), mats: Math.ceil(lv * 1.5) });
function craftItem(id) {
  const it = EQUIP.find(x => x.id === id);
  if (SAVE.equip.owned[id] || SAVE.stones < it.craft || (SAVE.mats[it.mat] || 0) < craftMats(it)) return false;
  SAVE.stones -= it.craft; SAVE.mats[it.mat] -= craftMats(it);
  SAVE.equip.owned[id] = 1;
  if (!SAVE.equip.slots[it.slot]) SAVE.equip.slots[it.slot] = id;
  saveGame(); return true;
}
function upgradeItem(id) {
  const it = EQUIP.find(x => x.id === id), lv = SAVE.equip.owned[id];
  if (!lv || lv >= EQUIP_MAX) return false;
  const c = upgradeCost(it, lv);
  if (SAVE.stones < c.stones || (SAVE.mats[it.mat] || 0) < c.mats) return false;
  SAVE.stones -= c.stones; SAVE.mats[it.mat] -= c.mats; SAVE.equip.owned[id] = lv + 1;
  saveGame(); return true;
}

// ================= quest board =================
const dayKey = () => todayKey();
const weekKey = () => 'w' + Math.floor((Date.now() - Date.UTC(2026, 0, 5)) / 604800000);
const QUEST_TYPES = {
  kills:     { text: n => `Slay ${n.toLocaleString()} enemies`,                get: () => SAVE.stats.kills,          d: [300, 500, 800],  w: [3000, 5000] },
  rankKills: { text: (n, r) => `Slay ${n} enemies with ${RANK_BY_ID[r].name} summons`, get: r => (SAVE.counters.rankKills || {})[r] || 0, d: [80, 150, 250], w: [800, 1500], param: true },
  clears:    { text: n => `Clear ${n} stage${n > 1 ? 's' : ''}`,              get: () => SAVE.counters.clears || 0,  d: [2, 3, 4],        w: [15, 25] },
  bosses:    { text: n => `Defeat ${n} bosses`,                              get: () => SAVE.counters.bosses,      d: [2, 3, 5],        w: [15, 30] },
  skills:    { text: n => `Use ${n} special skills`,                         get: () => SAVE.counters.skills,      d: [15, 25, 40],     w: [150, 250] },
  overdrive: { text: n => `Use Grimoire Overdrive ${n} times`,               get: () => SAVE.counters.overdrives || 0, d: [2, 3, 5],    w: [20, 30] },
  goblins:   { text: n => `Catch ${n} Treasure Goblin${n > 1 ? 's' : ''}`,   get: () => SAVE.counters.goblins || 0, d: [1, 2],          w: [8, 12] },
  shrines:   { text: n => `Activate ${n} shrines`,                           get: () => SAVE.counters.shrines || 0, d: [2, 3],          w: [12, 20] },
  summons:   { text: n => `Summon ${n} creatures`,                           get: () => Object.values(SAVE.counters.summoned).reduce((a, b) => a + b, 0), d: [100, 200], w: [1200, 2000] },
};
function makeQuest(weekly) {
  const keys = Object.keys(QUEST_TYPES);
  const type = keys[randi(0, keys.length - 1)], qt = QUEST_TYPES[type];
  const opts = weekly ? qt.w : qt.d, n = opts[randi(0, opts.length - 1)];
  let param = null;
  if (qt.param) { const ranks = RANKS.filter(r => SAVE.level >= r.level).map(r => r.id); param = ranks[randi(0, ranks.length - 1)]; }
  const lvl = 1 + SAVE.level / 10;
  const reward = weekly
    ? { stones: Math.round(450 * lvl), essence: SAVE.cleared[8] ? 3 : 0, mat: bossMaterial(Math.max(0, SAVE.cleared.lastIndexOf(true))), mats: 4 }
    : { stones: Math.round(110 * lvl), essence: 0, mat: bossMaterial(Math.max(0, SAVE.cleared.lastIndexOf(true))), mats: 1 };
  return { type, param, n, base: qt.get(param), reward, claimed: false };
}
function ensureQuests() {
  const q = SAVE.quests;
  if (q.dayKey !== dayKey()) { q.dayKey = dayKey(); q.daily = [0, 1, 2].map(() => makeQuest(false)); }
  if (q.weekKey !== weekKey()) { q.weekKey = weekKey(); q.weekly = [0, 1, 2].map(() => makeQuest(true)); }
}
function questProgress(q) { return Math.max(0, Math.min(q.n, QUEST_TYPES[q.type].get(q.param) - q.base)); }
function claimQuest(q) {
  if (q.claimed || questProgress(q) < q.n) return false;
  q.claimed = true;
  SAVE.stones += q.reward.stones; SAVE.essence += q.reward.essence;
  SAVE.mats[q.reward.mat] = (SAVE.mats[q.reward.mat] || 0) + q.reward.mats;
  SAVE.counters.quests = (SAVE.counters.quests || 0) + 1;
  saveGame(); checkAch(); return true;
}
const questsReady = () => SAVE.quests && [...(SAVE.quests.daily || []), ...(SAVE.quests.weekly || [])].filter(q => !q.claimed && questProgress(q) >= q.n).length;

// ================= World Boss =================
BOSSES.world_titan = {
  name: 'Nyx, the Endless Night', title: 'World Boss · Its strength is shared by the whole week', r: 70, speed: 70, color: '#7a5cff', draw: 'worldtitan',
  patterns: ['laser', 'meteor', 'spiral', 'teleport', 'summon', 'burst', 'slam', 'breath'], minion: 'void_stalker', pcolor: '#b48bff', stones: 0, final: true, world: true,
};
BOSS_DRAW_R.worldtitan = 70;
LORE.world_titan = 'A titan of the endless night. Every attack you land this week wears it down.';
const RAID_TIME = 100;
const WB_MILESTONES = [
  { at: 0.25, stones: 400,  essence: 0, mats: 3 },
  { at: 0.5,  stones: 700,  essence: 3, mats: 0 },
  { at: 0.75, stones: 1000, essence: 0, mats: 6 },
  { at: 1,    stones: 1500, essence: 6, mats: 6 },
];
function ensureWorldBoss() {
  const wb = SAVE.worldBoss;
  if (wb.week !== weekKey()) {
    const maxHp = Math.round(30000 * Math.pow(1.1, SAVE.level - 1) * (1 + 0.3 * (SAVE.tierMax || 0)));
    Object.assign(wb, { week: weekKey(), maxHp, hpLeft: maxHp, claimed: [false, false, false, false], attempts: 0, bestDmg: 0 });
  }
}
function raidStage() {
  return { name: 'World Boss · Nyx', boss: 'world_titan', bossFloor: true, duration: 2, density: 0, enemies: {}, theme: STAGES[7].theme };
}
// grant milestone chests reached so far; returns notes
function worldBossMilestones() {
  const wb = SAVE.worldBoss, done = 1 - wb.hpLeft / wb.maxHp, notes = [];
  WB_MILESTONES.forEach((m, i) => {
    if (wb.claimed[i] || done < m.at - 1e-9) return;
    wb.claimed[i] = true;
    SAVE.stones += m.stones; SAVE.essence += m.essence;
    for (const k in MATS) SAVE.mats[k] = (SAVE.mats[k] || 0) + m.mats;
    if (i === 3) SAVE.counters.worldKills = (SAVE.counters.worldKills || 0) + 1;
    notes.push(`World Boss ${Math.round(m.at * 100)}% chest: ◆ ${m.stones}${m.essence ? ` · ✧ ${m.essence}` : ''}${m.mats ? ` · ${m.mats} of each material` : ''}`);
  });
  return notes;
}
DR.worldtitan = (c, e, t) => {
  const f = Math.sin(t * 1.6);
  c.strokeStyle = F('#2a1a5a'); c.lineWidth = 9; c.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + t * 0.3, l = 80 + Math.sin(t * 2 + i) * 10;
    c.beginPath(); c.moveTo(0, 10);
    c.quadraticCurveTo(Math.cos(a) * l * 0.6, Math.sin(a) * l * 0.4 + 30, Math.cos(a + 0.4 * f) * l, Math.sin(a + 0.4 * f) * l * 0.6 + 20); c.stroke();
  }
  c.fillStyle = F('#0c0820'); circ(c, 0, 0, 60); c.fill();
  c.strokeStyle = F('#7a5cff'); c.lineWidth = 3; c.stroke();
  c.fillStyle = '#e8e0ff';
  for (let i = 0; i < 18; i++) { const a = i * 2.4, r = 10 + (i * 13) % 46; circ(c, Math.cos(a) * r, Math.sin(a) * r * 0.9, 1.2 + (i % 3) * 0.5); c.fill(); }
  const eyes = [[0, -18, 11], [-26, 4, 7], [26, 4, 7], [-14, 24, 5], [14, 24, 5]];
  for (const [x, y, r] of eyes) {
    c.fillStyle = '#1a0a3a'; ell(c, x, y, r * 1.4, r); c.fill();
    c.fillStyle = '#b48bff'; circ(c, x + Math.sin(t + x) * r * 0.3, y, r * 0.55); c.fill();
    c.fillStyle = '#ffffff'; circ(c, x + Math.sin(t + x) * r * 0.3, y, r * 0.2); c.fill();
  }
  c.fillStyle = F('#b48bff');
  c.beginPath(); c.moveTo(-30, -48); c.lineTo(-22, -78); c.lineTo(-10, -56); c.lineTo(0, -88); c.lineTo(10, -56); c.lineTo(22, -78); c.lineTo(30, -48); c.closePath(); c.fill();
};

// ================= graphics quality (Auto steps down/up from measured frame time) =================
const GFX = { auto: 'high', ema: 1 / 60, slowFor: 0, fastFor: 0 };
const gfxLevel = () => (SETTINGS.quality && SETTINGS.quality !== 'auto' ? SETTINGS.quality : GFX.auto);
const GFX_ON = {
  lights: () => gfxLevel() !== 'low',
  bloom: () => gfxLevel() === 'high' && 'filter' in CanvasRenderingContext2D.prototype,
  outlines: () => gfxLevel() === 'high',
  weather: () => gfxLevel() !== 'low',
  dissolve: () => gfxLevel() !== 'low',
};
function perfSample(rawDt) {
  if (rawDt <= 0 || rawDt > 0.25 || document.hidden || STATE !== 'play' || (SETTINGS.quality && SETTINGS.quality !== 'auto')) return;
  GFX.ema = GFX.ema * 0.95 + rawDt * 0.05;
  const order = ['low', 'medium', 'high'], i = order.indexOf(GFX.auto);
  if (GFX.ema > 0.024) { GFX.slowFor += rawDt; GFX.fastFor = 0; } else if (GFX.ema < 0.0145) { GFX.fastFor += rawDt; GFX.slowFor = 0; } else { GFX.slowFor = 0; GFX.fastFor = 0; }
  if (GFX.slowFor > 2.5 && i > 0) { GFX.auto = order[i - 1]; GFX.slowFor = 0; GFX.ema = 1 / 60; }
  if (GFX.fastFor > 15 && i < 2) { GFX.auto = order[i + 1]; GFX.fastFor = 0; }
}

// ================= lighting =================
const LIGHT = { c: null, x: null, sprite: null };
const DARKNESS = [0.18, 0.35, 0.5, 0.4, 0.32, 0.22, 0.42, 0.55, 0.38, 0.4, 0.45, 0.5, 0.35, 0.4, 0.55, 0.42, 0.45, 0.55, 0.3, 0.15, 0.2, 0.4, 0.5, 0.22, 0.45, 0.35, 0.25, 0.45];
function lightSprite() {
  if (LIGHT.sprite) return LIGHT.sprite;
  const s = document.createElement('canvas'); s.width = s.height = 64;
  const c = s.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  return (LIGHT.sprite = s);
}
function renderLighting(ctx, cx, cy, z, t) {
  const w = Math.max(1, Math.floor(VW / 2)), h = Math.max(1, Math.floor(VH / 2));
  if (!LIGHT.c || LIGHT.c.width !== w || LIGHT.c.height !== h) { LIGHT.c = document.createElement('canvas'); LIGHT.c.width = w; LIGHT.c.height = h; LIGHT.x = LIGHT.c.getContext('2d'); }
  const lx = LIGHT.x, k = 0.5, spr = lightSprite();
  const dark = W.isRaid ? 0.55 : (DARKNESS[W.themeIdx] ?? 0.4);
  lx.globalCompositeOperation = 'source-over'; lx.globalAlpha = 1;
  lx.clearRect(0, 0, w, h);
  lx.fillStyle = `rgba(4,2,14,${dark})`; lx.fillRect(0, 0, w, h);
  lx.globalCompositeOperation = 'destination-out';
  const L = (x, y, r, a = 1) => {
    const sx = ((x - cx) * z + VW / 2) * k, sy = ((y - cy) * z + VH / 2) * k, rr_ = r * z * k;
    if (sx < -rr_ || sy < -rr_ || sx > w + rr_ || sy > h + rr_) return;
    lx.globalAlpha = a; lx.drawImage(spr, sx - rr_, sy - rr_, rr_ * 2, rr_ * 2);
  };
  const p = W.player;
  if (!p.dead) L(p.x, p.y, 300 + Math.sin(t * 3) * 6, 1);
  for (const s of W.summons) L(s.x, s.y, 70 + s.r * 3, 0.85);
  for (const e of W.enemies) if (e.isBoss || e.elite || e.champion) L(e.x, e.y, e.r * 4, 0.7);
  for (const q of W.projs) L(q.x, q.y, q.team === 'ally' ? 55 : 45, 0.8);
  for (const zn of W.zones) L(zn.x, zn.y, zn.r * 1.3, 0.7);
  for (const m of W.circles) L(m.x, m.y, m.r * 1.6, 0.8);
  for (const k2 of W.pickups) if (k2.type !== 'exp') L(k2.x, k2.y, 40, 0.6);
  for (const b of W.beams) { L(b.x1, b.y1, 80, 0.8); L((b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2, 120, 0.8); L(b.x2, b.y2, 80, 0.8); }
  for (const d of W.deco) if (d.type === 'lavapool' || d.type === 'crystal' || d.type === 'mushroom' || d.type === 'starshard' || d.type === 'crack' || d.type === 'rune') L(d.x, d.y, 90 * d.s, 0.55 + Math.sin(t * 2 + d.seed) * 0.1);
  if (W.ev && W.ev.type === 'shrine') L(W.ev.x, W.ev.y, 160, 0.9);
  let n = 0;
  for (const q of P) { if (q.kind === 'glow' && q.size > 6 && (n++ & 3) === 0) L(q.x, q.y, q.size * 6, Math.min(1, q.life / q.max)); }
  lx.globalAlpha = 1; lx.globalCompositeOperation = 'source-over';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.drawImage(LIGHT.c, 0, 0, VW, VH);
}

// ================= bloom =================
const BLOOM = { c: null, x: null };
function renderBloom(ctx) {
  const w = Math.max(1, Math.floor(VW / 4)), h = Math.max(1, Math.floor(VH / 4));
  if (!BLOOM.c || BLOOM.c.width !== w || BLOOM.c.height !== h) { BLOOM.c = document.createElement('canvas'); BLOOM.c.width = w; BLOOM.c.height = h; BLOOM.x = BLOOM.c.getContext('2d'); }
  const b = BLOOM.x;
  b.globalCompositeOperation = 'source-over';
  b.filter = 'none'; b.clearRect(0, 0, w, h);
  b.filter = 'brightness(0.75) contrast(2.2) blur(5px)';
  b.drawImage(ctx.canvas, 0, 0, w, h);
  b.filter = 'none';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.32;
  ctx.drawImage(BLOOM.c, 0, 0, VW, VH);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

// ================= weather =================
const WEATHER = { 1: 'fog', 3: 'rain', 4: 'ash', 5: 'snow', 9: 'ash', 10: 'rain', 13: 'ash', 14: 'fog', 18: 'fog', 19: 'fog', 21: 'storm', 24: 'fog', 25: 'storm' };
const WX = { drops: [], fog: null, flash: 0, nextFlash: 4 };
function fogTexture() {
  if (WX.fog) return WX.fog;
  const s = document.createElement('canvas'); s.width = s.height = 256;
  const c = s.getContext('2d'), rng = mulberry32(77);
  for (let i = 0; i < 26; i++) {
    const x = rng() * 256, y = rng() * 256, r = 30 + rng() * 70;
    for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) {
      const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      g.addColorStop(0, 'rgba(220,225,255,0.10)'); g.addColorStop(1, 'rgba(220,225,255,0)');
      c.fillStyle = g; c.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
  return (WX.fog = s);
}
function drawWeather(ctx, t, dt, cx, cy) {
  const type = W.isRaid ? null : WEATHER[W.themeIdx];
  if (!type) return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (type === 'fog' || type === 'storm') {
    const tex = fogTexture(), sz = 512;
    ctx.globalAlpha = type === 'fog' ? 0.9 : 0.5;
    for (const [sp, par] of [[12, 0.4], [-8, 0.7]]) {
      const ox = ((-(cx * par) + t * sp) % sz + sz) % sz - sz, oy = ((-(cy * par)) % sz + sz) % sz - sz;
      for (let x = ox; x < VW; x += sz) for (let y = oy; y < VH; y += sz) ctx.drawImage(tex, x, y, sz, sz);
    }
    ctx.globalAlpha = 1;
  }
  if (type === 'rain' || type === 'storm' || type === 'snow' || type === 'ash') {
    const want = type === 'snow' ? 140 : type === 'ash' ? 90 : 170;
    while (WX.drops.length < want) WX.drops.push({ x: Math.random() * VW, y: Math.random() * VH, v: rand(0.6, 1.2), ph: rand(TAU) });
    if (WX.drops.length > want) WX.drops.length = want;
    const isRain = type === 'rain' || type === 'storm';
    ctx.strokeStyle = 'rgba(170,200,255,0.35)'; ctx.lineWidth = 1;
    if (isRain) ctx.beginPath();
    for (const d of WX.drops) {
      if (isRain) { d.x += -120 * d.v * dt; d.y += 900 * d.v * dt; }
      else if (type === 'snow') { d.x += (Math.sin(t + d.ph) * 30 - 40) * d.v * dt; d.y += 90 * d.v * dt; }
      else { d.x += Math.sin(t * 0.7 + d.ph) * 20 * dt; d.y += 35 * d.v * dt; }
      if (d.y > VH + 10) { d.y = -10; d.x = Math.random() * (VW + 100); }
      if (d.x < -20) d.x = VW + 10;
      if (isRain) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 3, d.y + 16 * d.v); }
      else { ctx.fillStyle = type === 'snow' ? `rgba(255,255,255,${0.5 * d.v})` : `rgba(160,150,140,${0.45 * d.v})`; ctx.fillRect(d.x, d.y, type === 'snow' ? 2.6 * d.v : 2, type === 'snow' ? 2.6 * d.v : 2); }
    }
    if (isRain) ctx.stroke();
  }
  if (type === 'storm') {
    WX.nextFlash -= dt;
    if (WX.nextFlash <= 0) { WX.nextFlash = rand(4, 9); WX.flash = 0.35; SFX.thunder && SFX.thunder(); }
    if (WX.flash > 0) { WX.flash -= dt; ctx.fillStyle = `rgba(220,235,255,${Math.max(0, WX.flash) * 0.6})`; ctx.fillRect(0, 0, VW, VH); }
  }
}

// ================= dissolving deaths =================
function addDissolve(e) {
  if (!GFX_ON.dissolve() || !W.dissolves) return;
  if (W.dissolves.length > 40) W.dissolves.shift();
  W.dissolves.push({ e, t: 0, dur: e.isBoss ? 1.2 : 0.45 });
}
function drawDissolves(ctx, t, dt) {
  if (!W.dissolves) return;
  for (const d of W.dissolves) {
    d.t += dt;
    const k = d.t / d.dur; if (k >= 1) continue;
    ctx.save();
    ctx.globalAlpha = (1 - k) * 0.85;
    ctx.translate(0, -k * 18);
    const e = d.e, keep = e.flash; e.flash = k < 0.4 ? 1 : 0;
    drawEntity(ctx, e, 'enemy', t);
    e.flash = keep;
    ctx.restore();
  }
  W.dissolves = W.dissolves.filter(d => d.t < d.dur);
}

ACHIEVEMENTS.push(
  { id: 'quests25',  name: 'Bounty Hunter',      reward: 200, desc: 'Complete 25 quests.',              check: () => (SAVE.counters.quests || 0) >= 25 },
  { id: 'craft3',    name: 'Well Equipped',      reward: 150, desc: 'Equip a staff, robe and ring.',    check: () => !!(SAVE.equip.slots.staff && SAVE.equip.slots.robe && SAVE.equip.slots.ring) },
  { id: 'equip10',   name: 'Master Smith',       reward: 300, desc: 'Upgrade an item to +10.',          check: () => Object.values(SAVE.equip.owned).some(v => v >= EQUIP_MAX) },
  { id: 'worldboss', name: 'Bane of the Night',  reward: 500, desc: 'Defeat the weekly World Boss.',    check: () => (SAVE.counters.worldKills || 0) >= 1 },
);
OUTFITS.push({ id: 'nightbane', name: 'Nightbane Armor', cloak: '#1a1040', trim: '#b48bff', gold: '#e8e0ff', req: 'Defeat a World Boss', ok: () => (SAVE.counters.worldKills || 0) >= 1 });

if (!SETTINGS.quality) SETTINGS.quality = 'auto';
