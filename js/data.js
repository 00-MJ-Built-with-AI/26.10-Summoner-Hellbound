'use strict';
// ---------- Static game data: ranks, cards, enemies, bosses, stages ----------

const RANKS = [
  { id: 'insect', name: 'Insect', grade: 'H', level: 1,  color: '#9cff57' },
  { id: 'beast',  name: 'Beast',  grade: 'G', level: 2,  color: '#ffb347' },
  { id: 'bird',   name: 'Bird',   grade: 'F', level: 4,  color: '#6fd3ff' },
  { id: 'grass',  name: 'Grass',  grade: 'E', level: 6,  color: '#4dffa6' },
  { id: 'stone',  name: 'Stone',  grade: 'D', level: 8,  color: '#e0c48f' },
  { id: 'fish',   name: 'Fish',   grade: 'C', level: 10, color: '#5ab8ff' },
  { id: 'spirit', name: 'Spirit', grade: 'B', level: 12, color: '#c78bff' },
  { id: 'dragon', name: 'Dragon', grade: 'A', level: 15, color: '#ff5a3c' },
];
const RANK_BY_ID = Object.fromEntries(RANKS.map(r => [r.id, r]));

// ai: melee | charger | flier | heal | thorns | taunt | buffer | ranged | dragon
const CARDS = {
  spark_beetle: {
    rank: 'insect', name: 'Spark Beetle', role: 'Swarm',
    desc: 'A crackling swarm of 3 beetles that rush the nearest foe.',
    cost: 8, cd: 1.0, count: 3, weight: 1 / 3, ai: 'melee',
    hp: 14, dmg: 3, atkCd: 0.45, speed: 215, r: 8, color: '#b6ff5c',
  },
  venom_mantis: {
    rank: 'insect', name: 'Venom Mantis', role: 'Poison',
    desc: 'Slashes with venomous scythes. Poison keeps burning after the hit.',
    cost: 14, cd: 1.8, ai: 'melee',
    hp: 36, dmg: 6, atkCd: 0.7, speed: 170, r: 12, poison: 4, color: '#d6ff4a',
  },
  fang_wolf: {
    rank: 'beast', name: 'Fang Wolf', role: 'Hunter',
    desc: 'A fast, ferocious hunter with very high attack speed.',
    cost: 18, cd: 2.2, ai: 'melee',
    hp: 65, dmg: 10, atkCd: 0.5, speed: 255, r: 14, color: '#ffb347',
  },
  iron_boar: {
    rank: 'beast', name: 'Iron Boar', role: 'Bruiser',
    desc: 'Armored tank that charges through enemy lines, scattering them.',
    cost: 24, cd: 3.5, ai: 'charger',
    hp: 170, dmg: 14, atkCd: 0.9, speed: 150, r: 18, knock: 320, color: '#ff8a3d',
  },
  gale_hawk: {
    rank: 'bird', name: 'Gale Hawk', role: 'Diver',
    desc: 'Circles high above you, then dives straight through enemies, hitting all in its path. Untargetable.',
    cost: 20, cd: 2.5, ai: 'flier', flying: true,
    hp: 50, dmg: 17, speed: 470, r: 12, color: '#6fd3ff',
  },
  healing_sprout: {
    rank: 'grass', name: 'Healing Sprout', role: 'Healer',
    desc: 'Takes root where summoned and heals you and summons nearby every second. Lasts 25s.',
    cost: 22, cd: 7, ai: 'heal', stationary: true,
    hp: 80, heal: 7, aura: 165, life: 25, r: 15, color: '#4dffa6',
  },
  thorn_vine: {
    rank: 'grass', name: 'Thorn Vine', role: 'Trap',
    desc: 'A field of thorns that slows and shreds every enemy inside. Lasts 20s.',
    cost: 20, cd: 6, ai: 'thorns', stationary: true,
    hp: 110, dmg: 6, aura: 130, life: 20, r: 16, slow: 0.55, color: '#37e07a',
  },
  stone_golem: {
    rank: 'stone', name: 'Stone Golem', role: 'Guardian',
    desc: 'A living fortress. Taunts nearby enemies to attack it and slams the ground.',
    cost: 32, cd: 9, ai: 'taunt', stationary: true, weight: 1.5,
    hp: 520, dmg: 16, atkCd: 1.3, aura: 260, slam: 90, r: 24, color: '#e0c48f',
  },
  tide_koi: {
    rank: 'fish', name: 'Tide Koi', role: 'Support',
    desc: 'Swims around you. Summons near it deal +35% damage, and it grants water shields.',
    cost: 28, cd: 8, ai: 'buffer', flying: true,
    hp: 90, aura: 230, buff: 0.35, shield: 25, speed: 230, r: 12, color: '#5ab8ff',
  },
  arcane_wisp: {
    rank: 'spirit', name: 'Arcane Wisp', role: 'Artillery',
    desc: 'Floats behind the front line, hurling orbs that explode on impact.',
    cost: 32, cd: 3.5, ai: 'ranged', flying: true,
    hp: 70, dmg: 20, atkCd: 1.25, range: 340, splash: 70, projSpeed: 430, speed: 190, r: 12, color: '#c78bff',
  },
  frost_spirit: {
    rank: 'spirit', name: 'Frost Spirit', role: 'Control',
    desc: 'Fires rapid ice shards that pierce through enemies and slow them.',
    cost: 28, cd: 3, ai: 'ranged', flying: true,
    hp: 65, dmg: 11, atkCd: 0.7, range: 310, projSpeed: 540, pierce: 2, slow: 0.5, speed: 190, r: 12, color: '#8ff0ff',
  },
  ember_wyrm: {
    rank: 'dragon', name: 'Ember Wyrm', role: 'Destroyer',
    desc: 'A true dragon. Scorches everything in a cone of flame and bites with crushing force.',
    cost: 70, cd: 18, ai: 'dragon', flying: true, weight: 3,
    hp: 450, dmg: 9, bite: 34, atkCd: 0.9, range: 250, speed: 245, r: 22, color: '#ff5a3c',
  },
};
// Fusion cards: discovered by fusing two Lv 5+ parent cards in the Grimoire
const FUSE_LV = 5;
const FUSION_RANK = { id: 'fusion', name: 'Fusion', grade: 'S', level: 1, color: '#ffd66b' };
RANK_BY_ID.fusion = FUSION_RANK;
Object.assign(CARDS, {
  plague_swarm: {
    rank: 'fusion', fusion: ['spark_beetle', 'venom_mantis'], fuseCost: 150, name: 'Plague Swarm', role: 'Swarm',
    desc: 'Four venomous beetles. Every bite poisons, and they swarm faster than any insect.',
    cost: 16, cd: 1.2, count: 4, weight: 0.25, ai: 'melee',
    hp: 26, dmg: 5, atkCd: 0.42, speed: 230, r: 9, poison: 5, color: '#c46bff',
  },
  warbeast: {
    rank: 'fusion', fusion: ['fang_wolf', 'iron_boar'], fuseCost: 250, name: 'Ironfang Warbeast', role: 'Juggernaut',
    desc: 'A colossal armored beast. Its charges stun, and its jaws tear through armor.',
    cost: 34, cd: 4, ai: 'charger', weight: 1.5,
    hp: 430, dmg: 26, atkCd: 0.6, speed: 210, r: 22, knock: 380, stunHit: 0.4, color: '#ff9a4a',
  },
  griffin: {
    rank: 'fusion', fusion: ['fang_wolf', 'gale_hawk'], fuseCost: 300, name: 'Storm Griffin', role: 'Sky Hunter',
    desc: 'Dives with thunderous force, stunning and scattering everything in its path. Untargetable.',
    cost: 30, cd: 3, ai: 'flier', flying: true,
    hp: 130, dmg: 34, speed: 520, r: 16, stunDive: 0.6, color: '#ffd66b',
  },
  grove_guardian: {
    rank: 'fusion', fusion: ['healing_sprout', 'stone_golem'], fuseCost: 400, name: 'Grove Guardian', role: 'Bastion',
    desc: 'An ancient guardian that taunts foes, slams the ground and heals every ally around it.',
    cost: 42, cd: 12, ai: 'taunt', stationary: true, weight: 1.5,
    hp: 820, dmg: 22, atkCd: 1.2, aura: 260, slam: 100, heal: 10, healAura: 190, r: 26, color: '#9dff7a',
  },
  leviathan: {
    rank: 'fusion', fusion: ['tide_koi', 'frost_spirit'], fuseCost: 500, name: 'Glacier Leviathan', role: 'Warden',
    desc: 'Circles you, boosting summons +45%, granting shields and releasing frost novas that slow enemies.',
    cost: 40, cd: 10, ai: 'buffer', flying: true,
    hp: 210, aura: 260, buff: 0.45, shield: 45, nova: 200, dmg: 18, speed: 240, r: 16, color: '#7fe9ff',
  },
  phoenix: {
    rank: 'fusion', fusion: ['arcane_wisp', 'ember_wyrm'], fuseCost: 700, name: 'Phoenix', role: 'Undying Flame',
    desc: 'Rains exploding fireballs from above. Rises from its ashes once when slain.',
    cost: 60, cd: 16, ai: 'ranged', flying: true, weight: 2,
    hp: 300, dmg: 40, atkCd: 0.9, range: 380, splash: 90, projSpeed: 480, speed: 240, r: 18, revive: true, color: '#ff8a3d',
  },
});
const CARD_IDS = Object.keys(CARDS);
for (const id of CARD_IDS) {
  const c = CARDS[id];
  c.tags = c.fusion ? [...new Set(c.fusion.map(f => CARDS[f].rank))] : [c.rank];
}

