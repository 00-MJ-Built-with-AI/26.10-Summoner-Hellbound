'use strict';
// ---------- v7: level cap 70 + Primordial rank, seasonal events (Halloween), summon skins,
//            adaptive help, controller rumble, What's new + first-time tips ----------

// ================= level cap 70, card cap 40, Primordial rank (SS) at Lv 60 =================
const _v7_cap = PLAYER.cap;
PLAYER.cap = L => _v7_cap(L) + Math.max(0, Math.floor((L - 50) / 5));
CARD_PROG.maxLv = 40;
RANKS.push({ id: 'primordial', name: 'Primordial', grade: 'SS', level: 60, color: '#ff6bd6' });
RANK_BY_ID.primordial = RANKS[RANKS.length - 1];
SYNERGIES.primordial = { name: 'Dawn of Creation', desc: 'Primordial summons deal +25% damage and get +25% HP.' };
const _v7_synMods = synMods;
synMods = function (c) { const m = _v7_synMods(c); if (c.tags.includes('primordial') && syn('primordial')) { m.dmg *= 1.25; m.hp *= 1.25; } return m; };
const PRIMORDIAL = [
  ['chaos_wyrm', 'Chaos Wyrm', 'Worldbreaker', 'An ancient wyrm whose breath unmakes the ground it touches.', 'drake', { s: 1.45 }, { cost: 95, cd: 18, ai: 'dragon', flying: true, weight: 3, hp: 1300, dmg: 70, bite: 120, atkCd: 1, range: 260, breath: 'fire', speed: 230, r: 24, color: '#ff4d8a' }, ['inferno', 'Unmaking Flame', 40, 22, 'Sets a huge area ablaze around the wyrm.']],
  ['void_seraph', 'Void Seraph', 'Herald of Nothing', 'A six-winged seraph of the void that fires lances through entire armies.', 'angel', { wings: 3, span: 34, acc: '#ff6bd6' }, { cost: 90, cd: 15, ai: 'ranged', flying: true, weight: 3, hp: 650, dmg: 110, atkCd: 0.8, range: 430, projSpeed: 720, pierce: 8, lance: true, speed: 230, r: 20, color: '#c78bff' }, ['judgment', 'Void Judgment', 38, 18, 'A colossal beam of void toward your cursor.']],
  ['world_turtle', 'World Turtle', 'Bearer of Lands', 'A turtle the size of a hill. It taunts everything and crushes what comes close.', 'golem', { s: 1.6 }, { cost: 100, cd: 22, ai: 'taunt', stationary: true, weight: 3, hp: 3600, dmg: 90, atkCd: 1.3, aura: 340, slam: 140, r: 34, color: '#7dffb0' }, ['fortress', 'Continental Shell', 30, 20, 'Invulnerable for 6s, blocks projectiles and taunts a wider area.']],
  ['genesis_bloom', 'Genesis Bloom', 'First Flower', 'The first flower of creation. Its pollen heals allies and withers foes.', 'plant', { s: 1.4 }, { cost: 85, cd: 16, ai: 'thorns', stationary: true, weight: 2.5, hp: 1500, dmg: 40, aura: 230, slow: 0.4, poison: 18, heal: 30, healAura: 260, r: 22, color: '#ffd1fa' }, ['sanctuary', 'Rebirth Pollen', 34, 20, 'Heals every nearby ally for 40% of max HP.']],
];
for (const [id, name, role, desc, tpl, tp, stats, skill] of PRIMORDIAL) {
  CARDS[id] = Object.assign({ rank: 'primordial', name, role, desc, tpl: [tpl, tp], tags: ['primordial'] }, stats);
  CARD_SKILLS[id] = { fx: skill[0], name: skill[1], mp: skill[2], cd: skill[3], desc: skill[4] };
  DR[id] = (c, e, t) => TPL[tpl](c, e, t, tp);
  CARD_IDS.push(id);
}
ACHIEVEMENTS.push(
  { id: 'lv60', name: 'Primordial Pact', reward: 800,  desc: 'Reach level 60 and unlock the Primordial rank.', check: () => SAVE.level >= 60 },
  { id: 'lv70', name: 'Beyond Hell',     reward: 1500, desc: 'Reach level 70.',                                  check: () => SAVE.level >= 70 },
);

