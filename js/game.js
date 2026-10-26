'use strict';
// ---------- World simulation: player, summons, enemies, bosses, combat ----------

const BOUND = 1800;
const MAX_ENEMIES = 260;
const BOSS_DRAW_R = { warchief: 13, general: 15, treant: 46, crystal: 44, hydra: 46, bonelord: 42, wyvern: 46, abysslord: 50 };
let W = { active: false };

function stageMult(s) { return stageMultFor(s); }

function startStage(idx, kind = 'stage') {
  const tower = kind === 'tower', rush = kind === 'rush', daily = kind === 'daily', raid = kind === 'raid';
  const rushList = rush ? rushBosses() : null;
  const curses = kind === 'stage' ? new Set(SAVE.curses) : daily ? new Set(dailyInfo().curses) : new Set();
  const tier = Math.min(SAVE.tier || 0, SAVE.tierMax || 0);
  W = {
    active: true, isTower: tower, isRush: rush, isDaily: daily, isRaid: raid, raidT: 0, raidDmg: 0, mats: {}, dissolves: [], hitstop: 0, zk: 1, focus: null, flashT: 0, tier, od: 0, odT: 0, syn: new Set(activeSynergies()), ev: null, evT: rand(22, 32), buff: null,
    rushList, rushI: 0, floor: 1, floorsCleared: 0, stageIdx: idx,
    idx: tower ? towerTier(1) : rush ? Math.min(7, BOSS_STAGE[rushList[0]]) : Math.min(7, idx),
    themeIdx: tower ? towerTheme(1) : rush ? BOSS_STAGE[rushList[0]] : raid ? 7 : idx,
    st: tower ? towerStage(1) : rush ? rushStage(0, rushList) : raid ? raidStage() : STAGES[idx], mode: MODES[SAVE.mode],
    sm: tower ? towerMult(1) : stageMult(rush ? BOSS_STAGE[rushList[0]] : raid ? Math.max(0, SAVE.cleared.lastIndexOf(true)) : idx), time: 0, t: 0,
    curses, rewardMult: (1 + CURSES.filter(c => curses.has(c.id)).reduce((a, c) => a + c.bonus, 0)) * tierReward(tier),
    bolts: [], beams: [], later: [], haloT: 8, essence: 0, relicGain: null,
    player: {
      x: 0, y: 0, vx: 0, vy: 0, r: 13, face: 1, walkT: 0, aimX: 1, aimY: 0,
      hp: 1, maxHp: 1, mp: 1, maxMp: 1, shield: 0,
      inv: 0, dashT: 0, dx: 0, dy: 0, atkT: 0.6, enhT: 0, chill: 0, dead: false,
      cds: { Space: 0, KeyQ: 0, KeyE: 0, KeyR: 0 },
    },
    summons: [], enemies: [], projs: [], pickups: [], tele: [], circles: [], zones: [],
    boss: null, bossSpawned: false, bossWarnT: 0, budget: 3, hordeT: 30,
    kills: 0, expGained: 0, stones: 0, startLevel: SAVE.level, unlocks: [], cardUps: {},
    shake: 0, hurtFlash: 0, camX: 0, camY: 0, slotCd: [0, 0, 0, 0, 0, 0], cskCd: {}, howlT: 0,
    boosts: {}, picks: 0, soul: 0, soulMax: 40, choosing: null,
    dmgTaken: 0, bossDmg: 0, dashes: 0, cardsUsed: new Set(), bossAt: 0, bossKillTime: 0,
    floorPause: 0, achT: 2, tut: null,
    endT: -1, won: false, timeScale: 1, nextId: 1,
  };
  W.deco = genDeco(W.themeIdx);
  W.ps = pstat();
  const p = W.player;
  p.hp = p.maxHp = W.ps.hp; p.mp = p.maxMp = W.ps.mp;
  if (kind === 'stage' && idx === 0 && !SAVE.tutorialDone) W.tut = { step: 0, moved: 0, t: 0 };
  if (tower) SAVE.towerBest = Math.max(SAVE.towerBest, 1);
  if (SAVE.companion && compUnlocked(SAVE.companion)) W.summons.push(makeCompanion(SAVE.companion, 40, 30));
  P.length = 0; TXT.length = 0;
  initAmbient();
  magicCircle(0, 0, '#7a4cff', 70, 1.2);
  burst(0, 0, '#a77bff', 40, 260, 0.9, 6);
  SAVE.stats.runs++;
}

function refreshStats() {
  const p = W.player, oh = p.maxHp, om = p.maxMp;
  W.ps = pstat();
  p.maxHp = W.ps.hp; p.maxMp = W.ps.mp;
  if (p.maxHp > oh) p.hp += p.maxHp - oh;
  if (p.maxMp > om) p.mp += p.maxMp - om;
  p.hp = Math.min(p.hp, p.maxHp); p.mp = Math.min(p.mp, p.maxMp);
}
function magicCircle(x, y, color, r, dur = 0.9) { W.circles.push({ x, y, color, r, t: 0, dur, rot: rand(TAU) }); }
const capacity = () => W.ps.cap;
const capUsed = () => W.summons.reduce((a, s) => a + (s.c.weight ?? 1), 0);
const stageMultFor = s => ({ hp: 1 + 0.75 * Math.min(s, 8) + 0.45 * Math.max(0, s - 8), dmg: 1 + 0.3 * Math.min(s, 8) + 0.12 * Math.max(0, s - 8), exp: 1 + 0.6 * Math.min(s, 8) + 0.2 * Math.max(0, s - 8), spd: 1 + 0.03 * Math.min(s, 12) });

function mouseWorld() {
  if (INPUT.touchMode || INPUT.padMode) { const p = W.player; return { x: p.x + p.aimX * 140, y: p.y + p.aimY * 140 }; }
  return { x: (INPUT.mx - VW / 2) / ZOOM + W.camX, y: (INPUT.my - VH / 2) / ZOOM + W.camY };
}
function summonPoint() {
  const p = W.player, m = mouseWorld();
  let dx = m.x - p.x, dy = m.y - p.y; const d = Math.hypot(dx, dy), max = 240;
  if (d > max) { dx *= max / d; dy *= max / d; }
  return { x: clamp(p.x + dx, -BOUND, BOUND), y: clamp(p.y + dy, -BOUND, BOUND) };
}

// ---------------- spatial grid for enemies ----------------
const CELL = 64;
const GRID = new Map();
const gkey = (cx, cy) => (cx + 200) * 1000 + (cy + 200);
function gridBuild() {
  GRID.clear();
  for (const e of W.enemies) {
    if (e.dead || e.isBoss) continue;
    const k = gkey(Math.floor(e.x / CELL), Math.floor(e.y / CELL));
    let a = GRID.get(k); if (!a) { a = []; GRID.set(k, a); } a.push(e);
  }
}
function enemiesNear(x, y, R, cb) {
  const c0 = Math.floor((x - R - 32) / CELL), c1 = Math.floor((x + R + 32) / CELL);
  const r0 = Math.floor((y - R - 32) / CELL), r1 = Math.floor((y + R + 32) / CELL);
  for (let cx = c0; cx <= c1; cx++) for (let cy = r0; cy <= r1; cy++) {
    const a = GRID.get(gkey(cx, cy)); if (!a) continue;
    for (let i = 0; i < a.length; i++) if (!a[i].dead) cb(a[i]);
  }
  if (W.boss && !W.boss.dead) cb(W.boss);
}
function nearestEnemy(x, y, maxD, filter) {
  let best = null, bd = maxD * maxD;
  for (const e of W.enemies) {
    if (e.dead || e.spawnT < 0.5) continue;
    const dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy;
    if (d < bd && (!filter || filter(e))) { bd = d; best = e; }
  }
  return best;
}

// ---------------- spawning ----------------
function spawnRadius() { return Math.hypot(VW, VH) / 2 / ZOOM + 70; }
function spawnEnemy(type, x, y, elite = false) {
  const d = ENEMIES[type], sm = W.sm, m = W.mode;
  if (x === undefined) {
    const a = rand(TAU), R = spawnRadius();
    x = clamp(W.player.x + Math.cos(a) * R, -BOUND + 20, BOUND - 20);
    y = clamp(W.player.y + Math.sin(a) * R, -BOUND + 20, BOUND - 20);
  }
  const em = elite ? 4 : 1, cu = W.curses;
  const e = {
    id: W.nextId++, type, d, x, y, vx: 0, vy: 0, kx: 0, ky: 0,
    r: d.r * (elite ? 1.45 : 1), baseR: d.r,
    hp: d.hp * sm.hp * m.ehp * em * tierHp(), dmg: d.dmg * sm.dmg * m.edmg * (elite ? 1.5 : 1) * (cu.has('brutal') ? 1.5 : 1) * tierHp(),
    speed: d.speed * sm.spd * rand(0.9, 1.1) * (cu.has('swift') ? 1.3 : 1), exp: d.exp * sm.exp * (elite ? 6 : 1),
    shield: (d.shield || 0) * sm.hp * m.ehp * em, shieldMax: (d.shield || 0) * sm.hp * m.ehp * em, lastHit: 0, blinkCd: rand(1.5, 3),
    col: d.color, elite, atkT: rand(0.6, 1.6), rtT: 0, target: null, flash: 0,
    slowT: 0, slowF: 0, poisonT: 0, poisonD: 0, poisonTick: 0, poisonSrc: null, stunT: 0, markT: 0,
    seed: rand(100), state: '', st: 0, chargeCd: rand(1, 3), face: 1, spawnT: 0, lunge: 0,
  };
  e.maxHp = e.hp;
  W.enemies.push(e);
  return e;
}
function horde() {
  const type = weightedPick(W.st.enemies);
  const n = 14 + W.idx * 2, R = spawnRadius(), a0 = rand(TAU);
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * TAU;
    spawnEnemy(type, clamp(W.player.x + Math.cos(a) * R, -BOUND + 20, BOUND - 20), clamp(W.player.y + Math.sin(a) * R, -BOUND + 20, BOUND - 20));
  }
  toast('A horde surrounds you!', 'warn');
  SFX.warn();
}
function spawnBoss() {
  const id = W.st.boss, bd = BOSSES[id];
  bd.drawR = BOSS_DRAW_R[bd.draw];
  const a = rand(TAU), p = W.player;
  const x = clamp(p.x + Math.cos(a) * 380, -BOUND + 80, BOUND - 80), y = clamp(p.y + Math.sin(a) * 380, -BOUND + 80, BOUND - 80);
  const m = W.mode, tw = W.isTower;
  const si = W.isRush ? BOSS_STAGE[id] : W.stageIdx;
  const late = !tw && si >= 8;
  const baseHp = late ? bossHpFor(si) * (bd.final ? 1.4 : 1) : bd.hp, baseDmg = late ? bossDmgFor(si) : bd.dmg;
  const cu = W.curses;
  const e = {
    id: W.nextId++, isBoss: true, bossId: id, bd, d: { ai: 'boss' }, x, y, vx: 0, vy: 0, kx: 0, ky: 0, r: bd.r, baseR: bd.r,
    hp: baseHp * m.ehp * (tw ? 0.5 + 0.1 * W.floor : 1) * tierHp(), dmg: baseDmg * m.edmg * (tw ? 0.7 + 0.05 * W.floor : 1) * (cu.has('brutal') ? 1.5 : 1) * tierHp(),
    shield: 0, shieldMax: 0, lastHit: 0, late,
    speed: bd.speed, exp: 120 * ((late ? si : W.idx) + 1),
    col: bd.color, atkT: 1, flash: 0, slowT: 0, slowF: 0, poisonT: 0, poisonD: 0, poisonTick: 0, stunT: 0, markT: 0,
    seed: 0, face: 1, spawnT: 0, pat: null, ps: 0, patT: 2.2, pi: 0, enraged: false, spinA: 0, lunge: 0,
  };
  e.maxHp = e.hp;
  if (W.isRaid) { e.maxHp = SAVE.worldBoss.maxHp; e.hp = SAVE.worldBoss.hpLeft; e.dmg = (20 + 3 * SAVE.level) * W.mode.edmg; W.raidT = RAID_TIME; SAVE.worldBoss.attempts++; }
  W.enemies.push(e);
  W.boss = e;
  W.focus = { x, y, t: 1.5 };
  voiceBoss(bd, x);
  W.bossAt = W.time; W.bossDmg = 0;
  magicCircle(x, y, '#ff3355', 120, 1.6);
  burst(x, y, bd.color, 70, 400, 1.2, 8);
  W.shake = 14;
  W.timeScale = 0.35;
  showBossBar(bd.name);
  showBossIntro(bd);
  MUSIC.play(bd.final ? 'final' : 'boss');
}

