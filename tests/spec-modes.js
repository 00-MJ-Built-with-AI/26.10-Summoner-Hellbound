'use strict';
// ---------- Modes: tutorial, story, Abyss Tower, Boss Rush, Daily Trial, World Boss, Sanctum, quests ----------

group('Modes', () => {
  test('the tutorial walks through every step on a first playthrough', () => {
    H.save({ level: 1, tutorial: true, hotbar: ['spark_beetle', 'venom_mantis', null, null, null, null] });
    H.start(0);
    expect(!!W.tut, 'tutorial running').toBeTruthy();
    const steps = [];
    for (let guard = 0; guard < 4000 && W.tut; guard++) {
      const id = TUT_STEPS[W.tut.step].id;
      if (!steps.includes(id)) steps.push(id);
      W.player.hp = W.player.maxHp; W.player.mp = 999;
      if (id === 'move') INPUT.keys.add('KeyD'); else INPUT.keys.delete('KeyD');
      if (id === 's1') { W.slotCd[0] = 0; trySummon(0); }
      if (id === 's2') { W.slotCd[1] = 0; trySummon(1); }
      if (id === 'dash') { W.player.cds.Space = 0; useSkill('Space'); }
      if (id === 'skill') { W.slotCd[0] = 0; trySummon(0); W.cskCd.spark_beetle = 0; useCardSkill(0); }
      if (id === 'soul' && !W.choosing) { W.soul = W.soulMax; addSoul(1); }
      if (W.choosing) pickBoost(0);
      updateWorld(1 / 60);
    }
    INPUT.keys.clear();
    expect(steps, 'steps reached').toEqual(TUT_STEPS.map(s => s.id));
    expect(SAVE.tutorialDone, 'marked done').toBe(true);
  });
  test('story scenes play before a stage and continue into it', async () => {
    H.save({ level: 1, story: true });
    enterStage(0);
    expect(STATE, 'dialogue first').toBe('dialogue');
    for (let i = 0; i < 20 && STATE === 'dialogue'; i++) { advanceDialogue(); advanceDialogue(); }
    expect(STATE, 'stage started').toBe('play');
    expect(SAVE.seenStory[0], 'scene remembered').toBe(true);
  });
  test('Abyss Tower: floors advance every 40s and floor 5 is a boss floor', () => {
    H.save({ level: 25, cleared: 3, cardLv: 10 });
    H.start(0, 'tower');
    expect(W.st.name, 'floor 1').toContain('Floor 1');
    for (let f = 1; f <= 4; f++) { W.time = W.st.duration; H.sim(4, { god: true, until: () => W.floor > f }); }
    expect(W.floor, 'reached floor 5').toBe(5);
    expect(W.st.bossFloor, 'boss floor').toBe(true);
    expect(SAVE.towerBest, 'best floor saved').toBe(5);
    W.time = W.st.duration; H.sim(5, { god: true, until: () => W.boss });
    damageEnemy(W.boss, 1e12, null);
    H.sim(4, { god: true, until: () => W.floor > 5 });
    expect(W.floor, 'boss floor cleared').toBe(6);
  });
  test('Boss Rush fights every defeated boss in order and records the run', () => {
    H.save({ level: 40, cleared: 10, cardLv: 10 });
    enterRush();
    const n = W.rushList.length;
    expect(n, 'bosses in rush').toBe(new Set(STAGES.slice(0, 10).map(s => s.boss)).size);
    for (let k = 0; k < n; k++) {
      H.sim(8, { god: true, until: () => W.boss && !W.boss.dead });
      if (W.boss) damageEnemy(W.boss, 1e12, null);
      H.sim(4, { god: true, until: () => STATE !== 'play' || W.floorPause > 0 });
      H.sim(4, { god: true, until: () => STATE !== 'play' || W.floorPause <= 0 });
    }
    H.sim(5, { god: true, until: () => STATE !== 'play' });
    expect(STATE, 'result').toBe('result');
    expect(document.getElementById('resTitle').textContent, 'title').toBe('RUSH COMPLETE');
    expect(SAVE.rushBest && SAVE.rushBest.n, 'best run').toBe(n);
  });
  test('Daily Trial: same stage and curses all day, chest only once', () => {
    H.save({ level: 30, cleared: 12, cardLv: 10 });
    const a = dailyInfo(), b = dailyInfo();
    expect(a.stage, 'stable stage').toBe(b.stage);
    expect(a.curses, 'stable curses').toEqual(b.curses);
    expect(SAVE.cleared[a.stage], 'picked from cleared stages').toBe(true);
    enterDaily();
    expect(W.isDaily && W.curses.size, 'curses applied').toBe(2);
    const stones0 = SAVE.stones;
    H.killBoss();
    expect(dailyInfo().done, 'claimed').toBe(true);
    expect(SAVE.stones - stones0, 'chest stones').toBeAtLeast(a.stones);
    const before = SAVE.stones;
    enterDaily(); H.killBoss();
    expect(SAVE.stones - before, 'no second chest').toBeLessThan(a.stones);
  });
  test('World Boss: damage carries over and milestone chests open', () => {
    H.save({ level: 40, cleared: 28, cardLv: 15, fusions: true, hotbar: ['dragon_emperor', 'seraphic_king', 'thunder_dragon', null, null, null] });
    ensureWorldBoss();
    const pool = SAVE.worldBoss.maxHp;
    enterRaid();
    H.sim(6, { god: true, until: () => W.boss });
    expect(W.boss.maxHp, 'boss bar shows the weekly pool').toBe(pool);
    damageEnemy(W.boss, pool * 0.3, null);
    W.raidT = 0.01;
    H.sim(4, { god: true, until: () => STATE !== 'play' });
    expect(STATE, 'raid over').toBe('result');
    expect(SAVE.worldBoss.hpLeft, 'pool reduced').toBeLessThan(pool * 0.75);
    expect(SAVE.worldBoss.claimed[0], '25% chest opened').toBe(true);
    expect(SAVE.worldBoss.attempts, 'attempt counted').toBe(1);
  });
  test('Sanctum gathers stones over time and caps at 12 hours', () => {
    H.save({ level: 20, cleared: 9, cardLv: 10 });
    SAVE.sanctum.cards = ['fang_wolf', 'gale_hawk', null];
    SAVE.sanctum.since = Date.now() - 5 * 3.6e6;
    const p5 = sanctumPending();
    expect(p5.hours, 'hours').toBeCloseTo(5, 0.01);
    expect(p5.stones, 'stones after 5h').toBeGreaterThan(0);
    SAVE.sanctum.since = Date.now() - 30 * 3.6e6;
    expect(sanctumPending().hours, 'capped').toBe(SANCTUM_CAP_H);
    const s0 = SAVE.stones, got = collectSanctum();
    expect(SAVE.stones - s0, 'collected').toBe(got.stones);
    expect(sanctumPending().stones, 'reset after collecting').toBe(0);
  });
  test('quests track progress and pay out once', () => {
    H.save({ level: 20, cleared: 9 });
    ensureQuests();
    expect(SAVE.quests.daily.length + SAVE.quests.weekly.length, 'quests').toBe(6);
    const q = SAVE.quests.daily[0];
    expect(claimQuest(q), 'not done yet').toBe(false);
    q.base -= q.n;
    const s0 = SAVE.stones;
    expect(claimQuest(q), 'claimed').toBe(true);
    expect(SAVE.stones - s0, 'reward').toBe(q.reward.stones);
    expect(claimQuest(q), 'only once').toBe(false);
  });
  test('Hell Tier unlocks the next tier when the final stage is cleared on the top tier', () => {
    H.save({ level: 40, cleared: 28, cardLv: 15 });
    SAVE.tierMax = 10; SAVE.tier = 10;
    H.start(27);
    H.killBoss();
    expect(SAVE.tierMax, 'tier 11 unlocked').toBe(11);
  });
});
