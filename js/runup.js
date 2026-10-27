'use strict';
// ---------- Run upgrades (pick 1 of 3 on each run level) and card evolution paths ----------

// ================= run upgrades =================
// Run EXP fills from the same pickups as summoner EXP but is counted in base enemy EXP units,
// so every stage gives roughly the same number of picks (and it still works at the level cap).
const RU_RARITY = { common: { w: 62, col: '#b9c3ff', label: 'Common' }, rare: { w: 30, col: '#5ab8ff', label: 'Rare' }, legendary: { w: 8, col: '#ffcf5a', label: 'Legendary' } };
const RUN_UPGRADES = [
  { id: 'might',      r: 'common', max: 5, icon: '⚔', name: 'Might',            desc: 'Summons deal +12% damage.' },
  { id: 'vigor',      r: 'common', max: 5, icon: '❤', name: 'Vigor',            desc: 'New summons get +15% HP.' },
  { id: 'focus',      r: 'common', max: 4, icon: '⟳', name: 'Focus',            desc: 'Summon cooldowns −8%.' },
  { id: 'wellspring', r: 'common', max: 4, icon: '✦', name: 'Wellspring',       desc: '+20% mana regeneration.' },
  { id: 'heart',      r: 'common', max: 4, icon: '⛨', name: 'Stout Heart',      desc: '+12% max HP and heal 20% now.' },
  { id: 'stride',     r: 'common', max: 3, icon: '»', name: 'Long Stride',      desc: '+8% move speed.' },
  { id: 'sling',      r: 'common', max: 4, icon: '●', name: 'Heavy Sling',      desc: "Allen's stones deal +30% damage." },
  { id: 'reach',      r: 'common', max: 3, icon: '◎', name: 'Reach',            desc: '+30% pickup range.' },
  { id: 'page',       r: 'common', max: 3, icon: '❖', name: 'Extra Page',       desc: '+1 grimoire capacity.' },
  { id: 'insight',    r: 'common', max: 3, icon: '☉', name: 'Insight',          desc: 'Cards gain +20% EXP this stage.' },
  { id: 'greed',      r: 'common', max: 3, icon: '◆', name: 'Greed',            desc: '+20% magic stones from pickups.' },
  { id: 'ward',       r: 'common', max: 4, icon: '⛉', name: 'Ward',             desc: 'Allen takes 6% less damage.' },
  { id: 'mend',       r: 'common', max: 3, icon: '✚', name: 'Mending',          desc: 'Allen regenerates 0.5% max HP per second.' },
  { id: 'haste',      r: 'common', max: 3, icon: '➶', name: 'Battle Haste',     desc: 'New summons attack 15% faster.' },
  { id: 'split',      r: 'rare', max: 1, tag: 'beast', icon: '☗', name: 'Twin Souls',  desc: 'Beasts split into two smaller beasts when they fall.' },
  { id: 'firetrail',  r: 'rare', max: 1, icon: '♨', name: 'Cinder Steps',     desc: 'Dashing leaves a trail of fire.' },
  { id: 'chain',      r: 'rare', max: 3, icon: 'ϟ', name: 'Chain Spark',      desc: 'Summon hits have a 10% chance to chain lightning to 2 enemies.' },
  { id: 'echo',       r: 'rare', max: 2, icon: '❍', name: 'Echo Summon',      desc: '20% chance a summon arrives with a free copy.' },
  { id: 'orbit',      r: 'rare', max: 3, icon: '❂', name: 'Orbiting Pages',   desc: 'Grimoire pages circle Allen and slice enemies (+2 pages per pick).' },
  { id: 'nova',       r: 'rare', max: 2, icon: '❄', name: 'Frost Pulse',      desc: 'Every 6 s, Allen releases a freezing nova.' },
  { id: 'vamp',       r: 'rare', max: 3, icon: '☽', name: 'Soul Siphon',      desc: 'Summon kills heal Allen for 0.6% max HP.' },
  { id: 'bomb',       r: 'rare', max: 3, icon: '✹', name: 'Volatile Foes',    desc: 'Enemies have a 12% chance to explode when they die.' },
  { id: 'venom',      r: 'rare', max: 2, icon: '☣', name: 'Venom Coat',       desc: 'Summon hits have a 15% chance to poison.' },
  { id: 'overflow',   r: 'rare', max: 2, icon: '⚡', name: 'Overflow',         desc: 'Overdrive charges 40% faster.' },
  { id: 'soulfeed',   r: 'rare', max: 3, icon: '☾', name: 'Soul Feast',       desc: 'Soul gauge fills 30% faster.' },
  { id: 'quickskill', r: 'rare', max: 3, icon: '✶', name: 'Quick Incantation', desc: 'Special skill cooldowns −15%.' },
  { id: 'meteor',     r: 'rare', max: 2, icon: '☄', name: 'Meteor Call',      desc: 'Every 10 s a meteor strikes the biggest crowd.' },
  { id: 'thorns',     r: 'rare', max: 2, icon: '✳', name: 'Thorn Mantle',     desc: 'Enemies that hit Allen take 3× stone damage.' },
  { id: 'swarmx',     r: 'rare', max: 1, tag: 'insect', icon: '✺', name: 'Brood Mother', desc: 'Swarm cards summon one extra insect.' },
  { id: 'stonex',     r: 'rare', max: 2, tag: 'stone', icon: '▲', name: 'Granite Hide', desc: 'Stone summons get +40% HP.' },
  { id: 'birdx',      r: 'rare', max: 2, tag: 'bird', icon: '➹', name: 'Talon Strike', desc: 'Bird summons deal +35% damage.' },
  { id: 'grassx',     r: 'rare', max: 2, tag: 'grass', icon: '❀', name: 'Overgrowth', desc: 'Grass summons heal 40% more.' },
  { id: 'fishx',      r: 'rare', max: 2, tag: 'fish', icon: '≈', name: 'Deep Current', desc: 'Fish shields are 50% stronger.' },
  { id: 'spiritx',    r: 'rare', max: 2, tag: 'spirit', icon: '✧', name: 'Spirit Link', desc: 'Spirit summons attack 30% faster.' },
  { id: 'dragonx',    r: 'rare', max: 2, tag: 'dragon', icon: '♆', name: 'Dragon Heart', desc: 'Dragon summons deal +35% damage.' },
  { id: 'celestx',    r: 'rare', max: 2, tag: 'celestial', icon: '☀', name: 'Heavenly Choir', desc: 'Celestial summons get +25% HP and damage.' },
  { id: 'twin',       r: 'legendary', max: 1, icon: '♊', name: 'Mirror Grimoire', desc: 'Every summon arrives with a free twin.' },
  { id: 'execute',    r: 'legendary', max: 1, icon: '⚚', name: 'Reaper Pact',     desc: 'Summon hits kill normal enemies below 12% HP.' },
  { id: 'phoenix',    r: 'legendary', max: 1, icon: '♨', name: 'Phoenix Feather', desc: 'Once this stage, rise again at 50% HP when you fall.' },
  { id: 'godhand',    r: 'legendary', max: 1, icon: '☩', name: 'Hand of the Abyss', desc: 'Summons deal +40% damage and +2 capacity.' },
  { id: 'timewarp',   r: 'legendary', max: 1, icon: '⌛', name: 'Time Warp',       desc: 'Summon cooldowns halved and +50% mana regeneration.' },
  { id: 'starfall',   r: 'legendary', max: 1, icon: '★', name: 'Starfall',        desc: 'Kills have a 5% chance to call down a falling star.' },
];
const RU_BY_ID = Object.fromEntries(RUN_UPGRADES.map(u => [u.id, u]));
const ru = id => (W && W.active && W.ru && W.ru[id]) || 0;
const runExpNext = l => 30 + 20 * l;
const runActive = () => W && W.active && !W.isRaid;

