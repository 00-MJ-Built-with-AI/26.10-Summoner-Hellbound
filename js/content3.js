'use strict';
// ---------- v4: Overdrive, rank synergies, stage events, Hell Tiers, Daily Trial, Sanctum, cosmetics, gamepad, records ----------

// ================= Rank synergies (2+ equipped cards sharing a rank; fusions count for both parent ranks) =================
const SYNERGIES = {
  insect:    { name: 'Hive Mind',       desc: 'Insect summons explode when they fall.' },
  beast:     { name: 'Pack Bond',       desc: 'Beast summons get +25% HP and +15% damage.' },
  bird:      { name: 'Sky Dominion',    desc: 'Bird summons dive 30% more often.' },
  grass:     { name: 'Overgrowth',      desc: 'Grass summons last 50% longer and heal 25% more.' },
  stone:     { name: 'Bulwark',         desc: 'Stone summons get +40% HP and taunt 30% wider.' },
  fish:      { name: 'Tidal Bond',      desc: 'Fish shields are 40% stronger.' },
  spirit:    { name: 'Spirit Link',     desc: 'Spirit projectiles pierce 1 more enemy and deal +15% damage.' },
  dragon:    { name: 'Dragon Lord',     desc: 'Dragon summons deal +25% damage and breathe 25% more often.' },
  celestial: { name: 'Choir of Heaven', desc: 'Celestial summons deal +20% damage and heal 20% more.' },
};
function activeSynergies(hotbar) {
  const count = {};
  for (const id of hotbar || SAVE.hotbar) if (id && CARDS[id]) for (const t of CARDS[id].tags) count[t] = (count[t] || 0) + 1;
  return Object.keys(SYNERGIES).filter(k => count[k] >= 2);
}
const syn = k => !!(W && W.syn && W.syn.has(k));
// multipliers applied to a new summon by synergies
function synMods(c) {
  const t = c.tags, m = { hp: 1, dmg: 1, life: 1, heal: 1, shield: 1, aura: 1 };
  if (t.includes('beast') && syn('beast')) { m.hp *= 1.25; m.dmg *= 1.15; }
  if (t.includes('stone') && syn('stone')) { m.hp *= 1.4; m.aura *= 1.3; }
  if (t.includes('grass') && syn('grass')) { m.life *= 1.5; m.heal *= 1.25; }
  if (t.includes('fish') && syn('fish')) m.shield *= 1.4;
  if (t.includes('spirit') && syn('spirit')) m.dmg *= 1.15;
  if (t.includes('dragon') && syn('dragon')) m.dmg *= 1.25;
  if (t.includes('celestial') && syn('celestial')) { m.dmg *= 1.2; m.heal *= 1.2; }
  return m;
}

// ================= Grimoire Overdrive =================
const OD_MAX = 100;
function addOverdrive(v) {
  if (!W.active || W.odT > 0 || W.won || W.player.dead) return;
  const was = W.od >= OD_MAX;
  W.od = Math.min(OD_MAX, W.od + v * (1 + eqv('od')));
  if (!was && W.od >= OD_MAX) { toast(`Overdrive ready! ${INPUT.touchMode ? 'Tap ❂' : 'Press ' + key1('overdrive')}`, 'ach'); SFX.level(); }
}
function useOverdrive() {
  if (!W.active || W.player.dead || W.won || W.choosing) return;
  if (W.od < OD_MAX) { toast(`Overdrive is ${Math.floor(W.od)}% charged`, 'fail'); SFX.fail(); return; }
  const p = W.player, ids = [...new Set(SAVE.hotbar.filter(Boolean))];
  if (!ids.length) return;
  W.od = 0; W.odT = 12;
  ids.forEach((id, k) => {
    const c = CARDS[id], a = (k / ids.length) * TAU, x = clamp(p.x + Math.cos(a) * 110, -BOUND, BOUND), y = clamp(p.y + Math.sin(a) * 110, -BOUND, BOUND);
    magicCircle(x, y, circleColor(RANK_BY_ID[c.rank].color), 40 + c.r);
    for (let i = 0; i < (c.count || 1); i++) {
      const s = makeSummon(id, x + rand(-12, 12), y + rand(-12, 12));
      s.c = Object.assign({}, s.c, { weight: 0 }); s.od = true; s.life = s.maxLife = 12;
      W.summons.push(s);
    }
  });
  magicCircle(p.x, p.y, '#ffd66b', 190, 1.8);
  burst(p.x, p.y, '#ffd66b', 90, 520, 1.2, 8);
  ring(p.x, p.y, '#ffd66b', 20, 320, 0.9, 6);
  banner('GRIMOIRE OVERDRIVE', 'victory');
  W.shake = 14; W.timeScale = 0.5; W.flashT = 0.2;
  SFX.summon(9); SFX.enhance(); SFX.roar();
  SAVE.counters.overdrives = (SAVE.counters.overdrives || 0) + 1;
}

