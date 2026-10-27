'use strict';
// ---------- Acts II & III: Celestial rank, new enemies, bosses, stages, relics, companions, trials ----------

const LEVEL_CAP = 9999;   // effectively unlimited (v8); stats grow more gently past 70
PLAYER.cap = L => Math.min(20, 4 + Math.floor((L - 1) / 2));
PLAYER.hp = L => 90 + 14 * (L - 1) + 32 * Math.max(0, L - 20);
PLAYER.expNext = L => Math.floor(30 * Math.pow(L, 1.7) * (L > 20 ? 1 + (L - 20) * 0.35 : 1));
CARD_PROG.maxLv = 30;

// ===== Celestial rank (S) =====
RANKS.push({ id: 'celestial', name: 'Celestial', grade: 'S', level: 25, color: '#fff2a8' });
RANK_BY_ID.celestial = RANKS[RANKS.length - 1];
Object.assign(CARDS, {
  seraph: {
    rank: 'celestial', name: 'Seraph', role: 'Judgment',
    desc: 'A winged herald that fires piercing holy lances and mends every ally near it.',
    cost: 55, cd: 8, ai: 'ranged', flying: true, weight: 2,
    hp: 380, dmg: 55, atkCd: 1.0, range: 380, projSpeed: 640, pierce: 5, heal: 14, healAura: 180, speed: 220, r: 16, color: '#fff2a8', lance: true,
  },
  archon: {
    rank: 'celestial', name: 'Storm Archon', role: 'Tempest',
    desc: 'A towering pillar of the heavens that calls chain lightning down on every foe in range.',
    cost: 65, cd: 14, ai: 'archon', stationary: true, weight: 2,
    hp: 900, dmg: 70, atkCd: 0.75, range: 400, chain: 3, r: 22, color: '#9fe8ff',
  },
});
for (const id of ['seraph', 'archon']) { CARD_IDS.push(id); CARDS[id].tags = ['celestial']; }
CARD_SKILLS.seraph = { fx: 'judgment', name: 'Judgment', mp: 30, cd: 18, desc: 'A colossal holy beam sweeps from the Seraph toward your cursor, burning everything in its path.' };
CARD_SKILLS.archon = { fx: 'tempest', name: 'Tempest', mp: 35, cd: 22, desc: 'Lightning strikes every enemy within range three times.' };

// ===== new enemies =====
Object.assign(ENEMIES, {
  hellhound:       { name: 'Hellhound',       hp: 45,  speed: 175, dmg: 12, r: 14, exp: 6,  ai: 'charger',  color: '#ff5a2a', draw: 'beast' },
  shield_demon:    { name: 'Shieldbearer',    hp: 70,  speed: 85,  dmg: 14, r: 17, exp: 8,  ai: 'chase',    color: '#c43a5a', draw: 'shieldbearer', shield: 60 },
  blood_bat:       { name: 'Blood Bat',       hp: 22,  speed: 190, dmg: 8,  r: 11, exp: 4,  ai: 'erratic',  color: '#ff2a55', draw: 'bat', lifesteal: true },
  hex_witch:       { name: 'Hex Witch',       hp: 50,  speed: 90,  dmg: 14, r: 13, exp: 8,  ai: 'blinker',  color: '#c43aff', draw: 'witch', ranged: true, range: 280, atkCd: 2.2, projSpeed: 320, pcolor: '#ff4dd2' },
  lava_golem:      { name: 'Magma Golem',     hp: 160, speed: 60,  dmg: 20, r: 22, exp: 14, ai: 'chase',    color: '#ff7a1a', draw: 'magmagolem', split: 'magma_blob' },
  magma_blob:      { name: 'Magma Blob',      hp: 30,  speed: 100, dmg: 9,  r: 11, exp: 3,  ai: 'chase',    color: '#ff9a3a', draw: 'slime' },
  brood_spider:    { name: 'Brood Spider',    hp: 70,  speed: 95,  dmg: 13, r: 17, exp: 9,  ai: 'chase',    color: '#7a3cff', draw: 'spider', split: 'spiderling', splitN: 3 },
  spiderling:      { name: 'Spiderling',      hp: 12,  speed: 150, dmg: 5,  r: 8,  exp: 2,  ai: 'chase',    color: '#a77bff', draw: 'spider' },
  dark_priest:     { name: 'Dark Priest',     hp: 60,  speed: 75,  dmg: 10, r: 14, exp: 10, ai: 'healer',   color: '#6a1a8a', draw: 'cultist', range: 240, atkCd: 3 },
  angel_sentinel:  { name: 'Sentinel',        hp: 70,  speed: 85,  dmg: 13, r: 14, exp: 10, ai: 'ranged',   color: '#ffe9a8', draw: 'sentinel', range: 300, atkCd: 2, projSpeed: 340, spread: 3, pcolor: '#fff2a8' },
  void_stalker:    { name: 'Void Stalker',    hp: 80,  speed: 110, dmg: 22, r: 14, exp: 12, ai: 'blinker',  color: '#5a3cff', draw: 'stalker' },
  storm_harpy:     { name: 'Storm Harpy',     hp: 55,  speed: 160, dmg: 12, r: 13, exp: 9,  ai: 'erratic',  color: '#7fd3ff', draw: 'harpy' },
  star_wisp:       { name: 'Star Mote',       hp: 35,  speed: 150, dmg: 30, r: 12, exp: 6,  ai: 'exploder', color: '#fff6a8', draw: 'starmote' },
  halo_turret:     { name: 'Halo Spire',      hp: 140, speed: 0,   dmg: 12, r: 18, exp: 14, ai: 'turret',   color: '#ffd66b', draw: 'spire', atkCd: 2.6, projSpeed: 220, pcolor: '#ffd66b' },
  golden_guardian: { name: 'Gilded Guardian', hp: 200, speed: 70,  dmg: 24, r: 20, exp: 18, ai: 'charger',  color: '#ffcf5a', draw: 'guardian', shield: 120 },
});