function director(dt) {
  const st = W.st;
  if (W.floorPause > 0) {
    W.floorPause -= dt;
    if (W.floorPause <= 0) { if (W.nextFloorFn) { const f = W.nextFloorFn; W.nextFloorFn = null; f(); } else nextFloor(); }
    return;
  }
  if (W.isTower && !st.bossFloor && W.time >= st.duration) { floorCleared(); return; }
  if (!W.bossSpawned && W.time >= st.duration && (!W.isTower || st.bossFloor)) {
    W.bossSpawned = true; W.bossWarnT = 2.6;
    banner(BOSSES[st.boss].name + ' approaches!', 'boss');
    SFX.roar();
  }
  if (W.bossWarnT > 0) { W.bossWarnT -= dt; if (W.bossWarnT <= 0) spawnBoss(); return; }
  if (!st.density) return;
  const prog = Math.min(1, W.time / st.duration);
  let rate = (1.0 + prog * 3.2) * st.density * (W.curses.has('horde') ? 1.5 : 1);
  if (W.boss) rate *= 0.3;
  if (tutGating()) rate *= 0.35;
  W.budget = Math.min(6, W.budget + rate * dt);
  while (W.budget >= 1 && W.enemies.length < MAX_ENEMIES) {
    W.budget -= 1;
    const elite = Math.random() < (0.02 + W.idx * 0.004 + prog * 0.02) * (W.curses.has('elite') ? 4 : 1);
    spawnEnemy(weightedPick(st.enemies), undefined, undefined, elite);
  }
  W.hordeT -= dt;
  if (W.hordeT <= 0 && !W.bossSpawned && !tutGating()) { W.hordeT = 28; horde(); }
}

// ---------------- combat ----------------
function damageEnemy(e, dmg, src, opts) {
  if (e.dead || dmg <= 0) return;
  dmg *= rand(0.9, 1.1);
  if (e.markT > 0) dmg *= 1.5;
  let crit = false;
  if (src && src.c && !(opts && opts.quiet) && Math.random() < 0.08 + eqv('crit')) { dmg *= 2; crit = true; }
  e.lastHit = W.t;
  if (src && src.c && !(opts && opts.quiet) && Math.random() < rv('poison')) { e.poisonT = 3; e.poisonD = Math.max(e.poisonD, (src.dmg || 10) * 0.6); e.poisonSrc = src; }
  if (e.shield > 0) {
    const a = Math.min(e.shield, dmg); e.shield -= a; dmg -= a;
    if (e.shield <= 0) { ring(e.x, e.y, '#9fe8ff', e.r, e.r * 2.4, 0.4, 3); burst(e.x, e.y, '#9fe8ff', 10, 200, 0.4, 3, 'spark'); }
    if (dmg <= 0) { e.flash = 0.05; return; }
  }
  if (W.isRaid && e.isBoss) W.raidDmg += Math.min(dmg, Math.max(0, e.hp));
  e.hp -= dmg;
  e.flash = 0.07;
  if (crit) { txt(e.x, e.y - e.r - 14, Math.round(dmg) + '!', '#ffd34a', 19, 0.8); if (e.isBoss || e.elite) hitStop(0.035); }
  if (e.isBoss && dmg > e.maxHp * 0.04) hitStop(0.05);
  trackDamage(src, dmg);
  if (e.isBoss && src && src.c) addOverdrive(dmg / e.maxHp * 120);
  if (e.treasure && Math.random() < 0.18) dropPickup(e.x, e.y, 'stone', 1 * W.mode.stones);
  if (SETTINGS.dmgNums && !crit && (!(opts && opts.quiet) || Math.random() < 0.3)) {
    txt(e.x, e.y - e.r - 6, Math.round(dmg), opts && opts.color ? opts.color : (e.isBoss ? '#ffd34a' : e.markT > 0 ? '#ff8095' : '#ffffff'), e.isBoss ? 15 : 12, 0.6);
  }
  if (!(opts && opts.quiet)) { panAt(e.x); crit ? SFX.crit() : SFX.hit(); if (src && src.c && Math.random() < 0.06) voiceCard(src.id, true); }
  if (e.isBoss) W.shake = Math.max(W.shake, 1.5);
  if (e.hp <= 0) killEnemy(e, src);
}
function killEnemy(e, src) {
  if (e.dead) return;
  e.dead = true;
  W.kills++; SAVE.stats.kills++;
  const key = e.isBoss ? (e.bd.base || e.bossId) : e.type;
  SAVE.bestiary[key] = (SAVE.bestiary[key] || 0) + 1;
  const ev = e.exp * W.mode.exp * W.rewardMult;
  if (rv('killHeal')) healPlayer(rv('killHeal'), true);
  addDissolve(e);
  panAt(e.x);
  if (src && src.c && src.c.tags) { const rk = SAVE.counters.rankKills || (SAVE.counters.rankKills = {}); for (const tg of src.c.tags) rk[tg] = (rk[tg] || 0) + 1; }
  if (e.elite || e.champion) hitStop(0.04);
  burst(e.x, e.y, e.col, e.isBoss ? 120 : e.elite ? 30 : 12, e.isBoss ? 520 : 200, e.isBoss ? 1.4 : 0.55, e.isBoss ? 10 : 5);
  burst(e.x, e.y, e.col, 8, 60, 0.9, 3, 'glow', { grav: -90, drag: 1 });
  burst(e.x, e.y, '#ffffff', e.isBoss ? 30 : 4, 260, 0.35, 3, 'spark');
  ring(e.x, e.y, e.col, e.r * 0.5, e.r * 2.2, 0.35, 3);
  SFX.die();
  if (src && src.id && CARDS[src.id]) { addCardExp(src.id, ev); trackKill(src); }
  if (!e.isBoss) addOverdrive(e.elite ? 6 : 2);
  if (e.treasure || e.champion) eventKillRewards(e);
  if (bs('mana_burst')) W.player.mp = Math.min(W.player.maxMp, W.player.mp + bs('mana_burst'));
  if (e.isBoss) {
    for (let i = 0; i < 24; i++) dropPickup(e.x + rand(-40, 40), e.y + rand(-40, 40), 'exp', ev / 24);
    const st = Math.round(e.bd.stones * W.mode.stones * (W.isTower ? 0.5 : 1));
    for (let i = 0; i < 8; i++) dropPickup(e.x + rand(-40, 40), e.y + rand(-40, 40), 'stone', st / 8);
    SAVE.counters.bosses++;
    if (!W.isRaid) grantMat(W.isTower ? bossMaterial(Math.min(27, W.floor)) : bossMaterial(W.isRush ? BOSS_STAGE[e.bossId] : W.stageIdx), (e.bd.final ? 3 : 1) + (W.tier >= 2 ? 1 : 0), e.x, e.y - e.r - 50);
    W.flashT = 0.25; hitStop(0.12);
    if (W.bossDmg === 0) SAVE.counters.flawless++;
    W.bossKillTime = W.time - W.bossAt;
    if (e.late || (W.isTower && W.floor >= 20)) {
      const n = (e.bd.final ? 2 : 1) + (W.tier >= 3 ? 1 : 0);
      SAVE.essence += n; W.essence += n;
      txt(e.x, e.y - e.r - 30, `+${n} Abyss Essence`, '#ff8af0', 16, 1.6);
    }
    bossDefeated(e);
    return;
  }
  addSoul(e.elite ? 4 : 1);
  dropPickup(e.x, e.y, 'exp', ev);
  if (e.elite) dropPickup(e.x, e.y, 'stone', randi(3, 5) * W.mode.stones);
  else if (Math.random() < 0.04 * (1 + bs('lucky'))) dropPickup(e.x, e.y, 'stone', 1 * W.mode.stones);
  if (Math.random() < 0.01) dropPickup(e.x, e.y, 'heart', 0.15);
  if (e.d.split) for (let i = 0; i < (e.d.splitN || 2); i++) { const s = spawnEnemy(e.d.split, e.x + rand(-10, 10), e.y + rand(-10, 10)); s.spawnT = 0.6; }
}
function hitAlly(t, dmg, src) {
  if (W.won || dmg <= 0 || W.floorPause > 0) return;
  if (t === W.player) {
    const p = t;
    if (p.inv > 0 || p.dead) return;
    dmg *= 1 - Math.min(0.6, rv('armor') + eqv('armor'));
    if (src && src.d && src.d.lifesteal && !src.dead) src.hp = Math.min(src.maxHp, src.hp + dmg);
    if (p.shield > 0) { const a = Math.min(p.shield, dmg); p.shield -= a; dmg -= a; if (dmg <= 0) { ring(p.x, p.y, '#7fd0ff', 16, 30, 0.25, 2); return; } }
    p.hp -= dmg; p.inv = 0.25;
    W.dmgTaken += dmg;
    if (W.boss) W.bossDmg += dmg;
    W.hurtFlash = 0.35; W.shake = Math.max(W.shake, 6);
    txt(p.x, p.y - 24, '-' + Math.round(dmg), '#ff4d6d', 16);
    burst(p.x, p.y, '#ff4d6d', 8, 160, 0.4, 4);
    SFX.hurt();
    if (p.hp <= 0) { p.hp = 0; playerDie(); }
  } else {
    if (t.dead || t.down || t.fortT > 0) return;
    if (src && src.d && src.d.lifesteal && !src.dead) src.hp = Math.min(src.maxHp, src.hp + dmg);
    if (t.shield > 0) { const a = Math.min(t.shield, dmg); t.shield -= a; dmg -= a; if (dmg <= 0) return; }
    t.hp -= dmg; t.flash = 0.08;
    if (t.hp <= 0) killSummon(t);
  }
}
function killSummon(s, forced) {
  if (s.dead) return;
  if (!forced && s.c.revive && !s.revived) {
    s.revived = true; s.hp = s.maxHp * 0.6;
    burst(s.x, s.y, '#ffcf5a', 50, 300, 1, 7, 'glow', { grav: -100 });
    ring(s.x, s.y, '#ff8a3d', 10, 90, 0.6, 4);
    txt(s.x, s.y - 30, 'Reborn!', '#ffcf5a', 16);
    return;
  }
  if (s.c.comp) {
    s.down = true; s.downT = 10; s.hp = 0; s.target = null; s.vx = s.vy = 0;
    burst(s.x, s.y, s.col, 18, 200, 0.6, 5);
    txt(s.x, s.y - 30, s.c.name + ' is down!', '#ffb3c0', 14, 1.2);
    return;
  }
  s.dead = true;
  burst(s.x, s.y, s.col, 18, 220, 0.6, 5);
  ring(s.x, s.y, s.col, 6, 40, 0.4, 2);
  if (!forced && rv('deathBlast')) allyBlast(s.x, s.y, 90, s.maxHp * 0.5 * rv('deathBlast'), '#e8e2cf', s);
  if (!forced && s.c.tags.includes('insect') && syn('insect')) allyBlast(s.x, s.y, 60, s.dmg * 4 * sMult(s), s.col, s);
}
function dismissSummon(s, towardPlayer) {
  if (s.dead) return;
  s.dead = true;
  const p = W.player;
  for (let i = 0; i < 10; i++) {
    const a = towardPlayer ? angTo(s, p) + rand(-0.4, 0.4) : rand(TAU), sp = towardPlayer ? rand(200, 420) : rand(40, 120);
    spawnP({ x: s.x, y: s.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5, size: 4, color: s.col, drag: 1 });
  }
}
function explodeAt(x, y, R, dmg, color) {
  burst(x, y, color, 40, 380, 0.7, 7);
  burst(x, y, '#ffffff', 12, 300, 0.3, 3, 'spark');
  ring(x, y, color, 10, R, 0.35, 4);
  for (let i = 0; i < 8; i++) spawnP({ x: x + rand(-20, 20), y: y + rand(-20, 20), vx: rand(-40, 40), vy: rand(-60, -10), life: 1, size: 14, color: '#202028', kind: 'smoke', drag: 1.5 });
  W.shake = Math.max(W.shake, 8);
  panAt(x); SFX.boom(false);
  const p = W.player;
  if (dist2(p, { x, y }) < (R + p.r) ** 2) hitAlly(p, dmg);
  for (const s of W.summons) if (!s.c.flying && dist2(s, { x, y }) < (R + s.r) ** 2) hitAlly(s, dmg);
}

