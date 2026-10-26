'use strict';
// ---------- Talents, fusion, special skills, zones, soul boosts, challenges, achievements, tower, tutorial ----------

const tl = id => (SAVE && SAVE.talents && SAVE.talents[id]) || 0;
const bs = id => (W && W.active && W.boosts && W.boosts[id]) || 0;

// ---------------- relics ----------------
// total value of an effect across the 3 equipped relics ('+' versions count double)
function rv(eff) {
  if (!SAVE || !SAVE.relicSlots) return 0;
  let v = 0;
  for (const id of SAVE.relicSlots) {
    if (!id || !SAVE.relics[id]) continue;
    const r = RELICS.find(x => x.id === id);
    if (r && r.eff === eff) v += r.v * SAVE.relics[id];
  }
  return v;
}
// returns the HP actually restored (0 under the Withering curse)
function healPlayer(amt, silent) {
  const p = W.player;
  if (!p || p.dead || amt <= 0 || (W.curses && W.curses.has('frail'))) return 0;
  const a = Math.min(amt, p.maxHp - p.hp);
  if (a <= 0) return 0;
  p.hp += a;
  if (!silent && a >= 1) txt(p.x, p.y - 26, '+' + Math.round(a), '#5dff9a', 13, 0.7);
  return a;
}
// stage clear: grant this boss's relic, or a 25% chance to upgrade it to '+'
function awardRelic(bossId) {
  const r = RELIC_BY_BOSS[BOSSES[bossId].base || bossId];
  if (!r) return null;
  const have = SAVE.relics[r.id] || 0;
  if (!have) {
    SAVE.relics[r.id] = 1;
    const empty = SAVE.relicSlots.indexOf(null);
    if (empty >= 0) SAVE.relicSlots[empty] = r.id;
    return { relic: r, upgraded: false };
  }
  if (have === 1 && (BOSSES[bossId].awakened || Math.random() < 0.25)) { SAVE.relics[r.id] = 2; return { relic: r, upgraded: true }; }
  return null;
}
const relicName = id => { const r = RELICS.find(x => x.id === id); return r.name + (SAVE.relics[id] === 2 ? ' +' : ''); };

// ---------------- companions ----------------
const compUnlocked = id => !!(COMPANIONS[id] && SAVE.cleared[COMPANIONS[id].unlockAt]);
function makeCompanion(id, x, y) {
  const d = COMPANIONS[id], m = 1 + 0.12 * (SAVE.level - 1);
  const c = Object.assign({}, d, { comp: true, weight: 0, cost: 0, tags: [], flying: false });
  return {
    id: 'comp_' + id, c, col: d.color, m, x, y, vx: 0, vy: 0, r: d.r,
    hp: d.hp * m, maxHp: d.hp * m, dmg: (d.dmg || 0) * m, heal: (d.heal || 0) * m, shieldAmt: (d.shield || 0) * m, bite: 0,
    aura: 0, healAura: 0, slam: 0, atkCd: d.atkCd || 1,
    atkT: 0.5, rtT: 0, target: null, life: 0, maxLife: 0, spawnT: 0, face: 1, ang: 0,
    state: '', st: 1, st2: 3, orbitA: rand(TAU), orbitR: 70, shield: 0, buffT: 0, flash: 0, lunge: 0, fortT: 0,
    chargeCd: 0, breathCd: 0, trail: null, seed: rand(100), t: 0, dead: false, down: false, downT: 0,
  };
}

// ---------------- lightning (Storm Archon) ----------------
function lightningPts(x1, y1, x2, y2) {
  const pts = [{ x: x1, y: y1 }], n = 7;
  for (let i = 1; i < n; i++) { const k = i / n; pts.push({ x: lerp(x1, x2, k) + rand(-14, 14), y: lerp(y1, y2, k) + rand(-14, 14) }); }
  pts.push({ x: x2, y: y2 });
  return pts;
}
function archonStrike(s, first, chain, dmg) {
  const hit = new Set([first]);
  let from = { x: s.x, y: s.y - 40 }, cur = first;
  for (let k = 0; k <= chain && cur; k++) {
    W.bolts.push({ pts: lightningPts(from.x, from.y, cur.x, cur.y), t: 0, dur: 0.25, color: '#bff6ff' });
    damageEnemy(cur, dmg * (k ? 0.7 : 1), s);
    burst(cur.x, cur.y, '#bff6ff', 6, 160, 0.3, 3, 'spark');
    from = cur;
    cur = nearestEnemy(cur.x, cur.y, 170, e => !hit.has(e));
    if (cur) hit.add(cur);
  }
  SFX.shoot();
}

