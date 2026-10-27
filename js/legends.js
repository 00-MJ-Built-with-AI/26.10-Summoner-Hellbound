'use strict';
// ---------- v8: 20 mythic-legend creatures (2 per rank) and 10 legendary fusions ----------
// [id, rank, name, role, desc, template or 'custom', template params, stats, [skill fx, name, mana, cooldown, desc]]
const LEGENDS = [
  ['golden_scarab', 'insect', 'Golden Scarab', 'Sun Beetle', 'A sacred scarab whose golden shell scatters enemies when it charges.', 'insect', { kind: 'stag', crown: true, s: 1.25 }, { cost: 18, cd: 2.4, ai: 'charger', hp: 95, dmg: 13, knock: 300, atkCd: 0.8, speed: 175, r: 15, color: '#ffd34a' }, ['rampage', 'Solar Rush', 9, 8, 'Charges at your cursor for triple damage, stunning what it hits.']],
  ['myrmidon', 'insect', 'Myrmidon Swarm', 'Legion of Bronze', 'Five bronze ants that fight as one shield wall.', 'insect', { kind: 'ant', s: 1.1 }, { cost: 14, cd: 1.4, count: 5, weight: 0.2, ai: 'melee', hp: 20, dmg: 4.5, atkCd: 0.4, speed: 210, r: 8, color: '#e0a060' }, ['howl', 'Phalanx Cry', 11, 14, 'All summons deal +40% damage for 6s.']],
  ['fenrir', 'beast', 'Fenrir', 'Wolf of Ragnarok', 'The giant wolf of legend. Its bite freezes and its howl shakes the earth.', 'beast', { bulk: true, frost: true, eye: '#bff6ff', s: 1.5 }, { cost: 30, cd: 3.2, ai: 'melee', hp: 260, dmg: 22, atkCd: 0.55, speed: 260, r: 20, slowHit: 0.4, color: '#c9d6ff' }, ['blizzard', 'Fimbulwinter', 16, 14, 'A freezing storm around the wolf.']],
  ['qilin', 'beast', 'Qilin', 'Bringer of Fortune', 'A gentle, radiant beast. Wherever it walks, wounds close.', 'beast', { horns: true, mane: true, acc: '#7dffb0', s: 1.2 }, { cost: 28, cd: 3, ai: 'melee', hp: 180, dmg: 14, heal: 10, healAura: 160, atkCd: 0.7, speed: 240, r: 17, color: '#ffe08a' }, ['sanctuary', 'Auspicious Light', 20, 18, 'Heals every nearby ally for 40% of max HP.']],
  ['thunderbird', 'bird', 'Thunderbird', 'Storm Bringer', 'Its wingbeats are thunder. Every dive stuns everything below.', 'bird', { wing: '#2a4a8a', head: '#3a6aa8', acc: '#fff6a8', span: 32, s: 1.25 }, { cost: 28, cd: 3, ai: 'flier', flying: true, hp: 90, dmg: 30, stunDive: 0.4, speed: 540, r: 16, color: '#7fd3ff' }, ['tempest', 'Thunderclap', 26, 20, 'Lightning strikes every enemy in range three times.']],
  ['simurgh', 'bird', 'Simurgh', 'The Wise Healer', 'An ancient healing bird. Its feathers mend anyone they touch.', 'bird', { wing: '#ffcf5a', head: '#ff8a3d', span: 30, round: true, s: 1.2 }, { cost: 30, cd: 8, ai: 'priest', flying: true, weight: 1.5, hp: 180, heal: 16, shield: 30, speed: 240, r: 15, color: '#ffb347' }, ['sanctuary', 'Feather of Life', 22, 20, 'Heals every nearby ally for 40% of max HP.']],
  ['yggdrasil', 'grass', 'Yggdrasil Sprout', 'World Seedling', 'A sprout of the world tree. It heals a huge area for a long time.', 'plant', { kind: 'tree', s: 1.25 }, { cost: 30, cd: 9, ai: 'heal', stationary: true, hp: 220, heal: 12, aura: 230, life: 30, r: 18, color: '#5dff9a' }, ['bloom', 'Roots of the World', 12, 16, 'The sprout bursts, healing you and nearby summons for 35% of max HP. Consumes it.']],
  ['alraune', 'grass', 'Alraune', 'Thorn Maiden', 'A flower maiden whose thorns bind and bleed every enemy nearby.', 'plant', { kind: 'trap', s: 1.2 }, { cost: 28, cd: 8, ai: 'thorns', stationary: true, hp: 200, dmg: 11, aura: 160, life: 26, slow: 0.6, poison: 6, r: 18, color: '#ff6bd6' }, ['entangle', 'Rose Prison', 14, 12, 'Roots every enemy inside the thorns for 2.5s.']],
  ['golem_king', 'stone', 'Golem King', 'Crowned Mountain', 'The king of all golems. It taunts the battlefield and crushes the front line.', 'golem', { kind: 'titan', s: 1.35 }, { cost: 42, cd: 12, ai: 'taunt', stationary: true, weight: 2, hp: 900, dmg: 26, atkCd: 1.2, aura: 300, slam: 115, r: 28, color: '#c9a06a' }, ['fortress', 'Royal Bastion', 20, 18, 'Invulnerable for 6s, blocks projectiles and taunts a wider area.']],
  ['basilisk', 'stone', 'Basilisk', 'King of Serpents', 'Its gaze turns enemies to stone: every shot slows them heavily.', 'custom', {}, { cost: 38, cd: 6, ai: 'ranged', hp: 260, dmg: 26, atkCd: 1, range: 330, projSpeed: 520, pierce: 2, slow: 0.6, speed: 170, r: 18, color: '#9dff7a' }, ['zero', 'Petrifying Gaze', 24, 20, 'Freezes every enemy near you for 2.5s.']],
  ['kraken', 'fish', 'Kraken', 'Terror of the Deep', 'A colossal squid. Its tentacles slow and crush everything around it.', 'custom', {}, { cost: 44, cd: 12, ai: 'thorns', stationary: true, weight: 2, hp: 600, dmg: 18, aura: 210, life: 28, slow: 0.65, r: 26, color: '#c43a6a' }, ['wave', 'Maelstrom', 22, 16, "A wave blasts enemies away and doubles everyone's shields."]],
  ['nereid', 'fish', 'Nereid', 'Daughter of the Sea', 'A sea nymph that circles you, empowering and shielding your summons.', 'fish', { kind: 'manta', s: 1.1 }, { cost: 36, cd: 10, ai: 'buffer', flying: true, hp: 160, aura: 260, buff: 0.45, shield: 50, speed: 240, r: 15, color: '#7fe9ff' }, ['wave', 'Tide of Grace', 20, 16, "A wave blasts enemies away and doubles everyone's shields."]],
  ['kitsune', 'spirit', 'Nine-Tailed Kitsune', 'Foxfire Trickster', 'A fox spirit with nine tails, hurling foxfire that explodes in blue flame.', 'custom', {}, { cost: 40, cd: 4, ai: 'ranged', flying: true, hp: 150, dmg: 32, atkCd: 0.9, range: 350, splash: 80, projSpeed: 460, speed: 220, r: 15, color: '#7fb8ff' }, ['inferno', 'Foxfire Rain', 26, 22, 'Rains fire on your cursor for 4s.']],
  ['jinn', 'spirit', 'Jinn', 'Smoke and Storm', 'A spirit of smokeless fire that calls lightning on every foe in range.', 'spirit', { kind: 'cloud', s: 1.3 }, { cost: 42, cd: 12, ai: 'archon', stationary: true, weight: 1.5, hp: 300, dmg: 38, atkCd: 0.8, range: 360, chain: 3, r: 18, color: '#c78bff' }, ['tempest', "Jinn's Wrath", 30, 22, 'Lightning strikes every enemy in range three times.']],
  ['bahamut', 'dragon', 'Bahamut', 'King of Dragons', 'The dragon king of legend. Its breath is a river of fire.', 'drake', { acc: '#fff2a8', eye: '#ffd34a', s: 1.55 }, { cost: 95, cd: 24, ai: 'dragon', flying: true, weight: 4, hp: 950, dmg: 16, bite: 60, atkCd: 0.85, range: 320, speed: 235, r: 30, color: '#3a5aff' }, ['inferno', 'Megaflare', 34, 24, 'Rains fire on your cursor for 4s.']],
  ['tiamat', 'dragon', 'Tiamat', 'Mother of Monsters', 'A dragon of chaos whose breath is poison and storm.', 'drake', { acc: '#c78bff', eye: '#ff4dd2', s: 1.45 }, { cost: 88, cd: 22, ai: 'dragon', flying: true, weight: 4, hp: 820, dmg: 12, bite: 50, atkCd: 0.9, range: 300, speed: 240, r: 28, breath: 'venom', color: '#7a3cff' }, ['cloud', 'Primordial Sea', 24, 16, 'Releases a huge lingering poison cloud.']],
  ['metatron', 'celestial', 'Metatron', 'Voice of Heaven', 'A towering archangel whose lances pierce an entire army.', 'angel', { wings: 3, span: 36, acc: '#bfefff' }, { cost: 85, cd: 15, ai: 'ranged', flying: true, weight: 3, hp: 560, dmg: 95, atkCd: 0.85, range: 420, projSpeed: 700, pierce: 7, lance: true, speed: 220, r: 20, color: '#e8f8ff' }, ['judgment', 'Word of Heaven', 36, 18, 'A colossal holy beam toward your cursor.']],
  ['garuda', 'celestial', 'Garuda', 'Sun Eagle', 'A golden sun eagle whose dives stun everything in their path.', 'angel', { spear: true, span: 32, acc: '#ff9a3a' }, { cost: 70, cd: 7, ai: 'flier', flying: true, weight: 2, hp: 360, dmg: 75, stunDive: 0.45, speed: 580, r: 17, color: '#ffcf5a' }, ['mark', 'Sun Mark', 18, 10, 'Marks the enemy nearest your cursor; every flier dives at it.']],
  ['ouroboros', 'primordial', 'Ouroboros', 'The Endless Circle', 'The serpent that eats its own tail. Chain lightning arcs from its coils forever.', 'custom', {}, { cost: 100, cd: 20, ai: 'archon', stationary: true, weight: 3, hp: 1800, dmg: 120, atkCd: 0.7, range: 440, chain: 5, r: 26, color: '#ff6bd6' }, ['tempest', 'Eternal Return', 40, 22, 'Lightning strikes every enemy in range three times.']],
  ['chimera', 'primordial', 'Chimera', 'Three-Headed Fury', 'Lion, goat and serpent in one body. Its charges flatten armies.', 'beast', { mane: true, horns: true, bulk: true, s: 1.7 }, { cost: 96, cd: 18, ai: 'charger', weight: 3, hp: 2200, dmg: 110, knock: 420, stunHit: 0.4, atkCd: 0.7, speed: 220, r: 30, color: '#ff8a3d' }, ['rampage', 'Chimera Stampede', 34, 10, 'Charges at your cursor for triple damage, stunning what it hits.']],
];
for (const [id, rank, name, role, desc, tpl, tp, stats, skill] of LEGENDS) {
  CARDS[id] = Object.assign({ rank, name, role, desc, legend: true, tags: [rank] }, stats, tpl === 'custom' ? {} : { tpl: [tpl, tp] });
  CARD_SKILLS[id] = { fx: skill[0], name: skill[1], mp: skill[2], cd: skill[3], desc: skill[4] };
  if (tpl !== 'custom') DR[id] = (c, e, t) => TPL[tpl](c, e, t, tp);
  CARD_IDS.push(id);
}

