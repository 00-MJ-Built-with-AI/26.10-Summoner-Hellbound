'use strict';
// ---------- v9: Abyss Tower checkpoint (start at your best floor with the rewards of the floors below),
//            and Auto-finish: clear content you have already beaten N times at once, using an estimate
//            of your team's power instead of playing it out ----------

// ================= team power estimate =================
// One number for "how strong is this hotbar": damage per second, healing, shields and HP of every card,
// with card level, stars, awakening, talents and Paragon. Compared with what each stage needs.
function cardPower(id) {
  const c = CARDS[id], cs = SAVE.cards[id];
  if (!c || !cs) return 0;
  const lvMul = CARD_PROG.mult(cs.lv, cs.enh) * (SAVE.awakened[id] ? 1.5 : 1) * (1 + 0.15 * Math.max(0, awkLv(id) - 1));
  const dps = ((c.dmg || 0) + (c.bite || 0) * 0.6) / (c.atkCd || 1) * (c.chain ? 1 + c.chain * 0.5 : 1) * (c.splash ? 1.6 : 1) * (c.pierce ? 1 + 0.15 * c.pierce : 1);
  const support = (c.heal || 0) * 0.6 + (c.shield || 0) * 0.15 + (c.buff || 0) * 60 + (c.aura && c.ai === 'thorns' ? (c.dmg || 0) * 3 : 0);
  return (dps + support + (c.hp || 0) / 40) * (c.count || 1) * lvMul;
}
function teamPower(hotbar = SAVE.hotbar) {
  const ids = hotbar.filter(Boolean);
  const ps = pstat(false), syn = activeSynergies(hotbar).length;
  const wrath = (1 + 0.02 * tlx('wrath')) * (1 + pgVal('might')) * (1 + bVal('forge'));
  return ids.reduce((a, id) => a + cardPower(id), 0) * ps.sumMult * wrath * (1 + 0.08 * syn) * (1 + ps.cap / 40) + ps.stone * 2;
}
// what a typical player brings to a stage at its recommended level (same rule the balance probe uses)
function typicalPower(L) {
  const ranks = RANKS.filter(r => r.level <= L).map(r => r.id), pick = [];
  for (const rk of [...ranks].reverse()) for (const id of CARD_IDS) if (!CARDS[id].fusion && !CARDS[id].legend && CARDS[id].rank === rk && pick.length < 6 && !pick.includes(id)) { pick.push(id); break; }
  const lv = Math.max(1, Math.round(L * 0.65)), enh = Math.min(5, Math.floor(L / 10));
  return pick.reduce((a, id) => { const c = CARDS[id]; const dps = ((c.dmg || 0) + (c.bite || 0) * 0.6) / (c.atkCd || 1) * (c.chain ? 1 + c.chain * 0.5 : 1) * (c.splash ? 1.6 : 1); return a + (dps + (c.heal || 0) * 0.6 + (c.shield || 0) * 0.15 + (c.buff || 0) * 60 + (c.hp || 0) / 40) * (c.count || 1) * CARD_PROG.mult(lv, enh); }, 0);
}
// calibration: power per unit of stage enemy HP that the simulated runs needed to win
const POWER_K = (() => { const r = STAGES.map((s, i) => typicalPower(s.rec) / stageMultFor(i).hp).sort((a, b) => a - b); return r[r.length >> 1]; })();
const stageNeed = (i, diff = 0, tier = 0) => POWER_K * stageMultFor(i).hp * DIFFS[diff].hp * (1 + 0.25 * tier) * ((typeof BALANCE !== 'undefined' && BALANCE[i]) ? Math.sqrt(BALANCE[i].dmg * BALANCE[i].boss) : 1);
const towerNeed = f => POWER_K * towerMult(f).hp * (1 + 0.02 * f);   // tower enemies also hit harder each floor