// ===== new bosses (hp/dmg come from the stage they appear in) =====
Object.assign(BOSSES, {
  cerberus:         { name: 'Cerberus',               r: 44, speed: 110, color: '#ff5a2a', draw: 'cerberus',    patterns: ['charge', 'breath', 'summon', 'burst'], minion: 'hellhound', pcolor: '#ff9a3a', stones: 120 },
  blood_queen:      { name: 'The Blood Queen',        r: 40, speed: 100, color: '#ff2a55', draw: 'bloodqueen',  patterns: ['teleport', 'spiral', 'summon', 'burst'], minion: 'blood_bat', pcolor: '#ff4d6d', stones: 130 },
  behemoth:         { name: 'Iron Behemoth',          r: 52, speed: 70,  color: '#c9a06a', draw: 'behemoth',    patterns: ['slam', 'charge', 'meteor', 'burst'], minion: 'lava_golem', pcolor: '#ffcf9a', stones: 140 },
  broodmother:      { name: 'The Broodmother',        r: 50, speed: 90,  color: '#7a3cff', draw: 'broodmother', patterns: ['summon', 'burst', 'teleport', 'slam'], minion: 'brood_spider', pcolor: '#c78bff', stones: 150 },
  demon_emperor:    { name: 'Demon Emperor Vargath',  r: 54, speed: 100, color: '#ff3355', draw: 'emperor',     patterns: ['laser', 'meteor', 'charge', 'summon', 'spiral', 'teleport'], minion: 'shield_demon', pcolor: '#ff6b7f', stones: 250, final: true },
  seraph_construct: { name: 'Seraph Construct',       r: 46, speed: 90,  color: '#fff2a8', draw: 'seraphboss',  patterns: ['laser', 'burst', 'meteor', 'teleport'], minion: 'angel_sentinel', pcolor: '#fff6d6', stones: 180 },
  storm_roc:        { name: 'Storm Roc',              r: 50, speed: 130, color: '#7fd3ff', draw: 'roc',         patterns: ['charge', 'breath', 'burst', 'summon'], minion: 'storm_harpy', pcolor: '#bff6ff', stones: 190 },
  astral_serpent:   { name: 'Astral Serpent',         r: 46, speed: 120, color: '#9f8bff', draw: 'serpent',     patterns: ['spiral', 'laser', 'charge', 'meteor'], minion: 'star_wisp', pcolor: '#d4c8ff', stones: 200 },
  eclipse_knight:   { name: 'The Eclipse Knight',     r: 40, speed: 130, color: '#d48bff', draw: 'eclipse',     patterns: ['teleport', 'charge', 'slam', 'laser', 'burst'], minion: 'void_stalker', pcolor: '#ff9a5a', stones: 220 },
  fallen_god:       { name: 'Aurelion, the Fallen God', r: 58, speed: 95, color: '#ffd66b', draw: 'fallengod', patterns: ['laser', 'meteor', 'teleport', 'spiral', 'summon', 'breath', 'slam', 'burst'], minion: 'golden_guardian', pcolor: '#ffe9a8', stones: 400, final: true },
});
const AWAKEN_EXTRA = { bone_lord: 'meteor', demon_general: 'laser', goblin_chief: 'teleport', marsh_hydra: 'meteor', elder_treant: 'meteor', frost_wyvern: 'laser', crystal_golem: 'laser', demon_lord: 'meteor', cerberus: 'teleport', behemoth: 'laser' };
for (const base in AWAKEN_EXTRA) {
  const b = BOSSES[base];
  BOSSES['aw_' + base] = Object.assign({}, b, { name: 'Awakened ' + b.name.replace(/^The /, ''), base, awakened: true, patterns: [...b.patterns, AWAKEN_EXTRA[base]], stones: (b.stones || 100) + 60 });
}
Object.assign(BOSS_TITLES, {
  cerberus: 'Gatekeeper of the Continent', blood_queen: 'Mistress of the Crimson Fen', behemoth: 'The Walking Fortress',
  broodmother: 'Mother of a Thousand Legs', demon_emperor: 'Master of the Abyss Lord', seraph_construct: 'Guardian of the Rift Gate',
  storm_roc: 'Wings of the Tempest', astral_serpent: 'Devourer of Stars', eclipse_knight: "The God's Champion", fallen_god: 'He Who Fell From Heaven',
});
for (const k in BOSSES) BOSSES[k].title = BOSSES[k].awakened ? 'Risen once more, stronger than before' : BOSS_TITLES[k];
Object.assign(LORE, {
  hellhound: 'Fire-blooded hounds that pounce from far away.',
  shield_demon: 'Its magic shield absorbs damage and regenerates. Break it fast.',
  blood_bat: 'Heals itself with every bite.',
  hex_witch: 'Teleports around the battlefield, then curses you from range.',
  lava_golem: 'A walking furnace that bursts into magma blobs.',
  magma_blob: 'A living drop of lava.',
  brood_spider: 'Releases a swarm of spiderlings when it dies.',
  spiderling: 'Tiny, fast and never alone.',
  dark_priest: 'Heals the enemies around it. Kill it first.',
  angel_sentinel: 'Fires three holy bolts at once.',
  void_stalker: 'Blinks right next to its prey and strikes hard.',
  storm_harpy: 'Darts unpredictably on storm winds.',
  star_wisp: 'A falling star that explodes on contact.',
  halo_turret: 'A floating spire that fires rings of light.',
  golden_guardian: 'Shielded, armored and charging. The Rift\'s elite.',
  cerberus: 'Three heads, three breaths. Calls hellhounds to the hunt.',
  blood_queen: 'Teleports through her bats and spins rings of blood.',
  behemoth: 'Calls down meteors and charges like a landslide.',
  broodmother: 'Endless spiders, and she can leap anywhere.',
  demon_emperor: 'Lasers, meteors and a shielded guard. The true ruler of demons.',
  seraph_construct: 'An angelic machine that sweeps the field with light.',
  storm_roc: 'Its lightning breath and diving charges are relentless.',
  astral_serpent: 'Coils of starlight that spiral and burn.',
  eclipse_knight: 'Teleports, slashes and fires beams of shadow.',
  fallen_god: 'Every attack of every boss, wielded by a god.',
});