// ================= custom (non-map) stages: events and the Rift use this =================
let CUSTOM_START = false;
function stageForLevel(L) { let k = 0; STAGES.forEach((s, i) => { if (s.rec <= L) k = i; }); return k; }
function startCustomStage(o) {
  SFX.init();
  const base = o.baseIdx ?? stageForLevel(SAVE.level);
  CUSTOM_START = true;
  try { startStage(base, 'stage'); } finally { CUSTOM_START = false; }
  Object.assign(W, { curses: new Set(), rewardMult: o.rewardMult || 1, custom: o.kind }, o.flags || {});
  if (o.themeKey) { W.themeIdx = o.themeKey; W.deco = genDeco(o.themeKey); initAmbient(); }
  W.st = Object.assign({ density: 1.4, duration: 120, enemies: {}, theme: STAGES[base].theme, ch: [] }, o.st);
  buildHUD();
  showScreen('play');
  if (o.banner) banner(o.banner, 'boss');
  if (o.music) MUSIC.play(o.music);
}
// a results screen for custom stages; retry goes back to where the player started
const CUSTOM_UI = { retry: null };
function customResult(title, lose, subtitle, rows, notes, retryLabel, retryFn) {
  W.resultShown = true;
  hideBoostModal(); hideBossBar(); MUSIC.play('menu');
  const t = $('resTitle'); t.textContent = title; t.classList.toggle('lose', !!lose);
  $('resStage').textContent = subtitle;
  fillResults(rows);
  $('resExtra').innerHTML = notes.map(n => `<div class="res-note relic">${n}</div>`).join('');
  const retry = $('btnResRetry');
  if (!CUSTOM_UI.retry) CUSTOM_UI.retry = retry.onclick;
  retry.textContent = retryLabel;
  retry.onclick = () => { SFX.click(); W.ended = true; retry.onclick = CUSTOM_UI.retry; CUSTOM_UI.retry = null; retryFn(); };
  checkAch(); saveGame(); backupSave(true);
  showScreen('result');
}

// ================= seasonal events =================
// Each event has a date window, a currency that drops in every battle, an event stage with its own
// enemies and boss, and a shop. Add a new entry here for winter, Ramadan, summer and so on.
const EVENTS = [{
  id: 'halloween2026', name: 'Night of Pumpkins', icon: '🎃', start: new Date(2026, 9, 27), end: new Date(2026, 10, 8),
  currency: { id: 'candy', name: 'Candy', icon: '🍬', col: '#ff9a3a' },
  stage: { name: 'Pumpkin Hollow', boss: 'pumpkin_king', duration: 110, density: 1.6, enemies: { pumpkin_imp: 3, ghostling: 3, candy_bat: 2, scarecrow: 1 } },
  theme: 'ev_halloween', music: 'a2a',
  blurb: 'A haunted pumpkin patch that only appears in late October. Candy drops from every enemy in every battle while the event runs.',
  shop: [
    { id: 'hw_outfit', name: 'Jack-o\'-Cloak (Allen outfit)', cost: 300, kind: 'outfit', ref: 'jackcloak' },
    { id: 'hw_circle', name: 'Witchfire summon circle', cost: 200, kind: 'circle', ref: 'witchfire' },
    { id: 'hw_skin1',  name: 'Pumpkin summon skin', cost: 250, kind: 'skin', ref: 'pumpkin' },
    { id: 'hw_skin2',  name: 'Spectral summon skin', cost: 250, kind: 'skin', ref: 'spectral' },
    { id: 'hw_draw',   name: '3 free Altar draws', cost: 90, kind: 'draws', ref: 3, repeat: true },
    { id: 'hw_stones', name: '◆ 1,500 magic stones', cost: 120, kind: 'stones', ref: 1500, repeat: true },
    { id: 'hw_ess',    name: '✧ 3 Abyss Essence', cost: 150, kind: 'essence', ref: 3, repeat: true },
  ],
}];
let EVENT_NOW = null;   // tests can pin "now"
const evNow = () => EVENT_NOW || new Date();
const activeEvent = () => EVENTS.find(e => evNow() >= e.start && evNow() < e.end) || null;
const evState = id => { const s = SAVE.events || (SAVE.events = {}); return s[id] || (s[id] = { cur: 0, earned: 0, bought: {}, clears: 0 }); };
const evDaysLeft = ev => Math.max(0, Math.ceil((ev.end - evNow()) / 864e5));
function evBuy(ev, item) {
  const st = evState(ev.id);
  if ((!item.repeat && st.bought[item.id]) || st.cur < item.cost) return false;
  st.cur -= item.cost; st.bought[item.id] = (st.bought[item.id] || 0) + 1;
  if (item.kind === 'outfit' || item.kind === 'circle') SAVE.cosmetics[item.ref] = true;
  else if (item.kind === 'skin') SAVE.skins.owned[item.ref] = true;
  else if (item.kind === 'draws') SAVE.altar.free = (SAVE.altar.free || 0) + item.ref;
  else if (item.kind === 'stones') SAVE.stones += item.ref;
  else if (item.kind === 'essence') SAVE.essence += item.ref;
  saveGame(); checkAch();
  return true;
}
function dropEventCurrency(e) {
  const ev = activeEvent();
  if (!ev || !W.active || W.isRaid) return;
  const n = e.isBoss ? 15 : e.elite || e.champion ? 3 : Math.random() < 0.05 ? 1 : 0;
  if (!n) return;
  const st = evState(ev.id);
  st.cur += n; st.earned += n; W.evGain = (W.evGain || 0) + n;
  txt(e.x, e.y - e.r - 18, `+${n} ${ev.currency.icon}`, ev.currency.col, 13, 0.9);
}
const _v7_killEnemy = killEnemy;
killEnemy = function (e, src) { const was = e.dead; _v7_killEnemy(e, src); if (!was && e.dead) dropEventCurrency(e); };

