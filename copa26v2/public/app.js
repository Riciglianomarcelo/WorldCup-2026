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
    rule3: '📊 Scoring — Exact score +5 · Correct winner +3 · One team right +1 · Max 5/game',
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
    quiniela_desc: 'Predict the score for every game. Exact score +5pts, correct winner/draw +3pts, one team\'s goals right +1pt. Max 5 per game.',
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
    rule3: '📊 Puntuación — Marcador exacto +5 · Ganador correcto +3 · Un equipo acertado +1 · Máx 5/partido',
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
    quiniela_desc: 'Predice el marcador de cada partido. Marcador exacto +5pts, ganador/empate correcto +3pts, goles de un equipo acertados +1pt. Máx 5 por partido.',
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
    if (!v) return;
    // Tab buttons: update only the full-label span, strip emoji prefix
    const fullSpan = el.querySelector('.tab-label-full');
    if (fullSpan) {
      fullSpan.textContent = v.replace(/^[\p{Emoji}\s]+/u, '');
      return;
    }
    el.textContent = v;
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

// Admin secret (only the organizer enters this; stored locally on their device)
const getAdminSecret = () => localStorage.getItem('copa26_admin') || '';
const setAdminSecret = s => localStorage.setItem('copa26_admin', s);
function ensureAdminSecret() {
  let s = getAdminSecret();
  if (!s) {
    s = (window.prompt('Enter admin secret') || '').trim();
    if (s) setAdminSecret(s);
  }
  return s;
}

function authFetch(url, opts = {}) {
  const token = getToken();
  opts.headers = opts.headers || {};
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  const adminSecret = getAdminSecret();
  if (adminSecret) opts.headers['x-admin-secret'] = adminSecret;
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
    const emailVal = document.getElementById('join-email')?.value?.trim() || undefined;
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: emailVal })
    });
    const data = await res.json();

    if (data.success) {
      setToken(data.token);
      // Show email prompt after login if they don't have an email yet
      if (!data.user?.hasEmail && !emailVal) showNotifPrompt();
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
  if (tab === 'race') loadRace();
  if (tab === 'groups') loadGroups();
  if (tab === 'admin') loadAdmin();
  if (tab === 'everyone') loadEveryone();
  if (tab === 'results') { loadAwardsResultsPanel(); loadQuinielaResultsPanel(); }
  if (tab !== 'race' && racePlaying) { clearInterval(raceTimer); racePlaying = false; }
  if (tab === 'quiniela') { buildDateFilters('q-filter-bar', qFilter, 'setQFilter'); renderQuinielaGrid(); }
  if (tab === 'awards') renderAwardsGrid();
});

// ── THEME + LANG ──────────────────────────────────────────────────────────────
document.getElementById('theme-btn').addEventListener('click', () => applyTheme(currentTheme==='dark'?'light':'dark'));
document.addEventListener('click', e => {
  const btn = e.target.closest('.lang-btn');
  if (btn?.dataset.lang) applyLang(btn.dataset.lang);
});

// ── RACE CHART ────────────────────────────────────────────────────────────────
const RACE_COLORS = ['#C9A84C','#00C853','#CC2429','#1B55B8','#FF6B2B','#A78BFA','#38BDF8','#FB7185','#34D399'];
let raceData = null, raceDayIdx = 0, racePlaying = false, raceTimer = null;

function raceRanks(data, dayIdx) {
  const sc = data.players.map(p => ({ id:p.id, pts: data.series[p.id]?.[dayIdx] || 0 }));
  sc.sort((a,b) => b.pts - a.pts || a.id.localeCompare(b.id));
  const r = {}; sc.forEach((s,i) => r[s.id] = i+1); return r;
}

async function loadRace() {
  const el = document.getElementById('race-content');
  el.innerHTML = '<p style="color:var(--text-2);padding:20px 0">Loading…</p>';
  try {
    const res = await fetch('/api/leaderboard/race');
    raceData = await res.json();
    if (!raceData.days?.length) { renderRacePreseason(); return; }
    raceDayIdx = raceData.days.length - 1;
    renderRaceDay();
  } catch(e) { el.innerHTML = `<p style="color:var(--red)">${e.message}</p>`; }
}

function renderRacePreseason() {
  document.getElementById('race-content').innerHTML = `
    <div class="race-pre">
      <div class="race-pre-icon">🏁</div>
      <div class="race-pre-title">The race begins June 11</div>
      <div class="race-pre-sub">Once the first games finish and scores sync, every matchday's standings appear here as a live race — who climbed, who fell, who's surging.</div>
    </div>`;
}

function setRaceDay(idx) {
  raceDayIdx = +idx; renderRaceDay();
  const s = document.getElementById('race-scrub');
  if (s) s.value = idx;
}

function raceTogglePlay() {
  if (racePlaying) {
    clearInterval(raceTimer); racePlaying = false;
    const b = document.getElementById('race-play'); if (b) b.textContent = '▶'; return;
  }
  racePlaying = true;
  const b = document.getElementById('race-play'); if (b) b.textContent = '⏸';
  if (raceDayIdx >= raceData.days.length - 1) raceDayIdx = 0;
  raceTimer = setInterval(() => {
    raceDayIdx++;
    if (raceDayIdx >= raceData.days.length) {
      clearInterval(raceTimer); racePlaying = false;
      const b2 = document.getElementById('race-play'); if (b2) b2.textContent = '▶'; return;
    }
    renderRaceDay();
    const s = document.getElementById('race-scrub'); if (s) s.value = raceDayIdx;
  }, 850);
}