function dropPickup(x, y, type, val) {
  if (type === 'exp' && W.pickups.length > 380) {
    for (let i = 0; i < 6; i++) { const k = W.pickups[randi(0, W.pickups.length - 1)]; if (k.type === 'exp') { k.val += val; return; } }
  }
  const a = rand(TAU), s = rand(30, 110);
  W.pickups.push({ x, y, type, val, vx: Math.cos(a) * s, vy: Math.sin(a) * s, mag: false, t: 0 });
}

// ---------------- progression ----------------
function gainExp(v) {
  if (SAVE.level >= LEVEL_CAP) { SAVE.exp = 0; checkTierUnlock(); return; }
  if (buffOn('wisdom')) v *= 1.5;
  SAVE.exp += v; W.expGained += v;
  let leveled = false;
  while (SAVE.level < LEVEL_CAP && SAVE.exp >= PLAYER.expNext(SAVE.level)) {
    SAVE.exp -= PLAYER.expNext(SAVE.level);
    SAVE.level++;
    leveled = true;
    const rk = RANKS.find(r => r.level === SAVE.level);
    if (rk) {
      W.unlocks.push(rk.id);
      for (const id of CARD_IDS) if (CARDS[id].rank === rk.id && !SAVE.hotbar.includes(id)) {
        const slot = SAVE.hotbar.indexOf(null);
        if (slot >= 0) SAVE.hotbar[slot] = id;
      }
      setTimeout(() => { banner(`New rank unlocked: ${rk.name} (${rk.grade})`, 'rank'); SFX.unlock(); }, 900);
      buildHotbar();
    }
  }
  if (leveled) {
    const p = W.player;
    refreshStats();
    p.hp = p.maxHp; p.mp = p.maxMp;
    banner('LEVEL UP!  Lv ' + SAVE.level, 'level');
    burst(p.x, p.y, '#ffd34a', 60, 360, 1, 6);
    ring(p.x, p.y, '#ffd34a', 10, 120, 0.6, 4);
    magicCircle(p.x, p.y, '#ffd34a', 60, 1);
    SFX.level();
    saveGame();
  }
}
function addCardExp(id, v) {
  const cs = SAVE.cards[id];
  if (cs.lv >= CARD_PROG.maxLv) return;
  cs.exp += v;
  while (cs.lv < CARD_PROG.maxLv && cs.exp >= CARD_PROG.expNext(cs.lv)) {
    cs.exp -= CARD_PROG.expNext(cs.lv);
    cs.lv++;
    W.cardUps[id] = cs.lv;
    toast(`${CARDS[id].name} reached Lv ${cs.lv}`, 'card');
  }
}

// ---------------- player ----------------
function updatePlayer(dt) {
  const p = W.player;
  if (p.dead) return;
  for (const k in p.cds) if (p.cds[k] > 0) p.cds[k] -= dt;
  p.inv -= dt; p.enhT -= dt; p.chill -= dt;
  let mx = 0, my = 0;
  if (INPUT.joy) { mx = INPUT.joy.x; my = INPUT.joy.y; }
  else {
    if (actionHeld('up')) my -= 1;
    if (actionHeld('down')) my += 1;
    if (actionHeld('left')) mx -= 1;
    if (actionHeld('right')) mx += 1;
    const ml = Math.hypot(mx, my); if (ml) { mx /= ml; my /= ml; }
  }
  p.mvx = mx; p.mvy = my;
  const ml = Math.hypot(mx, my);
  if (INPUT.aimV) { const al = Math.hypot(INPUT.aimV.x, INPUT.aimV.y); p.aimX = INPUT.aimV.x / al; p.aimY = INPUT.aimV.y / al; }
  else if (ml > 0.2) { p.aimX = mx / ml; p.aimY = my / ml; }
  else if (INPUT.touchMode) {
    const e = nearestEnemy(p.x, p.y, 380);
    if (e) { const a = Math.atan2(e.y - p.y, e.x - p.x); p.aimX = Math.cos(a); p.aimY = Math.sin(a); }
  }
  if (p.dashT > 0) {
    p.dashT -= dt;
    p.vx = p.dx * 1300; p.vy = p.dy * 1300;
    spawnP({ x: p.x + rand(-6, 6), y: p.y + rand(-6, 10), life: 0.35, size: 6, color: '#8fa2ff' });
  } else {
    const sp = W.ps.speed * (p.chill > 0 ? 0.65 : 1) * (buffOn('haste') ? 1.3 : 1);
    const a = Math.min(1, dt * 14);
    p.vx += (mx * sp - p.vx) * a; p.vy += (my * sp - p.vy) * a;
  }
  p.x = clamp(p.x + p.vx * dt, -BOUND + p.r, BOUND - p.r);
  p.y = clamp(p.y + p.vy * dt, -BOUND + p.r, BOUND - p.r);
  if (Math.abs(p.vx) > 10) p.face = p.vx > 0 ? 1 : -1;
  if (Math.hypot(p.vx, p.vy) > 20) p.walkT += dt;
  p.mp = Math.min(p.maxMp, p.mp + W.ps.regen * (W.curses.has('drain') ? 0.6 : 1) * (buffOn('wisdom') ? 3 : 1) * dt);
  if (rv('regen') + eqv('regen')) healPlayer((rv('regen') + eqv('regen')) * dt, true);
  if (rv('halo')) { W.haloT -= dt; if (W.haloT <= 0) { W.haloT = 8; p.shield = Math.max(p.shield, p.maxHp * rv('halo')); ring(p.x, p.y, '#fff2a8', 10, 40, 0.5, 3); } }
  p.atkT -= dt;
  if (p.atkT <= 0) {
    const e = nearestEnemy(p.x, p.y, 430);
    if (e) {
      p.atkT = W.ps.throwCd;
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      const pierce = bs('sharp_stones') ? 1 : 0;
      W.projs.push({ x: p.x, y: p.y - 6, vx: Math.cos(a) * 580, vy: Math.sin(a) * 580, r: 4.5, dmg: W.ps.stone, team: 'ally', life: 1, color: rv('stoneSlow') ? '#bfefff' : '#b9b4ff', kind: 'stone', src: null, pierce, hit: pierce ? new Set() : null, slow: rv('stoneSlow') || 0 });
      SFX.throw_();
    } else p.atkT = 0.15;
  }
}
function playerDie() {
  const p = W.player;
  p.dead = true;
  SAVE.stats.deaths++;
  burst(p.x, p.y, '#8fa2ff', 60, 300, 1.2, 7);
  ring(p.x, p.y, '#ff4d6d', 10, 160, 0.8, 4);
  W.endT = 2.4;
  banner(W.isTower ? 'RUN OVER' : 'DEFEATED', 'defeat');
  SFX.defeat();
  MUSIC.stop();
}
function bossDefeated(e) {
  SFX.boom(true);
  W.shake = 22;
  W.timeScale = 0.25;
  for (let i = 0; i < 6; i++) setTimeout(() => { if (W.boss === e || W.won) { burst(e.x + rand(-60, 60), e.y + rand(-60, 60), i % 2 ? '#ffd34a' : e.col, 40, 420, 1, 7); ring(e.x, e.y, '#ffd34a', 10, 200 + i * 40, 0.7, 4); } }, i * 180);
  hideBossBar();
  if (W.isTower) { floorCleared(); return; }
  if (W.isRush) { rushNext(); return; }
  if (W.isRaid) { W.won = true; W.endT = 3.4; banner('NYX FALLS!', 'victory'); SFX.victory(); for (const o of W.enemies) if (!o.dead && o !== e) o.dead = true; return; }
  W.won = true;
  W.endT = 3.4;
  SFX.victory();
  banner('VICTORY', 'victory');
  for (const o of W.enemies) if (!o.dead && o !== e) { o.dead = true; burst(o.x, o.y, o.col, 8, 140, 0.5, 4); }
  for (const k of W.pickups) k.mag = true;
  W.projs = W.projs.filter(q => q.team === 'ally');
  W.tele.length = 0;
  MUSIC.play('menu');
}