function runExp(v) {
  if (!runActive() || W.won || W.player.dead) return;
  const unit = Math.max(0.01, W.sm.exp * W.mode.exp * W.rewardMult);
  W.rx = (W.rx || 0) + v / unit;
  while (W.rx >= runExpNext(W.rl)) { W.rx -= runExpNext(W.rl); W.rl++; W.ruPending++; }
  if (W.ruPending > 0 && !W.choosing) openRunChoice();
}
function runPool() {
  const tags = new Set(SAVE.hotbar.filter(Boolean).flatMap(id => CARDS[id].tags));
  return RUN_UPGRADES.filter(u => ru(u.id) < u.max && (!u.tag || tags.has(u.tag)));
}
function rollRunChoices(n = 3) {
  const pool = runPool(), out = [];
  while (out.length < n && pool.length) {
    const tot = pool.reduce((a, u) => a + RU_RARITY[u.r].w, 0);
    let x = Math.random() * tot, k = 0;
    for (; k < pool.length - 1; k++) { x -= RU_RARITY[pool[k].r].w; if (x <= 0) break; }
    out.push(pool.splice(k, 1)[0]);
  }
  return out;
}
function openRunChoice() {
  if (W.choosing || W.endT >= 0) return;
  const list = rollRunChoices();
  W.ruPending = Math.max(0, W.ruPending - 1);
  if (!list.length) return;
  W.choosing = list; W.choosingKind = 'run';
  INPUT.keys.clear();
  showRunModal(list);
  SFX.level();
}
function showRunModal(list) {
  const box = $('boostCards'); box.innerHTML = '';
  $('boostModal').querySelector('.bm-head').textContent = `Run level ${W.rl}! Choose an upgrade for this stage`;
  $('boostModal').classList.add('run');
  list.forEach((u, i) => {
    const n = ru(u.id), rr = RU_RARITY[u.r];
    const el = document.createElement('button');
    el.className = 'boost ru-' + u.r;
    el.style.setProperty('--rc', rr.col);
    el.innerHTML = `<div class="b-key">${INPUT.touchMode ? '' : i + 1}</div><div class="b-rar">${rr.label}</div><div class="b-icon">${u.icon}</div><div class="b-name">${u.name}${n ? ` <span class="muted">×${n + 1}</span>` : ''}</div><div class="b-desc">${u.desc}</div>`;
    el.onclick = () => pickBoost(i);
    box.appendChild(el);
  });
  $('boostModal').classList.remove('hidden');
}
function pickRun(i) {
  const u = W.choosing && W.choosing[i];
  if (!u) return;
  const p = W.player;
  W.ru[u.id] = (W.ru[u.id] || 0) + 1;
  W.choosing = null; W.choosingKind = null;
  $('boostModal').classList.remove('run');
  $('boostModal').querySelector('.bm-head').textContent = 'Your soul resonates. Choose a boost';
  hideBoostModal();
  refreshStats();
  if (u.id === 'heart') healPlayer(p.maxHp * 0.2);
  burst(p.x, p.y, RU_RARITY[u.r].col, 40, 300, 0.9, 6);
  ring(p.x, p.y, RU_RARITY[u.r].col, 10, 140, 0.6, 4);
  toast(`${u.name}${W.ru[u.id] > 1 ? ' ×' + W.ru[u.id] : ''}: ${u.desc}`, 'card');
  SFX.enhance();
  if (W.ruPending > 0) setTimeout(() => { if (W.active && !W.choosing && !W.won) openRunChoice(); }, 350);
}

