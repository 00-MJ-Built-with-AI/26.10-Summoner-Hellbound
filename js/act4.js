'use strict';
// ---------- Act IV: The First Page — 10 stages, 8 enemies, 5 multi-phase bosses, the true ending ----------

// ===== enemies =====
Object.assign(ENEMIES, {
  clock_sentinel: { name: 'Clockwork Sentinel', hp: 95,  speed: 85,  dmg: 16, r: 14, exp: 12, ai: 'ranged',   color: '#7fffd4', draw: 'sentinel', range: 310, atkCd: 1.8, projSpeed: 360, spread: 3, pcolor: '#b8fff0' },
  time_wraith:    { name: 'Time Wraith',        hp: 90,  speed: 120, dmg: 24, r: 14, exp: 13, ai: 'blinker',  color: '#4dffd2', draw: 'stalker' },
  abyss_spawn:    { name: 'Abyss Spawn',        hp: 150, speed: 70,  dmg: 18, r: 18, exp: 14, ai: 'chase',    color: '#3a6bff', draw: 'slime', split: 'abyss_mite', splitN: 3 },
  abyss_mite:     { name: 'Abyss Mite',         hp: 26,  speed: 160, dmg: 8,  r: 9,  exp: 3,  ai: 'chase',    color: '#6a8bff', draw: 'spider' },
  shade_knight:   { name: 'Shade Knight',       hp: 240, speed: 75,  dmg: 28, r: 20, exp: 20, ai: 'charger',  color: '#8a5cff', draw: 'guardian', shield: 150 },
  mirror_witch:   { name: 'Mirror Witch',       hp: 70,  speed: 95,  dmg: 18, r: 13, exp: 11, ai: 'blinker',  color: '#ff8af0', draw: 'witch', ranged: true, range: 300, atkCd: 2, projSpeed: 360, pcolor: '#ffc2f5' },
  prism_mote:     { name: 'Prism Mote',         hp: 45,  speed: 165, dmg: 36, r: 12, exp: 7,  ai: 'exploder', color: '#ff9af5', draw: 'starmote' },
  pact_spire:     { name: 'Pact Spire',         hp: 200, speed: 0,   dmg: 15, r: 18, exp: 16, ai: 'turret',   color: '#c78bff', draw: 'spire', atkCd: 2.2, projSpeed: 240, pcolor: '#e2c6ff' },
});
Object.assign(LORE, {
  clock_sentinel: 'A soldier wound by the First Summoner. Fires three bolts in perfect rhythm.',
  time_wraith: 'Steps out of a moment that has not happened yet.',
  abyss_spawn: 'A blob of the deep abyss. It bursts into biting mites.',
  abyss_mite: 'Small, fast and hungry.',
  shade_knight: 'A shielded knight of the Shadow Court. Its charge breaks lines.',
  mirror_witch: 'Blinks between reflections and curses from range.',
  prism_mote: 'A shard of living light that shatters on contact.',
  pact_spire: 'A spire that pulses with the power of broken pacts.',
});

