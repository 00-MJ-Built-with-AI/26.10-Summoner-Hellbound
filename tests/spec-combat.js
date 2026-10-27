'use strict';
// ---------- Combat: summoning rules, every card, every enemy and boss pattern, win/lose, boosts, Overdrive ----------

group('Combat: summoning', () => {
  test('summoning costs mana and starts a cooldown', () => {
    H.save({ level: 5, hotbar: ['fang_wolf', null, null, null, null, null] });
    H.start(0);
    const mp = W.player.mp;
    trySummon(0);
    expect(W.summons.filter(s => s.id === 'fang_wolf').length, 'wolf summoned').toBe(1);
    expect(W.player.mp, 'mana spent').toBeCloseTo(mp - CARDS.fang_wolf.cost, 0.01);
    expect(W.slotCd[0], 'cooldown').toBeGreaterThan(0);
    trySummon(0);
    expect(W.summons.filter(s => s.id === 'fang_wolf').length, 'blocked by cooldown').toBe(1);
  });
  test('summoning is blocked without mana or capacity', () => {
    H.save({ level: 1, hotbar: ['stone_golem', 'spark_beetle', null, null, null, null] });
    H.start(0);
    W.player.mp = 0; trySummon(1);
    expect(W.summons.length, 'no mana').toBe(0);
    W.player.mp = 9999;
    for (let i = 0; i < 10; i++) { W.slotCd[1] = 0; trySummon(1); }
    expect(capUsed(), 'capacity respected').toBeLessThan(capacity() + 0.01);
  });
  test('Recall returns summons and refunds mana', () => {
    H.save({ level: 10, hotbar: ['fang_wolf', 'iron_boar', null, null, null, null] });
    H.start(0);
    W.player.mp = 9999; trySummon(0); trySummon(1);
    W.player.mp = 0;
    useSkill('KeyR');
    expect(W.summons.length, 'summons recalled').toBe(0);
    expect(W.player.mp, 'mana refunded').toBeGreaterThan(0);
  });
  test('all 100 cards summon, fight and use their special skill without errors', () => {
    H.save({ level: 40, cleared: 28, cardLv: 12, enh: 2, fusions: true });
    const fired = new Set(), bad = [];
    for (let k = 0; k < CARD_IDS.length; k += 6) {
      const bar = CARD_IDS.slice(k, k + 6); while (bar.length < 6) bar.push(null);
      SAVE.hotbar = bar;
      H.start(10 + (k / 6 | 0) % 18);
      H.spawnNear('goblin', 8, 150);
      for (let i = 0; i < 60 * 4; i++) {
        W.player.hp = W.player.maxHp; W.player.mp = 99999;
        if (i % 60 === 0) for (let j = 0; j < 6; j++) { W.slotCd[j] = 0; trySummon(j); }
        // capacity may block fragile cards from re-summoning; place one of each so every skill can be checked
        if (i === 119) for (const id of bar) if (id && !W.summons.some(s => s.id === id && !s.dead)) W.summons.push(makeSummon(id, W.player.x + 40, W.player.y));
        // fresh, targetable enemies at the cursor on the same frame, so aimed skills (marks) always have a target
        if (i === 120) { const m = mouseWorld(); for (let q = 0; q < 4; q++) spawnEnemy('goblin', m.x + q * 12, m.y).spawnT = 1; }
        if (i === 120) for (let j = 0; j < 6; j++) { const id = SAVE.hotbar[j]; if (!id) continue; W.cskCd[id] = 0; const n = SAVE.counters.skills; useCardSkill(j); if (SAVE.counters.skills > n) fired.add(id); }
        if (W.choosing) pickBoost(0);
        updateWorld(1 / 60);
        if (i % 40 === 0) renderWorld(1 / 60);
      }
      for (const id of bar) if (id && !SAVE.counters.summoned[id]) bad.push(id + ' was never summoned');
    }
    expect(bad, 'summon problems').toBeEmpty();
    expect(CARD_IDS.filter(id => !fired.has(id)), 'skills that did not fire').toBeEmpty();
  });
});

