// ── SECTION SWITCHER ──
function scrollToId(id) {
  const target = document.getElementById(id);
  if (!target) return;
  // hide all page sections
  document.querySelectorAll('.page-view').forEach(s => s.classList.remove('active'));
  // show the target section
  target.classList.add('active');
  // reset scroll to top instantly
  window.scrollTo(0, 0);
  // update sidebar active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-target') === id);
  });
  if (window.innerWidth <= 800) document.getElementById('sidebar').classList.remove('open');
}

// ── HERO CANVAS ──
function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  const branches = [
    { y: 0.25, color: '#3fb950', commits: [0.08, 0.22, 0.38, 0.55, 0.72, 0.88] },
    { y: 0.50, color: '#58a6ff', commits: [0.05, 0.18, 0.32, 0.48, 0.65, 0.80, 0.95] },
    { y: 0.75, color: '#f0883e', commits: [0.12, 0.28, 0.45, 0.62, 0.78] },
  ];
  const merges = [{ from: 0, to: 1, atX: 0.38 }, { from: 2, to: 1, atX: 0.62 }];
  let offset = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    ctx.globalAlpha = isDark ? 0.2 : 0.12;
    branches.forEach(b => {
      const y = canvas.height * b.y;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
      ctx.strokeStyle = b.color; ctx.lineWidth = 1.5; ctx.stroke();
      b.commits.forEach(cx => {
        const x = ((cx + offset) % 1.05) * canvas.width;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#0d1117' : '#ffffff'; ctx.fill();
        ctx.strokeStyle = b.color; ctx.lineWidth = 1.5; ctx.stroke();
      });
    });
    merges.forEach(m => {
      const x = ((m.atX + offset) % 1.05) * canvas.width;
      const y1 = canvas.height * branches[m.from].y;
      const y2 = canvas.height * branches[m.to].y;
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2);
      ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.stroke();
      ctx.setLineDash([]);
    });
    offset = (offset + 0.0003) % 1;
    requestAnimationFrame(draw);
  }
  draw();
}

// ── PIPELINE SIMULATION ──
function runPipeline() {
  const stages = document.querySelectorAll('#ciPipeline .pl-stage[data-idx]');
  stages.forEach(s => { s.classList.remove('active'); });
  let i = 0;
  function next() {
    if (i >= stages.length) return;
    stages[i].classList.add('active');
    i++;
    setTimeout(next, 600);
  }
  next();
}

// ── ER ROOM TOGGLE ──
function toggleER(header) {
  header.parentElement.classList.toggle('open');
}

// ── THEME ──
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeIcon').textContent = isDark ? '🌙' : '☀️';
  document.getElementById('themeLabel').textContent = isDark ? 'Switch to Dark Mode' : 'Switch to Light Mode';
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

// ── COPY BUTTONS ──
function copyCode(btn) {
  const pre = btn.closest('pre') || btn.parentElement.querySelector('pre');
  const text = pre ? pre.innerText.replace(/^Copy\n?/, '').trim() : '';
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓ Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  });
}

// ── COLLAPSIBLE ──
function toggleCollapse(header) {
  header.parentElement.classList.toggle('open');
}

// ── TASK CHECKLIST ──
function toggleTask(li) {
  li.classList.toggle('done');
  if (li.classList.contains('done')) li.querySelector('.cb').textContent = '✓';
  else li.querySelector('.cb').textContent = '';
  saveProgress();
  updateProgress();
}

// ── PROGRESS ──
const isPycharm = window.location.pathname.includes('pycharm-guide');
const PROGRESS_KEY = isPycharm ? 'pycharm-guide-progress' : 'git-guide-progress';
const MODULES = ['m0','m1','m2','m3','m4','m5','m6','m7'];
function getModuleDone(id) {
  const ul = document.getElementById('tasks-' + id);
  if (!ul) return false;
  const items = ul.querySelectorAll('li');
  const done = ul.querySelectorAll('li.done');
  return items.length > 0 && done.length === items.length;
}

function updateProgress() {
  let count = 0;
  MODULES.forEach(id => {
    const isDone = getModuleDone(id);
    const navItem = document.querySelector(`[data-target="${id}"]`);
    if (isDone) { count++; if (navItem) navItem.classList.add('done'); }
    else { if (navItem) navItem.classList.remove('done'); }
  });
  const pct = Math.round((count / MODULES.length) * 100);
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = `${count} of ${MODULES.length} modules complete`;
  document.getElementById('finish').style.display = count === MODULES.length ? 'block' : 'none';
}

// ── PERSIST ──
function saveProgress() {
  const state = {};
  document.querySelectorAll('.checklist').forEach(ul => {
    const id = ul.id;
    state[id] = [];
    ul.querySelectorAll('li').forEach((li, i) => {
      if (li.classList.contains('done')) state[id].push(i);
    });
  });
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
}

function loadProgress() {
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    Object.entries(state).forEach(([id, indices]) => {
      const ul = document.getElementById(id);
      if (!ul) return;
      indices.forEach(i => {
        const li = ul.querySelectorAll('li')[i];
        if (li) { li.classList.add('done'); li.querySelector('.cb').textContent = '✓'; }
      });
    });
  } catch(e) {}
  updateProgress();
}

// ── SIDEBAR ACTIVE ──
const navItems = document.querySelectorAll('.nav-item');

function updateActive() {
  const active = document.querySelector('.page-view.active');
  const currentId = active ? active.id : '';
  navItems.forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-target') === currentId);
  });
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    scrollToId(item.getAttribute('data-target'));
  });
});

// ── MOBILE ──
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (savedTheme === 'light') {
    document.getElementById('themeIcon').textContent = '🌙';
    document.getElementById('themeLabel').textContent = 'Switch to Dark Mode';
  }
  // Load progress
  loadProgress();
  updateActive();
  initHeroCanvas();
  // Wire up all copy buttons inside pre tags
  document.querySelectorAll('pre').forEach(pre => {
    if (!pre.querySelector('.copy-btn')) {
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.onclick = function() { copyCode(this); };
      pre.appendChild(btn);
    }
  });
});