// ---------------- summoning + skills ----------------
function trySummon(slot) {
  if (!W.active || W.player.dead || W.won || W.choosing) return;
  const id = SAVE.hotbar[slot];
  if (!id) return;
  const c = CARDS[id], p = W.player;
  if (W.slotCd[slot] > 0) { SFX.fail(); return; }
  if (p.mp < c.cost) { toast('Not enough mana', 'fail'); SFX.fail(); flashSlot(slot); return; }
  const count = (c.count || 1) + (c.count > 1 ? Math.round(rv('swarmExtra')) : 0);
  const w = (c.weight ?? 1) * (c.count || 1);
  if (capUsed() + w > capacity() + 0.01) { toast(`Grimoire capacity full. ${INPUT.touchMode ? 'Tap ↺' : 'Press ' + key1('recall')} to recall`, 'fail'); SFX.fail(); flashSlot(slot); return; }
  p.mp -= c.cost;
  W.slotCd[slot] = c.cd * W.ps.cdMult;
  W.cardsUsed.add(id);
  SAVE.counters.summoned[id] = (SAVE.counters.summoned[id] || 0) + (c.count || 1);
  const pt = summonPoint();
  const rk = RANK_BY_ID[c.rank], ri = Math.max(0, RANKS.indexOf(rk));
  magicCircle(pt.x, pt.y, circleColor(rk.color), 30 + c.r * 1.6 + (c.count > 1 ? 10 : 0));
  for (let i = 0; i < count; i++) {
    const s = makeSummon(id, pt.x + (count > 1 ? rand(-16, 16) : 0), pt.y + (count > 1 ? rand(-16, 16) : 0));
    if (i >= (c.count || 1)) s.c = Object.assign({}, c, { weight: 0 });   // relic bonus units don't use capacity
    W.summons.push(s);
  }
  burst(pt.x, pt.y, rk.color, 26, 240, 0.7, 5);
  for (let i = 0; i < 14; i++) spawnP({ x: pt.x + rand(-25, 25), y: pt.y + rand(-10, 10), vx: 0, vy: rand(-180, -60), life: rand(0.4, 0.8), size: 3, color: '#ffffff', kind: 'spark', drag: 1 });
  txt(pt.x, pt.y - 34, c.name, rk.color, 13, 0.9);
  panAt(pt.x);
  SFX.summon(c.fusion ? 8 : ri);
  voiceCard(id);
}
function makeSummon(id, x, y) {
  const c = CARDS[id], cs = SAVE.cards[id], tg = c.tags, awk = !!SAVE.awakened[id];
  const sm_ = synMods(c);
  const m = CARD_PROG.mult(cs.lv, cs.enh) * W.ps.sumMult * (awk ? 1.5 : 1);
  let hpM = 1 + rv('god'), auraM = 1, healM = 1, shieldM = 1, atkM = 1;
  if (tg.includes('beast')) atkM *= 1 + rv('beastSpd');
  if (tg.includes('beast')) hpM *= 1 + 0.4 * bs('pack');
  if (tg.includes('stone')) hpM *= 1 + 0.5 * bs('bedrock');
  if (tg.includes('grass')) { auraM *= 1 + 0.3 * bs('bloom'); healM *= 1 + 0.4 * bs('bloom'); }
  if (tg.includes('fish')) { auraM *= 1 + 0.3 * bs('tide'); shieldM *= 1 + 0.5 * bs('tide'); }
  if (tg.includes('spirit')) atkM *= 1 + 0.3 * bs('spirit_surge');
  return {
    id, c, col: c.color, m, x, y, vx: 0, vy: 0, r: c.r, awk,
    hp: c.hp * m * hpM * sm_.hp, maxHp: c.hp * m * hpM * sm_.hp, dmg: (c.dmg || 0) * m * sm_.dmg, heal: (c.heal || 0) * m * healM * sm_.heal,
    shieldAmt: (c.shield || 0) * m * shieldM * sm_.shield, bite: (c.bite || 0) * m * sm_.dmg,
    aura: (c.aura || 0) * auraM * (c.ai === 'taunt' ? sm_.aura : 1), healAura: (c.healAura || 0) * auraM, slam: (c.slam || 0) * (1 + 0.3 * (tg.includes('stone') ? bs('bedrock') : 0)),
    atkCd: (c.atkCd || 1) / atkM,
    atkT: 0.2, rtT: 0, target: null, life: (c.life || 0) * sm_.life, maxLife: (c.life || 0) * sm_.life, spawnT: 0, face: 1, ang: rand(TAU),
    state: '', st: 0.5, st2: 1, orbitA: rand(TAU), orbitR: rand(55, 105), shield: 0, buffT: 0, flash: 0, lunge: 0, fortT: 0,
    chargeCd: 0, breathCd: 0.5, trail: c.ai === 'dragon' ? [{ x, y }] : null, seed: rand(100), t: rand(10), dead: false,
  };
}
function useSkill(code) {
  if (!W.active || W.player.dead || W.won || W.choosing) return;
  const p = W.player, sk = SKILLS.find(s => s.key === code);
  if (!sk) return;
  if (p.cds[code] > 0) { SFX.fail(); return; }
  if (p.mp < sk.mp) { toast('Not enough mana', 'fail'); SFX.fail(); return; }
  if (code === 'Space') {
    let dx = p.mvx, dy = p.mvy;
    if (!dx && !dy) { const m = mouseWorld(); const a = Math.atan2(m.y - p.y, m.x - p.x); dx = Math.cos(a); dy = Math.sin(a); }
    const l = Math.hypot(dx, dy) || 1;
    p.dx = dx / l; p.dy = dy / l; p.dashT = 0.14; p.inv = Math.max(p.inv, 0.32);
    W.dashes++;
    SFX.whoosh();
    tutEvent('dash');
  } else if (code === 'KeyQ') {
    if (!W.summons.length) { toast('No summons to enhance', 'fail'); SFX.fail(); return; }
    p.enhT = 6 + rv('enhLong');
    for (const s of W.summons) { ring(s.x, s.y, '#ffd34a', 6, 40, 0.5, 3); burst(s.x, s.y, '#ffd34a', 8, 140, 0.5, 4); }
    ring(p.x, p.y, '#ffd34a', 10, 180, 0.6, 4);
    toast('Enhance! Summons empowered', 'card');
    SFX.enhance();
  } else if (code === 'KeyE') {
    const m = mouseWorld();
    let best = null, bd = Infinity;
    for (const s of W.summons) { const d = dist2(s, m); if (d < bd) { bd = d; best = s; } }
    if (!best) { toast('No summon to swap with', 'fail'); SFX.fail(); return; }
    const ox = p.x, oy = p.y;
    burst(ox, oy, '#8fa2ff', 24, 220, 0.6, 5); burst(best.x, best.y, best.col, 24, 220, 0.6, 5);
    p.x = best.x; p.y = best.y; best.x = ox; best.y = oy;
    if (best.trail) best.trail = [{ x: ox, y: oy }];
    p.inv = Math.max(p.inv, 0.4);
    ring(p.x, p.y, '#8fa2ff', 6, 60, 0.4, 3);
    SFX.swap();
  } else if (code === 'KeyR') {
    const mine = W.summons.filter(s => !s.c.comp);
    if (!mine.length) { SFX.fail(); return; }
    let refund = 0;
    for (const s of mine) {
      refund += s.c.cost * 0.4 * clamp(s.hp / s.maxHp, 0, 1) * (s.c.count ? 1 / s.c.count : 1) * (s.maxLife ? s.life / s.maxLife : 1);
      dismissSummon(s, true);
    }
    W.summons = W.summons.filter(s => s.c.comp);
    p.mp = Math.min(p.maxMp, p.mp + refund);
    txt(p.x, p.y - 30, '+' + Math.round(refund) + ' MP', '#7fb8ff', 14);
    SFX.swap();
  }
  p.mp -= sk.mp;
  p.cds[code] = code === 'Space' ? W.ps.dashCd : sk.cd;
}

// ---------------- summon AI ----------------
function steerTo(s, tx, ty, speed, dt, arrive = 0) {
  const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
  let vx = 0, vy = 0;
  if (d > arrive) { const f = d < arrive + 40 ? (d - arrive) / 40 : 1; vx = (dx / d) * speed * f; vy = (dy / d) * speed * f; }
  const a = Math.min(1, dt * 7);
  s.vx += (vx - s.vx) * a; s.vy += (vy - s.vy) * a;
}
function sMult(s) {
  const tg = s.c.tags;
  let m = (1 + eqv('sumDmg')) * (W.odT > 0 ? 1.5 : 1) * (buffOn('fury') ? 1.5 : 1) * (s.buffT > 0 ? 1 + s.buffAmt : 1) * (W.player.enhT > 0 ? 1.5 : 1) * (W.howlT > 0 ? 1.4 : 1) * (1 + 0.2 * bs('bloodlust')) * (1 + rv('sumDmg')) * (1 + rv('god'));
  if (tg.includes('insect')) m *= 1 + 0.4 * bs('swarm');
  if (tg.includes('beast')) m *= 1 + 0.4 * bs('pack');
  if (tg.includes('dragon')) m *= 1 + 0.5 * bs('dragonfire');
  return m;
}
function findSummonTarget(s) {
  const p = W.player, range = s.c.ai === 'ranged' ? s.c.range + 120 : s.c.ai === 'flier' ? 520 : s.c.ai === 'dragon' ? 420 : 360;
  return nearestEnemy(s.x, s.y, range, e => dist2(e, p) < 560 * 560);
}
function idleOrbit(s, dt, R, spdK = 0.8) {
  const p = W.player;
  s.orbitA += dt * 0.35;
  steerTo(s, p.x + Math.cos(s.orbitA) * (R || s.orbitR), p.y + Math.sin(s.orbitA) * (R || s.orbitR) * 0.8, (s.c.speed || 150) * spdK, dt, 6);
}
function lineHits(s, dmgMul, knock, stunT) {
  enemiesNear(s.x, s.y, s.r + 20, e => {
    if (e.dead || s.hitSet.has(e)) return;
    if (dist2(e, s) < (e.r + s.r + 6) ** 2) {
      s.hitSet.add(e);
      damageEnemy(e, s.dmg * dmgMul * sMult(s), s);
      burst(e.x, e.y, s.col, 5, 160, 0.3, 3, 'spark');
      if (e.dead) return;
      if (s.c.poison) { e.poisonT = 3; e.poisonD = Math.max(e.poisonD, s.c.poison * s.m); e.poisonSrc = s; }
      if (stunT) stun(e, stunT);
      if (knock && !e.isBoss) { e.kx += s.cdx * knock; e.ky += s.cdy * knock; }
    }
  });
}
function healPulse(s, R, amt) {
  const p = W.player, R2 = R * R, h = amt * (p.enhT > 0 ? 1.5 : 1);
  let any = false;
  if (!p.dead && dist2(p, s) < R2 && p.hp < p.maxHp && healPlayer(h) > 0) {
    any = true;
    burst(p.x, p.y, '#5dff9a', 5, 60, 0.6, 4, 'glow', { grav: -80 });
  }
  for (const o of W.summons) if (o !== s && !o.dead && !o.down && o.hp < o.maxHp && dist2(o, s) < R2) {
    o.hp = Math.min(o.maxHp, o.hp + h); any = true;
    spawnP({ x: o.x, y: o.y, vy: -60, life: 0.6, size: 4, color: '#5dff9a' });
  }
  ring(s.x, s.y, '#4dffa6', 10, R, 0.8, 2);
  if (any) SFX.heal();
}