// ================= offline reward helpers (no battle running) =================
function grantExpOffline(v) {
  if (v <= 0) return 0;
  const l0 = SAVE.level;
  SAVE.exp += v;
  while (SAVE.exp >= PLAYER.expNext(SAVE.level)) { SAVE.exp -= PLAYER.expNext(SAVE.level); SAVE.level++; }
  if (SAVE.level >= 40) checkTierUnlock();
  return SAVE.level - l0;
}
function grantCardExpOffline(ids, v) {
  const each = v / Math.max(1, ids.length) * (1 + 0.03 * tlx('scholar')) * (1 + pgVal('wisdom')) * (1 + bVal('library'));
  for (const id of ids) {
    const cs = SAVE.cards[id];
    cs.exp += each;
    while (cs.exp >= CARD_PROG.expNext(cs.lv)) { cs.exp -= CARD_PROG.expNext(cs.lv); cs.lv++; }
  }
}
const avgEnemyExp = enemies => { let w = 0, e = 0; for (const k in enemies) { if (!ENEMIES[k]) continue; w += enemies[k]; e += enemies[k] * ENEMIES[k].exp; } return w ? e / w : 5; };
// expected rewards from one clear of stage i (difficulty d, tier t), matching what a real run pays on average
function stageYield(i, d = 0, t = 0) {
  const s = STAGES[i], sm = stageMultFor(i), mode = MODES[SAVE.mode];
  const mult = DIFFS[d].reward * tierReward(t);
  const kills = Math.min(1600, 2.6 * s.density * s.duration);
  const boss = BOSSES[s.boss] || {};
  const exp = (kills * avgEnemyExp(s.enemies) * sm.exp + 120 * (i + 1) * (i >= 8 ? 1.5 : 1)) * mode.exp * mult;
  const stones = Math.round((kills * 0.16 + (boss.stones || 100)) * mode.stones * mult * (1 + rv('stoneGain')));
  return { kills, exp, stones, essence: i >= 8 ? (boss.final ? 2 : 1) + (t >= 3 ? 1 : 0) : 0, mat: bossMaterial(i), mats: (boss.final ? 3 : 1) + (t >= 2 ? 1 : 0) };
}
function towerFloorYield(f) {
  const mode = MODES[SAVE.mode], sm = towerMult(f), st = towerStage(f);
  const kills = st.bossFloor ? 10 : Math.min(400, 2.6 * st.density * 40);
  return {
    exp: (kills * avgEnemyExp(st.enemies) * sm.exp + (st.bossFloor ? 120 * (towerTier(f) + 1) : 0)) * mode.exp,
    stones: Math.round(3 * f * mode.stones + kills * 0.16 * mode.stones), kills,
    essence: st.bossFloor && f >= 20 ? 1 : 0, mat: st.bossFloor ? bossMaterial(Math.min(27, f)) : null,
  };
}
function addYield(total, y, n = 1) {
  total.exp += (y.exp || 0) * n; total.stones += (y.stones || 0) * n; total.essence += (y.essence || 0) * n; total.kills += (y.kills || 0) * n;
  if (y.mat) total.mats[y.mat] = (total.mats[y.mat] || 0) + (y.mats || 1) * n;
  return total;
}
const emptyYield = () => ({ exp: 0, stones: 0, essence: 0, kills: 0, mats: {} });
function payYield(t, ids) {
  const ev = typeof activeEvent === 'function' ? activeEvent() : null;
  const lv = grantExpOffline(t.exp);
  grantCardExpOffline(ids, t.exp * 0.6);
  SAVE.stones += t.stones; SAVE.essence += t.essence;
  for (const k in t.mats) SAVE.mats[k] = (SAVE.mats[k] || 0) + t.mats[k];
  SAVE.stats.kills += Math.round(t.kills); SAVE.counters.bosses += t.bosses || 0;
  let candy = 0;
  if (ev) { candy = Math.round(t.kills * 0.05 + (t.bosses || 0) * 15); const st = evState(ev.id); st.cur += candy; st.earned += candy; }
  saveGame(); checkAch();
  return { levels: lv, candy };
}
function yieldHTML(t, extra) {
  const mats = Object.entries(t.mats).filter(([, n]) => n).map(([k, n]) => `${MATS[k].icon} ${Math.round(n)} ${MATS[k].name}`).join(' · ');
  return `<div class="info-row"><span>EXP</span><span>${fmt(t.exp)}${extra.levels ? ` (+${extra.levels} level${extra.levels > 1 ? 's' : ''})` : ''}</span></div>
    <div class="info-row"><span>Magic stones</span><span>◆ ${Math.round(t.stones).toLocaleString()}</span></div>
    ${t.essence ? `<div class="info-row"><span>Abyss Essence</span><span>✧ ${t.essence}</span></div>` : ''}
    ${mats ? `<div class="info-row"><span>Materials</span><span>${mats}</span></div>` : ''}
    ${extra.candy ? `<div class="info-row"><span>Candy</span><span>🍬 ${extra.candy}</span></div>` : ''}
    <div class="info-row"><span>Enemies defeated</span><span>${Math.round(t.kills).toLocaleString()}</span></div>`;
}
const SWEEP_COUNTS = [1, 5, 10, 25, 50, 100];
const powerLine = (have, need) => `<div class="power-line ${have >= need ? 'ok' : 'low'}">Team power <b>${Math.round(have).toLocaleString()}</b> · needed <b>${Math.round(need).toLocaleString()}</b></div>`;

