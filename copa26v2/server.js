const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const Datastore = require('nedb-promises');

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
  users:        Datastore.create({ filename: path.join(DATA_DIR, 'users.db'),        autoload: true }),
  awards_picks: Datastore.create({ filename: path.join(DATA_DIR, 'awards_picks.db'), autoload: true }),
  awards_results: Datastore.create({ filename: path.join(DATA_DIR, 'awards_results.db'), autoload: true }),
  quiniela_picks: Datastore.create({ filename: path.join(DATA_DIR, 'quiniela_picks.db'), autoload: true }),
  quiniela_results: Datastore.create({ filename: path.join(DATA_DIR, 'quiniela_results.db'), autoload: true }),
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
  C: ['Brazil', 'Morocco', 'Scotland', 'DR Congo'],
  D: ['USA', 'Paraguay', 'Australia', 'Turkiye'],
  E: ['Germany', 'Curacao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Tunisia', 'Iraq'],
  G: ['Belgium', 'Egypt', 'Iran', 'Haiti'],
  H: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cabo Verde'],
  I: ['France', 'Senegal', 'Norway', 'New Zealand'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'Colombia', 'Uzbekistan', 'Panama'],
  L: ['England', 'Croatia', 'Ghana', 'Sweden'],
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
    const { name } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Name too short' });
    const clean = name.trim();
    let user = await db.users.findOne({ nameLower: clean.toLowerCase() });
    const isNew = !user;
    if (!user) {
      user = await db.users.insert({
        name: clean,
        nameLower: clean.toLowerCase(),
        avatar: getAvatar(clean),
        joinedAt: new Date().toISOString(),
      });
    }
    const token = jwt.sign({ userId: user._id, userName: user.name }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, isNew, token, user: { id: user._id, name: user.name, avatar: user.avatar } });
  } catch(e) {
    console.error('Join error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/me', async (req, res) => {
  if (!req.user) return res.json({ user: null });
  try {
    const u = await db.users.findOne({ _id: req.user.userId });
    if (!u) return res.json({ user: null });
    res.json({ user: { id: u._id, name: u.name, avatar: u.avatar } });
  } catch(e) { res.json({ user: null }); }
});

app.post('/api/logout', (req, res) => res.json({ success: true }));

// ─── SCHEDULE ─────────────────────────────────────────────────────────────────
app.get('/api/schedule', (req, res) => {
  res.json({ games: ALL_GAMES, total: ALL_GAMES.length });
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
    if (!picks) return res.status(400).json({ error: 'No picks' });
    const existing = await db.quiniela_picks.findOne({ userId: req.user.userId });
    if (existing) {
      await db.quiniela_picks.update({ userId: req.user.userId }, { $set: { picks, updatedAt: new Date().toISOString() } });
    } else {
      await db.quiniela_picks.insert({ userId: req.user.userId, userName: req.user.userName, picks, submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── QUINIELA RESULTS (admin sets them) ──────────────────────────────────────
app.get('/api/quiniela/results', async (req, res) => {
  const r = await db.quiniela_results.findOne({ _id: 'official' });
  res.json({ results: r?.data || {} });
});

app.post('/api/quiniela/results', requireAuth, async (req, res) => {
  try {
    const { results } = req.body;
    const existing = await db.quiniela_results.findOne({ _id: 'official' });
    if (existing) {
      await db.quiniela_results.update({ _id: 'official' }, { $set: { data: results, updatedBy: req.user.userName, updatedAt: new Date().toISOString() } });
    } else {
      await db.quiniela_results.insert({ _id: 'official', data: results, setBy: req.user.userName, setAt: new Date().toISOString() });
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── AWARD RESULTS ───────────────────────────────────────────────────────────
app.get('/api/awards/results', async (req, res) => {
  const r = await db.awards_results.findOne({ _id: 'official' });
  res.json({ results: r?.data || null, resultsSet: !!r });
});

app.post('/api/awards/results', requireAuth, async (req, res) => {
  try {
    const { results } = req.body;
    const existing = await db.awards_results.findOne({ _id: 'official' });
    if (existing) {
      await db.awards_results.update({ _id: 'official' }, { $set: { data: results, updatedBy: req.user.userName, updatedAt: new Date().toISOString() } });
    } else {
      await db.awards_results.insert({ _id: 'official', data: results, setBy: req.user.userName, setAt: new Date().toISOString() });
    }
    res.json({ success: true });
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
app.get('/api/admin/players', async (req, res) => {
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

app.delete('/api/admin/players/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await db.users.remove({ _id: userId }, {});
    await db.awards_picks.remove({ userId }, {});
    await db.quiniela_picks.remove({ userId }, {});
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/players/:userId/awards', async (req, res) => {
  try { await db.awards_picks.remove({ userId: req.params.userId }, {}); res.json({ success: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/players/:userId/quiniela', async (req, res) => {
  try { await db.quiniela_picks.remove({ userId: req.params.userId }, {}); res.json({ success: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/results/awards', async (req, res) => {
  try { await db.awards_results.remove({ _id: 'official' }, {}); res.json({ success: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/results/quiniela', async (req, res) => {
  try { await db.quiniela_results.remove({ _id: 'official' }, {}); res.json({ success: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getAvatar(name) {
  const avatars = ['⚽','🏆','🥅','🎯','👟','🌟','🔥','💫','⭐','🦁','🐯','🦊','🐺','🦅','🐉','🎪','🎭','🎨'];
  let hash = 0;
  for (let i=0; i<name.length; i++) hash = name.charCodeAt(i) + ((hash<<5)-hash);
  return avatars[Math.abs(hash) % avatars.length];
}

app.listen(PORT, () => console.log(`⚽ Copa 26 v2 on port ${PORT}`));