function renderRaceDay() {
  if (!raceData?.days?.length) return;
  const { days, players } = raceData;
  const di = raceDayIdx;
  const colorMap = {}; players.forEach((p,i) => colorMap[p.id] = RACE_COLORS[i % RACE_COLORS.length]);
  const ranks = raceRanks(raceData, di);
  const prevRanks = di > 0 ? raceRanks(raceData, di-1) : null;

  const withStats = players.map(p => ({
    ...p, color: colorMap[p.id],
    pts:   raceData.series[p.id]?.[di] || 0,
    today: di>0 ? (raceData.series[p.id]?.[di]||0)-(raceData.series[p.id]?.[di-1]||0)
                : (raceData.series[p.id]?.[0]||0),
    rank:  ranks[p.id],
    prevRank: prevRanks ? prevRanks[p.id] : null,
  })).sort((a,b) => a.rank - b.rank);

  let biggestMover = null, maxClimb = 0;
  if (prevRanks) withStats.forEach(p => {
    const climb = (p.prevRank||0) - p.rank;
    if (climb > maxClimb) { maxClimb = climb; biggestMover = p; }
  });

  let html = `<div class="race-asof">📅 ${days[di]} · Day ${di+1} of ${days.length}</div>`;
  html += racePodium(withStats);
  html += raceBumpChart(raceData, di, colorMap, ranks);
  html += `<div class="race-controls">
    <button class="race-play" id="race-play" onclick="raceTogglePlay()">▶</button>
    <div class="race-slider-wrap">
      <div class="race-slider-labels"><span>${days[0]}</span><span>drag to replay</span><span>${days[days.length-1]}</span></div>
      <input type="range" id="race-scrub" min="0" max="${days.length-1}" value="${di}" step="1" oninput="setRaceDay(this.value)">
    </div>
  </div>`;
  html += raceTable(withStats, prevRanks);
  if (biggestMover) html += `<div class="race-mover-chip">▲ ${biggestMover.name} +${maxClimb} ${maxClimb===1?'place':'places'} today</div>`;

  document.getElementById('race-content').innerHTML = html;
}

function racePodium(sorted) {
  const pos = (p, label) => !p ? '' : `<div class="race-pod ${label==='1st'?'race-pod-lead':''}">
    <div class="race-pod-pos" style="color:${p.color}">${label}</div>
    <div class="race-pod-av">${p.avatar}</div>
    <div class="race-pod-name">${p.name}</div>
    <div class="race-pod-pts" style="color:${p.color}">${p.pts}<span>pts</span></div>
    <div class="race-pod-today">${p.today>0?'+'+p.today+' today':'—'}</div>
  </div>`;
  return `<div class="race-podium">
    ${pos(sorted[0],'1st')}${pos(sorted[1],'2nd')}${pos(sorted[2],'3rd')}
  </div>`;
}

