'use strict';
// v8: unlimited levels, Paragon, talents, awakening ×10, 20 stars, difficulty, pace, tiers, speed, automation, legends, visuals

group('Unlimited progression', () => {
  test('cards level past 40 and stars go to 20', () => {
    H.save({ level: 50, stones: 1e7 });
    const cs = SAVE.cards.fang_wolf;
    cs.lv = 40; H.start(1);
    for (let k = 0; k < 30; k++) addCardExp('fang_wolf', CARD_PROG.expNext(cs.lv));
    expect(cs.lv > 40, 'past 40').toBe(true);
    expect(CARD_PROG.mult(60, 0) > CARD_PROG.mult(40, 0), 'stronger').toBe(true);
    expect(CARD_PROG.maxEnh, 'max stars').toBe(20);
    expect(CARD_PROG.enhCost(19) > CARD_PROG.enhCost(4), 'costs rise').toBe(true);
  });
  test('Paragon: one point per level past 70, spent on permanent bonuses', () => {
    H.save({ level: 80 });
    expect(pgFree(), '10 points').toBe(10);
    const hp0 = pstat(false).hp;
    expect(spendParagon('fort', 10), 'spent').toBe(true);
    expect(pgFree(), 'none left').toBe(0);
    expect(pstat(false).hp > hp0, 'more HP').toBe(true);
    expect(spendParagon('might', 1), 'no points').toBe(false);
  });
  test('20 new talents, and every talent reaches rank 20 without breaking stats', () => {
    expect(TALENTS.length, 'talents').toBe(30);
    expect(TALENTS.every(t => t.max === 20), 'all to 20').toBe(true);
    H.save({ level: 60 });
    const cd0 = pstat(false).cdMult;
    for (const t of TALENTS) SAVE.talents[t.id] = 20;
    const s = pstat(false);
    expect(s.cdMult > 0.2 && s.cdMult < cd0, 'cooldowns shorter but sane').toBe(true);
    expect(s.skillCd > 0.3, 'skill cooldowns sane').toBe(true);
    H.start(5); W.player.mp = 999; trySummon(0);
    H.sim(1, { god: true, render: true });
  });
  test('awakening goes up to 10 levels, each stronger and pricier', () => {
    H.save({ level: 70, stones: 1e8, cardLv: 80, hotbar: ['fang_wolf', null, null, null, null, null] });
    SAVE.essence = 9999;
    for (let k = 0; k < 12; k++) doAwaken('fang_wolf');
    expect(awkLv('fang_wolf'), 'level 10').toBe(10);
    expect(awakenStatus('fang_wolf').ok, 'no more').toBe(false);
    H.start(1); W.player.mp = 999; trySummon(0);
    const s = W.summons.find(x => x.id === 'fang_wolf');
    SAVE.awakened.fang_wolf = 1; const s1 = makeSummon('fang_wolf', 0, 0);
    expect(s.maxHp > s1.maxHp * 2, 'awakening X much stronger than I').toBe(true);
  });
});

group('Difficulty, pace and tiers', () => {
  test('Hard/Nightmare/Hell raise enemy strength and rewards; best clear is remembered', () => {
    H.save({ level: 20, cleared: 3 });
    H.start(2); const hp0 = W.sm.hp, r0 = W.rewardMult;
    SAVE.diff = 3; H.start(2);
    expect(W.sm.hp, 'enemy HP ×4').toBe(hp0 * 4);
    expect(W.rewardMult, 'rewards ×4').toBe(r0 * 4);
    H.killBoss();
    expect(SAVE.diffClears[2], 'Hell clear recorded').toBe(3);
  });
  test('pace shortens the stage and packs it with more enemies', () => {
    H.save({ level: 20, cleared: 3 });
    H.start(2); const d0 = W.st.duration, den0 = W.st.density;
    SAVE.pace = 2; H.start(2);
    expect(W.st.duration < d0 * 0.5, 'shorter').toBe(true);
    expect(W.st.density > den0 * 2, 'denser').toBe(true);
  });
  test('Hell Tiers go to 20, pay up to ×10 and shorten stages', () => {
    expect(TIER_MAX, 'max tier').toBe(20);
    expect(tierReward(20), '×10 at tier 20').toBe(10);
    H.save({ level: 50, cleared: 28 });
    H.start(5); const d0 = W.st.duration;
    SAVE.tierMax = 20; SAVE.tier = 7; H.start(5);
    expect(W.st.duration < d0 * 0.65, 'tier 7 stage is much shorter').toBe(true);
  });
  test('skip to boss on 3-starred stages; game speed runs extra steps', () => {
    H.save({ level: 20, cleared: 3 });
    SAVE.stars[1] = [true, true, true]; SAVE.seenStory[1] = true;
    skipToBoss(1);
    expect(W.time >= W.st.duration, 'boss is next').toBe(true);
    H.sim(4, { god: true, until: () => W.boss });
    expect(!!W.boss, 'boss came fast').toBe(true);
    W.timeScale = 1; SETTINGS.gameSpeed = 1; let t0 = W.t; updateWorld(1 / 60); const one = W.t - t0;
    W.timeScale = 1; SETTINGS.gameSpeed = 2; t0 = W.t; updateWorld(1 / 60);
    expect(W.t - t0 > one * 1.5, 'two steps in one frame').toBe(true);
    SETTINGS.gameSpeed = 1;
  });
});

