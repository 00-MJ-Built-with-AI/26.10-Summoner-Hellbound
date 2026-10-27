'use strict';
// ---------- Act V: The Unwritten — 10 stages for levels 50–70, 6 enemies, 5 multi-phase bosses ----------

Object.assign(ENEMIES, {
  ink_blot:    { name: 'Ink Blot',      hp: 180, speed: 90,  dmg: 22, r: 16, exp: 16, ai: 'chase',    color: '#3a2a5a', draw: 'slime', split: 'ink_drop', splitN: 3 },
  ink_drop:    { name: 'Ink Drop',      hp: 40,  speed: 170, dmg: 10, r: 9,  exp: 4,  ai: 'chase',    color: '#5a4a8a', draw: 'slime' },
  quill_wraith: { name: 'Quill Wraith', hp: 130, speed: 130, dmg: 30, r: 14, exp: 16, ai: 'blinker',  color: '#e8e0ff', draw: 'stalker' },
  page_golem:  { name: 'Page Golem',    hp: 320, speed: 70,  dmg: 34, r: 21, exp: 24, ai: 'charger',  color: '#f6efe0', draw: 'guardian', shield: 220 },
  echo_witch:  { name: 'Echo Witch',    hp: 110, speed: 100, dmg: 24, r: 13, exp: 15, ai: 'blinker',  color: '#9fe8ff', draw: 'witch', ranged: true, range: 320, atkCd: 1.8, projSpeed: 380, pcolor: '#d6f8ff' },
  dream_moth:  { name: 'Dream Moth',    hp: 90,  speed: 175, dmg: 18, r: 13, exp: 12, ai: 'erratic',  color: '#ff9af5', draw: 'harpy' },
  null_spire:  { name: 'Null Spire',    hp: 280, speed: 0,   dmg: 20, r: 18, exp: 20, ai: 'turret',   color: '#ffffff', draw: 'spire', atkCd: 2, projSpeed: 260, pcolor: '#e8e0ff' },
});
Object.assign(LORE, {
  ink_blot: 'Spilled from a story that was never finished. It splits into drops.',
  ink_drop: 'A drop of living ink.',
  quill_wraith: 'Writes itself next to you, then strikes.',
  page_golem: 'Built from a thousand blank pages. Its shield is thick.',
  echo_witch: 'Repeats every curse twice.',
  dream_moth: 'Flutters out of half-remembered dreams.',
  null_spire: 'A white spire that erases what it touches.',
  ink_colossus: 'A giant of ink. In phase two it melts and spreads.',
  mirror_queen: 'Every phase, she copies more of your attacks.',
  storm_titan: 'Calls lightning, then becomes the storm.',
  dream_eater: 'Feeds on sleep. Its last phase turns the world upside down.',
  the_unwritten: 'The silence before every story. Three phases. The real final battle.',
});
Object.assign(BOSS_DRAW_R, { inkcolossus: 56, mirrorqueen: 44, stormtitan: 58, dreameater: 52, unwritten: 62 });
Object.assign(BOSSES, {
  ink_colossus: { name: 'The Ink Colossus', r: 54, speed: 85, color: '#5a4a8a', draw: 'inkcolossus', pcolor: '#9f8bff', minion: 'ink_blot', stones: 650, cine: true,
    patterns: ['slam', 'spiral', 'summon'], phases: [{ at: 0.5, name: 'Spilled Ink', color: '#2a2440', pcolor: '#c4b0ff', patterns: ['slam', 'spiral', 'meteor', 'summon', 'charge'], speed: 1.3 }] },
  mirror_queen: { name: 'Lyra, the Mirror Queen', r: 42, speed: 130, color: '#9fe8ff', draw: 'mirrorqueen', pcolor: '#e0faff', minion: 'echo_witch', stones: 700, cine: true,
    patterns: ['teleport', 'laser', 'burst'], phases: [
      { at: 0.66, name: 'Hall of Reflections', color: '#ff9af5', pcolor: '#ffd1fa', patterns: ['teleport', 'laser', 'spiral', 'summon'], speed: 1.15 },
      { at: 0.33, name: 'Shattered Glass', color: '#ffffff', pcolor: '#e0faff', patterns: ['teleport', 'laser', 'spiral', 'burst', 'charge', 'meteor'], speed: 1.35 }] },
  storm_titan: { name: 'Thalor, the Storm Titan', r: 56, speed: 90, color: '#7fd3ff', draw: 'stormtitan', pcolor: '#bff6ff', minion: 'quill_wraith', stones: 750, cine: true,
    patterns: ['slam', 'breath', 'burst'], phases: [{ at: 0.5, name: 'Eye of the Storm', color: '#fff6a8', pcolor: '#ffffff', patterns: ['slam', 'breath', 'meteor', 'laser', 'charge'], speed: 1.3 }] },
  dream_eater: { name: 'The Dream Eater', r: 50, speed: 110, color: '#ff9af5', draw: 'dreameater', pcolor: '#ffd1fa', minion: 'dream_moth', stones: 800, cine: true,
    patterns: ['spiral', 'teleport', 'summon'], phases: [
      { at: 0.66, name: 'Waking Nightmare', color: '#c78bff', pcolor: '#e2c6ff', patterns: ['spiral', 'teleport', 'laser', 'summon', 'burst'], speed: 1.2 },
      { at: 0.33, name: 'Endless Sleep', color: '#5a3cff', pcolor: '#9f8bff', patterns: ['spiral', 'teleport', 'laser', 'meteor', 'charge', 'breath'], speed: 1.4 }] },
  the_unwritten: { name: 'The Unwritten', r: 60, speed: 100, color: '#ffffff', draw: 'unwritten', pcolor: '#e8e0ff', minion: 'null_spire', stones: 1200, final: true, cine: true,
    patterns: ['laser', 'summon', 'spiral', 'burst'], phases: [
      { at: 0.66, name: 'The Blank Page', color: '#2a2440', pcolor: '#c4b0ff', minion: 'page_golem', patterns: ['laser', 'meteor', 'spiral', 'charge', 'teleport'], speed: 1.15 },
      { at: 0.33, name: 'Every Story at Once', color: '#ffd66b', pcolor: '#fff2a8', minion: 'quill_wraith', patterns: ['laser', 'meteor', 'spiral', 'breath', 'slam', 'teleport', 'burst', 'summon', 'charge'], speed: 1.35 }] },
});
for (const base of ['chrono_warden', 'void_leviathan', 'shade_king', 'prism_dragon', 'first_summoner']) {
  const b = BOSSES[base];
  BOSSES['aw_' + base] = Object.assign({}, b, { name: 'Awakened ' + b.name.replace(/^The /, ''), base, awakened: true, final: false, stones: b.stones + 200, title: 'Risen once more, stronger than before' });
}
Object.assign(BOSS_TITLES, { ink_colossus: 'Giant of Spilled Stories', mirror_queen: 'She Who Copies', storm_titan: 'Breaker of Skies', dream_eater: 'Hunger of the Sleeping', the_unwritten: 'The Silence Before Every Story' });
for (const k of ['ink_colossus', 'mirror_queen', 'storm_titan', 'dream_eater', 'the_unwritten']) BOSSES[k].title = BOSS_TITLES[k];
RELICS.push(
  { id: 'inkwell',   boss: 'ink_colossus',  name: 'Bottomless Inkwell', icon: '✒', eff: 'cap',     v: 1,    desc: v => `+${v} grimoire capacity` },
  { id: 'looking',   boss: 'mirror_queen',  name: 'Looking Glass',      icon: '◐', eff: 'skillCd', v: 0.12, desc: v => `Special skill cooldowns −${pct(v)}` },
  { id: 'stormheart', boss: 'storm_titan',  name: 'Storm Heart',        icon: 'ϟ', eff: 'swift',   v: 0.1,  desc: v => `+${pct(v)} move speed, −${pct(v * 2)} dash cooldown` },
  { id: 'dreamcatch', boss: 'dream_eater',  name: 'Dreamcatcher',       icon: '❂', eff: 'regen',   v: 4,    desc: v => `Allen regenerates ${v} HP per second` },
  { id: 'blankpage', boss: 'the_unwritten', name: 'The Blank Page',     icon: '▯', eff: 'sumDmg',  v: 0.2,  desc: v => `Summons deal +${pct(v)} damage` },
);
for (const r of RELICS.slice(-5)) RELIC_BY_BOSS[r.boss] = r;

