/* ===========================
   COPA 26 — Frontend App
   =========================== */

let CATEGORIES = [];
let currentUser = null;
let myPicks = {};
let resultsData = {};
let currentLeaderboard = [];

// ===========================
// JWT TOKEN HELPERS
// ===========================
function getToken() { return localStorage.getItem('copa26_token'); }
function setToken(t) { localStorage.setItem('copa26_token', t); }
function clearToken() { localStorage.removeItem('copa26_token'); }

function authHeaders() {
  const t = getToken();
  return t ? { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t }
           : { 'Content-Type': 'application/json' };
}

function authFetch(url, opts = {}) {
  const t = getToken();
  opts.headers = opts.headers || {};
  if (t) opts.headers['Authorization'] = 'Bearer ' + t;
  if (!opts.headers['Content-Type'] && opts.body) opts.headers['Content-Type'] = 'application/json';
  return fetch(url, opts);
}


// ===========================
// LANGUAGE SYSTEM
// ===========================
let currentLang = localStorage.getItem('copa26_lang') || 'en';

const T = {
  en: {
    pick_first: 'Your top pick...', pick_second: 'Your 2nd choice...', pick_third: 'Your 3rd choice...',
    result_first: 'Actual winner...', result_second: 'Actual 2nd place...', result_third: 'Actual 3rd place...',
    rank1: '1ST', rank2: '2ND', rank3: '3RD',
    save_picks: '⚽ Save My Picks', save_results: '🏆 Save Results',
    saving: '⏳ Saving...', saved_picks: '✅ Picks saved!', saved_results: '✅ Results saved!',
    locked: '🔒 Results set — picks locked!',
    lb_points: 'points', lb_waiting: 'waiting', submitted: 'Submitted',
    unique: 'unique', unique_picks: 'unique', shared: 'shared',
    no_picks_empty: 'No picks yet — be the first to submit!',
    no_players: 'No players yet',
    admin_total: 'Total Players', admin_submitted: 'Picks Submitted',
    admin_none: 'No Picks Yet', admin_status: 'Status',
    admin_open: '🟢 Open — picks allowed', admin_locked: '🔒 Locked',
    admin_picks_in: '✅ picks in', admin_no_picks: '⏳ no picks',
    admin_joined: 'Joined', admin_picks_label: 'Picks:',
    admin_updated: 'Updated:', admin_view_picks: 'View Picks',
    admin_reset_picks: 'Reset Picks', admin_delete: 'Delete',
    admin_reset_results: 'Reset Results', admin_no_results: 'No Results Set',
    danger_reset_title: 'Reset All Results',
    danger_reset_desc: "Clears the results and unlocks everyone's picks",
    confirm_delete_msg: (name) => `This will permanently remove ${name} and all their picks. Cannot be undone.`,
    confirm_reset_picks_msg: (name) => `This will clear all of ${name}'s picks. They can re-submit after.`,
    confirm_reset_results_msg: "This will clear the official results and unlock everyone's picks.",
    confirm_delete_title: 'Delete Player', confirm_reset_picks_title: 'Reset Picks',
    confirm_reset_results_title: 'Reset Results', confirm_ok: 'Confirm', confirm_cancel: 'Cancel',
    maverick: '🎲 maverick', mixed: '🤔 mixed', crowd: '🤝 crowd follower',
    consensus_label: 'consensus', split_label: 'split', wild_label: 'wild',
    unique_picks_label: 'unique picks', contrarian_label: 'contrarian', complete_label: '% complete',
  },
  es: {
    pick_first: 'Tu primera opción...', pick_second: 'Tu segunda opción...', pick_third: 'Tu tercera opción...',
    result_first: 'Ganador real...', result_second: '2do lugar real...', result_third: '3er lugar real...',
    rank1: '1RO', rank2: '2DO', rank3: '3RO',
    save_picks: '⚽ Guardar mis Picks', save_results: '🏆 Guardar Resultados',
    saving: '⏳ Guardando...', saved_picks: '✅ ¡Picks guardados!', saved_results: '✅ ¡Resultados guardados!',
    locked: '🔒 Resultados ingresados — ¡picks bloqueados!',
    lb_points: 'puntos', lb_waiting: 'esperando', submitted: 'Enviado',
    unique: 'únicos', unique_picks: 'únicos', shared: 'compartidos',
    no_picks_empty: 'Sin picks aún — ¡sé el primero!',
    no_players: 'Sin jugadores aún',
    admin_total: 'Total Jugadores', admin_submitted: 'Picks Enviados',
    admin_none: 'Sin Picks Aún', admin_status: 'Estado',
    admin_open: '🟢 Abierto — picks permitidos', admin_locked: '🔒 Bloqueado',
    admin_picks_in: '✅ picks enviados', admin_no_picks: '⏳ sin picks',
    admin_joined: 'Se unió', admin_picks_label: 'Picks:',
    admin_updated: 'Actualizado:', admin_view_picks: 'Ver Picks',
    admin_reset_picks: 'Borrar Picks', admin_delete: 'Eliminar',
    admin_reset_results: 'Borrar Resultados', admin_no_results: 'Sin Resultados',
    danger_reset_title: 'Borrar Todos los Resultados',
    danger_reset_desc: 'Borra los resultados y desbloquea los picks de todos',
    confirm_delete_msg: (name) => `Esto eliminará permanentemente a ${name} y todos sus picks. No se puede deshacer.`,
    confirm_reset_picks_msg: (name) => `Esto borrará todos los picks de ${name}. Podrá volver a enviarlos.`,
    confirm_reset_results_msg: 'Esto borrará los resultados oficiales y desbloqueará los picks de todos.',
    confirm_delete_title: 'Eliminar Jugador', confirm_reset_picks_title: 'Borrar Picks',
    confirm_reset_results_title: 'Borrar Resultados', confirm_ok: 'Confirmar', confirm_cancel: 'Cancelar',
    maverick: '🎲 rebelde', mixed: '🤔 mixto', crowd: '🤝 del montón',
    consensus_label: 'consenso', split_label: 'dividido', wild_label: 'caos',
    unique_picks_label: 'picks únicos', contrarian_label: 'contrario', complete_label: '% completo',
  }
};