function updateSummon(s, dt) {
  const p = W.player, c = s.c, enh = p.enhT > 0;
  const spdMul = enh ? 1.3 : 1, atkMul = enh ? 1.3 : 1;
  s.t += dt;
  if (s.spawnT < 1) s.spawnT = Math.min(1, s.spawnT + dt * 3);
  if (s.down) {
    s.downT -= dt;
    if (s.downT <= 0) { s.down = false; s.hp = s.maxHp * 0.6; ring(s.x, s.y, s.col, 6, 60, 0.5, 3); txt(s.x, s.y - 30, s.c.name + ' is back!', s.col, 14); }
    return;
  }
  s.atkT -= dt; s.flash -= dt; s.lunge = Math.max(0, s.lunge - dt);
  s.buffT = Math.max(0, s.buffT - dt);
  if (s.fortT > 0) s.fortT -= dt;
  if (s.maxLife > 0) { s.life -= dt; if (s.life <= 0) { dismissSummon(s); return; } }
  const dp = Math.hypot(p.x - s.x, p.y - s.y);
  s.rtT -= dt;
  if (s.rtT <= 0 || (s.target && s.target.dead)) { s.rtT = 0.3; s.target = findSummonTarget(s); }
  const tg = s.target && !s.target.dead ? s.target : null;
  const leash = !c.stationary && dp > 700 && s.state !== 'dive' && s.state !== 'charge';

  if (leash) {
    steerTo(s, p.x, p.y, (c.speed || 200) * 1.8, dt, 40);
  } else switch (c.ai) {
    case 'melee': case 'charger': {
      if (s.state === 'charge') {
        s.st -= dt;
        s.vx = s.cdx * (s.rampage ? 760 : 640); s.vy = s.cdy * (s.rampage ? 760 : 640);
        lineHits(s, s.rampage ? 3 : 1.6, c.knock, s.rampage ? 1 : c.stunHit);
        if (Math.random() < 0.6) spawnP({ x: s.x, y: s.y + 8, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.4, size: 9, color: '#55402a', kind: 'smoke' });
        if (s.rampage) spawnP({ x: s.x, y: s.y, life: 0.3, size: 8, color: '#ff8a3d' });
        if (s.st <= 0) { s.state = ''; s.chargeCd = 3; s.rampage = false; }
        break;
      }
      s.chargeCd -= dt;
      if (tg) {
        const d = dist(s, tg);
        if (c.ai === 'charger' && s.chargeCd <= 0 && d > 90 && d < 330) {
          s.state = 'charge'; s.st = 0.5;
          const a = angTo(s, tg); s.cdx = Math.cos(a); s.cdy = Math.sin(a); s.hitSet = new Set();
          SFX.whoosh();
        } else {
          steerTo(s, tg.x, tg.y, c.speed * spdMul, dt, s.r + tg.r - 4);
          if (d <= s.r + tg.r + 8 && s.atkT <= 0) {
            s.atkT = s.atkCd / atkMul; s.lunge = 0.12;
            s.face = tg.x > s.x ? 1 : -1;
            damageEnemy(tg, s.dmg * sMult(s), s);
            burst((s.x + tg.x) / 2, (s.y + tg.y) / 2, s.col, 3, 120, 0.25, 3, 'spark');
            if (c.poison && !tg.dead) { tg.poisonT = 3; tg.poisonD = Math.max(tg.poisonD, c.poison * s.m); tg.poisonSrc = s; }
            if (c.slowHit && !tg.dead) { tg.slowF = Math.max(tg.slowT > 0 ? tg.slowF : 0, c.slowHit * (tg.isBoss ? 0.4 : 1)); tg.slowT = Math.max(tg.slowT, 1.2); }
          }
        }
      } else idleOrbit(s, dt);
      break;
    }
    case 'flier': {
      if (s.state === 'dive') {
        s.st -= dt;
        s.vx = s.cdx * c.speed * spdMul; s.vy = s.cdy * c.speed * spdMul;
        lineHits(s, 1, c.stunDive ? 260 : 0, c.stunDive);
        spawnP({ x: s.x, y: s.y, life: 0.25, size: 4, color: c.stunDive ? '#fff6a8' : '#bff0ff' });
        if (s.st <= 0) { s.state = ''; s.atkT = 0.55 / atkMul * Math.pow(0.5, bs('sky')) * (syn('bird') && c.tags.includes('bird') ? 0.7 : 1); }
      } else {
        s.orbitA += dt * 2.2;
        steerTo(s, p.x + Math.cos(s.orbitA) * 120, p.y + Math.sin(s.orbitA) * 95, 360 * spdMul, dt);
        if (tg && s.atkT <= 0) {
          const a = angTo(s, tg), d = dist(s, tg);
          s.state = 'dive'; s.cdx = Math.cos(a); s.cdy = Math.sin(a);
          s.st = (d + 140) / (c.speed * spdMul); s.hitSet = new Set();
          SFX.whoosh();
        }
      }
      break;
    }
    case 'heal': {
      s.st -= dt;
      if (s.st <= 0) { s.st = 1; healPulse(s, s.aura, s.heal); }
      break;
    }
    case 'thorns': {
      s.st -= dt;
      if (s.st <= 0) {
        s.st = 0.5;
        const R2 = s.aura * s.aura;
        enemiesNear(s.x, s.y, s.aura, e => {
          if (dist2(e, s) > R2) return;
          damageEnemy(e, s.dmg * sMult(s), s, { quiet: true, color: '#9dffb0' });
          if (!e.dead && c.poison) { e.poisonT = 3; e.poisonD = Math.max(e.poisonD, c.poison * s.m); e.poisonSrc = s; }
          if (!e.dead) { e.slowF = Math.max(e.slowT > 0 ? e.slowF : 0, c.slow * (e.isBoss ? 0.4 : 1)); e.slowT = Math.max(e.slowT, 0.7); }
          if (Math.random() < 0.4) spawnP({ x: e.x, y: e.y, vy: -40, life: 0.4, size: 3, color: '#37e07a', kind: 'spark' });
        });
      }
      break;
    }
    case 'taunt': {
      if (c.heal) { s.st -= dt; if (s.st <= 0) { s.st = 1; healPulse(s, s.healAura, s.heal); } }
      if (s.atkT <= 0) {
        let any = false;
        const R2 = s.slam * s.slam;
        enemiesNear(s.x, s.y, s.slam, e => { if (dist2(e, s) < R2) any = true; });
        if (any) {
          s.atkT = s.atkCd / atkMul; s.lunge = 0.25;
          enemiesNear(s.x, s.y, s.slam, e => {
            if (dist2(e, s) > R2) return;
            damageEnemy(e, s.dmg * sMult(s), s, { quiet: true });
            if (!e.dead && !e.isBoss) { const a = angTo(s, e); e.kx += Math.cos(a) * 260; e.ky += Math.sin(a) * 260; }
          });
          ring(s.x, s.y + 10, '#ffcf5a', 10, s.slam, 0.4, 4);
          burst(s.x, s.y + 12, '#a68c5c', 14, 200, 0.5, 5);
          W.shake = Math.max(W.shake, 3);
          SFX.slam();
        }
      }
      break;
    }
    case 'buffer': {
      s.orbitA += dt * 1.4;
      steerTo(s, p.x + Math.cos(s.orbitA) * 75, p.y + Math.sin(s.orbitA) * 60, c.speed, dt, 4);
      s.st -= dt;
      if (s.st <= 0) {
        s.st = 4;
        const R2 = s.aura * s.aura;
        if (!p.dead && dist2(p, s) < R2) p.shield = Math.max(p.shield, s.shieldAmt);
        for (const o of W.summons) if (!o.dead && dist2(o, s) < R2) o.shield = Math.max(o.shield, s.shieldAmt);
        ring(s.x, s.y, '#5ab8ff', 10, s.aura, 0.9, 3);
        for (let i = 0; i < 10; i++) spawnP({ x: s.x + rand(-30, 30), y: s.y + rand(-20, 20), vy: rand(-80, -30), life: rand(0.5, 1), size: 3, color: '#bfe6ff' });
        SFX.bubble();
      }
      if (c.nova) {
        s.st2 -= dt;
        if (s.st2 <= 0) {
          s.st2 = 3;
          const R2 = c.nova * c.nova;
          enemiesNear(s.x, s.y, c.nova, e => {
            if (dist2(e, s) > R2) return;
            damageEnemy(e, s.dmg * sMult(s), s, { quiet: true, color: '#bff6ff' });
            if (!e.dead) { e.slowF = Math.max(e.slowT > 0 ? e.slowF : 0, 0.6 * (e.isBoss ? 0.4 : 1)); e.slowT = Math.max(e.slowT, 2); }
          });
          ring(s.x, s.y, '#bff6ff', 10, c.nova, 0.6, 4);
        }
      }
      break;
    }
    case 'priest': {
      s.orbitA += dt * 1.1;
      steerTo(s, p.x + Math.cos(s.orbitA) * 55, p.y + Math.sin(s.orbitA) * 45, c.speed, dt, 6);
      s.st -= dt;
      if (s.st <= 0) {
        s.st = 1.5;
        const allies = [p, ...W.summons].filter(a => !a.dead && !a.down && a.hp < a.maxHp && dist2(a, s) < 300 * 300);
        allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
        const tgt = allies[0];
        if (tgt) {
          if (tgt === p) healPlayer(s.heal * 2);
          else tgt.hp = Math.min(tgt.maxHp, tgt.hp + s.heal * 2);
          burst(tgt.x, tgt.y, '#fff2a8', 10, 90, 0.6, 4, 'glow', { grav: -80 });
          W.beams.push({ x1: s.x, y1: s.y, x2: tgt.x, y2: tgt.y, w: 3, t: 0, dur: 0.3, color: '#fff2a8' });
        }
      }
      s.st2 -= dt;
      if (s.st2 <= 0) {
        s.st2 = 8;
        if (!p.dead) p.shield = Math.max(p.shield, s.shieldAmt);
        for (const o of W.summons) if (!o.dead && dist2(o, s) < 250 * 250) o.shield = Math.max(o.shield, s.shieldAmt);
        ring(s.x, s.y, '#fff2a8', 10, 250, 0.8, 3);
        SFX.heal();
      }
      break;
    }
    case 'archon': {
      if (s.atkT <= 0) {
        const first = nearestEnemy(s.x, s.y, c.range);
        if (first) { s.atkT = s.atkCd / atkMul; archonStrike(s, first, c.chain, s.dmg * sMult(s)); }
      }
      break;
    }
    case 'ranged': {
      if (c.heal) { s.st -= dt; if (s.st <= 0) { s.st = 1; healPulse(s, s.healAura, s.heal); } }
      if (tg) {
        const d = dist(s, tg), R = c.range;
        const a = angTo(tg, p);
        steerTo(s, tg.x + Math.cos(a) * R * 0.72, tg.y + Math.sin(a) * R * 0.72, c.speed * spdMul, dt, 12);
        s.face = tg.x > s.x ? 1 : -1;
        if (d <= R && s.atkT <= 0) {
          s.atkT = s.atkCd / atkMul;
          const sa = angTo(s, tg);
          if (c.splash) {
            W.projs.push({ x: s.x, y: s.y, vx: Math.cos(sa) * c.projSpeed, vy: Math.sin(sa) * c.projSpeed, r: c.revive ? 10 : 8, dmg: s.dmg * sMult(s), team: 'ally', life: 1.4, color: c.color, kind: 'arcane', splash: c.splash, src: s });
          } else {
            W.projs.push({ x: s.x, y: s.y, vx: Math.cos(sa) * c.projSpeed, vy: Math.sin(sa) * c.projSpeed, r: c.lance ? 7 : 5, dmg: s.dmg * sMult(s), team: 'ally', life: 1.1, color: c.color, kind: c.lance ? 'lance' : c.comp ? 'arrow2' : 'ice', pierce: (c.pierce || 0) + (c.pierce ? Math.round(rv('pierce')) : 0) + (c.pierce && syn('spirit') && c.tags.includes('spirit') ? 1 : 0), slow: c.slow, hit: new Set(), src: s });
          }
          SFX.shoot();
        }
      } else idleOrbit(s, dt, 70);
      break;
    }
    case 'dragon': {
      if (s.state === 'breath') {
        s.st -= dt;
        if (tg) s.ba = lerpAng(s.ba, angTo(s, tg), dt * 3);
        s.ang = s.ba;
        s.vx *= 0.9; s.vy *= 0.9;
        s.tk -= dt;
        if (s.tk <= 0) {
          s.tk = 0.12;
          const R2 = c.range * c.range;
          enemiesNear(s.x, s.y, c.range, e => {
            const d2 = dist2(e, s); if (d2 > R2) return;
            if (Math.abs(angDiff(s.ba, angTo(s, e))) < 0.5 + e.r / Math.sqrt(d2 + 1)) {
              damageEnemy(e, s.dmg * sMult(s), s, { quiet: true, color: '#ffb347' });
              if (!e.dead && c.breath === 'frost') { e.slowF = Math.max(e.slowT > 0 ? e.slowF : 0, 0.6 * (e.isBoss ? 0.4 : 1)); e.slowT = Math.max(e.slowT, 1); }
              if (!e.dead && c.breath === 'venom') { e.poisonT = 3; e.poisonD = Math.max(e.poisonD, s.dmg * 2); e.poisonSrc = s; }
            }
          });
        }
        for (let i = 0; i < 4; i++) {
          const a = s.ba + rand(-0.45, 0.45), sp = rand(250, 480);
          spawnP({ x: s.x + Math.cos(s.ba) * 16, y: s.y + Math.sin(s.ba) * 16, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.35, 0.55), size: rand(6, 11), color: c.breath === 'frost' ? (Math.random() < 0.5 ? '#9fe8ff' : '#ffffff') : c.breath === 'venom' ? (Math.random() < 0.5 ? '#9dff3a' : '#c78bff') : (Math.random() < 0.5 ? '#ff7a2e' : '#ffcf5a'), drag: 1.5 });
        }
        if (s.st <= 0) { s.state = ''; s.breathCd = 3.2 * (syn('dragon') ? 0.75 : 1); }
      } else {
        s.breathCd -= dt;
        if (tg) {
          const d = dist(s, tg), a = angTo(tg, s);
          steerTo(s, tg.x + Math.cos(a) * 140, tg.y + Math.sin(a) * 140, c.speed * spdMul, dt, 8);
          if (d < c.range && s.breathCd <= 0) { s.state = 'breath'; s.st = 1.3; s.tk = 0; s.ba = angTo(s, tg); SFX.breath(); }
          if (d < s.r + tg.r + 14 && s.atkT <= 0) {
            s.atkT = s.atkCd / atkMul;
            damageEnemy(tg, s.bite * sMult(s), s);
            burst(tg.x, tg.y, '#ff5a3c', 10, 200, 0.4, 5, 'spark');
          }
        } else idleOrbit(s, dt, 130);
      }
      break;
    }
  }
  if (!c.stationary) {
    s.x = clamp(s.x + s.vx * dt, -BOUND, BOUND);
    s.y = clamp(s.y + s.vy * dt, -BOUND, BOUND);
    if (Math.abs(s.vx) > 8 && c.ai !== 'ranged') s.face = s.vx > 0 ? 1 : -1;
    if (s.state !== 'breath' && (Math.abs(s.vx) + Math.abs(s.vy)) > 10) s.ang = lerpAng(s.ang, Math.atan2(s.vy, s.vx), dt * 10);
  }
  if (s.trail) {
    const h = s.trail[0];
    if (!h || Math.hypot(h.x - s.x, h.y - s.y) > 7) { s.trail.unshift({ x: s.x, y: s.y }); if (s.trail.length > 11) s.trail.pop(); }
  }
}