// ===== bosses (multi-phase: each phase swaps patterns, colours and speed at an HP threshold) =====
Object.assign(BOSS_DRAW_R, { chrono: 50, leviathan: 54, shadeking: 46, prismdragon: 54, firstsummoner: 60 });
Object.assign(BOSSES, {
  chrono_warden: {
    name: 'The Chrono Warden', r: 48, speed: 100, color: '#7fffd4', draw: 'chrono', pcolor: '#b8fff0', minion: 'clock_sentinel', stones: 260, cine: true,
    patterns: ['spiral', 'burst', 'teleport'],
    phases: [{ at: 0.5, name: 'Time Unbound', color: '#ffcf5a', pcolor: '#ffe9a8', patterns: ['spiral', 'laser', 'teleport', 'meteor', 'burst'], speed: 1.25 }],
  },
  void_leviathan: {
    name: 'The Void Leviathan', r: 52, speed: 105, color: '#3a6bff', draw: 'leviathan', pcolor: '#8fb0ff', minion: 'abyss_spawn', stones: 280, cine: true,
    patterns: ['charge', 'breath', 'summon'],
    phases: [{ at: 0.5, name: 'Abyssal Frenzy', color: '#8a5cff', pcolor: '#c4b0ff', patterns: ['charge', 'breath', 'spiral', 'summon', 'slam'], speed: 1.3 }],
  },
  shade_king: {
    name: 'Umbra, the Shade King', r: 44, speed: 125, color: '#8a5cff', draw: 'shadeking', pcolor: '#c9a6ff', minion: 'shade_knight', stones: 300, cine: true,
    patterns: ['teleport', 'slam', 'burst'],
    phases: [
      { at: 0.66, name: 'Crown of Shadows', color: '#b06bff', pcolor: '#e2c6ff', patterns: ['teleport', 'slam', 'laser', 'summon'], speed: 1.15 },
      { at: 0.33, name: 'Eternal Night', color: '#ff3355', pcolor: '#ff8095', patterns: ['teleport', 'laser', 'spiral', 'charge', 'burst'], speed: 1.35 },
    ],
  },
  prism_dragon: {
    name: 'The Prism Dragon', r: 52, speed: 115, color: '#ff9af5', draw: 'prismdragon', pcolor: '#ffd1fa', minion: 'prism_mote', stones: 320, cine: true,
    patterns: ['breath', 'laser', 'burst'],
    phases: [
      { at: 0.66, name: 'Refracted Fury', color: '#7fd3ff', pcolor: '#bff6ff', patterns: ['breath', 'laser', 'spiral', 'charge'], speed: 1.15 },
      { at: 0.33, name: 'Blinding Spectrum', color: '#ffcf5a', pcolor: '#fff2a8', patterns: ['breath', 'laser', 'meteor', 'spiral', 'burst', 'charge'], speed: 1.35 },
    ],
  },
  first_summoner: {
    name: 'Malkuth, the First Summoner', r: 58, speed: 100, color: '#e2c6ff', draw: 'firstsummoner', pcolor: '#f0e0ff', minion: 'pact_spire', stones: 600, final: true, cine: true,
    patterns: ['summon', 'laser', 'burst', 'teleport'],
    phases: [
      { at: 0.66, name: 'The Pact Unbound', color: '#ff3355', pcolor: '#ff8095', minion: 'shade_knight', patterns: ['summon', 'laser', 'meteor', 'charge', 'spiral'], speed: 1.15 },
      { at: 0.33, name: 'The Last Page', color: '#ffd66b', pcolor: '#fff2a8', minion: 'time_wraith', patterns: ['laser', 'meteor', 'spiral', 'breath', 'slam', 'teleport', 'burst', 'summon'], speed: 1.35 },
    ],
  },
});
for (const base of ['seraph_construct', 'blood_queen', 'eclipse_knight', 'astral_serpent', 'storm_roc']) {
  const b = BOSSES[base], extra = { seraph_construct: 'spiral', blood_queen: 'meteor', eclipse_knight: 'spiral', astral_serpent: 'burst', storm_roc: 'meteor' }[base];
  BOSSES['aw_' + base] = Object.assign({}, b, { name: 'Awakened ' + b.name.replace(/^The /, ''), base, awakened: true, patterns: [...b.patterns, extra], stones: (b.stones || 100) + 80, title: 'Risen once more, stronger than before' });
}
Object.assign(BOSS_TITLES, {
  chrono_warden: 'Keeper of the Stopped Hour', void_leviathan: 'That Which Swims Beneath', shade_king: 'Lord of the Shadow Court',
  prism_dragon: 'Wings of Broken Light', first_summoner: 'Author of the Grimoire',
});
for (const k of ['chrono_warden', 'void_leviathan', 'shade_king', 'prism_dragon', 'first_summoner']) BOSSES[k].title = BOSS_TITLES[k];
Object.assign(LORE, {
  chrono_warden: 'Freezes and rewinds the battle. Gets faster when its clock breaks.',
  void_leviathan: 'Charges through the void and breathes abyssal fire.',
  shade_king: 'Three phases. In the last one, the night itself attacks.',
  prism_dragon: 'Splits light into lasers. Each phase changes its colours and its attacks.',
  first_summoner: 'The one who wrote the Grimoire and bound every boss you have fought.',
});