// ---------------- hotbar loadouts ----------------
function switchLoadout(i) {
  if (i === SAVE.loadoutIdx) return;
  SAVE.loadouts[SAVE.loadoutIdx] = [...SAVE.hotbar];
  SAVE.loadoutIdx = i;
  SAVE.hotbar = [...SAVE.loadouts[i]].map(id => (id && CARDS[id] && cardUnlocked(id) ? id : null));
  saveGame();
}

// ---------------- card awakening ----------------
function awakenStatus(id) {
  const cs = SAVE.cards[id], cost = awakenCost(id);
  if (SAVE.awakened[id]) return { ok: false, why: 'Awakened' };
  if (cs.lv < 20) return { ok: false, why: `Needs Lv 20 (Lv ${cs.lv})` };
  if (SAVE.essence < cost.essence) return { ok: false, why: `Needs ${cost.essence} essence` };
  if (SAVE.stones < cost.stones) return { ok: false, why: `Needs ◆ ${cost.stones}` };
  return { ok: true };
}
function doAwaken(id) {
  if (!awakenStatus(id).ok) return false;
  const cost = awakenCost(id);
  SAVE.stones -= cost.stones; SAVE.essence -= cost.essence;
  SAVE.awakened[id] = true;
  saveGame(); checkAch();
  return true;
}

// ---------------- Boss Rush ----------------
const rushUnlocked = () => !!SAVE.cleared[7];
function rushBosses() {
  const list = [];
  STAGES.forEach((s, i) => { if (SAVE.cleared[i] && !list.includes(s.boss)) list.push(s.boss); });
  return list.length ? list : [STAGES[0].boss];
}
function rushStage(i, list) {
  const id = list[i], si = BOSS_STAGE[id];
  return { name: `Boss Rush · ${i + 1} / ${list.length}`, boss: id, bossFloor: true, duration: 2, density: 0, enemies: {}, theme: STAGES[si].theme };
}
function rushNext() {
  const k = W.rushI, id = W.rushList[k];
  const reward = Math.round(15 * (BOSS_STAGE[id] + 1) * W.mode.stones);
  SAVE.stones += reward; W.stones += reward;
  W.floorsCleared = k + 1;
  for (const e of W.enemies) if (!e.dead) { e.dead = true; burst(e.x, e.y, e.col, 8, 140, 0.5, 4); }
  W.enemies = []; W.boss = null;
  W.projs = W.projs.filter(q => q.team === 'ally');
  W.tele.length = 0;
  for (const p of W.pickups) p.mag = true;
  if (k + 1 >= W.rushList.length) {
    W.won = true; W.endT = 3.4;
    SAVE.counters.rushDone = (SAVE.counters.rushDone || 0) + (W.rushList.length >= 10 ? 1 : 0);
    banner('BOSS RUSH COMPLETE', 'victory'); SFX.victory();
    return;
  }
  banner(`${k + 1} / ${W.rushList.length} down!  +◆ ${reward}`, 'level');
  healPlayer(W.player.maxHp * 0.3, true);
  W.rushI++;
  W.floorPause = 3;
  W.nextFloorFn = () => {
    const nid = W.rushList[W.rushI], si = BOSS_STAGE[nid];
    W.st = rushStage(W.rushI, W.rushList);
    W.sm = stageMult(si); W.idx = Math.min(7, si);
    if (W.themeIdx !== si) { W.themeIdx = si; W.deco = genDeco(si); initAmbient(); }
    W.time = 0; W.bossSpawned = false; W.bossWarnT = 0;
    $('stageName').textContent = W.st.name;
    MUSIC.play(musicKey(si));
  };
  SFX.victory();
  saveGame();
}