// Special skill per card: Shift + slot number (or long-press on touch)
const CARD_SKILLS = {
  spark_beetle:   { fx: 'detonate',  name: 'Chain Detonation', mp: 6,  cd: 6,  desc: 'All Spark Beetles explode, damaging nearby enemies. Consumes them.' },
  venom_mantis:   { fx: 'cloud',     name: 'Toxic Cloud',      mp: 10, cd: 10, desc: 'Releases a lingering poison cloud around the mantis.' },
  fang_wolf:      { fx: 'howl',      name: 'Howl',             mp: 12, cd: 14, desc: 'All summons deal +40% damage for 6s. Enemies near wolves freeze in fear.' },
  iron_boar:      { fx: 'rampage',   name: 'Rampage',          mp: 10, cd: 8,  desc: 'The boar charges at your cursor for triple damage, stunning what it hits.' },
  gale_hawk:      { fx: 'mark',      name: "Hunter's Mark",    mp: 10, cd: 12, desc: 'Marks the enemy nearest your cursor: +50% damage taken, and every flier dives at it.' },
  healing_sprout: { fx: 'bloom',     name: 'Bloom',            mp: 8,  cd: 15, desc: 'The sprout bursts, healing you and nearby summons for 35% of max HP. Consumes it.' },
  thorn_vine:     { fx: 'entangle',  name: 'Entangle',         mp: 10, cd: 12, desc: 'Roots every enemy inside the thorns for 2.5s.' },
  stone_golem:    { fx: 'fortress',  name: 'Fortress',         mp: 15, cd: 18, desc: 'Invulnerable for 6s, destroys nearby enemy projectiles and taunts a wider area.' },
  tide_koi:       { fx: 'wave',      name: 'Tidal Wave',       mp: 18, cd: 16, desc: 'A wave blasts enemies away from you and grants everyone a double shield.' },
  arcane_wisp:    { fx: 'bomb',      name: 'Spirit Bomb',      mp: 12, cd: 10, desc: 'The wisp hurls itself at your cursor in a massive explosion. Consumes it.' },
  frost_spirit:   { fx: 'blizzard',  name: 'Blizzard',         mp: 16, cd: 16, desc: 'A freezing storm around the spirit: enemies are frozen, then slowed and chilled.' },
  ember_wyrm:     { fx: 'inferno',   name: 'Inferno',          mp: 30, cd: 25, desc: 'The dragon rains fire on your cursor, scorching the area for 4s.' },
  plague_swarm:   { fx: 'detonate',  name: 'Plague Burst',     mp: 10, cd: 7,  desc: 'All plague beetles burst into poison clouds. Consumes them.' },
  warbeast:       { fx: 'rampage',   name: 'Rampage',          mp: 14, cd: 8,  desc: 'Charges at your cursor for triple damage, stunning everything it hits.' },
  griffin:        { fx: 'mark',      name: 'Storm Mark',       mp: 12, cd: 10, desc: 'Marks the enemy nearest your cursor for +50% damage; every flier dives at it.' },
  grove_guardian: { fx: 'sanctuary', name: 'Sanctuary',        mp: 20, cd: 20, desc: 'Invulnerable for 6s and heals every nearby ally for 40% of max HP.' },
  leviathan:      { fx: 'zero',      name: 'Absolute Zero',    mp: 24, cd: 20, desc: 'Freezes every enemy in a wide radius around you for 2.5s.' },
  phoenix:        { fx: 'nova',      name: 'Supernova',        mp: 28, cd: 22, desc: 'The phoenix detonates in a colossal blast. Consumes it.' },
};