// ===== relics for the new bosses =====
RELICS.push(
  { id: 'hourglass', boss: 'chrono_warden',  name: 'Broken Hourglass', icon: '⌛', eff: 'skillCd', v: 0.12, desc: v => `Special skill cooldowns −${pct(v)}` },
  { id: 'abysspearl', boss: 'void_leviathan', name: 'Abyss Pearl',     icon: '◉', eff: 'mana',    v: 25,   desc: v => `+${v} max mana and +${Math.round(v * 0.75)}% mana regen` },
  { id: 'shadecrown', boss: 'shade_king',     name: 'Shade Crown',     icon: '♚', eff: 'sumDmg',  v: 0.12, desc: v => `Summons deal +${pct(v)} damage` },
  { id: 'prismscale', boss: 'prism_dragon',   name: 'Prism Scale',     icon: '◈', eff: 'armor',   v: 0.1,  desc: v => `Allen takes ${pct(v)} less damage` },
  { id: 'firstpage',  boss: 'first_summoner', name: 'The First Page',  icon: '❦', eff: 'god',     v: 0.25, desc: v => `All summons get +${pct(v)} HP and damage` },
);
for (const r of RELICS.slice(-5)) RELIC_BY_BOSS[r.boss] = r;

// ===== region + stages 29–38 =====
REGIONS.push({ name: 'The First Page', act: 'Act IV', from: 28, to: 37 });
const ACT4 = [
  ['Origin Shore', 'aw_seraph_construct', [10, 78], { clock_sentinel: 2, time_wraith: 2, star_wisp: 2, angel_sentinel: 1 }, mkTheme('#16303a', '#0a1a20', '#7fffd4', '#7fffd4', '#03090c', { crystal: 3, rock: 2, pillar: 1 }, 'star'), 'The edge of the world, where the sea meets the first page.', 0.35],
  ['Clocktower Ruins', 'chrono_warden', [24, 58], { clock_sentinel: 3, time_wraith: 3, pact_spire: 1 }, mkTheme('#2a2a20', '#16160e', '#ffe9a8', '#7fffd4', '#080806', { pillar: 3, rune: 3 }, 'dust'), 'Every clock here stopped at the same second.', 0.4],
  ['Drowned Library', 'aw_blood_queen', [14, 34], { mirror_witch: 3, abyss_spawn: 2, blood_bat: 2, time_wraith: 1 }, mkTheme('#1a1830', '#0c0c1a', '#c4b0ff', '#8fb0ff', '#04040a', { pool: 3, pillar: 2, rune: 2 }, 'void'), 'Shelves of forbidden pacts, slowly sinking.', 0.48],
  ['Abyssal Trench', 'void_leviathan', [32, 16], { abyss_spawn: 3, abyss_mite: 3, mirror_witch: 1, void_stalker: 2 }, mkTheme('#0c1430', '#060a1a', '#6a8bff', '#3a6bff', '#020308', { pool: 4, crystal: 2 }, 'void'), 'The deepest place in the world. Something enormous is moving.', 0.55],
  ['Hall of Mirrors', 'aw_eclipse_knight', [46, 40], { mirror_witch: 3, shade_knight: 2, prism_mote: 2 }, mkTheme('#241a30', '#120c1a', '#ff8af0', '#ff8af0', '#06040a', { crystal: 4, pillar: 2 }, 'star'), 'A thousand reflections, and only one of them is real.', 0.42],
  ['Shadow Court', 'shade_king', [58, 66], { shade_knight: 3, time_wraith: 2, mirror_witch: 2, pact_spire: 1 }, mkTheme('#140c1e', '#08040e', '#b06bff', '#8a5cff', '#030106', { rune: 3, spire: 3, bone: 2 }, 'void'), 'The court of the Shade King, where it is always midnight.', 0.6],
  ['Starforge', 'aw_astral_serpent', [64, 30], { prism_mote: 3, clock_sentinel: 2, star_wisp: 2, golden_guardian: 1 }, mkTheme('#2a1c10', '#160e06', '#ffcf5a', '#ff9a3d', '#0a0603', { lavapool: 2, starshard: 4 }, 'ember'), 'Where the stars were hammered into shape.', 0.45],
  ['Prism Peaks', 'prism_dragon', [78, 52], { prism_mote: 4, mirror_witch: 2, storm_harpy: 2, shade_knight: 1 }, mkTheme('#2a2440', '#16122a', '#ffd1fa', '#ff9af5', '#08060e', { crystal: 5, cloud: 2 }, 'feather'), 'Mountains of crystal that split the sunlight.', 0.38],
  ['Pact Spire', 'aw_storm_roc', [88, 30], { pact_spire: 2, shade_knight: 2, time_wraith: 2, clock_sentinel: 2, prism_mote: 1 }, mkTheme('#1e1430', '#0e0a1a', '#e2c6ff', '#c78bff', '#05030a', { rune: 4, spire: 2, starshard: 2 }, 'star'), 'A tower made of every pact ever signed.', 0.5],
  ['The First Page', 'first_summoner', [90, 76], { pact_spire: 2, shade_knight: 2, time_wraith: 2, mirror_witch: 2, abyss_spawn: 1, prism_mote: 2 }, mkTheme('#f0e8d8', '#d8ccb4', '#7a5cff', '#c78bff', '#2a2418', { rune: 5, pillar: 2 }, 'feather'), 'A blank white page. The beginning of every story. Final battle.', 0.12],
];
const A4_CH = [['kills', 'bossTime'], ['dmg', 'nodash'], ['maxCards', 'kills'], ['bossTime', 'noboost'], ['dmg', 'kills']];
ACT4.forEach(([name, boss, map, enemies, theme, blurb, dark], k) => {
  const i = 28 + k;
  const [a, b] = A4_CH[k % A4_CH.length];
  const mk = t => t === 'kills' ? { t, n: 1300 + k * 50 } : t === 'bossTime' ? { t, n: 75 } : t === 'dmg' ? { t, n: 0.6 } : t === 'maxCards' ? { t, n: 4 } : { t };
  STAGES.push({ name, boss, map, enemies, theme, blurb, duration: 160 + k * 2, density: 1.9 + k * 0.05, rec: 40 + k, ch: [mk(a), mk(b)], region: 3 });
  DARKNESS[i] = dark;
});
for (const [id, i] of [['chrono_warden', 29], ['void_leviathan', 31], ['shade_king', 33], ['prism_dragon', 35], ['first_summoner', 37], ['aw_seraph_construct', 28], ['aw_blood_queen', 30], ['aw_eclipse_knight', 32], ['aw_astral_serpent', 34], ['aw_storm_roc', 36]]) if (BOSS_STAGE[id] === undefined) BOSS_STAGE[id] = i;