// Allen's effective stats = level + talents (+ run boosts when in a stage)
function pstat(withBoosts = true) {
  const L = SAVE.level, b = withBoosts ? bs : () => 0;
  return {
    hp: Math.round(PLAYER.hp(L) * (1 + 0.12 * tl('vitality')) * (1 + 0.25 * b('iron_skin')) * (1 + eqv('hp'))),
    mp: PLAYER.mp(L) + 15 * tl('reserves') + rv('mana') + eqv('mp'),
    regen: PLAYER.regen(L) * (1 + 0.1 * tl('manaflow')) * (1 + 0.4 * b('arcane_well')) * (1 + rv('mana') * 0.0075) * (1 + eqv('mpRegen')),
    cap: PLAYER.cap(L) + tl('grimoire') + 2 * b('wide_grimoire') + rv('cap'),
    stone: PLAYER.stone(L) * (1 + 0.2 * tl('sling')) * (1 + 0.6 * b('sharp_stones')),
    throwCd: 0.62 / (1 + 0.1 * tl('sling')),
    speed: 215 * (1 + 0.05 * tl('swift')) * (1 + 0.15 * b('fleet')) * (1 + rv('swift')) * (1 + eqv('speed')),
    dashCd: Math.max(0.5, (1.4 - 0.15 * tl('swift')) * (1 - 0.3 * b('fleet')) * (1 - 2 * rv('swift'))),
    soul: (1 + 0.15 * tl('soul_harvest')) * (1 + eqv('soul')),
    magnet: 120 * (1 + 0.25 * tl('magnet')),
    sumMult: 1 + 0.05 * tl('pact'),
    cdMult: (1 - 0.06 * tl('quickcast')) * Math.pow(0.75, b('quick_pages')) * (1 - eqv('cdr')),
    skillCd: Math.pow(0.7, b('soul_echo')) * (1 - Math.min(0.5, rv('skillCd'))) * (1 - eqv('skillCdr')),
  };
}
const talentCost = (t, lv) => Math.round(t.base * Math.pow(lv + 1, 1.6));
function buyTalent(id) {
  const t = TALENTS.find(x => x.id === id), lv = tl(id);
  if (lv >= t.max) return false;
  const c = talentCost(t, lv);
  if (SAVE.stones < c) return false;
  SAVE.stones -= c; SAVE.talents[id] = lv + 1;
  saveGame(); checkAch();
  return true;
}

// ---------------- fusion ----------------
function cardUnlocked(id) {
  const c = CARDS[id];
  return c.fusion ? !!SAVE.fused[id] : SAVE.level >= RANK_BY_ID[c.rank].level;
}
function fuseStatus(id) {
  const c = CARDS[id];
  if (SAVE.fused[id]) return { ok: false, why: 'Discovered' };
  for (const f of c.fusion) {
    if (!cardUnlocked(f)) return { ok: false, why: `Unlock ${CARDS[f].name} first` };
    if (SAVE.cards[f].lv < FUSE_LV) return { ok: false, why: `${CARDS[f].name} needs Lv ${FUSE_LV}` };
  }
  if (SAVE.stones < c.fuseCost) return { ok: false, why: `Need ◆ ${c.fuseCost}` };
  return { ok: true };
}
function doFuse(id) {
  if (!fuseStatus(id).ok) return false;
  SAVE.stones -= CARDS[id].fuseCost;
  SAVE.fused[id] = true;
  const slot = SAVE.hotbar.indexOf(null);
  if (slot >= 0) SAVE.hotbar[slot] = id;
  saveGame(); checkAch();
  return true;
}

