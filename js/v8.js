'use strict';
// ---------- v8: unlimited levels + Paragon, 20 stars, 10 awakenings, 20 new talents (all talents to 20),
//            Hell Tiers to 20 with shorter stages, per-battle difficulty, pace, game speed, skip to boss,
//            summon capacity setting, play in the background, wallet bar ----------

// ================= unlimited levels (stats grow more gently past 70) =================
const SOFT_LV = 70, CARD_SOFT = 40;
for (const k of ['hp', 'mp', 'regen', 'stone']) {
  const f = PLAYER[k], rate = k === 'hp' ? 0.015 : 0.01;
  PLAYER[k] = L => (L <= SOFT_LV ? f(L) : (k === 'hp' || k === 'mp' ? Math.round : x => x)(f(SOFT_LV) * (1 + rate * (L - SOFT_LV))));
}
{ const f = PLAYER.expNext; PLAYER.expNext = L => (L <= SOFT_LV ? f(L) : Math.floor(f(SOFT_LV) * (1 + 0.04 * (L - SOFT_LV)))); }
{ const f = PLAYER.cap; PLAYER.cap = L => f(Math.min(L, SOFT_LV)) + Math.min(6, Math.floor(Math.max(0, L - SOFT_LV) / 10)); }
CARD_PROG.maxLv = 9999;
CARD_PROG.maxEnh = 20;
{ const f = CARD_PROG.mult; CARD_PROG.mult = (lv, enh) => (lv <= CARD_SOFT ? f(lv, enh) : f(CARD_SOFT, enh) * (1 + 0.012 * (lv - CARD_SOFT))); }
{ const f = CARD_PROG.enhCost; CARD_PROG.enhCost = enh => Math.round(f(enh) * (enh >= 5 ? 1 + 0.5 * (enh - 4) : 1)); }

// ================= Paragon: one point per level past 70 =================
const PARAGON = [
  { id: 'might',   name: 'Might',   icon: '⚔', per: 0.005, max: 9999, desc: v => `+${(v * 100).toFixed(1)}% summon damage` },
  { id: 'fort',    name: 'Fortitude', icon: '♥', per: 0.005, max: 9999, desc: v => `+${(v * 100).toFixed(1)}% max HP` },
  { id: 'flow',    name: 'Flow',    icon: '✦', per: 0.005, max: 9999, desc: v => `+${(v * 100).toFixed(1)}% mana regeneration` },
  { id: 'fortune', name: 'Fortune', icon: '◆', per: 0.005, max: 9999, desc: v => `+${(v * 100).toFixed(1)}% magic stones` },
  { id: 'wisdom',  name: 'Wisdom',  icon: '☉', per: 0.005, max: 9999, desc: v => `+${(v * 100).toFixed(1)}% card EXP` },
  { id: 'haste',   name: 'Haste',   icon: '⟳', per: 0.0025, max: 100, desc: v => `−${(v * 100).toFixed(1)}% summon cooldowns` },
];
const pgSpent = () => (SAVE && SAVE.paragon) || {};
const pgLv = id => pgSpent()[id] || 0;
const pgVal = id => pgLv(id) * PARAGON.find(p => p.id === id).per;
const pgTotal = () => Math.max(0, (SAVE ? SAVE.level : 0) - SOFT_LV);
const pgFree = () => pgTotal() - Object.values(pgSpent()).reduce((a, b) => a + b, 0);
function spendParagon(id, n = 1) {
  const p = PARAGON.find(x => x.id === id);
  n = Math.min(n, pgFree(), p.max - pgLv(id));
  if (n <= 0) return false;
  SAVE.paragon = SAVE.paragon || {};
  SAVE.paragon[id] = pgLv(id) + n;
  saveGame(); return true;
}

