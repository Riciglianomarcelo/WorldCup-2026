const express = require('express');
const session = require('express-session');
const path = require('path');
const Datastore = require('nedb-promises');

const app = express();
const PORT = process.env.PORT || 3000;

// --- DB Setup ---
const db = {
  users: Datastore.create({ filename: './data/users.db', autoload: true }),
  picks: Datastore.create({ filename: './data/picks.db', autoload: true }),
  results: Datastore.create({ filename: './data/results.db', autoload: true }),
};

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'copa26-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// --- Categories Config ---
const CATEGORIES = [
  { id: 'golden_boot', label: 'Golden Boot', emoji: '👟', description: 'Top goal scorer of the tournament' },
  { id: 'golden_ball', label: 'Golden Ball', emoji: '⭐', description: 'Best player of the tournament' },
  { id: 'golden_glove', label: 'Golden Glove', emoji: '🧤', description: 'Best goalkeeper' },
  { id: 'best_young', label: 'Best Young Player', emoji: '🌟', description: 'Best player under 21' },
  { id: 'most_assists', label: 'Most Assists', emoji: '🎯', description: 'Most assists in the tournament' },
  { id: 'champion', label: 'World Cup Champion', emoji: '🏆', description: 'The team that wins it all' },
  { id: 'dark_horse', label: 'Dark Horse Team', emoji: '🐴', description: 'Surprise team of the tournament' },
  { id: 'top_scorer_team', label: 'Most Goals (Team)', emoji: '🔥', description: 'Team that scores the most goals' },
];

const SCORING = { first: 3, second: 2, third: 1 };

// --- Auth Middleware ---
function requireAuth(req, res, next) {
  if (req.session.userId) return next();
  res.status(401).json({ error: 'Not logged in' });
}

// --- Routes ---

// Get categories
app.get('/api/categories', (req, res) => {
  res.json(CATEGORIES);
});

// Register / Login (just a name — no password for friends)
app.post('/api/join', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });

  const clean = name.trim();
  let user = await db.users.findOne({ nameLower: clean.toLowerCase() });

  if (!user) {
    user = await db.users.insert({
      name: clean,
      nameLower: clean.toLowerCase(),
      joinedAt: new Date().toISOString(),
      avatar: getAvatar(clean),
    });
  }

  req.session.userId = user._id;
  req.session.userName = user.name;
  res.json({ success: true, user: { id: user._id, name: user.name, avatar: user.avatar } });
});

