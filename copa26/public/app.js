/* ===========================
   COPA 26 — Frontend App
   =========================== */

let CATEGORIES = [];
let currentUser = null;
let myPicks = {};
let resultsData = {};
let currentLeaderboard = [];

// ===========================
// INIT
// ===========================
async function init() {
  // Load categories
  const catRes = await fetch('/api/categories');
  CATEGORIES = await catRes.json();

  // Check session
  const meRes = await fetch('/api/me');
  const meData = await meRes.json();

  // Load stats for join page
  loadStats();

  if (meData.user) {
    currentUser = meData.user;
    showApp();
  } else {
    showPage('page-join');
  }
}

// ===========================
// JOIN
// ===========================
document.getElementById('join-btn').addEventListener('click', joinHandler);
document.getElementById('join-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') joinHandler();
});

async function joinHandler() {
  const name = document.getElementById('join-name').value.trim();
  if (!name || name.length < 2) {
    shakeEl(document.getElementById('join-name'));
    return;
  }

  const btn = document.getElementById('join-btn');
  btn.disabled = true;
  btn.innerHTML = '<span>Joining...</span>';

  const res = await fetch('/api/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  const data = await res.json();

  if (data.success) {
    currentUser = data.user;
    showApp();
  } else {
    btn.disabled = false;
    btn.innerHTML = '<span>Let\'s Go</span><span class="btn-icon">→</span>';
    alert(data.error || 'Something went wrong');
  }
}

async function loadStats() {
  const res = await fetch('/api/stats');
  const stats = await res.json();
  document.getElementById('stat-players').textContent = stats.totalUsers;
  document.getElementById('stat-picks').textContent = stats.totalPicks;
}

// ===========================
// APP SHELL
// ===========================
function showApp() {
  document.getElementById('nav-avatar').textContent = currentUser.avatar || '⚽';
  document.getElementById('nav-name').textContent = currentUser.name;

  showPage('page-app');
  loadPicksTab();
  loadLeaderboard();
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

// ===========================
// NAV TABS
// ===========================
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(t => {
      t.classList.remove('active');
      t.classList.add('hidden');
    });

    const tabEl = document.getElementById(`tab-${tab}`);
    tabEl.classList.remove('hidden');
    tabEl.classList.add('active');

    if (tab === 'leaderboard') loadLeaderboard();
    if (tab === 'results') loadResultsTab();
    if (tab === 'dashboard') loadDashboard();
  });
});

// ===========================
// LOGOUT
// ===========================
document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  currentUser = null;
  myPicks = {};
  showPage('page-join');
  loadStats();
});

// ===========================
// PICKS TAB
// ===========================
async function loadPicksTab() {
  // Check if results are locked
  const resResult = await fetch('/api/results');
  const resData = await resResult.json();

  // Load my picks
  const picksRes = await fetch('/api/picks/me');
  const picksData = await picksRes.json();
  if (picksData.picks) myPicks = picksData.picks;

  // Show/hide locked banner
  const lockedBanner = document.getElementById('picks-locked-banner');
  const saveBtn = document.getElementById('save-picks-btn');

  if (resData.resultsSet) {
    lockedBanner.classList.remove('hidden');
    saveBtn.disabled = true;
    saveBtn.textContent = '🔒 Picks Locked';
  }

  renderPicksGrid(false);
}

function renderPicksGrid(isResults = false) {
  const grid = document.getElementById(isResults ? 'results-grid' : 'picks-grid');
  grid.innerHTML = '';

  CATEGORIES.forEach((cat, idx) => {
    const card = document.createElement('div');
    card.className = 'pick-card';
    card.style.animationDelay = `${idx * 40}ms`;

    const currentPick = isResults ? (resultsData[cat.id] || {}) : (myPicks[cat.id] || {});

    const medalLabels = isResults
      ? ['🥇 Winner', '🥈 Runner-up', '🥉 Third Place']
      : ['🥇 1st Pick', '🥈 2nd Pick', '🥉 3rd Pick'];

    const placeholders = isResults
      ? ['Actual winner...', 'Actual 2nd place...', 'Actual 3rd place...']
      : ['Your top pick...', 'Your 2nd choice...', 'Your 3rd choice...'];

    const positions = ['first', 'second', 'third'];

    card.innerHTML = `
      <div class="pick-card-header">
        <span class="pick-emoji">${cat.emoji}</span>
        <div>
          <div class="pick-title">${cat.label}</div>
          <div class="pick-desc">${cat.description}</div>
        </div>
      </div>
      <div class="pick-rows">
        ${positions.map((pos, i) => `
          <div class="pick-row">
            <span class="pick-rank rank-${i+1}">${['1ST','2ND','3RD'][i]}</span>
            <input
              type="text"
              data-cat="${cat.id}"
              data-pos="${pos}"
              placeholder="${placeholders[i]}"
              value="${currentPick[pos] || ''}"
              maxlength="50"
              autocomplete="off"
              ${isResults ? 'id="result-input-' + cat.id + '-' + pos + '"' : 'id="pick-input-' + cat.id + '-' + pos + '"'}
            />
          </div>
        `).join('')}
      </div>
    `;

    grid.appendChild(card);
  });
}