// Act IV bosses scale more gently than the Act I–III curve would
const act4BossHp = i => bossHpFor(27) * Math.pow(1.08, i - 27);
const _a4_spawnBoss = spawnBoss;
spawnBoss = function () {
  _a4_spawnBoss();
  const e = W.boss, si = W.isRush ? BOSS_STAGE[e.bossId] : W.stageIdx;
  if (!W.isTower && !W.isRaid && si >= 28) {
    const k = act4BossHp(si) / bossHpFor(si);
    e.hp *= k; e.maxHp *= k; e.dmg *= 1 + 0.03 * (si - 27);
  }
  e.phaseI = 0;
};
// phases: crossing an HP threshold transforms the boss
const _a4_updateBoss = updateBoss;
updateBoss = function (e, dt) {
  const ph = e.bd.phases;
  if (ph && e.phaseI < ph.length && e.hp > 0 && e.hp < e.maxHp * ph[e.phaseI].at) bossPhase(e, ph[e.phaseI++]);
  if (e.phaseT > 0) { e.phaseT -= dt; e.vx = e.vy = 0; return; }
  _a4_updateBoss(e, dt);
};
function bossPhase(e, ph) {
  if (e.pat) endBossPattern(e);
  e.bd = Object.assign({}, e.bd, { color: ph.color, pcolor: ph.pcolor, patterns: ph.patterns, minion: ph.minion || e.bd.minion, speed: e.bd.speed * ph.speed });
  e.speed = e.bd.speed; e.col = ph.color;
  e.phaseT = 1.4; e.patT = 1.6;
  W.projs = W.projs.filter(q => q.team === 'ally');
  W.timeScale = 0.3; W.focus = { x: e.x, y: e.y, t: 1.4 }; W.flashT = 0.3; W.shake = 18;
  for (let i = 0; i < 3; i++) setTimeout(() => { if (W.active && !e.dead) ring(e.x, e.y, ph.color, 20, 160 + i * 70, 0.7, 5); }, i * 160);
  burst(e.x, e.y, ph.color, 90, 460, 1.2, 8);
  banner(`${e.bd.name.split(',')[0]}: ${ph.name}`, 'boss');
  $('bossName').textContent = `${e.bd.name} · ${ph.name}`;
  SFX.roar(); voiceBoss(e.bd, e.x);
}
// cinematic intro: letterbox bars + slow motion for Act IV bosses
const _a4_showBossIntro = showBossIntro;
showBossIntro = function (bd) {
  _a4_showBossIntro(bd);
  if (!bd.cine) return;
  const hud = $('hud');
  hud.classList.add('cine');
  W.timeScale = 0.15;
  setTimeout(() => hud.classList.remove('cine'), 2600);
};