// ================= talents: 20 new ones, and every talent can reach rank 20 =================
const TL_OLD = Object.fromEntries(TALENTS.map(t => [t.id, t.max]));
const TL_EXTRA = {   // per rank past the old maximum (smaller than before, so nothing breaks)
  vitality: '+2% max HP', reserves: '+4 max mana', manaflow: '+2% mana regeneration', grimoire: '+1 capacity every 5 ranks', sling: '+4% stone damage',
  swift: '+1% move speed', pact: '+2% summon HP and damage', quickcast: '−1% summon cooldowns', soul_harvest: '+3% soul gauge gain', magnet: '+5% pickup range',
};
for (const t of TALENTS) { t.max = 20; t.extra = TL_EXTRA[t.id]; }
const NEW_TALENTS = [
  ['wrath', "Summoner's Wrath", '⚔', 60, '+2% summon damage per rank'],
  ['ironwill', 'Iron Will', '⛨', 50, '+2% max HP per rank'],
  ['arcfocus', 'Arcane Focus', '✶', 70, '−1% special skill cooldowns per rank'],
  ['overcharge', 'Overcharge', '❂', 60, '+3% Overdrive charge per rank'],
  ['scholar', 'Scholar', '☉', 50, '+3% card EXP per rank'],
  ['prospector', 'Prospector', '◆', 70, '+2% magic stones per rank'],
  ['keeneye', 'Keen Eye', '◎', 80, '+0.5% critical hit chance per rank'],
  ['thickskin', 'Thick Skin', '▣', 70, '−1% damage taken per rank'],
  ['secondwind', 'Second Wind', '✚', 60, '+0.4 HP regeneration per second per rank'],
  ['soulleech', 'Soul Leech', '☽', 60, 'Kills heal Allen 0.5 HP per rank'],
  ['broodlord', 'Brood Lord', '✺', 40, 'Insect summons deal +3% damage per rank'],
  ['alphacall', 'Alpha Call', '☗', 40, 'Beast summons deal +3% damage per rank'],
  ['skylord', 'Sky Lord', '➶', 40, 'Bird summons deal +3% damage per rank'],
  ['greenheart', 'Greenheart', '❀', 40, 'Grass summons heal +3% more per rank'],
  ['mountain', 'Mountain Heart', '▲', 40, 'Stone summons get +3% HP per rank'],
  ['tidecall', 'Tidecaller', '≈', 40, 'Fish shields +3% stronger per rank'],
  ['spiritbind', 'Spirit Binder', '✧', 50, 'Spirit summons deal +3% damage per rank'],
  ['dragonrider', 'Dragon Rider', '♆', 60, 'Dragon summons deal +3% damage per rank'],
  ['divinefavor', 'Divine Favor', '☀', 70, 'Celestial and Primordial summons deal +3% damage per rank'],
  ['lastingpact', 'Lasting Pact', '⌛', 40, 'Summons with a time limit last +3% longer per rank'],
];
for (const [id, name, icon, base, desc] of NEW_TALENTS) TALENTS.push({ id, name, icon, max: 20, base, desc, isNew: true });
const tlx = id => Math.max(0, tl(id) - (TL_OLD[id] ?? 0));   // ranks past the old maximum (new talents: all ranks)
const TAG_TALENT = { insect: 'broodlord', beast: 'alphacall', bird: 'skylord', spirit: 'spiritbind', dragon: 'dragonrider', celestial: 'divinefavor', primordial: 'divinefavor' };

