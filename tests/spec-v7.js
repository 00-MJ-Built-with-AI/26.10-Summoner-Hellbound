'use strict';
// v7 features: level 70 + Primordial rank, Halloween event, skins, Rift, Act V, adaptive help, rumble, What's new

group('Level 70 and Primordial rank', () => {
  test('level cap 70, Primordial (SS) unlocks at 60 with 4 cards that fight', () => {
    expect(LEVEL_CAP, 'cap').toBe(70);
    expect(CARD_PROG.maxLv, 'card cap').toBe(40);
    const prim = CARD_IDS.filter(id => CARDS[id].rank === 'primordial');
    expect(prim.length, 'primordial cards').toBe(4);
    H.save({ level: 59 });
    expect(prim.some(cardUnlocked), 'locked at 59').toBe(false);
    H.save({ level: 60, cardLv: 30, hotbar: [...prim, null, null] });
    expect(prim.every(cardUnlocked), 'unlocked at 60').toBe(true);
    H.start(40);
    H.spawnNear('goblin', 20, 150);
    H.sim(6, { god: true, summon: true, skills: true, render: true });
    expect(W.kills > 0, 'kills').toBe(true);
  });
  test('levels keep rising past 50 to 70, with more capacity', () => {
    H.save({ level: 50 });
    const cap50 = pstat(false).cap;
    H.start(1);
    for (let i = 0; i < 40 && SAVE.level < 70; i++) gainExp(PLAYER.expNext(SAVE.level));
    expect(SAVE.level, 'reached 70').toBe(70);
    expect(pstat(false).cap > cap50, 'more capacity').toBe(true);
  });
});

group('Seasonal event', () => {
  test('Halloween runs Oct 27 – Nov 7 and candy drops in battles', () => {
    EVENT_NOW = new Date(2026, 10, 9);
    expect(activeEvent(), 'over after Nov 7').toBe(null);
    EVENT_NOW = new Date(2026, 9, 30);
    const ev = activeEvent();
    expect(ev && ev.id, 'active').toBe('halloween2026');
    H.save({ level: 20 });
    H.start(3);
    const e = H.spawnNear('goblin', 1)[0]; e.elite = true;
    killEnemy(e, null);
    expect(evState(ev.id).cur, 'candy from an elite').toBe(3);
    EVENT_NOW = null;
  });
  test('Pumpkin Hollow: the Pumpkin King fights in 2 phases and pays candy', () => {
    EVENT_NOW = new Date(2026, 9, 30);
    H.save({ level: 30, cardLv: 20, hotbar: ['fang_wolf', 'gale_hawk', 'iron_boar', null, null, null] });
    const ev = activeEvent();
    enterEvent(ev);
    expect(W.isEvent && W.st.boss, 'event stage').toBe('pumpkin_king');
    H.spawnNear('pumpkin_imp', 3); H.spawnNear('ghostling', 3); H.spawnNear('scarecrow', 1);
    H.sim(3, { god: true, summon: true, render: true });
    W.time = W.st.duration;
    H.sim(6, { god: true, until: () => W.boss });
    const b = W.boss;
    b.hp = b.maxHp * 0.4; H.sim(2, { god: true, render: true });
    expect(b.phaseI, 'phase 2').toBe(1);
    const before = evState(ev.id).cur;
    b.hp = 1; damageEnemy(b, 999, null);
    H.sim(5, { god: true, until: () => STATE !== 'play' });
    expect(STATE, 'result').toBe('result');
    expect(evState(ev.id).cur > before, 'candy paid').toBe(true);
    expect(skinOwned('jack'), 'Jack skin earned').toBe(true);
    expect(SAVE.cleared.some(Boolean), 'no map stage cleared').toBe(false);
    EVENT_NOW = null;
  });
  test('event shop: buy once items, repeat items and cosmetics', () => {
    H.save({ level: 10 });
    const ev = EVENTS[0], st = evState(ev.id);
    st.cur = 2000;
    const item = id => ev.shop.find(x => x.id === id);
    expect(evBuy(ev, item('hw_outfit')), 'outfit').toBe(true);
    expect(evBuy(ev, item('hw_outfit')), 'only once').toBe(false);
    expect(OUTFITS.find(o => o.id === 'jackcloak').ok(), 'outfit owned').toBe(true);
    expect(evBuy(ev, item('hw_skin1')), 'skin').toBe(true);
    expect(skinOwned('pumpkin'), 'skin owned').toBe(true);
    expect(evBuy(ev, item('hw_draw')) && evBuy(ev, item('hw_draw')), 'repeatable').toBe(true);
    expect(SAVE.altar.free, 'free draws').toBe(6);
  });
});