// ================= Hell Tiers (no reset: harder enemies, better rewards) =================
const TIER_MAX = 10;
const tierHp = () => 1 + 0.25 * (W.tier || 0);
const tierReward = tier => 1 + 0.3 * tier;
function checkTierUnlock() {
  if (SAVE.level >= 40 && SAVE.tierMax < 1) {
    SAVE.tierMax = 1;
    toast('Hell Tier 1 unlocked! Pick your tier above the map.', 'ach');
  }
}

// ================= stage events =================
const SHRINES = {
  fury:    { name: 'Shrine of Fury',    color: '#ff4d6d', desc: 'Summons deal +50% damage' },
  haste:   { name: 'Shrine of Haste',   color: '#7fd3ff', desc: 'Allen moves 30% faster and summon cooldowns tick twice as fast' },
  renewal: { name: 'Shrine of Renewal', color: '#5dff9a', desc: 'Allen regenerates 3% HP per second' },
  wisdom:  { name: 'Shrine of Wisdom',  color: '#ffd66b', desc: 'Triple mana regeneration and +50% EXP' },
};
const buffOn = k => !!(W.buff && W.buff.type === k && W.buff.t > 0);
function eventsAllowed() { return !W.isRush && !W.bossSpawned && W.floorPause <= 0 && !tutGating() && !W.won && !W.player.dead; }
function updateEvents(dt) {
  if (W.buff && W.buff.t > 0) {
    W.buff.t -= dt;
    if (W.buff.type === 'renewal') healPlayer(W.player.maxHp * 0.03 * dt, true);
    if (W.buff.t <= 0) toast(`${SHRINES[W.buff.type].name} faded`, 'card');
  }
  if (W.ev) updateEvent(dt);
  if (!eventsAllowed()) return;
  W.evT -= dt;
  if (W.evT <= 0 && !W.ev) { W.evT = rand(28, 40); startEvent(['goblin', 'shrine', 'champion', 'storm'][randi(0, 3)]); }
}
function eventSpot(minD, maxD) {
  const p = W.player, a = rand(TAU), d = rand(minD, maxD);
  return { x: clamp(p.x + Math.cos(a) * d, -BOUND + 80, BOUND - 80), y: clamp(p.y + Math.sin(a) * d, -BOUND + 80, BOUND - 80) };
}
function startEvent(type) {
  const p = W.player;
  if (type === 'goblin') {
    const q = eventSpot(260, 360), e = spawnEnemy('treasure_goblin', q.x, q.y);
    e.treasure = true; e.escape = 22;
    W.ev = { type, e, t: 0 };
    banner('A Treasure Goblin appeared!', 'level'); SFX.stone();
  } else if (type === 'shrine') {
    const q = eventSpot(300, 450), kind = Object.keys(SHRINES)[randi(0, 3)];
    W.ev = { type, x: q.x, y: q.y, kind, charge: 0, t: 0, life: 30 };
    toast(`A ${SHRINES[kind].name} appeared! Stand in it to activate`, 'ach'); SFX.warn();
  } else if (type === 'champion') {
    const q = eventSpot(300, 420), e = spawnEnemy(weightedPick(W.st.enemies), q.x, q.y, true);
    e.champion = true; e.hp = e.maxHp = e.maxHp * 2.5; e.r *= 1.25; e.dmg *= 1.2;
    if (e.d.ai === 'turret' || e.d.ai === 'healer') { e.hp = e.maxHp = e.maxHp * 0.6; }
    magicCircle(q.x, q.y, '#ff3355', 60, 1.2);
    W.ev = { type, e, t: 0 };
    banner(`Champion ${e.d.name} approaches!`, 'boss'); SFX.roar();
  } else if (type === 'storm') {
    W.ev = { type, t: 0, next: 0, dmg0: W.dmgTaken, circles: [] };
    banner('Meteor storm! Keep moving', 'boss'); SFX.warn();
  }
}
function endEvent() { W.ev = null; }
function updateEvent(dt) {
  const ev = W.ev, p = W.player;
  ev.t += dt;
  if (ev.type === 'goblin') {
    const e = ev.e;
    if (e.dead) { endEvent(); return; }
    e.escape -= dt;
    if (e.escape <= 0 || W.bossSpawned) {
      e.dead = true; burst(e.x, e.y, '#ffd34a', 30, 260, 0.6, 5);
      toast('The Treasure Goblin escaped!', 'fail'); endEvent();
    }
  } else if (ev.type === 'shrine') {
    const inside = !p.dead && dist2(p, ev) < 80 * 80;
    ev.charge = clamp(ev.charge + (inside ? dt / 3 : -dt / 6), 0, 1);
    if (ev.charge >= 1) {
      W.buff = { type: ev.kind, t: 20 };
      ring(ev.x, ev.y, SHRINES[ev.kind].color, 10, 160, 0.8, 5);
      burst(ev.x, ev.y, SHRINES[ev.kind].color, 60, 360, 1, 7);
      banner(`${SHRINES[ev.kind].name}: ${SHRINES[ev.kind].desc}!`, 'rank');
      SAVE.counters.shrines = (SAVE.counters.shrines || 0) + 1;
      SFX.enhance(); endEvent(); return;
    }
    if (ev.t > ev.life) { toast('The shrine faded away', 'fail'); endEvent(); }
  } else if (ev.type === 'champion') {
    if (ev.e.dead) endEvent();
  } else if (ev.type === 'storm') {
    ev.next -= dt;
    if (ev.t < 14 && ev.next <= 0) {
      ev.next = 0.42;
      const g = { type: 'circle', x: p.x + rand(-260, 260) + p.vx * 0.5, y: p.y + rand(-260, 260) + p.vy * 0.5, r: 70, t: 0, dur: 1.1 };
      W.tele.push(g); ev.circles.push(g);
    }
    for (const g of ev.circles) {
      if (g.done) continue;
      g.t += dt;
      if (g.t >= g.dur) {
        g.done = true; removeTele(g);
        burst(g.x, g.y, '#ff9a3a', 24, 280, 0.6, 7); ring(g.x, g.y, '#ffcf5a', 10, g.r, 0.4, 4);
        const dmg = 18 * W.sm.dmg * W.mode.edmg * tierHp();
        if (!p.dead && dist2(p, g) < (g.r + p.r) ** 2) hitAlly(p, dmg);
        for (const s of W.summons) if (!s.c.flying && dist2(s, g) < (g.r + s.r) ** 2) hitAlly(s, dmg);
        enemiesNear(g.x, g.y, g.r, e => { if (!e.isBoss && dist2(e, g) < (g.r + e.r) ** 2) damageEnemy(e, dmg * 2, null, { quiet: true, color: '#ffb347' }); });
        W.shake = Math.max(W.shake, 5); SFX.boom(false);
      }
    }
    if (ev.t >= 15.2) {
      const clean = W.dmgTaken - ev.dmg0 < 1;
      const reward = Math.round((clean ? 12 : 4) * (Math.min(W.idx, 7) + 1) * W.mode.stones * W.rewardMult);
      SAVE.stones += reward; W.stones += reward;
      banner(clean ? `Untouched by the storm! +◆ ${reward}` : `Storm survived. +◆ ${reward}`, 'level');
      for (const g of ev.circles) removeTele(g);
      endEvent();
    }
  }
}
// rewards for event enemies (called from killEnemy)
function eventKillRewards(e) {
  if (e.treasure) {
    for (let i = 0; i < 10; i++) dropPickup(e.x, e.y, 'stone', (2 + W.idx) * W.mode.stones);
    if (W.stageIdx >= 8 || W.isTower) { SAVE.essence++; W.essence++; txt(e.x, e.y - 30, '+1 Abyss Essence', '#ff8af0', 15, 1.4); }
    SAVE.counters.goblins = (SAVE.counters.goblins || 0) + 1;
    banner('Treasure Goblin defeated!', 'level');
  }
  if (e.champion) {
    for (let i = 0; i < 6; i++) dropPickup(e.x, e.y, 'stone', (3 + W.idx) * W.mode.stones);
    dropPickup(e.x, e.y, 'heart', 0.3);
    addOverdrive(25);
    if (W.stageIdx >= 8) { SAVE.essence++; W.essence++; txt(e.x, e.y - 30, '+1 Abyss Essence', '#ff8af0', 15, 1.4); }
    banner('Champion defeated!', 'level');
  }
}
function drawEvents(c, t) {
  const ev = W.ev;
  if (ev && ev.type === 'shrine') {
    const sh = SHRINES[ev.kind];
    c.fillStyle = rgba(sh.color, 0.08); circ(c, ev.x, ev.y, 80); c.fill();
    c.strokeStyle = rgba(sh.color, 0.5); c.lineWidth = 2; c.setLineDash([8, 8]); c.lineDashOffset = -t * 20;
    circ(c, ev.x, ev.y, 80); c.stroke(); c.setLineDash([]);
    c.strokeStyle = sh.color; c.lineWidth = 5;
    c.beginPath(); c.arc(ev.x, ev.y, 80, -Math.PI / 2, -Math.PI / 2 + ev.charge * TAU); c.stroke();
    c.globalCompositeOperation = 'lighter';
    glowAt(c, ev.x, ev.y - 20, 50, sh.color, 0.5 + Math.sin(t * 4) * 0.15);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#d9d2c4'; c.fillRect(ev.x - 8, ev.y - 42, 16, 42);
    c.fillStyle = '#efe9dc'; c.fillRect(ev.x - 11, ev.y - 46, 22, 6);
    c.fillStyle = sh.color; circ(c, ev.x, ev.y - 54 + Math.sin(t * 3) * 3, 7); c.fill();
  }
  if (W.buff && W.buff.t > 0 && !W.player.dead) {
    const p = W.player, col = SHRINES[W.buff.type].color;
    c.strokeStyle = rgba(col, 0.55); c.lineWidth = 2;
    c.save(); c.translate(p.x, p.y + 14); c.scale(1, 0.4); circ(c, 0, 0, 30 + Math.sin(t * 5) * 2); c.stroke(); c.restore();
  }
}