// ===== regions + stages 9–28 =====
const REGIONS = [
  { name: 'The Abyss Frontier',  act: 'Act I',   from: 0,  to: 7 },
  { name: 'The Demon Continent', act: 'Act II',  from: 8,  to: 17 },
  { name: 'The Celestial Rift',  act: 'Act III', from: 18, to: 27 },
];
const mkTheme = (ground, ground2, speck, accent, bg, deco, ambient) => ({ ground, ground2, speck, accent, bg, deco, ambient });
const NEW_STAGES = [
  ['Ashgate Pass', 'cerberus', [10, 80], { hellhound: 3, imp: 2, demon: 2, shield_demon: 1 }, mkTheme('#2a1414', '#160808', '#ff6a3a', '#ff5a2a', '#0d0303', { crack: 3, spire: 3, bone: 1 }, 'ember'), 'The first road into the demon lands, guarded by a three-headed hound.'],
  ['Brimstone Wastes', 'aw_bone_lord', [24, 66], { lava_golem: 2, magma_blob: 2, imp: 2, bomber: 2, skeleton: 1 }, mkTheme('#33200e', '#1a0f06', '#ffb347', '#ffb347', '#100803', { lavapool: 2, rock: 3, crack: 2 }, 'ash'), 'Sulfur and ash. The Bone Lord has risen again, stronger.'],
  ['Blood Marsh', 'blood_queen', [14, 46], { blood_bat: 4, hex_witch: 2, wraith: 2, toad: 1 }, mkTheme('#2a0c16', '#14050a', '#ff4d6d', '#ff2a55', '#0b0205', { pool: 2, reed: 3, bone: 2 }, 'ember2'), 'A crimson bog where the Blood Queen feeds.'],
  ['Obsidian Citadel', 'aw_demon_general', [28, 28], { shield_demon: 3, cultist: 2, hex_witch: 2, demon: 2 }, mkTheme('#1a1424', '#0c0912', '#b06bff', '#c78bff', '#050308', { spire: 4, rune: 2 }, 'void'), 'A black fortress of shielded legions.'],
  ['Howling Canyon', 'behemoth', [44, 40], { hellhound: 4, lava_golem: 1, dark_priest: 1, demon: 2 }, mkTheme('#3a1e14', '#1e0f0a', '#ffcf9a', '#ff9a5a', '#0e0604', { rock: 4, bone: 2 }, 'dust'), 'Wind screams through the canyon. Something huge is coming.'],
  ['Sea of Cinders', 'aw_marsh_hydra', [56, 62], { lava_golem: 2, magma_blob: 3, bomber: 2, imp: 2 }, mkTheme('#301008', '#180804', '#ff8a3d', '#ff7a1a', '#0e0402', { lavapool: 4, crack: 2 }, 'ember'), 'An ocean of embers ruled by a burning Hydra.'],
  ['Webbed Hollow', 'broodmother', [70, 78], { brood_spider: 3, spiderling: 2, hex_witch: 1, dark_priest: 1 }, mkTheme('#16121e', '#0a0810', '#c4b0ff', '#a77bff', '#040306', { mushroom: 3, bone: 2, crystal: 1 }, 'dust'), 'Webs as thick as walls, and a mother at the center.'],
  ['Hellforge', 'aw_elder_treant', [84, 62], { shield_demon: 2, lava_golem: 2, dark_priest: 1, hellhound: 2 }, mkTheme('#2c1010', '#140606', '#ffcf5a', '#ff7a1a', '#0c0303', { lavapool: 3, spire: 2, rune: 1 }, 'ember'), 'The demon forges burn even the ancient Treant.'],
  ['Throne Road', 'aw_goblin_chief', [76, 38], { hex_witch: 2, shield_demon: 2, hellhound: 2, blood_bat: 2, dark_priest: 1 }, mkTheme('#22101c', '#10060c', '#ff4d7a', '#ff4d7a', '#080206', { rune: 3, spire: 2, bone: 2 }, 'ember2'), 'The last road to the Emperor. A familiar warlord blocks it.'],
  ["Emperor's Keep", 'demon_emperor', [88, 18], { shield_demon: 2, hex_witch: 2, hellhound: 2, lava_golem: 1, dark_priest: 1, demon: 2 }, mkTheme('#1c0a1c', '#0c040c', '#ff3355', '#ff3355', '#060106', { rune: 4, spire: 3, lavapool: 1 }, 'void'), 'The seat of the Demon Emperor. Act II final battle.'],
  ['Rift Gate', 'seraph_construct', [10, 20], { star_wisp: 3, angel_sentinel: 2, void_stalker: 1, storm_harpy: 2 }, mkTheme('#141c34', '#0a0f1e', '#9fd6ff', '#9fe8ff', '#03050c', { crystal: 3, cloud: 3 }, 'star'), 'A tear in the sky, guarded by an angelic machine.'],
  ['Cloud Isles', 'aw_frost_wyvern', [24, 34], { storm_harpy: 4, angel_sentinel: 2, star_wisp: 2 }, mkTheme('#2a3a5a', '#1a2640', '#ffffff', '#bfefff', '#0a1020', { cloud: 5, pillar: 1 }, 'feather'), 'Floating islands above the clouds, and a wyvern reborn.'],
  ['Marble Ruins', 'storm_roc', [12, 56], { golden_guardian: 1, angel_sentinel: 3, halo_turret: 1, star_wisp: 2 }, mkTheme('#2c2a38', '#1a1824', '#ffe9a8', '#ffd66b', '#09080e', { pillar: 4, cloud: 2 }, 'feather'), 'Fallen temples where the Storm Roc nests.'],
  ['Storm Spire', 'aw_crystal_golem', [26, 78], { storm_harpy: 3, halo_turret: 2, void_stalker: 2 }, mkTheme('#1a2030', '#0c1018', '#9fd6ff', '#7fd3ff', '#04060a', { pillar: 2, crystal: 3, rock: 2 }, 'star'), 'Lightning-scarred spires and an awakened Colossus.'],
  ['Starfield', 'astral_serpent', [44, 66], { star_wisp: 4, void_stalker: 2, angel_sentinel: 2 }, mkTheme('#0c1028', '#060816', '#fff2a8', '#fff2a8', '#020308', { starshard: 5, crystal: 1 }, 'star'), 'Stars fall like rain here.'],
  ['Hall of Halos', 'aw_cerberus', [52, 44], { halo_turret: 2, golden_guardian: 2, angel_sentinel: 2, dark_priest: 1 }, mkTheme('#2a2414', '#16120a', '#ffd66b', '#ffd66b', '#0a0804', { pillar: 3, rune: 3 }, 'feather'), 'A golden hall. Cerberus followed you here.'],
  ['Eclipse Fields', 'eclipse_knight', [66, 26], { void_stalker: 3, hex_witch: 2, star_wisp: 2, golden_guardian: 1 }, mkTheme('#1a0f2a', '#0c0616', '#ff9a5a', '#d48bff', '#05020a', { rune: 2, starshard: 3, crystal: 2 }, 'void'), "Endless twilight, where the god's champion waits."],
  ['Shattered Heaven', 'aw_behemoth', [80, 40], { storm_harpy: 2, golden_guardian: 2, halo_turret: 2, star_wisp: 2 }, mkTheme('#1e2440', '#0e1224', '#bfefff', '#9fe8ff', '#04060e', { cloud: 3, pillar: 2, starshard: 2 }, 'star'), 'Broken sky and an awakened Behemoth.'],
  ['Celestial Stair', 'aw_demon_lord', [72, 64], { angel_sentinel: 3, golden_guardian: 2, void_stalker: 2, halo_turret: 1 }, mkTheme('#2a2a40', '#16162a', '#fff6d6', '#fff2a8', '#08080e', { pillar: 4, cloud: 3 }, 'feather'), 'The stairway to the throne. An old enemy returns.'],
  ['Throne of the Fallen', 'fallen_god', [88, 82], { golden_guardian: 2, angel_sentinel: 2, void_stalker: 2, star_wisp: 2, halo_turret: 1, dark_priest: 1 }, mkTheme('#1a1430', '#0c0a1c', '#ffd66b', '#ffcf5a', '#040308', { rune: 3, starshard: 3, pillar: 2 }, 'star'), 'The Fallen God awaits. Final battle.'],
];
const CH_CYCLE = [['kills', 'bossTime'], ['dmg', 'nodash'], ['maxCards', 'kills'], ['bossTime', 'noboost'], ['dmg', 'kills']];
NEW_STAGES.forEach(([name, boss, map, enemies, theme, blurb], k) => {
  const i = 8 + k;
  const [a, b] = CH_CYCLE[k % CH_CYCLE.length];
  const mk = t => t === 'kills' ? { t, n: 900 + k * 40 } : t === 'bossTime' ? { t, n: 60 } : t === 'dmg' ? { t, n: 0.6 } : t === 'maxCards' ? { t, n: 4 } : { t };
  STAGES.push({ name, boss, map, enemies, theme, blurb, duration: 140 + k * 2, density: 1.45 + k * 0.04, rec: i < 18 ? 9 + i : 27 + Math.round((i - 18) * 1.2), ch: [mk(a), mk(b)] });
});
STAGES.forEach((s, i) => { s.region = i < 8 ? 0 : i < 18 ? 1 : 2; });
// first stage index where each boss appears (boss rush + boss scaling)
const BOSS_STAGE = {};
STAGES.forEach((s, i) => { if (BOSS_STAGE[s.boss] === undefined) BOSS_STAGE[s.boss] = i; });
const bossHpFor = i => Math.round(5600 * Math.pow(1.12, i - 7));
const bossDmgFor = i => 36 + 4 * (i - 7);

