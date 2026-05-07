/* ═══════════════════════════════
   COPA 26 v2 — Complete Frontend
   ═══════════════════════════════ */

// ── STATE ────────────────────────────────────────────────────────────────────
let currentUser = null;
let CATEGORIES = [];
let ALL_GAMES = [];
let myAwardsPicks = {};
let myQuinielaPicks = {};
let quinielaResults = {};
let awardsResults = null;
let currentLang = localStorage.getItem('copa26_lang') || 'en';
let currentTheme = localStorage.getItem('copa26_theme') || 'dark';
let confirmCallback = null;

// ── I18N ─────────────────────────────────────────────────────────────────────
const I18N = {
  en: {
    tagline: 'World Cup 2026 · Prediction Pool',
    join_label: 'Enter your name to join',
    join_placeholder: 'Your name...',
    join_btn: "Let's Go",
    join_hint: 'New? Type your name. Returning? Same name gets you back in.',
    players: 'players', awards_submitted: 'award picks', quiniela_submitted: 'quinielas',
    welcome_title: "Welcome to the most unofficial, unsponsored,\nand somehow the GREATEST World Cup app ever! 🔥",
    welcome_sub: "FIFA doesn't know about this. Let's keep it that way. 🤫",
    rule1: '🏅 Awards — Pick 1st/2nd/3rd for 8 categories (Golden Boot, Champion, etc.)',
    rule2: '⚽ Quiniela — Predict results for all 104 World Cup games',
    rule3: '📊 Scoring — Correct winner = 3 pts · Exact score = 5 pts',
    rule4: '🏆 Win — Most total points = eternal bragging rights',
    welcome_btn: 'Let the games begin! ⚽',
    welcome_footer: 'Come back anytime with the same name',
    tab_leaderboard: '🏆 Leaderboard', tab_awards: '⭐ Awards',
    tab_quiniela: '⚽ Quiniela', tab_results: '📋 Results', tab_admin: '⚙️ Admin',
    logout: '← Out', refresh: '↻ Refresh',
    locked: '🔒 Locked — results are set',
    awards_desc: 'Pick your 1st, 2nd, and 3rd for each award category.',
    save_awards: '⭐ Save Award Picks', awards_note: 'Picks lock when official awards are set',
    awards_results: '⭐ Award Results', quiniela_results: '⚽ Game Results',
    awards_results_desc: 'Enter the official award winners. This locks all award picks.',
    quiniela_results_desc: 'Enter scores as games finish. You can update anytime.',
    save_awards_results: '💾 Save Award Results',
    save_quiniela_results: '💾 Save Game Results',
    quiniela_desc: 'Predict the score for every game. Group stage: predict winner = 3pts. Knockouts: exact score = 5pts, correct winner = 3pts.',
    save_quiniela: '⚽ Save Picks', quiniela_note: 'Save often — your picks auto-update',
    all_games: 'All Games', group_stage: 'Group Stage',
    round_32: 'Round of 32', round_16: 'Round of 16',
    quarterfinals: 'Quarter Finals', semifinals: 'Semi Finals', final: 'Final',
    all_groups: 'All Groups',
    danger_zone: 'Danger Zone',
    reset_awards_results: 'Reset Award Results', reset_awards_desc: 'Unlocks all award picks',
    reset_quiniela_results: 'Reset Quiniela Results', reset_quiniela_desc: 'Clears all game scores',
    reset: 'Reset', all_players: '👥 All Players',
    cancel: 'Cancel', confirm: 'Confirm',
    pick_1st: 'Your top pick...', pick_2nd: 'Your 2nd choice...', pick_3rd: 'Your 3rd choice...',
    result_1st: 'Actual winner...', result_2nd: 'Actual 2nd...', result_3rd: 'Actual 3rd...',
    pts: 'pts', total: 'total', awards_pts: 'awards', quiniela_pts: 'quiniela',
    correct: 'correct', exact: 'exact', picked: 'picked',
    no_score_yet: 'No result yet',
    lb_no_results: '⏳ Scores will appear once results are set',
    saving: 'Saving...', saved: '✅ Saved!', error: '❌ Error',
    save_knockout: '💾 Save Team Names', knockout_desc: 'Update team names as each round matchups are confirmed. Changes appear instantly for all players.',
    home_placeholder: 'H', away_placeholder: 'A',
    admin_awards_picks: 'awards picks', admin_quiniela_picks: 'quiniela picks',
    delete_player: 'Delete Player', reset_picks: 'Reset Picks',
    delete_confirm: (n) => `Permanently remove ${n} and all their picks? Cannot be undone.`,
    reset_awards_confirm: (n) => `Clear ${n}'s award picks? They can resubmit.`,
    reset_quiniela_confirm: (n) => `Clear ${n}'s quiniela picks? They can resubmit.`,
    reset_awards_results_confirm: 'Clear official award results and unlock all picks?',
    reset_quiniela_results_confirm: 'Clear all game scores?',
    joined: 'Joined', submitted: 'Submitted',
  },
  es: {
    tagline: 'Mundial 2026 · Quiniela de Predicciones',
    join_label: 'Escribe tu nombre para entrar',
    join_placeholder: 'Tu nombre...',
    join_btn: '¡Vamos!',
    join_hint: '¿Nuevo? Escribe tu nombre. ¿Ya estás? El mismo nombre te regresa.',
    players: 'jugadores', awards_submitted: 'picks de premios', quiniela_submitted: 'quinielas',
    welcome_title: "¡Bienvenido a la app de fútbol más no-oficial,\nsin patrocinadores, y sin embargo la MÁS ÉPICA del Mundial! 🔥",
    welcome_sub: "La FIFA no sabe que esto existe. Mejor así. 🤫",
    rule1: '🏅 Premios — Elige 1ro/2do/3ro en 8 categorías (Bota de Oro, Campeón, etc.)',
    rule2: '⚽ Quiniela — Predice los resultados de los 104 partidos del Mundial',
    rule3: '📊 Puntuación — Ganador correcto = 3 pts · Marcador exacto = 5 pts',
    rule4: '🏆 Ganar — El que más puntos tenga = gloria eterna',
    welcome_btn: '¡Que comiencen los juegos! ⚽',
    welcome_footer: 'Vuelve cuando quieras con el mismo nombre',
    tab_leaderboard: '🏆 Tabla', tab_awards: '⭐ Premios',
    tab_quiniela: '⚽ Quiniela', tab_results: '📋 Resultados', tab_admin: '⚙️ Admin',
    logout: '← Salir', refresh: '↻ Actualizar',
    locked: '🔒 Bloqueado — resultados ingresados',
    awards_desc: 'Elige tu 1ro, 2do y 3ro para cada categoría de premios.',
    save_awards: '⭐ Guardar Premios', awards_note: 'Se bloquea al ingresar resultados oficiales',
    awards_results: '⭐ Resultados Premios', quiniela_results: '⚽ Resultados Partidos',
    awards_results_desc: 'Ingresa los ganadores oficiales. Bloquea todos los picks de premios.',
    quiniela_results_desc: 'Ingresa los marcadores a medida que terminan los partidos.',
    save_awards_results: '💾 Guardar Resultados Premios',
    save_quiniela_results: '💾 Guardar Resultados Partidos',
    quiniela_desc: 'Predice el marcador de cada partido. Fase de grupos: ganador = 3pts. Eliminatorias: marcador exacto = 5pts, ganador correcto = 3pts.',
    save_quiniela: '⚽ Guardar Picks', quiniela_note: 'Guarda seguido — tus picks se actualizan',
    all_games: 'Todos los Partidos', group_stage: 'Fase de Grupos',
    round_32: 'Ronda de 32', round_16: 'Octavos de Final',
    quarterfinals: 'Cuartos de Final', semifinals: 'Semifinales', final: 'Gran Final',
    all_groups: 'Todos los Grupos',
    danger_zone: 'Zona de Peligro',
    reset_awards_results: 'Borrar Resultados Premios', reset_awards_desc: 'Desbloquea todos los picks de premios',
    reset_quiniela_results: 'Borrar Resultados Quiniela', reset_quiniela_desc: 'Borra todos los marcadores',
    reset: 'Borrar', all_players: '👥 Todos los Jugadores',
    cancel: 'Cancelar', confirm: 'Confirmar',
    pick_1st: 'Tu primera opción...', pick_2nd: 'Tu segunda opción...', pick_3rd: 'Tu tercera opción...',
    result_1st: 'Ganador real...', result_2nd: '2do lugar...', result_3rd: '3er lugar...',
    pts: 'pts', total: 'total', awards_pts: 'premios', quiniela_pts: 'quiniela',
    correct: 'correctos', exact: 'exactos', picked: 'elegidos',
    no_score_yet: 'Sin resultado aún',
    lb_no_results: '⏳ Los puntos aparecen cuando se ingresen resultados',
    saving: 'Guardando...', saved: '✅ ¡Guardado!', error: '❌ Error',
    save_knockout: '💾 Guardar Nombres', knockout_desc: 'Actualiza los nombres de equipos cuando se confirmen los enfrentamientos. Los cambios aparecen al instante para todos.',
    home_placeholder: 'L', away_placeholder: 'V',
    admin_awards_picks: 'picks premios', admin_quiniela_picks: 'picks quiniela',
    delete_player: 'Eliminar Jugador', reset_picks: 'Borrar Picks',
    delete_confirm: (n) => `¿Eliminar permanentemente a ${n} y todos sus picks? No se puede deshacer.`,
    reset_awards_confirm: (n) => `¿Borrar los picks de premios de ${n}? Podrá volver a enviar.`,
    reset_quiniela_confirm: (n) => `¿Borrar la quiniela de ${n}? Podrá volver a enviar.`,
    reset_awards_results_confirm: '¿Borrar los resultados oficiales de premios y desbloquear todos los picks?',
    reset_quiniela_results_confirm: '¿Borrar todos los marcadores de partidos?',
    joined: 'Se unió', submitted: 'Enviado',
  }
};