group('Summon skins', () => {
  test('20 skins, earned not bought; equipping changes how the card is drawn', () => {
    expect(SKINS.length, 'skins').toBe(20);
    H.save({ level: 20, cardLv: 10, hotbar: ['fang_wolf', null, null, null, null, null] });
    SAVE.skins.owned.pumpkin = true; SAVE.skins.eq.fang_wolf = 'pumpkin';
    expect(skinFilter('fang_wolf', 0).includes('hue-rotate'), 'filter').toBe(true);
    SAVE.skins.eq.gale_hawk = 'gold';
    expect(skinOf('gale_hawk'), 'not owned yet').toBe(null);
    H.start(2); W.player.mp = 999; trySummon(0);
    H.sim(1, { god: true, render: true });
    GF.rank = 'all'; GF.q = ''; grimTab = 'cards'; showScreen('grimoire');
    expect(document.querySelectorAll('#grimContent .skin-sel').length > 0, 'skin pickers').toBe(true);
    codexTab = 'wardrobe'; showScreen('codex');
    expect(document.querySelectorAll('#codexContent .skin').length, 'wardrobe lists skins').toBe(20);
  });
});

group('The Rift', () => {
  test('starts with 2 random cards, drafts after each floor and restores the real hotbar', () => {
    H.save({ level: 40, cleared: 18, cardLv: 20, hotbar: ['fang_wolf', 'gale_hawk', null, null, null, null] });
    const real = [...SAVE.hotbar];
    expect(enterRift(), 'entered').toBe(true);
    expect(SAVE.hotbar.filter(Boolean).length, 'two cards').toBe(2);
    W.time = W.st.duration; director(1 / 60);
    expect(W.choosingKind, 'draft offered').toBe('draft');
    const pick = W.choosing[0];
    pickBoost(0);
    expect(SAVE.hotbar.includes(pick), 'drafted card in hotbar').toBe(true);
    H.sim(2, { god: true });
    expect(W.rift.floor, 'floor 2').toBe(2);
    W.player.hp = 0; playerDie();
    H.sim(4, { until: () => STATE !== 'play' });
    expect(STATE, 'result').toBe('result');
    expect(SAVE.hotbar, 'real hotbar back').toEqual(real);
    expect(SAVE.rift.shards >= 1, 'shards banked').toBe(true);
  });
  test('boss floor every 5 floors, and perks cost shards', () => {
    H.save({ level: 40, cleared: 18, cardLv: 20 });
    expect(riftStage(5).bossFloor && riftStage(10).bossFloor && !riftStage(4).bossFloor, 'boss floors').toBe(true);
    SAVE.rift.shards = 100;
    expect(buyRiftPerk('start'), 'perk').toBe(true);
    expect(SAVE.rift.shards, 'paid').toBe(70);
    enterRift();
    expect(SAVE.hotbar.filter(Boolean).length, 'perk: 3 cards').toBe(3);
    W.rift.floor = 4; riftNextFloor();
    H.sim(8, { god: true, until: () => W.boss });
    expect(!!W.boss, 'floor 5 boss').toBe(true);
    W.boss.hp = 1; damageEnemy(W.boss, 999, null);
    expect(W.choosingKind, 'draft after boss').toBe('draft');
    restoreRiftHotbar();
  });
});