// ===== relics: one per boss; first clear grants it, replays may upgrade to + =====
const RELICS = [
  { id: 'horn',       boss: 'goblin_chief',     name: "Warchief's Horn",  icon: '♪', eff: 'sumDmg',     v: 0.10, desc: v => `Summons deal +${pct(v)} damage` },
  { id: 'heartwood',  boss: 'elder_treant',     name: 'Heartwood Seed',   icon: '♣', eff: 'regen',      v: 1,    desc: v => `Allen regenerates ${v} HP per second` },
  { id: 'prism',      boss: 'crystal_golem',    name: 'Prism Core',       icon: '◇', eff: 'pierce',     v: 1,    desc: v => `Piercing summon shots pierce ${v} more enemy` },
  { id: 'fang',       boss: 'marsh_hydra',      name: 'Hydra Fang',       icon: '✠', eff: 'poison',     v: 0.15, desc: v => `Summon hits have a ${pct(v)} chance to poison` },
  { id: 'bonecrown',  boss: 'bone_lord',        name: 'Bone Crown',       icon: '☠', eff: 'deathBlast', v: 1,    desc: v => `Summons explode when they fall (${pct(v * 0.5)} of their max HP)` },
  { id: 'frostscale', boss: 'frost_wyvern',     name: 'Frost Scale',      icon: '❄', eff: 'stoneSlow',  v: 0.4,  desc: v => `Allen's stones slow enemies by ${pct(v)}` },
  { id: 'banner',     boss: 'demon_general',    name: "General's Banner", icon: '⚑', eff: 'cap',        v: 1,    desc: v => `+${v} grimoire capacity` },
  { id: 'abyssheart', boss: 'demon_lord',       name: 'Abyss Heart',      icon: '♥', eff: 'skillCd',    v: 0.15, desc: v => `Special skill cooldowns −${pct(v)}` },
  { id: 'collar',     boss: 'cerberus',         name: 'Cerberus Collar',  icon: '◎', eff: 'beastSpd',   v: 0.25, desc: v => `Beast summons attack ${pct(v)} faster` },
  { id: 'chalice',    boss: 'blood_queen',      name: 'Blood Chalice',    icon: '♁', eff: 'killHeal',   v: 1,    desc: v => `Every kill heals Allen ${v} HP` },
  { id: 'plate',      boss: 'behemoth',         name: 'Behemoth Plate',   icon: '⛨', eff: 'armor',      v: 0.12, desc: v => `Allen takes ${pct(v)} less damage` },
  { id: 'broodsac',   boss: 'broodmother',      name: 'Brood Sac',        icon: '❂', eff: 'swarmExtra', v: 1,    desc: v => `Swarm cards summon ${v} extra creature${v > 1 ? 's' : ''}` },
  { id: 'seal',       boss: 'demon_emperor',    name: "Emperor's Seal",   icon: '♛', eff: 'stoneGain',  v: 0.25, desc: v => `+${pct(v)} magic stones` },
  { id: 'halo',       boss: 'seraph_construct', name: 'Halo Fragment',    icon: '○', eff: 'halo',       v: 0.10, desc: v => `Every 8s, gain a shield worth ${pct(v)} of max HP` },
  { id: 'feather',    boss: 'storm_roc',        name: 'Roc Feather',      icon: '➶', eff: 'swift',      v: 0.10, desc: v => `+${pct(v)} move speed, −${pct(v * 2)} dash cooldown` },
  { id: 'astral',     boss: 'astral_serpent',   name: 'Astral Scale',     icon: '✦', eff: 'mana',       v: 20,   desc: v => `+${v} max mana and +${Math.round(v * 0.75)}% mana regen` },
  { id: 'eclipse',    boss: 'eclipse_knight',   name: 'Eclipse Blade',    icon: '◐', eff: 'enhLong',    v: 3,    desc: v => `Enhance lasts ${v}s longer` },
  { id: 'godspark',   boss: 'fallen_god',       name: 'Godspark',         icon: '✺', eff: 'god',        v: 0.2,  desc: v => `All summons get +${pct(v)} HP and damage` },
];
function pct(v) { return Math.round(v * 100) + '%'; }
const RELIC_BY_BOSS = Object.fromEntries(RELICS.map(r => [r.boss, r]));