// ================= auto-finish a story stage =================
function canSweepStage(i, d = SAVE.diff || 0, t = Math.min(SAVE.tier || 0, SAVE.tierMax || 0)) {
  if (!SAVE.cleared[i]) return { ok: false, why: 'Clear this stage once first' };
  const need = stageNeed(i, d, t), have = teamPower();
  if (have < need) return { ok: false, why: 'Your team is too weak for this difficulty', need, have };
  return { ok: true, need, have };
}
function sweepStage(i, n) {
  const d = SAVE.diff || 0, t = Math.min(SAVE.tier || 0, SAVE.tierMax || 0), chk = canSweepStage(i, d, t);
  if (!chk.ok) return null;
  const y = stageYield(i, d, t), total = addYield(emptyYield(), y, n);
  total.bosses = n;
  SAVE.stats.runs += n;
  SAVE.counters.summoned = SAVE.counters.summoned || {};
  for (const id of SAVE.hotbar.filter(Boolean)) SAVE.counters.summoned[id] = (SAVE.counters.summoned[id] || 0) + n * 5;
  if (d > 0) { SAVE.diffClears = SAVE.diffClears || {}; if ((SAVE.diffClears[i] ?? -1) < d) SAVE.diffClears[i] = d; }
  SAVE.counters.sweeps = (SAVE.counters.sweeps || 0) + n;
  const extra = payYield(total, SAVE.hotbar.filter(Boolean));
  return { total, extra, n };
}
// ================= auto-climb the Abyss Tower =================
function towerReach(power = teamPower()) { let f = 0; while (f < 500 && towerNeed(f + 1) <= power) f++; return f; }
function sweepTower(n) {
  const F = towerReach();
  if (F < 1) return null;
  const run = emptyYield();
  for (let f = 1; f <= F; f++) addYield(run, towerFloorYield(f));
  const total = addYield(emptyYield(), { exp: run.exp, stones: run.stones, essence: run.essence, kills: run.kills }, n);
  for (const k in run.mats) total.mats[k] = run.mats[k] * n;
  total.bosses = Math.floor(F / 5) * n;
  SAVE.towerBest = Math.max(SAVE.towerBest, F);
  SAVE.stats.runs += n;
  SAVE.counters.sweeps = (SAVE.counters.sweeps || 0) + n;
  const extra = payYield(total, SAVE.hotbar.filter(Boolean));
  return { total, extra, n, floor: F };
}
// ================= auto-run the Boss Rush =================
function sweepRush(n) {
  if (!rushUnlocked()) return null;
  const list = rushBosses(), have = teamPower();
  const run = emptyYield();
  let beaten = 0;
  for (const id of list) {
    const si = BOSS_STAGE[id];
    if (stageNeed(si) * 0.9 > have) break;
    const y = stageYield(si);
    addYield(run, { exp: y.exp * 0.25, stones: 15 * (si + 1) * MODES[SAVE.mode].stones, essence: si >= 8 ? 1 : 0, kills: 1, mat: y.mat, mats: 1 });
    beaten++;
  }
  if (!beaten) return null;
  const total = addYield(emptyYield(), { exp: run.exp, stones: run.stones, essence: run.essence, kills: run.kills }, n);
  for (const k in run.mats) total.mats[k] = run.mats[k] * n;
  total.bosses = beaten * n;
  if (beaten === list.length && list.length >= 10) SAVE.counters.rushDone = (SAVE.counters.rushDone || 0) + n;
  if (!SAVE.rushBest || beaten > SAVE.rushBest.n) SAVE.rushBest = { n: beaten, time: 9999 };
  SAVE.stats.runs += n;
  SAVE.counters.sweeps = (SAVE.counters.sweeps || 0) + n;
  const extra = payYield(total, SAVE.hotbar.filter(Boolean));
  return { total, extra, n, beaten, of: list.length };
}
function showSweepResult(title, r, line) {
  if (!r) { SFX.fail(); toast('Your team is too weak for that yet', 'fail'); return; }
  SFX.level();
  showInfoCard(title, `<p>${line}</p>${yieldHTML(r.total, r.extra)}<p class="muted">Rewards are the average of what these runs pay when played. Change your hotbar in the Grimoire to raise your team power.</p>`, 'Collect');
  $('btnInfoOk').onclick = () => { SFX.click(); $('infoCard').classList.add('hidden'); buildMap(); };
}
function sweepButtons(kind) { return `<div class="sweep-row"><span class="pick-h">Auto-finish</span>${SWEEP_COUNTS.map(n => `<button class="btn small" data-sweep="${kind}" data-n="${n}">×${n}</button>`).join('')}</div>`; }