// ----- custom drawings -----
DR.basilisk = (c, e, t) => {
  const w = Math.sin(t * 4 + (e.seed || 0));
  c.save(); c.scale(e.face || 1, 1);
  c.strokeStyle = F('#2a6a1a'); c.lineWidth = 11; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-22, 8); c.bezierCurveTo(-12, 16 + w * 4, -2, -2 - w * 4, 8, 4); c.stroke();
  c.strokeStyle = F('#5ab83a'); c.lineWidth = 7; c.stroke();
  c.fillStyle = F('#3a8a2a'); ell(c, 12, -4, 11, 8); c.fill();
  c.fillStyle = F('#ffd34a'); c.beginPath(); c.moveTo(4, -10); c.lineTo(8, -20); c.lineTo(12, -11); c.lineTo(16, -21); c.lineTo(19, -10); c.closePath(); c.fill();
  c.fillStyle = '#fff36a'; circ(c, 17, -6, 2.6); c.fill();
  c.fillStyle = '#1a0a00'; ell(c, 17.5, -6, 0.8, 2.2); c.fill();
  c.strokeStyle = '#ff4d6d'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(22, -2); c.lineTo(28, -2 + w); c.moveTo(26, -2 + w); c.lineTo(29, -5); c.stroke();
  c.restore();
};
DR.kraken = (c, e, t) => {
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + Math.sin(t * 1.5 + k) * 0.2, L = 34 + Math.sin(t * 2 + k * 1.3) * 6;
    c.strokeStyle = F('#7a1a3a'); c.lineWidth = 6 - k % 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(Math.cos(a) * 10, Math.sin(a) * 6 + 8);
    c.quadraticCurveTo(Math.cos(a + 0.5) * L * 0.6, Math.sin(a + 0.5) * L * 0.4 + 12, Math.cos(a + Math.sin(t * 2 + k) * 0.4) * L, Math.sin(a) * L * 0.55 + 14); c.stroke();
    c.fillStyle = F('#ffb3c9'); circ(c, Math.cos(a) * L * 0.55, Math.sin(a) * L * 0.32 + 12, 1.6); c.fill();
  }
  c.fillStyle = F('#c43a6a'); c.beginPath(); c.moveTo(-14, 8); c.quadraticCurveTo(-18, -26, 0, -32); c.quadraticCurveTo(18, -26, 14, 8); c.closePath(); c.fill();
  c.strokeStyle = F('#ff8fb3'); c.lineWidth = 1.5; c.stroke();
  c.fillStyle = '#fff6a8'; ell(c, -6, 0, 4, 5); c.fill(); ell(c, 6, 0, 4, 5); c.fill();
  c.fillStyle = '#1a0010'; ell(c, -6, 0.5, 1.4, 3.2); c.fill(); ell(c, 6, 0.5, 1.4, 3.2); c.fill();
};
DR.kitsune = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  for (let k = 0; k < 9; k++) {
    const a = -2.4 + k * 0.2 + Math.sin(t * 3 + k) * 0.08;
    c.strokeStyle = F(k % 2 ? '#bfe0ff' : '#ffffff'); c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-8, 2); c.quadraticCurveTo(-8 + Math.cos(a) * 14, Math.sin(a) * 14, -8 + Math.cos(a) * 26, Math.sin(a) * 24 - 2); c.stroke();
    c.fillStyle = rgba('#7fb8ff', 0.8); circ(c, -8 + Math.cos(a) * 27, Math.sin(a) * 25 - 2, 2.2); c.fill();
  }
  c.fillStyle = F('#f6f2ff'); ell(c, 0, 4, 11, 7); c.fill();
  c.fillStyle = F('#ffffff'); c.beginPath(); c.moveTo(6, -2); c.lineTo(18, 0); c.lineTo(8, 6); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(6, -4); c.lineTo(8, -14); c.lineTo(11, -4); c.closePath(); c.fill(); c.beginPath(); c.moveTo(11, -4); c.lineTo(14, -13); c.lineTo(15, -2); c.closePath(); c.fill();
  c.fillStyle = '#7fb8ff'; ell(c, 12, -1, 1.5, 1); c.fill();
  c.strokeStyle = F('#ff6b8a'); c.lineWidth = 1; c.beginPath(); c.moveTo(8, -8); c.lineTo(10, -5); c.stroke();
  c.restore();
  const f = t * 4; c.fillStyle = rgba('#7fb8ff', 0.9);
  for (let k = 0; k < 3; k++) { const a = f + k * 2.1; circ(c, Math.cos(a) * 20, Math.sin(a) * 9 - 14, 2.5 + Math.sin(f + k) * 0.8); c.fill(); }
};
DR.ouroboros = (c, e, t) => {
  const R = 22;
  c.lineCap = 'round';
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * TAU + t * 0.6, x = Math.cos(a) * R, y = Math.sin(a) * R * 0.75;
    c.fillStyle = F(k % 2 ? '#ff6bd6' : '#b03a9a'); circ(c, x, y, 5.2 - (k / 36) * 2.5); c.fill();
  }
  const ha = t * 0.6, hx = Math.cos(ha) * R, hy = Math.sin(ha) * R * 0.75;
  c.fillStyle = F('#ff6bd6'); ell(c, hx, hy, 8, 6); c.fill();
  c.fillStyle = '#fff2a8'; circ(c, hx + 2, hy - 2, 1.8); c.fill();
  c.strokeStyle = rgba('#ffd1fa', 0.6); c.lineWidth = 1.2; circ(c, 0, 0, R * 0.55); c.stroke();
  c.fillStyle = rgba('#ff6bd6', 0.25 + 0.15 * Math.sin(t * 3)); circ(c, 0, 0, R * 0.5); c.fill();
};