function t(key, ...args) {
  const val = T[currentLang]?.[key] ?? T.en?.[key] ?? key;
  return typeof val === 'function' ? val(...args) : val;
}

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('copa26_lang', lang);

  // Update all data-en / data-es elements
  document.querySelectorAll('[data-en], [data-es]').forEach(el => {
    const val = el.dataset[lang];
    if (val !== undefined) el.textContent = val;
  });

  // Update all lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Update dynamic pick card placeholders
  document.querySelectorAll('[data-pick-pos]').forEach(input => {
    const pos = input.dataset.pickPos;
    const isResult = input.dataset.isResult === 'true';
    const posMap = { first: 0, second: 1, third: 2 };
    const i = posMap[pos] ?? 0;
    const placeholders = isResult
      ? [t('result_first'), t('result_second'), t('result_third')]
      : [t('pick_first'), t('pick_second'), t('pick_third')];
    input.placeholder = placeholders[i];
  });
}

// Wire lang buttons (all of them — join page + nav)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.lang-btn');
  if (btn && btn.dataset.lang) applyLang(btn.dataset.lang);
});

// ===========================
// THEME SYSTEM
// ===========================
let currentTheme = localStorage.getItem('copa26_theme') || 'dark';

function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('copa26_theme', theme);
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'light' ? '🌙' : '☀️';
}

document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme on load
  applyTheme(currentTheme);
  applyLang(currentLang);
});

// Theme toggle button
document.addEventListener('click', (e) => {
  if (e.target.closest('#theme-toggle')) {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }
});

// ===========================
// WELCOME MODAL
// ===========================
function showWelcomeModal() {
  const modal = document.getElementById('welcome-modal');
  if (modal) {
    modal.classList.remove('hidden');
    applyLang(currentLang); // make sure welcome text is in right language
  }
}

document.getElementById('welcome-close-btn')?.addEventListener('click', () => {
  document.getElementById('welcome-modal')?.classList.add('hidden');
  // Now enter the app
  showApp();
});

