'use strict';
// ---------- The Village: buildings, Summoning Altar, login calendar, weekly challenges, arena; Codex play stats ----------

// ================= buildings =================
const BUILDINGS = [
  { id: 'forge',    name: 'Forge',           icon: '⚒', mat: 'shard', col: '#ff8a3d', per: 0.03, fmt: v => `Summons deal +${pct(v)} damage` },
  { id: 'library',  name: 'Library',         icon: '❦', mat: 'shard', col: '#8fb0ff', per: 0.06, fmt: v => `Cards gain +${pct(v)} EXP` },
  { id: 'training', name: 'Training Ground', icon: '⚔', mat: 'horn',  col: '#ff6b7f', per: 0.05, fmt: v => `Allen gets +${pct(v)} max HP` },
  { id: 'shrine',   name: 'Shrine',          icon: '⛩', mat: 'horn',  col: '#c78bff', per: 0.05, fmt: v => `Soul gauge and Overdrive charge +${pct(v)} faster` },
  { id: 'market',   name: 'Market',          icon: '⚖', mat: 'star',  col: '#ffd66b', per: 0.05, fmt: v => `+${pct(v)} magic stones from pickups` },
  { id: 'sanctum',  name: 'Sanctum',         icon: '⌂', mat: 'star',  col: '#5dff9a', per: 0.15, fmt: v => `Sanctum gathers +${pct(v)} stones and essence` },
];
const BLD_MAX = 5;
const bLv = id => (SAVE && SAVE.village && SAVE.village[id]) || 0;
const bVal = id => bLv(id) * BUILDINGS.find(b => b.id === id).per;
const bldCost = lv => ({ stones: Math.round(300 * Math.pow(lv + 1, 1.6)), mats: (lv + 1) * 2 });
function upgradeBuilding(id) {
  const b = BUILDINGS.find(x => x.id === id), lv = bLv(id);
  if (!b || lv >= BLD_MAX) return false;
  const c = bldCost(lv);
  if (SAVE.stones < c.stones || (SAVE.mats[b.mat] || 0) < c.mats) return false;
  SAVE.stones -= c.stones; SAVE.mats[b.mat] -= c.mats;
  SAVE.village[id] = lv + 1;
  saveGame(); checkAch();
  return true;
}
// building bonuses
const _m_sMult = sMult;
sMult = function (s) { return _m_sMult(s) * (1 + bVal('forge')); };
const _m_addCardExp = addCardExp;
addCardExp = function (id, v) { _m_addCardExp(id, v * (1 + bVal('library'))); };
const _m_pstat = pstat;
pstat = function (withBoosts = true) {
  const s = _m_pstat(withBoosts);
  s.hp = Math.round(s.hp * (1 + bVal('training')));
  s.soul *= 1 + bVal('shrine');
  return s;
};
const _m_addOverdrive = addOverdrive;
addOverdrive = function (v) { _m_addOverdrive(v * (1 + bVal('shrine'))); };
const _m_rv = rv;
rv = function (eff) { return _m_rv(eff) + (eff === 'stoneGain' ? bVal('market') : 0); };
const _m_sanctumRate = sanctumRate;
sanctumRate = function () { const r = _m_sanctumRate(), k = 1 + bVal('sanctum'); return { stones: r.stones * k, essence: r.essence * k }; };

// ================= Summoning Altar =================
const ALTAR = { one: 100, ten: 900, pity: 30, rare: 0.06 };
const altarPool = () => CARD_IDS.filter(id => !CARDS[id].fusion && cardUnlocked(id));
const isRareCard = id => RANKS.indexOf(RANK_BY_ID[CARDS[id].rank]) >= 5;
function altarDraw(n) {
  const cost = n === 10 ? ALTAR.ten : ALTAR.one * n;
  const free = SAVE.altar.free || 0;
  const pay = n === 1 && free > 0 ? 0 : cost;
  if (SAVE.stones < pay) return null;
  if (pay === 0) SAVE.altar.free = free - 1; else SAVE.stones -= pay;
  const pool = altarPool(), rares = pool.filter(isRareCard), out = [];
  for (let i = 0; i < n; i++) {
    SAVE.altar.pity++; SAVE.altar.draws++;
    const rare = rares.length && (Math.random() < ALTAR.rare || SAVE.altar.pity >= ALTAR.pity);
    const list = rare ? rares : pool;
    const id = list[randi(0, list.length - 1)], cs = SAVE.cards[id];
    if (rare) SAVE.altar.pity = 0;
    const exp = Math.round(CARD_PROG.expNext(cs.lv) * (rare ? 1 : 0.4));
    const lv0 = cs.lv;
    if (cs.lv < CARD_PROG.maxLv) { cs.exp += exp; while (cs.lv < CARD_PROG.maxLv && cs.exp >= CARD_PROG.expNext(cs.lv)) { cs.exp -= CARD_PROG.expNext(cs.lv); cs.lv++; } }
    let star = false;
    if (rare && cs.enh < CARD_PROG.maxEnh) { cs.enh++; star = true; }
    out.push({ id, rare, exp, star, lv0, lv: cs.lv });
  }
  SAVE.counters.altar = (SAVE.counters.altar || 0) + n;
  saveGame(); checkAch();
  return out;
}

