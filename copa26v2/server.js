const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const Datastore = require('nedb-promises');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.SESSION_SECRET || 'copa26-jwt-secret-2026';

// ─── DATA DIR ────────────────────────────────────────────────────────────────
function resolveDataDir() {
  const candidates = [process.env.DATA_DIR, '/app/data', path.join(__dirname, 'data')].filter(Boolean);
  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, '.test'), 'ok');
      fs.unlinkSync(path.join(dir, '.test'));
      console.log('📁 Data:', dir);
      return dir;
    } catch (e) { console.log('Skip:', dir, e.message); }
  }
  throw new Error('No writable data dir');
}
const DATA_DIR = resolveDataDir();

// ─── DB ──────────────────────────────────────────────────────────────────────
const db = {
  users:            Datastore.create({ filename: path.join(DATA_DIR, 'users.db'),            autoload: true }),
  awards_picks:     Datastore.create({ filename: path.join(DATA_DIR, 'awards_picks.db'),     autoload: true }),
  awards_results:   Datastore.create({ filename: path.join(DATA_DIR, 'awards_results.db'),   autoload: true }),
  quiniela_picks:   Datastore.create({ filename: path.join(DATA_DIR, 'quiniela_picks.db'),   autoload: true }),
  quiniela_results: Datastore.create({ filename: path.join(DATA_DIR, 'quiniela_results.db'), autoload: true }),
  knockout_teams:   Datastore.create({ filename: path.join(DATA_DIR, 'knockout_teams.db'),   autoload: true }),
  notifications:    Datastore.create({ filename: path.join(DATA_DIR, 'notifications.db'),    autoload: true }),
};

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  req.user = null;
  const auth = req.headers['authorization'];
  if (auth?.startsWith('Bearer ')) {
    try { req.user = jwt.verify(auth.slice(7), JWT_SECRET); } catch(e) {}
  }
  next();
});

function requireAuth(req, res, next) {
  if (req.user?.userId) return next();
  res.status(401).json({ error: 'Not logged in' });
}

// Admin/results/destructive actions require a shared secret (set ADMIN_SECRET in env).
// The score sync uses this same secret. Fails closed if unset.
function requireAdmin(req, res, next) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return res.status(503).json({ error: 'Admin not configured on server' });
  const provided = req.headers['x-admin-secret'];
  if (provided && provided === secret) return next();
  res.status(403).json({ error: 'Admin authorization required' });
}

// ─── AWARD CATEGORIES ────────────────────────────────────────────────────────
const AWARD_CATEGORIES = [
  { id: 'golden_boot',    label: 'Golden Boot',        labelEs: 'Bota de Oro',          emoji: '👟', desc: 'Top goal scorer',           descEs: 'Máximo goleador' },
  { id: 'golden_ball',    label: 'Golden Ball',         labelEs: 'Balón de Oro',          emoji: '⭐', desc: 'Best player',               descEs: 'Mejor jugador' },
  { id: 'golden_glove',   label: 'Golden Glove',        labelEs: 'Guante de Oro',         emoji: '🧤', desc: 'Best goalkeeper',           descEs: 'Mejor portero' },
  { id: 'best_young',     label: 'Best Young Player',   labelEs: 'Mejor Jugador Joven',   emoji: '🌟', desc: 'Best player under 21',      descEs: 'Mejor jugador sub-21' },
  { id: 'most_assists',   label: 'Most Assists',        labelEs: 'Más Asistencias',       emoji: '🎯', desc: 'Most assists',              descEs: 'Más asistencias' },
  { id: 'champion',       label: 'World Cup Champion',  labelEs: 'Campeón del Mundial',   emoji: '🏆', desc: 'The winning team',          descEs: 'El equipo campeón' },
  { id: 'dark_horse',     label: 'Dark Horse',          labelEs: 'El Equipo Sorpresa',    emoji: '🐴', desc: 'Surprise team',             descEs: 'Equipo sorpresa' },
  { id: 'top_scorer_team',label: 'Most Goals (Team)',   labelEs: 'Más Goles (Equipo)',    emoji: '🔥', desc: 'Team with most goals',      descEs: 'Equipo con más goles' },
];

// ─── WORLD CUP 2026 FULL SCHEDULE (104 games) ───────────────────────────────
// Group Stage: 48 games across 12 groups (A-L), 4 teams each
// Official FIFA World Cup 2026 Groups (drawn December 5, 2025)
const GROUPS = {
  A: ['Mexico', 'South Africa', 'Korea Republic', 'Czechia'],
  B: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Morocco', 'Scotland', 'Haiti'],          // corrected: was DR Congo (Dec-draw playoff placeholder)
  D: ['USA', 'Paraguay', 'Australia', 'Turkiye'],
  E: ['Germany', 'Curacao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Tunisia', 'Sweden'],       // corrected: was Iraq
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],         // corrected: was Haiti
  H: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cabo Verde'],
  I: ['France', 'Senegal', 'Norway', 'Iraq'],             // corrected: was New Zealand
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'Colombia', 'Uzbekistan', 'DR Congo'],  // corrected: was Panama
  L: ['England', 'Croatia', 'Ghana', 'Panama'],           // corrected: was Sweden
};

function buildGroupGames() {
  const games = [];
  let id = 1;
  for (const [group, teams] of Object.entries(GROUPS)) {
    // Each group: 6 games (round-robin)
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        games.push({
          id: `GS${String(id).padStart(3,'0')}`,
          phase: 'group',
          group,
          home: teams[i],
          away: teams[j],
          label: `Group ${group}`,
          labelEs: `Grupo ${group}`,
        });
        id++;
      }
    }
  }
  return games; // 72 games (12 groups × 6)
}

