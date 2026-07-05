import { findMatch, resolveTeams } from './state.js';
import { fmtDate } from './live.js';
import { t, teamName } from './i18n.js';

// Cache summary payloads in-memory — ESPN's endpoint is not cheap and the
// modal will be reopened often. Cleared on page reload, which is fine.
const summaryCache = new Map();
let modalOpenId = null;

// ESPN's stats field names vary a bit across responses; each entry lists the
// name candidates that map to one display row plus the i18n key for its
// label. Order here = display order.
const STAT_KEYS = [
  { keys: ['possessionpct', 'possession'],                                 labelKey: 'stat_possession', suffix: '%' },
  { keys: ['totalshots', 'shots'],                                         labelKey: 'stat_shots' },
  { keys: ['shotsongoal', 'shotsontarget', 'shotsontargetnumeric'],        labelKey: 'stat_on_target' },
  { keys: ['corners', 'wonCorners', 'cornerkicks'],                        labelKey: 'stat_corners' },
  { keys: ['offsides'],                                                    labelKey: 'stat_offsides' },
  { keys: ['foulscommitted', 'fouls'],                                     labelKey: 'stat_fouls' },
  { keys: ['yellowcards'],                                                 labelKey: 'stat_yellow' },
  { keys: ['redcards'],                                                    labelKey: 'stat_red' },
  { keys: ['saves'],                                                       labelKey: 'stat_saves' },
];

function normStat(k) {
  return (k || '').toLowerCase().replace(/[^a-z]/g, '');
}

function statValue(teamStats, keys) {
  if (!teamStats) return null;
  const normKeys = keys.map(normStat);
  for (const s of teamStats) {
    const n = normStat(s.name || s.abbreviation || s.displayName);
    if (normKeys.includes(n)) {
      const raw = s.displayValue != null ? s.displayValue : s.value;
      if (raw == null || raw === '') return null;
      return String(raw);
    }
  }
  return null;
}

function parseStatNumber(str) {
  if (str == null) return NaN;
  const m = String(str).match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : NaN;
}

async function fetchSummary(eventId) {
  if (summaryCache.has(eventId)) return summaryCache.get(eventId);
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  summaryCache.set(eventId, data);
  return data;
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

// Goals sit under `header.competitions[0].details` (with `scoringPlay: true`)
// on newer ESPN summaries; older ones expose `scoringPlays` at the top level.
// Prefer the first shape, fall back to the second.
function extractGoals(data, homeC, awayC, homeIsA) {
  const details = data?.header?.competitions?.[0]?.details || [];
  const scoringDetails = details.filter(d => d.scoringPlay);
  const source = scoringDetails.length
    ? scoringDetails.map(d => ({
        player: d.participants?.[0]?.athlete?.displayName || d.text || 'Goal',
        minute: d.clock?.displayValue || '',
        teamId: d.team?.id,
        ownGoal: d.ownGoal === true,
        penalty: d.penaltyKick === true,
      }))
    : (data?.scoringPlays || []).map(p => ({
        player: p.athletesInvolved?.[0]?.displayName || (p.text || '').replace(/\s*-\s*Goal.*$/i, '').trim() || 'Goal',
        minute: p.clock?.displayValue || '',
        teamId: p.team?.id,
        ownGoal: /own\s*goal/i.test(p.type?.text || '') || /own\s*goal/i.test(p.text || ''),
        penalty: /pen/i.test(p.type?.text || ''),
      }));

  const a = [], b = [];
  for (const g of source) {
    const isHome = g.teamId && homeC && String(g.teamId) === String(homeC.id);
    const isAway = g.teamId && awayC && String(g.teamId) === String(awayC.id);
    let side;
    if (isHome) side = homeIsA ? 'a' : 'b';
    else if (isAway) side = homeIsA ? 'b' : 'a';
    // ESPN already assigns own goals to the credited (opposing) team in the
    // scoringPlay's `team` field, so no flip is needed here.
    if (side === 'a') a.push(g);
    else if (side === 'b') b.push(g);
  }
  return { a, b };
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

  const statsSection = statRows.length
    ? `<div class="modal-section">
        <div class="modal-section-title">${t('match_stats')}</div>
        ${statRows.join('')}
      </div>`
    : '';

  const noDataNotice = (!goalsA.length && !goalsB.length && !statRows.length)
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
    const data = await fetchSummary(match.eventId);
    if (modalOpenId !== matchId) return;
    body.innerHTML = renderModalContent(match, data);
  } catch (e) {
    if (modalOpenId !== matchId) return;
    body.innerHTML = `<div class="details-error">
      <span class="material-symbols-rounded">error</span>
      ${t('modal_error')}<br><span style="font-size:11px;opacity:0.7">${e.message || e}</span>
    </div>`;
  }
}

export function closeDetails() {
  modalOpenId = null;
  document.getElementById('modalBackdrop').classList.remove('open');
  document.getElementById('modalSheet').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOpenId) closeDetails();
});