function t(key, ...args) {
  const v = I18N[currentLang]?.[key] ?? I18N.en?.[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
}

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('copa26_lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    const v = t(k);
    if (v) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
}

function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('copa26_theme', theme);
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = theme === 'light' ? '🌙' : '☀️';
}

// ── TOKEN ─────────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('copa26_token');
const setToken = t => localStorage.setItem('copa26_token', t);
const clearToken = () => localStorage.removeItem('copa26_token');

function authFetch(url, opts = {}) {
  const token = getToken();
  opts.headers = opts.headers || {};
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (opts.body && !opts.headers['Content-Type']) opts.headers['Content-Type'] = 'application/json';
  return fetch(url, opts);
}

// ── INIT ──────────────────────────────────────────────────────────────────────
async function init() {
  applyTheme(currentTheme);
  applyLang(currentLang);

  // Load schedule + categories in parallel
  const [schedRes, catRes, statsRes] = await Promise.all([
    fetch('/api/schedule'),
    fetch('/api/categories'),
    fetch('/api/stats'),
  ]);
  const schedData = await schedRes.json();
  ALL_GAMES = schedData.games;
  CATEGORIES = await catRes.json();
  const stats = await statsRes.json();

  document.getElementById('s-players').textContent = stats.totalUsers;
  document.getElementById('s-awards').textContent = stats.totalAwardsPicks;
  document.getElementById('s-quiniela').textContent = stats.totalQuinielaPicks;

  // Populate group filter
  const groups = [...new Set(ALL_GAMES.filter(g=>g.group).map(g=>g.group))].sort();
  const gf = document.getElementById('group-filter');
  groups.forEach(g => { const o = document.createElement('option'); o.value = g; o.textContent = `Group ${g}`; gf.appendChild(o); });

  // Check token
  const token = getToken();
  if (token) {
    try {
      const r = await authFetch('/api/me');
      const d = await r.json();
      if (d.user) { currentUser = d.user; enterApp(); return; }
    } catch(e) {}
    clearToken();
  }
  showPage('page-join');
}