// pstat: old talents are computed at their old maximum, then the extra ranks and the new talents are added
const _v8_pstat = pstat;
pstat = function (wb = true) {
  const real = SAVE && SAVE.talents;
  if (real) { const capped = Object.assign({}, real); for (const k in TL_OLD) if (capped[k] > TL_OLD[k]) capped[k] = TL_OLD[k]; SAVE.talents = capped; }
  let s;
  try { s = _v8_pstat(wb); } finally { if (real) SAVE.talents = real; }
  if (!SAVE) return s;
  s.hp = Math.round(s.hp * (1 + 0.02 * tlx('vitality')) * (1 + 0.02 * tlx('ironwill')) * (1 + pgVal('fort')));
  s.mp += 4 * tlx('reserves');
  s.regen *= (1 + 0.02 * tlx('manaflow')) * (1 + pgVal('flow'));
  s.cap += Math.min(3, Math.floor(tlx('grimoire') / 5));
  s.stone *= 1 + 0.04 * tlx('sling');
  s.speed *= 1 + 0.01 * tlx('swift');
  s.sumMult *= 1 + 0.02 * tlx('pact');
  s.cdMult *= Math.max(0.85, 1 - 0.01 * tlx('quickcast')) * (1 - pgVal('haste'));
  s.soul *= 1 + 0.03 * tlx('soul_harvest');
  s.magnet *= 1 + 0.05 * tlx('magnet');
  s.skillCd *= Math.max(0.8, 1 - 0.01 * tlx('arcfocus'));
  s.cap = Math.max(1, Math.round(s.cap * (SETTINGS.capMult || 1)));   // summon capacity setting
  return s;
};
const _v8_sMult = sMult;
sMult = function (s) {
  let m = _v8_sMult(s) * (1 + 0.02 * tlx('wrath')) * (1 + pgVal('might'));
  for (const tg of s.c.tags || []) if (TAG_TALENT[tg]) m *= 1 + 0.03 * tlx(TAG_TALENT[tg]);
  return m;
};
const _v8_rv = rv;
rv = function (eff) {
  let v = _v8_rv(eff);
  if (!SAVE) return v;
  if (eff === 'stoneGain') v += 0.02 * tlx('prospector') + pgVal('fortune');
  else if (eff === 'armor') v += 0.01 * tlx('thickskin');
  else if (eff === 'regen') v += 0.4 * tlx('secondwind');
  else if (eff === 'killHeal') v += 0.5 * tlx('soulleech');
  return v;
};
const _v8_eqv = eqv;
eqv = function (stat) { return _v8_eqv(stat) + (stat === 'crit' && SAVE ? 0.005 * tlx('keeneye') : 0); };
const _v8_addOverdrive = addOverdrive;
addOverdrive = function (v) { _v8_addOverdrive(v * (1 + 0.03 * tlx('overcharge'))); };
const _v8_addCardExp = addCardExp;
addCardExp = function (id, v) { _v8_addCardExp(id, v * (1 + 0.03 * tlx('scholar')) * (1 + pgVal('wisdom'))); };

// ================= awakening up to 10 times =================
const AWK_MAX = 10;
const awkLv = id => { const v = SAVE && SAVE.awakened[id]; return v === true ? 1 : v || 0; };
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const awkCostAt = (id, lv) => { const b = awakenCost(id); return { stones: Math.round(b.stones * (1 + 0.8 * lv)), essence: b.essence * (lv + 1), cardLv: 20 + 5 * lv }; };
awakenStatus = function (id) {
  const lv = awkLv(id), cs = SAVE.cards[id];
  if (lv >= AWK_MAX) return { ok: false, why: 'Fully awakened' };
  const c = awkCostAt(id, lv);
  if (cs.lv < c.cardLv) return { ok: false, why: `Needs Lv ${c.cardLv} (Lv ${cs.lv})` };
  if (SAVE.essence < c.essence) return { ok: false, why: `Needs ${c.essence} essence` };
  if (SAVE.stones < c.stones) return { ok: false, why: `Needs ◆ ${c.stones}` };
  return { ok: true };
};
doAwaken = function (id) {
  if (!awakenStatus(id).ok) return false;
  const lv = awkLv(id), c = awkCostAt(id, lv);
  SAVE.stones -= c.stones; SAVE.essence -= c.essence;
  SAVE.awakened[id] = lv + 1;
  saveGame(); checkAch();
  return true;
};
const _v8_makeSummon = makeSummon;
makeSummon = function (id, x, y) {
  const s = _v8_makeSummon(id, x, y), lv = awkLv(id), tg = s.c.tags || [];
  if (lv > 1) { const k = 1 + 0.15 * (lv - 1); s.hp *= k; s.maxHp *= k; s.dmg *= k; s.bite *= k; s.heal *= k; s.shieldAmt *= k; }
  if (tg.includes('grass')) s.heal *= 1 + 0.03 * tlx('greenheart');
  if (tg.includes('stone')) { const k = 1 + 0.03 * tlx('mountain'); s.hp *= k; s.maxHp *= k; }
  if (tg.includes('fish')) s.shieldAmt *= 1 + 0.03 * tlx('tidecall');
  if (s.maxLife > 0) { s.life *= 1 + 0.03 * tlx('lastingpact'); s.maxLife = s.life; }
  return s;
};
const _v8_cardEl = cardEl;
cardEl = function (id) {
  const el = _v8_cardEl(id), lv = awkLv(id);
  const b = el.querySelector('[data-act="awk"]');
  if (b) {
    const a = awakenStatus(id), c = awkCostAt(id, lv);
    b.textContent = lv >= AWK_MAX ? `✦ Awakened ${ROMAN[AWK_MAX]} (max)` : a.ok ? `Awaken ${ROMAN[lv + 1]} ◆${c.stones} ✧${c.essence}` : a.why;
    b.disabled = !a.ok;
    b.title = `Awakening ${lv}/${AWK_MAX}: every level adds +15% HP and damage`;
  }
  const nm = el.querySelector('.cname');
  if (nm && lv > 1) nm.textContent = nm.textContent.replace(/^✦ /, `✦${ROMAN[lv]} `);
  const st = el.querySelector('.stars-e');
  if (st) st.innerHTML = `★ ${SAVE.cards[id].enh}<span class="off">/${CARD_PROG.maxEnh}</span>`;
  return el;
};