const KNOCKOUT_GAMES = [
  // Round of 32 (16 games)
  ...Array.from({length:16}, (_,i) => ({
    id: `R32_${String(i+1).padStart(2,'0')}`,
    phase: 'r32',
    home: `R32 Home ${i+1}`,
    away: `R32 Away ${i+1}`,
    label: `Round of 32 · Match ${i+1}`,
    labelEs: `Ronda de 32 · Partido ${i+1}`,
  })),
  // Round of 16 (8 games)
  ...Array.from({length:8}, (_,i) => ({
    id: `R16_${String(i+1).padStart(2,'0')}`,
    phase: 'r16',
    home: `R16 Home ${i+1}`,
    away: `R16 Away ${i+1}`,
    label: `Round of 16 · Match ${i+1}`,
    labelEs: `Octavos de Final · Partido ${i+1}`,
  })),
  // Quarter Finals (4 games)
  ...Array.from({length:4}, (_,i) => ({
    id: `QF_${i+1}`,
    phase: 'qf',
    home: `QF Home ${i+1}`,
    away: `QF Away ${i+1}`,
    label: `Quarter Final ${i+1}`,
    labelEs: `Cuarto de Final ${i+1}`,
  })),
  // Semi Finals (2 games)
  { id:'SF_1', phase:'sf', home:'SF Home 1', away:'SF Away 1', label:'Semi Final 1', labelEs:'Semifinal 1' },
  { id:'SF_2', phase:'sf', home:'SF Home 2', away:'SF Away 2', label:'Semi Final 2', labelEs:'Semifinal 2' },
  // Third Place
  { id:'3RD',  phase:'3rd', home:'3rd Home', away:'3rd Away', label:'Third Place',  labelEs:'Tercer Lugar' },
  // Final
  { id:'FINAL', phase:'final', home:'Final Home', away:'Final Away', label:'The Final 🏆', labelEs:'La Gran Final 🏆' },
];

const ALL_GAMES = [...buildGroupGames(), ...KNOCKOUT_GAMES];

// ─── GROUP-STAGE KICKOFFS (UTC) + home/away orientation vs data source ──────
// Mapped from openfootball/worldcup.json by group+teams. 'flip' = our home is
// the data source's away team (used later by the autonomous score sync).
const GROUP_FIXTURES = {
  'GS001': { kickoff: '2026-06-11T19:00:00+00:00', flip: false },
  'GS002': { kickoff: '2026-06-19T01:00:00+00:00', flip: false },
  'GS003': { kickoff: '2026-06-25T01:00:00+00:00', flip: true },
  'GS004': { kickoff: '2026-06-25T01:00:00+00:00', flip: false },
  'GS005': { kickoff: '2026-06-18T16:00:00+00:00', flip: true },
  'GS006': { kickoff: '2026-06-12T02:00:00+00:00', flip: false },
  'GS007': { kickoff: '2026-06-12T19:00:00+00:00', flip: false },
  'GS008': { kickoff: '2026-06-18T22:00:00+00:00', flip: false },
  'GS009': { kickoff: '2026-06-24T19:00:00+00:00', flip: true },
  'GS010': { kickoff: '2026-06-24T19:00:00+00:00', flip: false },
  'GS011': { kickoff: '2026-06-18T19:00:00+00:00', flip: true },
  'GS012': { kickoff: '2026-06-13T19:00:00+00:00', flip: false },
  'GS013': { kickoff: '2026-06-13T22:00:00+00:00', flip: false },
  'GS014': { kickoff: '2026-06-24T22:00:00+00:00', flip: true },
  'GS015': { kickoff: '2026-06-20T00:30:00+00:00', flip: false },
  'GS016': { kickoff: '2026-06-19T22:00:00+00:00', flip: true },
  'GS017': { kickoff: '2026-06-24T22:00:00+00:00', flip: false },
  'GS018': { kickoff: '2026-06-14T01:00:00+00:00', flip: true },
  'GS019': { kickoff: '2026-06-13T01:00:00+00:00', flip: false },
  'GS020': { kickoff: '2026-06-19T19:00:00+00:00', flip: false },
  'GS021': { kickoff: '2026-06-26T02:00:00+00:00', flip: true },
  'GS022': { kickoff: '2026-06-26T02:00:00+00:00', flip: false },
  'GS023': { kickoff: '2026-06-20T03:00:00+00:00', flip: true },
  'GS024': { kickoff: '2026-06-14T04:00:00+00:00', flip: false },
  'GS025': { kickoff: '2026-06-14T17:00:00+00:00', flip: false },
  'GS026': { kickoff: '2026-06-20T20:00:00+00:00', flip: false },
  'GS027': { kickoff: '2026-06-25T20:00:00+00:00', flip: true },
  'GS028': { kickoff: '2026-06-25T20:00:00+00:00', flip: false },
  'GS029': { kickoff: '2026-06-21T00:00:00+00:00', flip: true },
  'GS030': { kickoff: '2026-06-14T23:00:00+00:00', flip: false },
  'GS031': { kickoff: '2026-06-14T20:00:00+00:00', flip: false },
  'GS032': { kickoff: '2026-06-25T23:00:00+00:00', flip: true },
  'GS033': { kickoff: '2026-06-20T17:00:00+00:00', flip: false },
  'GS034': { kickoff: '2026-06-21T04:00:00+00:00', flip: true },
  'GS035': { kickoff: '2026-06-25T23:00:00+00:00', flip: false },
  'GS036': { kickoff: '2026-06-15T02:00:00+00:00', flip: true },
  'GS037': { kickoff: '2026-06-15T19:00:00+00:00', flip: false },
  'GS038': { kickoff: '2026-06-21T19:00:00+00:00', flip: false },
  'GS039': { kickoff: '2026-06-27T03:00:00+00:00', flip: true },
  'GS040': { kickoff: '2026-06-27T03:00:00+00:00', flip: false },
  'GS041': { kickoff: '2026-06-22T01:00:00+00:00', flip: true },
  'GS042': { kickoff: '2026-06-16T01:00:00+00:00', flip: false },
  'GS043': { kickoff: '2026-06-27T00:00:00+00:00', flip: true },
  'GS044': { kickoff: '2026-06-21T16:00:00+00:00', flip: false },
  'GS045': { kickoff: '2026-06-15T16:00:00+00:00', flip: false },
  'GS046': { kickoff: '2026-06-15T22:00:00+00:00', flip: true },
  'GS047': { kickoff: '2026-06-21T22:00:00+00:00', flip: false },
  'GS048': { kickoff: '2026-06-27T00:00:00+00:00', flip: true },
  'GS049': { kickoff: '2026-06-16T19:00:00+00:00', flip: false },
  'GS050': { kickoff: '2026-06-26T19:00:00+00:00', flip: true },
  'GS051': { kickoff: '2026-06-22T21:00:00+00:00', flip: false },
  'GS052': { kickoff: '2026-06-23T00:00:00+00:00', flip: true },
  'GS053': { kickoff: '2026-06-26T19:00:00+00:00', flip: false },
  'GS054': { kickoff: '2026-06-16T22:00:00+00:00', flip: true },
  'GS055': { kickoff: '2026-06-17T01:00:00+00:00', flip: false },
  'GS056': { kickoff: '2026-06-22T17:00:00+00:00', flip: false },
  'GS057': { kickoff: '2026-06-28T02:00:00+00:00', flip: true },
  'GS058': { kickoff: '2026-06-28T02:00:00+00:00', flip: false },
  'GS059': { kickoff: '2026-06-23T03:00:00+00:00', flip: true },
  'GS060': { kickoff: '2026-06-17T04:00:00+00:00', flip: false },
  'GS061': { kickoff: '2026-06-27T23:30:00+00:00', flip: true },
  'GS062': { kickoff: '2026-06-23T17:00:00+00:00', flip: false },
  'GS063': { kickoff: '2026-06-17T17:00:00+00:00', flip: false },
  'GS064': { kickoff: '2026-06-18T02:00:00+00:00', flip: true },
  'GS065': { kickoff: '2026-06-24T02:00:00+00:00', flip: false },
  'GS066': { kickoff: '2026-06-27T23:30:00+00:00', flip: true },
  'GS067': { kickoff: '2026-06-17T20:00:00+00:00', flip: false },
  'GS068': { kickoff: '2026-06-23T20:00:00+00:00', flip: false },
  'GS069': { kickoff: '2026-06-27T21:00:00+00:00', flip: true },
  'GS070': { kickoff: '2026-06-27T21:00:00+00:00', flip: false },
  'GS071': { kickoff: '2026-06-23T23:00:00+00:00', flip: true },
  'GS072': { kickoff: '2026-06-17T23:00:00+00:00', flip: false },
};
// Is this game locked (kickoff has passed)? Group games use GROUP_FIXTURES;
// games with no known kickoff (knockouts, until mapped) are never locked yet.
function gameKickoff(gameId) {
  const f = GROUP_FIXTURES[gameId];
  return f && f.kickoff ? Date.parse(f.kickoff) : null;
}
function isLocked(gameId) {
  const ko = gameKickoff(gameId);
  return ko != null && Date.now() >= ko;
}