group('Act V', () => {
  test('10 stages in a 5th region for levels 50–70, with 5 multi-phase bosses', () => {
    expect(REGIONS[4].act, 'region').toBe('Act V');
    const bad = [];
    for (let i = 38; i < 48; i++) { const s = STAGES[i]; if (s.region !== 4 || !BOSSES[s.boss] || !(DARKNESS[i] >= 0)) bad.push(i); if (s.rec < 50 || s.rec > 70) bad.push(i + ' rec'); }
    for (const id of ['ink_colossus', 'mirror_queen', 'storm_titan', 'dream_eater', 'the_unwritten']) if (!BOSSES[id].phases || typeof DR[BOSSES[id].draw] !== 'function' || !RELIC_BY_BOSS[id]) bad.push(id);
    expect(bad, 'problems').toEqual([]);
  });
  test('every Act V boss fights through its phases; the last one plays the ending', () => {
    const errs = [];
    for (const [id, idx] of [['ink_colossus', 39], ['mirror_queen', 41], ['storm_titan', 43], ['dream_eater', 45], ['the_unwritten', 47]]) {
      try {
        H.save({ level: 70, cleared: idx, cardLv: 35, hotbar: ['chaos_wyrm', 'void_seraph', 'fang_wolf', 'seraph', null, null] });
        H.start(idx);
        W.time = W.st.duration;
        H.sim(6, { god: true, until: () => W.boss });
        const e = W.boss;
        for (const ph of e.bd.phases) { e.hp = e.maxHp * ph.at - 1; H.sim(2, { god: true, summon: true, render: true }); }
        if (e.phaseI !== BOSSES[id].phases.length) errs.push(id + ' phases');
        e.hp = 1; damageEnemy(e, 999, null);
        H.sim(5, { god: true, until: () => STATE !== 'play' });
        if (!SAVE.cleared[idx]) errs.push(id + ' not cleared');
        if (idx === 47 && W.pendingEnding !== 'ending5') errs.push('no ending');
      } catch (er) { errs.push(id + ': ' + er.message); }
    }
    expect(errs, 'failures').toEqual([]);
  });
  test('the new enemies fight and draw', () => {
    H.save({ level: 60, cardLv: 30, hotbar: ['fang_wolf', 'gale_hawk', null, null, null, null] });
    H.start(44);
    for (const t of ['ink_blot', 'quill_wraith', 'page_golem', 'echo_witch', 'dream_moth', 'null_spire']) H.spawnNear(t, 2, 160);
    H.sim(6, { god: true, summon: true, render: true });
    expect(W.kills > 0, 'kills').toBe(true);
  });
});

group('Help, rumble and What\'s new', () => {
  test('after 3 falls on a stage, a one-time boost is offered and used on the next try', () => {
    H.save({ level: 5, cleared: 2 });
    for (let k = 0; k < 3; k++) { H.start(2); W.player.hp = 0; playerDie(); H.sim(4, { until: () => STATE !== 'play' }); }
    const btn = $('btnHelpYes');
    expect(!!btn, 'offer shown').toBe(true);
    btn.click();
    H.start(2);
    expect(W.helpBoost, 'boost active').toBe(true);
    W.ended = true;
    H.start(2);
    expect(!!W.helpBoost, 'only once').toBe(false);
  });
  test('controller rumble fires with vibration when a pad is used', () => {
    H.save({ level: 5 });
    const effects = [];
    const pad = { connected: true, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), vibrationActuator: { playEffect: (t, o) => effects.push(o) } };
    navigator.getGamepads = () => [pad];
    INPUT.padMode = true; SETTINGS.vibrate = true; RUMBLE.t = 0;
    H.start(1);
    hitAlly(W.player, 5, null);
    expect(effects.length > 0, 'rumbled').toBe(true);
  });
  test("What's new shows once for returning players, never for brand-new ones", () => {
    H.save({ level: 5 });
    SAVE.stats.runs = 0; delete SAVE.seenRelease;
    expect(showWhatsNew(), 'new player: no popup').toBe(false);
    SAVE.stats.runs = 10; delete SAVE.seenRelease;
    expect(showWhatsNew(), 'returning player: popup').toBe(true);
    expect(showWhatsNew(), 'only once').toBe(false);
    $('btnInfoOk').click();
  });
});

