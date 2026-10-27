'use strict';
// ---------- Content integrity: every card, enemy, boss, stage and data table is consistent ----------

const SUMMON_AIS = ['melee', 'charger', 'flier', 'heal', 'thorns', 'taunt', 'buffer', 'ranged', 'dragon', 'archon', 'priest'];
const ENEMY_AIS = ['chase', 'erratic', 'ranged', 'charger', 'exploder', 'blinker', 'healer', 'turret', 'flee'];
const BOSS_PATTERNS = ['burst', 'spiral', 'charge', 'slam', 'summon', 'breath', 'teleport', 'laser', 'meteor'];

group('Boot', () => {
  test('all game scripts load without errors', () => {
    expect(window.__loadErrors, 'script errors').toBeEmpty();
    for (const name of ['CARDS', 'STAGES', 'BOSSES', 'startStage', 'renderWorld', 'showScreen', 'SFX', 'MUSIC']) expect(typeof window[name] !== 'undefined' || eval(`typeof ${name}`) !== 'undefined', name).toBeTruthy();
  });
  test('the title screen is shown on start', () => {
    showScreen('title');
    expect(document.getElementById('scr-title').classList.contains('active'), 'title visible').toBeTruthy();
  });
});

group('Content: cards', () => {
  test('100 cards across 9 ranks + fusions', () => {
    expect(CARD_IDS.length, 'card count').toBe(100);
    expect(new Set(CARD_IDS).size, 'unique ids').toBe(CARD_IDS.length);
    expect(RANKS.length, 'ranks').toBe(9);
    expect(CARD_IDS.filter(id => CARDS[id].fusion).length, 'fusions').toBe(36);
    for (const r of RANKS) expect(CARD_IDS.filter(id => CARDS[id].rank === r.id).length, r.name + ' cards').toBeAtLeast(3);
  });
  test('every card has valid stats, AI, tags and rank', () => {
    const bad = [];
    for (const id of CARD_IDS) {
      const c = CARDS[id];
      if (!RANK_BY_ID[c.rank]) bad.push(id + ': unknown rank');
      if (!SUMMON_AIS.includes(c.ai)) bad.push(id + ': unknown ai ' + c.ai);
      if (!(c.cost > 0 && c.cd > 0 && c.hp > 0)) bad.push(id + ': cost/cd/hp must be positive');
      if (!c.name || !c.desc || !c.role) bad.push(id + ': missing text');
      if (!c.tags || !c.tags.length || c.tags.some(t => !RANK_BY_ID[t])) bad.push(id + ': bad tags');
      if (['ranged', 'archon'].includes(c.ai) && !c.range) bad.push(id + ': ranged card without range');
      if (['heal', 'thorns', 'taunt', 'buffer'].includes(c.ai) && !c.aura) bad.push(id + ': aura card without aura');
      if (c.ai === 'ranged' && !c.projSpeed) bad.push(id + ': ranged card without projSpeed');
      if (c.count > 1 && !(c.weight > 0)) bad.push(id + ': swarm card without weight');
    }
    expect(bad, 'invalid cards').toBeEmpty();
  });
  test('every card has a special skill and a drawing', () => {
    const bad = [];
    for (const id of CARD_IDS) {
      const sk = CARD_SKILLS[id];
      if (!sk) { bad.push(id + ': no skill'); continue; }
      if (!SKILL_FX[sk.fx]) bad.push(id + ': unknown skill effect ' + sk.fx);
      if (!(sk.mp >= 0 && sk.cd > 0 && sk.name && sk.desc)) bad.push(id + ': incomplete skill');
      if (typeof DR[id] !== 'function') bad.push(id + ': no drawing');
    }
    expect(bad, 'cards').toBeEmpty();
  });
  test('every fusion recipe uses two real, different parents', () => {
    const bad = [], seen = new Set();
    for (const id of CARD_IDS.filter(k => CARDS[k].fusion)) {
      const [a, b] = CARDS[id].fusion;
      if (!CARDS[a] || !CARDS[b]) bad.push(id + ': missing parent');
      if (a === b) bad.push(id + ': same parent twice');
      if (!(CARDS[id].fuseCost > 0)) bad.push(id + ': no fuse cost');
      const key = [a, b].sort().join('+');
      if (seen.has(key)) bad.push(id + ': duplicate recipe ' + key);
      seen.add(key);
    }
    expect(bad, 'fusions').toBeEmpty();
  });
  test('every card icon renders (unlocked and locked)', () => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 96;
    const bad = [];
    for (const id of CARD_IDS) { try { renderCardIcon(cv, id); renderCardIcon(cv, id, true); } catch (e) { bad.push(id + ': ' + e.message); } }
    expect(bad, 'icon errors').toBeEmpty();
  });
});