// Halloween content
Object.assign(ENEMIES, {
  pumpkin_imp: { name: 'Pumpkin Imp',   hp: 60,  speed: 120, dmg: 12, r: 13, exp: 7,  ai: 'chase',    color: '#ff8a1a', draw: 'pumpkin' },
  ghostling:   { name: 'Ghostling',     hp: 45,  speed: 150, dmg: 10, r: 12, exp: 6,  ai: 'erratic',  color: '#e8f0ff', draw: 'ghostling' },
  candy_bat:   { name: 'Candy Bat',     hp: 30,  speed: 190, dmg: 8,  r: 11, exp: 5,  ai: 'erratic',  color: '#ff6bd6', draw: 'bat', lifesteal: true },
  scarecrow:   { name: 'Scarecrow',     hp: 160, speed: 70,  dmg: 18, r: 17, exp: 14, ai: 'ranged',   color: '#c9a06a', draw: 'scarecrow', range: 280, atkCd: 2.2, projSpeed: 300, spread: 3, pcolor: '#ff9a3a' },
});
Object.assign(LORE, {
  pumpkin_imp: 'Hops after you with a grin carved by something hungry.',
  ghostling: 'Too small to be scary. Unless there are fifty of them.',
  candy_bat: 'Sticky, sweet and it bites.',
  scarecrow: 'Throws flaming seeds. The crows stay away for a reason.',
  pumpkin_king: 'King of the hollow. Phase two: he lights his own head on fire.',
});
BOSS_DRAW_R.pumpkinking = 52;
BOSSES.pumpkin_king = {
  name: 'The Pumpkin King', title: 'Lord of the Hollow · Halloween event', r: 50, speed: 110, color: '#ff8a1a', draw: 'pumpkinking', pcolor: '#ffcf5a', minion: 'pumpkin_imp', stones: 300, cine: true, event: true,
  patterns: ['summon', 'spiral', 'charge'],
  phases: [{ at: 0.5, name: 'Jack o\' Flame', color: '#7dff5a', pcolor: '#c9ff9a', minion: 'ghostling', patterns: ['spiral', 'meteor', 'charge', 'summon', 'burst'], speed: 1.3 }],
};
STAGES.ev_halloween = { theme: mkTheme('#1a1208', '#0c0804', '#ff9a3a', '#ff7a1a', '#060402', { bone: 3, mushroom: 3, rock: 2 }, 'ember') };
DARKNESS.ev_halloween = 0.6;
OUTFITS.push({ id: 'jackcloak', name: 'Jack-o\'-Cloak', cloak: '#3a1a04', trim: '#ff8a1a', gold: '#7dff5a', req: 'Halloween event shop', ok: () => !!(SAVE.cosmetics && SAVE.cosmetics.jackcloak) });
CIRCLES.push({ id: 'witchfire', name: 'Witchfire', color: '#7dff5a', req: 'Halloween event shop', ok: () => !!(SAVE.cosmetics && SAVE.cosmetics.witchfire) });
DR.pumpkin = (c, e, t) => {
  const hop = Math.abs(Math.sin(t * 7 + (e.seed || 0))) * 4;
  c.fillStyle = F('#ff8a1a');
  for (const [x, w] of [[-6, 8], [6, 8], [0, 9]]) { ell(c, x, -hop, w, 11); c.fill(); }
  c.strokeStyle = F('#b85a08'); c.lineWidth = 1.2; for (const x of [-4, 4]) { c.beginPath(); c.moveTo(x, -10 - hop); c.quadraticCurveTo(x * 1.6, -hop, x, 10 - hop); c.stroke(); }
  c.fillStyle = F('#3a7a1a'); c.fillRect(-1.5, -15 - hop, 3, 5);
  c.fillStyle = '#ffe066';
  c.beginPath(); c.moveTo(-7, -4 - hop); c.lineTo(-3, -4 - hop); c.lineTo(-5, -8 - hop); c.fill();
  c.beginPath(); c.moveTo(3, -4 - hop); c.lineTo(7, -4 - hop); c.lineTo(5, -8 - hop); c.fill();
  c.beginPath(); c.moveTo(-7, 2 - hop); for (let k = 0; k <= 6; k++) c.lineTo(-7 + k * 2.3, (k % 2 ? 5 : 2) - hop); c.lineTo(7, 4 - hop); c.quadraticCurveTo(0, 9 - hop, -7, 2 - hop); c.fill();
};
DR.ghostling = (c, e, t) => {
  const f = Math.sin(t * 5 + (e.seed || 0));
  c.fillStyle = F('rgba(232,240,255,0.92)');
  c.beginPath(); c.moveTo(-10, 8); c.quadraticCurveTo(-11, -14, 0, -14); c.quadraticCurveTo(11, -14, 10, 8);
  for (let k = 0; k < 4; k++) c.lineTo(10 - (k + 0.5) * 5, 8 + (k % 2 ? 0 : 4 + f * 2));
  c.closePath(); c.fill();
  c.fillStyle = '#1a1a2a'; ell(c, -4, -5, 2.2, 3); c.fill(); ell(c, 4, -5, 2.2, 3); c.fill(); ell(c, 0, 2, 2, 2.5 + f); c.fill();
};
DR.scarecrow = (c, e, t) => {
  const sw = Math.sin(t * 2 + (e.seed || 0)) * 0.08;
  c.save(); c.rotate(sw);
  c.strokeStyle = F('#6a4a2a'); c.lineWidth = 3; c.beginPath(); c.moveTo(0, 18); c.lineTo(0, -10); c.moveTo(-17, -4); c.lineTo(17, -4); c.stroke();
  c.fillStyle = F('#8a3a2a'); c.fillRect(-10, -8, 20, 16);
  c.fillStyle = F('#e6c25a'); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 17, -6); c.lineTo(s * 22, -1); c.lineTo(s * 17, 0); c.fill(); }
  c.fillStyle = F('#ff8a1a'); circ(c, 0, -15, 7); c.fill();
  c.fillStyle = F('#3a2a1a'); c.beginPath(); c.moveTo(-11, -18); c.lineTo(11, -18); c.lineTo(0, -30); c.fill();
  c.fillStyle = '#ffe066'; circ(c, -2.5, -16, 1.4); c.fill(); circ(c, 2.5, -16, 1.4); c.fill();
  c.restore();
};
DR.pumpkinking = (c, e, t) => {
  const col = e.col || '#ff8a1a', fl = Math.sin(t * 6);
  c.strokeStyle = F('#2a5a14'); c.lineWidth = 6; c.lineCap = 'round';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 30, 10); c.bezierCurveTo(s * 60, 0 + fl * 6, s * 50, 40, s * 74, 30 + fl * 8); c.stroke(); }
  c.fillStyle = F('#ff8a1a');
  for (const [x, w] of [[-20, 24], [20, 24], [-8, 26], [8, 26]]) { ell(c, x, 6, w, 34); c.fill(); }
  c.strokeStyle = F('#b85a08'); c.lineWidth = 2; for (const x of [-14, 0, 14]) { c.beginPath(); c.moveTo(x, -26); c.quadraticCurveTo(x * 1.5, 6, x, 38); c.stroke(); }
  c.fillStyle = F('#ffd34a');
  c.beginPath(); c.moveTo(-26, -24); c.lineTo(-20, -48); c.lineTo(-9, -32); c.lineTo(0, -54); c.lineTo(9, -32); c.lineTo(20, -48); c.lineTo(26, -24); c.closePath(); c.fill();
  const glow = col === '#ff8a1a' ? '#ffe066' : col;
  c.fillStyle = glow;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 20, -4); c.lineTo(s * 6, -4); c.lineTo(s * 13, -16); c.fill(); }
  c.beginPath(); c.moveTo(-24, 12);
  for (let k = 0; k <= 8; k++) c.lineTo(-24 + k * 6, k % 2 ? 22 : 13);
  c.quadraticCurveTo(0, 36, -24, 12); c.fill();
  if (col !== '#ff8a1a') for (let k = 0; k < 3; k++) { c.fillStyle = rgba(col, 0.5); ell(c, rand(-14, 14), -60 - k * 8 + fl * 3, 6 - k, 10 - k * 2); c.fill(); }
  glowAt(c, 0, 4, 60, glow, 0.25);
};
function enterEvent(ev) {
  startCustomStage({
    kind: 'event', themeKey: ev.theme, music: ev.music, banner: ev.stage.name,
    flags: { isEvent: true, eventId: ev.id },
    st: Object.assign({ name: `${ev.icon} ${ev.stage.name}` }, ev.stage, { theme: STAGES[ev.theme].theme }),
  });
}
function eventFinish(won, retreat) {
  const ev = EVENTS.find(x => x.id === W.eventId), st = evState(ev.id);
  let bonus = 0;
  if (won) { bonus = 40 + (st.clears === 0 ? 60 : 0); st.clears++; st.cur += bonus; st.earned += bonus; SAVE.skins.owned.jack = true; }
  customResult(won ? 'HOLLOW CLEARED' : retreat ? 'RETREATED' : 'DEFEATED', !won, `${ev.icon} ${ev.stage.name}`,
    [['Time', fmtTime(W.time)], ['Enemies slain', W.kills], [ev.currency.name, `${ev.currency.icon} +${(W.evGain || 0) + bonus}`], ['Total ' + ev.currency.name.toLowerCase(), `${ev.currency.icon} ${st.cur}`], ['EXP gained', fmt(W.expGained)], ['Magic stones', '◆ ' + W.stones]],
    won ? [`Clear bonus: ${ev.currency.icon} ${bonus}${bonus > 40 ? ' (first clear)' : ''}`, 'The Jack summon skin is now yours.'] : [],
    'Play Again', () => enterEvent(ev));
}
// map: event tab + panel
const _v7_buildMap = buildMap;
buildMap = function () {
  _v7_buildMap();
  const ev = activeEvent(), bar = $('regionBar');
  if (!ev || !bar) return;
  const b = document.createElement('button');
  b.className = 'rtab mode event' + (selectedStage === 'event' ? ' active' : '');
  b.dataset.mode = 'event';
  b.textContent = `${ev.icon} ${ev.name}`;
  b.onclick = () => { SFX.click(); selectStage('event'); };
  bar.insertBefore(b, bar.querySelector('.rtab.mode'));
};
const _v7_renderStageInfo = renderStageInfo;
renderStageInfo = function () {
  if (selectedStage !== 'event') { _v7_renderStageInfo(); return; }
  const ev = activeEvent();
  if (!ev) { selectedStage = 0; _v7_renderStageInfo(); return; }
  const st = evState(ev.id), cur = ev.currency;
  $('stageInfo').innerHTML = `
    <div class="muted" style="font-size:12px;letter-spacing:.2em;text-transform:uppercase">Event · ${evDaysLeft(ev)} days left</div>
    <h3 style="color:#ff9a3a;text-shadow:0 0 14px #ff7a1a">${ev.icon} ${ev.name}</h3>
    <p class="blurb">${ev.blurb}</p>
    <div class="info-row"><span>${cur.name}</span><span>${cur.icon} ${st.cur}</span></div>
    <div class="info-row"><span>Hollow clears</span><span>${st.clears}</span></div>
    <button class="btn primary" id="btnEnter">Enter ${ev.stage.name}</button>
    <h4 class="ev-shop-h">Event shop</h4>
    <div class="ev-shop">${ev.shop.map(it => { const own = !it.repeat && st.bought[it.id]; return `<div class="ev-item"><span>${it.name}</span><button class="btn small ${!own && st.cur >= it.cost ? 'primary' : ''}" data-ev="${it.id}" ${own || st.cur < it.cost ? 'disabled' : ''}>${own ? 'Owned' : `${cur.icon} ${it.cost}`}</button></div>`; }).join('')}</div>`;
  $('btnEnter').onclick = () => { SFX.click(); enterEvent(ev); };
  $('stageInfo').querySelectorAll('[data-ev]').forEach(b => b.onclick = () => { const it = ev.shop.find(x => x.id === b.dataset.ev); if (evBuy(ev, it)) { SFX.level(); toast(`Bought: ${it.name}`, 'ach'); renderStageInfo(); } });
};