REGIONS.push({ name: 'The Unwritten', act: 'Act V', from: 38, to: 47 });
const ACT5 = [
  ['Margins of the World', 'aw_chrono_warden', [8, 50], { ink_blot: 2, quill_wraith: 2, clock_sentinel: 2, dream_moth: 1 }, mkTheme('#ece4d2', '#d6ccb4', '#5a4a8a', '#7a5cff', '#2a2418', { rune: 3, pillar: 2 }, 'feather'), 'The edge of the last page. Beyond it, nothing has been written yet.', 0.1],
  ['Inkfall Cliffs', 'ink_colossus', [20, 28], { ink_blot: 3, ink_drop: 2, quill_wraith: 2, page_golem: 1 }, mkTheme('#1a1628', '#0c0a16', '#9f8bff', '#5a4a8a', '#030206', { rock: 3, pool: 3 }, 'void'), 'Waterfalls of ink pour into the void.', 0.55],
  ['Library of Echoes', 'aw_void_leviathan', [30, 60], { echo_witch: 3, page_golem: 2, abyss_spawn: 2, quill_wraith: 1 }, mkTheme('#20203a', '#10101e', '#9fe8ff', '#9fe8ff', '#04040a', { pillar: 3, rune: 3 }, 'star'), 'Every book here repeats the last word you said.', 0.45],
  ['Glass Gardens', 'mirror_queen', [42, 32], { echo_witch: 2, dream_moth: 3, prism_mote: 2, mirror_witch: 2 }, mkTheme('#1e2a34', '#0e161c', '#e0faff', '#9fe8ff', '#04080a', { crystal: 5, cloud: 1 }, 'feather'), 'Flowers of glass. Your reflection walks a step behind you.', 0.35],
  ['Shadow Archive', 'aw_shade_king', [50, 72], { shade_knight: 3, quill_wraith: 2, null_spire: 1, ink_blot: 2 }, mkTheme('#120c1e', '#08040e', '#b06bff', '#8a5cff', '#020104', { rune: 4, spire: 2 }, 'void'), 'Where the Shade King hid the stories he stole.', 0.62],
  ['Thunderhead', 'storm_titan', [60, 44], { storm_harpy: 3, quill_wraith: 2, page_golem: 2, null_spire: 1 }, mkTheme('#1a2232', '#0c1018', '#bff6ff', '#7fd3ff', '#04060a', { cloud: 4, pillar: 2 }, 'star'), 'A mountain made of storm clouds, and a titan asleep on top.', 0.5],
  ['Prism Sea', 'aw_prism_dragon', [70, 20], { prism_mote: 3, dream_moth: 3, echo_witch: 2 }, mkTheme('#2a2040', '#160f2a', '#ffd1fa', '#ff9af5', '#08040e', { crystal: 4, pool: 2 }, 'star'), 'An ocean of light split into every colour.', 0.4],
  ['Sleepwalk Hollow', 'dream_eater', [78, 58], { dream_moth: 4, ink_drop: 2, echo_witch: 2, page_golem: 1 }, mkTheme('#1e1430', '#0e0a1a', '#ff9af5', '#c78bff', '#05030a', { mushroom: 3, cloud: 3 }, 'feather'), 'Everyone here is asleep. Something is eating their dreams.', 0.58],
  ['The Last Library', 'aw_first_summoner', [88, 34], { page_golem: 2, null_spire: 2, quill_wraith: 2, echo_witch: 2, ink_blot: 2 }, mkTheme('#2a2418', '#16120c', '#ffd66b', '#ffcf5a', '#080604', { pillar: 4, rune: 3 }, 'ember'), "Malkuth's echo guards the last shelf of stories.", 0.45],
  ['The Unwritten', 'the_unwritten', [92, 80], { null_spire: 2, page_golem: 2, quill_wraith: 2, ink_blot: 2, dream_moth: 2, echo_witch: 2 }, mkTheme('#f8f6f0', '#e8e4da', '#1a1628', '#5a4a8a', '#ffffff', { rune: 4, starshard: 2 }, 'void'), 'Nothing. The space where the next story should be. Final battle of Act V.', 0.05],
];
ACT5.forEach(([name, boss, map, enemies, theme, blurb, dark], k) => {
  const i = 38 + k;
  const [a, b] = A4_CH[(k + 2) % A4_CH.length];
  const mk = t => t === 'kills' ? { t, n: 1700 + k * 60 } : t === 'bossTime' ? { t, n: 90 } : t === 'dmg' ? { t, n: 0.6 } : t === 'maxCards' ? { t, n: 4 } : { t };
  STAGES.push({ name, boss, map, enemies, theme, blurb, duration: 170 + k * 2, density: 2.3 + k * 0.05, rec: 50 + Math.round(k * 2.2), ch: [mk(a), mk(b)], region: 4 });
  DARKNESS[i] = dark;
});
for (const [id, i] of [['aw_chrono_warden', 38], ['ink_colossus', 39], ['aw_void_leviathan', 40], ['mirror_queen', 41], ['aw_shade_king', 42], ['storm_titan', 43], ['aw_prism_dragon', 44], ['dream_eater', 45], ['aw_first_summoner', 46], ['the_unwritten', 47]]) if (BOSS_STAGE[id] === undefined) BOSS_STAGE[id] = i;