group('Content: enemies & bosses', () => {
  test('every enemy has a drawing, valid AI and stats', () => {
    const bad = [];
    for (const k in ENEMIES) {
      const d = ENEMIES[k];
      if (typeof DR[d.draw] !== 'function') bad.push(k + ': no drawing ' + d.draw);
      if (!ENEMY_AIS.includes(d.ai)) bad.push(k + ': unknown ai ' + d.ai);
      if (!(d.hp > 0 && d.r > 0)) bad.push(k + ': bad stats');
      if (d.split && !ENEMIES[d.split]) bad.push(k + ': split into unknown ' + d.split);
      if (['ranged', 'turret'].includes(d.ai) && !d.projSpeed) bad.push(k + ': shooter without projSpeed');
      if (!LORE[k]) bad.push(k + ': no bestiary lore');
    }
    expect(bad, 'enemies').toBeEmpty();
  });
  test('every boss has a drawing, size, title, valid patterns and minion', () => {
    const bad = [];
    for (const k in BOSSES) {
      const b = BOSSES[k];
      if (typeof DR[b.draw] !== 'function') bad.push(k + ': no drawing');
      if (!(BOSS_DRAW_R[b.draw] > 0)) bad.push(k + ': no draw size');
      if (!b.title) bad.push(k + ': no title');
      if (!b.patterns.length || b.patterns.some(p => !BOSS_PATTERNS.includes(p))) bad.push(k + ': bad patterns ' + b.patterns);
      if (!ENEMIES[b.minion]) bad.push(k + ': unknown minion ' + b.minion);
      if (!b.awakened && !LORE[k]) bad.push(k + ': no lore');
    }
    expect(bad, 'bosses').toBeEmpty();
  });
  test('every enemy and boss portrait renders', () => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 110;
    const bad = [];
    for (const k of [...Object.keys(ENEMIES), ...Object.keys(BOSSES).filter(k => !BOSSES[k].awakened)]) {
      try { renderEnemyIcon(cv, k); renderEnemyIcon(cv, k, true); } catch (e) { bad.push(k + ': ' + e.message); }
    }
    expect(bad, 'portrait errors').toBeEmpty();
  });
});

group('Content: stages & world', () => {
  test('38 stages in 4 regions, each fully defined', () => {
    expect(STAGES.length, 'stages').toBe(38);
    const bad = [];
    STAGES.forEach((s, i) => {
      if (!BOSSES[s.boss]) bad.push(i + ': unknown boss ' + s.boss);
      for (const e in s.enemies) if (!ENEMIES[e]) bad.push(i + ': unknown enemy ' + e);
      for (const d in s.theme.deco) if (typeof DECO[d] !== 'function') bad.push(i + ': unknown decoration ' + d);
      if (!s.ch || s.ch.length !== 2) bad.push(i + ': needs 2 challenges');
      else for (const c of s.ch) if (!challengeText(c)) bad.push(i + ': challenge without text');
      if (!(s.map[0] >= 0 && s.map[0] <= 100 && s.map[1] >= 0 && s.map[1] <= 100)) bad.push(i + ': map position off the map');
      if (![0, 1, 2, 3].includes(s.region)) bad.push(i + ': no region');
      if (!(s.duration > 0 && s.density > 0 && s.rec > 0)) bad.push(i + ': bad timing');
      if (!THEMES[musicKey(i)]) bad.push(i + ': no music theme ' + musicKey(i));
    });
    expect(bad, 'stages').toBeEmpty();
    expect(REGIONS.map(r => r.to - r.from + 1), 'stages per region').toEqual([8, 10, 10, 10]);
  });
  test('every stage ground and decorations draw', () => {
    const bad = [];
    for (let i = 0; i < STAGES.length; i++) {
      try { groundPattern(i); const d = genDeco(i); expect(d.length, 'decorations').toBeGreaterThan(100); } catch (e) { bad.push(i + ': ' + e.message); }
    }
    expect(bad, 'stage art').toBeEmpty();
  });
  test('relics: one per original boss (23), all with working descriptions', () => {
    expect(RELICS.length, 'relics').toBe(23);
    const bad = [];
    for (const r of RELICS) {
      if (!BOSSES[r.boss]) bad.push(r.id + ': unknown boss');
      if (typeof r.desc(r.v) !== 'string') bad.push(r.id + ': description');
    }
    expect(bad, 'relics').toBeEmpty();
    for (let i = 0; i < STAGES.length; i++) expect(!!RELIC_BY_BOSS[BOSSES[STAGES[i].boss].base || STAGES[i].boss], 'stage ' + (i + 1) + ' boss has a relic').toBeTruthy();
  });
  test('story scenes reference real speakers and have text', () => {
    const lines = [...Object.values(STORY.pre).flat(), ...STORY.ending, ...STORY.ending2, ...STORY.ending3, ...STORY.tower];
    expect(lines.filter(([who, text]) => !who || !text || text.length < 5), 'bad lines').toBeEmpty();
  });
  test('achievements have unique ids and their checks run', () => {
    H.save();
    expect(new Set(ACHIEVEMENTS.map(a => a.id)).size, 'unique').toBe(ACHIEVEMENTS.length);
    const bad = [];
    for (const a of ACHIEVEMENTS) { try { a.check(); } catch (e) { bad.push(a.id + ': ' + e.message); } if (!(a.reward > 0)) bad.push(a.id + ': no reward'); }
    expect(bad, 'achievements').toBeEmpty();
  });
  test('synergies, talents, boosts, curses, equipment and cosmetics are well-formed', () => {
    H.save();
    for (const k in SYNERGIES) expect(!!RANK_BY_ID[k], 'synergy rank ' + k).toBeTruthy();
    expect(TALENTS.every(t => t.max > 0 && t.base > 0), 'talents').toBeTruthy();
    expect(BOOSTS.every(b => !b.tag || RANK_BY_ID[b.tag]), 'boost tags').toBeTruthy();
    expect(CURSES.length, 'curses').toBe(6);
    for (const it of EQUIP) for (const k in it.base) expect(typeof STAT_TEXT[k], 'stat text ' + k).toBe('function');
    for (const o of OUTFITS) expect(typeof o.ok(), 'outfit ' + o.id).toBe('boolean');
    for (const c of CIRCLES) expect(typeof c.ok(), 'circle ' + c.id).toBe('boolean');
    for (const k in QUEST_TYPES) expect(typeof QUEST_TYPES[k].get('beast'), 'quest counter ' + k).toBe('number');
  });
});