// Permanent upgrades for Allen, bought with magic stones
const TALENTS = [
  { id: 'vitality',     name: 'Vitality',          icon: '♥', max: 5, base: 40,  desc: '+12% max HP per rank' },
  { id: 'reserves',     name: 'Deep Reserves',     icon: '✦', max: 5, base: 40,  desc: '+15 max mana per rank' },
  { id: 'manaflow',     name: 'Mana Flow',         icon: '≋', max: 5, base: 50,  desc: '+10% mana regeneration per rank' },
  { id: 'grimoire',     name: 'Expanded Grimoire', icon: '❖', max: 3, base: 120, desc: '+1 grimoire capacity per rank' },
  { id: 'sling',        name: 'Sling Mastery',     icon: '●', max: 5, base: 35,  desc: '+20% stone damage, +10% throw speed per rank' },
  { id: 'swift',        name: 'Swift Step',        icon: '»', max: 4, base: 45,  desc: '+5% move speed, −0.15s dash cooldown per rank' },
  { id: 'pact',         name: "Summoner's Pact",   icon: '✧', max: 5, base: 60,  desc: '+5% summon HP and damage per rank' },
  { id: 'quickcast',    name: 'Quick Cast',        icon: '⟳', max: 5, base: 50,  desc: '−6% summon cooldowns per rank' },
  { id: 'soul_harvest', name: 'Soul Harvest',      icon: '☾', max: 3, base: 70,  desc: '+15% soul gauge gain per rank' },
  { id: 'magnet',       name: 'Magnetism',         icon: '◎', max: 3, base: 30,  desc: '+25% pickup range per rank' },
];