// Get current session user
app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  res.json({ user: { id: req.session.userId, name: req.session.userName } });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Save picks
app.post('/api/picks', requireAuth, async (req, res) => {
  const { picks } = req.body; // { categoryId: { first, second, third } }
  if (!picks) return res.status(400).json({ error: 'No picks provided' });

  // Validate all categories are covered
  for (const cat of CATEGORIES) {
    if (!picks[cat.id] || !picks[cat.id].first) {
      return res.status(400).json({ error: `Missing first place pick for ${cat.label}` });
    }
  }

  const existing = await db.picks.findOne({ userId: req.session.userId });

  // Check if results are already set — lock picks
  const resultsCount = await db.results.count({});
  if (resultsCount > 0 && existing) {
    return res.status(403).json({ error: 'Results have been set — picks are now locked!' });
  }

  if (existing) {
    await db.picks.update({ userId: req.session.userId }, { $set: { picks, updatedAt: new Date().toISOString() } });
  } else {
    await db.picks.insert({
      userId: req.session.userId,
      userName: req.session.userName,
      picks,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  res.json({ success: true });
});

// Get my picks
app.get('/api/picks/me', requireAuth, async (req, res) => {
  const myPicks = await db.picks.findOne({ userId: req.session.userId });
  res.json({ picks: myPicks ? myPicks.picks : null });
});

// Get all picks (for leaderboard / view all)
app.get('/api/picks/all', async (req, res) => {
  const allPicks = await db.picks.find({});
  const results = await db.results.findOne({ _id: 'official' });
  const users = await db.users.find({});

  const userMap = {};
  users.forEach(u => userMap[u._id] = u);

  const leaderboard = allPicks.map(p => {
    let score = 0;
    const breakdown = {};

    if (results && results.data) {
      for (const cat of CATEGORIES) {
        const catResult = results.data[cat.id];
        const catPick = p.picks[cat.id];
        breakdown[cat.id] = { score: 0, pick: catPick, result: catResult };

        if (!catResult || !catPick) continue;

        if (catPick.first && catPick.first.toLowerCase() === catResult.first?.toLowerCase()) {
          score += SCORING.first;
          breakdown[cat.id].score += SCORING.first;
          breakdown[cat.id].hit = 'first';
        } else if (catPick.first && catPick.first.toLowerCase() === catResult.second?.toLowerCase()) {
          score += SCORING.second;
          breakdown[cat.id].score += SCORING.second;
        } else if (catPick.first && catPick.first.toLowerCase() === catResult.third?.toLowerCase()) {
          score += SCORING.third;
          breakdown[cat.id].score += SCORING.third;
        }

        if (catPick.second && catPick.second.toLowerCase() === catResult.first?.toLowerCase()) {
          score += SCORING.second;
          breakdown[cat.id].score += SCORING.second;
        } else if (catPick.second && catPick.second.toLowerCase() === catResult.second?.toLowerCase()) {
          score += SCORING.first;
          breakdown[cat.id].score += SCORING.first;
        } else if (catPick.second && catPick.second.toLowerCase() === catResult.third?.toLowerCase()) {
          score += SCORING.third;
          breakdown[cat.id].score += SCORING.third;
        }

        if (catPick.third && catPick.third.toLowerCase() === catResult.first?.toLowerCase()) {
          score += SCORING.third;
          breakdown[cat.id].score += SCORING.third;
        } else if (catPick.third && catPick.third.toLowerCase() === catResult.second?.toLowerCase()) {
          score += SCORING.third;
          breakdown[cat.id].score += SCORING.third;
        } else if (catPick.third && catPick.third.toLowerCase() === catResult.third?.toLowerCase()) {
          score += SCORING.first;
          breakdown[cat.id].score += SCORING.first;
        }
      }
    }

    const user = userMap[p.userId] || {};
    return {
      userId: p.userId,
      name: p.userName,
      avatar: user.avatar || getAvatar(p.userName),
      score,
      breakdown,
      picks: p.picks,
      submittedAt: p.submittedAt,
    };
  });

  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard.forEach((e, i) => e.rank = i + 1);

  res.json({
    leaderboard,
    results: results ? results.data : null,
    resultsSet: !!results,
    totalParticipants: leaderboard.length,
  });
});

// Set results (any logged-in user can do this — democratic!)
app.post('/api/results', requireAuth, async (req, res) => {
  const { results } = req.body;
  if (!results) return res.status(400).json({ error: 'No results provided' });

  const existing = await db.results.findOne({ _id: 'official' });
  if (existing) {
    await db.results.update({ _id: 'official' }, { $set: { data: results, updatedAt: new Date().toISOString(), updatedBy: req.session.userName } });
  } else {
    await db.results.insert({ _id: 'official', data: results, setAt: new Date().toISOString(), setBy: req.session.userName });
  }

  res.json({ success: true });
});

// Get results
app.get('/api/results', async (req, res) => {
  const results = await db.results.findOne({ _id: 'official' });
  res.json({ results: results ? results.data : null, resultsSet: !!results, setBy: results?.setBy });
});

// Get stats
app.get('/api/stats', async (req, res) => {
  const totalUsers = await db.users.count({});
  const totalPicks = await db.picks.count({});
  const resultsSet = await db.results.count({}) > 0;
  res.json({ totalUsers, totalPicks, resultsSet });
});

// Dashboard analytics
app.get('/api/dashboard', async (req, res) => {
  const allPicks = await db.picks.find({});
  const results = await db.results.findOne({ _id: 'official' });
  const totalPickers = allPicks.length;

  if (totalPickers === 0) return res.json({ empty: true });

  // Per-category analytics
  const categoryStats = {};

  for (const cat of CATEGORIES) {
    const tally = {}; // name -> { count, positions: {first,second,third} }

    for (const p of allPicks) {
      const pick = p.picks?.[cat.id] || {};
      for (const pos of ['first', 'second', 'third']) {
        const val = pick[pos]?.trim();
        if (!val) continue;
        const key = val.toLowerCase();
        if (!tally[key]) tally[key] = { name: val, count: 0, first: 0, second: 0, third: 0 };
        tally[key].count++;
        tally[key][pos]++;
      }
    }

    const sorted = Object.values(tally).sort((a, b) => b.count - a.count);

    // Consensus score: % of pickers who agree on 1st place
    const topFirst = Object.values(tally)
      .filter(t => t.first > 0)
      .sort((a, b) => b.first - a.first)[0];

    const consensusPct = topFirst ? Math.round((topFirst.first / totalPickers) * 100) : 0;

    // Unique picks = contrarian signal
    const uniqueFirstPicks = new Set(
      allPicks.map(p => p.picks?.[cat.id]?.first?.toLowerCase()).filter(Boolean)
    ).size;

    categoryStats[cat.id] = {
      label: cat.label,
      emoji: cat.emoji,
      topPicks: sorted.slice(0, 5),
      totalUnique: uniqueFirstPicks,
      consensusPct,
      topConsensus: topFirst ? topFirst.name : null,
      // Diversity: 100% = everyone picked differently, 0% = everyone same
      diversityPct: totalPickers > 1 ? Math.round(((uniqueFirstPicks - 1) / (totalPickers - 1)) * 100) : 0,
    };
  }

  // Per-player contrarian score: how often their 1st pick is unique (not shared by anyone else)
  const playerStats = allPicks.map(p => {
    let uniquePicks = 0;
    let sharedPicks = 0;
    let totalFirstPicks = 0;

    for (const cat of CATEGORIES) {
      const myFirst = p.picks?.[cat.id]?.first?.toLowerCase()?.trim();
      if (!myFirst) continue;
      totalFirstPicks++;

      const othersWithSame = allPicks.filter(other =>
        other.userId !== p.userId &&
        other.picks?.[cat.id]?.first?.toLowerCase()?.trim() === myFirst
      ).length;

      if (othersWithSame === 0) uniquePicks++;
      else sharedPicks++;
    }

    const contrarian = totalFirstPicks > 0 ? Math.round((uniquePicks / totalFirstPicks) * 100) : 0;

    return {
      userId: p.userId,
      name: p.userName,
      uniquePicks,
      sharedPicks,
      contrarian,
      completeness: Math.round((totalFirstPicks / CATEGORIES.length) * 100),
    };
  });

  playerStats.sort((a, b) => b.contrarian - a.contrarian);

  // Overall consensus: category ranked by how much agreement there is
  const categoryConsensus = CATEGORIES.map(cat => ({
    id: cat.id,
    label: cat.label,
    emoji: cat.emoji,
    consensusPct: categoryStats[cat.id].consensusPct,
    diversityPct: categoryStats[cat.id].diversityPct,
    topPick: categoryStats[cat.id].topConsensus,
  })).sort((a, b) => b.consensusPct - a.consensusPct);

  // Most popular single pick across entire pool
  const hotPicks = [];
  for (const cat of CATEGORIES) {
    const top = categoryStats[cat.id].topPicks[0];
    if (top) hotPicks.push({ cat: cat.label, emoji: cat.emoji, name: top.name, count: top.first || top.count, pct: Math.round(((top.first || top.count) / totalPickers) * 100) });
  }
  hotPicks.sort((a, b) => b.pct - a.pct);

  res.json({
    empty: false,
    totalPickers,
    resultsSet: !!results,
    categoryStats,
    playerStats,
    categoryConsensus,
    hotPicks,
  });
});

// --- Helpers ---
function getAvatar(name) {
  const avatars = ['⚽', '🏆', '🥅', '🎯', '👟', '🌟', '🔥', '💫', '⭐', '🦁', '🐯', '🦊', '🐺', '🦅', '🐉'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatars[Math.abs(hash) % avatars.length];
}

// --- Create data dir & Start ---
const fs = require('fs');
if (!fs.existsSync('./data')) fs.mkdirSync('./data');

app.listen(PORT, () => {
  console.log(`⚽ Copa 26 running on port ${PORT}`);
});