// ================= per-battle difficulty, pace, skip to boss =================
const DIFFS = [
  { name: 'Normal',    hp: 1,   dmg: 1,   spd: 1,    reward: 1, col: '#c9d3e6' },
  { name: 'Hard',      hp: 1.6, dmg: 1.3, spd: 1.05, reward: 1.5, col: '#ffcf5a' },
  { name: 'Nightmare', hp: 2.6, dmg: 1.8, spd: 1.1,  reward: 2.5, col: '#ff8a3d' },
  { name: 'Hell',      hp: 4,   dmg: 2.5, spd: 1.15, reward: 4, col: '#ff3355' },
];
const PACES = [
  { name: 'Normal', time: 1, density: 1, dmg: 1 },
  { name: 'Fast',   time: 0.6, density: 1.6, dmg: 1.2 },
  { name: 'Blitz',  time: 0.35, density: 2.6, dmg: 1.45 },
];
let SKIP_NEXT = false;
const plainKind = kind => kind === 'stage' && !CUSTOM_START;
const _v8_startStage = startStage;
startStage = function (idx, kind = 'stage') {
  _v8_startStage(idx, kind);
  if (!plainKind(kind) || W.isArena) return;
  const d = DIFFS[SAVE.diff || 0], p = PACES[SAVE.pace || 0], tier = W.tier || 0;
  const tierTime = 1 / (1 + 0.1 * tier);   // Hell Tiers also shorten the stage
  W.diff = SAVE.diff || 0; W.pace = SAVE.pace || 0;
  W.sm = Object.assign({}, W.sm, { hp: W.sm.hp * d.hp, dmg: W.sm.dmg * d.dmg * p.dmg, spd: W.sm.spd * d.spd });
  W.rewardMult *= d.reward;
  W.st = Object.assign({}, W.st, { duration: Math.max(20, Math.round(W.st.duration * p.time * tierTime)), density: W.st.density * p.density / tierTime });
  if (SKIP_NEXT) { SKIP_NEXT = false; W.time = W.st.duration; W.skipped = true; }
};
const _v8_spawnBoss = spawnBoss;
spawnBoss = function () {
  _v8_spawnBoss();
  const b = W.boss;
  if (b && (W.diff || 0) >= 2 && !W.custom) b.bd = Object.assign({}, b.bd, { patterns: [...new Set([...b.bd.patterns, 'meteor', 'spiral', ...(W.diff >= 3 ? ['laser', 'burst'] : [])])] });
};
const _v8_finishStage = finishStage;
finishStage = function (won, retreat) {
  const plain = W && W.active && !W.custom && !W.isTower && !W.isRush && !W.isDaily && !W.isRaid && !W.isArena && !W.ended && !W.resultShown;
  const idx = W.stageIdx, d = W.diff || 0;
  _v8_finishStage(won, retreat);
  if (plain && won) { SAVE.diffClears = SAVE.diffClears || {}; if ((SAVE.diffClears[idx] ?? -1) < d) { SAVE.diffClears[idx] = d; saveGame(); } }
};
function skipToBoss(i) { SKIP_NEXT = true; enterStage(i); if (!W.active || W.stageIdx !== i) SKIP_NEXT = false; }
const _v8_renderStageInfo = renderStageInfo;
renderStageInfo = function () {
  _v8_renderStageInfo();
  if (typeof selectedStage !== 'number' || !stageUnlocked(selectedStage)) return;
  const i = selectedStage, enter = $('btnEnter');
  if (!enter) return;
  const d = SAVE.diff || 0, p = SAVE.pace || 0, three = SAVE.stars[i] && SAVE.stars[i].every(Boolean);
  const best = SAVE.diffClears ? SAVE.diffClears[i] : undefined;
  enter.insertAdjacentHTML('beforebegin', `<div class="v8-picks">
    <div class="pick-h">Difficulty${best !== undefined ? ` <span class="muted">· best clear: ${DIFFS[best].name}</span>` : ''}</div>
    <div class="pick-row">${DIFFS.map((x, k) => `<button class="btn small ${k === d ? 'primary' : 'ghost'}" data-diff="${k}" style="--dc:${x.col}">${x.name}${k ? ` <small>×${x.reward} rewards</small>` : ''}</button>`).join('')}</div>
    <div class="pick-h">Pace</div>
    <div class="pick-row">${PACES.map((x, k) => `<button class="btn small ${k === p ? 'primary' : 'ghost'}" data-pace="${k}">${x.name}${k ? ` <small>${Math.round(x.time * 100)}% time</small>` : ''}</button>`).join('')}</div>
    ${three ? '<button class="btn small" id="btnSkipBoss">Skip to the boss</button>' : ''}
  </div>`);
  const root = $('stageInfo');
  root.querySelectorAll('[data-diff]').forEach(b => b.onclick = () => { SFX.click(); SAVE.diff = +b.dataset.diff; saveGame(); renderStageInfo(); });
  root.querySelectorAll('[data-pace]').forEach(b => b.onclick = () => { SFX.click(); SAVE.pace = +b.dataset.pace; saveGame(); renderStageInfo(); });
  const sk = $('btnSkipBoss'); if (sk) sk.onclick = () => { SFX.click(); skipToBoss(i); };
};
const _v8_buildMap = buildMap;
buildMap = function () {
  _v8_buildMap();
  const dc = (SAVE && SAVE.diffClears) || {};
  document.querySelectorAll('#map .node').forEach(n => { const i = +n.dataset.i, d = dc[i]; if (d > 0) n.insertAdjacentHTML('beforeend', `<span class="dbadge" style="--dc:${DIFFS[d].col}" title="Cleared on ${DIFFS[d].name}">${DIFFS[d].name[0]}</span>`); });
  renderWallet();
};

