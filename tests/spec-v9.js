'use strict';
// v9: speed to 10×, Overdrive charges, 10 slots, keep × capacity, tower checkpoint, auto-finish, settings scrolling

group('v9 controls', () => {
  test('game speed goes up to 10× and back down', () => {
    expect(SPEEDS[SPEEDS.length - 1], 'max speed').toBe(10);
    H.save({ level: 20, cleared: 3 }); H.start(2);
    SETTINGS.gameSpeed = 1; for (let k = 0; k < SPEEDS.length - 1; k++) cycleSpeed();
    expect(SETTINGS.gameSpeed, 'reached 10×').toBe(10);
    W.timeScale = 1; const t0 = W.t; updateWorld(1 / 60);
    expect(W.t - t0 > 9 / 60, 'ten steps in one frame').toBe(true);
    cycleSpeed(-1);
    expect(SETTINGS.gameSpeed, 'back down').toBe(5);
    SETTINGS.gameSpeed = 1;
  });
  test('Overdrive banks up to 5 charges and fires them back to back', () => {
    H.save({ level: 30, hotbar: ['fang_wolf', null, null, null, null, null, null, null, null, null] });
    H.start(3);
    addOverdrive(9999);
    expect(W.od, 'five charges').toBe(OD_MAX * OD_CHARGES);
    useOverdrive(); useOverdrive(); useOverdrive();
    expect(Math.floor(W.od / OD_MAX), 'two left').toBe(2);
    expect(W.summons.filter(s => s.od).length, 'three waves of free summons').toBe(3);
    addOverdrive(10);
    expect(W.od > OD_MAX * 2, 'keeps charging while active').toBe(true);
  });
  test('10 hotbar slots: keys 7, 8, 9, 0 summon slots 7–10; old 6-slot saves grow to 10', () => {
    H.save({ level: 40, hotbar: ['spark_beetle', null, null, null, null, null, 'fang_wolf', 'gale_hawk', 'iron_boar', 'frost_spirit'] });
    expect(SAVE.hotbar.length, '10 slots').toBe(10);
    H.start(3); W.player.mp = 9999;
    for (const k of ['Digit7', 'Digit8', 'Digit9', 'Digit0']) H.key(k);
    expect(['fang_wolf', 'gale_hawk', 'iron_boar', 'frost_spirit'].every(id => W.summons.some(s => s.id === id)), 'all four summoned').toBe(true);
    H.sim(1);
    expect(W.slotCd[9] < CARDS.frost_spirit.cd * W.ps.cdMult, 'slot 10 cooldown runs down').toBe(true);
    expect(document.querySelectorAll('#hotbar .slot').length, 'HUD shows 10').toBe(10);
    const old = defaultSave('normal'); old.hotbar = ['spark_beetle', 'venom_mantis', null, null, null, null]; old.loadouts = old.loadouts.map(l => l.slice(0, 6));
    const m = migrateSave(old);
    expect(m.hotbar.length + m.loadouts[0].length, 'migrated to 10').toBe(20);
  });
  test('auto summon count is multiplied by the capacity setting', () => {
    H.save({ level: 40, cardLv: 10, hotbar: ['fang_wolf', null, null, null, null, null, null, null, null, null] });
    SAVE.auto.summon = true; SAVE.auto.keep[0] = 2; SETTINGS.capMult = 2;
    H.start(3); W.player.mp = 99999;
    H.sim(8, { god: true });
    expect(W.summons.filter(s => s.id === 'fang_wolf' && !s.od).length, '2 × 2 = 4 wolves').toBe(4);
    SETTINGS.capMult = 1;
  });
  test('Hell Tiers 1–10 open for any save at level 40+, and the selector reaches ×10', () => {
    const old = defaultSave('normal'); old.level = 85; old.tierMax = 1; old.tier = 1;
    const m = migrateSave(old);
    expect(m.tierMax, 'existing save opens 1–10').toBe(10);
    SAVE = m; selectedRegion = 0; selectedStage = 0; showScreen('map');
    for (let k = 0; k < 15; k++) { const b = document.querySelector('[data-tier="1"]'); if (b && !b.disabled) b.click(); }
    expect(SAVE.tier, 'tier 10 selected').toBe(10);
    expect(document.querySelector('.tier-d').textContent.includes('rewards ×10.0'), 'shows ×10').toBe(true);
  });
  test('one broken card cannot blank the Grimoire: the stats and other cards still show', () => {
    H.save({ level: 6000, cardLv: 4682, hotbar: ['spark_beetle', 'banshee', null, null, null, null, null, null, null, null] });
    SAVE.cards.fang_wolf = null;   // a damaged card entry
    grimTab = 'cards'; showScreen('grimoire');
    expect(document.querySelectorAll('#cardList .card').length > 50, 'other cards listed').toBe(true);
    expect($('grimStats').textContent.includes('Summoner level'), 'stats row shown').toBe(true);
    showScreen('map');
  });
  test('tall settings screen can scroll to the top and bottom', () => {
    showScreen('settings');
    const s = $('scr-settings'), p = s.querySelector('.panel');
    s.scrollTop = 0;
    expect(p.getBoundingClientRect().top >= s.getBoundingClientRect().top - 1, 'top is reachable').toBe(true);
  });
});

