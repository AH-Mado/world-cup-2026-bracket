import { findMatch, resolveTeams } from './state.js';
import { fmtDate } from './live.js';
import { t, teamName } from './i18n.js';
import {
  STAT_KEYS,
  statValue,
  parseStatNumber,
  extractGoals,
  extractEvents,
} from './details-parse.js';

// Cache summary payloads in-memory — ESPN's endpoint is not cheap and the
// modal will be reopened often. For live matches we bypass the cache so the
// 5s auto-refresh sees fresh goals / stats.
const summaryCache = new Map();
let modalOpenId = null;
// Fingerprint of the summary currently rendered into the modal body. The
// silent auto-refresh compares against this to skip re-rendering when the
// payload is byte-identical to what the user is already looking at — no
// innerHTML flicker, no scroll jitter.
let renderedFingerprint = null;

function fingerprintSummary(data) {
  const comp = data?.header?.competitions?.[0] || {};
  return JSON.stringify({
    status: comp.status,
    scores: (comp.competitors || []).map(c => [c.homeAway, c.score, c.winner]),
    keyEvents: data?.keyEvents,
    details: comp.details,
    box: (data?.boxscore?.teams || []).map(tm => tm.statistics),
  });
}

async function fetchSummary(eventId, { bypassCache = false } = {}) {
  if (!bypassCache && summaryCache.has(eventId)) return summaryCache.get(eventId);
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  summaryCache.set(eventId, data);
  return data;
}

function isMatchLive(match) {
  return !!(match && match.score && /LIVE/i.test(match.score));
}

function goalRowHTML(g) {
  const player = g.player || 'Goal';
  const minute = g.minute || '';
  const icon = g.ownGoal ? '🔄' : '⚽';
  const tagBits = [];
  if (g.ownGoal) tagBits.push(t('goal_og'));
  if (g.penalty) tagBits.push(t('goal_pen'));
  const tag = tagBits.length ? ` <span style="opacity:0.65">(${tagBits.join(', ')})</span>` : '';
  // `dir="ltr"` on the minute forces bidi to treat it as a Latin unit. Without
  // this, RTL context flips the neutral apostrophes and `+` and turns
  // "90'+2'" into "'2+'90". The player name keeps its natural direction so it
  // sits alongside Arabic goal tags cleanly.
  return `<div class="goal-row${g.ownGoal ? ' own-goal' : ''}">
    <span class="goal-icon">${icon}</span>
    <span class="goal-player">${player}${tag}</span>
    <span class="goal-min" dir="ltr">${minute}</span>
  </div>`;
}

function eventRowHTML(e) {
  const minute = e.minute || '';
  let icon = '•';
  let body = '';
  if (e.kind === 'sub') {
    icon = '🔁';
    const inLabel  = `<span class="sub-in">↑ ${e.playerIn || '—'}</span>`;
    const outLabel = `<span class="sub-out">↓ ${e.playerOut || '—'}</span>`;
    body = `<span class="event-player">${inLabel}<br>${outLabel}</span>`;
  } else if (e.kind === 'yellow') {
    icon = '🟨';
    body = `<span class="event-player">${e.player || t('unknown_player')}</span>`;
  } else if (e.kind === 'red') {
    icon = '🟥';
    body = `<span class="event-player">${e.player || t('unknown_player')}</span>`;
  } else if (e.kind === 'pen-miss') {
    icon = '❌';
    body = `<span class="event-player">${e.player || t('unknown_player')} <span style="opacity:0.65">(${t('pen_missed')})</span></span>`;
  }
  return `<div class="goal-row event-row event-${e.kind}">
    <span class="goal-icon">${icon}</span>
    ${body}
    <span class="goal-min" dir="ltr">${minute}</span>
  </div>`;
}