// ================= game speed 1× / 1.5× / 2× =================
ACTIONS.push({ id: 'speed', name: 'Game speed', def: ['KeyG', ''] });
if (!SETTINGS.keys.speed) SETTINGS.keys.speed = ['KeyG', ''];
rebuildKeymap();
const SPEEDS = [1, 1.5, 2];
let SPEED_ACC = 0;
const _v8_updateWorld = updateWorld;
updateWorld = function (rawDt) {
  const sp = PHOTO.on ? 1 : SETTINGS.gameSpeed || 1;
  if (sp === 1) { _v8_updateWorld(rawDt); return; }
  SPEED_ACC += sp;
  while (SPEED_ACC >= 1) { SPEED_ACC -= 1; _v8_updateWorld(rawDt); if (!W.active || W.choosing || STATE !== 'play') { SPEED_ACC = 0; break; } }
};
function cycleSpeed() {
  const k = SPEEDS.indexOf(SETTINGS.gameSpeed || 1);
  SETTINGS.gameSpeed = SPEEDS[(k + 1) % SPEEDS.length]; saveSettings();
  const b = $('btnSpeed'); if (b) b.textContent = `${SETTINGS.gameSpeed}×`;
  toast(`Game speed ${SETTINGS.gameSpeed}×`, 'card');
}
(function addSpeedButton() {
  const row = document.querySelector('#hud .tr-row');
  if (!row) return;
  const b = document.createElement('button');
  b.className = 'icon-btn speed-btn'; b.id = 'btnSpeed'; b.title = 'Game speed (G)'; b.textContent = `${SETTINGS.gameSpeed || 1}×`;
  b.onclick = () => { SFX.click(); cycleSpeed(); };
  row.insertBefore(b, row.firstChild);
})();
window.addEventListener('keydown', ev => { if (STATE === 'play' && !ev.repeat && KEYMAP[ev.code] === 'speed' && !PHOTO.on) { ev.preventDefault(); cycleSpeed(); } });