// ================= Daily Trial =================
function todayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function dailyInfo() {
  const key = todayKey();
  let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const rng = mulberry32(h);
  const pool = STAGES.map((s, i) => i).filter(i => SAVE.cleared[i]);
  const stage = pool.length ? pool[Math.floor(rng() * pool.length)] : 0;
  const cs = [...CURSES]; const curses = [];
  while (curses.length < 2) { const k = Math.floor(rng() * cs.length); curses.push(cs.splice(k, 1)[0].id); }
  const done = SAVE.daily && SAVE.daily.key === key && SAVE.daily.done;
  return { key, stage, curses, done, stones: Math.round((150 + 30 * stage) * MODES[SAVE.mode].stones), essence: SAVE.cleared[8] ? 2 : 0 };
}

// ================= Summoner's Sanctum (idle rewards) =================
const SANCTUM_CAP_H = 12;
function sanctumRate() {
  let stones = 0, essence = 0;
  for (const id of SAVE.sanctum.cards) {
    if (!id || !CARDS[id]) continue;
    const cs = SAVE.cards[id];
    stones += (6 + cs.lv * 1.2 + cs.enh * 4) * (SAVE.awakened[id] ? 1.5 : 1);
    if (SAVE.cleared[8]) essence += 0.08;
  }
  return { stones, essence };
}
function sanctumPending() {
  const hours = Math.min(SANCTUM_CAP_H, Math.max(0, (Date.now() - SAVE.sanctum.since) / 3.6e6));
  const r = sanctumRate();
  return { hours, stones: Math.floor(r.stones * hours), essence: Math.floor(r.essence * hours) };
}
function collectSanctum() {
  const p = sanctumPending();
  SAVE.stones += p.stones; SAVE.essence += p.essence;
  SAVE.sanctum.since = Date.now();
  SAVE.counters.sanctum = (SAVE.counters.sanctum || 0) + (p.stones > 0 ? 1 : 0);
  saveGame(); checkAch();
  return p;
}