function raceBumpChart(data, di, colorMap, currentRanks) {
  const { days, players } = data;
  const N = players.length, M = days.length;
  const W=780, H=280, PL=40, PR=104, PT=20, PB=32;
  const xFor = d => M <= 1 ? W/2 : PL + (W-PL-PR) * d / (M-1);
  const yFor = r => N <= 1 ? H/2 : PT + (H-PT-PB) * (r-1) / (N-1);

  // precompute daily ranks
  const dailyRanks = days.map((_,d) => raceRanks(data, d));

  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;overflow:visible">`;

  // gridlines
  for (let r=1;r<=N;r++) {
    const y=yFor(r);
    s += `<line x1="${PL}" y1="${y}" x2="${W-PR}" y2="${y}" style="stroke:var(--border);stroke-width:0.5"/>`;
    s += `<text x="${PL-8}" y="${y+4}" text-anchor="end" style="font-size:11px;fill:var(--text-3);font-family:var(--font-m)">${r}</text>`;
  }

  // day labels (every other if crowded)
  const step = M > 12 ? Math.ceil(M/8) : 1;
  days.forEach((day,d) => {
    if (d % step !== 0 && d !== M-1) return;
    s += `<text x="${xFor(d)}" y="${H-4}" text-anchor="middle" style="font-size:10px;fill:var(--text-3);font-family:var(--font-m)">${day}</text>`;
  });

  // day marker
  s += `<line x1="${xFor(di)}" y1="${PT-4}" x2="${xFor(di)}" y2="${H-PB}" style="stroke:#C9A84C;stroke-width:1.5;stroke-dasharray:4 3;opacity:0.6"/>`;

  // player lines (draw non-leaders first so leader is on top)
  [...players].sort(p => currentRanks[p.id]===1?1:-1).forEach(p => {
    const color = colorMap[p.id];
    const isLead = currentRanks[p.id] === 1;
    const pts = [];
    for (let d=0; d<=di; d++) {
      const r = dailyRanks[d]?.[p.id];
      if (r != null) pts.push([xFor(d), yFor(r)]);
    }
    if (!pts.length) return;
    const pathD = pts.map(([x,y],i) => (i===0?`M${x},${y}`:`L${x},${y}`)).join(' ');
    s += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="${isLead?3.5:2.2}" stroke-linejoin="round" stroke-linecap="round" opacity="${isLead?1:0.65}"/>`;
    const [lx,ly] = pts[pts.length-1];
    s += `<circle cx="${lx}" cy="${ly}" r="${isLead?5.5:4}" fill="${color}"/>`;
    const name = p.name.split(' ')[0];
    s += `<text x="${lx+10}" y="${ly+4}" style="font-size:${isLead?13:11}px;fill:${color};font-weight:${isLead?600:400};font-family:var(--font)">${name}</text>`;
  });

  s += `</svg>`;
  return `<div class="race-chart-wrap">${s}</div>`;
}

function raceTable(sorted, prevRanks) {
  let html = `<div class="race-table">
    <div class="race-tr race-thead"><div>Rank</div><div></div><div>Player</div><div class="race-td-r">Today</div><div class="race-td-r">Total</div></div>`;
  sorted.forEach(p => {
    let mv = '<span class="race-mv same">—</span>';
    if (prevRanks) {
      const diff = (prevRanks[p.id]||0) - p.rank;
      if (diff > 0) mv = `<span class="race-mv up">▲${diff}</span>`;
      else if (diff < 0) mv = `<span class="race-mv dn">▼${-diff}</span>`;
    }
    html += `<div class="race-tr ${p.rank===1?'race-tr-lead':''}">
      <div class="race-rk" style="color:${p.rank===1?p.color:'var(--text-2)'}">${p.rank}</div>
      <div>${mv}</div>
      <div class="race-player"><span style="margin-right:8px">${p.avatar}</span>${p.name}</div>
      <div class="race-td-r race-today ${p.today===0?'zero':''}">${p.today>0?'+'+p.today:'0'}</div>
      <div class="race-td-r race-total">${p.pts}</div>
    </div>`;
  });
  html += `</div>`;
  return html;
}

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

// ── QUINIELA: date-based filter + render ─────────────────────────────────────
let qFilter = 'all';
let qCollapsed = {};

function buildDateFilters(barId, currentFilter, setFn) {
  const bar = document.getElementById(barId); if (!bar) return;
  const todayStr = new Date().toISOString().slice(0, 10);
  const dates = [...new Set(ALL_GAMES.filter(g => g.kickoff).map(g => g.kickoff.slice(0, 10)))].sort();
  const groups = [...new Set(ALL_GAMES.filter(g => g.group).map(g => g.group))].sort();
  let html = `<button class="ev-filter-btn ${currentFilter==='all'?'active':''}" onclick="${setFn}('all')">All</button>`;
  html += `<button class="ev-filter-btn q-today-btn ${currentFilter==='today'?'active':''}" onclick="${setFn}('today')">📅 Today</button>`;
  html += `<span class="q-filter-sep">|</span>`;
  dates.forEach(d => {
    const dt = new Date(d + 'T12:00:00Z');
    const label = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const isToday = d === todayStr;
    html += `<button class="ev-filter-btn ${currentFilter===d?'active':''}" onclick="${setFn}('${d}')">${isToday ? '🟢 ' : ''}${label}</button>`;
  });
  html += `<span class="q-filter-sep">|</span>`;
  groups.forEach(g => { html += `<button class="ev-filter-btn ${currentFilter==='grp-'+g?'active':''}" onclick="${setFn}('grp-${g}')">Grp ${g}</button>`; });
  html += `<button class="ev-filter-btn ${currentFilter==='ko'?'active':''}" onclick="${setFn}('ko')">KO</button>`;
  bar.innerHTML = html;
}

function filterGamesByQ(filter) {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (filter === 'all') return ALL_GAMES;
  if (filter === 'today') return ALL_GAMES.filter(g => g.kickoff && g.kickoff.slice(0, 10) === todayStr);
  if (filter === 'ko') return ALL_GAMES.filter(g => g.phase !== 'group');
  if (filter.startsWith('grp-')) return ALL_GAMES.filter(g => g.group === filter.slice(4));
  return ALL_GAMES.filter(g => g.kickoff && g.kickoff.slice(0, 10) === filter);
}

function setQFilter(f) { qFilter = f; buildDateFilters('q-filter-bar', qFilter, 'setQFilter'); renderQuinielaGrid(); }

function groupGamesByDate(games) {
  const map = new Map();
  games.forEach(g => { const dayKey = g.kickoff ? g.kickoff.slice(0, 10) : 'TBD'; if (!map.has(dayKey)) map.set(dayKey, []); map.get(dayKey).push(g); });
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function toggleQDay(key) {
  qCollapsed[key] = !qCollapsed[key];
  const hdr = document.querySelector(`[data-qday="${key}"]`);
  const body = document.querySelector(`[data-qbody="${key}"]`);
  if (hdr) hdr.classList.toggle('collapsed', qCollapsed[key]);
  if (body) body.classList.toggle('collapsed', qCollapsed[key]);
}

function renderQuinielaGrid() {
  const grid = document.getElementById('quiniela-grid');
  grid.innerHTML = '';
  const games = filterGamesByQ(qFilter);
  const todayStr = new Date().toISOString().slice(0, 10);

  if (!games.length) {
    grid.innerHTML = `<p class="ev-empty">${qFilter === 'today' ? 'No games scheduled today.' : 'No games match this filter.'}</p>`;
    return;
  }

  const days = groupGamesByDate(games);

  days.forEach(([dayKey, dayGames]) => {
    const isToday = dayKey === todayStr;
    const dayDate = dayKey === 'TBD' ? 'TBD' : new Date(dayKey + 'T12:00:00Z');
    const dayLabel = dayKey === 'TBD' ? 'TBD' : dayDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const collapseKey = 'q-' + dayKey;
    if (qFilter === 'all' && !(collapseKey in qCollapsed)) { qCollapsed[collapseKey] = dayKey < todayStr; }
    const isCollapsed = qFilter === 'all' && qCollapsed[collapseKey] === true;

    const filledCount = dayGames.filter(g => { const p = myQuinielaPicks[g.id]; return p && p.homeGoals !== '' && p.homeGoals !== undefined && p.awayGoals !== '' && p.awayGoals !== undefined; }).length;
    const resultCount = dayGames.filter(g => quinielaResults[g.id]).length;
    let badge = '';
    if (isToday) badge = ' 🟢 TODAY';
    if (resultCount > 0) badge += ` · ${resultCount}/${dayGames.length} results`;
    badge += ` · ${filledCount}/${dayGames.length} picked`;

    const hdr = document.createElement('div');
    hdr.className = 'q-day-header' + (isCollapsed ? ' collapsed' : '');
    hdr.dataset.qday = collapseKey;
    hdr.onclick = () => toggleQDay(collapseKey);
    hdr.innerHTML = `<span class="ev-day-chevron">▼</span><span class="ev-day-label">${dayLabel}<small>${dayGames.length} games${badge}</small></span>`;
    grid.appendChild(hdr);

    const body = document.createElement('div');
    body.className = 'q-day-body' + (isCollapsed ? ' collapsed' : '');
    body.dataset.qbody = collapseKey;

    dayGames.forEach(game => {
      const pick = myQuinielaPicks[game.id] || {};
      const result = quinielaResults[game.id];
      let pts = null;
      if (result && pick.homeGoals !== undefined && pick.awayGoals !== undefined) { pts = scoreGame(pick, result, game.phase); }
      const tip = getMatchTip(game.home, game.away);
      const kickTime = game.kickoff ? new Date(game.kickoff).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
      const groupLabel = game.phase === 'group' ? `Grp ${game.group}` : game.id;

      const div = document.createElement('div');
      div.className = 'q-game' + (pick.homeGoals!==undefined?' has-pick':'') + (pts===5?' exact-match':pts>=3?' correct-winner':pts===1?' partial-match':'') + (game.locked?' q-locked':'');
      div.innerHTML = `
        <div class="q-game-meta"><span class="q-grp-tag">${groupLabel}</span>${kickTime ? `<span class="q-kick-time">${kickTime}</span>` : ''}${game.locked ? '<span class="q-lock-icon">🔒</span>' : ''}</div>
        <div class="q-game-row">
          <div class="q-team home">${esc(game.home)}</div>
          <div class="q-score-wrap">
            <input class="q-score-input" type="number" min="0" max="20"
              id="q-h-${game.id}" value="${pick.homeGoals??''}" placeholder="${t('home_placeholder')}"
              data-game="${game.id}" data-side="h"/>
            <span class="q-dash">—</span>
            <input class="q-score-input" type="number" min="0" max="20"
              id="q-a-${game.id}" value="${pick.awayGoals??''}" placeholder="${t('away_placeholder')}"
              data-game="${game.id}" data-side="a"/>
            ${result ? `<span class="q-result-badge ${pts===5?'q-pts-5':pts===3?'q-pts-3':pts===1?'q-pts-1':'q-pts-0'}">${result.homeGoals}–${result.awayGoals} ${pts!==null?'(+'+pts+')':''}</span>` : ''}
          </div>
          <div class="q-team away">${esc(game.away)}</div>
        </div>
        ${!result && tip ? `<div class="q-tip">${tip}</div>` : ''}
      `;
      body.appendChild(div);
    });
    grid.appendChild(body);
  });

  updateProgress();
  grid.querySelectorAll('.q-score-input').forEach(inp => {
    inp.addEventListener('change', () => {
      const gameId = inp.dataset.game, side = inp.dataset.side;
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

// ── RESULTS: date-based rendering ────────────────────────────────────────────
let qrFilter = 'all';
let qrCollapsed = {};

function setQRFilter(f) { qrFilter = f; buildDateFilters('qr-filter-bar', qrFilter, 'setQRFilter'); renderQuinielaResultsGrid(); }

function toggleQRDay(key) {
  qrCollapsed[key] = !qrCollapsed[key];
  const hdr = document.querySelector(`[data-qday="${key}"]`);
  const body = document.querySelector(`[data-qbody="${key}"]`);
  if (hdr) hdr.classList.toggle('collapsed', qrCollapsed[key]);
  if (body) body.classList.toggle('collapsed', qrCollapsed[key]);
}

async function loadQuinielaResultsPanel() {
  const res = await fetch('/api/quiniela/results');
  const data = await res.json();
  quinielaResults = data.results || {};
  buildDateFilters('qr-filter-bar', qrFilter, 'setQRFilter');
  renderQuinielaResultsGrid();
}

function renderQuinielaResultsGrid() {
  const grid = document.getElementById('quiniela-results-grid');
  grid.innerHTML = '';
  const games = filterGamesByQ(qrFilter);
  const todayStr = new Date().toISOString().slice(0, 10);

  if (!games.length) {
    grid.innerHTML = `<p class="ev-empty">${qrFilter === 'today' ? 'No games scheduled today.' : 'No games match this filter.'}</p>`;
    return;
  }

  const days = groupGamesByDate(games);
  days.forEach(([dayKey, dayGames]) => {
    const isToday = dayKey === todayStr;
    const dayDate = dayKey === 'TBD' ? 'TBD' : new Date(dayKey + 'T12:00:00Z');
    const dayLabel = dayKey === 'TBD' ? 'TBD' : dayDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const collapseKey = 'qr-' + dayKey;
    if (qrFilter === 'all' && !(collapseKey in qrCollapsed)) { qrCollapsed[collapseKey] = dayKey < todayStr; }
    const isCollapsed = qrFilter === 'all' && qrCollapsed[collapseKey] === true;

    const resultCount = dayGames.filter(g => quinielaResults[g.id]).length;
    let badge = '';
    if (isToday) badge = ' 🟢 TODAY';
    badge += ` · ${resultCount}/${dayGames.length} entered`;

    const hdr = document.createElement('div');
    hdr.className = 'q-day-header' + (isCollapsed ? ' collapsed' : '');
    hdr.dataset.qday = collapseKey;
    hdr.onclick = () => toggleQRDay(collapseKey);
    hdr.innerHTML = `<span class="ev-day-chevron">▼</span><span class="ev-day-label">${dayLabel}<small>${dayGames.length} games${badge}</small></span>`;
    grid.appendChild(hdr);

    const body = document.createElement('div');
    body.className = 'q-day-body' + (isCollapsed ? ' collapsed' : '');
    body.dataset.qbody = collapseKey;

    dayGames.forEach(game => {
      const result = quinielaResults[game.id] || {};
      const kickTime = game.kickoff ? new Date(game.kickoff).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
      const groupLabel = game.phase === 'group' ? `Grp ${game.group}` : game.id;
      const hasResult = result.homeGoals !== undefined && result.homeGoals !== '';

      const div = document.createElement('div');
      div.className = 'q-game' + (hasResult ? ' has-result' : '');
      div.innerHTML = `
        <div class="q-game-meta"><span class="q-grp-tag">${groupLabel}</span>${kickTime ? `<span class="q-kick-time">${kickTime}</span>` : ''}</div>
        <div class="q-game-row">
          <div class="q-team home">${esc(game.home)}</div>
          <div class="q-score-wrap">
            <input class="q-score-input" type="number" min="0" max="20"
              id="qr-h-${game.id}" value="${result.homeGoals??''}" placeholder="H"/>
            <span class="q-dash">—</span>
            <input class="q-score-input" type="number" min="0" max="20"
              id="qr-a-${game.id}" value="${result.awayGoals??''}" placeholder="A"/>
          </div>
          <div class="q-team away">${esc(game.away)}</div>
        </div>
      `;
      body.appendChild(div);
    });
    grid.appendChild(body);
  });
}

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

// ── EVERYONE'S PICKS (transparency) ───────────────────────────────────────────
let evData = null;
let evFilter = 'all';
let evCollapsed = {};

async function loadEveryone() {
  const content = document.getElementById('everyone-content');
  content.innerHTML = '<p style="color:var(--text-2);padding:20px 0">Loading…</p>';
  try {
    const res = await authFetch('/api/picks/transparency');
    if (!res.ok) { content.innerHTML = '<p style="color:var(--red)">Could not load picks.</p>'; return; }
    evData = await res.json();
    renderEvScoreboard();
    renderEvFilters();
    renderEveryone();
  } catch(e) { content.innerHTML = `<p style="color:var(--red)">${e.message}</p>`; }
}

function evScoreGame(pick, result) {
  if (!pick || !result) return 0;
  const ph = parseInt(pick.homeGoals), pa = parseInt(pick.awayGoals);
  const rh = parseInt(result.homeGoals), ra = parseInt(result.awayGoals);
  if (isNaN(ph) || isNaN(pa) || isNaN(rh) || isNaN(ra)) return 0;
  if (ph === rh && pa === ra) return 5;
  const pOut = ph > pa ? 'H' : ph < pa ? 'A' : 'D';
  const rOut = rh > ra ? 'H' : rh < ra ? 'A' : 'D';
  if (pOut === rOut) return 3;
  if (ph === rh || pa === ra) return 1;
  return 0;
}

function renderEvScoreboard() {
  const el = document.getElementById('ev-scoreboard');
  if (!el || !evData) return;
  const { players, games } = evData;
  const scored = games.filter(g => g.locked && g.result);

  const stats = players.map(p => {
    let pts = 0, exact = 0, correct = 0, wrong = 0, pending = 0;
    games.forEach(g => {
      if (!g.locked) return;
      const pick = g.playerPicks?.[p.id];
      if (!g.result) { if (pick) pending++; return; }
      if (!pick) { wrong++; return; }
      const s = evScoreGame(pick, g.result);
      pts += s;
      if (s === 5) exact++;
      else if (s >= 3) correct++;
      else wrong++;
    });
    return { ...p, pts, exact, correct, wrong, pending };
  });
  stats.sort((a, b) => b.pts - a.pts);
  const topPts = stats[0]?.pts || 0;

  el.innerHTML = '<div class="ev-scoreboard">' + stats.map(s => {
    const isLeader = s.pts > 0 && s.pts === topPts;
    return `<div class="ev-sb-card${isLeader ? ' ev-sb-leader' : ''}">
      <div class="ev-sb-avatar">${s.avatar}</div>
      <div class="ev-sb-name">${s.name.split(' ')[0]}</div>
      <div class="ev-sb-pts">${s.pts}</div>
      <div class="ev-sb-stats">
        <span class="ev-sb-stat" title="Exact 5pt">🎯<b>${s.exact}</b></span>
        <span class="ev-sb-stat" title="Correct">✓<b>${s.correct}</b></span>
        <span class="ev-sb-stat" title="Wrong">✗<b>${s.wrong}</b></span>
      </div>
    </div>`;
  }).join('') + '</div>';
}

function renderEvFilters() {
  const el = document.getElementById('ev-filters'); if (!el) return;
  const groups = [...new Set(evData.games.filter(g => g.phase === 'group').map(g => g.group))].sort();
  let html = `<button class="ev-filter-btn ${evFilter==='all'?'active':''}" onclick="setEvFilter('all')">All</button>`;
  html += `<button class="ev-filter-btn ${evFilter==='today'?'active':''}" onclick="setEvFilter('today')">Today</button>`;
  groups.forEach(g => { html += `<button class="ev-filter-btn ${evFilter===g?'active':''}" onclick="setEvFilter('${g}')">Grp ${g}</button>`; });
  html += `<button class="ev-filter-btn ${evFilter==='ko'?'active':''}" onclick="setEvFilter('ko')">KO</button>`;
  el.innerHTML = html;
}

function setEvFilter(f) { evFilter = f; renderEvFilters(); renderEveryone(); }
function toggleEvDay(key) {
  evCollapsed[key] = !evCollapsed[key];
  const hdr = document.querySelector(`[data-ev-day="${key}"]`);
  const body = document.querySelector(`[data-ev-body="${key}"]`);
  if (hdr) hdr.classList.toggle('collapsed', evCollapsed[key]);
  if (body) body.classList.toggle('collapsed', evCollapsed[key]);
}

function renderEveryone() {
  const content = document.getElementById('everyone-content'); if (!content || !evData) return;
  const { players, games } = evData;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Filter games
  let filtered;
  if (evFilter === 'all') filtered = games;
  else if (evFilter === 'ko') filtered = games.filter(g => g.phase !== 'group');
  else if (evFilter === 'today') filtered = games.filter(g => g.kickoff && g.kickoff.slice(0, 10) === todayStr);
  else filtered = games.filter(g => g.group === evFilter);

  // Check if tournament has started
  const hasLocked = games.some(g => g.locked);
  if (!hasLocked && evFilter !== 'today') {
    content.innerHTML = `<div class="ev-placeholder">
      <div class="ev-placeholder-icon">🔒</div>
      <div class="ev-placeholder-title">Picks reveal on June 11</div>
      <div class="ev-placeholder-sub">The moment the first game kicks off, everyone's predictions appear here automatically. Come back after the opening whistle.</div>
    </div>`;
    return;
  }

  if (!filtered.length) {
    content.innerHTML = '<p class="ev-empty">No games match this filter.</p>';
    return;
  }

  // Group by date
  const dayMap = new Map();
  filtered.forEach(g => {
    const dayKey = g.kickoff ? g.kickoff.slice(0, 10) : 'TBD';
    if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
    dayMap.get(dayKey).push(g);
  });

  // Sort days chronologically
  const sortedDays = [...dayMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  // Default collapse: past days collapsed (unless filter is specific group/today), today + future open
  if (evFilter === 'all') {
    sortedDays.forEach(([dayKey]) => {
      if (!(dayKey in evCollapsed)) {
        evCollapsed[dayKey] = dayKey < todayStr;
      }
    });
  }

  let html = '';

  sortedDays.forEach(([dayKey, dayGames]) => {
    const isCollapsed = evCollapsed[dayKey] === true;
    const dayDate = dayKey === 'TBD' ? 'TBD' : new Date(dayKey + 'T12:00:00Z');
    const dayLabel = dayKey === 'TBD' ? 'TBD'
      : dayDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const isToday = dayKey === todayStr;
    const lockedCount = dayGames.filter(g => g.locked).length;
    const resultCount = dayGames.filter(g => g.result).length;

    let badge = '';
    if (isToday) badge = ' 🟢 TODAY';
    else if (resultCount === dayGames.length) badge = ` · ${resultCount} played`;
    else if (lockedCount > 0) badge = ` · ${resultCount}/${dayGames.length} results`;

    html += `<div class="ev-day-section">`;
    html += `<div class="ev-day-header${isCollapsed ? ' collapsed' : ''}" data-ev-day="${dayKey}" onclick="toggleEvDay('${dayKey}')">`;
    html += `<span class="ev-day-chevron">▼</span>`;
    html += `<span class="ev-day-label">${dayLabel}<small>${dayGames.length} games${badge}</small></span>`;
    html += `</div>`;
    html += `<div class="ev-day-body${isCollapsed ? ' collapsed' : ''}" data-ev-body="${dayKey}">`;

    // Build table
    html += `<table class="ev-table"><thead><tr>`;
    html += `<th style="text-align:left;min-width:160px">Match</th>`;
    html += `<th>Result</th>`;
    players.forEach(p => {
      html += `<th class="ev-player-th"><div class="ev-player-th-inner"><span class="ev-player-th-av">${p.avatar}</span><span class="ev-player-th-name">${p.name.split(' ')[0]}</span></div></th>`;
    });
    html += `</tr></thead><tbody>`;

    dayGames.forEach(g => {
      const grpLabel = g.phase === 'group' ? `Grp ${g.group}` : g.id;
      html += `<tr${!g.locked ? ' class="ev-upcoming-row"' : ''}>`;
      // Match info
      html += `<td><div class="ev-match-cell"><span class="ev-grp-badge">${grpLabel}</span><span class="ev-teams">${g.home} <span class="ev-vs">v</span> ${g.away}</span></div></td>`;
      // Result
      html += `<td class="ev-result-cell">`;
      if (g.result) {
        html += `<span class="ev-official">${g.result.homeGoals}–${g.result.awayGoals}</span>`;
      } else if (g.locked) {
        html += `<span class="ev-live">LIVE</span>`;
      } else {
        const t = g.kickoff ? new Date(g.kickoff).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—';
        html += `<span class="ev-no-result">🔒 ${t}</span>`;
      }
      html += `</td>`;

      // Player picks
      players.forEach(p => {
        if (!g.locked) {
          // Not started: show submitted badge
          const sub = g.submitted?.includes(p.id);
          html += `<td class="ev-pick-cell"><span class="ev-sub-badge ${sub ? 'ev-sub-yes' : 'ev-sub-no'}">${sub ? '✓' : '·'}</span></td>`;
        } else {
          const pick = g.playerPicks?.[p.id];
          if (!pick) {
            html += `<td class="ev-pick-cell ev-c-nopick">—</td>`;
          } else {
            const score = `${pick.homeGoals}–${pick.awayGoals}`;
            if (!g.result) {
              html += `<td class="ev-pick-cell ev-c-pending">${score}</td>`;
            } else {
              const pts = evScoreGame(pick, g.result);
              let cls = 'ev-c-wrong';
              if (pts === 5) cls = 'ev-c-exact';
              else if (pts === 3) cls = 'ev-c-correct';
              else if (pts === 1) cls = 'ev-c-partial';
              html += `<td class="ev-pick-cell ${cls}">${score}${pts > 0 ? `<span class="ev-pts-sub">+${pts}</span>` : ''}</td>`;
            }
          }
        }
      });

      html += `</tr>`;
    });

    html += `</tbody></table></div></div>`;
  });

  content.innerHTML = html;
}

// ── NOTIFICATION EMAIL PROMPT ─────────────────────────────────────────────────
function showNotifPrompt() {
  if (localStorage.getItem('copa26_notif_dismissed')) return;
  const el = document.getElementById('notif-prompt');
  if (el) el.classList.remove('hidden');
}
function dismissNotifPrompt() {
  localStorage.setItem('copa26_notif_dismissed', '1');
  const el = document.getElementById('notif-prompt');
  if (el) el.classList.add('hidden');
}
async function saveNotifEmail() {
  const input = document.getElementById('notif-email');
  const email = input?.value?.trim();
  if (!email || !email.includes('@')) { input.focus(); return; }
  try {
    const r = await authFetch('/api/user/email', { method:'POST', body: JSON.stringify({ email }) });
    if (r.ok) {
      showToast('✓ Email saved — you\'ll get game notifications!');
      dismissNotifPrompt();
    } else { showToast('❌ Could not save email'); }
  } catch(e) { showToast('❌ '+e.message); }
}

// ── SCORE SYNC (admin) ────────────────────────────────────────────────────────
function fmtSyncStatus(s){
  if(!s || !s.at) return 'Auto-syncs every 30 min during match days.';
  const when = new Date(s.at).toLocaleString();
  if(s.error) return `⚠️ Last sync failed: ${s.error} (${when})`;
  return `✓ Last sync: ${s.updated} updated · ${s.finishedSeen} finished seen`
       + (s.skippedManual ? ` · ${s.skippedManual} manual kept` : '')
       + ` (${when})`;
}
async function loadSyncStatus(){
  const el=document.getElementById('sync-status'); if(!el) return;
  try{
    const r=await authFetch('/api/admin/sync/status'); if(!r.ok) return;
    const s=await r.json();
    el.textContent=fmtSyncStatus(s);
    el.className='sync-status'+(s.error?' err':(s.at?' ok':''));
  }catch(e){}
}
document.getElementById('btn-test-email')?.addEventListener('click', async () => {
  const email = window.prompt('Send test email to:', '');
  if (!email?.includes('@')) return;
  const btn = document.getElementById('btn-test-email');
  const orig = btn.textContent; btn.disabled = true; btn.textContent = '⏳ Sending…';
  try {
    const r = await authFetch('/api/admin/test-email', { method:'POST', body: JSON.stringify({ to: email }) });
    const d = await r.json();
    showToast(d.success ? `✓ Test email sent to ${d.sentTo}` : `❌ ${d.error}`);
  } catch(e) { showToast('❌ ' + e.message); }
  btn.disabled = false; btn.textContent = orig;
});

document.getElementById('btn-sync-now')?.addEventListener('click', async ()=>{
  const btn=document.getElementById('btn-sync-now');
  const el=document.getElementById('sync-status');
  const orig=btn.textContent; btn.disabled=true; btn.textContent='⏳ Syncing…';
  try{
    const r=await authFetch('/api/admin/sync',{method:'POST'});
    const s=await r.json();
    if(el){ el.textContent=fmtSyncStatus(s); el.className='sync-status'+(s.error?' err':' ok'); }
    showToast(s.error ? ('❌ '+s.error) : `✓ Synced — ${s.updated} game${s.updated===1?'':'s'} updated`);
    if(!s.error && s.updated>0 && typeof loadLeaderboard==='function') loadLeaderboard();
  }catch(e){ showToast('❌ '+e.message); }
  btn.disabled=false; btn.textContent=orig;
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────
async function loadAdmin() {
  ensureAdminSecret();
  loadKnockoutTeams();
  loadSyncStatus();
  let res = await authFetch('/api/admin/players');
  if (res.status === 403 || res.status === 503) {
    // wrong/missing secret — clear and ask again once
    localStorage.removeItem('copa26_admin');
    if (ensureAdminSecret()) res = await authFetch('/api/admin/players');
  }
  if (!res.ok) {
    document.getElementById('admin-players').innerHTML =
      '<p style="color:var(--text-2)">Admin access denied. Refresh and enter the correct admin secret.</p>';
    return;
  }
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
function closeConfirm() { document.getElementById('confirm-modal').classList.add('hidden'); }
document.getElementById('confirm-ok').addEventListener('click', async () => {
  const cb = confirmCallback;
  confirmCallback = null;
  closeConfirm();
  if (cb) { await cb(); }
});

// ── SCORING (mirrors server logic) ────────────────────────────────────────────
function scoreGame(pick, result, phase) {
  if (!pick || !result) return null;
  const ph = parseInt(pick.homeGoals), pa = parseInt(pick.awayGoals);
  const rh = parseInt(result.homeGoals), ra = parseInt(result.awayGoals);
  if (isNaN(ph)||isNaN(pa)||isNaN(rh)||isNaN(ra)) return null;
  // Exact score → 5 pts
  if (ph === rh && pa === ra) return 5;
  // Correct outcome → 3 pts
  if (getOutcome(ph,pa) === getOutcome(rh,ra)) return 3;
  // One team's goals right but wrong outcome → 1 pt
  if (ph === rh || pa === ra) return 1;
  return 0;  // max 5 per game
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

// ── GROUPS STANDINGS ──────────────────────────────────────────────────────────
let groupsCache = null;
async function loadGroups() {
  const el = document.getElementById('groups-content');
  if (!el) return;
  el.innerHTML = '<p style="text-align:center;color:var(--muted)">Loading...</p>';
  try {
    const res = await fetch('/api/groups/standings');
    groupsCache = await res.json();
    renderGroups();
  } catch(e) { el.innerHTML = `<p class="text-muted">❌ ${e.message}</p>`; }
}

function renderGroups() {
  const el = document.getElementById('groups-content');
  if (!groupsCache) return;
  const { standings, schedule, groups } = groupsCache;
  const isEs = currentLang === 'es';
  let html = '<div class="groups-grid">';

  for (const group of groups) {
    const rows = standings[group];
    const games = schedule[group] || [];
    html += `<div class="group-card">`;
    html += `<div class="group-header">${isEs ? 'Grupo' : 'Group'} ${group}</div>`;

    // Standings table
    html += `<table class="group-table"><thead><tr>
      <th class="team-col">${isEs ? 'Equipo' : 'Team'}</th>
      <th>MP</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th class="pts-col">Pts</th>
    </tr></thead><tbody>`;
    rows.forEach((r, i) => {
      const cls = i < 2 ? ' class="qualify"' : (i === 2 ? ' class="playoff"' : '');
      html += `<tr${cls}>
        <td class="team-col">${r.team}</td>
        <td>${r.mp}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
        <td>${r.gf}</td><td>${r.ga}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td>
        <td class="pts-col"><strong>${r.pts}</strong></td>
      </tr>`;
    });
    html += '</tbody></table>';

    // Match results
    html += '<div class="group-matches">';
    games.forEach(g => {
      const ko = g.kickoff ? new Date(g.kickoff) : null;
      const koStr = ko ? ko.toLocaleDateString('en-US', { month:'short', day:'numeric' }) + ' ' +
        ko.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) : '';
      if (g.result) {
        html += `<div class="group-match played">
          <span class="gm-team">${g.home}</span>
          <span class="gm-score">${g.result.homeGoals} – ${g.result.awayGoals}</span>
          <span class="gm-team r">${g.away}</span>
        </div>`;
      } else {
        html += `<div class="group-match upcoming">
          <span class="gm-team">${g.home}</span>
          <span class="gm-time">${koStr || 'TBD'}</span>
          <span class="gm-team r">${g.away}</span>
        </div>`;
      }
    });
    html += '</div></div>';
  }
  html += '</div>';
  el.innerHTML = html;
}

// ── ADMIN: Email blast button ─────────────────────────────────────────────────
const EMAIL_TEMPLATES = {
  welcome: {
    subject: '⚽ Copa 26 — The World Cup starts tomorrow! Your quiniela is live',
    build: (lb) => `
      <h2>⚽ Welcome to Copa 26!</h2>
      <p>The World Cup 2026 starts <strong>tomorrow, June 11</strong> with Mexico vs South Africa!</p>
      <p>Make sure your predictions are in before kickoff — once a game starts, your pick locks. 🔒</p>
      <div class="banner">🎯 Scoring: Exact score <strong>+5</strong> · Correct winner <strong>+3</strong> · One team right <strong>+1</strong> · Max <strong>5/game</strong></div>
      <p>Good luck to everyone — and remember: <em>no crying in quiniela.</em></p>
      ${buildStandingsHtml(lb)}
    `,
  },
  predictions: {
    subject: '🔒 Copa 26 — Submit your predictions before kickoff!',
    build: (lb) => `
      <h2>🎯 Don't forget your predictions!</h2>
      <p>Games are coming up and some of you haven't submitted predictions yet. Once a match kicks off, your pick for that game <strong>locks permanently</strong>.</p>
      <div class="banner">⏰ Go to the <strong>Quiniela</strong> tab, fill in your scores, and hit <strong>Save</strong>. Takes 5 minutes.</div>
      <p>Remember: <strong>3 pts</strong> for guessing the correct winner, <strong>5 pts</strong> for the exact score in knockout rounds.</p>
      <p>Don't give free points to everyone else — get your picks in!</p>
      ${buildStandingsHtml(lb)}
    `,
  },
  results: {
    subject: '📊 Copa 26 — Today\'s results are in!',
    build: (lb) => `
      <h2>⚽ Today's results are in!</h2>
      <p>Another day of World Cup action is in the books. Check the standings below to see where you stand.</p>
      ${buildStandingsHtml(lb)}
      <p>Think you can climb higher? Make sure your upcoming predictions are locked in!</p>
    `,
  },
};

function buildStandingsHtml(lb) {
  if (!lb?.leaderboard?.length) return '';
  return `<h2>📊 Current Standings</h2>` +
    lb.leaderboard.map((p, i) =>
      `<div class="lbr"><div class="rk">${i+1}</div><div class="nm">${p.avatar} ${p.name}</div><div class="pt">${p.totalPts} pts</div></div>`
    ).join('');
}

document.getElementById('btn-send-blast')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-send-blast');

  // Pick email type
  const type = await new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px;max-width:340px;width:90%;">
        <h3 style="margin:0 0 16px;font-size:16px;color:var(--text);">Choose email to send</h3>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button class="btn-green" data-type="welcome" style="width:100%;">⚽ Welcome / Kickoff</button>
          <button class="btn-green" data-type="predictions" style="width:100%;background:#b8860b;">🎯 Submit Predictions Reminder</button>
          <button class="btn-green" data-type="results" style="width:100%;background:#1B55B8;">📊 Today's Results</button>
          <button class="btn-ghost" data-type="" style="width:100%;margin-top:4px;">Cancel</button>
        </div>
      </div>`;
    overlay.addEventListener('click', (e) => {
      const t = e.target.closest('[data-type]');
      if (t) { overlay.remove(); resolve(t.dataset.type); }
    });
    document.body.appendChild(overlay);
  });

  if (!type) return;

  // Check recipients
  try {
    const r = await authFetch('/api/admin/emails');
    const data = await r.json();
    if (!data.total) { showToast('❌ No users have provided emails yet'); return; }
    const names = data.emails.map(e => `${e.name} (${e.email})`).join('\n');
    const ok = window.confirm(
      `Send "${type}" email to ${data.total} recipient(s)?\n\n${names}\n\nProceed?`
    );
    if (!ok) return;
  } catch(e) { showToast('❌ ' + e.message); return; }

  btn.disabled = true; btn.textContent = '📤 Sending...';
  try {
    const lb = await (await fetch('/api/leaderboard')).json();
    const template = EMAIL_TEMPLATES[type];

    const r = await authFetch('/api/admin/send-blast', {
      method: 'POST',
      body: JSON.stringify({
        subject: template.subject,
        html: template.build(lb),
      }),
    });
    const data = await r.json();
    if (data.success) {
      showToast(`✅ "${type}" email sent to ${data.sentTo} recipient(s)!`);
    } else {
      showToast('❌ ' + (data.error || 'Failed'));
    }
  } catch(e) { showToast('❌ ' + e.message); }
  btn.disabled = false; btn.textContent = '📨 Send Email';
});