// ===== companions =====
const COMPANIONS = {
  roran: { name: 'Roran', title: 'Swordsman', ai: 'melee', hp: 260, dmg: 18, atkCd: 0.55, speed: 240, r: 14, color: '#8fb0ff', unlockAt: 7,
           desc: 'A steadfast swordsman. Charges into the thick of battle and draws enemy attention.', unlock: 'Joins when you clear Act I' },
  lysa:  { name: 'Lysa', title: 'Priestess', ai: 'priest', hp: 180, heal: 16, shield: 30, speed: 230, r: 13, color: '#fff2a8', unlockAt: 10,
           desc: 'Follows you, heals the most wounded ally and shields the party.', unlock: 'Joins after you clear Blood Marsh' },
  kael:  { name: 'Kael', title: 'Archer', ai: 'ranged', hp: 160, dmg: 26, atkCd: 0.7, range: 400, projSpeed: 700, pierce: 1, speed: 230, r: 13, color: '#9dff7a', unlockAt: 18,
           desc: 'A sharpshooter whose arrows pierce through enemy lines.', unlock: 'Joins after you clear Rift Gate' },
};

// ===== Hell Trials: optional curses that multiply EXP and stone rewards =====
const CURSES = [
  { id: 'swift',  name: 'Frenzy',        bonus: 0.3, desc: 'Enemies move 30% faster.' },
  { id: 'brutal', name: 'Brutality',     bonus: 0.4, desc: 'Enemies deal 50% more damage.' },
  { id: 'horde',  name: 'Endless Horde', bonus: 0.4, desc: '50% more enemies spawn.' },
  { id: 'frail',  name: 'Withering',     bonus: 0.3, desc: 'You cannot heal.' },
  { id: 'drain',  name: 'Mana Drought',  bonus: 0.3, desc: 'Mana regenerates 40% slower.' },
  { id: 'elite',  name: 'Champions',     bonus: 0.3, desc: 'Elite enemies appear 4× as often.' },
];