function renderModalContent(match, data) {
  const header = (data && data.header) || {};
  const comp = (header.competitions && header.competitions[0]) || {};
  const competitors = comp.competitors || [];
  const homeC = competitors.find(c => c.homeAway === 'home') || competitors[0];
  const awayC = competitors.find(c => c.homeAway === 'away') || competitors[1];
  const homeIsA = match.homeIsA !== false;
  const [teamA, teamB] = resolveTeams(match);
  const compA = homeIsA ? homeC : awayC;
  const compB = homeIsA ? awayC : homeC;

  const status = (comp.status && comp.status.type) || {};
  const isLive = (status.state || '').toLowerCase() === 'in';
  const isFinal = status.completed === true;
  const detailText = status.detail || status.shortDetail || '';

  const scoreA = compA ? parseInt(compA.score, 10) : NaN;
  const scoreB = compB ? parseInt(compB.score, 10) : NaN;
  const showScore = !isNaN(scoreA) && !isNaN(scoreB);

  const goals = extractGoals(data, homeC, awayC, homeIsA);
  const goalsA = goals.a.map(goalRowHTML);
  const goalsB = goals.b.map(goalRowHTML);

  const events = extractEvents(data, homeC, awayC, homeIsA);
  const eventsA = events.a.map(eventRowHTML);
  const eventsB = events.b.map(eventRowHTML);

  const boxTeams = (data && data.boxscore && data.boxscore.teams) || [];
  const homeBox = boxTeams.find(t => t.homeAway === 'home') || boxTeams[0];
  const awayBox = boxTeams.find(t => t.homeAway === 'away') || boxTeams[1];
  const boxA = homeIsA ? homeBox : awayBox;
  const boxB = homeIsA ? awayBox : homeBox;

  const statRows = [];
  for (const s of STAT_KEYS) {
    const va = statValue(boxA && boxA.statistics, s.keys);
    const vb = statValue(boxB && boxB.statistics, s.keys);
    if (va == null && vb == null) continue;
    const na = parseStatNumber(va);
    const nb = parseStatNumber(vb);
    const total = (isNaN(na) ? 0 : na) + (isNaN(nb) ? 0 : nb);
    let pctA = 0, pctB = 0;
    if (s.suffix === '%' && !isNaN(na) && !isNaN(nb)) {
      pctA = na; pctB = nb;
    } else if (total > 0) {
      pctA = (na / total) * 100;
      pctB = (nb / total) * 100;
    }
    const winnerA = !isNaN(na) && !isNaN(nb) && na > nb;
    const winnerB = !isNaN(na) && !isNaN(nb) && nb > na;
    statRows.push(`<div class="stat-row">
      <div class="stat-num left${winnerA ? ' winner' : ''}">${va ?? '—'}</div>
      <div class="stat-center">
        <span class="stat-label">${t(s.labelKey)}</span>
        <div class="stat-bar">
          <div class="bar-a" style="width:${Math.max(0, Math.min(100, pctA))}%"></div>
          <div class="bar-b" style="width:${Math.max(0, Math.min(100, pctB))}%"></div>
        </div>
      </div>
      <div class="stat-num right${winnerB ? ' winner' : ''}">${vb ?? '—'}</div>
    </div>`);
  }

  const venue = (comp.venue && comp.venue.fullName) || match.venue || '';
  const attendance = comp.attendance ? Number(comp.attendance).toLocaleString('en-US') : '';
  const dateStr = comp.date ? fmtDate(comp.date) : (match.date || '');

  const scoreCenter = showScore
    ? `<div class="big-score"><span>${scoreA}</span><span class="sep">:</span><span>${scoreB}</span></div>
       <div class="status${isLive ? ' live' : ''}">${detailText || (isFinal ? t('full_time') : (isLive ? t('live_label') : ''))}</div>`
    : `<div class="big-score" style="color:var(--text-dim);font-size:22px">${t('vs')}</div>
       <div class="status">${detailText || dateStr}</div>`;

  const goalsSection = (goalsA.length || goalsB.length)
    ? `<div class="modal-section">
        <div class="modal-section-title">${t('goal_scorers')}</div>
        <div class="goals-grid">
          <div class="goals-col${goalsA.length ? '' : ' empty-col'}">${goalsA.length ? goalsA.join('') : t('no_goals')}</div>
          <div class="goals-col${goalsB.length ? '' : ' empty-col'}">${goalsB.length ? goalsB.join('') : t('no_goals')}</div>
        </div>
      </div>`
    : '';

  const timelineSection = (eventsA.length || eventsB.length)
    ? `<div class="modal-section">
        <div class="modal-section-title">${t('timeline')}</div>
        <div class="goals-grid">
          <div class="goals-col${eventsA.length ? '' : ' empty-col'}">${eventsA.length ? eventsA.join('') : t('no_events')}</div>
          <div class="goals-col${eventsB.length ? '' : ' empty-col'}">${eventsB.length ? eventsB.join('') : t('no_events')}</div>
        </div>
      </div>`
    : '';

  const statsSection = statRows.length
    ? `<div class="modal-section">
        <div class="modal-section-title">${t('match_stats')}</div>
        ${statRows.join('')}
      </div>`
    : '';

  const noDataNotice = (!goalsA.length && !goalsB.length && !eventsA.length && !eventsB.length && !statRows.length)
    ? `<div class="details-loading" style="padding:24px 0">${t('modal_no_stats')}</div>`
    : '';

  return `
    <div class="modal-header">
      <div class="side-mini">
        <div class="flag-mini">${teamA?.flag || '⚽'}</div>
        <div class="name-mini">${teamName(teamA) || '—'}</div>
      </div>
      <div class="score-mini">${scoreCenter}</div>
      <div class="side-mini">
        <div class="flag-mini">${teamB?.flag || '⚽'}</div>
        <div class="name-mini">${teamName(teamB) || '—'}</div>
      </div>
    </div>
    <div class="modal-meta">
      ${dateStr ? `<span class="meta-chip"><span class="material-symbols-rounded">calendar_today</span>${dateStr}</span>` : ''}
      ${venue ? `<span class="meta-chip"><span class="material-symbols-rounded">stadium</span>${venue}</span>` : ''}
      ${attendance ? `<span class="meta-chip"><span class="material-symbols-rounded">groups</span>${attendance}</span>` : ''}
    </div>
    ${goalsSection}
    ${timelineSection}
    ${statsSection}
    ${noDataNotice}
  `;
}

