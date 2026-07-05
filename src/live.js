import { ROUNDS } from './data.js';
import { picks, resolveTeams, clearDownstream, reapplyAllLocks } from './state.js';
import { render, setActiveRound, activeRound, userSelectedRound } from './render.js';

// All times shown to users are Cairo local — this is a single-user app and
// that's where the user is. Change here if the host of the app moves.
const CAIRO_TZ = 'Africa/Cairo';
const CAIRO_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: CAIRO_TZ, weekday: 'short', month: 'short', day: 'numeric',
  hour: 'numeric', minute: '2-digit', hour12: true
});

export function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const parts = Object.fromEntries(CAIRO_PARTS.formatToParts(d).map(p => [p.type, p.value]));
  const ampm = (parts.dayPeriod || '').toUpperCase();
  return `${parts.weekday} · ${parts.month} ${parts.day} · ${parts.hour}:${parts.minute} ${ampm}`;
}

// ESPN uses different display names for a handful of teams than we do. Group
// canonical/alternate spellings so `namesMatch` can find them.
const NAME_ALIASES = {
  'usa': ['unitedstates', 'usa', 'usmnt'],
  'southkorea': ['korearepublic', 'southkorea', 'korea'],
  'drcongo': ['drcongo', 'democraticrepublicofcongo', 'congodr', 'congo', 'congokinshasa'],
  'ivorycoast': ['ivorycoast', 'cotedivoire'],
  'caboverde': ['caboverde', 'capeverde'],
  'bosniaherzegovina': ['bosniaandherzegovina', 'bosniaherzegovina', 'bosnia', 'bih', 'bosniah'],
  'czechia': ['czechia', 'czechrepublic'],
};

function norm(name) {
  return (name || '').toLowerCase().replace(/[^a-z]/g, '');
}

export function namesMatch(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  for (const canon of Object.keys(NAME_ALIASES)) {
    const group = NAME_ALIASES[canon].concat([canon]);
    if (group.includes(na) && group.includes(nb)) return true;
  }
  return false;
}

function normalizeEvent(ev) {
  const comp = (ev.competitions && ev.competitions[0]) || {};
  const cs = comp.competitors || [];
  const home = cs.find(c => c.homeAway === 'home') || cs[0];
  const away = cs.find(c => c.homeAway === 'away') || cs[1];
  if (!home || !away) return null;
  const status = (ev.status && ev.status.type) || {};
  return {
    id: ev.id,
    date: ev.date,
    venue: (comp.venue && comp.venue.fullName) || null,
    home: home.team && home.team.displayName,
    away: away.team && away.team.displayName,
    homeScore: parseInt(home.score, 10),
    awayScore: parseInt(away.score, 10),
    homeWinner: home.winner === true,
    awayWinner: away.winner === true,
    completed: status.completed === true,
    state: (status.state || '').toLowerCase(),
    detail: status.detail || status.shortDetail || status.description || '',
  };
}

function findApiMatch(events, teamA, teamB) {
  return events.find(ev =>
    (namesMatch(ev.home, teamA.name) && namesMatch(ev.away, teamB.name)) ||
    (namesMatch(ev.home, teamB.name) && namesMatch(ev.away, teamA.name))
  );
}

// Mutates ROUNDS in place with anything ESPN knows about each match: real
// dates, venue, scores, event id (for the summary endpoint), and locks the
// winner when a match is completed. Returns counts for the status pill.
function applyLiveData(rawEvents) {
  const events = rawEvents.map(normalizeEvent).filter(Boolean);
  let finishedCount = 0, liveCount = 0;

  for (const round of ROUNDS) {
    for (const m of round.matches) {
      const teams = resolveTeams(m);
      if (!teams[0] || !teams[1]) continue;

      const ev = findApiMatch(events, teams[0], teams[1]);
      if (!ev) continue;

      const dateStr = fmtDate(ev.date);
      if (dateStr) m.date = dateStr;
      if (ev.venue) m.venue = ev.venue;
      if (ev.id) m.eventId = ev.id;

      const hasScores = !isNaN(ev.homeScore) && !isNaN(ev.awayScore);
      const homeIsA = namesMatch(ev.home, teams[0].name);
      m.homeIsA = homeIsA;
      const aScore = hasScores ? (homeIsA ? ev.homeScore : ev.awayScore) : null;
      const bScore = hasScores ? (homeIsA ? ev.awayScore : ev.homeScore) : null;

      if (ev.completed) {
        let winner = null;
        if (ev.homeWinner) winner = homeIsA ? 'a' : 'b';
        else if (ev.awayWinner) winner = homeIsA ? 'b' : 'a';
        else if (hasScores && aScore !== bScore) winner = aScore > bScore ? 'a' : 'b';

        if (winner && hasScores) {
          let scoreStr = `${aScore}–${bScore}`;
          if (/pen/i.test(ev.detail) || /shoot/i.test(ev.detail)) scoreStr += ' (pens)';
          else if (/aet|extra/i.test(ev.detail)) scoreStr += ' (aet)';
          const prev = picks[m.id];
          m.locked = winner;
          m.score = scoreStr;
          picks[m.id] = winner;
          if (prev !== undefined && prev !== winner) clearDownstream(m.id);
          finishedCount++;
        }
      } else if (ev.state === 'in' && hasScores) {
        m.score = `${aScore}–${bScore} LIVE`;
        liveCount++;
      }
    }
  }

  reapplyAllLocks();
  return { finishedCount, liveCount };
}

async function fetchLiveData() {
  const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.events || [];
}

function setStatus(text, opts) {
  const el = document.getElementById('liveStatus');
  if (el) el.textContent = text;
  const pill = document.getElementById('livePill');
  if (pill) pill.classList.toggle('shimmer', !!(opts && opts.loading));
}

// Prefer the earliest round that has a live match; else the earliest round
// with any un-decided match; else the final.
export function pickDefaultRound() {
  for (let i = 0; i < ROUNDS.length; i++) {
    if (ROUNDS[i].matches.some(m => m.score && /LIVE/i.test(m.score))) return i;
  }
  for (let i = 0; i < ROUNDS.length; i++) {
    if (ROUNDS[i].matches.some(m => !m.locked)) return i;
  }
  return ROUNDS.length - 1;
}

export async function initLive() {
  try {
    const events = await fetchLiveData();
    if (!events.length) {
      setStatus('Cached bracket');
      return;
    }
    const { finishedCount, liveCount } = applyLiveData(events);
    const currentRound = ROUNDS[activeRound];
    const currentFullyLocked = currentRound && currentRound.matches.every(m => m.locked);
    if (!userSelectedRound || currentFullyLocked) {
      setActiveRound(pickDefaultRound());
    }
    const cairoTime = new Intl.DateTimeFormat('en-US', {
      timeZone: CAIRO_TZ, hour: 'numeric', minute: '2-digit', hour12: true
    }).format(new Date());
    const bits = [];
    if (liveCount) bits.push(`${liveCount} live`);
    if (finishedCount) bits.push(`${finishedCount} finished`);
    setStatus(`Live · ${bits.join(', ') || 'no changes'} · ${cairoTime}`);
    render();
  } catch (e) {
    console.warn('Live fetch failed:', e);
    setStatus('Offline · cached bracket');
  }
}

export async function refreshLive() {
  const btn = document.querySelector('.icon-btn');
  if (btn) { btn.disabled = true; btn.classList.add('loading'); }
  setStatus('Refreshing…', { loading: true });
  await initLive();
  if (btn) { btn.disabled = false; btn.classList.remove('loading'); }
}