group('Automation', () => {
  test('auto-pick run upgrades by priority: no pop-up, the highest-ranked offer is taken', () => {
    H.save({ level: 20, hotbar: ['fang_wolf', 'spark_beetle', null, null, null, null] });
    SAVE.auto.run = true;
    SAVE.auto.runOrder = ['vigor', 'might'];
    H.start(2);
    const real = rollRunChoices;
    rollRunChoices = () => [RU_BY_ID.might, RU_BY_ID.reach, RU_BY_ID.vigor];
    try { gainExp(W.sm.exp * W.mode.exp * W.rewardMult * runExpNext(0) + 0.01); } finally { rollRunChoices = real; }
    expect(W.choosing, 'no pop-up left open').toBe(null);
    expect(W.ru.vigor, 'top priority taken').toBe(1);
    expect(runOrder().length, 'full list kept').toBe(RUN_UPGRADES.length);
  });
  test('auto-pick soul boosts by priority', () => {
    H.save({ level: 20 });
    SAVE.auto.soul = true; SAVE.auto.soulOrder = ['iron_skin'];
    H.start(2);
    W.soul = W.soulMax; addSoul(1);
    expect(W.choosing, 'closed').toBe(null);
    expect(W.picks, 'one boost taken').toBe(1);
  });
  test('auto Enhance (Q) and auto Overdrive (F) fire on their own in a fight', () => {
    H.save({ level: 30, cardLv: 15, hotbar: ['fang_wolf', 'gale_hawk', 'iron_boar', null, null, null] });
    SAVE.auto.q = true; SAVE.auto.f = true;
    H.start(5);
    W.player.mp = 9999; for (let k = 0; k < 3; k++) trySummon(k);
    H.spawnNear('goblin', 16, 140);
    W.od = OD_MAX;
    H.sim(1, { god: true });
    expect(W.player.enhT > 0, 'Enhance cast').toBe(true);
    expect(W.odT > 0, 'Overdrive fired').toBe(true);
  });
  test('auto special skill per card, toggled from the hotbar', () => {
    H.save({ level: 30, cardLv: 15, hotbar: ['fang_wolf', 'gale_hawk', null, null, null, null] });
    H.start(5);
    const a = [...document.querySelectorAll('#hotbar .auto-b')];
    expect(a.length, 'badges').toBe(2);
    a[0].click();
    expect(SAVE.auto.skills.fang_wolf, 'toggled on').toBe(true);
    W.player.mp = 9999; trySummon(0);
    const wolf = W.summons.find(s => s.id === 'fang_wolf');
    for (let k = 0; k < 10; k++) { const e = spawnEnemy('goblin', wolf.x + 60 + (k % 3) * 12, wolf.y + Math.floor(k / 3) * 12); e.spawnT = 1; }
    const used = SAVE.counters.skills;
    H.sim(1.5, { god: true });
    expect(SAVE.counters.skills > used, 'skill cast automatically').toBe(true);
    expect((W.cskCd.gale_hawk || 0) > 0, 'other card untouched').toBe(false);
  });
  test('priority editor reorders with arrows and presets', () => {
    H.save({ level: 20 });
    openPriorityEditor('run');
    const first = runOrder()[0], second = runOrder()[1];
    document.querySelector('#infoCard [data-down="0"]').click();
    expect(runOrder()[0], 'moved down').toBe(second);
    expect(runOrder()[1], 'swapped').toBe(first);
    document.querySelector('#infoCard [data-preset="safety"]').click();
    expect(RU_BY_ID[runOrder()[0]].r, 'safety preset starts with a legendary survival pick').toBe('legendary');
    $('btnInfoOk').click();
  });
});