// ================= 28-day login calendar =================
const CAL_DAYS = 28;
function calReward(d) {   // d = 1..28
  if (d === CAL_DAYS) return { stones: 1500, essence: 5, mats: 5, outfit: 'pactkeeper', label: 'Pactkeeper outfit' };
  if (d % 7 === 0) return { stones: 800, essence: 3, mats: 3, free: 2, label: 'Big chest' };
  if (d % 3 === 0) return { stones: 150 + 15 * d, free: 1, label: 'Free Altar draw' };
  if (d % 5 === 0) return { stones: 150 + 15 * d, essence: 1, label: 'Essence' };
  return { stones: 120 + 20 * d, label: '' };
}
const calCanClaim = () => SAVE && SAVE.login.last !== todayKey();
function claimCalendar() {
  if (!calCanClaim()) return null;
  const d = (SAVE.login.day % CAL_DAYS) + 1, r = calReward(d);
  SAVE.login.day++; SAVE.login.last = todayKey();
  SAVE.stones += r.stones || 0; SAVE.essence += r.essence || 0;
  if (r.mats) for (const k in MATS) SAVE.mats[k] = (SAVE.mats[k] || 0) + r.mats;
  if (r.free) SAVE.altar.free = (SAVE.altar.free || 0) + r.free;
  if (r.outfit) { if (SAVE.cosmetics.calendar) SAVE.essence += 5; SAVE.cosmetics.calendar = true; }
  saveGame(); checkAch();
  return { day: d, r };
}
OUTFITS.push({ id: 'pactkeeper', name: 'Pactkeeper Robes', cloak: '#2a1a40', trim: '#e2c6ff', gold: '#fff2a8', req: 'Day 28 of the login calendar', ok: () => !!(SAVE.cosmetics && SAVE.cosmetics.calendar) });

// ================= weekly challenges (3 per week, bigger than quests) =================
const WEEKLY_POOL = [
  { id: 'bosses',  name: 'Boss Hunter',     n: 20,   val: () => SAVE.counters.bosses,             desc: n => `Defeat ${n} bosses` },
  { id: 'kills',   name: 'Exterminator',    n: 6000, val: () => SAVE.stats.kills,                 desc: n => `Defeat ${n.toLocaleString()} enemies` },
  { id: 'skills',  name: 'Spellweaver',     n: 60,   val: () => SAVE.counters.skills,             desc: n => `Use ${n} special skills` },
  { id: 'runs',    name: 'Tireless',        n: 25,   val: () => SAVE.stats.runs,                  desc: n => `Start ${n} battles` },
  { id: 'picks',   name: 'Upgrade Collector', n: 60, val: () => SAVE.counters.runPicks || 0,      desc: n => `Pick ${n} run upgrades` },
  { id: 'altar',   name: 'Devotee',         n: 20,   val: () => SAVE.counters.altar || 0,         desc: n => `Make ${n} Altar draws` },
  { id: 'arena',   name: 'Gladiator',       n: 8,    val: () => SAVE.arena.wins,                  desc: n => `Win ${n} arena matches` },
  { id: 'flawless', name: 'Untouchable',    n: 3,    val: () => SAVE.counters.flawless,           desc: n => `Defeat ${n} bosses without taking boss damage` },
];
const WEEKLY_REWARD = { stones: 900, essence: 2, mats: 2, free: 3 };
function ensureWeekly() {
  const w = SAVE.weeklyCh;
  if (w.week === weekKey() && w.list.length) return;
  let h = 0; for (const ch of weekKey() + SAVE.mode) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const rng = mulberry32(h), pool = [...WEEKLY_POOL];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  w.week = weekKey();
  w.list = pool.slice(0, 3).map(c => ({ id: c.id, start: c.val(), claimed: false }));
}
const weeklyDef = id => WEEKLY_POOL.find(c => c.id === id);
const weeklyProgress = c => Math.max(0, weeklyDef(c.id).val() - c.start);
function claimWeekly(i) {
  ensureWeekly();
  const c = SAVE.weeklyCh.list[i];
  if (!c || c.claimed || weeklyProgress(c) < weeklyDef(c.id).n) return false;
  c.claimed = true;
  SAVE.stones += WEEKLY_REWARD.stones; SAVE.essence += WEEKLY_REWARD.essence;
  for (const k in MATS) SAVE.mats[k] = (SAVE.mats[k] || 0) + WEEKLY_REWARD.mats;
  SAVE.altar.free = (SAVE.altar.free || 0) + WEEKLY_REWARD.free;
  saveGame(); checkAch();
  return true;
}
const _m_pickBoost = pickBoost;
pickBoost = function (i) { const run = W.choosingKind === 'run' && W.choosing && W.choosing[i]; _m_pickBoost(i); if (run && SAVE) SAVE.counters.runPicks = (SAVE.counters.runPicks || 0) + 1; };