// ===== card awakening =====
const cardTier = id => { const c = CARDS[id]; return c.rank === 'fusion' ? 8 : RANKS.findIndex(r => r.id === c.rank); };
const awakenCost = id => ({ stones: 300 + 120 * cardTier(id), essence: 2 + Math.floor(cardTier(id) / 2) });

// ===== story =====
Object.assign(STORY.pre, {
  8: [['Grimoire', 'The Lord of the Abyss was only a puppet. Beyond the Abyss lies the Demon Continent.'],
      ['Allen', 'Then someone was pulling its strings.'],
      ['Roran', "And you're not walking in alone, summoner. Name's Roran. My sword is yours."],
      ['Grimoire', 'Companions fight at your side. Choose one on the map before each battle.']],
  10: [['Grimoire', 'The Blood Queen hunts here. Her bats drink the life of the living.'],
       ['Allen', 'Then we cut off the source.']],
  11: [['Lysa', "You freed the marsh from the Blood Queen. I'm Lysa, a priestess of the old temple. Let me heal your path."],
       ['Allen', 'We could use a healer. Welcome, Lysa.']],
  14: [['Grimoire', 'Webs as thick as walls. Something enormous is nesting below.'],
       ['Allen', "Spiders. Of course it's spiders."]],
  17: [['Grimoire', 'Emperor Vargath. He commanded the Abyss Lord and every demon you have fought.'],
       ['Allen', 'Then this is where the Demon Continent ends.']],
  18: [['Grimoire', 'The Celestial Rift. The air itself hums with power.'],
       ['Allen', 'Angels and storms. Stay close, everyone.']],
  19: [['Kael', "You fought your way through the Rift Gate? I've hunted these angels for years. I'm Kael. My arrows don't miss."],
       ['Allen', 'Good. Welcome to the party.']],
  22: [['Grimoire', 'Stars fall like rain here. Each one could burn a city.'],
       ['Allen', "Then let's not stand under them."]],
  24: [['Grimoire', 'The Eclipse Knight is the god\'s champion. It has never lost.'],
       ['Allen', 'Neither have I. Well... not lately.']],
  27: [['Grimoire', 'Aurelion. A god who fell from the heavens and wanted the world to fall with him.'],
       ['Allen', 'Every grind, every card, every fusion. It all led here.'],
       ['Grimoire', 'Then show a god what a summoner can do.']],
});
STORY.ending2 = [
  ['Vargath', 'Fool... I too was only a servant. Look up, summoner. The heavens are cracking.'],
  ['Grimoire', 'A rift has opened in the sky. Something divine is falling.'],
  ['Allen', 'Then we climb.'],
];
STORY.ending3 = [
  ['Grimoire', 'It is over. The heavens are quiet, and the god is gone.'],
  ['Allen', 'So what now?'],
  ['Grimoire', 'The tower still stands. The bosses still wait. And you, summoner, never stop grinding.'],
  ['Allen', 'Hell Mode, here I come.'],
];

