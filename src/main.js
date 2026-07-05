import { applyPick, resetAllPicks } from './state.js';
import { render, selectRound, setupSwipeGestures, setActiveRound } from './render.js';
import { initLive, refreshLive, pickDefaultRound, refreshStatusAfterLangChange } from './live.js';
import { openDetails, closeDetails } from './details.js';
import { toggleLang, applyI18n, t } from './i18n.js';

// Inline `onclick=` handlers in the rendered HTML call these by name, so they
// must live on the global scope. Everything else stays module-scoped.
window.pick        = (matchId, side) => { if (applyPick(matchId, side)) render(); };
window.resetPicks  = () => {
  if (!confirm(t('reset_confirm'))) return;
  resetAllPicks();
  render();
};
window.selectRound = selectRound;
window.refreshLive = refreshLive;
window.openDetails = openDetails;
window.closeDetails = closeDetails;
window.toggleLang  = () => {
  toggleLang();
  applyI18n();
  render();
  refreshStatusAfterLangChange();
};

// The round-tabs bar sticks below the header — feed the header's real height
// into a CSS var so a taller header on wider screens still docks correctly.
function updateStickyOffset() {
  const header = document.querySelector('header');
  if (!header) return;
  const h = Math.ceil(header.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--tabs-sticky-top', `${h}px`);
}

applyI18n();
setActiveRound(pickDefaultRound());
render();
setupSwipeGestures();
updateStickyOffset();
window.addEventListener('resize', updateStickyOffset);
window.addEventListener('orientationchange', updateStickyOffset);

// Reveal Material Symbols icons once the font actually resolves. The 3.5s
// timer is a safety fallback — if the font request hangs we still exit the
// skeleton state rather than leaving the UI half-broken forever.
function markFontsReady() { document.documentElement.classList.add('fonts-ready'); }
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(markFontsReady).catch(markFontsReady);
} else {
  markFontsReady();
}
setTimeout(markFontsReady, 3500);

// Once the first ESPN fetch has settled (success or failure) the date/status
// skeletons resolve into their real values.
initLive().finally(() => document.documentElement.classList.add('data-ready'));