// ================= cosmetics =================
const starCount = () => SAVE.stars.reduce((a, s) => a + s.filter(Boolean).length, 0);
const OUTFITS = [
  { id: 'default',   name: 'Apprentice Cloak',     cloak: '#1d2658', trim: '#7088ff', gold: '#e6c25a', req: 'Always available',        ok: () => true },
  { id: 'crimson',   name: 'Demonbane Cloak',      cloak: '#5a0f1e', trim: '#ff4d6d', gold: '#ffd34a', req: 'Clear Act II',            ok: () => SAVE.cleared.slice(8, 18).every(Boolean) },
  { id: 'verdant',   name: 'Verdant Mantle',       cloak: '#14402a', trim: '#5dff9a', gold: '#c9f56a', req: 'Earn 40 challenge stars', ok: () => starCount() >= 40 },
  { id: 'celestial', name: 'Celestial Vestments',  cloak: '#d8d0ec', trim: '#ffd66b', gold: '#ffd66b', req: 'Clear Act III',           ok: () => SAVE.cleared.slice(18, 28).every(Boolean) },
  { id: 'shadow',    name: 'Abyss Shroud',         cloak: '#0c0818', trim: '#b06bff', gold: '#ff4dd2', req: 'Reach Hell Tier 3',       ok: () => SAVE.tierMax >= 3 },
  { id: 'royal',     name: 'Archsummoner Regalia', cloak: '#2a1a60', trim: '#ffd66b', gold: '#ffffff', req: 'Unlock 25 achievements',  ok: () => Object.keys(SAVE.ach).length >= 25 },
];
const CIRCLES = [
  { id: 'default', name: 'Rank Colors',  color: null,      req: 'Always available',      ok: () => true },
  { id: 'gold',    name: 'Sunlit Gold',  color: '#ffd66b', req: 'Earn 50 challenge stars', ok: () => starCount() >= 50 },
  { id: 'blood',   name: 'Blood Moon',   color: '#ff2a55', req: 'Unlock Hell Tier 1',    ok: () => SAVE.tierMax >= 1 },
  { id: 'frost',   name: 'Frostbound',   color: '#9fe8ff', req: 'Reach Tower floor 20',  ok: () => SAVE.towerBest >= 20 },
  { id: 'void',    name: 'Void Sigil',   color: '#7a3cff', req: 'Complete a Boss Rush',  ok: () => (SAVE.counters.rushDone || 0) >= 1 },
  { id: 'prism',   name: 'Prismatic',    color: 'prism',   req: 'Own all 18 relics',     ok: () => Object.keys(SAVE.relics).length >= RELICS.length },
];
const PRISM = ['#ff4d6d', '#ffb347', '#ffd66b', '#5dff9a', '#5ab8ff', '#c78bff'];
function circleColor(rankColor) {
  const c = SAVE && CIRCLES.find(x => x.id === SAVE.cosmetics.circle);
  if (!c || !c.color) return rankColor;
  return c.color === 'prism' ? PRISM[randi(0, PRISM.length - 1)] : c.color;
}
function outfit() { return (SAVE && OUTFITS.find(o => o.id === SAVE.cosmetics.outfit)) || OUTFITS[0]; }