// ── JOIN ──────────────────────────────────────────────────────────────────────
document.getElementById('join-btn').addEventListener('click', doJoin);
document.getElementById('join-name').addEventListener('keydown', e => { if (e.key==='Enter') doJoin(); });

async function doJoin() {
  const name = document.getElementById('join-name').value.trim();
  const errEl = document.getElementById('join-error');
  errEl.classList.add('hidden');
  if (!name || name.length < 2) { errEl.textContent = '⚠️ ' + (currentLang==='es'?'Mínimo 2 caracteres':'At least 2 characters'); errEl.classList.remove('hidden'); return; }

  const btn = document.getElementById('join-btn');
  btn.disabled = true;
  btn.innerHTML = (currentLang==='es' ? 'Entrando...' : 'Joining...') + ' ⏳';

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
      btn.innerHTML = '✅ ' + (currentLang==='es' ? '¡Estás adentro!' : "You're in!");
      btn.style.background = '#00C853';
      if (data.isNew) {
        setTimeout(showWelcomeModal, 600);
      } else {
        setTimeout(enterApp, 700);
      }
    } else {
      btn.disabled = false; btn.innerHTML = t('join_btn') + ' →';
      errEl.textContent = '⚠️ ' + (data.error || 'Error'); errEl.classList.remove('hidden');
    }
  } catch(e) {
    btn.disabled = false; btn.innerHTML = t('join_btn') + ' →';
    errEl.textContent = '⚠️ Connection error — ' + e.message; errEl.classList.remove('hidden');
  }
}

// ── WELCOME ───────────────────────────────────────────────────────────────────
function showWelcomeModal() {
  applyLang(currentLang);
  document.getElementById('welcome-modal').classList.remove('hidden');
}

document.getElementById('welcome-ok').addEventListener('click', () => {
  document.getElementById('welcome-modal').classList.add('hidden');
  enterApp();
});

// ── APP ENTRY ─────────────────────────────────────────────────────────────────
function enterApp() {
  document.getElementById('nav-avatar').textContent = currentUser.avatar || '⚽';
  document.getElementById('nav-name').textContent = currentUser.name;
  applyLang(currentLang);
  showPage('page-app');
  loadLeaderboard();
  loadMyAwardsPicks();
  loadMyQuinielaPicks();
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
document.getElementById('logout-btn').addEventListener('click', () => {
  clearToken(); currentUser = null; myAwardsPicks = {}; myQuinielaPicks = {};
  document.getElementById('join-name').value = '';
  const btn = document.getElementById('join-btn');
  btn.disabled = false; btn.innerHTML = t('join_btn') + ' →'; btn.style.background = '';
  showPage('page-join');
});

// ── PAGE / TAB ROUTING ────────────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

document.getElementById('nav-tabs').addEventListener('click', e => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  const tab = btn.dataset.tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tab').forEach(t => { t.classList.remove('active'); t.classList.add('hidden'); });
  const el = document.getElementById('tab-' + tab);
  el.classList.remove('hidden'); el.classList.add('active');
  if (tab === 'leaderboard') loadLeaderboard();
  if (tab === 'admin') loadAdmin();
  if (tab === 'results') { loadAwardsResultsPanel(); loadQuinielaResultsPanel(); }
  if (tab === 'quiniela') renderQuinielaGrid();
  if (tab === 'awards') renderAwardsGrid();
});

