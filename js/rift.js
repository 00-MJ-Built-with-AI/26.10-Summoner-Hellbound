'use strict';
// ---------- The Rift: a draft roguelite. Start with 2 random cards, draft 1 of 3 after every floor,
//            a boss every 5 floors, Rift shards buy permanent perks. Unlocks after Act II. ----------

const riftUnlocked = () => !!(SAVE && SAVE.cleared[17]);
const RIFT_PERKS = [
  { id: 'start', name: 'Wider Grip',      max: 2, cost: [30, 80],     desc: n => `Start with ${2 + n} cards` },
  { id: 'vigor', name: 'Rift Vigor',      max: 3, cost: [20, 40, 80], desc: n => `+${15 * n}% HP in the Rift` },
  { id: 'reroll', name: 'Second Look',    max: 1, cost: [40],         desc: () => 'One free reroll on every draft' },
  { id: 'luck',  name: 'Lucky Draw',      max: 1, cost: [60],         desc: () => 'Every draft offers at least one rare card' },
  { id: 'wealth', name: 'Shard Magnet',   max: 1, cost: [50],         desc: () => '+50% Rift shards and magic stones' },
];
const rPerk = id => (SAVE && SAVE.rift && SAVE.rift.perks[id]) || 0;
function buyRiftPerk(id) {
  const p = RIFT_PERKS.find(x => x.id === id), n = rPerk(id);
  if (!p || n >= p.max || SAVE.rift.shards < p.cost[n]) return false;
  SAVE.rift.shards -= p.cost[n]; SAVE.rift.perks[id] = n + 1;
  saveGame(); return true;
}
const riftPool = () => CARD_IDS.filter(id => cardUnlocked(id));
function riftDraftChoices(deck) {
  const pool = riftPool().filter(id => !deck.includes(id)), out = [];
  if (rPerk('luck')) { const rares = pool.filter(id => !CARDS[id].fusion && isRareCard(id)); if (rares.length) out.push(rares[randi(0, rares.length - 1)]); }
  while (out.length < 3 && out.length < pool.length) { const id = pool[randi(0, pool.length - 1)]; if (!out.includes(id)) out.push(id); }
  return out;
}
function riftStage(f) {
  const cleared = STAGES.map((s, i) => i).filter(i => SAVE.cleared[i]);
  const src = cleared[Math.min(cleared.length - 1, Math.floor(f / 3) + randi(0, 3))] ?? 0;
  const bossFloor = f % 5 === 0, bosses = cleared.map(i => STAGES[i].boss);
  return {
    name: `The Rift · Floor ${f}`, bossFloor, boss: bosses[(f / 5 * 7) % bosses.length | 0] || STAGES[0].boss,
    duration: bossFloor ? 2 : 35, density: bossFloor ? 0 : 1.3 + f * 0.04, enemies: STAGES[src].enemies, theme: STAGES[src].theme, themeIdx: src,
  };
}
const riftMult = f => { const m = stageMultFor(Math.min(45, 4 + f * 1.1)); return { hp: m.hp, dmg: m.dmg, exp: m.exp * 0.6, spd: m.spd }; };
function enterRift() {
  if (!riftUnlocked()) return false;
  const saved = [...SAVE.hotbar], pool = riftPool().filter(id => !CARDS[id].fusion), deck = [];
  while (deck.length < 2 + rPerk('start') && pool.length) deck.push(pool.splice(randi(0, pool.length - 1), 1)[0]);
  SAVE.rift.saved = saved;   // restored when the run ends (also after a crash, see below)
  SAVE.hotbar = [...deck, ...Array(6 - deck.length).fill(null)];
  SAVE.rift.runs++;
  const st = riftStage(1);
  startCustomStage({ kind: 'rift', baseIdx: st.themeIdx, flags: { isRift: true, rift: { floor: 1, shards: 0, deck: [...deck] } }, st, banner: 'THE RIFT · Floor 1', music: 'a3b' });
  W.sm = riftMult(1); W.idx = 7;
  saveGame();
  return true;
}
function restoreRiftHotbar() {
  if (SAVE && SAVE.rift && SAVE.rift.saved) { SAVE.hotbar = SAVE.rift.saved; delete SAVE.rift.saved; saveGame(); }
}
function riftFloorCleared() {
  const p = W.player, R = W.rift, f = R.floor;
  const shards = Math.round((f % 5 === 0 ? 3 : 1) * (rPerk('wealth') ? 1.5 : 1));
  R.shards += shards;
  const stones = Math.round(4 * f * W.mode.stones * (rPerk('wealth') ? 1.5 : 1));
  SAVE.stones += stones; W.stones += stones;
  SAVE.rift.best = Math.max(SAVE.rift.best, f);
  banner(`Floor ${f} cleared!  +${shards} ◈`, 'level');
  for (const e of W.enemies) if (!e.dead) { e.dead = true; burst(e.x, e.y, e.col, 8, 140, 0.5, 4); }
  W.enemies = []; W.boss = null; hideBossBar();
  W.projs = W.projs.filter(q => q.team === 'ally'); W.tele.length = 0;
  for (const k of W.pickups) k.mag = true;
  p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.2);
  R.rerolls = rPerk('reroll');
  openDraft();
}
function openDraft() {
  const list = riftDraftChoices(SAVE.hotbar.filter(Boolean));
  if (!list.length) { riftNextFloor(); return; }
  W.choosing = list; W.choosingKind = 'draft';
  INPUT.keys.clear();
  const box = $('boostCards'); box.innerHTML = '';
  const full = SAVE.hotbar.every(Boolean);
  $('boostModal').querySelector('.bm-head').textContent = full ? 'Draft a card (it replaces your weakest card)' : `Floor ${W.rift.floor} cleared! Draft a card`;
  list.forEach((id, i) => {
    const c = CARDS[id], rk = RANK_BY_ID[c.rank] || { name: 'Fusion', color: '#ff9af5' };
    const el = document.createElement('button');
    el.className = 'boost draft'; el.style.setProperty('--rc', rk.color);
    el.innerHTML = `<div class="b-key">${INPUT.touchMode ? '' : i + 1}</div><div class="b-rar">${rk.name}</div><canvas width="72" height="72"></canvas><div class="b-name">${c.name}</div><div class="b-desc">${c.desc}</div>`;
    renderCardIcon(el.querySelector('canvas'), id);
    el.onclick = () => pickBoost(i);
    box.appendChild(el);
  });
  if (W.rift.rerolls > 0) {
    const r = document.createElement('button'); r.className = 'btn small ghost'; r.textContent = `Reroll (${W.rift.rerolls})`;
    r.onclick = () => { W.rift.rerolls--; SFX.click(); openDraft(); };
    box.appendChild(r);
  }
  $('boostModal').classList.remove('hidden');
}
function pickDraft(i) {
  const id = W.choosing && W.choosing[i];
  if (!id) return;
  const hb = SAVE.hotbar;
  let slot = hb.indexOf(null);
  if (slot < 0) { slot = 0; hb.forEach((x, k) => { if (CARDS[x].cost < CARDS[hb[slot]].cost) slot = k; }); toast(`${CARDS[hb[slot]].name} leaves for ${CARDS[id].name}`, 'card'); }
  hb[slot] = id; W.rift.deck.push(id);
  W.choosing = null; W.choosingKind = null;
  $('boostModal').querySelector('.bm-head').textContent = 'Your soul resonates. Choose a boost';
  hideBoostModal();
  W.syn = new Set(activeSynergies());
  buildHUD();
  SFX.summon(5);
  W.floorPause = 1.4; W.nextFloorFn = riftNextFloor;
}
function riftNextFloor() {
  const R = W.rift;
  R.floor++;
  const st = riftStage(R.floor), old = W.themeIdx;
  W.st = st; W.sm = riftMult(R.floor);
  W.themeIdx = st.themeIdx; W.stageIdx = st.themeIdx;   // bosses scale with the stage the floor comes from
  if (W.themeIdx !== old) { W.deco = genDeco(W.themeIdx); initAmbient(); }
  W.time = 0; W.bossSpawned = false; W.bossWarnT = 0; W.boss = null; W.hordeT = 22; W.budget = 2;
  $('stageName').textContent = st.name;
  banner(st.bossFloor ? `Floor ${R.floor} · Boss floor!` : `Floor ${R.floor}`, st.bossFloor ? 'boss' : 'rank');
}
// hooks
const _rf_director = director;
director = function (dt) {
  if (W.isRift && W.floorPause <= 0 && !W.choosing && !W.st.bossFloor && W.time >= W.st.duration) { riftFloorCleared(); return; }
  _rf_director(dt);
};
const _rf_bossDefeated = bossDefeated;
bossDefeated = function (e) {
  if (!W.isRift) { _rf_bossDefeated(e); return; }
  SFX.boom(true); W.shake = 18; W.timeScale = 0.4;
  riftFloorCleared();
};
const _rf_pickBoost = pickBoost;
pickBoost = function (i) { if (W.choosingKind === 'draft') { pickDraft(i); return; } _rf_pickBoost(i); };
const _rf_pstat = pstat;
pstat = function (wb = true) { const s = _rf_pstat(wb); if (wb && W && W.active && W.isRift) s.hp = Math.round(s.hp * (1 + 0.15 * rPerk('vigor'))); return s; };
function riftFinish(won, retreat) {
  const R = W.rift, f = R.floor - (W.player.dead || retreat ? 0 : 0);
  SAVE.rift.shards += R.shards;
  restoreRiftHotbar();
  customResult(retreat ? 'LEFT THE RIFT' : 'RIFT RUN OVER', true, `The Rift: you reached floor ${f}`,
    [['Floor reached', f], ['Best floor', SAVE.rift.best], ['Rift shards', `◈ +${R.shards} (total ${SAVE.rift.shards})`], ['Cards drafted', R.deck.length], ['Enemies slain', W.kills], ['Magic stones', '◆ ' + W.stones]],
    [`Deck: ${R.deck.map(id => CARDS[id].name).join(', ')}`], 'Enter the Rift again', () => enterRift());
}
const _rf_finishStage = finishStage;
finishStage = function (won, retreat) {
  if (W.isRift) { if (!W.ended && !W.resultShown) riftFinish(won, retreat); return; }
  _rf_finishStage(won, retreat);
};
// crash safety: if the game closed mid-run, put the real hotbar back
const _rf_showScreen = showScreen;
showScreen = function (name) {
  if ((name === 'map' || name === 'title' || name === 'grimoire') && !(W && W.active && W.isRift && !W.ended && !W.resultShown)) restoreRiftHotbar();
  _rf_showScreen(name);
  if (name === 'play' && W.isRift && W.rift && W.rift.floor === 1) setTimeout(() => tipOnce('rift'), 600);
};
// map tab + panel
const _rf_buildMap = buildMap;
buildMap = function () {
  _rf_buildMap();
  const bar = $('regionBar'), ref = bar && bar.querySelector('.rtab.mode[data-mode="rush"]');
  if (!bar) return;
  const b = document.createElement('button');
  b.className = 'rtab mode' + (selectedStage === 'rift' ? ' active' : '') + (riftUnlocked() ? '' : ' locked');
  b.dataset.mode = 'rift'; b.textContent = '◈ The Rift';
  b.onclick = () => { SFX.click(); selectStage('rift'); };
  bar.insertBefore(b, ref ? ref.nextSibling : null);
};
const _rf_renderStageInfo = renderStageInfo;
renderStageInfo = function () {
  if (selectedStage !== 'rift') { _rf_renderStageInfo(); return; }
  const open = riftUnlocked(), r = SAVE.rift;
  $('stageInfo').innerHTML = `
    <div class="muted" style="font-size:12px;letter-spacing:.2em;text-transform:uppercase">Roguelite</div>
    <h3 style="color:#7fd3ff;text-shadow:0 0 14px #5ab8ff">The Rift</h3>
    <p class="blurb">Your Grimoire is sealed. Start with ${2 + rPerk('start')} random cards and draft a new one after every floor. A boss waits every 5 floors. Rift shards buy permanent perks.</p>
    <div class="info-row"><span>Best floor</span><span>${r.best || '—'}</span></div>
    <div class="info-row"><span>Rift shards</span><span>◈ ${r.shards}</span></div>
    <button class="btn primary" id="btnEnter" ${open ? '' : 'disabled'}>${open ? 'Enter the Rift' : "Locked: clear Emperor's Keep (Stage 18)"}</button>
    <h4 class="ev-shop-h">Rift perks</h4>
    <div class="ev-shop">${RIFT_PERKS.map(p => { const n = rPerk(p.id), max = n >= p.max; return `<div class="ev-item"><span><b>${p.name}</b> ${n ? `(${n}/${p.max})` : ''}<br><span class="muted">${p.desc(Math.min(p.max, n + 1))}</span></span><button class="btn small ${!max && r.shards >= p.cost[n] ? 'primary' : ''}" data-perk="${p.id}" ${max || r.shards < p.cost[n] ? 'disabled' : ''}>${max ? 'Max' : `◈ ${p.cost[n]}`}</button></div>`; }).join('')}</div>`;
  if (open) $('btnEnter').onclick = () => { SFX.click(); enterRift(); };
  $('stageInfo').querySelectorAll('[data-perk]').forEach(b => b.onclick = () => { if (buyRiftPerk(b.dataset.perk)) { SFX.level(); renderStageInfo(); } });
};
ACHIEVEMENTS.push(
  { id: 'rift10', name: 'Rift Walker', reward: 300, desc: 'Reach floor 10 of the Rift.', check: () => (SAVE.rift.best || 0) >= 10 },
  { id: 'rift25', name: 'Into the Deep Rift', reward: 700, desc: 'Reach floor 25 of the Rift.', check: () => (SAVE.rift.best || 0) >= 25 },
);