Object.assign(STORY.pre, {
  38: [['Grimoire', 'Allen... the last page is not the last page. Look. There is more paper, and nothing on it.'],
       ['Allen', 'Blank pages? That is good, right? A new story.'],
       ['Grimoire', 'Malkuth bound every power into pacts to hold something back. With the pacts broken, the Unwritten is coming through.']],
  39: [['Grimoire', 'A giant made of spilled ink. Stories that were started and abandoned.']],
  41: [['Lysa', 'The Mirror Queen copies whoever fights her. Change your cards often.']],
  43: [['Roran', 'A titan made of lightning. I am going to need a bigger sword.'], ['Kael', 'Or better aim.']],
  45: [['Grimoire', 'The Dream Eater. If it wins, nobody in the world will ever dream again.']],
  47: [['Grimoire', 'It is here. The Unwritten.'],
       ['Grimoire', 'It cannot speak. It is the silence before every story. It wants everything to stay blank.'],
       ['Allen', 'Then let us write something it cannot erase.']],
});
STORY.ending5 = [
  ['Grimoire', 'The silence is filling with words. Ours.'],
  ['Allen', 'What does it say?'],
  ['Grimoire', '"A summoner who chose Hell Mode, and never stopped." That is the first line of a new world.'],
  ['Allen', 'Then let us keep writing. Rift, arena, tower. There is always another page.'],
  ['Grimoire', 'THE END OF ACT V. Thank you for playing, summoner.'],
];
const _a5_finishStage = finishStage;
finishStage = function (won, retreat) {
  const plain = W && W.active && !W.custom && !W.isTower && !W.isRush && !W.isDaily && !W.isRaid && !W.isArena, idx = W.stageIdx;
  _a5_finishStage(won, retreat);
  if (won && plain && idx === 47 && !SAVE.seenStory.ending5) W.pendingEnding = 'ending5';
};
ACHIEVEMENTS.push(
  { id: 'act5', name: 'The Next Page', reward: 2000, desc: 'Clear every stage of Act V.', check: () => SAVE.cleared.slice(38, 48).every(Boolean) },
);