// In-stage boosts offered when the soul gauge fills (tag = only offered if a card with that rank is equipped)
const BOOSTS = [
  { id: 'bloodlust',     name: 'Bloodlust',        icon: '⚔', desc: 'All summons deal +20% damage.' },
  { id: 'swarm',         name: 'Swarm Instinct',   icon: '✺', tag: 'insect', desc: 'Insect summons deal +40% damage.' },
  { id: 'pack',          name: 'Pack Leader',      icon: '☗', tag: 'beast',  desc: 'Beast summons get +40% HP and damage.' },
  { id: 'sky',           name: 'Sky Hunters',      icon: '➶', tag: 'bird',   desc: 'Bird summons dive twice as often.' },
  { id: 'bloom',         name: 'Verdant Bloom',    icon: '❀', tag: 'grass',  desc: 'Grass auras are 30% wider and heal 40% more.' },
  { id: 'bedrock',       name: 'Bedrock',          icon: '▲', tag: 'stone',  desc: 'Stone summons get +50% HP and 30% wider slams.' },
  { id: 'tide',          name: 'Tidecaller',       icon: '≈', tag: 'fish',   desc: 'Fish shields +50%, auras 30% wider.' },
  { id: 'spirit_surge',  name: 'Spirit Surge',     icon: '✶', tag: 'spirit', desc: 'Spirit summons attack 30% faster.' },
  { id: 'dragonfire',    name: 'Dragonfire',       icon: '♨', tag: 'dragon', desc: 'Dragon summons deal +50% damage.' },
  { id: 'arcane_well',   name: 'Arcane Well',      icon: '✦', desc: '+40% mana regeneration.' },
  { id: 'iron_skin',     name: 'Iron Skin',        icon: '⛨', desc: '+25% max HP and heal 30% now.' },
  { id: 'wide_grimoire', name: 'Wide Grimoire',    icon: '❖', desc: '+2 grimoire capacity.' },
  { id: 'quick_pages',   name: 'Quickened Pages',  icon: '⟳', desc: 'Summon cooldowns −25%.' },
  { id: 'sharp_stones',  name: 'Sharpened Stones', icon: '●', desc: "Allen's stones deal +60% damage and pierce one enemy." },
  { id: 'fleet',         name: 'Fleet Foot',       icon: '»', desc: '+15% move speed, dash cooldown −30%.' },
  { id: 'lucky',         name: 'Lucky Stones',     icon: '◆', desc: 'Magic stones drop twice as often.' },
  { id: 'soul_echo',     name: 'Soul Echo',        icon: '☾', desc: 'Special skill cooldowns −30%.' },
  { id: 'mana_burst',    name: 'Mana Burst',       icon: '✹', desc: 'Refill your mana now. Every kill restores 1 mana.' },
];

// Two optional challenges per stage (plus clearing it = 3 stars)
const STAGE_CH = [
  [{ t: 'kills', n: 300 }, { t: 'bossTime', n: 45 }],
  [{ t: 'dmg', n: 0.6 },   { t: 'nodash' }],
  [{ t: 'maxCards', n: 3 }, { t: 'kills', n: 450 }],
  [{ t: 'bossTime', n: 40 }, { t: 'noboost' }],
  [{ t: 'dmg', n: 0.5 },   { t: 'kills', n: 600 }],
  [{ t: 'maxCards', n: 4 }, { t: 'bossTime', n: 45 }],
  [{ t: 'nodash' },        { t: 'dmg', n: 0.6 }],
  [{ t: 'kills', n: 800 }, { t: 'bossTime', n: 60 }],
];

const BOSS_TITLES = {
  goblin_chief: 'Tyrant of the Meadow', elder_treant: 'The Century-Sleeper', crystal_golem: 'Heart of the Caverns',
  marsh_hydra: 'Coiled Terror of the Fen', bone_lord: 'King of an Endless War', frost_wyvern: 'Sovereign of the Peaks',
  demon_general: 'Warden of the Demon Gate', demon_lord: 'The Last Throne',
};