group('Combat: enemies & bosses', () => {
  test('every enemy type spawns, moves, attacks and can be killed', () => {
    H.save({ level: 30, cleared: 28 });
    H.start(20);
    const bad = [];
    for (const type in ENEMIES) {
      try {
        const [e] = H.spawnNear(type, 1, 160);
        H.sim(2.5, { god: true });
        if (!e.dead) { damageEnemy(e, 1e9, null); }
        if (!e.dead && !(e.shield > 0)) bad.push(type + ' survived a lethal hit');
      } catch (err) { bad.push(type + ': ' + err.message); }
    }
    expect(bad, 'enemy problems').toBeEmpty();
  });
  test('every boss uses each of its attack patterns without errors', () => {
    H.save({ level: 40, cleared: 28 });
    const bad = [];
    for (const id in BOSSES) {
      if (BOSSES[id].world) continue;
      try {
        H.start(BOSS_STAGE[id] ?? 0);
        W.st = Object.assign({}, W.st, { boss: id });
        W.time = W.st.duration;
        H.sim(5, { god: true, until: () => W.boss });
        const e = W.boss;
        if (!e) { bad.push(id + ': never spawned'); continue; }
        e.hp = e.maxHp = 1e12;
        const seen = new Set();
        for (let n = 0; n < e.bd.patterns.length; n++) {
          e.pat = null; e.patT = 0; e.stunT = 0;
          let started = false;
          H.sim(5, { god: true, until: () => { if (e.pat) { seen.add(e.pat); started = true; } return started && !e.pat; } });
        }
        const missing = e.bd.patterns.filter(p => !seen.has(p));
        if (missing.length) bad.push(`${id}: never used ${missing.join(', ')}`);
      } catch (err) { bad.push(id + ': ' + err.message); }
    }
    expect(bad, 'boss problems').toBeEmpty();
  });
  test('bosses enrage below half health', () => {
    H.save({ level: 20, cleared: 8 });
    H.start(3);
    W.time = W.st.duration; H.sim(5, { god: true, until: () => W.boss });
    W.boss.hp = W.boss.maxHp * 0.4;
    H.sim(0.2, { god: true });
    expect(W.boss.enraged, 'enraged').toBe(true);
  });
});

group('Combat: winning & losing', () => {
  test('defeating the boss wins the stage, records the clear and the first star', () => {
    H.save({ level: 10, cleared: 2, hotbar: ['fang_wolf', null, null, null, null, null] });
    H.start(2);
    H.killBoss();
    expect(STATE, 'result screen').toBe('result');
    expect(document.getElementById('resTitle').textContent, 'title').toBe('VICTORY');
    expect(SAVE.cleared[2], 'cleared').toBe(true);
    expect(SAVE.stars[2][0], 'first star').toBe(true);
    expect(SAVE.relics[RELIC_BY_BOSS.crystal_golem.id], 'relic granted').toBe(1);
    expect(stageUnlocked(3), 'next stage unlocked').toBe(true);
  });
  test('Allen dying ends the stage as a defeat and keeps EXP', () => {
    H.save({ level: 10, cleared: 2 });
    H.start(2);
    gainExp(5);
    const exp = SAVE.exp;
    W.player.inv = 0; hitAlly(W.player, 1e9);
    H.sim(4, { until: () => STATE !== 'play' });
    expect(STATE, 'result screen').toBe('result');
    expect(document.getElementById('resTitle').textContent, 'title').toBe('DEFEATED');
    expect(SAVE.exp, 'EXP kept').toBe(exp);
    expect(SAVE.cleared[2], 'not cleared').toBe(false);
  });
  test('challenge stars are judged correctly', () => {
    H.save({ level: 10 });
    H.start(0);
    W.kills = 350; W.bossKillTime = 30; W.dmgTaken = 10; W.dashes = 0; W.picks = 0; W.cardsUsed = new Set(['a', 'b']);
    expect(challengeMet({ t: 'kills', n: 300 }), 'kills').toBe(true);
    expect(challengeMet({ t: 'bossTime', n: 45 }), 'boss time').toBe(true);
    expect(challengeMet({ t: 'dmg', n: 0.6 }), 'damage').toBe(true);
    expect(challengeMet({ t: 'nodash' }), 'no dash').toBe(true);
    expect(challengeMet({ t: 'maxCards', n: 1 }), 'too many cards').toBe(false);
    W.kills = 10;
    expect(challengeMet({ t: 'kills', n: 300 }), 'too few kills').toBe(false);
  });
  test('Hell Mode loses half the run\'s stones on defeat', () => {
    H.save({ level: 10, mode: 'hell', cleared: 2 });
    SAVE.mode = 'hell'; H.start(1);
    W.stones = 100; SAVE.stones = 500;
    finishStage(false);
    expect(SAVE.stones, 'stones after penalty').toBe(450);
  });
});