group('Automation v8 and settings', () => {
  test('auto summon keeps the chosen number of each card on the field', () => {
    H.save({ level: 30, cardLv: 10, hotbar: ['fang_wolf', 'iron_boar', null, null, null, null] });
    SAVE.auto.summon = true; SAVE.auto.keep = [3, 1, 0, 0, 0, 0];
    H.start(3); W.player.mp = 9999;
    H.sim(6, { god: true });
    expect(W.summons.filter(s => s.id === 'fang_wolf').length, 'three wolves').toBe(3);
    expect(W.summons.filter(s => s.id === 'iron_boar').length, 'one boar').toBe(1);
  });
  test('auto Overdrive fires again every time the gauge refills', () => {
    H.save({ level: 30, cardLv: 10, hotbar: ['fang_wolf', null, null, null, null, null] });
    SAVE.auto.f = true;
    H.start(3); H.spawnNear('goblin', 6, 150);
    let fired = 0;
    for (let k = 0; k < 3; k++) { W.od = OD_MAX; const t = W.odT; H.sim(0.5, { god: true }); if (W.odT > t) fired++; W.odT = 0; }
    expect(fired, 'three times').toBe(3);
  });
  test('summon capacity setting multiplies how many summons fit', () => {
    H.save({ level: 30 });
    const c0 = pstat(false).cap;
    SETTINGS.capMult = 2;
    expect(pstat(false).cap, 'double').toBe(Math.round(c0 * 2));
    SETTINGS.capMult = 1;
  });
  test('background play keeps the battle running and the map shows a wallet', () => {
    H.save({ level: 30, stones: 1234 });
    SETTINGS.bgPlay = true;
    H.start(3);
    STATE = 'play'; const hf = document.hasFocus; document.hasFocus = () => false; pauseGame(); document.hasFocus = hf;
    expect(STATE, 'not paused when allowed in background').toBe('play');
    SETTINGS.bgPlay = false;
    showScreen('map');
    expect($('walletBar').textContent.includes('1,234'), 'stones shown').toBe(true);
  });
});

group('Mythic legends and visuals', () => {
  test('20 legends + 10 legendary fusions: all fight, skill and draw', () => {
    expect(LEGENDS.length + LEGEND_FUSIONS.length, 'new cards').toBe(30);
    const errs = [], ids = [...LEGENDS.map(l => l[0]), ...LEGEND_FUSIONS.map(f => f[0])];
    for (let k = 0; k < ids.length; k += 6) {
      const hot = ids.slice(k, k + 6);
      try {
        H.save({ level: 70, cardLv: 30, fusions: true, hotbar: hot });
        H.start(30); W.player.mp = 99999;
        H.spawnNear('goblin', 12, 140);
        H.sim(3, { god: true, summon: true, skills: true, render: true });
        for (const id of hot) { const cv = document.createElement('canvas'); cv.width = cv.height = 96; renderCardIcon(cv, id); }
      } catch (e) { errs.push(hot.join(',') + ': ' + e.message); }
    }
    expect(errs, 'failures').toEqual([]);
  });
  test('creature visuals: every quality level renders, tiers by rank', () => {
    H.save({ level: 70, cardLv: 30, hotbar: ['spark_beetle', 'kitsune', 'bahamut', 'chimera', 'gale_hawk', 'iron_boar'] });
    H.start(30); W.player.mp = 99999; for (let k = 0; k < 6; k++) trySummon(k);
    for (const q of ['low', 'medium', 'high']) { SETTINGS.quality = q; renderWorld(1 / 60); }
    SETTINGS.quality = 'auto';
    expect(creatureTier(W.summons.find(s => s.id === 'spark_beetle')), 'insect tier').toBe(0);
    expect(creatureTier(W.summons.find(s => s.id === 'chimera')), 'primordial tier').toBe(4);
  });
});