// ================= keep playing when the tab is in the background =================
const BG = { last: performance.now(), steps: 0 };
const _v8_pauseGame = pauseGame;
pauseGame = function () {
  if (SETTINGS.bgPlay && STATE === 'play' && (document.hidden || !document.hasFocus())) return;
  _v8_pauseGame();
};
setInterval(() => {
  const now = performance.now();
  if (!SETTINGS.bgPlay || STATE !== 'play' || !document.hidden || !W.active) { BG.last = now; return; }
  let dt = Math.min(120, (now - BG.last) / 1000);
  BG.last = now;
  while (dt > 0 && STATE === 'play' && W.active) {
    if (W.choosing) pickBoost(0);   // never stall on a choice while nobody is watching
    updateWorld(Math.min(1 / 30, dt)); BG.steps++;
    dt -= 1 / 30;
  }
  if (SAVE) { SAVE.stats.playTime = (SAVE.stats.playTime || 0); saveGame(); }
}, 500);

// ================= new settings: capacity, background play, game speed =================
Object.assign(V6_SETTINGS, { capMult: 1, bgPlay: false, gameSpeed: 1 });
for (const k of ['capMult', 'bgPlay', 'gameSpeed']) if (SETTINGS[k] === undefined) SETTINGS[k] = V6_SETTINGS[k];
(function addSettings() {
  const anchor = [...document.querySelectorAll('#scr-settings h3')].find(h => h.textContent === 'Co-op');
  if (!anchor) return;
  anchor.insertAdjacentHTML('beforebegin', `<h3>Gameplay</h3>
    <label class="set-row">Summon capacity
      <select data-set="capMult" id="capSel"><option value="1">Normal</option><option value="1.5">×1.5</option><option value="2">×2</option><option value="3">×3</option></select></label>
    <label class="set-row">Keep playing in a background tab <input type="checkbox" data-set="bgPlay" id="bgSel"></label>
    <p class="muted save-note">With this on, the battle keeps going when you switch tabs or windows (turn on auto summon and auto skills in Automation so your army keeps fighting). Browsers slow background tabs down, so the game catches up when it gets time.</p>`);
  // these two need numbers and true/false, which the generic handler doesn't convert for selects
  $('capSel').addEventListener('change', ev => { SETTINGS.capMult = +ev.target.value; saveSettings(); if (W.active) refreshStats(); });
  $('bgSel').addEventListener('change', ev => { SETTINGS.bgPlay = ev.target.checked; saveSettings(); });
})();
const _v8_buildSettings = buildSettings;
buildSettings = function () { _v8_buildSettings(); const c = $('capSel'); if (c) c.value = String(SETTINGS.capMult || 1); };

// ================= wallet bar on the map: everything you own at a glance =================
function walletItems() {
  if (!SAVE) return [];
  const ev = typeof activeEvent === 'function' ? activeEvent() : null;
  const items = [['◆', SAVE.stones.toLocaleString(), 'Magic stones'], ['✧', SAVE.essence, 'Abyss Essence']];
  for (const k in MATS) items.push([MATS[k].icon, SAVE.mats[k] || 0, MATS[k].name]);
  if (ev) items.push([ev.currency.icon, evState(ev.id).cur, ev.currency.name]);
  items.push(['⬡', SAVE.rift ? SAVE.rift.shards : 0, 'Rift shards'], ['🎫', SAVE.arena ? SAVE.arena.tickets : 0, 'Arena tickets'], ['🎴', SAVE.altar ? SAVE.altar.free || 0 : 0, 'Free Altar draws']);
  if (pgTotal() > 0) items.push(['✪', pgFree(), 'Paragon points to spend']);
  return items;
}
function renderWallet() {
  const host = document.querySelector('#scr-map .topbar');
  if (!host || !SAVE) return;
  let w = $('walletBar');
  if (!w) { w = document.createElement('div'); w.id = 'walletBar'; w.className = 'wallet-bar'; host.after(w); }
  w.innerHTML = walletItems().map(([i, v, t]) => `<span class="w-item" title="${t}"><b>${i}</b> ${v}</span>`).join('');
}
const _v8_showScreen = showScreen;
showScreen = function (name) { _v8_showScreen(name); if (name === 'map') renderWallet(); };

