'use strict';
// v6 features: run upgrades, evolution paths, Act IV, co-op, village, altar, calendar, arena, PWA, photo mode, accessibility

group('Run upgrades', () => {
  test('run EXP levels the run and offers 3 upgrades to pick from', () => {
    H.save({ level: 10, hotbar: ['spark_beetle', 'fang_wolf', null, null, null, null] });
    H.start(2);
    expect(W.rl, 'starts at run level 0').toBe(0);
    gainExp(W.sm.exp * W.mode.exp * W.rewardMult * runExpNext(0) + 0.01);
    expect(W.rl, 'run level 1').toBe(1);
    expect(W.choosingKind, 'run choice open').toBe('run');
    expect(W.choosing.length, 'three choices').toBe(3);
    const u = W.choosing[0];
    pickBoost(0);
    expect(W.ru[u.id], 'picked upgrade applied').toBe(1);
    expect(W.choosing, 'modal closed').toBe(null);
  });
  test('works at the level cap, and the pool respects max stacks and equipped ranks', () => {
    H.save({ level: LEVEL_CAP, hotbar: ['spark_beetle', null, null, null, null, null] });
    H.start(5);
    gainExp(W.sm.exp * W.mode.exp * W.rewardMult * runExpNext(0) + 0.01);
    expect(W.rl, 'levels at cap').toBe(1);
    W.choosing = null; W.choosingKind = null;
    for (const u of RUN_UPGRADES) W.ru[u.id] = u.max;
    expect(runPool().length, 'everything maxed').toBe(0);
    W.ru = {};
    const ids = runPool().map(u => u.id);
    expect(ids.includes('dragonx'), 'dragon upgrade hidden without a dragon').toBe(false);
    expect(ids.includes('swarmx'), 'insect upgrade offered').toBe(true);
  });
  test('every run upgrade at max stacks runs a full fight without errors', () => {
    H.save({ level: 40, cardLv: 15, hotbar: ['fang_wolf', 'gale_hawk', 'spark_beetle', 'iron_boar', null, null] });
    H.start(10);
    for (const u of RUN_UPGRADES) W.ru[u.id] = u.max;
    refreshStats();
    H.spawnNear('goblin', 30, 140);
    H.sim(12, { god: true, summon: true, skills: true, render: true });
    expect(W.kills > 0, 'enemies died').toBe(true);
  });
  test('stat upgrades change Allen: capacity, HP, speed, cooldowns', () => {
    H.save({ level: 20 });
    H.start(1);
    const b = Object.assign({}, W.ps);
    W.ru = { page: 2, heart: 1, stride: 1, focus: 1, godhand: 1 };
    refreshStats();
    expect(W.ps.cap, 'capacity').toBe(b.cap + 4);
    expect(W.ps.hp > b.hp, 'more HP').toBe(true);
    expect(W.ps.speed > b.speed, 'faster').toBe(true);
    expect(W.ps.cdMult < b.cdMult, 'shorter cooldowns').toBe(true);
  });
  test('Phoenix Feather revives once, Twin Souls splits beasts, Mirror Grimoire adds twins', () => {
    H.save({ level: 10, hotbar: ['fang_wolf', null, null, null, null, null] });
    H.start(1);
    W.ru = { phoenix: 1, split: 1, twin: 1 };
    W.player.hp = 0; playerDie();
    expect(W.player.dead, 'revived').toBe(false);
    expect(W.player.hp > 0, 'has HP').toBe(true);
    W.player.hp = 0; playerDie();
    expect(W.player.dead, 'second death is real').toBe(true);
    H.save({ level: 10, hotbar: ['fang_wolf', null, null, null, null, null] });
    H.start(1);
    W.ru = { split: 1, twin: 1 };
    W.player.mp = 999; trySummon(0);
    expect(W.summons.filter(s => s.id === 'fang_wolf').length, 'wolf + twin').toBe(2);
    killSummon(W.summons.find(s => s.id === 'fang_wolf'));
    expect(W.summons.filter(s => s.isSplit && !s.dead).length, 'split into two').toBe(2);
  });
});

group('Evolution paths', () => {
  test('all 64 base cards have one power path and one support path; fusions have none', () => {
    const base = CARD_IDS.filter(id => !CARDS[id].fusion), bad = [];
    for (const id of base) {
      const p = evoPaths(id);
      if (!p || EVO_STYLES[p[0]].lean !== 'power' || EVO_STYLES[p[1]].lean !== 'support') bad.push(id);
    }
    expect(base.length, 'base cards').toBe(64);
    expect(bad, 'cards without two paths').toEqual([]);
    expect(CARD_IDS.filter(id => CARDS[id].fusion && evoPaths(id)).length, 'fusions with paths').toBe(0);
  });
  test('choosing a path is free the first time, changing costs stones, and needs awakening', () => {
    H.save({ level: 20, stones: 500 });
    const [pw, sp] = evoPaths('fang_wolf');
    expect(chooseEvo('fang_wolf', pw), 'not awakened').toBe(false);
    SAVE.awakened.fang_wolf = true;
    expect(chooseEvo('fang_wolf', pw), 'first pick').toBe(true);
    expect(SAVE.stones, 'free').toBe(500);
    expect(chooseEvo('fang_wolf', sp), 'change').toBe(true);
    expect(SAVE.stones, 'respec cost').toBe(500 - EVO_RESPEC);
    expect(evoName('fang_wolf').startsWith(EVO_STYLES[sp].name), 'evolved name').toBe(true);
  });
  test('every evolution style changes stats, hits and special skill without errors', () => {
    const errs = [];
    for (const st of Object.keys(EVO_STYLES)) {
      const id = CARD_IDS.find(i => !CARDS[i].fusion && evoPaths(i).includes(st) && RANK_BY_ID[CARDS[i].rank].level <= 20);
      if (!id) { errs.push(st + ': no low-rank card'); continue; }
      H.save({ level: 20, cardLv: 20, hotbar: [id, null, null, null, null, null] });
      SAVE.awakened[id] = true; SAVE.evo[id] = st;
      try {
        H.start(3);
        W.player.mp = 9999; trySummon(0);
        const s = W.summons.find(x => x.id === id);
        if (!s || s.evo !== st) { errs.push(st + ': summon not evolved'); continue; }
        H.spawnNear('goblin', 12, 90);
        H.sim(3, { god: true, render: true });
        W.cskCd[id] = 0; useCardSkill(0);
        H.sim(2, { god: true, render: true });
      } catch (e) { errs.push(st + ': ' + e.message); }
    }
    expect(errs, 'failures').toEqual([]);
  });
  test('the Grimoire offers both paths on an awakened card', () => {
    H.save({ level: 20, cardLv: 20, stones: 0 });
    SAVE.awakened.fang_wolf = true;
    GF.rank = 'all'; GF.q = '';
    grimTab = 'cards'; showScreen('grimoire');
    const btns = [...document.querySelectorAll('#grimContent [data-evo]')];
    expect(btns.length, 'two path buttons').toBe(2);
    btns[0].click();
    expect(SAVE.evo.fang_wolf, 'path saved').toBe(evoPaths('fang_wolf')[0]);
  });
});