// ---------------- helpers used by skills ----------------
function stun(e, t) { if (!e.dead) e.stunT = Math.max(e.stunT || 0, e.isBoss ? t * 0.35 : t); }
function allyBlast(x, y, R, dmg, color, src, opts = {}) {
  const c = { x, y };
  enemiesNear(x, y, R, e => {
    if (e.dead || dist2(e, c) > (R + e.r) ** 2) return;
    damageEnemy(e, dmg, src);
    if (e.dead) return;
    if (opts.stun) stun(e, opts.stun);
    if (opts.poison) { e.poisonT = 4; e.poisonD = Math.max(e.poisonD, opts.poison); e.poisonSrc = src; }
    if (opts.knock && !e.isBoss) { const a = Math.atan2(e.y - y, e.x - x); e.kx += Math.cos(a) * opts.knock; e.ky += Math.sin(a) * opts.knock; }
  });
  burst(x, y, color, Math.min(70, 20 + R / 4), 200 + R * 1.5, 0.7, 7);
  burst(x, y, '#ffffff', 12, 260 + R, 0.35, 3, 'spark');
  ring(x, y, color, 10, R, 0.45, 4);
  W.shake = Math.max(W.shake, 4 + R / 25);
  SFX.boom(R > 150);
}
function addZone(type, x, y, r, dur, dmg, src, every = 0.5) {
  W.zones.push({ type, x, y, r, t: 0, dur, dmg, src, every, tk: 0 });
}
function updateZones(dt) {
  for (const z of W.zones) {
    z.t += dt; z.tk -= dt;
    const R2 = z.r * z.r;
    if (z.tk <= 0) {
      z.tk = z.every;
      enemiesNear(z.x, z.y, z.r, e => {
        if (e.dead || dist2(e, z) > R2) return;
        if (z.type === 'poison') { e.poisonT = 3; e.poisonD = Math.max(e.poisonD, z.dmg); e.poisonSrc = z.src; }
        else if (z.type === 'fire') damageEnemy(e, z.dmg, z.src, { quiet: true, color: '#ffb347' });
        else if (z.type === 'frost') {
          damageEnemy(e, z.dmg, z.src, { quiet: true, color: '#bff6ff' });
          if (!e.dead) { e.slowF = Math.max(e.slowT > 0 ? e.slowF : 0, 0.7 * (e.isBoss ? 0.4 : 1)); e.slowT = Math.max(e.slowT, 0.6); }
        }
      });
    }
    const n = z.type === 'fire' ? 4 : 2;
    for (let i = 0; i < n; i++) {
      const a = rand(TAU), d = Math.sqrt(Math.random()) * z.r;
      const x = z.x + Math.cos(a) * d, y = z.y + Math.sin(a) * d;
      if (z.type === 'fire') {
        if (Math.random() < 0.15) spawnP({ x: x - 80, y: y - 220, vx: 360, vy: 1000, life: 0.22, size: 7, color: '#ffcf5a', kind: 'spark', drag: 0 });
        spawnP({ x, y, vy: rand(-120, -40), life: rand(0.3, 0.6), size: rand(6, 11), color: Math.random() < 0.5 ? '#ff7a2e' : '#ffcf5a', drag: 1 });
      } else if (z.type === 'poison') spawnP({ x, y, vy: rand(-30, -10), life: 0.9, size: 10, color: '#9b3cff', kind: 'smoke', drag: 1 });
      else spawnP({ x, y: y - 40, vx: rand(-40, 40), vy: rand(60, 140), life: 0.6, size: 3, color: '#e8fbff', drag: 0.5 });
    }
  }
  W.zones = W.zones.filter(z => z.t < z.dur);
}