// ─── AUTONOMOUS SCORE SYNC ──────────────────────────────────────────────────
// Source-agnostic: swap fetchFinishedResults() to change data providers later.
const SYNC_SOURCE_URL = process.env.SYNC_SOURCE_URL || 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

// data-source spelling -> app spelling
const SOURCE_TO_APP = {
  'South Korea': 'Korea Republic', 'Czech Republic': 'Czechia',
  'Bosnia & Herzegovina': 'Bosnia and Herzegovina', 'Turkey': 'Turkiye',
  'Curaçao': 'Curacao', 'Cape Verde': 'Cabo Verde',
};
const toApp = t => SOURCE_TO_APP[t] || t;

// reverse index: "GROUP|teamA~teamB" (app names, sorted) -> group game object
const GAME_INDEX = {};
for (const g of ALL_GAMES) {
  if (g.phase !== 'group') continue;
  GAME_INDEX[g.group + '|' + [g.home, g.away].sort().join('~')] = g;
}

let lastSync = { trigger: 'none', updated: 0, finishedSeen: 0, skippedManual: 0, unmatched: 0, at: null, error: null };

// Returns finished GROUP games from the source as {group, team1, team2, s1, s2}
async function fetchFinishedResults() {
  const res = await fetch(SYNC_SOURCE_URL);
  if (!res.ok) throw new Error('source fetch failed: HTTP ' + res.status);
  const data = await res.json();
  const out = [];
  for (const m of (data.matches || [])) {
    const grp = String(m.group || '');
    if (!grp.startsWith('Group')) continue;            // group stage only (for now)
    const ft = m.score && m.score.ft;                  // openfootball finished-match shape
    if (!Array.isArray(ft) || ft.length < 2) continue;
    if (typeof ft[0] !== 'number' || typeof ft[1] !== 'number') continue;
    out.push({ group: grp.split(' ').pop(), team1: m.team1, team2: m.team2, s1: ft[0], s2: ft[1] });
  }
  return out;
}

// Core sync: write finished scores into quiniela_results. Sync owns; manual overrides stick.
async function runSync(trigger = 'auto') {
  const summary = { trigger, updated: 0, finishedSeen: 0, skippedManual: 0, unmatched: 0, at: new Date().toISOString(), error: null };
  const updatedGames = []; // for notifications
  try {
    const fixtures = await fetchFinishedResults();
    summary.finishedSeen = fixtures.length;
    const doc = await db.quiniela_results.findOne({ _id: 'official' });
    const data = doc?.data ? { ...doc.data } : {};

    for (const f of fixtures) {
      const t1 = toApp(f.team1), t2 = toApp(f.team2);
      const game = GAME_INDEX[f.group + '|' + [t1, t2].sort().join('~')];
      if (!game) { summary.unmatched++; continue; }
      const home = (game.home === t1) ? f.s1 : f.s2;
      const away = (game.home === t1) ? f.s2 : f.s1;
      const prev = data[game.id];
      if (prev && prev.source === 'manual') { summary.skippedManual++; continue; }
      if (prev && +prev.homeGoals === home && +prev.awayGoals === away) continue;
      data[game.id] = { homeGoals: String(home), awayGoals: String(away), source: 'sync' };
      updatedGames.push({ gameId: game.id, home: game.home, away: game.away, homeGoals: home, awayGoals: away });
      summary.updated++;
    }

    if (summary.updated > 0) {
      if (doc) await db.quiniela_results.update({ _id: 'official' }, { $set: { data, updatedAt: new Date().toISOString(), updatedBy: 'sync' } });
      else await db.quiniela_results.insert({ _id: 'official', data, setAt: new Date().toISOString(), setBy: 'sync' });

      // Accumulate today's results and schedule the end-of-day digest
      todayResults.push(...updatedGames);
      scheduleDailyLeaderboard();
    }
  } catch (e) {
    summary.error = e.message;
  }
  lastSync = summary;
  console.log('🔄 sync:', JSON.stringify(summary));
  return summary;
}


