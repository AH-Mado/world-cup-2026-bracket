import { ROUNDS } from './data.js';

const STORAGE_KEY = 'wc2026-picks-v1';

// `picks` maps matchId → 'a' | 'b'. It's a live-mutable map so other modules
// (live.js) can write real results directly. It's re-assigned by resetAllPicks;
// ES-module live bindings mean importers still see the current object.
export let picks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

export function reapplyAllLocks() {
  ROUNDS.forEach(r => r.matches.forEach(m => {
    if (m.locked) picks[m.id] = m.locked;
  }));
}
reapplyAllLocks();

export function findMatch(id) {
  for (const r of ROUNDS) {
    const m = r.matches.find(x => x.id === id);
    if (m) return m;
  }
  return null;
}

export function resolveTeams(match) {
  if (match.a && match.b) return [match.a, match.b];
  const [srcA, srcB] = match.src;
  return [getWinner(srcA), getWinner(srcB)];
}

export function getWinner(matchId) {
  const choice = picks[matchId];
  if (!choice) return null;
  const match = findMatch(matchId);
  if (!match) return null;
  const teams = resolveTeams(match);
  return choice === 'a' ? teams[0] : teams[1];
}

export function clearDownstream(matchId) {
  for (const r of ROUNDS) {
    for (const m of r.matches) {
      if (m.src && m.src.includes(matchId) && picks[m.id] !== undefined) {
        delete picks[m.id];
        clearDownstream(m.id);
      }
    }
  }
}

export function save() {
  const toSave = { ...picks };
  ROUNDS.forEach(r => r.matches.forEach(m => {
    if (m.locked) delete toSave[m.id];
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

// Applies a user pick or unpicks if the same side is clicked twice. Saves to
// storage. Returns true iff state changed, so the caller can re-render.
export function applyPick(matchId, side) {
  const match = findMatch(matchId);
  if (!match || match.locked) return false;
  const teams = resolveTeams(match);
  const teamObj = side === 'a' ? teams[0] : teams[1];
  if (!teamObj) return false;

  const previous = picks[matchId];
  if (previous === side) delete picks[matchId];
  else picks[matchId] = side;
  if (picks[matchId] !== previous) clearDownstream(matchId);
  save();
  return true;
}

export function resetAllPicks() {
  picks = {};
  reapplyAllLocks();
  localStorage.removeItem(STORAGE_KEY);
}