const LORE = {
  slime: 'Bounces toward anything warm. Splits in two when struck down.',
  slimelet: 'A slime fragment. Small, fast and still hungry.',
  goblin: 'Cowardly alone, dangerous in mobs. Carries a crude club.',
  goblin_archer: 'Keeps its distance and fires arrows. Close in fast.',
  wolf: 'Hunts in packs and closes distance quickly.',
  bat: 'Flits erratically through cave air. Hard to pin down.',
  rock_crab: 'A shell like a boulder. Slow, but it hits hard.',
  shardling: 'A living crystal that fires shards from range.',
  toad: 'Spits glowing venom from across the bog.',
  wraith: 'Drifts straight through your summons to reach you.',
  imp: 'A gleeful fire-thrower. Weak, but always in groups.',
  skeleton: 'A soldier who never stopped marching.',
  bomber: 'Runs at you, then explodes. Kill it before it arrives.',
  ice_wolf: 'Its bite chills you, slowing your steps.',
  yeti: 'Winds up a crushing charge. Dodge sideways.',
  demon: 'Charges recklessly at the nearest prey.',
  cultist: 'Hurls abyssal bolts and summons trouble.',
  goblin_chief: 'Charges, slams and calls goblin reinforcements.',
  elder_treant: 'Its roots erupt beneath you. Wolves answer its call.',
  crystal_golem: 'Fires crystal rings and spirals. Charges when angered.',
  marsh_hydra: 'Three heads, three times the poison breath.',
  bone_lord: 'Raises skeletons and spins curses around itself.',
  frost_wyvern: 'Its icy breath sweeps the battlefield.',
  demon_general: 'A relentless warrior with every trick of war.',
  demon_lord: 'Commands every pattern of every boss before it.',
};

const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'First Blood',            reward: 10,  desc: 'Defeat your first enemy.',                    check: () => SAVE.stats.kills >= 1 },
  { id: 'slayer1k',    name: 'Slayer',                 reward: 40,  desc: 'Defeat 1,000 enemies.',                       check: () => SAVE.stats.kills >= 1000 },
  { id: 'slayer10k',   name: 'Army of One',            reward: 150, desc: 'Defeat 10,000 enemies.',                      check: () => SAVE.stats.kills >= 10000 },
  { id: 'beetles',     name: 'Bug Collector',          reward: 50,  desc: 'Summon 1,000 Spark Beetles.',                 check: () => (SAVE.counters.summoned.spark_beetle || 0) >= 1000 },
  { id: 'first_boss',  name: 'Giant Slayer',           reward: 30,  desc: 'Defeat a boss.',                              check: () => SAVE.counters.bosses >= 1 },
  { id: 'flawless',    name: 'Untouchable',            reward: 120, desc: 'Defeat a boss without taking damage during the fight.', check: () => SAVE.counters.flawless >= 1 },
  { id: 'all_stages',  name: 'Conqueror of the Abyss', reward: 300, desc: 'Clear all 8 stages.',                         check: () => SAVE.cleared.every(Boolean) },
  { id: 'dragon',      name: 'Dragon Tamer',           reward: 100, desc: 'Unlock the Dragon rank.',                     check: () => SAVE.level >= RANK_BY_ID.dragon.level },
  { id: 'fusion1',     name: 'Alchemist',              reward: 50,  desc: 'Fuse your first card.',                       check: () => Object.keys(SAVE.fused).length >= 1 },
  { id: 'fusion6',     name: 'Master of Pacts',        reward: 200, desc: 'Discover all 6 fusions.',                     check: () => Object.keys(SAVE.fused).length >= 6 },
  { id: 'card20',      name: 'Perfect Bond',           reward: 100, desc: 'Raise a card to Lv 20.',                      check: () => CARD_IDS.some(id => SAVE.cards[id].lv >= 20) },
  { id: 'enh5',        name: 'Fully Enhanced',         reward: 100, desc: 'Enhance a card to 5 stars.',                  check: () => CARD_IDS.some(id => SAVE.cards[id].enh >= 5) },
  { id: 'talent',      name: 'Self-Improvement',       reward: 60,  desc: 'Max out any talent.',                         check: () => TALENTS.some(t => (SAVE.talents[t.id] || 0) >= t.max) },
  { id: 'skills100',   name: 'Tactician',              reward: 60,  desc: 'Use 100 special skills.',                     check: () => SAVE.counters.skills >= 100 },
  { id: 'tower10',     name: 'Climber',                reward: 80,  desc: 'Reach Abyss Tower floor 10.',                 check: () => SAVE.towerBest >= 10 },
  { id: 'tower25',     name: 'Tower Breaker',          reward: 200, desc: 'Reach Abyss Tower floor 25.',                 check: () => SAVE.towerBest >= 25 },
  { id: 'stars',       name: 'Perfectionist',          reward: 300, desc: 'Earn every challenge star.',                  check: () => SAVE.stars.every(s => s.every(Boolean)) },
  { id: 'bestiary',    name: 'Monster Scholar',        reward: 150, desc: 'Discover every enemy and boss.',              check: () => [...Object.keys(ENEMIES), ...Object.keys(BOSSES)].every(k => SAVE.bestiary[k]) },
  { id: 'hell',        name: 'Born in Hell',           reward: 100, desc: 'Clear a stage on Hell Mode.',                 check: () => SAVE.mode === 'hell' && SAVE.cleared.some(Boolean) },
];