// ================= records =================
function trackDamage(src, dmg) {
  if (!src || !src.id || !CARDS[src.id]) return;
  const r = SAVE.cardStats[src.id] || (SAVE.cardStats[src.id] = { kills: 0, dmg: 0 });
  r.dmg += dmg;
}
function trackKill(src) {
  if (!src || !src.id || !CARDS[src.id]) return;
  const r = SAVE.cardStats[src.id] || (SAVE.cardStats[src.id] = { kills: 0, dmg: 0 });
  r.kills++;
}
function recordRun(won, retreat) {
  const kind = W.isTower ? 'tower' : W.isRush ? 'rush' : W.isDaily ? 'daily' : 'stage';
  const name = W.isTower ? `Abyss Tower (floor ${W.floor})` : W.isRush ? `Boss Rush (${W.floorsCleared}/${W.rushList.length})` : (W.isDaily ? 'Daily Trial: ' : '') + STAGES[W.stageIdx].name;
  SAVE.history.unshift({ t: Date.now(), kind, name, won: !!won, retreat: !!retreat, time: Math.round(W.t), kills: W.kills, exp: Math.round(W.expGained), stones: W.stones, tier: W.tier || 0 });
  SAVE.history = SAVE.history.slice(0, 30);
}

// ================= gamepad =================
// Standard mapping: A/B/X/Y + LB/RB = slots 1-6, hold LT = special skill, RT = dash,
// D-pad up/right/down/left = Enhance/Swap/Recall/Overdrive, Start = pause, Back = minimap
const PAD = { prev: [], announced: false };
function pollGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let gp = null;
  for (const g of pads) if (g && g.connected) { gp = g; break; }
  if (!gp) return;
  const held = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
  const tap = i => held(i) && !PAD.prev[i];
  const dz = v => (Math.abs(v) < 0.22 ? 0 : v);
  const lx = dz(gp.axes[0] || 0), ly = dz(gp.axes[1] || 0), rx = dz(gp.axes[2] || 0), ry = dz(gp.axes[3] || 0);
  const any = lx || ly || rx || ry || gp.buttons.some((b, i) => held(i));
  if (any && !INPUT.padMode) {
    INPUT.padMode = true;
    if (!PAD.announced) { PAD.announced = true; toast('Controller connected', 'card'); }
  }
  if (INPUT.padMode) {
    if (STATE === 'play') {
      const m = Math.hypot(lx, ly);
      INPUT.joy = m ? { x: lx / Math.max(1, m), y: ly / Math.max(1, m) } : { x: 0, y: 0 };
      INPUT.aimV = Math.hypot(rx, ry) > 0.3 ? { x: rx, y: ry } : null;
      if (W.choosing) { [0, 1, 2].forEach(i => { if (tap(i)) pickBoost(i); }); }
      else {
        const mod = held(6);
        [0, 1, 2, 3, 4, 5].forEach(i => { if (tap(i)) mod ? useCardSkill(i) : trySummon(i); });
        if (tap(7)) useSkill('Space');
        if (tap(12)) useSkill('KeyQ');
        if (tap(15)) useSkill('KeyE');
        if (tap(13)) useSkill('KeyR');
        if (tap(14)) useOverdrive();
        if (tap(8)) { SETTINGS.minimap = !SETTINGS.minimap; saveSettings(); }
        if (tap(9)) pauseGame();
      }
    } else if (STATE === 'pause' && tap(9)) resumeGame();
    else if (STATE === 'dialogue' && tap(0)) advanceDialogue();
    else if (STATE === 'result' && tap(0)) $('btnResContinue').click();
  }
  PAD.prev = gp.buttons.map((b, i) => held(i));
}
window.addEventListener('gamepaddisconnected', () => { INPUT.padMode = false; INPUT.joy = null; INPUT.aimV = null; toast('Controller disconnected', 'fail'); });