// ── THEME + LANG ──────────────────────────────────────────────────────────────
document.getElementById('theme-btn').addEventListener('click', () => applyTheme(currentTheme==='dark'?'light':'dark'));
document.addEventListener('click', e => {
  const btn = e.target.closest('.lang-btn');
  if (btn?.dataset.lang) applyLang(btn.dataset.lang);
});

// ── LEADERBOARD ───────────────────────────────────────────────────────────────
async function loadLeaderboard() {
  const el = document.getElementById('lb-content');
  el.innerHTML = '<p style="color:var(--text-2);font-size:14px;padding:20px 0">Loading...</p>';
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    renderLeaderboard(data);
  } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error loading</p>'; }
}

function renderLeaderboard(data) {
  const el = document.getElementById('lb-content');
  let html = '<div class="lb-tabs">';
  html += `<button class="lb-tab-btn active" onclick="filterLb('total',this)">${t('tab_leaderboard')}</button>`;
  html += `<button class="lb-tab-btn" onclick="filterLb('awards',this)">⭐ ${t('tab_awards')}</button>`;
  html += `<button class="lb-tab-btn" onclick="filterLb('quiniela',this)">⚽ ${t('tab_quiniela')}</button>`;
  html += '</div>';

  if (!data.awardsResultsSet && !data.quinielaResultsSet) {
    html += `<div class="lb-notice">${t('lb_no_results')}</div>`;
  }

  html += `<div id="lb-rows">`;
  data.leaderboard.forEach((p, i) => {
    const rankEmoji = i===0?'🥇':i===1?'🥈':i===2?'🥉':p.rank;
    html += `<div class="lb-row rank-${i<3?i+1:''}" data-awards="${p.awardsScore}" data-quiniela="${p.quinielaScore}" data-total="${p.totalScore}">
      <div class="lb-rank">${rankEmoji}</div>
      <div class="lb-avatar">${p.avatar}</div>
      <div>
        <div class="lb-name">${esc(p.name)}</div>
        <div class="lb-meta">${p.gamesPicked} ${t('picked')} · ${p.gamesCorrect} ${t('correct')} · ${p.gamesExact} ${t('exact')}</div>
      </div>
      <div class="lb-score-wrap">
        <div class="lb-total">${p.totalScore || '—'}</div>
        <div class="lb-breakdown">${p.awardsScore} ${t('awards_pts')} + ${p.quinielaScore} ${t('quiniela_pts')}</div>
      </div>
    </div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}

function filterLb(type, btn) {
  document.querySelectorAll('.lb-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const rows = document.querySelectorAll('#lb-rows .lb-row');
  const sorted = [...rows].sort((a,b) => +b.dataset[type] - +a.dataset[type]);
  const container = document.getElementById('lb-rows');
  sorted.forEach((r,i) => {
    r.classList.remove('rank-1','rank-2','rank-3');
    if (i<3) r.classList.add('rank-'+(i+1));
    const scoreEl = r.querySelector('.lb-total');
    scoreEl.textContent = r.dataset[type] || '—';
    container.appendChild(r);
  });
}

// ── AWARDS PICKS ──────────────────────────────────────────────────────────────
async function loadMyAwardsPicks() {
  try {
    const [picksRes, resultsRes] = await Promise.all([
      authFetch('/api/awards/picks/me'),
      fetch('/api/awards/results'),
    ]);
    const pd = await picksRes.json();
    const rd = await resultsRes.json();
    myAwardsPicks = pd.picks || {};
    awardsResults = rd.results;
    if (rd.resultsSet) document.getElementById('awards-locked-banner').classList.remove('hidden');
  } catch(e) {}
}

function renderAwardsGrid(isResults = false) {
  const grid = document.getElementById(isResults ? 'awards-results-grid' : 'awards-grid');
  grid.innerHTML = '';
  const positions = ['first','second','third'];
  CATEGORIES.forEach((cat, ci) => {
    const current = isResults ? (awardsResults?.[cat.id] || {}) : (myAwardsPicks[cat.id] || {});
    const label = currentLang==='es' ? (cat.labelEs||cat.label) : cat.label;
    const desc  = currentLang==='es' ? (cat.descEs||cat.desc)   : cat.desc;
    const card = document.createElement('div');
    card.className = 'pick-card';
    card.style.animationDelay = ci*30+'ms';
    card.innerHTML = `
      <div class="pick-card-head">
        <span class="pick-cat-emoji">${cat.emoji}</span>
        <div>
          <div class="pick-cat-title">${label}</div>
          <div class="pick-cat-desc">${desc}</div>
        </div>
      </div>
      ${positions.map((pos,i) => `
        <div class="pick-row">
          <span class="pick-rank r${i+1}">${['1ST','2ND','3RD'][i]}</span>
          <input type="text"
            id="${isResults?'ar':'ap'}-${cat.id}-${pos}"
            value="${esc(current[pos]||'')}"
            placeholder="${t(isResults?`result_${['1st','2nd','3rd'][i]}`:`pick_${['1st','2nd','3rd'][i]}`)}"
            maxlength="50" autocomplete="off"
            ${isResults?'':''}
          />
        </div>
      `).join('')}
    `;
    grid.appendChild(card);
  });
}

async function saveAwardsPicks() {
  const btn = document.getElementById('save-awards-btn');
  btn.disabled = true; btn.textContent = t('saving');
  const picks = {};
  CATEGORIES.forEach(cat => {
    picks[cat.id] = {
      first:  document.getElementById(`ap-${cat.id}-first`)?.value.trim() || '',
      second: document.getElementById(`ap-${cat.id}-second`)?.value.trim() || '',
      third:  document.getElementById(`ap-${cat.id}-third`)?.value.trim() || '',
    };
  });
  try {
    const res = await authFetch('/api/awards/picks', { method:'POST', body: JSON.stringify({picks}) });
    const data = await res.json();
    myAwardsPicks = picks;
    showToast(data.success ? t('saved') : '❌ '+data.error);
  } catch(e) { showToast('❌ '+e.message); }
  btn.disabled = false; btn.textContent = t('save_awards');
}

document.getElementById('save-awards-btn').addEventListener('click', saveAwardsPicks);

// ── QUINIELA PICKS ────────────────────────────────────────────────────────────
async function loadMyQuinielaPicks() {
  try {
    const [picksRes, resultsRes] = await Promise.all([
      authFetch('/api/quiniela/picks/me'),
      fetch('/api/quiniela/results'),
    ]);
    const pd = await picksRes.json();
    const rd = await resultsRes.json();
    myQuinielaPicks = pd.picks || {};
    quinielaResults = rd.results || {};
  } catch(e) {}
}

function getFilteredGames() {
  const phase = document.getElementById('phase-filter')?.value || 'all';
  const group = document.getElementById('group-filter')?.value || 'all';
  return ALL_GAMES.filter(g => {
    if (phase !== 'all' && g.phase !== phase) return false;
    if (group !== 'all' && g.group !== group) return false;
    return true;
  });
}

function renderQuinielaGrid() {
  const grid = document.getElementById('quiniela-grid');
  grid.innerHTML = '';
  const games = getFilteredGames();
  let lastGroup = null;

  games.forEach(game => {
    // Group header
    if (game.phase === 'group' && game.group !== lastGroup) {
      lastGroup = game.group;
      const hdr = document.createElement('div');
      hdr.className = 'q-group-header';
      hdr.textContent = (currentLang==='es' ? 'Grupo' : 'Group') + ' ' + game.group;
      grid.appendChild(hdr);
    } else if (game.phase !== 'group' && lastGroup !== game.phase) {
      lastGroup = game.phase;
      const hdr = document.createElement('div');
      hdr.className = 'q-group-header';
      hdr.textContent = currentLang==='es' ? game.labelEs : game.label;
      grid.appendChild(hdr);
    }

    const pick = myQuinielaPicks[game.id] || {};
    const result = quinielaResults[game.id];
    let pts = null;
    if (result && pick.homeGoals !== undefined && pick.awayGoals !== undefined) {
      pts = scoreGame(pick, result, game.phase);
    }

    const div = document.createElement('div');
    div.className = 'q-game' + (pick.homeGoals!==undefined?'  has-pick':'') + (pts===5?' exact-match':pts===3?' correct-winner':'');
    div.innerHTML = `
      <div class="q-team home">${esc(game.home)}</div>
      <div class="q-score-wrap">
        <input class="q-score-input" type="number" min="0" max="20"
          id="q-h-${game.id}" value="${pick.homeGoals??''}" placeholder="${t('home_placeholder')}"
          data-game="${game.id}" data-side="h"/>
        <span class="q-dash">—</span>
        <input class="q-score-input" type="number" min="0" max="20"
          id="q-a-${game.id}" value="${pick.awayGoals??''}" placeholder="${t('away_placeholder')}"
          data-game="${game.id}" data-side="a"/>
        ${result ? `<span class="q-result-badge ${pts===5?'q-pts-5':pts===3?'q-pts-3':'q-pts-0'}">${result.homeGoals}–${result.awayGoals} ${pts!==null?'(+'+pts+')':''}</span>` : ''}
      </div>
      <div class="q-team away">${esc(game.away)}</div>
    `;
    grid.appendChild(div);
  });

  updateProgress();

  // Live update on input
  grid.querySelectorAll('.q-score-input').forEach(inp => {
    inp.addEventListener('change', () => {
      const gameId = inp.dataset.game;
      const side = inp.dataset.side;
      if (!myQuinielaPicks[gameId]) myQuinielaPicks[gameId] = {};
      if (side==='h') myQuinielaPicks[gameId].homeGoals = inp.value;
      else myQuinielaPicks[gameId].awayGoals = inp.value;
      updateProgress();
    });
  });
}

function updateProgress() {
  const filled = ALL_GAMES.filter(g => {
    const p = myQuinielaPicks[g.id];
    return p && p.homeGoals !== '' && p.homeGoals !== undefined && p.awayGoals !== '' && p.awayGoals !== undefined;
  }).length;
  const pct = Math.round((filled / ALL_GAMES.length) * 100);
  document.getElementById('quiniela-progress-fill').style.width = pct + '%';
  document.getElementById('quiniela-progress-label').textContent = `${filled} / ${ALL_GAMES.length}`;
}

async function saveQuinielaPicks() {
  // Collect from inputs
  ALL_GAMES.forEach(game => {
    const hEl = document.getElementById(`q-h-${game.id}`);
    const aEl = document.getElementById(`q-a-${game.id}`);
    if (hEl || aEl) {
      if (!myQuinielaPicks[game.id]) myQuinielaPicks[game.id] = {};
      if (hEl) myQuinielaPicks[game.id].homeGoals = hEl.value;
      if (aEl) myQuinielaPicks[game.id].awayGoals = aEl.value;
    }
  });

  try {
    const res = await authFetch('/api/quiniela/picks', { method:'POST', body: JSON.stringify({ picks: myQuinielaPicks }) });
    const data = await res.json();
    showToast(data.success ? t('saved') : '❌ ' + data.error);
  } catch(e) { showToast('❌ ' + e.message); }
}

document.getElementById('save-quiniela-btn').addEventListener('click', saveQuinielaPicks);
document.getElementById('save-quiniela-btn2').addEventListener('click', saveQuinielaPicks);

// Phase + group filter
document.getElementById('phase-filter').addEventListener('change', () => {
  const phase = document.getElementById('phase-filter').value;
  const gf = document.getElementById('group-filter');
  gf.style.display = phase === 'group' || phase === 'all' ? '' : 'none';
  renderQuinielaGrid();
});
document.getElementById('group-filter').addEventListener('change', renderQuinielaGrid);

// ── RESULTS TABS ──────────────────────────────────────────────────────────────
document.querySelectorAll('.res-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.res-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const panel = btn.dataset.rtab;
    document.querySelectorAll('.res-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(panel + '-panel').classList.remove('hidden');
  });
});

async function loadAwardsResultsPanel() {
  const res = await fetch('/api/awards/results');
  const data = await res.json();
  awardsResults = data.results;
  renderAwardsGrid(true);
}

async function loadQuinielaResultsPanel() {
  const res = await fetch('/api/quiniela/results');
  const data = await res.json();
  quinielaResults = data.results || {};
  renderQuinielaResultsGrid();
}

function renderQuinielaResultsGrid() {
  const grid = document.getElementById('quiniela-results-grid');
  const phase = document.getElementById('result-phase-filter')?.value || 'all';
  const games = ALL_GAMES.filter(g => phase==='all' || g.phase===phase);
  grid.innerHTML = '';
  let lastPhase = null;

  games.forEach(game => {
    if (game.phase !== lastPhase) {
      lastPhase = game.phase;
      const hdr = document.createElement('div');
      hdr.className = 'q-group-header';
      hdr.textContent = currentLang==='es' ? game.labelEs : (game.group ? `Group ${game.group}` : game.label);
      grid.appendChild(hdr);
    }
    const result = quinielaResults[game.id] || {};
    const div = document.createElement('div');
    div.className = 'q-game';
    div.innerHTML = `
      <div class="q-team home">${esc(game.home)}</div>
      <div class="q-score-wrap">
        <input class="q-score-input" type="number" min="0" max="20"
          id="qr-h-${game.id}" value="${result.homeGoals??''}" placeholder="H"/>
        <span class="q-dash">—</span>
        <input class="q-score-input" type="number" min="0" max="20"
          id="qr-a-${game.id}" value="${result.awayGoals??''}" placeholder="A"/>
      </div>
      <div class="q-team away">${esc(game.away)}</div>
    `;
    grid.appendChild(div);
  });
}

document.getElementById('result-phase-filter').addEventListener('change', renderQuinielaResultsGrid);

document.getElementById('save-awards-results-btn').addEventListener('click', async () => {
  const btn = document.getElementById('save-awards-results-btn');
  btn.disabled = true; btn.textContent = t('saving');
  const results = {};
  CATEGORIES.forEach(cat => {
    results[cat.id] = {
      first:  document.getElementById(`ar-${cat.id}-first`)?.value.trim() || '',
      second: document.getElementById(`ar-${cat.id}-second`)?.value.trim() || '',
      third:  document.getElementById(`ar-${cat.id}-third`)?.value.trim() || '',
    };
  });
  try {
    const res = await authFetch('/api/awards/results', { method:'POST', body: JSON.stringify({results}) });
    const data = await res.json();
    awardsResults = results;
    showToast(data.success ? t('saved') : '❌ '+data.error);
  } catch(e) { showToast('❌ '+e.message); }
  btn.disabled = false; btn.textContent = t('save_awards_results');
});

document.getElementById('save-quiniela-results-btn').addEventListener('click', async () => {
  const btn = document.getElementById('save-quiniela-results-btn');
  btn.disabled = true; btn.textContent = t('saving');
  const results = {};
  ALL_GAMES.forEach(game => {
    const h = document.getElementById(`qr-h-${game.id}`)?.value;
    const a = document.getElementById(`qr-a-${game.id}`)?.value;
    if (h !== '' && h !== undefined && a !== '' && a !== undefined) {
      results[game.id] = { homeGoals: h, awayGoals: a };
    }
  });
  try {
    const res = await authFetch('/api/quiniela/results', { method:'POST', body: JSON.stringify({results}) });
    const data = await res.json();
    quinielaResults = results;
    showToast(data.success ? t('saved') : '❌ '+data.error);
  } catch(e) { showToast('❌ '+e.message); }
  btn.disabled = false; btn.textContent = t('save_quiniela_results');
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────
async function loadAdmin() {
  loadKnockoutTeams();
  const res = await authFetch('/api/admin/players');
  const data = await res.json();

  // KPIs
  document.getElementById('admin-kpis').innerHTML = [
    { v: data.totalPlayers, l: 'players' },
    { v: data.totalWithAwards, l: 'admin_awards_picks' },
    { v: data.totalWithQuiniela, l: 'admin_quiniela_picks' },
    { v: data.awardsResultsSet ? '🔒' : '🟢', l: 'tab_awards' },
    { v: data.quinielaResultsSet ? '🔒' : '🟢', l: 'tab_quiniela' },
  ].map(k => `<div class="kpi-card"><div class="kpi-val">${k.v}</div><div class="kpi-label">${t(k.l)}</div></div>`).join('');

  // Danger zone buttons
  document.getElementById('btn-reset-awards').disabled = !data.awardsResultsSet;
  document.getElementById('btn-reset-quiniela').disabled = !data.quinielaResultsSet;

  // Players
  const container = document.getElementById('admin-players');
  if (!data.players.length) { container.innerHTML = '<p style="color:var(--text-2)">No players yet</p>'; return; }

  container.innerHTML = data.players.map((p, i) => `
    <div class="admin-row ${!p.hasAwardsPicks && !p.hasQuinielaPicks ? 'dimmed' : ''}" style="animation-delay:${i*30}ms">
      <div class="admin-avatar">${p.avatar}</div>
      <div>
        <div class="admin-name">${esc(p.name)}</div>
        <div class="admin-meta">${t('joined')} ${fmtDate(p.joinedAt)}</div>
        <div>
          <span class="badge ${p.hasAwardsPicks?'badge-ok':'badge-no'}">⭐ ${p.hasAwardsPicks?t('submitted'):t('tab_awards')}</span>
          <span class="badge ${p.hasQuinielaPicks?'badge-ok':'badge-no'}">⚽ ${p.hasQuinielaPicks?t('submitted'):t('tab_quiniela')}</span>
        </div>
      </div>
      <div class="admin-actions">
        ${p.hasAwardsPicks ? `<button class="btn-ghost btn-sm" onclick="adminResetAwards('${p.id}','${esc(p.name)}')">⭐ ${t('reset_picks')}</button>` : ''}
        ${p.hasQuinielaPicks ? `<button class="btn-ghost btn-sm" onclick="adminResetQuiniela('${p.id}','${esc(p.name)}')">⚽ ${t('reset_picks')}</button>` : ''}
        <button class="btn-danger btn-sm" onclick="adminDeletePlayer('${p.id}','${esc(p.name)}')">${t('delete_player')}</button>
      </div>
    </div>
  `).join('');
}

function adminDeletePlayer(id, name) {
  showConfirm(t('delete_player'), t('delete_confirm', name), async () => {
    await authFetch(`/api/admin/players/${id}`, { method:'DELETE' });
    loadAdmin();
  });
}
function adminResetAwards(id, name) {
  showConfirm(t('reset_picks'), t('reset_awards_confirm', name), async () => {
    await authFetch(`/api/admin/players/${id}/awards`, { method:'DELETE' });
    loadAdmin();
  });
}
function adminResetQuiniela(id, name) {
  showConfirm(t('reset_picks'), t('reset_quiniela_confirm', name), async () => {
    await authFetch(`/api/admin/players/${id}/quiniela`, { method:'DELETE' });
    loadAdmin();
  });
}

document.getElementById('btn-reset-awards').addEventListener('click', () => {
  showConfirm(t('reset_awards_results'), t('reset_awards_results_confirm'), async () => {
    await authFetch('/api/admin/results/awards', { method:'DELETE' });
    awardsResults = null;
    loadAdmin();
  });
});
document.getElementById('btn-reset-quiniela').addEventListener('click', () => {
  showConfirm(t('reset_quiniela_results'), t('reset_quiniela_results_confirm'), async () => {
    await authFetch('/api/admin/results/quiniela', { method:'DELETE' });
    quinielaResults = {};
    loadAdmin();
  });
});

// ── CONFIRM MODAL ─────────────────────────────────────────────────────────────
function showConfirm(title, msg, cb) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  confirmCallback = cb;
  document.getElementById('confirm-modal').classList.remove('hidden');
}
function closeConfirm() { document.getElementById('confirm-modal').classList.add('hidden'); confirmCallback = null; }
document.getElementById('confirm-ok').addEventListener('click', async () => {
  closeConfirm();
  if (confirmCallback) { await confirmCallback(); confirmCallback = null; }
});

// ── SCORING (mirrors server logic) ────────────────────────────────────────────
function scoreGame(pick, result, phase) {
  if (!pick || !result) return null;
  const ph = parseInt(pick.homeGoals), pa = parseInt(pick.awayGoals);
  const rh = parseInt(result.homeGoals), ra = parseInt(result.awayGoals);
  if (isNaN(ph)||isNaN(pa)||isNaN(rh)||isNaN(ra)) return null;
  if (phase === 'group') {
    return getOutcome(ph,pa) === getOutcome(rh,ra) ? 3 : 0;
  } else {
    if (ph===rh && pa===ra) return 5;
    return getOutcome(ph,pa) === getOutcome(rh,ra) ? 3 : 0;
  }
}
function getOutcome(h,a) { return h>a?'H':h<a?'A':'D'; }

// ── HELPERS ───────────────────────────────────────────────────────────────────
function esc(s) { const d=document.createElement('div'); d.textContent=String(s||''); return d.innerHTML; }
function fmtDate(iso) { if(!iso) return '—'; return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric'}); }

let toastTimer;
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--border);color:var(--text);padding:12px 24px;border-radius:999px;font-size:14px;z-index:999;box-shadow:var(--shadow);transition:opacity .3s;font-family:var(--font);font-weight:600;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.style.opacity = '0', 2500);
}


// ── KNOCKOUT TEAM EDITOR ──────────────────────────────────────────────────────
let savedKnockoutTeams = {};

async function loadKnockoutTeams() {
  try {
    const res = await authFetch('/api/admin/knockout-teams');
    const data = await res.json();
    savedKnockoutTeams = data.teams || {};
    renderKnockoutEditor();
  } catch(e) {}
}

function renderKnockoutEditor() {
  const phase = document.getElementById('knockout-phase-select')?.value || 'r32';
  const grid = document.getElementById('knockout-teams-grid');
  if (!grid) return;

  const games = ALL_GAMES.filter(g => g.phase === phase);
  grid.innerHTML = '';

  games.forEach(game => {
    const saved = savedKnockoutTeams[game.id] || {};
    const currentHome = saved.home || game.home;
    const currentAway = saved.away || game.away;
    const isDefault = game.home.includes('Home') || game.home.includes('TBD');
    const hasReal = saved.home && !saved.home.includes('Home');

    const div = document.createElement('div');
    div.className = 'knockout-game-row';
    div.innerHTML = `
      <div class="knockout-game-label">${currentLang==='es' ? game.labelEs : game.label}</div>
      <div class="knockout-team-inputs">
        <input type="text" 
          id="ko-home-${game.id}" 
          value="${esc(hasReal ? saved.home : '')}" 
          placeholder="${esc(game.home)}"
          maxlength="40" autocomplete="off"
          class="${hasReal ? 'updated' : ''}"
        />
        <span class="ko-vs">vs</span>
        <input type="text" 
          id="ko-away-${game.id}" 
          value="${esc(saved.away && !saved.away.includes('Away') ? saved.away : '')}" 
          placeholder="${esc(game.away)}"
          maxlength="40" autocomplete="off"
          class="${saved.away && !saved.away.includes('Away') ? 'updated' : ''}"
        />
      </div>
    `;
    grid.appendChild(div);
  });
}

async function saveKnockoutTeams() {
  const btn = document.getElementById('save-knockout-btn');
  btn.disabled = true; btn.textContent = t('saving');

  // Collect all inputs across all phases
  const teams = { ...savedKnockoutTeams };
  const knockoutGames = ALL_GAMES.filter(g => g.phase !== 'group');

  knockoutGames.forEach(game => {
    const homeEl = document.getElementById(`ko-home-${game.id}`);
    const awayEl = document.getElementById(`ko-away-${game.id}`);
    if (homeEl || awayEl) {
      const home = homeEl?.value.trim() || savedKnockoutTeams[game.id]?.home || game.home;
      const away = awayEl?.value.trim() || savedKnockoutTeams[game.id]?.away || game.away;
      if (home || away) {
        teams[game.id] = { home: home || game.home, away: away || game.away };
      }
    }
  });

  try {
    const res = await authFetch('/api/admin/knockout-teams', {
      method: 'POST',
      body: JSON.stringify({ teams })
    });
    const data = await res.json();
    if (data.success) {
      savedKnockoutTeams = teams;
      // Mark updated inputs
      document.querySelectorAll('#knockout-teams-grid input').forEach(inp => {
        if (inp.value.trim()) inp.classList.add('updated');
      });
      showToast(t('saved') + ' — ' + (currentLang==='es' ? 'Recarga la quiniela para ver los cambios' : 'Reload quiniela to see changes'));
      // Reload schedule so quiniela reflects new names
      const schedRes = await fetch('/api/schedule');
      const schedData = await schedRes.json();
      ALL_GAMES.splice(0, ALL_GAMES.length, ...schedData.games);
    } else {
      showToast('❌ ' + data.error);
    }
  } catch(e) { showToast('❌ ' + e.message); }

  btn.disabled = false; btn.textContent = currentLang==='es' ? '💾 Guardar Nombres' : '💾 Save Team Names';
}

document.getElementById('save-knockout-btn')?.addEventListener('click', saveKnockoutTeams);
document.getElementById('knockout-phase-select')?.addEventListener('change', renderKnockoutEditor);

// ── GO ────────────────────────────────────────────────────────────────────────
init();
