'use strict';
// ---------- Progression: levels, rank unlocks, cards, talents, fusion, awakening, relics, equipment, loadouts ----------

group('Progression', () => {
  test('gaining EXP levels up, unlocks the Beast rank and auto-equips it', () => {
    H.save({ level: 1, hotbar: ['spark_beetle', 'venom_mantis', null, null, null, null] });
    H.start(0);
    gainExp(PLAYER.expNext(1) + 1);
    expect(SAVE.level, 'level').toBe(2);
    expect(W.unlocks, 'unlocks').toContain('beast');
    expect(SAVE.hotbar.filter(id => id && CARDS[id].rank === 'beast').length, 'beast cards equipped').toBeAtLeast(1);
    expect(W.player.hp, 'healed on level up').toBe(W.player.maxHp);
  });
  test('level stops at the cap of 40 and unlocks Hell Tier 1', () => {
    H.save({ level: 39 });
    H.start(0);
    gainExp(1e9);
    expect(SAVE.level, 'level').toBe(LEVEL_CAP);
    gainExp(1e9);
    expect(SAVE.level, 'still capped').toBe(LEVEL_CAP);
    expect(SAVE.tierMax, 'tier unlocked').toBe(1);
  });
  test('cards level up from kills made by their summons', () => {
    H.save({ level: 5 });
    H.start(0);
    addCardExp('fang_wolf', CARD_PROG.expNext(1) * 3);
    expect(SAVE.cards.fang_wolf.lv, 'card level').toBeAtLeast(2);
    expect(W.cardUps.fang_wolf, 'level-up recorded for results').toBeTruthy();
  });
  test('enhancing a card costs stones and raises its stars', () => {
    H.save({ level: 5, stones: 1000 });
    grimTab = 'cards'; showScreen('grimoire');
    const btn = [...document.querySelectorAll('#grimContent .card')].find(el => el.textContent.includes('Spark Beetle')).querySelector('[data-act=enh]');
    btn.click();
    expect(SAVE.cards.spark_beetle.enh, 'stars').toBe(1);
    expect(SAVE.stones, 'stones spent').toBe(1000 - CARD_PROG.enhCost(0));
  });
  test('talents cost stones and change Allen\'s stats', () => {
    H.save({ level: 10, stones: 5000 });
    const before = pstat(false).hp;
    expect(buyTalent('vitality'), 'bought').toBe(true);
    expect(SAVE.talents.vitality, 'rank').toBe(1);
    expect(pstat(false).hp, 'max HP').toBeGreaterThan(before);
    SAVE.stones = 0;
    expect(buyTalent('vitality'), 'cannot afford').toBe(false);
  });
  test('fusion needs both parents at Lv 5 and enough stones', () => {
    H.save({ level: 5, stones: 10000 });
    expect(fuseStatus('plague_swarm').ok, 'parents too low').toBe(false);
    SAVE.cards.spark_beetle.lv = 5; SAVE.cards.venom_mantis.lv = 5;
    expect(fuseStatus('plague_swarm').ok, 'ready').toBe(true);
    expect(doFuse('plague_swarm'), 'fused').toBe(true);
    expect(cardUnlocked('plague_swarm'), 'unlocked').toBe(true);
    expect(SAVE.stones, 'cost').toBe(10000 - CARDS.plague_swarm.fuseCost);
  });
  test('every one of the 36 fusions can be fused once its parents qualify', () => {
    H.save({ level: 40, stones: 1e7, cardLv: 5 });
    const bad = CARD_IDS.filter(id => CARDS[id].fusion).filter(id => {
      for (const f of CARDS[id].fusion) if (CARDS[f].fusion) SAVE.fused[f] = true;
      return !doFuse(id);
    });
    expect(bad, 'fusions that failed').toBeEmpty();
  });
  test('awakening needs Lv 20, stones and essence, then boosts the summon', () => {
    H.save({ level: 20, stones: 5000 });
    expect(awakenStatus('fang_wolf').ok, 'too low').toBe(false);
    SAVE.cards.fang_wolf.lv = 20; SAVE.essence = 10;
    expect(doAwaken('fang_wolf'), 'awakened').toBe(true);
    H.start(0);
    const s = makeSummon('fang_wolf', 0, 0);
    SAVE.awakened = {};
    const plain = makeSummon('fang_wolf', 0, 0);
    expect(s.maxHp / plain.maxHp, 'awakened HP multiplier').toBeCloseTo(1.5, 0.01);
  });
  test('clearing a stage grants its relic, and relic effects apply', () => {
    H.save({ level: 30 });
    const r = awardRelic('demon_general');
    expect(r && r.relic.id, 'relic').toBe('banner');
    expect(SAVE.relicSlots, 'auto-equipped').toContain('banner');
    expect(rv('cap'), 'capacity bonus').toBe(1);
    SAVE.relics.banner = 2;
    expect(rv('cap'), 'relic + doubles').toBe(2);
    expect(awardRelic('aw_demon_general'), 'awakened boss never upgrades past +').toBe(null);
  });
  test('equipment: craft, upgrade and stat bonuses', () => {
    H.save({ level: 30, stones: 1e5 });
    SAVE.mats.shard = 100;
    expect(craftItem('oak_staff'), 'crafted').toBe(true);
    expect(SAVE.equip.slots.staff, 'equipped').toBe('oak_staff');
    const base = eqv('sumDmg');
    expect(upgradeItem('oak_staff'), 'upgraded').toBe(true);
    expect(eqv('sumDmg'), 'damage bonus grows').toBeGreaterThan(base);
    expect(craftItem('oak_staff'), 'cannot craft twice').toBe(false);
    for (let i = 0; i < 20; i++) upgradeItem('oak_staff');
    expect(SAVE.equip.owned.oak_staff, 'max level').toBe(EQUIP_MAX);
  });
  test('5 loadouts keep separate hotbars', () => {
    H.save({ level: 10, hotbar: ['spark_beetle', 'fang_wolf', null, null, null, null] });
    switchLoadout(4);
    expect(SAVE.loadoutIdx, 'index').toBe(4);
    SAVE.hotbar = ['iron_boar', null, null, null, null, null];
    switchLoadout(0);
    expect(SAVE.hotbar.slice(0, 2), 'loadout 1').toEqual(['spark_beetle', 'fang_wolf']);
    switchLoadout(4);
    expect(SAVE.hotbar[0], 'loadout 5').toBe('iron_boar');
  });
  test('Hell Tiers raise enemy strength and rewards', () => {
    H.save({ level: 40, cleared: 28 });
    SAVE.tierMax = 3; SAVE.tier = 2;
    H.start(5);
    const e = spawnEnemy('goblin', 0, 0);
    SAVE.tier = 0; H.start(5);
    const e0 = spawnEnemy('goblin', 0, 0);
    expect(e.maxHp / e0.maxHp, 'enemy HP at tier 2').toBeCloseTo(1.5, 0.01);
    SAVE.tier = 2; H.start(5);
    expect(W.rewardMult, 'reward multiplier').toBeCloseTo(1.6, 0.01);
  });
});