// ===========================
// INIT
// ===========================
async function init() {
  // Load categories
  const catRes = await fetch('/api/categories');
  CATEGORIES = await catRes.json();

  // Check token + session
  const token = getToken();
  if (token) {
    try {
      const meRes = await authFetch('/api/me');
      const meData = await meRes.json();
      if (meData.user) {
        currentUser = meData.user;
        loadStats();
        showApp();
        return;
      }
    } catch(e) {}
    // Token invalid — clear it
    clearToken();
  }

  // Load stats for join page
  loadStats();
  showPage('page-join');
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

  try {
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();

    if (data.success) {
      setToken(data.token);
      currentUser = data.user;
      btn.innerHTML = '<span>✅ ' + (currentLang === 'es' ? '¡Estás adentro!' : 'You\'re in!') + '</span>';
      btn.style.background = 'var(--green)';
      if (data.isNew) {
        // First time — show welcome modal after brief pause
        setTimeout(() => showWelcomeModal(), 600);
      } else {
        // Returning player — go straight in
        setTimeout(() => showApp(), 700);
      }
    } else {
      btn.disabled = false;
      btn.innerHTML = '<span>Let\'s Go</span><span class="btn-icon">→</span>';
      showJoinError(data.error || 'Something went wrong');
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '<span>Let\'s Go</span><span class="btn-icon">→</span>';
    showJoinError('Connection error — ' + err.message);
  }
}

function showJoinError(msg) {
  let err = document.getElementById('join-error');
  if (!err) {
    err = document.createElement('p');
    err.id = 'join-error';
    err.style.cssText = 'color:#ff4444;font-size:13px;font-family:var(--font-mono);margin-top:4px;';
    document.querySelector('.join-card').appendChild(err);
  }
  err.textContent = '⚠️ ' + msg;
  setTimeout(() => { if (err) err.textContent = ''; }, 5000);
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

  applyTheme(currentTheme);
  applyLang(currentLang);
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
    if (tab === 'admin') loadAdmin();
  });
});

