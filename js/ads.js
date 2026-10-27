'use strict';
// ---------- Rewarded ads (Android app only, via AdMob). The web version never shows ads. ----------
// Rewards are optional and capped per day: double stage stones, a free Altar draw, an extra arena ticket.

const ADS_CONFIG = {
  // Google's public TEST rewarded ad unit. Replace with your own unit id before publishing (see ANDROID.md).
  rewardedId: 'ca-app-pub-3940256099942544/5224354917',
  testing: true,
  dailyCap: { stones: 3, draw: 2, ticket: 2 },
};
const ADS = { provider: null, ready: false, busy: false };
const isNativeApp = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
function admobProvider() {
  const AdMob = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
  if (!AdMob) return null;
  return {
    async init() { await AdMob.initialize({ initializeForTesting: ADS_CONFIG.testing }); },
    async showRewarded() {
      await AdMob.prepareRewardVideoAd({ adId: ADS_CONFIG.rewardedId, isTesting: ADS_CONFIG.testing });
      const reward = await AdMob.showRewardVideoAd();
      return !!reward;
    },
  };
}
if (isNativeApp()) { ADS.provider = admobProvider(); if (ADS.provider) ADS.provider.init().then(() => { ADS.ready = true; }).catch(() => {}); }
const adsOn = () => !!(ADS.provider && (ADS.ready || ADS.test));
function adLeft(kind) {
  const a = SAVE.ads || (SAVE.ads = { day: '', used: {} });
  if (a.day !== todayKey()) { a.day = todayKey(); a.used = {}; }
  return ADS_CONFIG.dailyCap[kind] - (a.used[kind] || 0);
}
async function watchAdFor(kind, grant) {
  if (!adsOn() || ADS.busy || adLeft(kind) <= 0) return false;
  ADS.busy = true;
  let ok = false;
  try { ok = await ADS.provider.showRewarded(); } catch (e) { ok = false; }
  ADS.busy = false;
  if (!ok) { toast('The ad did not finish, so no reward this time', 'fail'); return false; }
  SAVE.ads.used[kind] = (SAVE.ads.used[kind] || 0) + 1;
  grant(); saveGame(); SFX.level();
  return true;
}
const adButton = (kind, label, id) => (adsOn() && adLeft(kind) > 0 ? `<button class="btn small ad-btn" id="${id}">▶ ${label} <span class="muted">(${adLeft(kind)} left today)</span></button>` : '');

// 1) results: double the magic stones from a won stage
const _ad_finishStage = finishStage;
finishStage = function (won, retreat) {
  const stones = W && W.active && !W.ended && !W.resultShown ? W.stones : 0;
  _ad_finishStage(won, retreat);
  if (!won || stones <= 0 || !adsOn()) return;
  $('resExtra').insertAdjacentHTML('beforeend', adButton('stones', `Watch an ad: +◆ ${stones} (double stones)`, 'btnAdStones'));
  const b = $('btnAdStones');
  if (b) b.onclick = () => watchAdFor('stones', () => { SAVE.stones += stones; b.replaceWith(document.createTextNode(`+◆ ${stones} added. Thanks!`)); });
};
// 2) Altar: a free draw
const _ad_vilAltar = vilAltar;
vilAltar = function (root) {
  _ad_vilAltar(root);
  const row = root.querySelector('.altar-b .menu-row');
  if (row) { row.insertAdjacentHTML('beforeend', adButton('draw', 'Watch an ad: free draw', 'btnAdDraw')); const b = $('btnAdDraw'); if (b) b.onclick = () => watchAdFor('draw', () => { SAVE.altar.free = (SAVE.altar.free || 0) + 1; buildVillage(); }); }
};
// 3) Arena: an extra ticket
const _ad_vilArena = vilArena;
vilArena = function (root) {
  _ad_vilArena(root);
  const head = root.querySelector('.arena-head');
  if (head && SAVE.arena.tickets <= 0) { head.insertAdjacentHTML('afterend', adButton('ticket', 'Watch an ad: +1 arena ticket', 'btnAdTicket')); const b = $('btnAdTicket'); if (b) b.onclick = () => watchAdFor('ticket', () => { SAVE.arena.tickets++; buildVillage(); }); }
};