// ── MATCH PREDICTIONS / TIPS ──────────────────────────────────────────────────
// FIFA ranking tiers + predicted scores based on strength gap
const TEAM_STRENGTH = {
  'Argentina':95,'France':94,'Brazil':92,'England':91,'Spain':91,'Germany':90,'Portugal':90,
  'Netherlands':88,'Belgium':87,'Italy':86,'Croatia':86,'Colombia':85,'Uruguay':85,
  'USA':83,'Mexico':82,'Switzerland':82,'Japan':82,'Senegal':81,'Morocco':81,
  'Denmark':81,'Austria':80,'Turkiye':80,'Serbia':79,'Ecuador':79,'Wales':78,
  'Iran':78,'Australia':77,'South Korea':77,'Korea Republic':77,'Canada':77,
  'Tunisia':76,'Ivory Coast':76,'Cameroon':76,'Nigeria':76,'Saudi Arabia':75,
  'Ghana':75,'Egypt':75,'Algeria':75,'Paraguay':74,'Bosnia and Herzegovina':74,
  'Scotland':74,'Norway':74,'Sweden':74,'Czechia':73,'Panama':72,'DR Congo':72,
  'Jordan':70,'Uzbekistan':70,'Iraq':70,'New Zealand':68,'Curacao':65,
  'Haiti':64,'Cabo Verde':64,'South Africa':72,
};