// ================= arena (offline: 30 AI rival summoners; online players later) =================
const ARENA_RANKS = [
  { name: 'Bronze', min: 0, col: '#d08a4a', reward: 300 }, { name: 'Silver', min: 1100, col: '#c9d3e6', reward: 600 },
  { name: 'Gold', min: 1250, col: '#ffd66b', reward: 1000 }, { name: 'Platinum', min: 1400, col: '#7fe8ff', reward: 1500 },
  { name: 'Diamond', min: 1550, col: '#9fb4ff', reward: 2200 }, { name: 'Mythic', min: 1700, col: '#ff6bd6', reward: 3200 },
];
const arenaRank = r => [...ARENA_RANKS].reverse().find(k => r >= k.min);
const ARENA_TICKETS = 5;
const RIVAL_NAMES = ['Sera the Bold', 'Old Grenn', 'Mira Vale', 'Dusk Rider', 'Tomas Reed', 'Ivy Thorne', 'Brann Ash', 'Lio Starling', 'Kesh Moonweaver', 'Pell the Quiet', 'Vexa Crow', 'Orin Hale', 'Nadia Frost', 'Calder Stone', 'Rook Bellamy', 'Yuna Ember', 'Haldor Grim', 'Sable Wren', 'Ezra Vane', 'Talia Hawk', 'Borin Deep', 'Quill Sparrow', 'Riven Black', 'Lumi Day', 'Garrick Fell', 'Selene Mourn', 'Fenn Bright', 'Zara Night', 'Aldric Pact', 'The Nameless'];
function arenaRivals() {
  let h = 0; for (const ch of weekKey()) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const rng = mulberry32(h), pool = altarPool().length ? CARD_IDS.filter(id => !CARDS[id].fusion) : [];
  return RIVAL_NAMES.map((name, k) => {
    const rating = Math.round(900 + k * 35 + rng() * 40);
    const lv = clamp(Math.round(SAVE.level + (rating - SAVE.arena.rating) / 60 + (rng() - 0.5) * 4), 1, LEVEL_CAP);
    const maxRank = RANKS.filter(r => r.level <= lv).length - 1;
    const choices = pool.filter(id => RANKS.indexOf(RANK_BY_ID[CARDS[id].rank]) <= maxRank);
    const deck = [];
    while (deck.length < 6 && choices.length) deck.push(choices.splice(Math.floor(rng() * choices.length), 1)[0]);
    return { k, name, rating, lv, deck, cardLv: clamp(Math.round(lv * 0.6), 1, CARD_PROG.maxLv) };
  });
}
function ensureArena() {
  const a = SAVE.arena;
  if (a.ticketDay !== todayKey()) { a.ticketDay = todayKey(); a.tickets = ARENA_TICKETS; }
  if (a.week !== weekKey()) {
    const note = a.week && a.played ? arenaWeekReward() : null;
    a.week = weekKey(); a.played = false;
    a.rating = Math.round(1000 + (a.rating - 1000) * 0.75); a.weekStart = a.rating; a.weekBest = a.rating;
    return note;
  }
  return null;
}
function arenaWeekReward() {
  const rk = arenaRank(SAVE.arena.weekBest || SAVE.arena.rating);
  SAVE.stones += rk.reward; SAVE.essence += ARENA_RANKS.indexOf(rk);
  return `Last week's arena rank: ${rk.name}. Reward ◆ ${rk.reward}${ARENA_RANKS.indexOf(rk) ? ` · ✧ ${ARENA_RANKS.indexOf(rk)}` : ''}`;
}
function arenaOpponents() {
  const r = SAVE.arena.rating;
  return arenaRivals().sort((a, b) => Math.abs(a.rating - r) - Math.abs(b.rating - r)).slice(0, 3).sort((a, b) => a.rating - b.rating);
}
// rival cards become enemy units drawn with the card's own art
const AI_MAP = { melee: 'chase', charger: 'charger', flier: 'erratic', ranged: 'ranged', archon: 'ranged', dragon: 'ranged', heal: 'healer', priest: 'healer', buffer: 'healer', thorns: 'chase', taunt: 'chase' };
function arenaUnitDef(id, rv_) {
  const c = CARDS[id], k = (1 + 0.11 * (rv_.lv - 1)) * CARD_PROG.mult(rv_.cardLv, 0);
  const ai = c.stationary ? 'turret' : AI_MAP[c.ai] || 'chase';
  return {
    name: c.name, cardArt: id, hidden: true, hp: (c.hp || 100) * k * 0.9, speed: c.stationary ? 0 : Math.min(200, c.speed || 140), dmg: Math.max(8, c.dmg || c.bite || 10) * 0.45 * k, r: c.r || 13, exp: 5,
    ai, color: c.color, range: c.range || 260, atkCd: Math.max(1.2, (c.atkCd || 1) * 1.6), projSpeed: 340, pcolor: c.color, spread: 1,
  };
}
function enterArena(rival) {
  ensureArena();
  if (SAVE.arena.tickets <= 0) { toast('No arena tickets left today. They refill tomorrow.', 'fail'); return false; }
  SAVE.arena.tickets--; SAVE.arena.played = true;
  const theme = [5, 13, 23, 33][rival.k % 4];
  SFX.init();
  startStage(Math.min(theme, STAGES.length - 1), 'stage');
  Object.assign(W, { isArena: true, curses: new Set(), rewardMult: 1, sm: { hp: 1, dmg: 1, exp: 0.3, spd: 1 }, tier: 0 });
  W.st = { name: `Arena · vs ${rival.name}`, boss: null, duration: 1e9, density: 0, enemies: {}, theme: STAGES[Math.min(theme, STAGES.length - 1)].theme };
  for (const id of rival.deck) ENEMIES['arena_' + id] = arenaUnitDef(id, rival);
  ENEMIES.arena_core = { hidden: true, name: rival.name, hp: 2200 * (1 + 0.16 * (rival.lv - 1)), speed: 70, dmg: 10 + 2.2 * rival.lv, r: 16, exp: 0, ai: 'ranged', range: 300, atkCd: 1.6, projSpeed: 330, spread: 3, color: '#ff6b7f', pcolor: '#ffb3c0', draw: 'cultist' };
  const core = spawnEnemy('arena_core', 0, -420); core.isCore = true;
  W.arena = { rival, core, t: 2.5, i: 0, limit: 150 };
  buildHUD();
  showScreen('play');
  showBossBar(`${rival.name} · ${arenaRank(rival.rating).name} ${rival.rating}`);
  banner('ARENA', 'boss');
  MUSIC.play('boss');
  return true;
}
const _m_updateZones = updateZones;
updateZones = function (dt) {
  _m_updateZones(dt);
  const A = W.isArena && W.arena;
  if (!A || W.won || W.endT >= 0) return;
  A.t -= dt; A.limit -= dt;
  if (A.t <= 0 && !A.core.dead) {
    A.t = Math.max(2.2, 4.2 - W.time / 60);
    const alive = W.enemies.filter(e => !e.dead && e.d.cardArt).length;
    if (alive < 10) {
      const id = A.rival.deck[A.i++ % A.rival.deck.length], n = CARDS[id].count || 1;
      for (let k = 0; k < Math.min(3, n); k++) { const e = spawnEnemy('arena_' + id, A.core.x + rand(-50, 50), A.core.y + rand(20, 60)); e.spawnT = 0.4; }
      magicCircle(A.core.x, A.core.y + 40, '#ff3355', 40, 0.9);
    }
  }
  if (A.limit <= 0) { W.endT = 2; banner('TIME UP', 'boss'); }
};
const _m_killEnemy = killEnemy;
killEnemy = function (e, src) {
  _m_killEnemy(e, src);
  if (e.isCore && W.isArena && !W.won) {
    W.won = true; W.endT = 2.8; banner('ARENA VICTORY', 'victory'); SFX.victory();
    for (const o of W.enemies) if (!o.dead && o !== e) { o.dead = true; burst(o.x, o.y, o.col, 8, 140, 0.5, 4); }
  }
};
const _m_updateHUD = updateHUD;
updateHUD = function () {
  _m_updateHUD();
  if (W.isArena && W.arena) { const c = W.arena.core; $('bossFill').style.width = Math.max(0, 100 * c.hp / c.maxHp) + '%'; $('timer').textContent = fmtTime(Math.max(0, W.arena.limit)); }
};
const _m_drawEntity = drawEntity;
drawEntity = function (c, e, kind, t) {
  if (kind === 'enemy' && e.d && e.d.cardArt) {
    if (!e.c) { e.c = CARDS[e.d.cardArt]; e.id = e.d.cardArt; e.awk = false; e.t = 0; e.ang = 0; e.trail = [{ x: e.x, y: e.y }]; e.orbitA = 0; }
    e.t = W.t; e.trail[0] = { x: e.x, y: e.y };
    c.save(); c.translate(e.x, e.y + e.r * 0.8); c.scale(1, 0.4); c.strokeStyle = rgba('#ff3355', 0.8); c.lineWidth = 3; circ(c, 0, 0, e.r + 8); c.stroke(); c.restore();
    _m_drawEntity(c, e, 'summon', t);
    return;
  }
  _m_drawEntity(c, e, kind, t);
};
function arenaFinish(won, retreat) {
  W.resultShown = true;
  hideBoostModal(); hideBossBar(); MUSIC.play('menu');
  const a = SAVE.arena, rv_ = W.arena.rival;
  const E = 1 / (1 + Math.pow(10, (rv_.rating - a.rating) / 400)), K = 32;
  const delta = Math.round(won ? K * (1 - E) : -K * E);
  const r0 = a.rating, rk0 = arenaRank(r0);
  a.rating = Math.max(800, a.rating + delta); a.best = Math.max(a.best, a.rating); a.weekBest = Math.max(a.weekBest || 0, a.rating);
  won ? a.wins++ : a.losses++;
  const stones = won ? 120 + Math.round(rv_.rating / 10) : 30;
  SAVE.stones += stones;
  const t = $('resTitle');
  t.textContent = won ? 'ARENA VICTORY' : retreat ? 'FORFEIT' : 'ARENA DEFEAT';
  t.classList.toggle('lose', !won);
  $('resStage').textContent = `vs ${rv_.name} (${arenaRank(rv_.rating).name} ${rv_.rating})`;
  fillResults([['Rating', `${r0} → ${a.rating} (${delta >= 0 ? '+' : ''}${delta})`], ['Rank', arenaRank(a.rating).name], ['Record', `${a.wins}W · ${a.losses}L`], ['Tickets left', a.tickets], ['Enemies slain', W.kills], ['Magic stones', '◆ ' + (W.stones + stones)]]);
  const rk1 = arenaRank(a.rating);
  $('resExtra').innerHTML = rk1 !== rk0 ? `<div class="res-note relic">${ARENA_RANKS.indexOf(rk1) > ARENA_RANKS.indexOf(rk0) ? 'Promoted' : 'Dropped'} to <b>${rk1.name}</b>!</div>` : '';
  const retry = $('btnResRetry');
  retry.textContent = 'Back to Arena';
  if (!ARENA_UI.retry) ARENA_UI.retry = retry.onclick;
  retry.onclick = () => { SFX.click(); W.ended = true; retry.onclick = ARENA_UI.retry; vilTab = 'arena'; showScreen('village'); };
  checkAch(); saveGame(); backupSave(true);
  showScreen('result');
}
const ARENA_UI = { retry: null };
const _m_finishStage = finishStage;
finishStage = function (won, retreat) {
  if (W.isArena) { if (!W.ended && !W.resultShown) arenaFinish(won, retreat); return; }
  if (ARENA_UI.retry) { $('btnResRetry').onclick = ARENA_UI.retry; ARENA_UI.retry = null; }
  const plain = W.active && !W.isTower && !W.isRush && !W.isDaily && !W.isRaid, idx = W.stageIdx, time = W.time, ended = W.ended || W.resultShown;
  _m_finishStage(won, retreat);
  if (plain && !ended) recordPlay(idx, won, retreat, time);
};