// ----- 10 legendary fusions (same rules as the other fusions) -----
const LEGEND_FUSIONS = [
  ['ragnarok_fenrir', 'Ragnarok Fenrir', 'Doom of the Gods', 'fenrir', 'frost_wolf', 'The wolf that devours the sun, wrapped in eternal winter.'],
  ['storm_kirin', 'Storm Kirin', 'Thunder Fortune', 'qilin', 'thunder_ram', 'A qilin of storm clouds that heals with lightning.'],
  ['tempest_thunderbird', 'Tempest Thunderbird', 'Sky Breaker', 'thunderbird', 'griffin', 'Every wingbeat is a lightning strike.'],
  ['world_tree', 'Yggdrasil', 'The World Tree', 'yggdrasil', 'healing_sprout', 'The world tree itself, healing everything under its branches.'],
  ['gorgon_basilisk', 'Gorgon Basilisk', 'Stone Gaze', 'basilisk', 'crystal_sentinel', 'A crowned serpent whose gaze turns armies to crystal.'],
  ['abyssal_kraken', 'Abyssal Kraken', 'Lord of the Trench', 'kraken', 'electric_eel', 'A kraken from the deepest trench, crackling with lightning.'],
  ['nine_sun_kitsune', 'Nine-Sun Kitsune', 'Celestial Fox', 'kitsune', 'will_o_wisp', 'A fox spirit whose nine tails burn like nine suns.'],
  ['bahamut_zero', 'Bahamut Zero', 'End of All Dragons', 'bahamut', 'elder_wyrm', 'The final form of the dragon king.'],
  ['sun_garuda', 'Sun Garuda', 'Wings of Dawn', 'garuda', 'valkyrie', 'A golden eagle of the dawn with a holy spear.'],
  ['eternal_ouroboros', 'Eternal Ouroboros', 'Beginning and End', 'ouroboros', 'chaos_wyrm', 'The circle that never ends, crackling with chaos.'],
];
LEGEND_FUSIONS.forEach(([id, name, role, a, b, desc], k) => {
  const A = CARDS[a], B = CARDS[b];
  const f = { rank: 'fusion', fusion: [a, b], name, role, desc, legend: true, fuseCost: 1200 + k * 150, color: A.color, colAlt: B.color };
  for (const key of BEHAVIOR_KEYS) if (A[key] !== undefined) f[key] = A[key];
  f.hp = Math.round((A.hp + B.hp) * 0.95);
  f.dmg = Math.round(Math.max(A.dmg || 0, B.dmg || 0) * 1.7 * 10) / 10;
  if (A.bite) f.bite = Math.round(Math.max(A.bite, B.bite || 0) * 1.6);
  if (A.heal) f.heal = Math.round(A.heal * 1.6);
  if (A.shield) f.shield = Math.round(A.shield * 1.6);
  if (A.buff) f.buff = Math.min(0.65, A.buff + 0.15);
  if (f.r) f.r = Math.round(f.r * 1.15);
  f.atkCd = A.atkCd ? A.atkCd * 0.85 : undefined;
  f.cost = Math.round((A.cost + B.cost) * 0.65);
  f.cd = Math.max(A.cd, B.cd);
  f.weight = Math.max(A.weight ?? 1, B.weight ?? 1);
  if (f.count > 1) f.weight = Math.max(A.weight ?? 1, 1 / f.count);
  f.tags = [...new Set([A.rank === 'fusion' ? A.tags : [A.rank], B.rank === 'fusion' ? B.tags : [B.rank]].flat())];
  CARDS[id] = f;
  const ask = CARD_SKILLS[a];
  CARD_SKILLS[id] = { fx: ask.fx, name: ask.name + ' Ascendant', mp: Math.round(ask.mp * 1.2), cd: ask.cd, desc: ask.desc };
  const draw = DR[a];
  DR[id] = (c, e, t) => {
    const keep = e.colAlt; e.colAlt = B.color;
    c.save(); c.scale(1.2, 1.2); draw(c, e, t); c.restore();
    e.colAlt = keep;
    c.fillStyle = F('#ff6bd6');
    const y = -(f.r || 14) - 9;
    c.beginPath(); c.moveTo(-7, y + 4); c.lineTo(-6, y - 3); c.lineTo(-2, y + 1); c.lineTo(0, y - 6); c.lineTo(2, y + 1); c.lineTo(6, y - 3); c.lineTo(7, y + 4); c.closePath(); c.fill();
  };
  CARD_IDS.push(id);
});
ACHIEVEMENTS.push(
  { id: 'legends', name: 'Living Legend', reward: 800, desc: 'Unlock all 20 mythic legends.', check: () => LEGENDS.every(l => cardUnlocked(l[0])) },
  { id: 'legfuse', name: 'Myth Maker', reward: 1500, desc: 'Discover all 10 legendary fusions.', check: () => LEGEND_FUSIONS.every(f => SAVE.fused[f[0]]) },
);