// ================= Paragon panel in the Talents tab =================
const _v8_buildTalentsTab = buildTalentsTab;
buildTalentsTab = function (root) {
  _v8_buildTalentsTab(root);
  root.querySelectorAll('.talent').forEach((el, k) => {
    const t = TALENTS[k];
    if (t && t.extra && el.querySelector('.t-desc')) el.querySelector('.t-desc').insertAdjacentHTML('beforeend', `<br><span class="muted">Past rank ${TL_OLD[t.id]}: ${t.extra}</span>`);
    if (t && t.isNew) el.classList.add('t-new');
  });
  const free = pgFree();
  root.insertAdjacentHTML('beforeend', `<h3 class="codex-h">Paragon <span class="muted">· ${pgTotal() ? `${free} point${free === 1 ? '' : 's'} to spend` : `earn 1 point for every level past ${SOFT_LV}`}</span></h3>
    <div class="talents paragon">${PARAGON.map(p => { const lv = pgLv(p.id); return `<div class="talent"><div class="t-icon">${p.icon}</div><div class="t-body"><div class="t-name">${p.name} <span class="muted">${lv}</span></div><div class="t-desc">${p.desc(lv * p.per)}</div>
      <div class="save-btns"><button class="btn small" data-pg="${p.id}" data-n="1" ${free > 0 && lv < p.max ? '' : 'disabled'}>+1</button><button class="btn small ghost" data-pg="${p.id}" data-n="10" ${free > 0 && lv < p.max ? '' : 'disabled'}>+10</button></div></div></div>`; }).join('')}</div>`);
  root.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => { if (spendParagon(b.dataset.pg, +b.dataset.n)) { SFX.level(); rebuildGrimoireKeepScroll(); } });
};

// ================= What's new for this release (returning players see it once) =================
WHATS_NEW.splice(0, WHATS_NEW.length,
  ['No level cap', 'You and your cards now level forever. Every level past 70 gives a Paragon point (Grimoire → Talents). Cards reach 20 stars and can be awakened 10 times.'],
  ['30 talents up to rank 20', '20 new talents, and every talent now goes to rank 20.'],
  ['Harder for more rewards', 'Pick Hard, Nightmare or Hell on any stage for up to ×4 rewards. Hell Tiers now go to 20, pay up to ×10 and make stages shorter.'],
  ['Faster runs', 'Choose a Fast or Blitz pace, play at 1.5× or 2× speed (G), or skip straight to the boss on 3-starred stages.'],
  ['Automation', 'Auto summon keeps the number of each card you choose on the field. Auto skills follow slots 1–6 and fire every time they are ready. Find it in Pause → Automation.'],
  ['20 mythic legends', 'Fenrir, Kraken, Kitsune, Bahamut, Metatron, Chimera and more, plus 10 legendary fusions. Every creature now looks more epic.'],
);
const _v8_showWhatsNew = showWhatsNew;
showWhatsNew = function (force) {
  if (SAVE && !force && (SAVE.seenRelease || 0) >= 8) return false;
  if (SAVE && (SAVE.seenRelease || 0) < 8) SAVE.seenRelease = 0;   // let the v7 check pass, then mark this release
  const r = _v8_showWhatsNew(force);
  if (SAVE) { SAVE.seenRelease = 8; saveGame(); }
  return r;
};

ACHIEVEMENTS.push(
  { id: 'lv100', name: 'Centurion', reward: 2000, desc: 'Reach level 100.', check: () => SAVE.level >= 100 },
  { id: 'awk10', name: 'Fully Awakened', reward: 1500, desc: 'Awaken a card 10 times.', check: () => Object.values(SAVE.awakened).some(v => v === AWK_MAX) },
  { id: 'star20', name: 'Twenty Stars', reward: 1500, desc: 'Enhance a card to 20 stars.', check: () => Object.values(SAVE.cards).some(c => c.enh >= 20) },
  { id: 'hellclear', name: 'Hell Walker', reward: 800, desc: 'Clear a stage on Hell difficulty.', check: () => Object.values(SAVE.diffClears || {}).some(d => d >= 3) },
  { id: 'tier20', name: 'Bottom of Hell', reward: 3000, desc: 'Unlock Hell Tier 20.', check: () => SAVE.tierMax >= 20 },
);