// ---------------- special skills ----------------
function useCardSkill(slot) {
  if (!W.active || W.player.dead || W.won || W.choosing) return;
  const id = SAVE.hotbar[slot];
  if (!id) return;
  const sk = CARD_SKILLS[id], c = CARDS[id], p = W.player;
  const mine = W.summons.filter(s => s.id === id && !s.dead);
  if (!mine.length) { toast(`Summon ${c.name} first to use ${sk.name}`, 'fail'); SFX.fail(); flashSlot(slot); return; }
  if ((W.cskCd[id] || 0) > 0) { toast(`${sk.name} is recharging`, 'fail'); SFX.fail(); return; }
  if (p.mp < sk.mp) { toast('Not enough mana', 'fail'); SFX.fail(); flashSlot(slot); return; }
  const m = mouseWorld();
  let near = mine[0], bd = Infinity;
  for (const s of mine) { const d = dist2(s, m); if (d < bd) { bd = d; near = s; } }
  if (SKILL_FX[sk.fx](id, near, mine, m) === false) return;
  p.mp -= sk.mp;
  W.cskCd[id] = sk.cd * W.ps.skillCd * (SAVE.awakened[id] ? 0.7 : 1);
  SAVE.counters.skills++;
  txt(near.x, near.y - 40, sk.name + (SAVE.awakened[id] ? '+' : '') + '!', '#ffd66b', 16, 1.1);
  SFX.skill();
  tutEvent('skill_' + id);
}
const SKILL_FX = {
  detonate(id, near, mine) {
    const plague = id === 'plague_swarm';
    for (const s of mine) {
      allyBlast(s.x, s.y, plague ? 85 : 70, s.dmg * 8 * sMult(s), s.col, s, plague ? { poison: s.dmg * 2 } : {});
      if (plague) addZone('poison', s.x, s.y, 85, 3, s.dmg * 1.6, s);
      killSummon(s, true);
    }
  },
  cloud(id, s) {
    addZone('poison', s.x, s.y, 140, 4.5, s.dmg * 1.6 * sMult(s), s);
    ring(s.x, s.y, '#c46bff', 10, 140, 0.6, 4);
  },
  howl(id, s, mine) {
    W.howlT = 6;
    for (const w of mine) {
      ring(w.x, w.y, '#ffb347', 10, 170, 0.7, 4);
      enemiesNear(w.x, w.y, 170, e => { if (dist2(e, w) < 170 * 170) stun(e, 1.2); });
    }
    for (const o of W.summons) burst(o.x, o.y, '#ffb347', 6, 120, 0.5, 4);
    SFX.roar();
  },
  rampage(id, s, mine, m) {
    const a = Math.atan2(m.y - s.y, m.x - s.x);
    s.state = 'charge'; s.st = 0.75; s.cdx = Math.cos(a); s.cdy = Math.sin(a); s.hitSet = new Set(); s.rampage = true;
    ring(s.x, s.y, '#ff8a3d', 10, 60, 0.4, 4);
  },
  mark(id, s, mine, m) {
    let tgt = nearestEnemy(m.x, m.y, 320);
    if (W.boss && !W.boss.dead && dist2(W.boss, m) < 320 * 320) tgt = W.boss;
    if (!tgt) { toast('No enemy near your cursor to mark', 'fail'); SFX.fail(); return false; }
    tgt.markT = 8;
    for (const f of W.summons) if (f.c.ai === 'flier') { f.target = tgt; f.rtT = 2; f.atkT = 0; if (f.state !== 'dive') f.state = ''; }
    ring(tgt.x, tgt.y, '#ff3355', tgt.r * 3, tgt.r + 4, 0.5, 4);
  },
  bloom(id, s) {
    const p = W.player, R = s.aura * 2;
    if (!p.dead && dist2(p, s) < R * R) healPlayer(p.maxHp * 0.35);
    for (const o of W.summons) if (o !== s && dist2(o, s) < R * R) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.35);
    burst(s.x, s.y, '#4dffa6', 60, 300, 1, 7, 'glow', { grav: -60 });
    ring(s.x, s.y, '#4dffa6', 10, R, 0.8, 5);
    killSummon(s, true);
    SFX.heal();
  },
  entangle(id, s) {
    enemiesNear(s.x, s.y, s.aura, e => {
      if (dist2(e, s) > s.aura * s.aura) return;
      stun(e, 2.5);
      burst(e.x, e.y, '#37e07a', 6, 100, 0.5, 4, 'spark');
    });
    ring(s.x, s.y, '#37e07a', s.aura, 10, 0.6, 5);
  },
  fortress(id, s) { s.fortT = 6; ring(s.x, s.y, '#ffcf5a', 10, 150, 0.6, 5); SFX.slam(); },
  sanctuary(id, s) {
    s.fortT = 6;
    const p = W.player, R = 320;
    if (!p.dead && dist2(p, s) < R * R) healPlayer(p.maxHp * 0.4);
    for (const o of W.summons) if (dist2(o, s) < R * R) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.4);
    ring(s.x, s.y, '#9dff7a', 10, R, 0.8, 5);
    burst(s.x, s.y, '#9dff7a', 50, 300, 1, 7);
    SFX.heal();
  },
  wave(id, s) {
    const p = W.player;
    allyBlast(p.x, p.y, 280, 15 * s.m * sMult(s), '#5ab8ff', s, { knock: 700 });
    p.shield = Math.max(p.shield, s.shieldAmt * 2);
    for (const o of W.summons) o.shield = Math.max(o.shield, s.shieldAmt * 2);
    for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU; spawnP({ x: p.x, y: p.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, life: 0.55, size: 7, color: '#9fe0ff', drag: 1.5 }); }
    SFX.bubble();
  },
  zero(id, s) {
    const p = W.player;
    allyBlast(p.x, p.y, 330, 20 * s.m * sMult(s), '#bff6ff', s, { stun: 2.5 });
    for (let i = 0; i < 50; i++) spawnP({ x: p.x + rand(-330, 330), y: p.y + rand(-330, 330), vy: rand(-30, 30), life: 1, size: 4, color: '#e8fbff', drag: 1 });
  },
  bomb(id, s, mine, m) {
    const a = Math.atan2(m.y - s.y, m.x - s.x), d = Math.min(420, Math.hypot(m.x - s.x, m.y - s.y)), sp = 560;
    W.projs.push({ x: s.x, y: s.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 14, dmg: s.dmg * 6 * sMult(s), team: 'ally', life: Math.max(0.15, d / sp), color: s.col, kind: 'arcane', splash: 150, detonate: true, src: s });
    killSummon(s, true);
  },
  blizzard(id, s) {
    enemiesNear(s.x, s.y, 200, e => { if (dist2(e, s) < 200 * 200) stun(e, 1.5); });
    addZone('frost', s.x, s.y, 200, 4, s.dmg * 0.9 * sMult(s), s);
    ring(s.x, s.y, '#8ff0ff', 10, 200, 0.6, 5);
  },
  inferno(id, s, mine, m) {
    const p = W.player;
    let dx = m.x - p.x, dy = m.y - p.y; const d = Math.hypot(dx, dy);
    if (d > 420) { dx *= 420 / d; dy *= 420 / d; }
    addZone('fire', p.x + dx, p.y + dy, 190, 4, s.dmg * 2.6 * sMult(s), s, 0.25);
    ring(p.x + dx, p.y + dy, '#ff7a2e', 10, 190, 0.6, 5);
    SFX.breath();
  },
  nova(id, s) {
    allyBlast(s.x, s.y, 270, s.dmg * 8 * sMult(s), '#ff8a3d', s, { knock: 400 });
    killSummon(s, true);
  },
  judgment(id, s, mine, m) {
    const a = Math.atan2(m.y - s.y, m.x - s.x), len = 650;
    const x2 = s.x + Math.cos(a) * len, y2 = s.y + Math.sin(a) * len, dmg = s.dmg * 8 * sMult(s);
    enemiesNear((s.x + x2) / 2, (s.y + y2) / 2, len / 2 + 40, e => { if (!e.dead && segDist2(e.x, e.y, s.x, s.y, x2, y2) < (34 + e.r) ** 2) damageEnemy(e, dmg, s); });
    W.beams.push({ x1: s.x, y1: s.y, x2, y2, w: 56, t: 0, dur: 0.6, color: '#fff2a8' });
    for (let i = 0; i < 30; i++) { const k = Math.random(); spawnP({ x: lerp(s.x, x2, k), y: lerp(s.y, y2, k), vx: rand(-80, 80), vy: rand(-80, 80), life: 0.6, size: 8, color: '#fff6d6', drag: 2 }); }
    W.shake = Math.max(W.shake, 10); SFX.boom(true);
  },
  tempest(id, s) {
    for (let k = 0; k < 3; k++) W.later.push({ t: k * 0.4, fn: () => {
      if (s.dead) return;
      const R2 = s.c.range * s.c.range;
      for (const e of W.enemies) if (!e.dead && dist2(e, s) < R2) {
        W.bolts.push({ pts: lightningPts(e.x + rand(-30, 30), e.y - 320, e.x, e.y), t: 0, dur: 0.3, color: '#bff6ff' });
        damageEnemy(e, s.dmg * 1.6 * sMult(s), s, { quiet: true, color: '#bff6ff' });
      }
      W.shake = Math.max(W.shake, 6); SFX.boom(false);
    } });
  },
};