// ================= Abyss Tower checkpoint =================
const towerStartFloor = () => (SAVE.towerFromBest === false ? 1 : Math.max(1, SAVE.towerBest || 1));
const _v9_enterTower = enterTower;
enterTower = function () {
  _v9_enterTower();
  if (!W.active || !W.isTower) return;
  const F = towerStartFloor();
  if (F <= 1) return;
  // everything the floors below would have paid
  const below = emptyYield();
  for (let f = 1; f < F; f++) addYield(below, towerFloorYield(f));
  below.bosses = Math.floor((F - 1) / 5);
  const extra = payYield(below, SAVE.hotbar.filter(Boolean));
  W.stones += below.stones; W.essence += below.essence; W.expGained += below.exp;
  for (const k in below.mats) W.mats[k] = (W.mats[k] || 0) + below.mats[k];
  // and the power a climb would have built up: run upgrades and soul boosts, picked by your priority lists
  const runPicks = Math.floor((F - 1) * 0.8), soulPicks = Math.floor((F - 1) / 4);
  for (let k = 0; k < runPicks; k++) { const list = rollRunChoices(); if (!list.length) break; const u = list[bestIndex(list, runOrder())]; W.ru[u.id] = (W.ru[u.id] || 0) + 1; W.rl++; }
  const pool = BOOSTS.filter(b => !b.tag || SAVE.hotbar.some(id => id && CARDS[id].tags.includes(b.tag)));
  for (let k = 0; k < soulPicks && pool.length; k++) { const b = pool[bestIndex(pool, soulOrder())]; W.boosts[b.id] = (W.boosts[b.id] || 0) + 1; W.picks++; W.soulMax += 20; }
  refreshStats(); W.player.hp = W.player.maxHp; W.player.mp = W.player.maxMp;
  W.floor = F - 1; W.floorsCleared = F - 1;
  nextFloor();
  buildHUD();
  setTimeout(() => { if (W.active) toast(`Started at floor ${F}: +◆ ${below.stones.toLocaleString()}${below.essence ? ` · ✧ ${below.essence}` : ''}${extra.levels ? ` · +${extra.levels} levels` : ''} · ${runPicks} run upgrades`, 'ach'); }, 700);
};