group('Combat: systems', () => {
  test('the soul gauge offers 3 boosts and picking one applies it', () => {
    H.save({ level: 10, hotbar: ['fang_wolf', null, null, null, null, null] });
    H.start(0);
    W.soul = W.soulMax; addSoul(1);
    expect(W.choosing && W.choosing.length, 'choices').toBe(3);
    expect(document.getElementById('boostModal').classList.contains('hidden'), 'modal shown').toBe(false);
    const b = W.choosing[0];
    pickBoost(0);
    expect(W.boosts[b.id], 'boost applied').toBe(1);
    expect(W.choosing, 'modal closed').toBe(null);
  });
  test('Overdrive charges, summons the whole hotbar for free, then fades', () => {
    H.save({ level: 20, cleared: 8, hotbar: ['fang_wolf', 'gale_hawk', 'iron_boar', null, null, null] });
    H.start(5);
    useOverdrive();
    expect(W.odT, 'not charged → nothing').toBe(0);
    W.od = OD_MAX; const mp = W.player.mp;
    useOverdrive();
    expect(W.summons.filter(s => s.od).length, 'free summons').toBe(3);
    expect(W.player.mp, 'no mana spent').toBe(mp);
    expect(capUsed(), 'no capacity used').toBe(0);
    H.sim(12.5, { god: true });
    expect(W.summons.filter(s => s.od).length, 'faded after 12s').toBe(0);
  });
  test('synergies activate with 2 cards of a rank and boost them', () => {
    H.save({ level: 40, fusions: true, hotbar: ['ember_wyrm', 'frost_drake', 'fang_wolf', null, null, null] });
    expect(activeSynergies(), 'active').toContain('dragon');
    expect(activeSynergies(['ember_wyrm', 'fang_wolf']), 'one dragon is not enough').toBeEmpty();
    H.start(10);
    const boosted = makeSummon('ember_wyrm', 0, 0).dmg;
    W.syn = new Set();
    expect(boosted / makeSummon('ember_wyrm', 0, 0).dmg, 'dragon damage bonus').toBeCloseTo(1.25, 0.01);
  });
  test('companions fight, get knocked down and revive after 10 seconds', () => {
    H.save({ level: 20, cleared: 11 });
    SAVE.companion = 'roran';
    H.start(8);
    const r = W.summons.find(s => s.id === 'comp_roran');
    expect(!!r, 'Roran joined').toBeTruthy();
    killSummon(r);
    expect(r.down && !r.dead, 'knocked down, not dead').toBeTruthy();
    useSkill('KeyR');
    expect(W.summons.includes(r), 'Recall keeps companions').toBeTruthy();
    H.sim(10.5, { god: true });
    expect(r.down, 'revived').toBe(false);
    expect(r.hp, 'revived with HP').toBeGreaterThan(0);
  });
  test('Hell Trial curses change the fight and multiply rewards', () => {
    H.save({ level: 20, cleared: 8 });
    SAVE.curses = ['brutal', 'frail'];
    H.start(3);
    const e = spawnEnemy('goblin', 0, 0);
    SAVE.curses = []; H.start(3);
    const e0 = spawnEnemy('goblin', 0, 0);
    expect(e.dmg / e0.dmg, 'Brutality damage').toBeCloseTo(1.5, 0.01);
    SAVE.curses = ['frail']; H.start(3);
    W.player.hp = 10;
    expect(healPlayer(50), 'Withering blocks healing').toBe(0);
    expect(W.rewardMult, 'reward multiplier').toBeCloseTo(1.3, 0.01);
  });
  test('critical hits happen and hit-stop never freezes more than 10% of a fight', () => {
    H.save({ level: 40, cleared: 28, cardLv: 15, fusions: true, hotbar: ['seraphic_king', 'dragon_emperor', 'thunder_dragon', 'eye_of_the_void', 'phantom_lord', 'star_titan'] });
    H.start(20);
    W.time = W.st.duration;
    let frames = 0, frozen = 0, crits = 0;
    const orig = SFX.crit; SFX.crit = () => { crits++; };
    for (let i = 0; i < 60 * 20; i++) {
      frames++; if (W.hitstop > 0) frozen++;
      W.player.hp = W.player.maxHp; W.player.mp = 99999;
      if (i % 30 === 0) for (let j = 0; j < 6; j++) trySummon(j);
      if (W.choosing) pickBoost(0);
      if (W.boss) W.boss.hp = Math.max(W.boss.hp, W.boss.maxHp * 0.6);
      updateWorld(1 / 60);
    }
    SFX.crit = orig;
    expect(crits, 'critical hits').toBeGreaterThan(1);   // 8% per hit is random; this only checks crits happen at all
    expect(frozen / frames, 'share of frames frozen').toBeLessThan(0.1);
  });
  test('stage events: goblin, shrine, champion and meteor storm all start and finish', () => {
    H.save({ level: 30, cleared: 28, cardLv: 12, hotbar: ['ember_wyrm', 'fang_wolf', 'gale_hawk', 'arcane_wisp', null, null] });
    H.start(12);
    W.evT = 999;
    const log = [];
    for (const type of ['goblin', 'shrine', 'champion', 'storm']) {
      startEvent(type);
      log.push(type + (W.ev && W.ev.type === type ? ' started' : ' did not start'));
      for (let i = 0; i < 60 * 40 && W.ev; i++) {
        W.player.hp = W.player.maxHp; W.player.mp = 99999;
        if (type === 'shrine' && W.ev) { W.player.x = W.ev.x; W.player.y = W.ev.y; }
        if (type === 'champion' && W.ev && i === 60) damageEnemy(W.ev.e, 1e12, null);
        if (i % 30 === 0) for (let j = 0; j < 6; j++) trySummon(j);
        if (W.choosing) pickBoost(0);
        updateWorld(1 / 60);
      }
      if (W.ev) log.push(type + ' never finished');
    }
    expect(log.filter(l => !l.endsWith('started')), 'event problems').toBeEmpty();
    expect(W.buff && W.buff.type ? true : (SAVE.counters.shrines || 0) > 0, 'shrine gave a buff').toBeTruthy();
  });
});