// Save picks
document.getElementById('save-picks-btn').addEventListener('click', async () => {
  const picks = {};
  let valid = true;

  CATEGORIES.forEach(cat => {
    const first = document.getElementById(`pick-input-${cat.id}-first`)?.value.trim();
    if (!first) { valid = false; }
    picks[cat.id] = {
      first: first || '',
      second: document.getElementById(`pick-input-${cat.id}-second`)?.value.trim() || '',
      third: document.getElementById(`pick-input-${cat.id}-third`)?.value.trim() || '',
    };
  });

  if (!valid) {
    alert('Please fill in at least the 1st place pick for every category!');
    return;
  }

  const btn = document.getElementById('save-picks-btn');
  btn.disabled = true;
  btn.innerHTML = '⏳ Saving...';

  const res = await fetch('/api/picks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ picks })
  });
  const data = await res.json();

  btn.disabled = false;
  btn.innerHTML = '<span>⚽ Save My Picks</span>';

  if (data.success) {
    myPicks = picks;
    const banner = document.getElementById('picks-saved-banner');
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 3000);
  } else {
    alert(data.error || 'Failed to save picks');
  }
});

// ===========================
// LEADERBOARD
// ===========================
async function loadLeaderboard() {
  const res = await fetch('/api/picks/all');
  const data = await res.json();
  currentLeaderboard = data.leaderboard;

  const list = document.getElementById('leaderboard-list');
  const empty = document.getElementById('leaderboard-empty');
  list.innerHTML = '';

  if (!data.leaderboard.length) {
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  if (!data.resultsSet) {
    const notice = document.createElement('div');
    notice.className = 'lb-no-results';
    notice.textContent = '⏳ Results not set yet — scores will appear once the tournament ends';
    list.appendChild(notice);
  }

  data.leaderboard.forEach((entry, idx) => {
    const el = document.createElement('div');
    const rankClass = idx < 3 ? `rank-${idx + 1}` : '';
    el.className = `lb-entry ${rankClass}`;
    el.style.animationDelay = `${idx * 50}ms`;

    const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : entry.rank;

    el.innerHTML = `
      <div class="lb-rank">${rankEmoji}</div>
      <div class="lb-avatar">${entry.avatar}</div>
      <div class="lb-info">
        <div class="lb-name">${escHtml(entry.name)}</div>
        <div class="lb-meta">Submitted ${formatDate(entry.submittedAt)}</div>
      </div>
      <div>
        <div class="lb-score">${data.resultsSet ? entry.score : '—'}</div>
        <div class="lb-score-label">${data.resultsSet ? 'points' : 'waiting'}</div>
      </div>
    `;

    el.addEventListener('click', () => openPickModal(entry, data.results));
    list.appendChild(el);
  });
}

document.getElementById('refresh-lb-btn').addEventListener('click', loadLeaderboard);

// ===========================
// PICK MODAL
// ===========================
function openPickModal(entry, results) {
  document.getElementById('modal-name').textContent = `${entry.avatar} ${entry.name}`;

  const detail = document.getElementById('modal-picks-detail');
  detail.innerHTML = '';

  CATEGORIES.forEach(cat => {
    const pick = entry.picks[cat.id] || {};
    const res = results ? results[cat.id] : null;
    const bd = entry.breakdown ? entry.breakdown[cat.id] : null;

    const row = document.createElement('div');
    row.className = 'modal-pick-row';

    row.innerHTML = `
      <span style="font-size:22px">${cat.emoji}</span>
      <div class="modal-cat">
        <div>${cat.label}</div>
      </div>
      <div class="modal-pick-values">
        ${renderModalPick(pick.first, '1ST', res, 'first')}
        ${pick.second ? renderModalPick(pick.second, '2ND', res, 'second') : ''}
        ${pick.third ? renderModalPick(pick.third, '3RD', res, 'third') : ''}
      </div>
      ${bd ? `<div><div class="modal-pts">+${bd.score}</div><div style="font-size:10px;color:var(--text-muted);text-align:right">pts</div></div>` : ''}
    `;

    detail.appendChild(row);
  });

  document.getElementById('pick-modal').classList.remove('hidden');
}

function renderModalPick(value, label, results, pos) {
  if (!value) return '';
  let badgeClass = '';
  if (results) {
    if (value.toLowerCase() === results.first?.toLowerCase()) badgeClass = 'gold';
    else if (value.toLowerCase() === results.second?.toLowerCase()) badgeClass = 'silver';
    else if (value.toLowerCase() === results.third?.toLowerCase()) badgeClass = 'bronze';
  }
  return `<div class="modal-pick-item"><span class="pick-badge ${badgeClass}">${label}</span> ${escHtml(value)}</div>`;
}

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('pick-modal').classList.add('hidden');
});