// ─── SCORING ─────────────────────────────────────────────────────────────────
// Group stage: predict W/D/L → 3 pts correct, 0 wrong
// Knockout: predict exact score → 5 pts exact, 3 pts correct winner
function scoreGame(pick, result, phase) {
  if (!pick || !result) return 0;
  if (phase === 'group') {
    const pickOutcome = getOutcome(pick.homeGoals, pick.awayGoals);
    const realOutcome = getOutcome(result.homeGoals, result.awayGoals);
    return pickOutcome === realOutcome ? 3 : 0;
  } else {
    // Knockout: exact score = 5, correct winner = 3
    if (String(pick.homeGoals) === String(result.homeGoals) && String(pick.awayGoals) === String(result.awayGoals)) return 5;
    const pickOutcome = getOutcome(pick.homeGoals, pick.awayGoals);
    const realOutcome = getOutcome(result.homeGoals, result.awayGoals);
    return pickOutcome === realOutcome ? 3 : 0;
  }
}

function getOutcome(home, away) {
  const h = parseInt(home), a = parseInt(away);
  if (isNaN(h) || isNaN(a)) return null;
  return h > a ? 'H' : h < a ? 'A' : 'D';
}

// Award scoring: 3/2/1 for 1st/2nd/3rd place matches
function scoreAward(pick, result) {
  if (!pick || !result) return 0;
  let score = 0;
  const positions = ['first','second','third'];
  const pts = [3,2,1];
  for (let i=0; i<3; i++) {
    for (let j=0; j<3; j++) {
      const pv = pick[positions[i]]?.toLowerCase().trim();
      const rv = result[positions[j]]?.toLowerCase().trim();
      if (pv && rv && pv === rv) {
        score += pts[Math.min(Math.abs(i-j) === 0 ? i : Math.max(i,j), 2)];
        break;
      }
    }
  }
  return score;
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/join', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Name too short' });
    const clean = name.trim();
    let user = await db.users.findOne({ nameLower: clean.toLowerCase() });
    const isNew = !user;
    if (!user) {
      user = await db.users.insert({
        name: clean, nameLower: clean.toLowerCase(),
        avatar: getAvatar(clean), joinedAt: new Date().toISOString(),
      });
    }
    // Save email if provided and not already set
    if (email && email.includes('@') && !user.email) {
      await db.users.update({ _id: user._id }, { $set: { email: email.trim().toLowerCase() } });
      user.email = email.trim().toLowerCase();
    }
    const token = jwt.sign({ userId: user._id, userName: user.name }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, isNew, token, user: { id: user._id, name: user.name, avatar: user.avatar, hasEmail: !!user.email } });
  } catch(e) { console.error('Join error:', e); res.status(500).json({ error: e.message }); }
});

app.get('/api/me', async (req, res) => {
  if (!req.user) return res.json({ user: null });
  try {
    const u = await db.users.findOne({ _id: req.user.userId });
    if (!u) return res.json({ user: null });
    res.json({ user: { id: u._id, name: u.name, avatar: u.avatar, hasEmail: !!u.email } });
  } catch(e) { res.json({ user: null }); }
});

// Save or update email for the logged-in user
app.post('/api/user/email', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });
    await db.users.update({ _id: req.user.userId }, { $set: { email: email.trim().toLowerCase() } });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Remove email (unsubscribe)