group('Tower checkpoint and auto-finish', () => {
  test('the tower starts at your best floor and pays the floors below', () => {
    H.save({ level: 38, cleared: 28, cardLv: 25, hotbar: ['seraph', 'archon', 'ember_wyrm', 'phoenix', 'leviathan', 'grove_guardian', null, null, null, null] });
    SAVE.towerBest = 30; const s0 = SAVE.stones;
    enterTower();
    expect(W.floor, 'floor 30').toBe(30);
    expect(SAVE.stones - s0 > 1000, 'floor rewards paid').toBe(true);
    expect(Object.values(W.ru).reduce((a, b) => a + b, 0) > 10, 'run upgrades granted').toBe(true);
    H.sim(1, { god: true, render: true });
    W.ended = true;
    SAVE.towerFromBest = false; enterTower();
    expect(W.floor, 'can still start at 1').toBe(1);
  });
  test('auto-finish a cleared stage ×10 pays like 10 clears; weak teams are refused', () => {
    H.save({ level: 40, cleared: 28, cardLv: 25, hotbar: ['seraph', 'archon', 'ember_wyrm', 'phoenix', 'leviathan', 'grove_guardian', null, null, null, null] });
    const s0 = SAVE.stones, k0 = SAVE.stats.kills, y = stageYield(20);
    const r = sweepStage(20, 10);
    expect(!!r, 'swept').toBe(true);
    expect(SAVE.stones - s0, 'stones').toBe(y.stones * 10);
    expect(SAVE.stats.kills - k0 > 0, 'kills counted for quests').toBe(true);
    expect(sweepStage(30, 1), 'uncleared stage refused').toBe(null);
    H.save({ level: 5, cleared: 48, hotbar: ['spark_beetle', null, null, null, null, null, null, null, null, null] });
    expect(canSweepStage(47).ok, 'too weak for Act V').toBe(false);
  });
  test('auto-climb the tower and auto-run the Boss Rush', () => {
    H.save({ level: 40, cleared: 28, cardLv: 25, hotbar: ['seraph', 'archon', 'ember_wyrm', 'phoenix', 'leviathan', 'grove_guardian', null, null, null, null] });
    const t = sweepTower(3);
    expect(t && t.floor > 10, 'reached a floor').toBe(true);
    expect(SAVE.towerBest >= t.floor, 'best floor raised').toBe(true);
    const b = sweepRush(2);
    expect(b && b.beaten > 0, 'bosses beaten').toBe(true);
  });
  test('the stage, tower and rush panels show auto-finish buttons', () => {
    H.save({ level: 40, cleared: 28, cardLv: 25, hotbar: ['seraph', 'archon', 'ember_wyrm', 'phoenix', 'leviathan', 'grove_guardian', null, null, null, null] });
    showScreen('map');
    const bad = [];
    for (const m of [5, 'tower', 'rush']) { selectStage(m); if (!document.querySelector('#stageInfo [data-sweep]')) bad.push(String(m)); }
    selectStage('tower'); if (!document.querySelector('[data-tstart="best"]')) bad.push('tower start choice');
    expect(bad, 'missing').toEqual([]);
    selectStage(5); document.querySelector('#stageInfo [data-sweep][data-n="5"]').click();
    expect(!$('infoCard').classList.contains('hidden'), 'result shown').toBe(true);
    $('btnInfoOk').click();
  });
});