function updateSummons(dt) {
  for (const s of W.summons) s.nb = 0;
  for (const s of W.summons) {
    if (s.dead || s.c.ai !== 'buffer') continue;
    const R2 = s.aura * s.aura;
    for (const o of W.summons) if (o !== s && dist2(o, s) < R2) o.nb = Math.max(o.nb, s.c.buff);
  }
  for (const s of W.summons) if (s.nb > 0) { s.buffT = 0.3; s.buffAmt = s.nb; }
  for (const s of W.summons) if (!s.dead) updateSummon(s, Math.min(dt, 0.05));
  W.summons = W.summons.filter(s => !s.dead);
}

// ---------------- enemy AI ----------------
function chooseTarget(e) {
  const p = W.player;
  let best = p.dead ? null : p, bd = p.dead ? Infinity : dist2(e, p);
  for (const s of W.summons) {
    if (s.dead || s.down || s.c.ai === 'flier') continue;
    const d = dist2(e, s);
    if (s.c.ai === 'taunt') { const tr = s.aura * (s.fortT > 0 ? 1.6 : 1); if (d < tr * tr) return s; }
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}
function enemyShoot(e, ang, opts = {}) {
  const sp = opts.speed || e.d.projSpeed;
  W.projs.push({
    x: e.x, y: e.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: opts.r || 6,
    dmg: opts.dmg || e.dmg, team: 'enemy', life: opts.life || 3.2, color: opts.color || e.d.pcolor,
    kind: e.d.bow ? 'arrow' : 'orb', chill: e.d.chill,
  });
}
function updateEnemy(e, dt) {
  if (e.spawnT < 1) e.spawnT = Math.min(1, e.spawnT + dt * 3);
  e.flash -= dt; e.atkT -= dt; e.lunge = Math.max(0, e.lunge - dt);
  if (e.slowT > 0) e.slowT -= dt;
  if (e.markT > 0) e.markT -= dt;
  if (e.poisonT > 0) {
    e.poisonT -= dt; e.poisonTick -= dt;
    if (e.poisonTick <= 0) {
      e.poisonTick = 0.5;
      damageEnemy(e, e.poisonD * 0.5, e.poisonSrc, { quiet: true, color: '#d6ff4a' });
      spawnP({ x: e.x + rand(-6, 6), y: e.y, vy: -40, life: 0.5, size: 3, color: '#b6ff3c' });
      if (e.dead) return;
    }
  }
  e.kx -= e.kx * Math.min(1, dt * 7); e.ky -= e.ky * Math.min(1, dt * 7);
  if (e.stunT > 0) {
    e.stunT -= dt;
    e.vx *= 0.8; e.vy *= 0.8;
    if (!e.isBoss) { e.x = clamp(e.x + e.kx * dt, -BOUND, BOUND); e.y = clamp(e.y + e.ky * dt, -BOUND, BOUND); }
    if (e.state === 'dash') e.state = '';
    return;
  }
  if (e.isBoss) { updateBoss(e, dt); return; }
  e.rtT -= dt;
  if (e.rtT <= 0 || !e.target || e.target.dead) { e.target = chooseTarget(e); e.rtT = rand(0.35, 0.6); }
  const t = e.target;
  if (!t) { e.x += e.kx * dt; e.y += e.ky * dt; return; }
  const dx = t.x - e.x, dy = t.y - e.y, d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d;
  let sp = e.speed * (e.slowT > 0 ? 1 - e.slowF : 1);
  let mvx = 0, mvy = 0;
  const D = e.d;
  if (e.shieldMax > 0 && e.shield < e.shieldMax && W.t - e.lastHit > 3) e.shield = Math.min(e.shieldMax, e.shield + e.shieldMax * 0.25 * dt);
  switch (D.ai) {
    case 'blinker': {
      e.blinkCd -= dt;
      if (e.blinkCd <= 0 && d > 110 && e.spawnT >= 1) {
        e.blinkCd = rand(3, 5);
        burst(e.x, e.y, e.col, 14, 160, 0.4, 4);
        const a = rand(TAU), off = D.ranged ? 210 : t.r + e.r + 6;
        e.x = clamp(t.x + Math.cos(a) * off, -BOUND, BOUND); e.y = clamp(t.y + Math.sin(a) * off, -BOUND, BOUND);
        burst(e.x, e.y, e.col, 14, 160, 0.4, 4); ring(e.x, e.y, e.col, 4, 40, 0.3, 2);
        e.atkT = Math.min(e.atkT, 0.35);
      }
      if (D.ranged) {
        if (d < D.range * 0.5) { mvx = -nx; mvy = -ny; } else if (d > D.range * 0.9) { mvx = nx; mvy = ny; }
        if (d < D.range && e.atkT <= 0 && e.spawnT >= 1) { e.atkT = D.atkCd * rand(0.85, 1.15); enemyShoot(e, Math.atan2(dy, dx)); }
      } else { mvx = nx; mvy = ny; }
      break;
    }
    case 'healer': {
      if (d > D.range * 0.9) { mvx = nx; mvy = ny; } else if (d < D.range * 0.5) { mvx = -nx; mvy = -ny; }
      if (e.atkT <= 0 && e.spawnT >= 1) {
        e.atkT = D.atkCd;
        let healed = 0;
        enemiesNear(e.x, e.y, 200, o => {
          if (o.dead || o === e || dist2(o, e) > 200 * 200 || o.hp >= o.maxHp) return;
          o.hp = Math.min(o.maxHp, o.hp + o.maxHp * (o.isBoss ? 0.015 : 0.15)); healed++;
          spawnP({ x: o.x, y: o.y, vy: -60, life: 0.6, size: 5, color: '#9dff7a' });
        });
        if (healed) ring(e.x, e.y, '#9dff7a', 10, 200, 0.6, 3);
      }
      break;
    }
    case 'turret': {
      if (e.atkT <= 0 && d < 480 && e.spawnT >= 1) {
        e.atkT = D.atkCd * rand(0.9, 1.1);
        const off = rand(TAU);
        for (let i = 0; i < 8; i++) enemyShoot(e, off + (i / 8) * TAU, { r: 7 });
        ring(e.x, e.y, e.col, 6, 40, 0.3, 2);
      }
      break;
    }
    case 'flee': {
      const pp = W.player, fx = e.x - pp.x, fy = e.y - pp.y, fd = Math.hypot(fx, fy) || 1, w = Math.sin(W.t * 2 + e.seed) * 0.6;
      mvx = fx / fd - fy / fd * w; mvy = fy / fd + fx / fd * w;
      if (Math.abs(e.x) > BOUND - 120) mvx = -Math.sign(e.x);
      if (Math.abs(e.y) > BOUND - 120) mvy = -Math.sign(e.y);
      if (Math.random() < 0.3) spawnP({ x: e.x, y: e.y, vy: -30, life: 0.5, size: 3, color: '#ffd34a' });
      break;
    }
    case 'chase': mvx = nx; mvy = ny; break;
    case 'erratic': { const w = Math.sin(W.t * 6 + e.seed) * 0.9; mvx = nx - ny * w; mvy = ny + nx * w; break; }
    case 'ranged': {
      if (d > D.range * 0.85) { mvx = nx; mvy = ny; }
      else if (d < D.range * 0.45) { mvx = -nx; mvy = -ny; }
      else { const s = e.seed > 50 ? 1 : -1; mvx = -ny * s * 0.5; mvy = nx * s * 0.5; }
      if (d < D.range && e.atkT <= 0 && e.spawnT >= 1) {
        e.atkT = D.atkCd * rand(0.85, 1.15);
        const a0 = Math.atan2(dy, dx), n = D.spread || 1;
        for (let i = 0; i < n; i++) enemyShoot(e, a0 + (i - (n - 1) / 2) * 0.22);
      }
      break;
    }
    case 'charger': {
      if (e.state === 'wind') { e.st -= dt; if (e.st <= 0) { e.state = 'dash'; e.st = 0.45; } }
      else if (e.state === 'dash') {
        e.st -= dt;
        e.vx = e.cdx * sp * 4.2; e.vy = e.cdy * sp * 4.2;
        if (Math.random() < 0.5) spawnP({ x: e.x, y: e.y + 6, life: 0.4, size: 8, color: '#30202a', kind: 'smoke' });
        if (e.st <= 0) { e.state = ''; e.chargeCd = rand(2.5, 4); }
      } else {
        mvx = nx; mvy = ny;
        e.chargeCd -= dt;
        if (d < 280 && d > 60 && e.chargeCd <= 0) { e.state = 'wind'; e.st = 0.55; e.cdx = nx; e.cdy = ny; }
      }
      break;
    }
    case 'exploder': {
      mvx = nx; mvy = ny;
      if (e.state === 'fuse') {
        e.st -= dt; sp *= 0.3;
        if (e.st <= 0) { explodeAt(e.x, e.y, 85, e.dmg, '#ffcf3a'); killEnemy(e, null); return; }
      } else if (d < e.r + t.r + 22) { e.state = 'fuse'; e.st = 0.55; }
      break;
    }
  }
  if (e.state !== 'dash') {
    const a = Math.min(1, dt * 8);
    e.vx += (mvx * sp - e.vx) * a; e.vy += (mvy * sp - e.vy) * a;
  }
  e.x = clamp(e.x + (e.vx + e.kx) * dt, -BOUND, BOUND);
  e.y = clamp(e.y + (e.vy + e.ky) * dt, -BOUND, BOUND);
  if (Math.abs(e.vx) > 5) e.face = e.vx > 0 ? 1 : -1;
  if (D.ai === 'turret') { e.x -= (e.vx + e.kx) * dt; e.y -= (e.vy + e.ky) * dt; }
  if (D.ai !== 'ranged' && D.ai !== 'exploder' && D.ai !== 'healer' && D.ai !== 'turret' && D.ai !== 'flee' && !(D.ai === 'blinker' && D.ranged) && e.spawnT >= 1) {
    if (d < e.r + t.r + 5 && e.atkT <= 0) {
      e.atkT = e.state === 'dash' ? 0.5 : 0.9;
      e.lunge = 0.12;
      hitAlly(t, e.dmg * (e.state === 'dash' ? 1.4 : 1), e);
      if (D.chill && t === W.player) W.player.chill = 1.2;
    }
  }
}

// ---------------- bosses ----------------
function bossRing(e, n, speed, offset = 0, dmgK = 0.55) {
  for (let i = 0; i < n; i++) {
    const a = offset + (i / n) * TAU;
    W.projs.push({ x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 8, dmg: e.dmg * dmgK, team: 'enemy', life: 4, color: e.bd.pcolor, kind: 'orb' });
  }
}
function removeTele(g) { const i = W.tele.indexOf(g); if (i >= 0) W.tele.splice(i, 1); }
function startBossPattern(e) {
  const pats = e.bd.patterns;
  e.pat = pats[e.pi % pats.length];
  e.pi++;
  e.ps = 0; e.pk = 0;
  const p = W.player;
  switch (e.pat) {
    case 'charge': {
      const tgt = p.dead ? { x: 0, y: 0 } : p;
      e.cang = angTo(e, tgt);
      e.tg = { type: 'line', x: e.x, y: e.y, ang: e.cang, len: 640, w: e.r * 2, t: 0, dur: 0.8 };
      W.tele.push(e.tg);
      e.hitSet = new Set();
      break;
    }
    case 'slam': {
      const pts = [{ x: p.x, y: p.y }];
      for (const s of W.summons.slice(0, 3)) if (!s.c.flying) pts.push({ x: s.x, y: s.y });
      while (pts.length < (e.enraged ? 6 : 4)) pts.push({ x: p.x + rand(-160, 160), y: p.y + rand(-160, 160) });
      e.slams = pts.map(q => { const g = { type: 'circle', x: q.x, y: q.y, r: 95, t: 0, dur: 1.1 }; W.tele.push(g); return g; });
      break;
    }
    case 'breath': {
      e.cang = angTo(e, p);
      e.tg = { type: 'cone', x: e.x, y: e.y, ang: e.cang, len: 400, half: 0.5, t: 0, dur: 0.7 };
      W.tele.push(e.tg);
      break;
    }
    case 'summon': SFX.roar(); break;
    case 'teleport': {
      const a = rand(TAU), tgt = p.dead ? e : p;
      e.dest = { x: clamp(tgt.x + Math.cos(a) * 170, -BOUND + 60, BOUND - 60), y: clamp(tgt.y + Math.sin(a) * 170, -BOUND + 60, BOUND - 60) };
      e.tg = { type: 'circle', x: e.dest.x, y: e.dest.y, r: e.r + 60, t: 0, dur: 0.75 };
      W.tele.push(e.tg);
      break;
    }
    case 'laser': {
      e.cang = angTo(e, p);
      e.tg = { type: 'line', x: e.x, y: e.y, ang: e.cang, len: 900, w: 34, t: 0, dur: 0.9 };
      W.tele.push(e.tg);
      e.sweep = Math.random() < 0.5 ? 1 : -1;
      break;
    }
    case 'meteor': {
      const n = e.enraged ? 12 : 8;
      e.slams = [];
      for (let i = 0; i < n; i++) {
        const q = i === 0 && !p.dead ? p : { x: p.x + rand(-300, 300), y: p.y + rand(-300, 300) };
        const g = { type: 'circle', x: q.x, y: q.y, r: 75, t: 0, dur: 0.9 + i * 0.12 };
        W.tele.push(g); e.slams.push(g);
      }
      break;
    }
  }
}
function segDist2(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / l2, 0, 1);
  const cx = x1 + dx * t - px, cy = y1 + dy * t - py;
  return cx * cx + cy * cy;
}
function endBossPattern(e) {
  if (e.tg) { removeTele(e.tg); e.tg = null; }
  if (e.slams) { e.slams.forEach(removeTele); e.slams = null; }
  e.dashing = false; e.beam = null; e.fade = 0;
  e.pat = null;
}
function updateBoss(e, dt) {
  const p = W.player;
  e.kx = 0; e.ky = 0;
  if (e.pat && e.stunT > 0) endBossPattern(e);
  if (!e.enraged && e.hp < e.maxHp * 0.5) {
    e.enraged = true;
    banner(e.bd.name + ' is ENRAGED!', 'boss');
    burst(e.x, e.y, '#ff3355', 60, 400, 1, 8);
    W.shake = 12; SFX.roar();
  }
  const rage = e.enraged ? 1.35 : 1;
  const tgt = p.dead ? null : p;
  if (!e.pat) {
    if (tgt) {
      const a = angTo(e, tgt);
      const sp = e.speed * (e.slowT > 0 ? 1 - e.slowF : 1) * rage;
      e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp;
      e.x = clamp(e.x + e.vx * dt, -BOUND, BOUND); e.y = clamp(e.y + e.vy * dt, -BOUND, BOUND);
      if (Math.abs(e.vx) > 5) e.face = e.vx > 0 ? 1 : -1;
    }
    e.patT -= dt * rage;
    if (e.patT <= 0 && e.spawnT >= 1) startBossPattern(e);
  } else {
    e.ps += dt;
    switch (e.pat) {
      case 'burst': {
        const n = Math.round((14 + W.idx * 1.5) * (e.enraged ? 1.4 : 1));
        if (e.pk === 0 && e.ps > 0.55) { bossRing(e, n, 230); e.pk = 1; SFX.shoot(); }
        if (e.pk === 1 && e.ps > 0.95) { bossRing(e, n, 260, Math.PI / n); e.pk = 2; SFX.shoot(); }
        if (e.pk === 2 && e.enraged && e.ps > 1.35) { bossRing(e, n, 290); e.pk = 3; }
        if (e.ps > 1.6) endBossPattern(e);
        break;
      }
      case 'spiral': {
        e.pk -= dt;
        if (e.pk <= 0) {
          e.pk = e.enraged ? 0.06 : 0.085;
          e.spinA += 0.27;
          const arms = e.enraged ? 4 : 3;
          for (let i = 0; i < arms; i++) {
            const a = e.spinA + (i / arms) * TAU;
            W.projs.push({ x: e.x, y: e.y, vx: Math.cos(a) * 210, vy: Math.sin(a) * 210, r: 7, dmg: e.dmg * 0.45, team: 'enemy', life: 4, color: e.bd.pcolor, kind: 'orb' });
          }
        }
        if (e.ps > 2.8) endBossPattern(e);
        break;
      }
      case 'charge': {
        if (e.ps < 0.8) { e.tg.x = e.x; e.tg.y = e.y; break; }
        if (!e.dashing) { e.dashing = true; e.dashD = 0; SFX.whoosh(); removeTele(e.tg); e.tg = null; }
        const sp = 980 * rage, step = sp * dt;
        e.x = clamp(e.x + Math.cos(e.cang) * step, -BOUND, BOUND);
        e.y = clamp(e.y + Math.sin(e.cang) * step, -BOUND, BOUND);
        e.dashD += step;
        e.face = Math.cos(e.cang) > 0 ? 1 : -1;
        burst(e.x, e.y + e.r * 0.6, '#3a3040', 2, 80, 0.4, 10, 'smoke');
        for (const a of [p, ...W.summons]) {
          if (a.dead || e.hitSet.has(a) || (a.c && a.c.flying)) continue;
          if (dist2(a, e) < (a.r + e.r) ** 2) {
            e.hitSet.add(a); hitAlly(a, e.dmg * 1.2, e);
            if (a !== p && !a.c.stationary) { a.x += Math.cos(e.cang + Math.PI / 2) * 40; a.y += Math.sin(e.cang + Math.PI / 2) * 40; }
          }
        }
        if (e.dashD >= 640 || Math.abs(e.x) >= BOUND || Math.abs(e.y) >= BOUND) {
          endBossPattern(e); W.shake = Math.max(W.shake, 10); SFX.slam();
          ring(e.x, e.y, e.col, 20, 120, 0.4, 4);
        }
        break;
      }
      case 'slam': {
        for (const g of e.slams) g.t = e.ps;
        if (e.ps >= 1.1) {
          for (const g of e.slams) {
            burst(g.x, g.y, e.col, 22, 300, 0.6, 7);
            ring(g.x, g.y, '#ff5a7a', 10, g.r, 0.4, 4);
            if (!p.dead && dist2(p, g) < (g.r + p.r) ** 2) hitAlly(p, e.dmg * 1.1, e);
            for (const s of W.summons) if (!s.c.flying && dist2(s, g) < (g.r + s.r) ** 2) hitAlly(s, e.dmg * 1.1, e);
          }
          W.shake = Math.max(W.shake, 12); SFX.boom(false);
          endBossPattern(e);
        }
        break;
      }
      case 'summon': {
        if (e.pk === 0 && e.ps > 0.5) {
          e.pk = 1;
          const n = 4 + Math.floor(W.idx / 2) + (e.enraged ? 2 : 0);
          for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU, x = e.x + Math.cos(a) * (e.r + 50), y = e.y + Math.sin(a) * (e.r + 50);
            magicCircle(x, y, '#ff3355', 26, 0.8);
            spawnEnemy(e.bd.minion, x, y);
          }
        }
        if (e.ps > 1.0) endBossPattern(e);
        break;
      }
      case 'teleport': {
        if (e.tg) e.tg.t = e.ps;
        e.fade = clamp(e.ps / 0.35, 0, 1) * (e.ps < 0.75 ? 1 : 0);
        if (e.ps >= 0.75 && e.dest) {
          burst(e.x, e.y, e.col, 30, 260, 0.5, 6);
          e.x = e.dest.x; e.y = e.dest.y; e.dest = null; e.fade = 0;
          removeTele(e.tg); e.tg = null;
          burst(e.x, e.y, e.col, 40, 320, 0.6, 7); ring(e.x, e.y, e.col, 10, e.r + 60, 0.4, 4);
          for (const a of [p, ...W.summons]) if (!a.dead && !(a.c && a.c.flying) && dist2(a, e) < (e.r + 60 + a.r) ** 2) hitAlly(a, e.dmg, e);
          bossRing(e, Math.round(10 * (e.enraged ? 1.5 : 1)), 240);
          W.shake = Math.max(W.shake, 8); SFX.boom(false);
        }
        if (e.ps > 1.1) endBossPattern(e);
        break;
      }
      case 'laser': {
        if (e.ps < 0.9) { e.tg.x = e.x; e.tg.y = e.y; if (!p.dead) { e.cang = lerpAng(e.cang, angTo(e, p), dt * 2); e.tg.ang = e.cang; } break; }
        if (e.tg) { removeTele(e.tg); e.tg = null; SFX.breath(); }
        e.cang += e.sweep * dt * (e.enraged ? 0.9 : 0.6);
        const len = 900, x2 = e.x + Math.cos(e.cang) * len, y2 = e.y + Math.sin(e.cang) * len;
        e.beam = { x2, y2, w: 30 };
        e.pk -= dt;
        if (e.pk <= 0) {
          e.pk = 0.12;
          for (const a of [p, ...W.summons]) {
            if (a.dead || (a.c && a.c.ai === 'flier')) continue;
            if (segDist2(a.x, a.y, e.x, e.y, x2, y2) < (15 + a.r) ** 2) hitAlly(a, e.dmg * 0.3, e);
          }
        }
        if (Math.random() < 0.8) spawnP({ x: lerp(e.x, x2, Math.random()), y: lerp(e.y, y2, Math.random()), vx: rand(-60, 60), vy: rand(-60, 60), life: 0.4, size: 7, color: e.bd.pcolor, drag: 2 });
        if (e.ps > 2.4) endBossPattern(e);
        break;
      }
      case 'meteor': {
        let left = 0;
        for (const g of e.slams) {
          if (g.done) continue;
          g.t = Math.min(g.dur, e.ps);
          if (e.ps >= g.dur) {
            g.done = true; removeTele(g);
            burst(g.x, g.y, e.bd.pcolor, 26, 300, 0.6, 7); burst(g.x, g.y, '#ffffff', 8, 260, 0.3, 3, 'spark');
            ring(g.x, g.y, e.col, 10, g.r, 0.4, 4);
            if (!p.dead && dist2(p, g) < (g.r + p.r) ** 2) hitAlly(p, e.dmg * 0.9, e);
            for (const s of W.summons) if (!s.c.flying && dist2(s, g) < (g.r + s.r) ** 2) hitAlly(s, e.dmg * 0.9, e);
            W.shake = Math.max(W.shake, 6); SFX.boom(false);
          } else {
            left++;
            if (g.dur - e.ps < 0.3) spawnP({ x: g.x - 120 * (g.dur - e.ps) / 0.3, y: g.y - 300 * (g.dur - e.ps) / 0.3, life: 0.12, size: 12, color: e.bd.pcolor, drag: 0 });
          }
        }
        if (!left) endBossPattern(e);
        break;
      }
      case 'breath': {
        if (e.ps < 0.7) { e.tg.x = e.x; e.tg.y = e.y; e.tg.t = e.ps; break; }
        if (e.tg) { removeTele(e.tg); e.tg = null; SFX.breath(); }
        if (!p.dead) e.cang = lerpAng(e.cang, angTo(e, p), dt * 0.9);
        e.pk -= dt;
        for (let i = 0; i < 5; i++) {
          const a = e.cang + rand(-0.48, 0.48), sp = rand(300, 520);
          spawnP({ x: e.x + Math.cos(e.cang) * e.r, y: e.y + Math.sin(e.cang) * e.r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.5, 0.8), size: rand(8, 13), color: Math.random() < 0.5 ? e.bd.pcolor : '#ffffff', drag: 1.2 });
        }
        if (e.pk <= 0) {
          e.pk = 0.15;
          for (const a of [p, ...W.summons]) {
            if (a.dead || (a.c && a.c.ai === 'flier')) continue;
            if (dist(a, e) < 400 && Math.abs(angDiff(e.cang, angTo(e, a))) < 0.5) hitAlly(a, e.dmg * 0.22, e);
          }
        }
        if (e.ps > 2.3) endBossPattern(e);
        break;
      }
    }
    if (!e.pat) e.patT = (1.7 - W.idx * 0.05) * (e.enraged ? 0.65 : 1);
  }
  if (e.atkT <= 0) {
    for (const a of [p, ...W.summons]) {
      if (a.dead || (a.c && a.c.flying)) continue;
      if (dist2(a, e) < (a.r + e.r + 4) ** 2) { hitAlly(a, e.dmg * 0.8, e); e.atkT = 0.8; break; }
    }
  }
}