// Bind swipe-down-to-dismiss on the modal sheet. Idempotent — safe to call
// on every openDetails; runs the actual wiring only once.
function setupSheetDrag() {
  const sheet = document.getElementById('modalSheet');
  if (!sheet || sheet.__dragReady) return;
  sheet.__dragReady = true;
  const body = document.getElementById('modalBody');
  const backdrop = document.getElementById('modalBackdrop');

  let startY = null;   // clientY at touchstart, or null when not dragging
  let dy = 0;          // current downward displacement in px
  let t0 = 0;          // touchstart timestamp for velocity

  sheet.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    // If the touch is inside the scrollable body AND the body is scrolled,
    // let it scroll normally instead of hijacking as a drag.
    if (body.contains(e.target) && body.scrollTop > 0) return;
    startY = e.touches[0].clientY;
    dy = 0;
    t0 = Date.now();
    sheet.style.transition = 'none';
    backdrop.style.transition = 'none';
  }, { passive: true });

  sheet.addEventListener('touchmove', (e) => {
    if (startY == null) return;
    const raw = e.touches[0].clientY - startY;
    if (raw <= 0) { dy = 0; sheet.style.transform = ''; backdrop.style.opacity = ''; return; }
    // Slight rubber-band past 200px so far pulls don't scale linearly forever.
    dy = raw > 200 ? 200 + (raw - 200) * 0.3 : raw;
    sheet.style.transform = `translate(-50%, ${dy}px)`;
    // Fade the backdrop in proportion to how far the sheet has moved off.
    const sheetH = sheet.offsetHeight || 500;
    backdrop.style.opacity = Math.max(0, 1 - dy / sheetH).toFixed(3);
  }, { passive: true });

  sheet.addEventListener('touchend', () => {
    if (startY == null) return;
    const displacement = dy;
    const velocity = displacement / Math.max(1, Date.now() - t0); // px per ms
    startY = null;
    // Restore transitions and clear inline overrides so the class-based
    // transform (`translate(-50%, 0)` when open, `100%` when not) takes over
    // and the browser animates from the current inline position.
    sheet.style.transition = '';
    backdrop.style.transition = '';
    sheet.style.transform = '';
    backdrop.style.opacity = '';
    // Close on either a decisive displacement or a fast downward flick.
    if (displacement > 120 || velocity > 0.6) closeDetails();
  }, { passive: true });
}

export async function openDetails(matchId) {
  const match = findMatch(matchId);
  if (!match || !match.eventId) return;
  modalOpenId = matchId;
  const body = document.getElementById('modalBody');
  const backdrop = document.getElementById('modalBackdrop');
  const sheet = document.getElementById('modalSheet');
  body.innerHTML = `<div class="details-loading"><div class="spinner"></div>${t('modal_loading')}</div>`;
  backdrop.classList.add('open');
  sheet.classList.add('open');
  document.body.style.overflow = 'hidden';
  setupSheetDrag();
  try {
    const data = await fetchSummary(match.eventId, { bypassCache: isMatchLive(match) });
    if (modalOpenId !== matchId) return;
    body.innerHTML = renderModalContent(match, data);
    renderedFingerprint = fingerprintSummary(data);
  } catch (e) {
    if (modalOpenId !== matchId) return;
    renderedFingerprint = null;
    body.innerHTML = `<div class="details-error">
      <span class="material-symbols-rounded">error</span>
      ${t('modal_error')}<br><span style="font-size:11px;opacity:0.7">${e.message || e}</span>
    </div>`;
  }
}

export function closeDetails() {
  modalOpenId = null;
  renderedFingerprint = null;
  document.getElementById('modalBackdrop').classList.remove('open');
  document.getElementById('modalSheet').classList.remove('open');
  document.body.style.overflow = '';
}

// Silent background re-fetch for the currently-open modal. Called by the
// 5s auto-refresh in main.js so live matches keep their goals / stats /
// timeline current without any user interaction. Preserves scroll position
// through the innerHTML swap so an ongoing read isn't yanked back to the top.
// Bails out entirely when the summary hasn't changed since the last render,
// so a modal on a completed / paused match stays perfectly still every tick.
export async function refreshOpenDetails() {
  if (!modalOpenId) return;
  const matchId = modalOpenId;
  const match = findMatch(matchId);
  if (!match || !match.eventId) return;
  try {
    const data = await fetchSummary(match.eventId, { bypassCache: isMatchLive(match) });
    if (modalOpenId !== matchId) return;
    const fp = fingerprintSummary(data);
    if (fp === renderedFingerprint) return; // Nothing changed — no repaint.
    renderedFingerprint = fp;
    const body = document.getElementById('modalBody');
    if (!body) return;
    const savedScroll = body.scrollTop;
    body.innerHTML = renderModalContent(match, data);
    body.scrollTop = savedScroll;
  } catch (_) {
    // Silent — leave whatever's already on screen. The next tick will retry.
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOpenId) closeDetails();
});