// ================= data additions =================
ENEMIES.treasure_goblin = { name: 'Treasure Goblin', hp: 80, speed: 140, dmg: 0, r: 13, exp: 12, ai: 'flee', color: '#ffd34a', draw: 'goblin', treasureBag: true };
LORE.treasure_goblin = 'Runs from you with a sack of magic stones. Catch it before it escapes!';
ACTIONS.splice(ACTIONS.findIndex(a => a.id === 'recall') + 1, 0, { id: 'overdrive', name: 'Grimoire Overdrive', def: ['KeyF', 'NumpadAdd'] });
if (!SETTINGS.keys.overdrive) SETTINGS.keys.overdrive = ['KeyF', 'NumpadAdd'];
rebuildKeymap();
ACHIEVEMENTS.push(
  { id: 'od50',     name: 'Unbound Grimoire',  reward: 150, desc: 'Use Grimoire Overdrive 50 times.',  check: () => (SAVE.counters.overdrives || 0) >= 50 },
  { id: 'goblins',  name: 'Goblin Hunter',     reward: 100, desc: 'Catch 10 Treasure Goblins.',        check: () => (SAVE.counters.goblins || 0) >= 10 },
  { id: 'shrines',  name: 'Pilgrim',           reward: 80,  desc: 'Activate 20 shrines.',              check: () => (SAVE.counters.shrines || 0) >= 20 },
  { id: 'tier5',    name: 'Deeper into Hell',  reward: 400, desc: 'Unlock Hell Tier 5.',               check: () => SAVE.tierMax >= 5 },
  { id: 'tier10',   name: 'Lord of Hell Mode', reward: 1000, desc: 'Unlock Hell Tier 10.',             check: () => SAVE.tierMax >= 10 },
  { id: 'daily7',   name: 'Devoted',           reward: 200, desc: 'Complete 7 Daily Trials.',          check: () => (SAVE.counters.dailies || 0) >= 7 },
  { id: 'sanctum',  name: 'Passive Income',    reward: 50,  desc: 'Collect from the Sanctum 10 times.', check: () => (SAVE.counters.sanctum || 0) >= 10 },
  { id: 'synergy4', name: 'Perfect Harmony',   reward: 150, desc: 'Clear a stage with 3 synergies active.', check: () => (SAVE.counters.syn3 || 0) >= 1 },
);