// ---- hooks into the core game ----
const _ru_startStage = startStage;
startStage = function (idx, kind) {
  _ru_startStage(idx, kind);
  Object.assign(W, { ru: {}, rl: 0, rx: 0, ruPending: 0, choosingKind: null, ruNovaT: 6, ruMeteorT: 10, ruTrailT: 0, ruPageA: 0, phoenixUsed: false });
};
const _ru_pickBoost = pickBoost;
pickBoost = function (i) {
  if (W.choosingKind === 'run') { pickRun(i); return; }
  _ru_pickBoost(i);
  if (W.ruPending > 0 && !W.choosing) setTimeout(() => { if (W.active && !W.choosing && !W.won) openRunChoice(); }, 350);
};
const _ru_gainExp = gainExp;
gainExp = function (v) { _ru_gainExp(v); runExp(v); };

const _ru_pstat = pstat;
pstat = function (withBoosts = true) {
  const s = _ru_pstat(withBoosts);
  if (!withBoosts || !W || !W.active || !W.ru) return s;
  s.hp = Math.round(s.hp * (1 + 0.12 * ru('heart')));
  s.regen *= (1 + 0.2 * ru('wellspring')) * (ru('timewarp') ? 1.5 : 1);
  s.cap += ru('page') + 2 * ru('godhand');
  s.stone *= 1 + 0.3 * ru('sling');
  s.speed *= 1 + 0.08 * ru('stride');
  s.magnet *= 1 + 0.3 * ru('reach');
  s.cdMult *= Math.pow(0.92, ru('focus')) * (ru('timewarp') ? 0.5 : 1);
  s.skillCd *= Math.pow(0.85, ru('quickskill'));
  s.soul *= 1 + 0.3 * ru('soulfeed');
  return s;
};
const _ru_rv = rv;
rv = function (eff) {
  let v = _ru_rv(eff);
  if (W && W.active && W.ru) {
    if (eff === 'armor') v += 0.06 * ru('ward');
    else if (eff === 'poison') v += 0.15 * ru('venom');
    else if (eff === 'swarmExtra') v += ru('swarmx');
    else if (eff === 'stoneGain') v += 0.2 * ru('greed');
  }
  return v;
};
const RU_TAG_DMG = { bird: ['birdx', 0.35], dragon: ['dragonx', 0.35], celestial: ['celestx', 0.25] };
const _ru_sMult = sMult;
sMult = function (s) {
  let m = _ru_sMult(s) * (1 + 0.12 * ru('might')) * (1 + 0.4 * ru('godhand'));
  for (const tg of s.c.tags || []) { const d = RU_TAG_DMG[tg]; if (d) m *= 1 + d[1] * ru(d[0]); }
  if (s.evo) m *= EVO_STYLES[s.evo].dmg;
  return m;
};
const _ru_makeSummon = makeSummon;
makeSummon = function (id, x, y) {
  const s = _ru_makeSummon(id, x, y), tg = s.c.tags || [];
  let hpM = 1 + 0.15 * ru('vigor');
  if (tg.includes('stone')) hpM *= 1 + 0.4 * ru('stonex');
  if (tg.includes('celestial')) hpM *= 1 + 0.25 * ru('celestx');
  const evo = evoOf(id);
  if (evo) { s.evo = evo; hpM *= EVO_STYLES[evo].hp; }
  s.hp *= hpM; s.maxHp *= hpM;
  s.atkCd /= (1 + 0.15 * ru('haste')) * (tg.includes('spirit') ? 1 + 0.3 * ru('spiritx') : 1) * (evo === 'storm' ? 1.15 : 1);
  if (tg.includes('grass')) s.heal *= 1 + 0.4 * ru('grassx');
  if (tg.includes('fish')) s.shieldAmt *= 1 + 0.5 * ru('fishx');
  if (evo === 'titan') s.r *= 1.15;
  return s;
};
// free copies from Echo Summon / Mirror Grimoire (they never use capacity)
const _ru_trySummon = trySummon;
trySummon = function (slot) {
  const n0 = W.summons ? W.summons.length : 0;
  _ru_trySummon(slot);
  if (!W.active || !W.summons || W.summons.length <= n0) return;
  const id = SAVE.hotbar[slot], extra = (ru('twin') ? 1 : 0) + (Math.random() < 0.2 * ru('echo') ? 1 : 0);
  for (let k = 0; k < extra; k++) {
    const base = W.summons[W.summons.length - 1];
    const s = makeSummon(id, base.x + rand(-24, 24), base.y + rand(-24, 24));
    s.c = Object.assign({}, s.c, { weight: 0 });
    W.summons.push(s);
    ring(s.x, s.y, '#c78bff', 6, 40, 0.4, 3);
  }
};
let RU_CHAINING = false;
function chainSpark(from, dmg, src, n = 2) {
  RU_CHAINING = true;
  const hit = new Set([from]);
  let cur = from;
  for (let k = 0; k < n; k++) {
    const nx = nearestEnemy(cur.x, cur.y, 170, e => !hit.has(e));
    if (!nx) break;
    hit.add(nx);
    W.bolts.push({ pts: lightningPts(cur.x, cur.y, nx.x, nx.y), t: 0, dur: 0.22, color: '#9fd6ff' });
    damageEnemy(nx, dmg * 0.6, src, { quiet: true, color: '#9fd6ff' });
    cur = nx;
  }
  RU_CHAINING = false;
}
const _ru_damageEnemy = damageEnemy;
damageEnemy = function (e, dmg, src, opts) {
  _ru_damageEnemy(e, dmg, src, opts);
  if (!src || !src.c || RU_CHAINING || !W.active) return;
  if (!e.dead && !e.isBoss && ru('execute') && e.hp < e.maxHp * 0.12) { txt(e.x, e.y - e.r - 10, 'REAP', '#ff8095', 12, 0.6); killEnemy(e, src); return; }
  if (!e.dead && Math.random() < 0.1 * ru('chain')) chainSpark(e, dmg, src);
  if (src.evo && !(opts && opts.quiet)) evoOnHit(src, e, dmg);
};
const _ru_killEnemy = killEnemy;
killEnemy = function (e, src) {
  const was = e.dead;
  _ru_killEnemy(e, src);
  if (was || !e.dead || !W.active || e.isBoss) return;
  if (src && src.c && ru('vamp')) healPlayer(W.player.maxHp * 0.006 * ru('vamp'), true);
  if (Math.random() < 0.12 * ru('bomb')) W.later.push({ t: 0.15, fn: () => allyBlast(e.x, e.y, 70, W.ps.stone * 3, '#ff7a2e', null) });
  if (ru('starfall') && Math.random() < 0.05) starfall(e.x, e.y);
};
function starfall(x, y) {
  W.bolts.push({ pts: lightningPts(x + rand(-40, 40), y - 360, x, y), t: 0, dur: 0.3, color: '#fff2a8' });
  allyBlast(x, y, 120, W.ps.stone * 12 * (1 + 0.1 * SAVE.level), '#fff2a8', null, { stun: 0.6 });
}
const _ru_killSummon = killSummon;
killSummon = function (s, forced) {
  const was = s.dead;
  _ru_killSummon(s, forced);
  if (was || !s.dead || forced || s.isSplit || !ru('split') || !(s.c.tags || []).includes('beast')) return;
  for (let k = 0; k < 2; k++) {
    const n = makeSummon(s.id, s.x + rand(-18, 18), s.y + rand(-18, 18));
    n.c = Object.assign({}, n.c, { weight: 0 }); n.isSplit = true;
    n.hp = n.maxHp = n.maxHp * 0.5; n.dmg *= 0.6; n.r *= 0.75;
    W.summons.push(n);
  }
  burst(s.x, s.y, s.col, 20, 200, 0.5, 4);
};
const _ru_playerDie = playerDie;
playerDie = function () {
  const p = W.player;
  if (ru('phoenix') && !W.phoenixUsed) {
    W.phoenixUsed = true; p.hp = p.maxHp * 0.5; p.inv = 2.5;
    burst(p.x, p.y, '#ffcf5a', 80, 380, 1.2, 8, 'glow', { grav: -120 });
    ring(p.x, p.y, '#ff8a3d', 10, 200, 0.8, 5);
    allyBlast(p.x, p.y, 220, W.ps.stone * 10, '#ff8a3d', null, { knock: 400 });
    banner('REBORN IN FLAME', 'level');
    return;
  }
  _ru_playerDie();
};
const _ru_hitAlly = hitAlly;
hitAlly = function (t, dmg, src) {
  _ru_hitAlly(t, dmg, src);
  if (t === W.player && src && src.hp !== undefined && !src.dead && !src.isBoss && ru('thorns')) damageEnemy(src, W.ps.stone * 3 * ru('thorns'), null, { quiet: true, color: '#9dffb0' });
};
const _ru_addOverdrive = addOverdrive;
addOverdrive = function (v) { _ru_addOverdrive(v * (1 + 0.4 * ru('overflow'))); };
const _ru_addCardExp = addCardExp;
addCardExp = function (id, v) { _ru_addCardExp(id, v * (1 + 0.2 * ru('insight'))); };