// ---------------- projectiles / physics / pickups ----------------
function allyProjExplode(q) {
  q.done = true;
  const R2 = q.splash * q.splash;
  enemiesNear(q.x, q.y, q.splash, o => { if (dist2(o, q) < R2 + o.r * o.r) damageEnemy(o, q.dmg, q.src); });
  burst(q.x, q.y, q.color, q.detonate ? 60 : 20, q.detonate ? 420 : 250, q.detonate ? 0.8 : 0.5, q.detonate ? 8 : 6);
  ring(q.x, q.y, q.color, 6, q.splash, 0.4, q.detonate ? 5 : 3);
  if (q.detonate) W.shake = Math.max(W.shake, 10);
  SFX.boom(!!q.detonate);
}
function updateProjectiles(dt) {
  const p = W.player;
  const forts = W.summons.filter(s => s.fortT > 0);
  for (const q of W.projs) {
    q.life -= dt;
    q.x += q.vx * dt; q.y += q.vy * dt;
    if (q.life <= 0 || Math.abs(q.x) > BOUND + 50 || Math.abs(q.y) > BOUND + 50) {
      if (q.detonate && q.team === 'ally') allyProjExplode(q);
      q.done = true; continue;
    }
    if (q.kind === 'arcane' || q.kind === 'ice') if (Math.random() < 0.7) spawnP({ x: q.x, y: q.y, life: 0.3, size: q.r * 0.6, color: q.color, drag: 4 });
    if (q.team === 'ally') {
      enemiesNear(q.x, q.y, q.r, e => {
        if (q.done || e.dead || (q.hit && q.hit.has(e))) return;
        if (dist2(e, q) > (e.r + q.r) ** 2) return;
        if (q.splash) { allyProjExplode(q); return; }
        damageEnemy(e, q.dmg, q.src);
        burst(q.x, q.y, q.color, 4, 120, 0.25, 3, 'spark');
        if (q.slow && !e.dead) { e.slowF = Math.max(e.slowT > 0 ? e.slowF : 0, q.slow * (e.isBoss ? 0.4 : 1)); e.slowT = Math.max(e.slowT, 1.5); }
        if (q.pierce > 0) { q.pierce--; q.hit.add(e); } else q.done = true;
      });
    } else {
      if (forts.length && forts.some(s => dist2(s, q) < 150 * 150)) { q.done = true; burst(q.x, q.y, '#ffcf5a', 4, 100, 0.3, 3, 'spark'); continue; }
      if (!p.dead && dist2(p, q) < (p.r + q.r - 2) ** 2) {
        hitAlly(p, q.dmg); q.done = true;
        if (q.chill) p.chill = 1;
        burst(q.x, q.y, q.color, 6, 120, 0.3, 4);
        continue;
      }
      for (const s of W.summons) {
        if (s.dead || s.down || s.c.flying) continue;
        if (dist2(s, q) < (s.r + q.r) ** 2) { hitAlly(s, q.dmg); q.done = true; burst(q.x, q.y, q.color, 5, 120, 0.3, 4); break; }
      }
    }
  }
  W.projs = W.projs.filter(q => !q.done);
}
function separation() {
  const p = W.player;
  for (const e of W.enemies) {
    if (e.dead || e.isBoss) continue;
    enemiesNear(e.x, e.y, e.r, o => {
      if (o.id <= e.id || o.isBoss) return;
      const dx = o.x - e.x, dy = o.y - e.y, rr_ = (o.r + e.r) * 0.9, d2 = dx * dx + dy * dy;
      if (d2 < rr_ * rr_ && d2 > 0.01) {
        const d = Math.sqrt(d2), push = (rr_ - d) * 0.5, nx = dx / d, ny = dy / d;
        e.x -= nx * push; e.y -= ny * push; o.x += nx * push; o.y += ny * push;
      }
    });
  }
  for (const s of W.summons) {
    if (s.c.flying || s.dead || s.down) continue;
    enemiesNear(s.x, s.y, s.r, e => {
      if (e.dead || e.d.ghost) return;
      const dx = e.x - s.x, dy = e.y - s.y, rr_ = e.r + s.r, d2 = dx * dx + dy * dy;
      if (d2 < rr_ * rr_ && d2 > 0.01) {
        const d = Math.sqrt(d2), o = rr_ - d, nx = dx / d, ny = dy / d;
        const sw = s.c.stationary ? 0 : e.isBoss ? 1 : 0.3, ew = e.isBoss ? 0 : s.c.stationary ? 1 : 0.7;
        e.x += nx * o * ew; e.y += ny * o * ew; s.x -= nx * o * sw; s.y -= ny * o * sw;
      }
    });
  }
  if (!p.dead) {
    enemiesNear(p.x, p.y, p.r, e => {
      if (e.dead) return;
      const dx = e.x - p.x, dy = e.y - p.y, rr_ = e.r + p.r, d2 = dx * dx + dy * dy;
      if (d2 < rr_ * rr_ && d2 > 0.01) {
        const d = Math.sqrt(d2), o = rr_ - d, nx = dx / d, ny = dy / d;
        if (e.isBoss) { p.x -= nx * o; p.y -= ny * o; } else { e.x += nx * o; e.y += ny * o; }
      }
    });
  }
}
function updatePickups(dt) {
  const p = W.player;
  if (p.dead) return;
  const mag = W.ps.magnet;
  for (const k of W.pickups) {
    k.t += dt;
    const dx = p.x - k.x, dy = p.y - k.y, d = Math.hypot(dx, dy) || 1;
    if (!k.mag && d < mag) k.mag = true;
    if (k.mag) {
      const sp = 300 + k.t * 200 + (W.won || W.floorPause > 0 ? 600 : 0);
      k.vx += (dx / d * sp - k.vx) * Math.min(1, dt * 8);
      k.vy += (dy / d * sp - k.vy) * Math.min(1, dt * 8);
    } else { k.vx *= 1 - Math.min(1, dt * 4); k.vy *= 1 - Math.min(1, dt * 4); }
    k.x += k.vx * dt; k.y += k.vy * dt;
    if (d < p.r + 10) {
      k.done = true;
      if (k.type === 'exp') { gainExp(k.val); SFX.exp(); }
      else if (k.type === 'stone') {
        const v = Math.max(1, Math.round(k.val * W.rewardMult * (1 + rv('stoneGain'))));
        SAVE.stones += v; W.stones += v; SFX.stone();
        txt(p.x, p.y - 30, '+' + v + ' ◆', '#e2c6ff', 13);
      } else {
        if (healPlayer(p.maxHp * k.val) > 0) SFX.heal();
      }
    }
  }
  W.pickups = W.pickups.filter(k => !k.done);
}