function getMatchTip(home, away) {
  const hStr = TEAM_STRENGTH[home] || 70;
  const aStr = TEAM_STRENGTH[away] || 70;
  const diff = hStr - aStr;
  const isEs = currentLang === 'es';

  let prediction, confidence;

  if (Math.abs(diff) <= 3) {
    // Very close — predict draw or slim win
    if (diff >= 0) {
      prediction = '1-1';
      confidence = isEs ? 'Parejo' : 'Toss-up';
    } else {
      prediction = '0-1';
      confidence = isEs ? 'Parejo' : 'Toss-up';
    }
  } else if (diff > 3 && diff <= 8) {
    prediction = '1-0';
    confidence = isEs ? `Ligera ventaja ${home}` : `Slight edge ${home}`;
  } else if (diff > 8 && diff <= 15) {
    prediction = '2-0';
    confidence = isEs ? `Favorito: ${home}` : `Favored: ${home}`;
  } else if (diff > 15) {
    prediction = '3-0';
    confidence = isEs ? `Gran favorito: ${home}` : `Strong favorite: ${home}`;
  } else if (diff < -3 && diff >= -8) {
    prediction = '0-1';
    confidence = isEs ? `Ligera ventaja ${away}` : `Slight edge ${away}`;
  } else if (diff < -8 && diff >= -15) {
    prediction = '0-2';
    confidence = isEs ? `Favorito: ${away}` : `Favored: ${away}`;
  } else {
    prediction = '0-3';
    confidence = isEs ? `Gran favorito: ${away}` : `Strong favorite: ${away}`;
  }

  return `💡 ${confidence} · ${isEs ? 'Sugerencia' : 'Tip'}: <strong>${prediction}</strong>`;
}

// ── GO ────────────────────────────────────────────────────────────────────────
init();