// ===========================
// LOGOUT
// ===========================
document.getElementById('logout-btn').addEventListener('click', async () => {
  clearToken();
  currentUser = null;
  myPicks = {};
  // Reset join form
  document.getElementById('join-name').value = '';
  const btn = document.getElementById('join-btn');
  btn.disabled = false;
  btn.innerHTML = '<span>Let\'s Go</span><span class="btn-icon">→</span>';
  btn.style.background = '';
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
  const picksRes = await authFetch('/api/picks/me');
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

  const res = await authFetch('/api/picks', {
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

  const res = await authFetch('/api/results', {
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

// ===========================
// ADMIN PANEL
// ===========================

let adminConfirmCallback = null;

async function loadAdmin() {
  const res = await fetch('/api/admin/players');
  const data = await res.json();

  renderAdminKPIs(data);
  renderAdminPlayers(data.players, data.resultsSet);
  renderAdminDangerZone(data.resultsSet);
}

document.getElementById('refresh-admin-btn').addEventListener('click', loadAdmin);

function renderAdminKPIs(data) {
  const container = document.getElementById('admin-kpis');
  const withPicks = data.players.filter(p => p.haspicks).length;
  const withoutPicks = data.totalPlayers - withPicks;
  const lastJoined = data.players[0];

  const kpis = [
    { value: data.totalPlayers, label: 'Total Players', sub: 'registered names' },
    { value: withPicks, label: 'Picks Submitted', sub: `${data.totalPlayers > 0 ? Math.round((withPicks/data.totalPlayers)*100) : 0}% completion rate` },
    { value: withoutPicks, label: 'No Picks Yet', sub: 'joined but not submitted' },
    { value: data.resultsSet ? '🔒' : '🟢', label: 'Status', sub: data.resultsSet ? 'Results set — picks locked' : 'Open — picks allowed' },
  ];

  container.innerHTML = kpis.map((k, i) => `
    <div class="dash-kpi" style="animation-delay:${i*60}ms">
      <div class="dash-kpi-value">${escHtml(String(k.value))}</div>
      <div class="dash-kpi-label">${k.label}</div>
      <div class="dash-kpi-sub">${escHtml(k.sub)}</div>
    </div>
  `).join('');
}

function renderAdminDangerZone(resultsSet) {
  const btn = document.getElementById('admin-reset-results-btn');
  if (!resultsSet) {
    btn.disabled = true;
    btn.textContent = 'No Results Set';
    btn.style.opacity = '0.4';
  } else {
    btn.disabled = false;
    btn.textContent = 'Reset Results';
    btn.style.opacity = '1';
  }
}

function renderAdminPlayers(players, resultsSet) {
  const container = document.getElementById('admin-players-list');

  if (!players.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><p>No players yet</p></div>';
    return;
  }

  container.innerHTML = players.map((p, i) => `
    <div class="admin-player-row ${p.haspicks ? '' : 'no-picks'}" style="animation-delay:${i*40}ms">
      <div class="admin-p-avatar">${escHtml(p.avatar || '⚽')}</div>
      <div class="admin-p-info">
        <div class="admin-p-name">${escHtml(p.name)}</div>
        <div class="admin-p-meta">
          Joined ${formatDate(p.joinedAt)}
          ${p.submittedAt ? ' · Picks: ' + formatDate(p.submittedAt) : ''}
          ${p.updatedAt && p.updatedAt !== p.submittedAt ? ' · Updated: ' + formatDate(p.updatedAt) : ''}
        </div>
      </div>
      <span class="admin-p-badge ${p.haspicks ? 'badge-picks' : 'badge-nopicks'}">
        ${p.haspicks ? '✅ picks in' : '⏳ no picks'}
      </span>
      <div class="admin-p-joined">${formatDateTime(p.joinedAt)}</div>
      <div class="admin-p-actions">
        ${p.haspicks ? `<button class="btn-view" onclick="adminViewPicks('${p.id}', '${escHtml(p.name)}', '${escHtml(p.avatar || '⚽')}')">View Picks</button>` : '<span style="font-size:12px;color:var(--text-muted)">—</span>'}
        ${p.haspicks ? `<button class="btn-sm-danger" onclick="adminResetPicks('${p.id}', '${escHtml(p.name)}')">Reset Picks</button>` : ''}
        <button class="btn-sm-danger" onclick="adminDeletePlayer('${p.id}', '${escHtml(p.name)}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// View a player's picks
let adminPlayersCache = [];

async function adminViewPicks(userId, name, avatar) {
  // Get latest data
  const res = await fetch('/api/admin/players');
  const data = await res.json();
  adminPlayersCache = data.players;

  const player = data.players.find(p => p.id === userId);
  if (!player || !player.picks) return;

  document.getElementById('admin-picks-title').textContent = `${avatar} ${name}'s Picks`;

  const detail = document.getElementById('admin-picks-detail');
  detail.innerHTML = CATEGORIES.map(cat => {
    const pick = player.picks[cat.id] || {};
    const positions = [
      { label: '🥇 1ST', val: pick.first },
      { label: '🥈 2ND', val: pick.second },
      { label: '🥉 3RD', val: pick.third },
    ].filter(p => p.val);

    return `
      <div class="admin-picks-cat">
        <div class="admin-picks-cat-header">
          <span>${cat.emoji}</span>
          <span>${cat.label}</span>
        </div>
        <div class="admin-picks-positions">
          ${positions.length ? positions.map(p => `
            <div class="admin-pick-line">
              <span class="pick-badge">${p.label}</span>
              <span>${escHtml(p.val)}</span>
            </div>
          `).join('') : '<span style="font-size:12px;color:var(--text-muted)">No pick entered</span>'}
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('admin-picks-modal').classList.remove('hidden');
}

// Reset a player's picks
function adminResetPicks(userId, name) {
  showAdminConfirm(
    'Reset Picks',
    `This will clear all of ${name}'s picks. They can re-submit after. This cannot be undone.`,
    async () => {
      const res = await fetch(`/api/admin/players/${userId}/picks`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + getToken() } });
      const data = await res.json();
      if (data.success) loadAdmin();
      else alert('Error: ' + data.error);
    }
  );
}

// Delete a player entirely
function adminDeletePlayer(userId, name) {
  showAdminConfirm(
    'Delete Player',
    `This will permanently remove ${name} and all their picks from the pool. This cannot be undone.`,
    async () => {
      const res = await fetch(`/api/admin/players/${userId}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + getToken() } });
      const data = await res.json();
      if (data.success) loadAdmin();
      else alert('Error: ' + data.error);
    }
  );
}

// Reset results
document.getElementById('admin-reset-results-btn').addEventListener('click', () => {
  showAdminConfirm(
    'Reset Results',
    'This will clear the official results and unlock everyone\'s picks so they can be updated again.',
    async () => {
      const res = await fetch('/api/admin/results', { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + getToken() } });
      const data = await res.json();
      if (data.success) loadAdmin();
      else alert('Error: ' + data.error);
    }
  );
});

// Confirm modal helpers
function showAdminConfirm(title, msg, onConfirm) {
  document.getElementById('admin-confirm-title').textContent = title;
  document.getElementById('admin-confirm-msg').textContent = msg;
  adminConfirmCallback = onConfirm;
  document.getElementById('admin-confirm-modal').classList.remove('hidden');
}

document.getElementById('admin-confirm-ok').addEventListener('click', async () => {
  document.getElementById('admin-confirm-modal').classList.add('hidden');
  if (adminConfirmCallback) {
    await adminConfirmCallback();
    adminConfirmCallback = null;
  }
});

['admin-confirm-cancel', 'admin-confirm-close', 'admin-modal-backdrop'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => {
    document.getElementById('admin-confirm-modal').classList.add('hidden');
    adminConfirmCallback = null;
  });
});

// Picks modal close
['admin-picks-close', 'admin-picks-backdrop'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => {
    document.getElementById('admin-picks-modal').classList.add('hidden');
  });
});

// Helper: full datetime
function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