// ---------------- main update ----------------
// brief freeze for impact; rate-limited so crowded fights never stutter
function hitStop(d) {
  if (d < 0.1 && W.t - (W.lastStopT ?? -9) < 0.4) return;
  W.lastStopT = W.t; W.hitstop = Math.max(W.hitstop, d);
}
function updateWorld(rawDt) {
  AUDIO.pan = 0;
  if (W.hitstop > 0) { W.hitstop -= rawDt; updateParticles(rawDt * 0.2); return; }
  const dt = rawDt * W.timeScale;
  if (W.flashT > 0) W.flashT -= rawDt;
  if (W.focus) { W.focus.t -= rawDt; if (W.focus.t <= 0) W.focus = null; }
  W.zk = lerp(W.zk, W.focus ? 1.2 : W.odT > 11.4 ? 0.9 : 1, Math.min(1, rawDt * 4));
  MUSIC.setIntensity(Math.min(1, W.enemies.length / 90 + (W.boss ? 0.5 : 0)));
  if (W.isRaid && W.boss && !W.boss.dead && !W.won && !W.player.dead) {
    W.raidT -= dt;
    if (W.raidT <= RAID_TIME / 2 && !W.boss.enraged) { W.boss.enraged = true; banner('Nyx grows furious!', 'boss'); SFX.roar(); }
    if (W.raidT <= 0) { W.won = true; W.endT = 2.5; banner('TIME UP', 'boss'); W.projs = W.projs.filter(q => q.team === 'ally'); }
  }
  W.t += dt;
  if (!W.won && !W.player.dead && !tutGating() && W.floorPause <= 0) W.time += dt;
  W.timeScale = Math.min(1, W.timeScale + rawDt * 0.6);
  W.shake *= Math.pow(0.001, rawDt);
  W.hurtFlash = Math.max(0, W.hurtFlash - rawDt);
  if (W.howlT > 0) W.howlT -= dt;
  if (W.odT > 0) W.odT -= dt;
  for (let i = 0; i < 6; i++) if (W.slotCd[i] > 0) W.slotCd[i] -= dt * (buffOn('haste') ? 2 : 1);
  for (const k in W.cskCd) if (W.cskCd[k] > 0) W.cskCd[k] -= dt;
  for (const m of W.circles) m.t += dt;
  W.circles = W.circles.filter(m => m.t < m.dur);
  for (const b of W.bolts) b.t += dt;
  W.bolts = W.bolts.filter(b => b.t < b.dur);
  for (const b of W.beams) b.t += dt;
  W.beams = W.beams.filter(b => b.t < b.dur);
  if (W.later.length) {
    for (const l of W.later) l.t -= dt;
    const due = W.later.filter(l => l.t <= 0);
    W.later = W.later.filter(l => l.t > 0);
    if (!W.player.dead) for (const l of due) l.fn();
  }
  for (const g of W.tele) if (g.type !== 'circle') g.t = Math.min(g.dur, g.t + dt);

  if (!W.player.dead) {
    if (!W.won) director(dt);
    updatePlayer(dt);
    gridBuild();
    updateSummons(dt);
    updateZones(dt);
    for (const e of W.enemies) if (!e.dead) updateEnemy(e, dt);
    W.enemies = W.enemies.filter(e => !e.dead);
    gridBuild();
    separation();
    updateProjectiles(dt);
    updateTut(dt);
    updateEvents(dt);
  }
  updatePickups(dt);
  updateParticles(dt);
  updateTexts(dt);
  W.achT -= rawDt;
  if (W.achT <= 0) { W.achT = 2; checkAch(); }

  const p = W.player, a = Math.min(1, rawDt * 6);
  const mx = Math.max(0, BOUND + 40 - VW / 2 / ZOOM), my = Math.max(0, BOUND + 40 - VH / 2 / ZOOM);
  const fx = W.focus ? lerp(p.x, W.focus.x, 0.6) : p.x, fy = W.focus ? lerp(p.y, W.focus.y, 0.6) : p.y;
  W.camX = clamp(lerp(W.camX, fx, a), -mx, mx); W.camY = clamp(lerp(W.camY, fy, a), -my, my);

  if (W.endT >= 0) {
    W.endT -= rawDt;
    if (W.endT < 0) finishStage(W.won);
  }
}