// ================= play stats (local only) =================
function recordPlay(idx, won, retreat, time) {
  const ps = SAVE.playStats, s = ps[idx] || (ps[idx] = { plays: 0, wins: 0, deaths: 0, quits: 0, time: 0, deathAt: 0 });
  s.plays++; s.time += time;
  if (won) s.wins++; else if (retreat) s.quits++; else { s.deaths++; s.deathAt += time; }
  saveGame();
}
const _m_buildCodex = buildCodex;
buildCodex = function () {
  if (!document.querySelector('#codexTabs [data-tab="stats"]')) {
    const b = document.createElement('button'); b.className = 'tab'; b.dataset.tab = 'stats'; b.textContent = 'Play stats';
    b.onclick = () => { SFX.click(); codexTab = 'stats'; buildCodex(); };
    $('codexTabs').appendChild(b);
  }
  if (codexTab !== 'stats') { _m_buildCodex(); return; }
  document.querySelectorAll('#codexTabs .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === 'stats'));
  const root = $('codexContent'), ps = SAVE.playStats;
  const rows = STAGES.map((s, i) => [i, s, ps[i]]).filter(r => r[2]);
  const hardest = [...rows].sort((a, b) => b[2].deaths - a[2].deaths)[0];
  const top = Object.entries(SAVE.counters.summoned || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const h = Math.floor((SAVE.stats.playTime || 0) / 3600), m = Math.floor((SAVE.stats.playTime || 0) % 3600 / 60);
  root.innerHTML = `<p class="muted intro">Your own play, stored only on this device. Nothing is sent anywhere.</p>
    <div class="stat-tiles">
      <div class="stat-tile"><div class="k">Play time</div><div class="v">${h}h ${m}m</div></div>
      <div class="stat-tile"><div class="k">Battles</div><div class="v">${SAVE.stats.runs}</div></div>
      <div class="stat-tile"><div class="k">Falls</div><div class="v">${SAVE.stats.deaths}</div></div>
      <div class="stat-tile"><div class="k">Hardest stage</div><div class="v">${hardest && hardest[2].deaths ? `${hardest[0] + 1}. ${hardest[1].name}` : '—'}</div></div>
    </div>
    <h3 class="codex-h">Most summoned cards</h3>
    <div class="top-cards">${top.map(([id, n]) => CARDS[id] ? `<div class="tc"><canvas width="64" height="64" data-icon="${id}"></canvas><b>${CARDS[id].name}</b><span class="muted">${n.toLocaleString()}×</span></div>` : '').join('') || '<p class="muted">Summon some cards first.</p>'}</div>
    <h3 class="codex-h">Stages</h3>
    <div class="tbl-wrap"><table class="rec-table"><thead><tr><th>Stage</th><th>Plays</th><th>Wins</th><th>Win rate</th><th>Falls</th><th>Avg. fall at</th><th>Retreats</th><th>Avg. time</th></tr></thead><tbody>${rows.map(([i, s, r]) =>
      `<tr><td>${i + 1}. ${s.name}</td><td>${r.plays}</td><td>${r.wins}</td><td>${Math.round(100 * r.wins / r.plays)}%</td><td class="${r.deaths >= 3 ? 'warn' : ''}">${r.deaths}</td><td>${r.deaths ? fmtTime(r.deathAt / r.deaths) : '—'}</td><td>${r.quits}</td><td>${fmtTime(r.time / r.plays)}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">Play a stage to see stats.</td></tr>'}</tbody></table></div>`;
  root.querySelectorAll('[data-icon]').forEach(cv => renderCardIcon(cv, cv.dataset.icon));
};

// ================= Village screen =================
let vilTab = 'buildings', altarLast = null;
MENU_SCREENS.add('village');
(function addVillageScreen() {
  const sec = document.createElement('section');
  sec.className = 'screen'; sec.id = 'scr-village';
  sec.innerHTML = `<div class="topbar">
      <div class="tb-left"><h2 class="inline">Village</h2><div class="tb-stones">◆ <b id="vilStones">0</b></div><div class="tb-stones essence">✧ <b id="vilEss">0</b></div></div>
      <div class="tabs" id="vilTabs">${[['buildings', 'Buildings'], ['altar', 'Altar'], ['calendar', 'Calendar'], ['weekly', 'Challenges'], ['arena', 'Arena']].map(([k, n]) => `<button class="tab" data-tab="${k}">${n}<span class="dot" data-dot="${k}"></span></button>`).join('')}</div>
      <div class="tb-right"><button class="btn small" id="btnVilBack">Back to Map</button></div>
    </div>
    <div class="grim-body" id="vilContent"></div>`;
  $('screens').appendChild(sec);
  sec.querySelectorAll('#vilTabs .tab').forEach(b => b.onclick = () => { SFX.click(); vilTab = b.dataset.tab; buildVillage(); });
  $('btnVilBack').onclick = () => { SFX.click(); showScreen('map'); };
  const tb = document.querySelector('#scr-map .tb-right');
  const vb = document.createElement('button'); vb.className = 'btn small'; vb.id = 'btnVillage'; vb.innerHTML = 'Village<span class="dot" id="vilDot"></span>';
  vb.onclick = () => { SFX.click(); showScreen('village'); };
  tb.insertBefore(vb, $('btnGrimoire'));
})();
window.addEventListener('keydown', ev => { if (STATE === 'village' && ev.code === 'Escape') showScreen('map'); });
const _m_showScreen = showScreen;
showScreen = function (name) {
  _m_showScreen(name);
  if (name === 'village') buildVillage();
  if (name === 'map') villageDots();
};
function villageAlerts() {
  if (!SAVE) return {};
  ensureWeekly(); ensureArena();
  return {
    calendar: calCanClaim(),
    weekly: SAVE.weeklyCh.list.some(c => !c.claimed && weeklyProgress(c) >= weeklyDef(c.id).n),
    altar: (SAVE.altar.free || 0) > 0,
    arena: SAVE.arena.tickets > 0 && SAVE.level >= 5,
    buildings: BUILDINGS.some(b => bLv(b.id) < BLD_MAX && SAVE.stones >= bldCost(bLv(b.id)).stones && (SAVE.mats[b.mat] || 0) >= bldCost(bLv(b.id)).mats),
  };
}
function villageDots() {
  const al = villageAlerts(), d = $('vilDot');
  if (d) d.classList.toggle('on', !!(al.calendar || al.weekly || al.altar));
  document.querySelectorAll('#vilTabs [data-dot]').forEach(s => s.classList.toggle('on', !!al[s.dataset.dot]));
}
function buildVillage() {
  const note = ensureArena(); ensureWeekly();
  if (note) toast(note, 'ach');
  $('vilStones').textContent = SAVE.stones.toLocaleString(); $('vilEss').textContent = SAVE.essence;
  document.querySelectorAll('#vilTabs .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === vilTab));
  villageDots();
  const root = $('vilContent'); root.innerHTML = '';
  ({ buildings: vilBuildings, altar: vilAltar, calendar: vilCalendar, weekly: vilWeekly, arena: vilArena })[vilTab](root);
}
function vilBuildings(root) {
  root.innerHTML = `<canvas id="vilArt" class="vil-art" width="1100" height="260"></canvas>
    <p class="muted intro">Upgrade buildings with magic stones and boss materials. Every bonus is permanent. The Sanctum building boosts your Sanctum (on the map).</p>
    <div class="bld-grid">${BUILDINGS.map(b => {
      const lv = bLv(b.id), c = bldCost(lv), max = lv >= BLD_MAX, ok = !max && SAVE.stones >= c.stones && (SAVE.mats[b.mat] || 0) >= c.mats;
      return `<div class="bld" style="--c:${b.col}"><div class="bld-ic">${b.icon}</div><div class="bld-b"><div class="bld-n">${b.name} <span class="bld-lv">${'■'.repeat(lv)}<span class="off">${'■'.repeat(BLD_MAX - lv)}</span></span></div>
        <div class="bld-d">${lv ? b.fmt(lv * b.per) : 'Not built yet'}${max ? '' : ` <span class="muted">→ ${b.fmt((lv + 1) * b.per)}</span>`}</div>
        <button class="btn small ${ok ? 'primary' : ''}" data-bld="${b.id}" ${ok ? '' : 'disabled'}>${max ? 'Max level' : `${lv ? 'Upgrade' : 'Build'} ◆${c.stones.toLocaleString()} · ${MATS[b.mat].icon}${c.mats}`}</button></div></div>`;
    }).join('')}</div>
    <p class="muted mats-line">${Object.keys(MATS).map(k => `${MATS[k].icon} ${MATS[k].name}: <b>${SAVE.mats[k] || 0}</b> <span class="muted">(${MATS[k].from})</span>`).join(' · ')}</p>`;
  root.querySelectorAll('[data-bld]').forEach(b => b.onclick = () => { if (upgradeBuilding(b.dataset.bld)) { SFX.level(); toast(`${BUILDINGS.find(x => x.id === b.dataset.bld).name} upgraded!`, 'ach'); buildVillage(); } else SFX.fail(); });
  drawVillage($('vilArt'));
}
function drawVillage(cv) {
  const c = cv.getContext('2d'), W_ = cv.width, H_ = cv.height;
  const sky = c.createLinearGradient(0, 0, 0, H_); sky.addColorStop(0, '#0b0726'); sky.addColorStop(1, '#2a1a4a');
  c.fillStyle = sky; c.fillRect(0, 0, W_, H_);
  for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,255,255,${0.2 + (i * 37 % 10) / 14})`; c.fillRect((i * 151) % W_, (i * 89) % (H_ * 0.55), 2, 2); }
  c.fillStyle = '#fff2c8'; c.beginPath(); c.arc(W_ * 0.88, 52, 26, 0, TAU); c.fill();
  c.fillStyle = '#160f2e'; c.beginPath(); c.moveTo(0, H_ * 0.62);
  for (let x = 0; x <= W_; x += 50) c.lineTo(x, H_ * 0.58 - Math.sin(x * 0.01) * 22 - Math.sin(x * 0.027) * 10);
  c.lineTo(W_, H_); c.lineTo(0, H_); c.fill();
  c.fillStyle = '#21183c'; c.fillRect(0, H_ * 0.8, W_, H_ * 0.2);
  BUILDINGS.forEach((b, i) => {
    const lv = bLv(b.id), x = 90 + i * 184, base = H_ * 0.82, h = 46 + lv * 14, w = 92 + lv * 4;
    if (!lv) { c.strokeStyle = 'rgba(255,255,255,0.25)'; c.setLineDash([6, 6]); c.strokeRect(x - 46, base - 46, 92, 46); c.setLineDash([]); }
    else {
      c.fillStyle = '#3a2a5a'; c.fillRect(x - w / 2, base - h, w, h);
      c.fillStyle = b.col; c.beginPath(); c.moveTo(x - w / 2 - 10, base - h); c.lineTo(x, base - h - 30 - lv * 4); c.lineTo(x + w / 2 + 10, base - h); c.fill();
      c.fillStyle = '#ffd66b';
      for (let k = 0; k < lv; k++) c.fillRect(x - w / 2 + 12 + (k % 3) * 26, base - h + 12 + Math.floor(k / 3) * 22, 12, 12);
      c.fillStyle = '#120c22'; c.fillRect(x - 9, base - 24, 18, 24);
      const g = c.createRadialGradient(x, base - h / 2, 4, x, base - h / 2, w); g.addColorStop(0, b.col + '44'); g.addColorStop(1, 'transparent');
      c.fillStyle = g; c.fillRect(x - w, base - h - 40, w * 2, h + 40);
    }
    c.fillStyle = '#e8e0ff'; c.font = '700 15px Inter, sans-serif'; c.textAlign = 'center';
    c.fillText(`${b.icon} ${b.name}${lv ? ' ' + lv : ''}`, x, H_ - 12);
  });
}
function vilAltar(root) {
  const pool = altarPool(), rares = pool.filter(isRareCard), free = SAVE.altar.free || 0;
  root.innerHTML = `<div class="altar panel">
      <canvas id="altarArt" width="220" height="220"></canvas>
      <div class="altar-b">
        <h3>Summoning Altar</h3>
        <p class="muted">Offer magic stones to call a random card you have unlocked (${pool.length} cards). Every card drawn gains EXP. Rare cards (Fish rank and above, ${rares.length} unlocked) gain a full level and an enhancement star. A rare card is guaranteed at least every ${ALTAR.pity} draws.</p>
        <div class="altar-pity">Draws since last rare: <b>${SAVE.altar.pity}</b> / ${ALTAR.pity} · Total draws: ${SAVE.altar.draws}${free ? ` · <b class="gold">${free} free draw${free > 1 ? 's' : ''}</b>` : ''}</div>
        <div class="menu-row"><button class="btn primary" id="btnDraw1" ${free || SAVE.stones >= ALTAR.one ? '' : 'disabled'}>${free ? 'Free draw' : `Draw 1 · ◆${ALTAR.one}`}</button><button class="btn" id="btnDraw10" ${SAVE.stones >= ALTAR.ten ? '' : 'disabled'}>Draw 10 · ◆${ALTAR.ten}</button></div>
      </div>
    </div>
    <div class="altar-res" id="altarRes"></div>`;
  const art = $('altarArt').getContext('2d');
  art.translate(110, 110); drawMagicCircle(art, 0, 0, 92, Date.now() / 1500, '#ffd66b', 0.9, false);
  const show = res => {
    if (!res) { SFX.fail(); toast('Not enough magic stones', 'fail'); return; }
    altarLast = res; SFX.summon(res.some(r => r.rare) ? 9 : 4); if (res.some(r => r.rare)) SFX.level();
    buildVillage();
  };
  $('btnDraw1').onclick = () => show(altarDraw(1));
  $('btnDraw10').onclick = () => show(altarDraw(10));
  if (altarLast) {
    const box = $('altarRes');
    box.innerHTML = altarLast.map((r, k) => `<div class="ares ${r.rare ? 'rare' : ''}" style="animation-delay:${k * 70}ms"><canvas width="72" height="72" data-icon="${r.id}"></canvas><b>${CARDS[r.id].name}</b><span>+${r.exp.toLocaleString()} EXP${r.lv > r.lv0 ? ` · Lv ${r.lv}` : ''}</span>${r.star ? '<span class="gold">+1 ★</span>' : ''}</div>`).join('');
    box.querySelectorAll('[data-icon]').forEach(cv => renderCardIcon(cv, cv.dataset.icon));
  }
}
function vilCalendar(root) {
  const today = calCanClaim(), cur = SAVE.login.day % CAL_DAYS;
  root.innerHTML = `<p class="muted intro">Claim one reward per day. Missing a day never resets your progress. Day 28 gives the exclusive Pactkeeper outfit.</p>
    <div class="cal-grid">${Array.from({ length: CAL_DAYS }, (_, i) => {
      const d = i + 1, r = calReward(d), done = d <= cur, next = d === cur + 1;
      return `<div class="cal ${done ? 'done' : ''} ${next && today ? 'next' : ''} ${d % 7 === 0 ? 'big' : ''}"><div class="cal-d">Day ${d}</div><div class="cal-r">◆ ${r.stones}${r.essence ? `<br>✧ ${r.essence}` : ''}${r.mats ? `<br>${r.mats}× each material` : ''}${r.free ? `<br>${r.free} free draw${r.free > 1 ? 's' : ''}` : ''}${r.outfit ? '<br><b>Pactkeeper outfit</b>' : ''}</div>${done ? '<div class="cal-ok">✓</div>' : ''}</div>`;
    }).join('')}</div>
    <div class="menu-row"><button class="btn primary" id="btnClaimCal" ${today ? '' : 'disabled'}>${today ? `Claim day ${cur + 1}` : 'Come back tomorrow'}</button></div>`;
  $('btnClaimCal').onclick = () => { const res = claimCalendar(); if (res) { SFX.level(); toast(`Day ${res.day}: ◆ ${res.r.stones}${res.r.label ? ' · ' + res.r.label : ''}`, 'ach'); buildVillage(); } };
}
function vilWeekly(root) {
  const list = SAVE.weeklyCh.list;
  root.innerHTML = `<p class="muted intro">Three big challenges every week (new ones each Monday). Each pays ◆${WEEKLY_REWARD.stones}, ✧${WEEKLY_REWARD.essence}, ${WEEKLY_REWARD.mats} of each material and ${WEEKLY_REWARD.free} free Altar draws.</p>
    <div class="wk-list">${list.map((c, i) => {
      const d = weeklyDef(c.id), p = Math.min(d.n, weeklyProgress(c)), ok = p >= d.n;
      return `<div class="wk panel ${c.claimed ? 'done' : ''}"><div class="wk-n">${d.name}</div><div class="wk-d">${d.desc(d.n)}</div><div class="lvbar"><div style="width:${100 * p / d.n}%"></div></div><div class="wk-p">${p.toLocaleString()} / ${d.n.toLocaleString()}</div>
        <button class="btn small ${ok && !c.claimed ? 'primary' : ''}" data-wk="${i}" ${ok && !c.claimed ? '' : 'disabled'}>${c.claimed ? 'Claimed ✓' : ok ? 'Claim' : 'In progress'}</button></div>`;
    }).join('')}</div>`;
  root.querySelectorAll('[data-wk]').forEach(b => b.onclick = () => { if (claimWeekly(+b.dataset.wk)) { SFX.level(); toast('Weekly challenge complete!', 'ach'); buildVillage(); } });
}
function vilArena(root) {
  const a = SAVE.arena, rk = arenaRank(a.rating);
  if (SAVE.level < 5) { root.innerHTML = '<p class="muted intro">The arena opens at summoner level 5.</p>'; return; }
  const ops = arenaOpponents();
  root.innerHTML = `<div class="arena-head panel" style="--c:${rk.col}">
      <div><div class="ar-rank">${rk.name}</div><div class="ar-rating">${a.rating}</div><div class="muted">Best ${a.best} · ${a.wins}W ${a.losses}L</div></div>
      <div class="ar-ladder">${ARENA_RANKS.map(r => `<span style="color:${r.col}" class="${r === rk ? 'on' : ''}">${r.name}<small>${r.min || ''}</small></span>`).join('')}</div>
      <div><div class="muted">Tickets today</div><div class="ar-rating">${a.tickets} / ${ARENA_TICKETS}</div><div class="muted">Weekly reward: ◆ ${rk.reward}</div></div>
    </div>
    <p class="muted intro">Your current hotbar fights a rival summoner's army. Defeat the rival before 2:30 to win. Rivals are AI summoners for now; real players' loadouts can be added later with online accounts.</p>
    <div class="ar-ops">${ops.map(o => `<div class="ar-op panel"><div class="ar-name">${o.name}</div><div class="muted">${arenaRank(o.rating).name} ${o.rating} · Lv ${o.lv}</div>
      <div class="ar-deck">${o.deck.map(id => `<canvas width="44" height="44" data-icon="${id}" title="${CARDS[id].name}"></canvas>`).join('')}</div>
      <button class="btn small primary" data-op="${o.k}" ${a.tickets > 0 && SAVE.hotbar.some(Boolean) ? '' : 'disabled'}>Fight</button></div>`).join('')}</div>`;
  root.querySelectorAll('[data-icon]').forEach(cv => renderCardIcon(cv, cv.dataset.icon));
  root.querySelectorAll('[data-op]').forEach(b => b.onclick = () => { SFX.click(); enterArena(arenaRivals()[+b.dataset.op]); });
}

// ===== achievements for the village systems =====
ACHIEVEMENTS.push(
  { id: 'village', name: 'Village Founder',   reward: 200, desc: 'Build all 6 village buildings.',      check: () => BUILDINGS.every(b => bLv(b.id) >= 1) },
  { id: 'vilmax',  name: 'Master Builder',    reward: 800, desc: 'Raise every building to level 5.',     check: () => BUILDINGS.every(b => bLv(b.id) >= BLD_MAX) },
  { id: 'altar50', name: 'Faithful',          reward: 250, desc: 'Make 50 Altar draws.',                 check: () => (SAVE.counters.altar || 0) >= 50 },
  { id: 'cal28',   name: 'Every Single Day',  reward: 300, desc: 'Claim day 28 of the login calendar.',  check: () => !!SAVE.cosmetics.calendar },
  { id: 'gold',    name: 'Golden Gladiator',  reward: 400, desc: 'Reach Gold rank in the arena.',        check: () => SAVE.arena.best >= 1250 },
);