// per-frame run effects (runs inside the live update, right after zones)
const _ru_updateZones = updateZones;
updateZones = function (dt) {
  _ru_updateZones(dt);
  if (W.ru) runUpdate(dt);
};
function runUpdate(dt) {
  const p = W.player;
  if (p.dead) return;
  if (ru('mend')) healPlayer(p.maxHp * 0.005 * ru('mend') * dt, true);
  if (ru('firetrail') && p.dashT > 0) { W.ruTrailT -= dt; if (W.ruTrailT <= 0) { W.ruTrailT = 0.035; addZone('fire', p.x, p.y, 34, 2.4, W.ps.stone * 0.8, null, 0.35); } }
  if (ru('nova')) {
    W.ruNovaT -= dt;
    if (W.ruNovaT <= 0) {
      W.ruNovaT = 6 / ru('nova');
      allyBlast(p.x, p.y, 150, W.ps.stone * 2, '#bff6ff', null);
      enemiesNear(p.x, p.y, 150, e => { if (!e.dead && dist2(e, p) < 150 * 150) { e.slowF = Math.max(e.slowT > 0 ? e.slowF : 0, 0.7 * (e.isBoss ? 0.4 : 1)); e.slowT = Math.max(e.slowT, 2); } });
    }
  }
  if (ru('meteor')) {
    W.ruMeteorT -= dt;
    if (W.ruMeteorT <= 0) {
      W.ruMeteorT = 10 / ru('meteor');
      const tgt = crowdCenter();
      if (tgt) { W.bolts.push({ pts: lightningPts(tgt.x - 120, tgt.y - 380, tgt.x, tgt.y), t: 0, dur: 0.3, color: '#ff8a3d' }); W.later.push({ t: 0.25, fn: () => { allyBlast(tgt.x, tgt.y, 140, W.ps.stone * 9 * (1 + 0.08 * SAVE.level), '#ff7a2e', null, { knock: 260 }); addZone('fire', tgt.x, tgt.y, 90, 3, W.ps.stone, null); } }); }
    }
  }
  const pages = 2 * ru('orbit');
  if (pages) {
    W.ruPageA += dt * 3.2;
    const R = 78;
    for (let k = 0; k < pages; k++) {
      const a = W.ruPageA + (k / pages) * TAU, x = p.x + Math.cos(a) * R, y = p.y + Math.sin(a) * R * 0.85;
      spawnP({ x, y, life: 0.09, size: 7, color: '#e2c6ff', drag: 1 });
      if ((W.t * 10 | 0) % 2 === k % 2) enemiesNear(x, y, 22, e => { if (!e.dead && dist2(e, { x, y }) < (e.r + 14) ** 2 && (e.pageT || 0) < W.t) { e.pageT = W.t + 0.35; damageEnemy(e, W.ps.stone * 1.4, null, { quiet: true, color: '#e2c6ff' }); } });
    }
  }
}
function crowdCenter() {
  let best = null, bn = 0;
  const list = W.enemies.filter(e => !e.dead && !e.isBoss);
  for (let k = 0; k < Math.min(12, list.length); k++) {
    const c = list[randi(0, list.length - 1)];
    let n = 0; enemiesNear(c.x, c.y, 120, e => { if (!e.dead) n++; });
    if (n > bn) { bn = n; best = c; }
  }
  return best ? { x: best.x, y: best.y } : (W.boss && !W.boss.dead ? { x: W.boss.x, y: W.boss.y } : null);
}