// ---------------- soul gauge + boosts ----------------
function addSoul(v) {
  if (W.won || W.choosing || W.player.dead || W.endT >= 0) return;
  W.soul += v * W.ps.soul;
  if (W.soul >= W.soulMax) openBoostChoice();
}
function openBoostChoice() {
  const pool = BOOSTS.filter(b => !b.tag || SAVE.hotbar.some(id => id && CARDS[id].tags.includes(b.tag)));
  for (let i = pool.length - 1; i > 0; i--) { const j = randi(0, i); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  W.choosing = pool.slice(0, 3);
  INPUT.keys.clear();
  showBoostModal(W.choosing);
  SFX.level();
}
function pickBoost(i) {
  if (!W.choosing || !W.choosing[i]) return;
  const b = W.choosing[i], p = W.player;
  W.boosts[b.id] = (W.boosts[b.id] || 0) + 1;
  W.picks++; W.soul = 0; W.soulMax += 20;
  W.choosing = null;
  refreshStats();
  if (b.id === 'iron_skin') healPlayer(p.maxHp * 0.3);
  if (b.id === 'mana_burst') p.mp = p.maxMp;
  hideBoostModal();
  burst(p.x, p.y, '#c78bff', 40, 300, 0.9, 6);
  ring(p.x, p.y, '#c78bff', 10, 140, 0.6, 4);
  toast(`${b.name}${W.boosts[b.id] > 1 ? ' ×' + W.boosts[b.id] : ''}: ${b.desc}`, 'card');
  SFX.enhance();
  tutEvent('boost');
}

// ---------------- challenges ----------------
function challengeText(ch) {
  switch (ch.t) {
    case 'kills': return `Slay ${ch.n}+ enemies`;
    case 'bossTime': return `Defeat the boss within ${ch.n}s of it appearing`;
    case 'dmg': return `Take less than ${Math.round(ch.n * 100)}% of your max HP in total damage`;
    case 'nodash': return 'Clear without dashing';
    case 'noboost': return 'Clear without picking any soul boosts';
    case 'maxCards': return `Use at most ${ch.n} different cards`;
  }
  return '';
}
function challengeMet(ch) {
  switch (ch.t) {
    case 'kills': return W.kills >= ch.n;
    case 'bossTime': return W.bossKillTime <= ch.n;
    case 'dmg': return W.dmgTaken < ch.n * W.player.maxHp;
    case 'nodash': return W.dashes === 0;
    case 'noboost': return W.picks === 0;
    case 'maxCards': return W.cardsUsed.size <= ch.n;
  }
  return false;
}
const starReward = i => Math.round(15 * (i + 1) * MODES[SAVE.mode].stones);

// ---------------- achievements ----------------
function checkAch() {
  if (!SAVE) return;
  for (const a of ACHIEVEMENTS) {
    if (SAVE.ach[a.id] || !a.check()) continue;
    SAVE.ach[a.id] = Date.now();
    SAVE.stones += a.reward;
    toast(`🏆 ${a.name} (+◆ ${a.reward})`, 'ach');
    SFX.achievement();
  }
}

// ---------------- Abyss Tower ----------------
const towerTier = f => Math.min(7, Math.floor((f - 1) / 3));
const towerTheme = f => Math.floor((f - 1) / 5) % 8;
const towerMult = f => ({ hp: 1 + 0.35 * f, dmg: 1 + 0.12 * f, exp: 1 + 0.3 * f, spd: 1 + 0.01 * Math.min(f, 40) });
const towerUnlocked = () => !!SAVE.cleared[2];
function towerStage(f) {
  const tier = towerTier(f), bossFloor = f % 5 === 0;
  const pool = Object.assign({}, STAGES[Math.max(0, tier - 1)].enemies);
  for (const k in STAGES[tier].enemies) pool[k] = (pool[k] || 0) + STAGES[tier].enemies[k] * 2;
  return {
    name: `Abyss Tower · Floor ${f}`, boss: STAGES[(Math.floor(f / 5) + 7) % 8].boss, bossFloor,
    duration: bossFloor ? 10 : 40, density: 1.15 + f * 0.03, enemies: pool, theme: STAGES[towerTheme(f)].theme,
  };
}
function floorCleared() {
  const p = W.player, f = W.floor;
  const reward = Math.round(3 * f * W.mode.stones);
  SAVE.stones += reward; W.stones += reward;
  W.floorsCleared = f;
  banner(`Floor ${f} cleared!  +◆ ${reward}`, 'level');
  for (const e of W.enemies) if (!e.dead) { e.dead = true; burst(e.x, e.y, e.col, 8, 140, 0.5, 4); }
  W.enemies = []; W.boss = null;
  W.projs = W.projs.filter(q => q.team === 'ally');
  W.tele.length = 0;
  for (const k of W.pickups) k.mag = true;
  p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.25);
  hideBossBar();
  W.floorPause = 3;
  SFX.victory();
  saveGame();
}
function nextFloor() {
  W.floor++;
  SAVE.towerBest = Math.max(SAVE.towerBest, W.floor);
  const oldTheme = W.themeIdx;
  W.st = towerStage(W.floor);
  W.idx = towerTier(W.floor);
  W.themeIdx = towerTheme(W.floor);
  W.sm = towerMult(W.floor);
  if (W.themeIdx !== oldTheme) { W.deco = genDeco(W.themeIdx); initAmbient(); }
  W.time = 0; W.bossSpawned = false; W.bossWarnT = 0; W.boss = null; W.hordeT = 22; W.budget = 2;
  $('stageName').textContent = W.st.name;
  banner(W.st.bossFloor ? `Floor ${W.floor} · Boss floor!` : `Floor ${W.floor}`, W.st.bossFloor ? 'boss' : 'rank');
  MUSIC.play('s' + W.themeIdx);
  checkAch();
  saveGame();
}