// ===== story + the true ending =====
Object.assign(STORY.pre, {
  28: [['Grimoire', 'Summoner... there is something I never told you. Every pact in me was written by one hand.'],
       ['Allen', 'Whose?'],
       ['Grimoire', 'The First Summoner. Malkuth. Vargath and Aurelion were only his summons. And so, once, was I.']],
  29: [['Grimoire', 'The Chrono Warden guards his tower. Time moves strangely here. Do not let it rewind you.']],
  31: [['Kael', "The trench goes down forever. I can't see the bottom."], ['Allen', 'Then the bottom will come to us.']],
  33: [['Lysa', 'The Shade King feeds on fear. Stay in the light, Allen.'], ['Allen', 'I brought the light with me. 100 cards of it.']],
  35: [['Roran', 'A dragon made of light. Sure. Why not.'], ['Grimoire', 'Every phase changes its colour. Watch the colour, and you will see the attack coming.']],
  37: [['Malkuth', 'So the little summoner finally reaches the first page. Do you know what you hold? My book. My pacts. My army.'],
       ['Allen', "It stopped being yours the day it chose me."],
       ['Grimoire', 'Allen. Whatever happens, thank you for every card, every level, every fusion.'],
       ['Malkuth', 'Then let the last page be written in your blood.']],
});
STORY.ending4 = [
  ['Malkuth', 'Impossible... a summoner who grinds in Hell Mode... surpassing the one who wrote it...'],
  ['Grimoire', 'The last pact is broken. For the first time in a thousand years, no one owns me.'],
  ['Allen', 'Then stay anyway. As a partner, not a weapon.'],
  ['Grimoire', '...I would like that. Let us write the next page together, Allen.'],
  ['Allen', 'Village first. Then the arena. Then the tower. Hell Mode never ends.'],
  ['Grimoire', 'THE TRUE END. Thank you for playing Summoner: Hellbound Grimoire.'],
];
const _a4_finishStage = finishStage;
finishStage = function (won, retreat) {
  const plain = W && W.active && !W.isTower && !W.isRush && !W.isDaily && !W.isRaid, idx = W.stageIdx;
  _a4_finishStage(won, retreat);
  if (won && plain && idx === 37 && !SAVE.seenStory.ending4) { W.pendingEnding = 'ending4'; SAVE.trueEndingSeen = true; saveGame(); }
};

// ===== achievements =====
ACHIEVEMENTS.find(a => a.id === 'lv40').check = () => SAVE.level >= 40;
ACHIEVEMENTS.push(
  { id: 'act4',      name: 'Page Turner',       reward: 1200, desc: 'Clear every stage of Act IV.',      check: () => SAVE.cleared.slice(28, 38).every(Boolean) },
  { id: 'lv50',      name: 'Beyond the Peak',   reward: 600,  desc: 'Reach level 50.',                   check: () => SAVE.level >= 50 },
  { id: 'trueend',   name: 'The True Ending',   reward: 1000, desc: 'Defeat Malkuth, the First Summoner.', check: () => !!SAVE.cleared[37] },
  { id: 'phasebrk',  name: 'Phase Breaker',     reward: 300,  desc: 'Defeat a boss with three phases.',  check: () => !!(SAVE.bestiary.shade_king || SAVE.bestiary.prism_dragon || SAVE.bestiary.first_summoner) },
);