// HUD: run level badge + run upgrade icons
const _ru_updateHUD = updateHUD;
updateHUD = function () {
  _ru_updateHUD();
  if (!W.ru) return;
  let el = $('runLv');
  if (!el) {
    el = document.createElement('div'); el.id = 'runLv'; el.className = 'run-lv';
    el.innerHTML = '<span class="rl-t">RUN <b id="runLvN">0</b></span><div class="rl-bar"><div class="fill" id="runLvFill"></div></div><div id="runIcons"></div>';
    document.querySelector('#hud .bars').appendChild(el);
  }
  $('runLvN').textContent = W.rl;
  $('runLvFill').style.width = Math.min(100, 100 * W.rx / runExpNext(W.rl)) + '%';
  const key = Object.entries(W.ru).map(([k, n]) => k + n).join();
  if (el.dataset.k !== key) {
    el.dataset.k = key;
    $('runIcons').innerHTML = Object.entries(W.ru).map(([id, n]) => { const u = RU_BY_ID[id]; return `<span class="bicon ru-${u.r}" title="${u.name}: ${u.desc}">${u.icon}${n > 1 ? '<sub>' + n + '</sub>' : ''}</span>`; }).join('');
  }
};

// ================= evolution paths =================
// Each of the 64 base cards gets two evolution paths at awakening: one power path and one support path.
const EVO_STYLES = {
  inferno: { name: 'Inferno', lean: 'power',   col: '#ff6a2e', dmg: 1.25, hp: 1,    desc: '+25% damage. Hits can ignite the ground.', sk: 'Special skill also erupts a fire field under each of its summons.' },
  shadow:  { name: 'Shadow',  lean: 'power',   col: '#9b5cff', dmg: 1.2,  hp: 1,    desc: '+20% damage. Hits finish off weakened foes.', sk: 'Special skill also slashes every enemy near its summons.' },
  storm:   { name: 'Storm',   lean: 'power',   col: '#7fd3ff', dmg: 1.1,  hp: 1,    desc: '+10% damage, +15% attack speed. Hits can chain lightning.', sk: 'Special skill also calls lightning on 6 enemies.' },
  venom:   { name: 'Venom',   lean: 'power',   col: '#7dff5a', dmg: 1.15, hp: 1,    desc: '+15% damage. Hits poison.', sk: 'Special skill also leaves poison clouds.' },
  frost:   { name: 'Frost',   lean: 'support', col: '#bff6ff', dmg: 1,    hp: 1.3,  desc: '+30% HP. Hits slow enemies.', sk: 'Special skill also freezes nearby enemies.' },
  radiant: { name: 'Radiant', lean: 'support', col: '#fff2a8', dmg: 1,    hp: 1.25, desc: '+25% HP. Hits mend Allen.', sk: 'Special skill also heals Allen and all summons by 20%.' },
  titan:   { name: 'Titan',   lean: 'support', col: '#ffcf5a', dmg: 1.05, hp: 1.5,  desc: '+50% HP, larger. Hits knock enemies back.', sk: 'Special skill also sends out a stunning shockwave.' },
  arcane:  { name: 'Arcane',  lean: 'support', col: '#c78bff', dmg: 1,    hp: 1.2,  desc: '+20% HP. Hits can restore mana.', sk: 'Special skill also restores 25 mana and shields Allen.' },
};
const EVO_POWER = ['inferno', 'shadow', 'storm', 'venom'], EVO_SUPPORT = ['frost', 'radiant', 'titan', 'arcane'];
const EVO_RESPEC = 200;
const strHash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const evoPaths = id => (CARDS[id].fusion ? null : [EVO_POWER[strHash(id) % 4], EVO_SUPPORT[(strHash(id) >>> 3) % 4]]);
const evoOf = id => (SAVE && SAVE.awakened[id] && SAVE.evo && SAVE.evo[id]) || null;
const evoName = id => (evoOf(id) ? EVO_STYLES[evoOf(id)].name + ' ' : '') + CARDS[id].name;
function hueOf(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return 0;
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
// how far to rotate a card's own colours toward its path colour
function evoHue(id) {
  const e = evoOf(id);
  if (!e) return 0;
  let d = hueOf(EVO_STYLES[e].col) - hueOf(CARDS[id].color);
  if (d > 180) d -= 360; if (d < -180) d += 360;
  return Math.round(d);
}
function chooseEvo(id, style) {
  const paths = evoPaths(id);
  if (!paths || !paths.includes(style) || !SAVE.awakened[id]) return false;
  if (SAVE.evo[id] === style) return false;
  if (SAVE.evo[id]) { if (SAVE.stones < EVO_RESPEC) return false; SAVE.stones -= EVO_RESPEC; }
  SAVE.evo[id] = style;
  saveGame();
  return true;
}
function evoOnHit(s, e, dmg) {
  const st = s.evo, p = W.player;
  if (st === 'inferno') { if (Math.random() < 0.12) addZone('fire', e.x, e.y, 42, 1.6, s.dmg * 0.4, s, 0.4); }
  else if (st === 'shadow') { if (!e.dead && !e.isBoss && e.hp < e.maxHp * 0.1) { burst(e.x, e.y, '#9b5cff', 10, 160, 0.4, 4); killEnemy(e, s); } }
  else if (st === 'storm') { if (!e.dead && Math.random() < 0.12) chainSpark(e, dmg, s, 2); }
  else if (st === 'venom') { if (!e.dead) { e.poisonT = 3; e.poisonD = Math.max(e.poisonD, s.dmg * 0.5); e.poisonSrc = s; } }
  else if (st === 'frost') { if (!e.dead) { e.slowF = Math.max(e.slowT > 0 ? e.slowF : 0, 0.4 * (e.isBoss ? 0.4 : 1)); e.slowT = Math.max(e.slowT, 1); } }
  else if (st === 'radiant') { if ((s.radT || 0) < W.t) { s.radT = W.t + 0.5; healPlayer(p.maxHp * 0.006, true); } }
  else if (st === 'titan') { if (!e.dead && !e.isBoss) { const a = angTo(s, e); e.kx += Math.cos(a) * 160; e.ky += Math.sin(a) * 160; } }
  else if (st === 'arcane') { if (Math.random() < 0.06) p.mp = Math.min(p.maxMp, p.mp + 2); }
}
const EVO_SKILL = {
  inferno: mine => { for (const s of mine) addZone('fire', s.x, s.y, 90, 3, s.dmg * 0.8 * sMult(s), s); },
  shadow: mine => { for (const s of mine) enemiesNear(s.x, s.y, 130, e => { if (!e.dead && dist2(e, s) < 130 * 130) damageEnemy(e, s.dmg * 3 * sMult(s), s, { quiet: true, color: '#c9a6ff' }); }); },
  storm: mine => { const s = mine[0]; for (let k = 0; k < 6; k++) { const e = nearestEnemy(s.x + rand(-200, 200), s.y + rand(-200, 200), 300); if (!e) break; W.bolts.push({ pts: lightningPts(e.x + rand(-30, 30), e.y - 320, e.x, e.y), t: 0, dur: 0.3, color: '#bff6ff' }); damageEnemy(e, s.dmg * 4 * sMult(s), s); } },
  venom: mine => { for (const s of mine) addZone('poison', s.x, s.y, 95, 4, s.dmg * 1.5, s); },
  frost: mine => { for (const s of mine) { addZone('frost', s.x, s.y, 110, 2.5, s.dmg * 0.4, s); enemiesNear(s.x, s.y, 110, e => { if (!e.dead && dist2(e, s) < 110 * 110) stun(e, 1.2); }); } },
  radiant: mine => { const p = W.player; healPlayer(p.maxHp * 0.2); for (const o of W.summons) if (!o.dead && !o.down) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.2); ring(p.x, p.y, '#fff2a8', 10, 220, 0.7, 4); },
  titan: mine => { for (const s of mine) allyBlast(s.x, s.y, 140, s.dmg * 2 * sMult(s), '#ffcf5a', s, { stun: 1, knock: 320 }); },
  arcane: mine => { const p = W.player; p.mp = Math.min(p.maxMp, p.mp + 25); p.shield = Math.max(p.shield, p.maxHp * 0.15); ring(p.x, p.y, '#c78bff', 10, 120, 0.6, 4); },
};
const _ru_useCardSkill = useCardSkill;
useCardSkill = function (slot) {
  const id = SAVE.hotbar[slot], before = id ? W.cskCd[id] || 0 : 0;
  _ru_useCardSkill(slot);
  if (!id || !W.active || before > 0 || !((W.cskCd[id] || 0) > 0)) return;
  const e = evoOf(id);
  if (e) { const mine = W.summons.filter(s => s.id === id && !s.dead); if (mine.length) EVO_SKILL[e](mine); }
};