app.delete('/api/user/email', requireAuth, async (req, res) => {
  try {
    await db.users.update({ _id: req.user.userId }, { $unset: { email: true } });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/logout', (req, res) => res.json({ success: true }));

// ─── SCHEDULE ─────────────────────────────────────────────────────────────────
app.get('/api/schedule', async (req, res) => {
  try {
    // Load any admin-saved knockout team names
    const saved = await db.knockout_teams.findOne({ _id: 'knockout' });
    const teamOverrides = saved?.teams || {};

    // Merge overrides into knockout games, and attach kickoff + lock state to all
    const games = ALL_GAMES.map(g => {
      const kickoff = GROUP_FIXTURES[g.id]?.kickoff || null;
      const locked = isLocked(g.id);
      if (g.phase === 'group') return { ...g, kickoff, locked };
      const override = teamOverrides[g.id];
      const base = override ? { ...g, home: override.home || g.home, away: override.away || g.away } : g;
      return { ...base, kickoff, locked };
    });

    res.json({ games, total: games.length, serverTime: new Date().toISOString() });
  } catch(e) {
    res.json({ games: ALL_GAMES, total: ALL_GAMES.length });
  }
});

app.get('/api/categories', (req, res) => res.json(AWARD_CATEGORIES));

// ─── AWARD PICKS ─────────────────────────────────────────────────────────────
app.get('/api/awards/picks/me', requireAuth, async (req, res) => {
  const p = await db.awards_picks.findOne({ userId: req.user.userId });
  res.json({ picks: p?.picks || null });
});

app.post('/api/awards/picks', requireAuth, async (req, res) => {
  try {
    const { picks } = req.body;
    if (!picks) return res.status(400).json({ error: 'No picks' });
    const locked = await db.awards_results.count({}) > 0;
    if (locked) return res.status(403).json({ error: 'Awards are locked!' });
    const existing = await db.awards_picks.findOne({ userId: req.user.userId });
    if (existing) {
      await db.awards_picks.update({ userId: req.user.userId }, { $set: { picks, updatedAt: new Date().toISOString() } });
    } else {
      await db.awards_picks.insert({ userId: req.user.userId, userName: req.user.userName, picks, submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── QUINIELA PICKS ──────────────────────────────────────────────────────────
app.get('/api/quiniela/picks/me', requireAuth, async (req, res) => {
  const p = await db.quiniela_picks.findOne({ userId: req.user.userId });
  res.json({ picks: p?.picks || {} });
});

app.post('/api/quiniela/picks', requireAuth, async (req, res) => {
  try {
    const { picks } = req.body; // { gameId: { homeGoals, awayGoals } }
    if (!picks || typeof picks !== 'object') return res.status(400).json({ error: 'No picks' });

    const existing = await db.quiniela_picks.findOne({ userId: req.user.userId });
    const current = existing?.picks ? { ...existing.picks } : {};   // start from stored picks

    const rejected = [];   // games the user tried to change after kickoff
    let applied = 0;
    for (const [gameId, pick] of Object.entries(picks)) {
      if (isLocked(gameId)) {
        // Full stop: a started game is frozen. Only flag if they actually tried to change it.
        const prev = current[gameId];
        const changed = !prev
          || String(prev.homeGoals) !== String(pick.homeGoals)
          || String(prev.awayGoals) !== String(pick.awayGoals);
        if (changed) rejected.push(gameId);
        continue; // never modify a locked game's stored value
      }
      current[gameId] = pick;   // merge: only touch submitted, still-open games
      applied++;
    }

    if (existing) {
      await db.quiniela_picks.update({ userId: req.user.userId }, { $set: { picks: current, updatedAt: new Date().toISOString() } });
    } else {
      await db.quiniela_picks.insert({ userId: req.user.userId, userName: req.user.userName, picks: current, submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    res.json({ success: true, applied, rejected });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── QUINIELA RESULTS (admin sets them) ──────────────────────────────────────
app.get('/api/quiniela/results', async (req, res) => {
  const r = await db.quiniela_results.findOne({ _id: 'official' });
  res.json({ results: r?.data || {} });
});

app.post('/api/quiniela/results', requireAdmin, async (req, res) => {
  try {
    const { results } = req.body;
    if (!results || typeof results !== 'object') return res.status(400).json({ error: 'No results' });
    const existing = await db.quiniela_results.findOne({ _id: 'official' });
    const data = existing?.data ? { ...existing.data } : {};
    let set = 0;
    for (const [gameId, r] of Object.entries(results)) {
      if (!r) continue;
      const h = String(r.homeGoals ?? '').trim();
      const a = String(r.awayGoals ?? '').trim();
      if (h === '' || a === '') continue;                 // ignore blanks: never wipe a synced score
      data[gameId] = { homeGoals: h, awayGoals: a, source: 'manual' };  // manual override the sync won't touch
      set++;
    }
    const who = req.user?.userName || 'admin';
    if (existing) {
      await db.quiniela_results.update({ _id: 'official' }, { $set: { data, updatedBy: who, updatedAt: new Date().toISOString() } });
    } else {
      await db.quiniela_results.insert({ _id: 'official', data, setBy: who, setAt: new Date().toISOString() });
    }
    res.json({ success: true, set });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── AWARD RESULTS ───────────────────────────────────────────────────────────
app.get('/api/awards/results', async (req, res) => {
  const r = await db.awards_results.findOne({ _id: 'official' });
  res.json({ results: r?.data || null, resultsSet: !!r });
});

app.post('/api/awards/results', requireAdmin, async (req, res) => {
  try {
    const { results } = req.body;
    const existing = await db.awards_results.findOne({ _id: 'official' });
    const who = req.user?.userName || 'admin';
    if (existing) {
      await db.awards_results.update({ _id: 'official' }, { $set: { data: results, updatedBy: who, updatedAt: new Date().toISOString() } });
    } else {
      await db.awards_results.insert({ _id: 'official', data: results, setBy: who, setAt: new Date().toISOString() });
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── TRANSPARENCY: reveal picks once a game locks ────────────────────────────
// Before kickoff: shows only who has submitted (not the scores).
// After kickoff: full picks visible to everyone. Includes official result for color-coding.
app.get('/api/picks/transparency', requireAuth, async (req, res) => {
  try {
    const users = await db.users.find({});
    const allPicks = await db.quiniela_picks.find({});
    const qResults = await db.quiniela_results.findOne({ _id: 'official' });
    const results = qResults?.data || {};
    const picksMap = {};
    allPicks.forEach(p => { picksMap[p.userId] = p.picks || {}; });
    const isFilled = p => p && String(p.homeGoals).trim() !== '' && String(p.awayGoals).trim() !== '';
    const players = users.map(u => ({ id: u._id, name: u.name, avatar: u.avatar }));

    const games = ALL_GAMES.map(g => {
      const kickoff = GROUP_FIXTURES[g.id]?.kickoff || null;
      const locked  = isLocked(g.id);
      const r       = results[g.id];
      const result  = r ? { homeGoals: r.homeGoals, awayGoals: r.awayGoals } : null;
      const base    = { id: g.id, home: g.home, away: g.away, group: g.group, phase: g.phase, kickoff, locked, result };

      if (locked) {
        const playerPicks = {};
        players.forEach(p => {
          const pick = picksMap[p.id]?.[g.id];
          playerPicks[p.id] = isFilled(pick) ? { homeGoals: pick.homeGoals, awayGoals: pick.awayGoals } : null;
        });
        return { ...base, playerPicks };
      } else {
        // not started: only reveal who has a pick for this specific game (not the scores)
        const submitted = players
          .filter(p => isFilled(picksMap[p.id]?.[g.id]))
          .map(p => p.id);
        return { ...base, submitted };
      }
    });

    res.json({ players, games });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── RACE CHART ──────────────────────────────────────────────────────────────
// Daily cumulative quiniela scores per player, grouped by calendar day (UTC).
// Frontend computes ranks and renders the bump chart.
app.get('/api/leaderboard/race', async (req, res) => {
  try {
    const users          = await db.users.find({});
    const allPicks       = await db.quiniela_picks.find({});
    const qResultsDoc    = await db.quiniela_results.findOne({ _id: 'official' });
    const results        = qResultsDoc?.data || {};

    const picksMap = {};
    allPicks.forEach(p => { picksMap[p.userId] = p.picks || {}; });

    // Sort players by join date so color assignment is stable
    users.sort((a,b) => (a.joinedAt||'').localeCompare(b.joinedAt||''));
    const players = users.map(u => ({ id: u._id, name: u.name, avatar: u.avatar }));

    // Collect scored games that have a known kickoff date (group stage)
    const gamePhaseMap = {};
    ALL_GAMES.forEach(g => { gamePhaseMap[g.id] = g.phase; });

    const scored = [];
    for (const [gameId, result] of Object.entries(results)) {
      const kof = GROUP_FIXTURES[gameId]?.kickoff;
      if (!kof) continue;
      const oh = parseInt(result.homeGoals), oa = parseInt(result.awayGoals);
      if (isNaN(oh) || isNaN(oa)) continue;
      scored.push({ gameId, day: kof.slice(0, 10), homeGoals: oh, awayGoals: oa,
                    phase: gamePhaseMap[gameId] || 'group' });
    }
    scored.sort((a,b) => a.day.localeCompare(b.day));

    if (!scored.length) {
      return res.json({ players, days: [], series: {}, message: 'preseason' });
    }

    // Unique days with at least one result
    const days = [...new Set(scored.map(g => g.day))].sort();

    // Cumulative scores day by day
    const cum = {};
    players.forEach(p => { cum[p.id] = 0; });
    const series = {};
    players.forEach(p => { series[p.id] = []; });

    for (const day of days) {
      for (const g of scored.filter(s => s.day === day)) {
        for (const player of players) {
          const pick = picksMap[player.id]?.[g.gameId];
          cum[player.id] += scoreGame(pick, g, g.phase);
        }
      }
      players.forEach(p => { series[p.id].push(cum[p.id]); });
    }

    // Human-readable day labels
    const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dayLabels = days.map(d => {
      const [,m,dy] = d.split('-');
      return months[+m] + ' ' + parseInt(dy);
    });

    res.json({ players, days: dayLabels, series,
               gamesPerDay: days.map(d => scored.filter(s => s.day === d).length) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await db.users.find({});
    const awardsPicksAll = await db.awards_picks.find({});
    const quinielaPicksAll = await db.quiniela_picks.find({});
    const awardsResults = await db.awards_results.findOne({ _id: 'official' });
    const quinielaResults = await db.quiniela_results.findOne({ _id: 'official' });
    const qResults = quinielaResults?.data || {};
    const aResults = awardsResults?.data || null;

    const awardsMap = {};
    awardsPicksAll.forEach(p => awardsMap[p.userId] = p);
    const quinielaMap = {};
    quinielaPicksAll.forEach(p => quinielaMap[p.userId] = p);

    const leaderboard = users.map(u => {
      let awardsScore = 0, quinielaScore = 0;
      let gamesCorrect = 0, gamesExact = 0, gamesPicked = 0;

      // Awards score
      const ap = awardsMap[u._id];
      if (ap && aResults) {
        for (const cat of AWARD_CATEGORIES) {
          awardsScore += scoreAward(ap.picks?.[cat.id], aResults[cat.id]);
        }
      }

      // Quiniela score
      const qp = quinielaMap[u._id];
      if (qp) {
        gamesPicked = Object.keys(qp.picks || {}).length;
        for (const game of ALL_GAMES) {
          const pick = qp.picks?.[game.id];
          const result = qResults[game.id];
          if (pick && result) {
            const pts = scoreGame(pick, result, game.phase);
            quinielaScore += pts;
            if (pts === 5) gamesExact++;
            if (pts >= 3) gamesCorrect++;
          }
        }
      }

      return {
        userId: u._id,
        name: u.name,
        avatar: u.avatar,
        joinedAt: u.joinedAt,
        awardsScore,
        quinielaScore,
        totalScore: awardsScore + quinielaScore,
        gamesCorrect,
        gamesExact,
        gamesPicked,
        hasAwardsPicks: !!ap,
        hasQuinielaPicks: !!qp,
      };
    }).sort((a,b) => b.totalScore - a.totalScore);

    leaderboard.forEach((e,i) => e.rank = i+1);

    res.json({
      leaderboard,
      awardsResultsSet: !!awardsResults,
      quinielaResultsSet: !!quinielaResults,
      totalGames: ALL_GAMES.length,
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── STATS ───────────────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  const totalUsers = await db.users.count({});
  const totalAwardsPicks = await db.awards_picks.count({});
  const totalQuinielaPicks = await db.quiniela_picks.count({});
  res.json({ totalUsers, totalAwardsPicks, totalQuinielaPicks });
});

// ─── ADMIN ───────────────────────────────────────────────────────────────────
app.get('/api/admin/players', requireAdmin, async (req, res) => {
  try {
    const users = await db.users.find({});
    const awardsAll = await db.awards_picks.find({});
    const quinielaAll = await db.quiniela_picks.find({});
    const awardsMap = {}; awardsAll.forEach(p => awardsMap[p.userId] = p);
    const quinielaMap = {}; quinielaAll.forEach(p => quinielaMap[p.userId] = p);

    const players = users.map(u => ({
      id: u._id, name: u.name, avatar: u.avatar, joinedAt: u.joinedAt,
      hasAwardsPicks: !!awardsMap[u._id],
      hasQuinielaPicks: !!quinielaMap[u._id],
      awardsPicks: awardsMap[u._id]?.picks || null,
      quinielaPicks: quinielaMap[u._id]?.picks || null,
      awardsSubmittedAt: awardsMap[u._id]?.submittedAt || null,
      quinielaSubmittedAt: quinielaMap[u._id]?.submittedAt || null,
    })).sort((a,b) => new Date(b.joinedAt) - new Date(a.joinedAt));

    const awardsResults = await db.awards_results.findOne({ _id: 'official' });
    const quinielaResults = await db.quiniela_results.findOne({ _id: 'official' });

    res.json({
      players,
      totalPlayers: players.length,
      totalWithAwards: players.filter(p=>p.hasAwardsPicks).length,
      totalWithQuiniela: players.filter(p=>p.hasQuinielaPicks).length,
      awardsResultsSet: !!awardsResults,
      quinielaResultsSet: !!quinielaResults,
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/players/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    await db.users.remove({ _id: userId }, {});
    await db.awards_picks.remove({ userId }, {});
    await db.quiniela_picks.remove({ userId }, {});
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/players/:userId/awards', requireAdmin, async (req, res) => {
  try { await db.awards_picks.remove({ userId: req.params.userId }, {}); res.json({ success: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/players/:userId/quiniela', requireAdmin, async (req, res) => {
  try { await db.quiniela_picks.remove({ userId: req.params.userId }, {}); res.json({ success: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/results/awards', requireAdmin, async (req, res) => {
  try { await db.awards_results.remove({ _id: 'official' }, {}); res.json({ success: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/results/quiniela', requireAdmin, async (req, res) => {
  try { await db.quiniela_results.remove({ _id: 'official' }, {}); res.json({ success: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});


// ─── KNOCKOUT TEAM NAMES (admin updates as rounds are drawn) ────────────────
app.get('/api/admin/knockout-teams', async (req, res) => {
  try {
    const saved = await db.knockout_teams.findOne({ _id: 'knockout' });
    res.json({ teams: saved?.teams || {} });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/sync', requireAdmin, async (req, res) => {
  const summary = await runSync('manual');
  res.json({ success: !summary.error, ...summary });
});
app.get('/api/admin/sync/status', requireAdmin, async (req, res) => res.json(lastSync));

app.post('/api/admin/knockout-teams', requireAdmin, async (req, res) => {
  try {
    const { teams } = req.body; // { gameId: { home, away } }
    if (!teams) return res.status(400).json({ error: 'No teams data' });
    const existing = await db.knockout_teams.findOne({ _id: 'knockout' });
    const who = req.user?.userName || 'admin';
    if (existing) {
      await db.knockout_teams.update({ _id: 'knockout' }, { $set: { teams, updatedBy: who, updatedAt: new Date().toISOString() } });
    } else {
      await db.knockout_teams.insert({ _id: 'knockout', teams, setBy: who, setAt: new Date().toISOString() });
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getAvatar(name) {
  const avatars = ['⚽','🏆','🥅','🎯','👟','🌟','🔥','💫','⭐','🦁','🐯','🦊','🐺','🦅','🐉','🎪','🎭','🎨'];
  let hash = 0;
  for (let i=0; i<name.length; i++) hash = name.charCodeAt(i) + ((hash<<5)-hash);
  return avatars[Math.abs(hash) % avatars.length];
}

// ─── NOTIFICATION ENGINE ─────────────────────────────────────────────────────
// Two triggers only:
//   1. End-of-day digest  — one email per day, 30 min after last result.
//                           Includes today's scores + standings + leader change.
//   2. Lock-soon reminder — per-player, per-game, 1–2.5 hrs before kickoff.
//
// Requires: GMAIL_USER, GMAIL_PASS, APP_URL

let _mailer = null;
function getMailer() {
  if (!_mailer) _mailer = nodemailer.createTransport({
    service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });
  return _mailer;
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return;
  try {
    const toArr = Array.isArray(to) ? to : [to];
    const opts = { from: `Copa 26 <${process.env.GMAIL_USER}>`, subject, html };
    if (toArr.length === 1) { opts.to = toArr[0]; }
    else { opts.to = process.env.GMAIL_USER; opts.bcc = toArr.join(', '); }
    await getMailer().sendMail(opts);
  } catch(e) { console.error('📧 email error:', e.message); }
}

async function getEmailRecipients() {
  const users = await db.users.find({});
  return users.filter(u => u.email?.includes('@'));
}

async function notifSent(type, key) {
  return !!(await db.notifications.findOne({ ntype: type, nkey: key }));
}
async function notifMark(type, key) {
  await db.notifications.insert({ ntype: type, nkey: key, at: new Date().toISOString() });
}

async function quickLeaderboard() {
  const [users, allPicks, qDoc] = await Promise.all([
    db.users.find({}), db.quiniela_picks.find({}),
    db.quiniela_results.findOne({ _id: 'official' })
  ]);
  const results = qDoc?.data || {};
  const picksMap = {}; allPicks.forEach(p => { picksMap[p.userId] = p.picks || {}; });
  const gamePhase = {}; ALL_GAMES.forEach(g => { gamePhase[g.id] = g.phase; });
  return users.map(u => {
    let pts = 0;
    for (const [gid, res] of Object.entries(results))
      pts += scoreGame(picksMap[u._id]?.[gid], res, gamePhase[gid] || 'group');
    return { id: u._id, name: u.name, avatar: u.avatar, pts, picks: picksMap[u._id] || {} };
  }).sort((a,b) => b.pts - a.pts);
}

function emailWrap(content) {
  const url = process.env.APP_URL || '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;padding:0;background:#050e07;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#eafff0}
.w{max-width:480px;margin:0 auto;padding:28px 16px}
.hd{text-align:center;margin-bottom:20px}
.ht{font-size:26px;font-weight:900;letter-spacing:4px;color:#fff}.ht span{color:#00C853}
.hs{font-size:10px;letter-spacing:3px;color:#3d6b3d;margin-top:3px}
.card{background:#0e2018;border:1px solid #1d3a2b;border-radius:14px;padding:20px 22px}
h2{margin:14px 0 10px;font-size:17px;color:#fff;font-weight:700}h2:first-child{margin-top:0}
.gr{background:#0b1c10;border-radius:10px;padding:10px 14px;margin-bottom:7px;display:flex;align-items:center;justify-content:space-between}
.tm{font-size:13px;color:#eafff0;font-weight:600;flex:1}.tm.r{text-align:right}
.sc{font-size:18px;font-weight:900;color:#C9A84C;min-width:52px;text-align:center}
.lbr{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1d3a2b}.lbr:last-child{border-bottom:none}
.rk{font-size:18px;font-weight:900;color:#C9A84C;width:24px}.nm{flex:1;font-size:14px;color:#eafff0}
.pt{font-size:13px;font-weight:700;color:#00C853;text-align:right}
.banner{background:#1a3020;border:1px solid #2a5030;border-radius:10px;padding:10px 14px;margin:10px 0;font-size:14px}
.cta{display:block;text-align:center;margin:18px 0 0;background:#00C853;color:#000;text-decoration:none;padding:13px 24px;border-radius:10px;font-weight:700;font-size:15px}
.ft{font-size:11px;color:#3d6b3d;text-align:center;margin-top:14px;line-height:1.6}
p{margin:10px 0 0;font-size:13px;color:#7fa389;line-height:1.5}
</style></head>
<body><div class="w">
<div class="hd"><div class="ht">COPA <span>26</span></div><div class="hs">WORLD CUP 2026 · PREDICTION POOL</div></div>
<div class="card">${content}</div>
${url ? `<a href="${url}" class="cta">Open Copa 26 →</a>` : ''}
<div class="ft">Copa 26 · you're on this list because you added your email.</div>
</div></body></html>`;
}

// ── TRIGGER 1: End-of-day digest ──────────────────────────────────────────────

let todayResults = [];   // accumulates updated games across syncs during the day
let lastLeaderId = null;
let dailyTimer   = null;

function scheduleDailyLeaderboard() {
  if (dailyTimer) clearTimeout(dailyTimer);
  dailyTimer = setTimeout(async () => {
    dailyTimer = null;
    const games = [...todayResults];
    todayResults = [];
    await sendDailyDigest(games).catch(e => console.error('digest error:', e.message));
  }, 30 * 60 * 1000);
}

async function sendDailyDigest(todayGames) {
  const recipients = await getEmailRecipients();
  if (!recipients.length) return;
  const lb = await quickLeaderboard();
  const gamePhase = {}; ALL_GAMES.forEach(g => { gamePhase[g.id] = g.phase; });

  // Today's points per player
  const todayPts = {};
  lb.forEach(p => { todayPts[p.id] = 0; });
  for (const g of todayGames)
    for (const p of lb)
      todayPts[p.id] += scoreGame(p.picks?.[g.gameId], g, gamePhase[g.gameId] || 'group');

  // Leader change?
  const leader = lb[0];
  const changed = lastLeaderId && leader?.id && lastLeaderId !== leader.id && leader.pts > 0;
  lastLeaderId = leader?.id || null;

  const day = new Date().toLocaleDateString('en-US', { month:'short', day:'numeric' });

  const resultsHtml = todayGames.length
    ? `<h2>⚽ Results · ${day}</h2>` +
      todayGames.map(g =>
        `<div class="gr"><div class="tm">${g.home}</div><div class="sc">${g.homeGoals}–${g.awayGoals}</div><div class="tm r">${g.away}</div></div>`
      ).join('') : '';

  const overtakeHtml = changed && leader
    ? `<div class="banner">🏆 <strong style="color:#C9A84C">${leader.name}</strong> has taken the lead!</div>` : '';

  const standingsHtml = `<h2>📊 Standings · ${day}</h2>` +
    lb.map((p,i) => {
      const gained = todayPts[p.id] || 0;
      return `<div class="lbr"><div class="rk">${i+1}</div><div class="nm">${p.avatar} ${p.name}</div>` +
        `<div class="pt">${p.pts} pts${gained>0?` <span style="color:#C9A84C">(+${gained})</span>`:''}</div></div>`;
    }).join('');

  const subject = todayGames.length
    ? `Copa 26 · ${day} — ${todayGames.length} result${todayGames.length>1?'s':''} + standings`
    : `Copa 26 standings · ${day}`;

  await sendEmail({ to: recipients.map(u => u.email), subject, html: emailWrap(resultsHtml + overtakeHtml + standingsHtml) });
  console.log(`📧 daily digest → ${recipients.length} recipients (${todayGames.length} results)`);
}

// ── TRIGGER 2: Lock-soon reminder ─────────────────────────────────────────────

async function notifyLockSoon() {
  const recipients = await getEmailRecipients();
  if (!recipients.length) return;
  const now = Date.now();
  const upcoming = Object.entries(GROUP_FIXTURES)
    .map(([gid, f]) => ({ gid, ko: Date.parse(f.kickoff), kickoff: f.kickoff,
                          ...ALL_GAMES.find(g => g.id === gid) || {} }))
    .filter(f => { const d = f.ko - now; return d >= 60*60*1000 && d <= 2.5*60*60*1000; });
  if (!upcoming.length) return;
  const allPicks = await db.quiniela_picks.find({});
  const picksMap = {}; allPicks.forEach(p => { picksMap[p.userId] = p.picks || {}; });
  const isFilled = p => p && String(p.homeGoals).trim() !== '' && String(p.awayGoals).trim() !== '';
  for (const game of upcoming) {
    for (const u of recipients) {
      const key = `lock_${game.gid}_${u._id}`;
      if (await notifSent('lock', key)) continue;
      await notifMark('lock', key);
      if (isFilled(picksMap[u._id]?.[game.gid])) continue;
      const ko = new Date(game.kickoff);
      const timeStr = ko.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', timeZoneName:'short' });
      const dateStr = ko.toLocaleDateString('en-US', { month:'short', day:'numeric' });
      await sendEmail({
        to: u.email,
        subject: `🔒 ${game.home} vs ${game.away} locks soon — Copa 26`,
        html: emailWrap(`<h2>🔒 Pick before it locks!</h2>
          <div class="gr"><div class="tm">${game.home}</div><div class="sc" style="font-size:13px;color:#7fa389">vs</div><div class="tm r">${game.away}</div></div>
          <p>Kicks off ${dateStr} at ${timeStr}.<br>You haven't made your pick yet — don't miss it!</p>`)
      });
      console.log(`📧 lock reminder → ${u.name} for ${game.gid}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

if (!process.env.ADMIN_SECRET)
 console.warn('⚠️  ADMIN_SECRET not set — admin endpoints are disabled until you set it.');
if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) console.warn('⚠️  GMAIL_USER / GMAIL_PASS not set — email notifications disabled.');

// Autonomous score sync: catch-up shortly after boot, then every 30 minutes.
setTimeout(() => runSync('startup').catch(e => console.error('sync error', e.message)), 8000);
setInterval(() => runSync('interval').catch(e => console.error('sync error', e.message)), 30 * 60 * 1000);

// Lock-soon reminders: check every 15 minutes for games kicking off in 1–2.5 hours.
setInterval(() => notifyLockSoon().catch(e => console.error('lock reminder error', e.message)), 15 * 60 * 1000);

app.listen(PORT, () => console.log(`⚽ Copa 26 v2 on port ${PORT}`));