// ================= summon skins (earned only; equipped per card) =================
const SKINS = [
  { id: 'pumpkin',   name: 'Pumpkin',      col: '#ff8a1a', from: 'Halloween event shop' },
  { id: 'spectral',  name: 'Spectral',     col: '#bff6ff', alpha: 0.75, from: 'Halloween event shop' },
  { id: 'jack',      name: 'Jack Flame',   col: '#7dff5a', aura: true, from: 'Clear Pumpkin Hollow' },
  { id: 'gold',      name: 'Gilded',       col: '#ffd66b', aura: true, from: 'Reach Gold in the arena', ok: () => SAVE.arena.best >= 1250 },
  { id: 'frostlight', name: 'Frostlight',  col: '#7fe8ff', from: 'Reach Platinum in the arena', ok: () => SAVE.arena.best >= 1400 },
  { id: 'prismatic', name: 'Prismatic',    col: 'prism', aura: true, from: 'Reach Mythic in the arena', ok: () => SAVE.arena.best >= 1700 },
  { id: 'sakura',    name: 'Sakura',       col: '#ffb3d9', from: 'Day 14 of the login calendar', ok: () => SAVE.login.day >= 14 },
  { id: 'pact',      name: 'Pactbound',    col: '#e2c6ff', aura: true, from: 'Day 28 of the login calendar', ok: () => !!SAVE.cosmetics.calendar },
  { id: 'riftborn',  name: 'Riftborn',     col: '#5ab8ff', from: 'Reach Rift floor 10', ok: () => (SAVE.rift && SAVE.rift.best || 0) >= 10 },
  { id: 'voidwalker', name: 'Voidwalker',  col: '#5a3cff', aura: true, from: 'Reach Rift floor 25', ok: () => (SAVE.rift && SAVE.rift.best || 0) >= 25 },
  { id: 'abyssal',   name: 'Abyssal',      col: '#b06bff', from: 'Reach Abyss Tower floor 30', ok: () => SAVE.towerBest >= 30 },
  { id: 'crimson',   name: 'Crimson',      col: '#ff3355', from: 'Complete a Boss Rush', ok: () => (SAVE.counters.rushDone || 0) >= 1 },
  { id: 'nyx',       name: 'Nightfall',    col: '#7a5cff', aura: true, from: 'Help defeat Nyx, the World Boss', ok: () => (SAVE.counters.worldKills || 0) >= 1 },
  { id: 'starlit',   name: 'Starlit',      col: '#fff2a8', from: 'Make 100 Altar draws', ok: () => (SAVE.counters.altar || 0) >= 100 },
  { id: 'emerald',   name: 'Emerald',      col: '#5dff9a', from: 'Build every village building to level 5', ok: () => BUILDINGS.every(b => bLv(b.id) >= BLD_MAX) },
  { id: 'ink',       name: 'First Ink',    col: '#2a2440', bright: 1.4, from: 'See the true ending', ok: () => !!SAVE.cleared[37] },
  { id: 'unwritten', name: 'Unwritten',    col: '#ffffff', aura: true, from: 'Clear Act V', ok: () => SAVE.cleared.slice(38, 48).length === 10 && SAVE.cleared.slice(38, 48).every(Boolean) },
  { id: 'primal',    name: 'Primal',       col: '#ff6bd6', from: 'Reach level 60', ok: () => SAVE.level >= 60 },
  { id: 'sunburst',  name: 'Sunburst',     col: '#ffcf5a', aura: true, from: 'Earn 100 challenge stars', ok: () => starCount() >= 100 },
  { id: 'shadow',    name: 'Umbral',       col: '#3a2a5a', bright: 1.5, from: 'Defeat the Shade King', ok: () => !!SAVE.bestiary.shade_king },
];
const SKIN_BY_ID = Object.fromEntries(SKINS.map(s => [s.id, s]));
const skinOwned = id => !!(SAVE && SKIN_BY_ID[id] && ((SAVE.skins.owned || {})[id] || (SKIN_BY_ID[id].ok && SKIN_BY_ID[id].ok())));
const skinOf = id => { const s = SAVE && SAVE.skins && SAVE.skins.eq[id]; return s && skinOwned(s) ? SKIN_BY_ID[s] : null; };
function skinFilter(cardId, t) {
  const s = skinOf(cardId);
  if (!s) return '';
  const hue = s.col === 'prism' ? (t || 0) * 90 % 360 : (() => { let d = hueOf(s.col) - hueOf(CARDS[cardId].color); if (d > 180) d -= 360; if (d < -180) d += 360; return Math.round(d); })();
  return `hue-rotate(${hue}deg) saturate(1.3)${s.bright ? ` brightness(${s.bright === 1.4 ? 0.55 : 0.6})` : ''}`;
}
const _v7_drawEntity = drawEntity;
drawEntity = function (c, e, kind, t) {
  const s = kind === 'summon' && e.id && CARDS[e.id] ? skinOf(e.id) : null;
  if (!s) { _v7_drawEntity(c, e, kind, t); return; }
  if (s.aura && gfxLevel() !== 'low') glowAt(c, e.x, e.y, e.r * 3.4, s.col === 'prism' ? PRISM[Math.floor(t * 3) % PRISM.length] : s.col, 0.2);
  const ev = e.evo; e.evo = null;   // a skin replaces the evolution colours
  c.save();
  if (gfxLevel() !== 'low') c.filter = skinFilter(e.id, t);
  if (s.alpha) c.globalAlpha *= s.alpha;
  _v7_drawEntity(c, e, kind, t);
  c.restore();
  e.evo = ev;
};
const _v7_renderCardIcon = renderCardIcon;
renderCardIcon = function (cv, id, locked) { _v7_renderCardIcon(cv, id, locked); if (!locked && skinOf(id)) cv.style.filter = skinFilter(id, 0); };
const _v7_cardEl = cardEl;
cardEl = function (id) {
  const el = _v7_cardEl(id);
  const owned = SKINS.filter(s => skinOwned(s.id));
  if (!owned.length || !cardUnlocked(id)) return el;
  const row = document.createElement('div');
  row.className = 'skin-row';
  const cur = SAVE.skins.eq[id] || '';
  row.innerHTML = `<span class="evo-h">Skin</span><select class="skin-sel"><option value="">Original</option>${owned.map(s => `<option value="${s.id}" ${cur === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select>`;
  row.querySelector('select').onchange = ev => { ev.stopPropagation(); if (ev.target.value) SAVE.skins.eq[id] = ev.target.value; else delete SAVE.skins.eq[id]; saveGame(); SFX.click(); rebuildGrimoireKeepScroll(); };
  row.onclick = ev => ev.stopPropagation();
  const host = el.querySelector('.desc');
  (host ? host.parentNode : el).insertBefore(row, host ? host.nextSibling : null);
  return el;
};
// Codex → Wardrobe also lists every skin and how to earn it
const _v7_buildCodex = buildCodex;
buildCodex = function () {
  _v7_buildCodex();
  if (codexTab !== 'wardrobe') return;
  const root = $('codexContent');
  root.insertAdjacentHTML('beforeend', `<h3 class="codex-h">Summon skins</h3><p class="muted">Equip a skin on any card from its Grimoire page.</p><div class="skin-grid">${SKINS.map(s => {
    const own = skinOwned(s.id), col = s.col === 'prism' ? 'linear-gradient(90deg,#ff6b6b,#ffd66b,#5dff9a,#5ab8ff,#c78bff)' : s.col;
    return `<div class="skin ${own ? 'own' : ''}"><span class="sw" style="background:${col}"></span><b>${s.name}</b><span class="muted">${own ? 'Owned' : s.from}</span></div>`;
  }).join('')}</div>`);
};

// ================= adaptive help: after 3 falls on one stage, offer a one-time boost =================
const HELP_FALLS = 3;
function helpFor(idx) { const h = SAVE.help || (SAVE.help = {}); return h[idx] || (h[idx] = { falls: 0, offered: false, armed: false }); }
const _v7_finishStage = finishStage;
finishStage = function (won, retreat) {
  if (W.isEvent) { if (!W.ended && !W.resultShown) eventFinish(won, retreat); return; }
  if (CUSTOM_UI.retry && !W.custom) { $('btnResRetry').onclick = CUSTOM_UI.retry; CUSTOM_UI.retry = null; }
  const plain = W.active && !W.custom && !W.isTower && !W.isRush && !W.isDaily && !W.isRaid && !W.isArena, idx = W.stageIdx, done = W.ended || W.resultShown;
  _v7_finishStage(won, retreat);
  if (!plain || done || W.isArena) return;
  const h = helpFor(idx);
  if (won) { h.falls = 0; h.offered = false; h.armed = false; saveGame(); return; }
  if (retreat) return;
  h.falls++;
  if (h.falls >= HELP_FALLS && !h.offered && !h.armed) {
    h.offered = true;
    $('resExtra').insertAdjacentHTML('beforeend', `<div class="res-note help-offer">This stage is tough. Want a hand? <button class="btn small primary" id="btnHelpYes">Take a one-time boost: +30% HP and summon damage on the next try</button></div>`);
    $('btnHelpYes').onclick = () => { h.armed = true; saveGame(); SFX.level(); $('btnHelpYes').replaceWith(document.createTextNode('Boost ready for your next try.')); };
  }
  saveGame();
};
const _v7_startStage = startStage;
startStage = function (idx, kind = 'stage') {
  _v7_startStage(idx, kind);
  if (kind !== 'stage' || CUSTOM_START || !SAVE.help || !SAVE.help[idx] || !SAVE.help[idx].armed) return;
  SAVE.help[idx].armed = false; W.helpBoost = true;
  refreshStats(); W.player.hp = W.player.maxHp;
  setTimeout(() => { if (W.active) toast('One-time boost active: +30% HP and summon damage', 'card'); }, 800);
};
const _v7_pstat = pstat;
pstat = function (wb = true) { const s = _v7_pstat(wb); if (wb && W && W.active && W.helpBoost) s.hp = Math.round(s.hp * 1.3); return s; };
const _v7_sMult = sMult;
sMult = function (s) { return _v7_sMult(s) * (W.helpBoost ? 1.3 : 1); };

// ================= controller rumble (same moments as phone vibration) =================
function rumble(ms, strong = 0.6, weak = 0.4) {
  if (!SETTINGS.vibrate) return;
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(g => g && g.connected) : [];
  for (const g of pads) {
    const a = g.vibrationActuator;
    if (a && a.playEffect) { try { a.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak }); } catch (e) { /* unsupported */ } }
  }
  RUMBLE.count++;
}
const RUMBLE = { count: 0, t: 0 };
const _v7_vibrate = vibrate;
vibrate = function (pattern, minGap = 0.12) {
  _v7_vibrate(pattern, minGap);
  if (!INPUT.padMode) return;
  const now = performance.now() / 1000;
  if (now - RUMBLE.t < minGap) return;
  RUMBLE.t = now;
  const total = Array.isArray(pattern) ? pattern.reduce((a, v, i) => a + (i % 2 ? 0 : v), 0) : pattern;
  rumble(Math.min(600, total), total > 150 ? 1 : 0.6, total > 150 ? 0.8 : 0.4);
};
const _v7_gainExpR = gainExp;
gainExp = function (v) { const l0 = SAVE.level; _v7_gainExpR(v); if (SAVE.level > l0) vibrate([40, 30, 60], 0); };

// ================= What's new + first-time tips =================
const APP_RELEASE = 7;
const WHATS_NEW = [
  ['Level 70 and the Primordial rank', 'The level cap is now 70. At level 60 the Primordial (SS) rank unlocks with 4 new cards. Cards can now reach level 40.'],
  ['Night of Pumpkins (until Nov 7)', 'Candy drops in every battle. Spend it in the event shop on the map, and face the Pumpkin King in Pumpkin Hollow.'],
  ['The Rift', 'A new roguelite mode: start with 2 random cards, draft more each floor and earn Rift shards for permanent perks.'],
  ['Act V: The Unwritten', '10 new stages for levels 50 to 70, after the true ending.'],
  ['Summon skins', '20 skins to earn from events, the arena, the Rift and achievements. Equip them on any card.'],
  ['Online and app', 'Cloud saves, real-player arena and leaderboards (once online accounts are set up), Arabic language, controller rumble, and help when a stage gets tough.'],
];
const TIPS = {
  village: ['The Village', 'Upgrade buildings for permanent bonuses, draw cards at the Altar, claim your daily calendar reward and fight in the arena.'],
  altar: ['Summoning Altar', 'Every draw gives card EXP. Rare cards also gain an enhancement star. A rare is guaranteed at least every 30 draws.'],
  run: ['Run upgrades', 'Each run level lets you pick 1 of 3 upgrades. They last until the end of this stage.'],
  evo: ['Evolution paths', 'Awakened cards choose a power path or a support path. The first choice is free.'],
  rift: ['The Rift', 'You start with 2 random cards. After each floor, draft a new card. Bosses wait every 5 floors.'],
  arena: ['Arena', 'Your hotbar fights a rival summoner. Win to climb from Bronze to Mythic. You get 5 tickets a day.'],
};
function tipOnce(key) {
  if (!SAVE || SETTINGS.tips === false || !TIPS[key]) return;
  const seen = SAVE.tipsSeen || (SAVE.tipsSeen = {});
  if (seen[key]) return;
  seen[key] = true; saveGame();
  const [h, b] = TIPS[key];
  showInfoCard(h, `<p>${b}</p>`, 'Got it');
}
function showInfoCard(title, html, btn = 'Close') {
  let m = $('infoCard');
  if (!m) { m = document.createElement('div'); m.id = 'infoCard'; m.className = 'info-card-wrap'; document.body.appendChild(m); }
  m.innerHTML = `<div class="info-card panel"><h3>${title}</h3>${html}<div class="menu-row"><button class="btn primary" id="btnInfoOk">${btn}</button></div></div>`;
  m.classList.remove('hidden');
  $('btnInfoOk').onclick = () => { SFX.click(); m.classList.add('hidden'); };
}
function showWhatsNew(force) {
  if (!SAVE || (!force && (SAVE.seenRelease || 0) >= APP_RELEASE)) return false;
  SAVE.seenRelease = APP_RELEASE; saveGame();
  if (!force && !SAVE.stats.runs) return false;   // brand-new players don't need a changelog
  if (SETTINGS.tips === false && !force) return false;
  showInfoCard("What's new", `<div class="wn-list">${WHATS_NEW.map(([h, b]) => `<div class="wn"><b>${h}</b><span>${b}</span></div>`).join('')}</div>`, "Let's go");
  return true;
}
const _v7_showScreen = showScreen;
showScreen = function (name) {
  _v7_showScreen(name);
  if (name === 'map') { if (!showWhatsNew()) { /* already seen */ } }
  if (name === 'village') tipOnce(vilTab === 'altar' ? 'altar' : vilTab === 'arena' ? 'arena' : 'village');
};
const _v7_openRunChoice = openRunChoice;
openRunChoice = function () { _v7_openRunChoice(); if (W.choosingKind === 'run') setTimeout(() => tipOnce('run'), 50); };
V6_SETTINGS.tips = true;
if (SETTINGS.tips === undefined) SETTINGS.tips = true;