document.getElementById('modal-backdrop').addEventListener('click', () => {
  document.getElementById('pick-modal').classList.add('hidden');
});

// ===========================
// RESULTS TAB
// ===========================
async function loadResultsTab() {
  // Load current results
  const res = await fetch('/api/results');
  const data = await res.json();
  if (data.results) resultsData = data.results;

  renderPicksGrid(true);
}

document.getElementById('save-results-btn').addEventListener('click', async () => {
  const results = {};

  CATEGORIES.forEach(cat => {
    results[cat.id] = {
      first: document.getElementById(`result-input-${cat.id}-first`)?.value.trim() || '',
      second: document.getElementById(`result-input-${cat.id}-second`)?.value.trim() || '',
      third: document.getElementById(`result-input-${cat.id}-third`)?.value.trim() || '',
    };
  });

  const hasAny = Object.values(results).some(r => r.first);
  if (!hasAny) {
    alert('Please fill in at least one result before saving!');
    return;
  }

  const btn = document.getElementById('save-results-btn');
  btn.disabled = true;
  btn.innerHTML = '⏳ Saving...';

  const res = await fetch('/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ results })
  });
  const data = await res.json();

  btn.disabled = false;
  btn.innerHTML = '<span>🏆 Save Results</span>';

  if (data.success) {
    resultsData = results;
    const banner = document.getElementById('results-saved-banner');
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 3000);
    // Reload picks to show locked state
    loadPicksTab();
  } else {
    alert(data.error || 'Failed to save results');
  }
});

// ===========================
// DASHBOARD
// ===========================
async function loadDashboard() {
  const res = await fetch('/api/dashboard');
  const data = await res.json();

  const empty = document.getElementById('dash-empty');
  const content = document.getElementById('dash-content');

  if (data.empty) {
    empty.classList.remove('hidden');
    content.style.display = 'none';
    return;
  }

  empty.classList.add('hidden');
  content.style.display = 'block';

  renderKPIs(data);
  renderHotPicks(data.hotPicks);
  renderConsensus(data.categoryConsensus, data.totalPickers);
  renderCategoryBreakdown(data.categoryStats, data.totalPickers);
  renderPlayerProfiles(data.playerStats);
}

document.getElementById('refresh-dash-btn').addEventListener('click', loadDashboard);

function renderKPIs(data) {
  const container = document.getElementById('dash-kpis');
  const avgConsensus = Math.round(
    data.categoryConsensus.reduce((s, c) => s + c.consensusPct, 0) / data.categoryConsensus.length
  );
  const topContrarian = data.playerStats[0];
  const mostComplete = [...data.playerStats].sort((a,b) => b.completeness - a.completeness)[0];

  const kpis = [
    { value: data.totalPickers, label: 'Players In', sub: 'submitted picks' },
    { value: `${avgConsensus}%`, label: 'Avg Consensus', sub: 'agreement across categories' },
    { value: data.categoryConsensus[0]?.topPick || '—', label: 'Top Consensus Pick', sub: data.categoryConsensus[0]?.label || '' },
    { value: topContrarian ? topContrarian.name.split(' ')[0] : '—', label: 'Most Contrarian', sub: topContrarian ? `${topContrarian.contrarian}% unique picks` : '' },
  ];

  container.innerHTML = kpis.map((k, i) => `
    <div class="dash-kpi" style="animation-delay:${i*60}ms">
      <div class="dash-kpi-value">${escHtml(String(k.value))}</div>
      <div class="dash-kpi-label">${k.label}</div>
      <div class="dash-kpi-sub">${escHtml(k.sub)}</div>
    </div>
  `).join('');
}