// ===== drawings =====
DR.chrono = (c, e, t) => {
  const col = e.col || '#7fffd4';
  c.strokeStyle = F(col); c.lineWidth = 3;
  for (let i = 0; i < 3; i++) { c.save(); c.rotate(t * (0.4 + i * 0.35) * (i % 2 ? -1 : 1)); c.setLineDash([10 + i * 4, 8]); circ(c, 0, 0, 34 + i * 9); c.stroke(); c.restore(); }
  c.setLineDash([]);
  c.fillStyle = F('#1a2a2a');
  c.beginPath(); c.moveTo(-22, -38); c.lineTo(22, -38); c.lineTo(4, 0); c.lineTo(22, 38); c.lineTo(-22, 38); c.lineTo(-4, 0); c.closePath(); c.fill();
  c.strokeStyle = F(col); c.lineWidth = 2.5; c.stroke();
  const sand = (Math.sin(t * 0.8) + 1) / 2;
  c.fillStyle = F('#ffe9a8');
  c.beginPath(); c.moveTo(-18 * (1 - sand), -34 + 30 * sand); c.lineTo(18 * (1 - sand), -34 + 30 * sand); c.lineTo(2, -2); c.lineTo(-2, -2); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-18 * sand, 34 - 30 * sand); c.lineTo(18 * sand, 34 - 30 * sand); c.lineTo(20, 34); c.lineTo(-20, 34); c.closePath(); c.fill();
  c.fillStyle = col; circ(c, 0, 0, 4); c.fill();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; c.fillStyle = i % 3 ? F(col) : '#ffffff'; circ(c, Math.cos(a) * 52, Math.sin(a) * 52, i % 3 ? 2 : 3.5); c.fill(); }
  c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(t * 2) * 44, Math.sin(t * 2) * 44); c.stroke();
};
DR.leviathan = (c, e, t) => {
  const col = e.col || '#3a6bff', sw = Math.sin(t * 3);
  c.save(); c.scale(e.face || 1, 1);
  c.fillStyle = F('#0c1430'); c.strokeStyle = F(col); c.lineWidth = 2.5;
  for (let i = 5; i >= 1; i--) { const x = -i * 15, y = Math.sin(t * 3 - i * 0.7) * 8; circ(c, x, y, 26 - i * 3); c.fill(); c.stroke(); }
  c.beginPath(); c.moveTo(-88, Math.sin(t * 3 - 4) * 8); c.lineTo(-112, -22 + sw * 6); c.lineTo(-104, Math.sin(t * 3 - 4) * 8); c.lineTo(-112, 22 + sw * 6); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(16, 0, 38, 30, 0, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = F(col);
  for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-6 - i * 14, -24 + i * 2); c.lineTo(-14 - i * 14, -44 + i * 3 + sw * 3); c.lineTo(-20 - i * 14, -22 + i * 2); c.closePath(); c.fill(); }
  c.fillStyle = '#05060f'; c.beginPath(); c.moveTo(30, 6); c.quadraticCurveTo(48, 14 + sw * 4, 54, 4); c.quadraticCurveTo(44, 26, 26, 18); c.closePath(); c.fill();
  c.fillStyle = '#e8f0ff'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(32 + i * 6, 9); c.lineTo(35 + i * 6, 16); c.lineTo(38 + i * 6, 9); c.fill(); }
  c.fillStyle = '#ffffff'; circ(c, 32, -10, 7); c.fill();
  c.fillStyle = F(col); circ(c, 34, -10, 4.5); c.fill();
  c.fillStyle = '#ffffff'; circ(c, 35, -11, 1.5); c.fill();
  c.restore();
};
DR.shadeking = (c, e, t) => {
  const col = e.col || '#8a5cff', fl = Math.sin(t * 4);
  c.fillStyle = F('#0a0614');
  c.beginPath(); c.moveTo(-34, 40); c.quadraticCurveTo(-40, -10, -18, -22); c.lineTo(18, -22); c.quadraticCurveTo(40, -10, 34, 40);
  for (let i = 0; i < 7; i++) c.lineTo(34 - i * 11.3, 40 + (i % 2 ? 10 + fl * 3 : 0));
  c.closePath(); c.fill();
  c.strokeStyle = F(col); c.lineWidth = 2; c.stroke();
  c.fillStyle = F('#16102a'); circ(c, 0, -30, 17); c.fill(); c.stroke();
  c.fillStyle = F(col);
  c.beginPath(); c.moveTo(-18, -42); c.lineTo(-14, -66); c.lineTo(-6, -50); c.lineTo(0, -72); c.lineTo(6, -50); c.lineTo(14, -66); c.lineTo(18, -42); c.closePath(); c.fill();
  c.fillStyle = '#ffffff'; ell(c, -7, -31, 4, 2.2); c.fill(); ell(c, 7, -31, 4, 2.2); c.fill();
  c.strokeStyle = F('#d9d0ff'); c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(26, -6); c.lineTo(52, -44 + fl * 4); c.stroke();
  c.fillStyle = F(col); c.beginPath(); c.moveTo(48, -40 + fl * 4); c.lineTo(62, -60 + fl * 4); c.lineTo(56, -36 + fl * 4); c.fill();
  for (let i = 0; i < 6; i++) { const a = t * 1.5 + i; c.fillStyle = rgba(col, 0.5); circ(c, Math.cos(a) * 46, Math.sin(a) * 30 + 10, 3); c.fill(); }
};
DR.prismdragon = (c, e, t) => {
  const col = e.col || '#ff9af5', fl = Math.sin(t * 5);
  c.save(); c.scale(e.face || 1, 1);
  const hues = ['#ff9af5', '#7fd3ff', '#ffcf5a', '#9dff7a'];
  for (const s of [-1, 1]) {
    c.fillStyle = F(rgba(hues[(s + 1) / 2 | 0], 0.75)); c.strokeStyle = F(col); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-6, -8); c.lineTo(-30, -60 - fl * 10 * s); c.lineTo(-58, -30 - fl * 6); c.lineTo(-40, -4); c.closePath(); c.fill(); c.stroke();
  }
  c.fillStyle = F('#2a1e3a'); c.strokeStyle = F(col); c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(-56, 10); c.lineTo(-24, -14); c.lineTo(20, -18); c.lineTo(36, -2); c.lineTo(20, 22); c.lineTo(-24, 22); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-56, 10); c.lineTo(-86, 26 + fl * 6); c.lineTo(-60, 20); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(24, -14); c.lineTo(52, -34); c.lineTo(70, -24); c.lineTo(56, -8); c.lineTo(30, 4); c.closePath(); c.fill(); c.stroke();
  for (let i = 0; i < 5; i++) { c.fillStyle = hues[i % 4]; c.beginPath(); c.moveTo(-40 + i * 14, -12); c.lineTo(-34 + i * 14, -30); c.lineTo(-28 + i * 14, -14); c.fill(); }
  c.fillStyle = '#ffffff'; circ(c, 58, -24, 3.5); c.fill();
  c.restore();
};
DR.firstsummoner = (c, e, t) => {
  const col = e.col || '#e2c6ff';
  c.save(); c.scale(1, 0.4); drawMagicCircle(c, 0, 90, 72, t * 0.6, col, 0.6, false); c.restore();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + t * 0.5, x = Math.cos(a) * 64, y = Math.sin(a) * 40 - 10;
    c.save(); c.translate(x, y); c.rotate(Math.sin(t + i) * 0.3);
    c.fillStyle = F('#f6efe0'); c.fillRect(-7, -9, 14, 18);
    c.strokeStyle = F(col); c.lineWidth = 1; c.strokeRect(-7, -9, 14, 18);
    c.restore();
  }
  c.fillStyle = F('#1a1028');
  c.beginPath(); c.moveTo(-30, 44); c.lineTo(-22, -16); c.lineTo(22, -16); c.lineTo(30, 44); c.closePath(); c.fill();
  c.strokeStyle = F(col); c.lineWidth = 2; c.stroke();
  c.fillStyle = F('#f3e6d0'); circ(c, 0, -28, 14); c.fill();
  c.fillStyle = F('#2a1a40'); c.beginPath(); c.moveTo(-18, -24); c.quadraticCurveTo(0, -60, 18, -24); c.quadraticCurveTo(0, -36, -18, -24); c.fill();
  c.fillStyle = col; ell(c, -5, -28, 2.6, 1.6); c.fill(); ell(c, 5, -28, 2.6, 1.6); c.fill();
  c.save(); c.translate(0, 10); c.rotate(Math.sin(t) * 0.08);
  c.fillStyle = F('#5a3a1a'); c.fillRect(-20, -12, 40, 26);
  c.fillStyle = F('#f6efe0'); c.fillRect(-18, -10, 17, 22); c.fillRect(1, -10, 17, 22);
  c.strokeStyle = F(col); c.lineWidth = 1;
  for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-15, -5 + k * 5); c.lineTo(-4, -5 + k * 5); c.moveTo(4, -5 + k * 5); c.lineTo(15, -5 + k * 5); c.stroke(); }
  c.restore();
  glowAt(c, 0, 10, 60, col, 0.25 + 0.1 * Math.sin(t * 3));
};

// Hell Tiers still unlock at level 40, now that the cap is 50
const _a4_gainExp = gainExp;
gainExp = function (v) { _a4_gainExp(v); if (SAVE.level >= 40) checkTierUnlock(); };