// ===== achievements =====
ACHIEVEMENTS.find(a => a.id === 'all_stages').desc = 'Clear all 8 stages of Act I.';
ACHIEVEMENTS.find(a => a.id === 'all_stages').check = () => SAVE.cleared.slice(0, 8).every(Boolean);
ACHIEVEMENTS.find(a => a.id === 'bestiary').check = () => [...Object.keys(ENEMIES).filter(k => !ENEMIES[k].hidden), ...Object.keys(BOSSES).filter(k => !BOSSES[k].awakened && !BOSSES[k].event)].every(k => SAVE.bestiary[k]);
ACHIEVEMENTS.push(
  { id: 'act2',     name: 'Demon Slayer',            reward: 400, desc: 'Clear every stage of Act II.',            check: () => SAVE.cleared.slice(8, 18).every(Boolean) },
  { id: 'act3',     name: 'Godslayer',               reward: 800, desc: 'Clear every stage of Act III.',           check: () => SAVE.cleared.slice(18, 28).every(Boolean) },
  { id: 'lv40',     name: 'Peak Summoner',           reward: 300, desc: 'Reach level 40.',                         check: () => SAVE.level >= LEVEL_CAP },
  { id: 'relic6',   name: 'Relic Hunter',            reward: 120, desc: 'Own 6 relics.',                           check: () => Object.keys(SAVE.relics).length >= 6 },
  { id: 'relic18',  name: 'Curator',                 reward: 500, desc: 'Own all 18 relics.',                      check: () => Object.keys(SAVE.relics).length >= RELICS.length },
  { id: 'awaken1',  name: 'Awakening',               reward: 150, desc: 'Awaken a card.',                          check: () => Object.keys(SAVE.awakened).length >= 1 },
  { id: 'comps',    name: 'Fellowship',              reward: 150, desc: 'Unlock all 3 companions.',                check: () => Object.keys(COMPANIONS).every(k => SAVE.cleared[COMPANIONS[k].unlockAt]) },
  { id: 'trial3',   name: 'Glutton for Punishment',  reward: 200, desc: 'Clear a stage with 3 Hell Trial curses.', check: () => SAVE.counters.trial3 >= 1 },
  { id: 'rush',     name: 'Boss Rush Champion',      reward: 300, desc: 'Defeat every boss in a single Boss Rush.', check: () => SAVE.counters.rushDone >= 1 },
);