// evolved summons are drawn in their path's colours, with a glow
const _ru_drawEntity = drawEntity;
drawEntity = function (c, e, kind, t) {
  if (kind !== 'summon' || !e.evo) { _ru_drawEntity(c, e, kind, t); return; }
  const hue = e.evoHue ?? (e.evoHue = evoHue(e.id));
  if (gfxLevel() !== 'low') glowAt(c, e.x, e.y, e.r * 3.2, EVO_STYLES[e.evo].col, 0.16);
  if (hue && gfxLevel() !== 'low') { c.save(); c.filter = `hue-rotate(${hue}deg) saturate(1.15)`; _ru_drawEntity(c, e, kind, t); c.restore(); }
  else _ru_drawEntity(c, e, kind, t);
};
const _ru_renderCardIcon = renderCardIcon;
renderCardIcon = function (cv, id, locked) {
  _ru_renderCardIcon(cv, id, locked);
  const h = !locked && evoOf(id) ? evoHue(id) : 0;
  cv.style.filter = h ? `hue-rotate(${h}deg) saturate(1.15)` : '';
};
// Grimoire card: choose or change the evolution path once a card is awakened
const _ru_cardEl = cardEl;
cardEl = function (id) {
  const el = _ru_cardEl(id), paths = evoPaths(id);
  if (!paths || !SAVE.awakened[id]) return el;
  const cur = evoOf(id);
  const nm = el.querySelector('.cname');
  if (nm && cur) nm.textContent = '✦ ' + evoName(id);
  const row = document.createElement('div');
  row.className = 'evo-row';
  row.innerHTML = `<span class="evo-h">${cur ? 'Evolution' : 'Choose an evolution'}</span>` + paths.map(st => {
    const S = EVO_STYLES[st], on = cur === st;
    return `<button class="btn small evo-btn ${on ? 'on' : ''}" data-evo="${st}" style="--ec:${S.col}" ${on ? 'disabled' : ''} title="${S.desc} ${S.sk}">${S.name}${cur && !on ? ` ◆${EVO_RESPEC}` : ''}<small>${S.lean}</small></button>`;
  }).join('');
  const host = el.querySelector('.desc');
  (host ? host.parentNode : el).insertBefore(row, host ? host.nextSibling : null);
  row.querySelectorAll('[data-evo]').forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    if (chooseEvo(id, b.dataset.evo)) { SFX.summon(9); toast(`${evoName(id)}: ${EVO_STYLES[b.dataset.evo].desc}`, 'ach'); rebuildGrimoireKeepScroll(); }
    else { SFX.fail(); toast(`Changing paths costs ◆ ${EVO_RESPEC}`, 'fail'); }
  });
  return el;
};
