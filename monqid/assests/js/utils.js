/* ═══════════════════════════════════════
   Monqid — Shared Utilities
   assets/js/utils.js
═══════════════════════════════════════ */

/* ── Toast notification ── */
let _toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ── Mobile menu (shared across all pages) ── */
function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const drawer = document.getElementById('mobileDrawer');
  if (!toggle || !drawer) return;

  toggle.addEventListener('click', function () {
    const isOpen = drawer.classList.toggle('open');
    this.textContent = isOpen ? '✕' : '☰';
  });

  document.addEventListener('click', function (e) {
    if (drawer.classList.contains('open') && !drawer.contains(e.target) && e.target !== toggle) {
      drawer.classList.remove('open');
      toggle.textContent = '☰';
    }
  });
}

/* ── Theme toggle ── */
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = isLight ? '🌙' : '☀️';
  localStorage.setItem('monqid-theme', isLight ? 'light' : 'dark');
}

function initTheme() {
  if (localStorage.getItem('monqid-theme') === 'light') {
    document.body.classList.add('light-mode');
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = '🌙';
  }
}

/* ── Nav badge count ── */
function updateNavBadge() {
  const requests = JSON.parse(localStorage.getItem('monqid-requests') || '[]');
  const count = requests.length;
  document.querySelectorAll('.nav-badge').forEach(el => {
    el.textContent = count;
  });
}

/* ── Counter animation ── */
function animateCounter(el, target, duration = 1800) {
  if (!el) return;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(ease * target).toLocaleString('ar-MA');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

/* ── Number animation (short) ── */
function animateNum(el, target, duration = 600) {
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const begin = performance.now();
  const tick = (now) => {
    const p = Math.min((now - begin) / duration, 1);
    el.textContent = Math.round(start + (target - start) * p);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ── Share helper ── */
function shareText(title, text) {
  if (navigator.share) {
    navigator.share({ title, text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => showToast('تم النسخ 📋'));
  }
}

/* ── Date formatter ── */
function fmtDate(d) {
  return new Date(d).toLocaleDateString('ar-MA', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

/* ── Auto-init on DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initTheme();
  updateNavBadge();
});