// ===== drawings =====
DR.inkcolossus = (c, e, t) => {
  const col = e.col || '#5a4a8a', w = Math.sin(t * 2);
  c.fillStyle = F('#1a1628');
  c.beginPath(); c.moveTo(-50, 40);
  for (let k = 0; k <= 10; k++) { const x = -50 + k * 10; c.lineTo(x, 40 + Math.sin(t * 4 + k) * 5); }
  c.quadraticCurveTo(54, -10, 30, -40); c.quadraticCurveTo(0, -64 + w * 4, -30, -40); c.quadraticCurveTo(-56, -10, -50, 40); c.fill();
  c.strokeStyle = F(col); c.lineWidth = 3; c.stroke();
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 34, -6); c.quadraticCurveTo(s * 66, 10 + w * 8, s * 58, 40); c.lineWidth = 12; c.strokeStyle = F('#1a1628'); c.stroke(); }
  c.fillStyle = '#ffffff'; ell(c, -12, -26, 7, 9); c.fill(); ell(c, 12, -26, 7, 9); c.fill();
  c.fillStyle = col; circ(c, -12, -24, 3.5); c.fill(); circ(c, 12, -24, 3.5); c.fill();
  for (let k = 0; k < 5; k++) { c.fillStyle = rgba(col, 0.6); ell(c, -40 + k * 20, 48 + ((t * 30 + k * 13) % 20), 3, 5); c.fill(); }
};
DR.mirrorqueen = (c, e, t) => {
  const col = e.col || '#9fe8ff';
  for (let k = 0; k < 6; k++) { const a = t * 0.7 + (k / 6) * TAU; c.save(); c.translate(Math.cos(a) * 52, Math.sin(a) * 30 - 6); c.rotate(a); c.fillStyle = rgba(col, 0.45); c.strokeStyle = F('#ffffff'); c.lineWidth = 1; c.beginPath(); c.moveTo(0, -12); c.lineTo(7, 0); c.lineTo(0, 12); c.lineTo(-7, 0); c.closePath(); c.fill(); c.stroke(); c.restore(); }
  c.fillStyle = F('#d6f2ff'); c.strokeStyle = F(col); c.lineWidth = 2;
  c.beginPath(); c.moveTo(0, -20); c.lineTo(22, 40); c.lineTo(-22, 40); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = F('#f0fbff'); circ(c, 0, -28, 12); c.fill(); c.stroke();
  c.fillStyle = F(col); c.beginPath(); for (let k = 0; k < 5; k++) { const x = -12 + k * 6; c.lineTo(x, -38 - (k % 2 ? 4 : 12)); } c.lineTo(12, -38); c.lineTo(-12, -38); c.fill();
  c.fillStyle = '#3a5a7a'; ell(c, -4, -28, 2, 2.5); c.fill(); ell(c, 4, -28, 2, 2.5); c.fill();
  glowAt(c, 0, 0, 56, col, 0.18);
};
DR.stormtitan = (c, e, t) => {
  const col = e.col || '#7fd3ff', f = Math.sin(t * 3);
  c.fillStyle = F('#2a3448'); c.strokeStyle = F(col); c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(-34, 44); c.lineTo(-40, -6); c.lineTo(-20, -30); c.lineTo(20, -30); c.lineTo(40, -6); c.lineTo(34, 44); c.closePath(); c.fill(); c.stroke();
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 40, -10); c.lineTo(s * 64, 14 + f * 6 * s); c.lineTo(s * 56, 22); c.lineTo(s * 34, 4); c.closePath(); c.fill(); c.stroke(); }
  c.fillStyle = F('#3a4a64'); c.beginPath(); c.moveTo(-16, -30); c.lineTo(0, -54); c.lineTo(16, -30); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#ffffff'; circ(c, -7, -36, 3); c.fill(); circ(c, 7, -36, 3); c.fill();
  c.strokeStyle = col; c.lineWidth = 2;
  for (let k = 0; k < 3; k++) { const a = t * 2 + k * 2.1; c.beginPath(); let x = Math.cos(a) * 20, y = -60; c.moveTo(x, y); for (let s = 0; s < 4; s++) { x += rand(-10, 10); y -= 10; c.lineTo(x, y); } c.stroke(); }
  glowAt(c, 0, -36, 70, col, 0.2 + 0.08 * f);
};
DR.dreameater = (c, e, t) => {
  const col = e.col || '#ff9af5', f = Math.sin(t * 2.4);
  c.save(); c.scale(e.face || 1, 1);
  c.fillStyle = F('#2a1e40'); c.strokeStyle = F(col); c.lineWidth = 2;
  ell(c, -6, 6, 46, 30); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(34, -6); c.quadraticCurveTo(70, -2 + f * 6, 76, 18 + f * 8); c.quadraticCurveTo(60, 14, 34, 14); c.closePath(); c.fill(); c.stroke();
  for (const x of [-30, -10, 14, 30]) { c.fillStyle = F('#1a1230'); c.fillRect(x - 4, 28, 8, 16); }
  c.fillStyle = rgba(col, 0.7);
  for (let k = 0; k < 5; k++) { const x = -40 + k * 16, y = -24 - Math.abs(Math.sin(t * 2 + k)) * 8; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill(); }
  c.fillStyle = '#ffffff'; ell(c, 34, -2, 6, 3.5); c.fill(); c.fillStyle = '#1a1230'; ell(c, 35, -2, 3, 3); c.fill();
  c.restore();
  glowAt(c, 0, 0, 70, col, 0.15);
};
DR.unwritten = (c, e, t) => {
  const col = e.col || '#ffffff';
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * TAU + t * 0.4, r = 66 + Math.sin(t + k) * 6;
    c.save(); c.translate(Math.cos(a) * r, Math.sin(a) * r * 0.6); c.rotate(a + t);
    c.fillStyle = F('#fbf9f2'); c.fillRect(-8, -10, 16, 20); c.strokeStyle = F('#c4b0ff'); c.lineWidth = 0.8; c.strokeRect(-8, -10, 16, 20);
    c.restore();
  }
  const g = c.createRadialGradient(0, 0, 4, 0, 0, 56);
  g.addColorStop(0, col === '#ffffff' ? '#ffffff' : col); g.addColorStop(0.55, '#e8e0ff'); g.addColorStop(1, 'rgba(232,224,255,0)');
  c.fillStyle = g; circ(c, 0, 0, 56); c.fill();
  c.strokeStyle = F('#1a1628'); c.lineWidth = 3;
  c.beginPath(); c.moveTo(-14, -6); c.lineTo(-4, -6); c.moveTo(4, -6); c.lineTo(14, -6); c.stroke();
  c.beginPath(); c.moveTo(-10, 12); c.lineTo(10, 12); c.stroke();
};
