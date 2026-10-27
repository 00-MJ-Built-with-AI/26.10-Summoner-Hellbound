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
  test('all 88 base cards have one power path and one support path; fusions have none', () => {
    const base = CARD_IDS.filter(id => !CARDS[id].fusion), bad = [];
    for (const id of base) {
      const p = evoPaths(id);
      if (!p || EVO_STYLES[p[0]].lean !== 'power' || EVO_STYLES[p[1]].lean !== 'support') bad.push(id);
    }
    expect(base.length, 'base cards').toBe(88);
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

group('Act IV', () => {
  test('10 new stages in a 4th region with new enemies and 5 multi-phase bosses', () => {
    expect(REGIONS[3].act, 'region').toBe('Act IV');
    const bad = [];
    for (let i = 28; i < 38; i++) {
      const s = STAGES[i];
      if (s.region !== 3) bad.push(i + ': region');
      if (!BOSSES[s.boss]) bad.push(i + ': boss ' + s.boss);
      if (!(DARKNESS[i] >= 0)) bad.push(i + ': lighting');
    }
    for (const id of ['chrono_warden', 'void_leviathan', 'shade_king', 'prism_dragon', 'first_summoner']) {
      const b = BOSSES[id];
      if (!b.phases || b.phases.length < 1) bad.push(id + ': no phases');
      if (typeof DR[b.draw] !== 'function') bad.push(id + ': no drawing');
      if (!RELIC_BY_BOSS[id]) bad.push(id + ': no relic');
    }
    expect(bad, 'problems').toEqual([]);
    expect(LEVEL_CAP >= 9999, 'no level cap').toBe(true);
  });
  test('every new Act IV boss fights through all of its phases and can be defeated', () => {
    const errs = [];
    for (const [id, idx] of [['chrono_warden', 29], ['void_leviathan', 31], ['shade_king', 33], ['prism_dragon', 35], ['first_summoner', 37]]) {
      try {
        H.save({ level: 50, cleared: idx, cardLv: 25, hotbar: ['fang_wolf', 'gale_hawk', 'iron_boar', 'seraph', null, null] });
        H.start(idx);
        W.time = W.st.duration;
        H.sim(6, { god: true, until: () => W.boss });
        const e = W.boss;
        if (!e) { errs.push(id + ': no boss'); continue; }
        for (const ph of e.bd.phases) { e.hp = e.maxHp * ph.at - 1; H.sim(3, { god: true, summon: true, render: true }); }
        if (e.phaseI !== BOSSES[id].phases.length) errs.push(`${id}: reached phase ${e.phaseI}`);
        e.hp = 1; damageEnemy(e, 999, null);
        H.sim(5, { god: true, until: () => STATE !== 'play' });
        if (!SAVE.cleared[idx]) errs.push(id + ': not cleared');
      } catch (er) { errs.push(id + ': ' + er.message); }
    }
    expect(errs, 'failures').toEqual([]);
  });
  test('the new enemies fight and draw without errors', () => {
    H.save({ level: 50, cardLv: 20, hotbar: ['fang_wolf', 'gale_hawk', null, null, null, null] });
    H.start(33);
    for (const t of ['clock_sentinel', 'time_wraith', 'abyss_spawn', 'shade_knight', 'mirror_witch', 'prism_mote', 'pact_spire']) H.spawnNear(t, 3, 160);
    H.sim(8, { god: true, summon: true, render: true });
    expect(W.kills > 0, 'kills').toBe(true);
  });
  test('beating Malkuth plays the true ending; Hell Tiers still unlock at level 40', () => {
    H.save({ level: 50, cleared: 37, cardLv: 25 });
    H.start(37);
    H.killBoss();
    expect(STATE, 'result screen').toBe('result');
    expect(W.pendingEnding, 'true ending queued').toBe('ending4');
    H.save({ level: 40 });
    SAVE.tierMax = 0;
    H.start(1); gainExp(1);
    expect(SAVE.tierMax, 'tier 1 at level 40').toBe(1);
  });
});

group('Co-op', () => {
  test('Player 2 joins as a companion and walks with I J K L', () => {
    H.save({ level: 10 });
    SETTINGS.p2 = 'keys';
    H.start(1);
    const h = p2Hero();
    expect(!!h, 'P2 hero spawned').toBe(true);
    const x0 = h.x;
    INPUT.keys.add('KeyL'); H.sim(1); INPUT.keys.delete('KeyL');
    expect(h.x - x0 > 120, 'moved right').toBe(true);
    W.player.x = -400; H.sim(0.5);
    expect(Math.abs(W.camX - (W.player.x + h.x) / 2) < 120, 'camera between both players').toBe(true);
  });
  test('all three heroes can dash and use their skill', () => {
    const errs = [];
    for (const id of ['roran', 'lysa', 'kael']) {
      H.save({ level: 20 });
      SAVE.companion = id; SETTINGS.p2 = 'keys';
      H.start(3);
      const h = p2Hero();
      if (!h || h.hero !== id) { errs.push(id + ': not spawned'); continue; }
      H.spawnNear('goblin', 8, 100);
      INPUT.keys.add('KeyU'); INPUT.keys.add('KeyH'); H.sim(0.1); INPUT.keys.delete('KeyU'); INPUT.keys.delete('KeyH');
      if (!(h.p2cd > 0)) errs.push(id + ': skill not used');
      if (!(h.p2dashCd > 0)) errs.push(id + ': no dash');
      H.sim(2, { god: true, render: true });
    }
    expect(errs, 'failures').toEqual([]);
  });
});

group('Village', () => {
  test('buildings cost stones and materials and give permanent bonuses', () => {
    H.save({ level: 20, stones: 100000 });
    SAVE.mats = { shard: 50, horn: 50, star: 50 };
    const hp0 = pstat(false).hp;
    expect(upgradeBuilding('training'), 'built').toBe(true);
    expect(bLv('training'), 'level').toBe(1);
    expect(SAVE.stones, 'stones paid').toBe(100000 - bldCost(0).stones);
    expect(pstat(false).hp > hp0, 'more HP').toBe(true);
    for (let k = 0; k < 6; k++) upgradeBuilding('forge');
    expect(bLv('forge'), 'capped at 5').toBe(BLD_MAX);
    SAVE.stones = 0;
    expect(upgradeBuilding('library'), 'too poor').toBe(false);
  });
  test('Summoning Altar: costs, card EXP, stars on rares and the pity counter', () => {
    H.save({ level: 40, stones: 10000 });
    const r1 = altarDraw(1);
    expect(r1.length, 'one card').toBe(1);
    expect(SAVE.stones, 'cost 100').toBe(9900);
    SAVE.altar.pity = ALTAR.pity - 1;
    const r2 = altarDraw(1);
    expect(r2[0].rare, 'pity gives a rare').toBe(true);
    expect(SAVE.altar.pity, 'pity reset').toBe(0);
    const r10 = altarDraw(10);
    expect(r10.length, 'ten cards').toBe(10);
    expect(SAVE.stones, 'ten for 900').toBe(9800 - 900);
    SAVE.stones = 0; SAVE.altar.free = 1;
    expect(!!altarDraw(1), 'free draw').toBe(true);
    expect(altarDraw(1), 'no stones').toBe(null);
  });
  test('login calendar: one claim per day, no reset, Pactkeeper outfit on day 28', () => {
    H.save({ level: 5 });
    const s0 = SAVE.stones;
    expect(!!claimCalendar(), 'claim day 1').toBe(true);
    expect(SAVE.stones > s0, 'reward paid').toBe(true);
    expect(claimCalendar(), 'second claim same day').toBe(null);
    SAVE.login = { day: 27, last: 'long ago' };
    const r = claimCalendar();
    expect(r.day, 'day 28').toBe(28);
    expect(OUTFITS.find(o => o.id === 'pactkeeper').ok(), 'outfit unlocked').toBe(true);
    SAVE.login.last = 'x';
    expect(claimCalendar().day, 'loops to day 1').toBe(1);
  });
  test('weekly challenges: 3 per week, progress from play, claim once', () => {
    H.save({ level: 10 });
    ensureWeekly();
    expect(SAVE.weeklyCh.list.length, 'three').toBe(3);
    const c = SAVE.weeklyCh.list[0], d = weeklyDef(c.id);
    expect(claimWeekly(0), 'not done yet').toBe(false);
    c.start -= d.n;
    expect(claimWeekly(0), 'claimed').toBe(true);
    expect(claimWeekly(0), 'only once').toBe(false);
  });
  test('arena: fight a rival army, win by defeating the rival, rating and tickets update', () => {
    H.save({ level: 30, cardLv: 20, hotbar: ['fang_wolf', 'gale_hawk', 'iron_boar', 'seraph', null, null] });
    ensureArena();
    const rival = arenaOpponents()[0], r0 = SAVE.arena.rating;
    expect(enterArena(rival), 'entered').toBe(true);
    expect(W.isArena && !!W.arena.core, 'rival summoner spawned').toBe(true);
    H.sim(3, { god: true, render: true });
    expect(W.arena.i > 0 && W.enemies.some(e => e.d.cardArt), 'rival summoned cards').toBe(true);
    H.sim(3, { god: true, summon: true, render: true });
    W.arena.core.hp = 1; damageEnemy(W.arena.core, 999, null);
    H.sim(5, { god: true, until: () => STATE !== 'play' });
    expect(STATE, 'result').toBe('result');
    expect(SAVE.arena.rating > r0, 'rating up').toBe(true);
    expect(SAVE.arena.tickets, 'ticket used').toBe(ARENA_TICKETS - 1);
    expect(SAVE.cleared.some(Boolean), 'no stage marked cleared').toBe(false);
  });
  test('every base card can be drawn as a rival arena unit', () => {
    H.save({ level: 50, cardLv: 20 });
    ensureArena();
    const rival = Object.assign({}, arenaRivals()[29], { deck: CARD_IDS.filter(id => !CARDS[id].fusion) });
    enterArena(rival);
    for (const id of rival.deck) spawnEnemy('arena_' + id, rand(-300, 300), rand(-300, 300));
    H.sim(1, { god: true, render: true });
    expect(W.enemies.filter(e => e.d.cardArt).length >= 60, 'units alive').toBe(true);
  });
  test('the Village screen and the Codex play stats render', () => {
    H.save({ level: 30, stones: 5000, cleared: 3 });
    SAVE.playStats = { 0: { plays: 3, wins: 2, deaths: 1, quits: 0, time: 300, deathAt: 50 } };
    const bad = [];
    for (const t of ['buildings', 'altar', 'calendar', 'weekly', 'arena']) {
      try { vilTab = t; showScreen('village'); if (!$('vilContent').children.length) bad.push(t + ' empty'); } catch (e) { bad.push(t + ': ' + e.message); }
    }
    codexTab = 'stats'; showScreen('codex');
    if (!document.querySelector('#codexContent .rec-table')) bad.push('stats table');
    expect(bad, 'screens').toEqual([]);
  });
});

group('App, photo mode and accessibility', () => {
  test('install files: manifest, icons and service worker are served', async () => {
    const base = new URL('../', location.href);
    const m = await (await fetch(new URL('manifest.webmanifest', base))).json();
    expect(m.icons.map(i => i.sizes), 'icon sizes').toEqual(['192x192', '512x512']);
    for (const f of ['sw.js', 'icons/icon-192.png', 'icons/icon-512.png']) expect((await fetch(new URL(f, base))).ok, f).toBe(true);
  });
  test('photo mode freezes the battle, changes filters and returns', () => {
    H.save({ level: 10 });
    H.start(2);
    H.sim(1);
    enterPhoto();
    expect(PHOTO.on, 'on').toBe(true);
    const t0 = W.t; H.sim(1);
    expect(W.t, 'frozen').toBe(t0);
    PHOTO.filter = 'noir'; refreshPhotoBar();
    expect($('game').style.filter.includes('grayscale'), 'filter applied').toBe(true);
    exitPhoto();
    H.sim(0.5);
    expect(W.t > t0, 'running again').toBe(true);
  });
  test('accessibility: colorblind filter, text size, contrast, reduced flashing', () => {
    SETTINGS.cb = 'deutan'; SETTINGS.uiScale = 1.2; SETTINGS.contrast = true; SETTINGS.calm = true;
    applyA11y();
    expect($('game').style.filter.includes('cb-deutan'), 'colorblind filter').toBe(true);
    expect(document.documentElement.style.getPropertyValue('--ui'), 'ui scale').toBe('1.2');
    expect(document.body.classList.contains('hc'), 'contrast').toBe(true);
    expect(GFX_ON.bloom(), 'no bloom').toBe(false);
    SETTINGS.cb = 'off'; SETTINGS.uiScale = 1; SETTINGS.contrast = false; SETTINGS.calm = false; applyA11y();
  });
  test('assist mode: slower enemies, Allen cannot fall, no stars are earned', () => {
    H.save({ level: 10 });
    SETTINGS.assist = true;
    H.start(1);
    const e = H.spawnNear('goblin', 1)[0];
    expect(e.speed < ENEMIES.goblin.speed * W.sm.spd * 0.8, 'slower').toBe(true);
    W.player.hp = 0; playerDie();
    expect(W.player.dead, 'saved').toBe(false);
    H.killBoss();
    expect(SAVE.cleared[1], 'cleared').toBe(true);
    expect(SAVE.stars[1][1] || SAVE.stars[1][2], 'no challenge stars').toBe(false);
  });
  test('vibration fires on hits when touch controls are on', () => {
    H.save({ level: 10 });
    const calls = [], real = navigator.vibrate;
    navigator.vibrate = p => { calls.push(p); return true; };
    INPUT.touchMode = true; SETTINGS.vibrate = true;
    H.start(1);
    VIB_T = 0; hitAlly(W.player, 5, null);
    navigator.vibrate = real;
    expect(calls.length > 0, 'vibrated').toBe(true);
  });
});