// Story: the Grimoire is a talking book bound to Allen
const STORY = {
  pre: [
    [['Grimoire', 'Wake, summoner. You hold me now: the Grimoire of a Thousand Pacts.'],
     ['Allen', 'A talking book... So this is the Summoner class. No sword. No spells. Just you.'],
     ['Grimoire', 'Just me, and everything I can call. Start small. The insects answer first.'],
     ['Allen', "Small is fine. I'll grind until even dragons answer."]],
    [['Grimoire', 'The woods whisper of a Treant that has not slept in a century.'],
     ['Allen', "Then we'll give it a reason to stay awake. Wolves, with me."]],
    [['Allen', 'These crystals hum. Is that... a heartbeat?'],
     ['Grimoire', 'The Colossus sleeps within the caverns. Its shards will fly when it wakes. Stay mobile.']],
    [['Grimoire', 'Spirits drift above the marsh. They pass through summons to reach the living.'],
     ['Allen', 'So I keep moving. And the Hydra? Three heads, three problems.']],
    [['Allen', 'The ground is still warm. What happened here?'],
     ['Grimoire', 'A war no one won. The Bone Lord keeps fighting it anyway.']],
    [['Grimoire', "The Frost Wyvern rules these peaks. Its breath can freeze a summon solid."],
     ['Allen', "Then I'll summon faster than it can freeze."]],
    [['Grimoire', 'Beyond this frontier lie the demon lands. Their General guards the gate.'],
     ['Allen', 'Every rank, every card, every grind. It was all for this road.']],
    [['Grimoire', 'The Lord of the Abyss awaits. Few summoners ever reached this throne.'],
     ['Allen', 'Few summoners had you.'],
     ['Grimoire', '...Flattery. Go, Allen. Show it everything a grimoire can hold.']],
  ],
  ending: [
    ['Grimoire', 'The Abyss is silent. You did it, summoner.'],
    ['Allen', 'We did. Though I bet there is a harder mode out there somewhere.'],
    ['Grimoire', 'There is always further to climb. The Abyss Tower still stands, and it has no top.'],
  ],
  tower: [
    ['Grimoire', 'The Abyss Tower. Every floor deeper, every foe stronger. It has no top.'],
    ['Allen', 'A place where the enemies never run out? Perfect grinding spot.'],
  ],
};

// ai: chase | erratic | ranged | charger | exploder
const ENEMIES = {
  slime:         { name: 'Slime',         hp: 16, speed: 70,  dmg: 6,  r: 14, exp: 2, ai: 'chase',   color: '#5dffb0', draw: 'slime', split: 'slimelet' },
  slimelet:      { name: 'Slimelet',      hp: 6,  speed: 105, dmg: 3,  r: 8,  exp: 1, ai: 'chase',   color: '#5dffb0', draw: 'slime' },
  goblin:        { name: 'Goblin',        hp: 24, speed: 92,  dmg: 8,  r: 13, exp: 3, ai: 'chase',   color: '#8fd14f', draw: 'goblin' },
  goblin_archer: { name: 'Goblin Archer', hp: 18, speed: 85,  dmg: 7,  r: 12, exp: 3, ai: 'ranged',  color: '#b5d65a', draw: 'goblin', bow: true, range: 300, atkCd: 2.2, projSpeed: 330, pcolor: '#ffe08a' },
  wolf:          { name: 'Grey Wolf',     hp: 22, speed: 150, dmg: 7,  r: 13, exp: 3, ai: 'chase',   color: '#a3acc0', draw: 'beast' },
  bat:           { name: 'Cave Bat',      hp: 10, speed: 175, dmg: 4,  r: 10, exp: 2, ai: 'erratic', color: '#b07cff', draw: 'bat' },
  rock_crab:     { name: 'Rock Crab',     hp: 70, speed: 55,  dmg: 12, r: 18, exp: 6, ai: 'chase',   color: '#ff9f6b', draw: 'crab' },
  shardling:     { name: 'Shardling',     hp: 20, speed: 80,  dmg: 7,  r: 12, exp: 4, ai: 'ranged',  color: '#7fe9ff', draw: 'shard', range: 280, atkCd: 2.0, projSpeed: 300, pcolor: '#9ff6ff' },
  toad:          { name: 'Bog Toad',      hp: 30, speed: 75,  dmg: 8,  r: 15, exp: 4, ai: 'ranged',  color: '#6fbf4a', draw: 'toad', range: 240, atkCd: 2.5, projSpeed: 260, pcolor: '#b6ff3c' },
  wraith:        { name: 'Wraith',        hp: 26, speed: 120, dmg: 9,  r: 13, exp: 4, ai: 'chase',   color: '#9fd6ff', draw: 'wraith', ghost: true },
  imp:           { name: 'Fire Imp',      hp: 22, speed: 110, dmg: 7,  r: 11, exp: 4, ai: 'ranged',  color: '#ff4d3a', draw: 'imp', range: 260, atkCd: 1.8, projSpeed: 340, pcolor: '#ff8a2e' },
  skeleton:      { name: 'Skeleton Knight', hp: 60, speed: 80, dmg: 13, r: 15, exp: 5, ai: 'chase',  color: '#e8e2cf', draw: 'skeleton' },
  bomber:        { name: 'Bomb Sprite',   hp: 14, speed: 140, dmg: 22, r: 12, exp: 3, ai: 'exploder', color: '#ffcf3a', draw: 'bomber' },
  ice_wolf:      { name: 'Frost Wolf',    hp: 28, speed: 165, dmg: 8,  r: 13, exp: 4, ai: 'chase',   color: '#bfefff', draw: 'beast', chill: true },
  yeti:          { name: 'Yeti',          hp: 110, speed: 70, dmg: 16, r: 22, exp: 9, ai: 'charger', color: '#f2f7ff', draw: 'yeti' },
  demon:         { name: 'Lesser Demon',  hp: 55, speed: 105, dmg: 12, r: 15, exp: 6, ai: 'charger', color: '#ff3355', draw: 'demon' },
  cultist:       { name: 'Abyss Cultist', hp: 34, speed: 80,  dmg: 10, r: 13, exp: 5, ai: 'ranged',  color: '#a05cff', draw: 'cultist', range: 300, atkCd: 2.0, projSpeed: 300, pcolor: '#d06bff' },
};