group('Online (with a fake server)', () => {
  function fakeNet() {
    const db = { saves: {}, boards: {}, arena: {} };
    return {
      db, async init(cb) { cb({ uid: 'u1', name: 'Tester' }); },
      async signIn() {}, async signOut() {},
      async getSave(uid) { return db.saves[uid] || null; }, async putSave(uid, r) { db.saves[uid] = r; },
      async submit(b, uid, e) { const t = db.boards[b] || (db.boards[b] = {}); if (t[uid] && t[uid].score >= e.score) return false; t[uid] = e; return true; },
      async top(b) { return Object.entries(db.boards[b] || {}).map(([uid, e]) => Object.assign({ uid }, e)).sort((x, y) => y.score - x.score); },
      async putArena(uid, r) { db.arena[uid] = r; },
      async findArena() { return [{ uid: 'p2', name: 'Rival Ana', rating: 1010, lv: 20, deck: ['fang_wolf', 'gale_hawk'], cardLv: 10 }, { uid: 'p3', name: 'Bad Deck', rating: 1000, lv: 5, deck: ['not_a_card'] }]; },
    };
  }
  test('signing in uploads the save; a newer cloud save asks which to keep', async () => {
    const real = NET; NET = fakeNet(); ONLINE.ready = false; ONLINE.user = null;
    try {
      H.save({ level: 12 });
      await onlineInit(); await new Promise(r => setTimeout(r, 0));
      expect(NET.db.saves.u1 && NET.db.saves.u1.level, 'uploaded').toBe(12);
      const cloud = JSON.parse(NET.db.saves.u1.data); cloud.level = 30; cloud.savedAt = Date.now() + 60000;
      NET.db.saves.u1 = { data: JSON.stringify(cloud), savedAt: cloud.savedAt, level: 30, cleared: 0 };
      await firstSync();
      expect(!!$('btnKeepLocal'), 'choice shown').toBe(true);
      $('btnInfoOk').click();
      expect(SAVE.level, 'cloud save adopted').toBe(30);
    } finally { NET = real; ONLINE.user = null; ONLINE.ready = false; }
  });
  test('leaderboards: results submit scores and the Codex tab lists them', async () => {
    const real = NET; NET = fakeNet(); ONLINE.user = { uid: 'u1', name: 'Tester' };
    try {
      H.save({ level: 20, cleared: 3 });
      H.start(0, 'tower'); W.floor = 7;
      W.player.hp = 0; playerDie(); H.sim(4, { until: () => STATE !== 'play' });
      await new Promise(r => setTimeout(r, 0));
      expect(NET.db.boards[boardKey('tower', true)].u1.score, 'weekly tower score').toBe(7);
      codexTab = 'boards'; showScreen('codex');
      await new Promise(r => setTimeout(r, 0));
      expect(document.querySelectorAll('#codexContent .board tbody tr').length, 'rows').toBe(1);
    } finally { NET = real; ONLINE.user = null; }
  });
  test('the arena mixes in real players and skips broken loadouts', async () => {
    const real = NET; NET = fakeNet(); ONLINE.user = { uid: 'u1', name: 'Tester' }; ONLINE.rivals = null;
    try {
      H.save({ level: 20 });
      ensureArena();
      const list = await fetchOnlineRivals();
      expect(list.length, 'one valid real player').toBe(1);
      const ops = arenaOpponents();
      expect(ops[0].online && ops[0].name, 'real player first').toBe('Rival Ana');
      expect(enterArena(ops[0]), 'can fight them').toBe(true);
    } finally { NET = real; ONLINE.user = null; ONLINE.rivals = null; }
  });
  test('with no Firebase config the game stays offline and says so', () => {
    expect(NET, 'offline').toBe(null);
    showScreen('settings');
    expect($('accountBox').textContent.includes('not set up'), 'explains').toBe(true);
  });
});