function renderHotPicks(hotPicks) {
  const container = document.getElementById('dash-hot-picks');
  container.innerHTML = hotPicks.map((p, i) => `
    <div class="hot-pick-chip ${i === 0 ? 'top-pick' : ''}" style="animation-delay:${i*40}ms">
      <span class="hot-pick-emoji">${p.emoji}</span>
      <div class="hot-pick-info">
        <div class="hot-pick-name">${escHtml(p.name)}</div>
        <div class="hot-pick-cat">${escHtml(p.cat)}</div>
      </div>
      <div class="hot-pick-pct">${p.pct}%</div>
    </div>
  `).join('');
}

function renderConsensus(categoryConsensus, total) {
  const container = document.getElementById('dash-consensus');
  container.innerHTML = categoryConsensus.map((c, i) => {
    const tag = c.consensusPct >= 60 ? { cls: 'tag-hot', label: 'consensus' }
               : c.diversityPct >= 70 ? { cls: 'tag-wild', label: 'wild' }
               : { cls: 'tag-split', label: 'split' };

    return `
      <div class="consensus-row" style="animation-delay:${i*50}ms">
        <span class="consensus-emoji">${c.emoji}</span>
        <div>
          <div class="consensus-cat">${c.label}</div>
          <div class="consensus-cat-pick">${c.topPick ? escHtml(c.topPick) : 'varied'}</div>
        </div>
        <div class="consensus-bar-wrap">
          <div class="consensus-bar" style="width:0%" data-pct="${c.consensusPct}"></div>
        </div>
        <div class="consensus-pct">${c.consensusPct}%</div>
        <span class="consensus-tag ${tag.cls}">${tag.label}</span>
      </div>
    `;
  }).join('');

  // Animate bars after render
  requestAnimationFrame(() => {
    document.querySelectorAll('.consensus-bar').forEach(bar => {
      bar.style.width = bar.dataset.pct + '%';
    });
  });
}

function renderCategoryBreakdown(categoryStats, total) {
  const container = document.getElementById('dash-categories');
  const cats = CATEGORIES;

  container.innerHTML = cats.map((cat, ci) => {
    const stats = categoryStats[cat.id];
    if (!stats) return '';
    const maxCount = stats.topPicks[0]?.count || 1;

    const barsHtml = stats.topPicks.slice(0, 5).map((pick, i) => `
      <div class="dash-pick-bar-row">
        <div class="dash-pick-name" title="${escHtml(pick.name)}">${escHtml(pick.name)}</div>
        <div class="dash-bar-track">
          <div class="dash-bar-fill rank-${i+1}" style="width:0%" data-pct="${Math.round((pick.count/total)*100)}"></div>
        </div>
        <div class="dash-pick-count">${pick.count}/${total}</div>
      </div>
    `).join('');

    return `
      <div class="dash-cat-card" style="animation-delay:${ci*40}ms">
        <div class="dash-cat-header">
          <span class="dash-cat-emoji">${cat.emoji}</span>
          <span class="dash-cat-title">${cat.label}</span>
          <span class="dash-cat-diversity">${stats.totalUnique} unique picks</span>
        </div>
        ${barsHtml}
      </div>
    `;
  }).join('');

  // Animate bars
  requestAnimationFrame(() => {
    document.querySelectorAll('.dash-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.pct + '%';
    });
  });
}

function renderPlayerProfiles(playerStats) {
  const container = document.getElementById('dash-players');

  container.innerHTML = playerStats.map((p, i) => {
    const contrarianClass = p.contrarian >= 60 ? 'high' : p.contrarian >= 30 ? 'mid' : 'low';
    const label = p.contrarian >= 60 ? '🎲 maverick' : p.contrarian >= 30 ? '🤔 mixed' : '🤝 crowd';

    return `
      <div class="dash-player-row" style="animation-delay:${i*50}ms">
        <div class="dash-player-avatar">
          ${p.contrarian >= 60 ? '🎲' : p.contrarian >= 30 ? '🤔' : '🤝'}
        </div>
        <div>
          <div class="dash-player-name">${escHtml(p.name)}</div>
          <div class="dash-player-meta">${p.uniquePicks} unique · ${p.sharedPicks} shared · ${label}</div>
        </div>
        <div class="contrarian-badge">
          <div class="contrarian-pct ${contrarianClass}">${p.contrarian}%</div>
          <div class="contrarian-label">contrarian</div>
        </div>
        <div class="completeness-wrap">
          <div class="completeness-pct">${p.completeness}% complete</div>
          <div class="mini-bar-track">
            <div class="mini-bar-fill" style="width:${p.completeness}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}


function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return 'just now';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function shakeEl(el) {
  el.style.animation = 'none';
  el.style.borderColor = 'var(--red)';
  el.offsetHeight;
  el.style.animation = '';
  setTimeout(() => el.style.borderColor = '', 1500);
}

// ===========================
// START
// ===========================
init();