// patterns: burst | spiral | charge | slam | summon | breath
const BOSSES = {
  goblin_chief:  { name: 'Goblin Warchief', hp: 650,  dmg: 16, r: 38, speed: 85,  color: '#9be35a', draw: 'warchief', patterns: ['charge', 'summon', 'slam', 'burst'], minion: 'goblin', pcolor: '#ffe08a', stones: 25 },
  elder_treant:  { name: 'Elder Treant',    hp: 1100, dmg: 18, r: 46, speed: 55,  color: '#4fd16a', draw: 'treant', patterns: ['slam', 'summon', 'burst', 'spiral'], minion: 'wolf', pcolor: '#9dff7a', stones: 35 },
  crystal_golem: { name: 'Crystal Colossus', hp: 1500, dmg: 20, r: 44, speed: 60, color: '#7fe9ff', draw: 'crystal', patterns: ['burst', 'spiral', 'slam', 'charge'], minion: 'shardling', pcolor: '#9ff6ff', stones: 45 },
  marsh_hydra:   { name: 'Marsh Hydra',     hp: 2000, dmg: 22, r: 46, speed: 60,  color: '#62e08a', draw: 'hydra', patterns: ['spiral', 'burst', 'summon', 'breath'], minion: 'toad', pcolor: '#b6ff3c', stones: 55 },
  bone_lord:     { name: 'Bone Lord',       hp: 2600, dmg: 25, r: 42, speed: 75,  color: '#d6c7ff', draw: 'bonelord', patterns: ['summon', 'charge', 'spiral', 'slam'], minion: 'skeleton', pcolor: '#c49bff', stones: 70 },
  frost_wyvern:  { name: 'Frost Wyvern',    hp: 3200, dmg: 28, r: 46, speed: 95,  color: '#9fe8ff', draw: 'wyvern', patterns: ['breath', 'charge', 'burst', 'spiral'], minion: 'ice_wolf', pcolor: '#c8f6ff', stones: 85 },
  demon_general: { name: 'Demon General',   hp: 4000, dmg: 32, r: 44, speed: 95,  color: '#ff3355', draw: 'general', patterns: ['charge', 'slam', 'spiral', 'summon', 'burst'], minion: 'demon', pcolor: '#ff6b7f', stones: 100 },
  demon_lord:    { name: 'Lord of the Abyss', hp: 5600, dmg: 36, r: 50, speed: 90, color: '#b06bff', draw: 'abysslord', patterns: ['burst', 'spiral', 'slam', 'summon', 'breath', 'charge'], minion: 'cultist', pcolor: '#d48bff', stones: 150 },
};