// ================= panels: auto-finish buttons + tower start choice =================
const _v9_renderStageInfo = renderStageInfo;
renderStageInfo = function () {
  _v9_renderStageInfo();
  const root = $('stageInfo'), enter = $('btnEnter');
  if (!root || !enter) return;
  if (typeof selectedStage === 'number' && SAVE.cleared[selectedStage]) {
    const chk = canSweepStage(selectedStage), y = stageYield(selectedStage, SAVE.diff || 0, Math.min(SAVE.tier || 0, SAVE.tierMax || 0));
    enter.insertAdjacentHTML('afterend', `<div class="sweep">${powerLine(chk.have ?? teamPower(), chk.need ?? stageNeed(selectedStage))}<div class="muted sweep-y">Each clear: about ◆ ${y.stones.toLocaleString()} · ${fmt(y.exp)} EXP${y.essence ? ` · ✧ ${y.essence}` : ''}</div>${chk.ok ? sweepButtons('stage') : `<div class="muted">${chk.why}</div>`}</div>`);
  } else if (selectedStage === 'tower' && towerUnlocked()) {
    const F = towerReach();
    enter.insertAdjacentHTML('beforebegin', `<div class="v8-picks"><div class="pick-h">Start floor</div><div class="pick-row">
      <button class="btn small ${SAVE.towerFromBest === false ? 'primary' : 'ghost'}" data-tstart="1">Floor 1</button>
      <button class="btn small ${SAVE.towerFromBest !== false ? 'primary' : 'ghost'}" data-tstart="best">Your best: floor ${Math.max(1, SAVE.towerBest || 1)}</button></div>
      <div class="muted">Starting higher pays everything the floors below would have given, and gives you their run upgrades and soul boosts.</div></div>`);
    enter.insertAdjacentHTML('afterend', `<div class="sweep">${powerLine(teamPower(), towerNeed(Math.max(1, F)))}<div class="muted sweep-y">Your team would reach about floor ${F}.</div>${F >= 1 ? sweepButtons('tower') : ''}</div>`);
  } else if (selectedStage === 'rush' && rushUnlocked()) {
    enter.insertAdjacentHTML('afterend', `<div class="sweep">${powerLine(teamPower(), Math.max(...rushBosses().map(b => stageNeed(BOSS_STAGE[b]) * 0.9)))}${sweepButtons('rush')}</div>`);
  }
  root.querySelectorAll('[data-tstart]').forEach(b => b.onclick = () => { SFX.click(); SAVE.towerFromBest = b.dataset.tstart === 'best'; saveGame(); renderStageInfo(); });
  root.querySelectorAll('[data-sweep]').forEach(b => b.onclick = () => {
    const n = +b.dataset.n, kind = b.dataset.sweep;
    if (kind === 'stage') { const r = sweepStage(selectedStage, n); showSweepResult('Auto-finish', r, r && `${STAGES[selectedStage].name} cleared ${n}× on ${DIFFS[SAVE.diff || 0].name}${SAVE.tier ? ` · Hell Tier ${SAVE.tier}` : ''}.`); }
    else if (kind === 'tower') { const r = sweepTower(n); showSweepResult('Auto-climb', r, r && `Abyss Tower climbed ${n}× to floor ${r.floor}.`); }
    else { const r = sweepRush(n); showSweepResult('Auto-rush', r, r && `Boss Rush run ${n}×: ${r.beaten} of ${r.of} bosses defeated each time.`); }
  });
};
ACHIEVEMENTS.push({ id: 'sweep100', name: 'Efficiency Expert', reward: 300, desc: 'Auto-finish 100 runs.', check: () => (SAVE.counters.sweeps || 0) >= 100 });