// ---------------- tutorial ----------------
const TUT_STEPS = [
  { id: 'move',  key: () => `Move with ${key1('up')} ${key1('left')} ${key1('down')} ${key1('right')}`, touch: 'Drag on the left side of the screen to move' },
  { id: 's1',    key: () => `Press ${key1('slot1')} to summon Spark Beetles where your cursor aims`, touch: 'Tap the beetle card to summon it ahead of you' },
  { id: 's2',    key: () => `Press ${key1('slot2')} to summon a Venom Mantis`, touch: 'Tap the mantis card to summon it' },
  { id: 'dash',  key: () => `Press ${key1('dash')} to dash. You're briefly invulnerable`, touch: 'Tap the » button to dash' },
  { id: 'skill', key: () => `Hold ${key1('skillMod')} and press ${key1('slot1')}: your beetles detonate! Every card has a special skill`, touch: 'Hold the beetle card: its special skill detonates them' },
  { id: 'soul',  key: () => 'Kills fill the purple Soul gauge. When it is full, choose a boost', touch: 'Kills fill the purple Soul gauge. When it is full, choose a boost' },
  { id: 'go',    key: () => 'Survive until the timer ends, then defeat the boss. Good luck, summoner!', touch: 'Survive until the timer ends, then defeat the boss. Good luck, summoner!' },
];
function tutText() {
  const s = TUT_STEPS[W.tut.step];
  let t = INPUT.touchMode ? s.touch : s.key();
  if (s.id === 'skill' && !W.summons.some(x => x.id === 'spark_beetle')) t += INPUT.touchMode ? ' (summon beetles first)' : ` (summon beetles with ${key1('slot1')} first)`;
  return t;
}
function tutEvent(ev) {
  if (!W.tut) return;
  const id = TUT_STEPS[W.tut.step].id;
  if ((id === 'dash' && ev === 'dash') || (id === 'skill' && ev === 'skill_spark_beetle') || (id === 'soul' && ev === 'boost')) advanceTut();
}
function advanceTut() {
  W.tut.step++; W.tut.t = 0;
  SFX.click();
  if (W.tut.step >= TUT_STEPS.length) { endTutorial(); return; }
  updateTutBox();
}
function endTutorial() {
  W.tut = null;
  SAVE.tutorialDone = true;
  saveGame();
  updateTutBox();
}
function updateTut(dt) {
  if (!W.tut) return;
  const tu = W.tut, id = TUT_STEPS[tu.step].id, p = W.player;
  tu.t += dt;
  if (id === 'move') { tu.moved += Math.hypot(p.vx, p.vy) * dt; if (tu.moved > 260) advanceTut(); }
  else if (id === 's1' && W.summons.some(s => s.id === 'spark_beetle')) advanceTut();
  else if (id === 's2' && W.summons.some(s => s.id === 'venom_mantis')) advanceTut();
  else if (id === 'soul' && tu.t > 18) advanceTut();
  else if (id === 'go' && tu.t > 6) endTutorial();
  if (W.tut && (tu.t % 0.5) < dt) updateTutBox();
}
const tutGating = () => W.tut && W.tut.step < 5;