const STAGES = [
  { name: 'Verdant Meadow', boss: 'goblin_chief', duration: 100, density: 1.0, rec: 1, map: [12, 78],
    enemies: { slime: 5, goblin: 4 },
    theme: { ground: '#10301c', ground2: '#0a2213', speck: '#9dff9a', accent: '#7dff9a', bg: '#040d07', deco: { tuft: 6, flower: 3, rock: 1 }, ambient: 'firefly' },
    blurb: 'Soft hills outside the village. Slimes and goblins roam freely.' },
  { name: 'Whispering Woods', boss: 'elder_treant', duration: 110, density: 1.1, rec: 3, map: [27, 58],
    enemies: { goblin: 3, goblin_archer: 2, wolf: 4, slime: 1 },
    theme: { ground: '#0d2416', ground2: '#07160d', speck: '#5fd47a', accent: '#5fffb0', bg: '#030a06', deco: { tree: 3, mushroom: 3, tuft: 4 }, ambient: 'firefly' },
    blurb: 'Ancient trees hide wolf packs and goblin archers.' },
  { name: 'Crystal Caverns', boss: 'crystal_golem', duration: 115, density: 1.15, rec: 5, map: [44, 72],
    enemies: { bat: 4, rock_crab: 2, shardling: 3 },
    theme: { ground: '#141a33', ground2: '#0b0f22', speck: '#7fe9ff', accent: '#7fe9ff', bg: '#04050d', deco: { crystal: 4, rock: 3 }, ambient: 'dust' },
    blurb: 'Glowing crystal tunnels. Watch for crystal shooters.' },
  { name: 'Sunken Marsh', boss: 'marsh_hydra', duration: 120, density: 1.2, rec: 7, map: [57, 48],
    enemies: { toad: 3, wraith: 3, slime: 2, bat: 1 },
    theme: { ground: '#10261f', ground2: '#081812', speck: '#b6ff3c', accent: '#b6ff3c', bg: '#030a07', deco: { reed: 4, pool: 2, mushroom: 2 }, ambient: 'spore' },
    blurb: 'Fog, poison and restless spirits drifting over the bog.' },
  { name: 'Ashen Wastes', boss: 'bone_lord', duration: 125, density: 1.25, rec: 9, map: [71, 68],
    enemies: { imp: 3, skeleton: 3, bomber: 2 },
    theme: { ground: '#2a1512', ground2: '#170a08', speck: '#ff8a3d', accent: '#ff7b2e', bg: '#0d0403', deco: { bone: 3, crack: 3, rock: 2 }, ambient: 'ember' },
    blurb: 'Scorched battlefields where the dead refuse to rest.' },
  { name: 'Frozen Peaks', boss: 'frost_wyvern', duration: 130, density: 1.3, rec: 11, map: [84, 46],
    enemies: { ice_wolf: 4, yeti: 2, wraith: 2 },
    theme: { ground: '#1a2a3a', ground2: '#0f1b28', speck: '#e8f6ff', accent: '#bfefff', bg: '#050a10', deco: { ice: 3, snowrock: 3 }, ambient: 'snow' },
    blurb: 'Blizzards, frost wolves and a wyvern ruling the skies.' },
  { name: 'Demon Frontier', boss: 'demon_general', duration: 135, density: 1.35, rec: 13, map: [70, 24],
    enemies: { demon: 3, cultist: 3, imp: 2, bomber: 1 },
    theme: { ground: '#24102a', ground2: '#140717', speck: '#ff4d7a', accent: '#ff4d7a', bg: '#0b030d', deco: { rune: 2, crack: 3, bone: 2 }, ambient: 'ember2' },
    blurb: 'The border of the demon lands. Cultists open rifts here.' },
  { name: 'Abyssal Throne', boss: 'demon_lord', duration: 140, density: 1.45, rec: 15, map: [46, 16],
    enemies: { demon: 3, cultist: 2, skeleton: 2, wraith: 2, bomber: 1 },
    theme: { ground: '#110c26', ground2: '#08061a', speck: '#b06bff', accent: '#c78bff', bg: '#030208', deco: { rune: 3, crystal: 2, crack: 2 }, ambient: 'void' },
    blurb: 'The heart of the abyss. Defeat its Lord.' },
];

const PLAYER = {
  hp: L => 90 + 14 * (L - 1),
  mp: L => 50 + 7 * (L - 1),
  regen: L => 5 + 0.4 * (L - 1),
  cap: L => Math.min(16, 4 + Math.floor((L - 1) / 2)),
  stone: L => 5 + 1.3 * (L - 1),
  expNext: L => Math.floor(30 * Math.pow(L, 1.7)),
};

const CARD_PROG = {
  maxLv: 20,
  maxEnh: 5,
  expNext: lv => Math.floor(12 * Math.pow(lv, 1.5)),
  mult: (lv, enh) => (1 + 0.1 * (lv - 1)) * (1 + 0.15 * enh),
  enhCost: enh => 25 * (enh + 1) * (enh + 1),
};

const MODES = {
  normal: { name: 'Normal',    exp: 1,   ehp: 1,   edmg: 1,   stones: 1 },
  hell:   { name: 'Hell Mode', exp: 0.1, ehp: 1.7, edmg: 1.5, stones: 2 },
};

const SKILLS = [
  { key: 'Space', label: 'SPC', name: 'Dash',    icon: '»', cd: 1.4, mp: 0,  desc: 'Quick dash with brief invulnerability.' },
  { key: 'KeyQ',  label: 'Q',   name: 'Enhance', icon: '✦', cd: 14,  mp: 25, desc: 'All summons deal +50% damage and move/attack 30% faster for 6s.' },
  { key: 'KeyE',  label: 'E',   name: 'Swap',    icon: '⇄', cd: 8,   mp: 10, desc: 'Swap places with the summon nearest your cursor.' },
  { key: 'KeyR',  label: 'R',   name: 'Recall',  icon: '↺', cd: 3,   mp: 0,  desc: 'Return all summons to the grimoire, refunding some mana.' },
];

// attach per-stage challenges and boss titles (needs STAGES/BOSSES above)
STAGES.forEach((s, i) => { s.ch = STAGE_CH[i]; });
for (const k in BOSSES) BOSSES[k].title = BOSS_TITLES[k];
