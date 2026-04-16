/* ═══════════════════════════════════════
   Monqid — Profile Page
   assests/js/profil.js
═══════════════════════════════════════ */

const API = '../backend/handlers/api.php';
let isAvailable = true;

// ════════════════════════════════════════
// تحميل بيانات المستخدم من API
// ════════════════════════════════════════
async function loadProfile() {
  const userId = localStorage.getItem('monqid-user-id');

  if (!userId) {
    // مستخدم غير مسجل — إظهار رسالة
    const hint = document.getElementById('prof-guest-hint');
    if (hint) hint.style.display = 'block';
    const detail = document.getElementById('prof-detail');
    if (detail) detail.style.display = 'none';
    return;
  }

  try {
    const res  = await fetch(`${API}?action=profile&id=${userId}`);
    const data = await res.json();

    if (data.success) {
      const u = data.data;

      // تحديث عناصر الـ UI
      const nameEl    = document.getElementById('prof-name');
      const cityEl    = document.getElementById('prof-city');
      const bloodEl   = document.getElementById('prof-blood');
      const emailEl   = document.getElementById('prof-email');
      const phoneEl   = document.getElementById('prof-phone');
      const addrEl    = document.getElementById('prof-address');
      const detailEl  = document.getElementById('prof-detail');
      const guestHint = document.getElementById('prof-guest-hint');

      if (nameEl)    nameEl.textContent  = u.full_name  || '—';
      if (cityEl)    cityEl.innerHTML    = `📍 ${u.city || '—'}`;
      if (bloodEl)   bloodEl.innerHTML   = `🩸 ${u.blood_type || '—'}`;
      if (emailEl)   emailEl.textContent = u.email    || '—';
      if (phoneEl)   phoneEl.textContent = u.phone    || '—';
      if (addrEl)    addrEl.textContent  = u.address  || '—';
      if (detailEl)  detailEl.style.display  = 'block';
      if (guestHint) guestHint.style.display = 'none';
    }
  } catch (e) {
    console.warn('تعذر تحميل الملف الشخصي:', e);
  }
}

// ════════════════════════════════════════
// تحميل الطلبات القريبة
// ════════════════════════════════════════
async function loadNearbyRequests() {
  try {
    const res  = await fetch(`${API}?action=requests`);
    const data = await res.json();

    const container = document.getElementById('cards-container');
    const emptyEl   = document.getElementById('empty-state');
    if (!container) return;

    if (!data.success || !data.data.length) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    const urgLabel = { critical: 'حرجة', high: 'عاجلة', normal: 'عادية' };
    const urgCls   = { critical: 'critical', high: 'urgent', normal: 'done' };

    container.innerHTML = data.data.map(r => `
      <div class="req-card" data-urgency="${urgCls[r.urgency] || 'done'}">
        <div class="card-top">
          <div class="blood-badge">🩸 ${r.blood}</div>
          <div class="urgency-tag ${r.urgency}">${urgLabel[r.urgency] || r.urgency}</div>
        </div>
        <div class="card-name">${r.name}</div>
        <div class="card-sub">${r.hospital}</div>
        <div class="card-meta">
          <div class="meta-row"><i class="fa fa-map-marker-alt"></i> ${r.city}</div>
          <div class="meta-row"><i class="fa fa-tint"></i> ${r.bags} أكياس</div>
        </div>
        <div class="card-actions">
          <button class="btn-donate" onclick="callDonor('${r.phone}')">
            <i class="fa fa-phone"></i> التواصل للتبرع
          </button>
        </div>
      </div>`).join('');

    if (emptyEl) emptyEl.style.display = 'none';
    updateVisibleCount(data.data.length);
  } catch (e) {
    console.warn('تعذر تحميل الطلبات:', e);
  }
}

function callDonor(phone) {
  window.location.href = `tel:${phone}`;
}

// ════════════════════════════════════════
// تبديل حالة التوفر
// ════════════════════════════════════════
function toggleStatus() {
  isAvailable = !isAvailable;
  const lbl   = document.getElementById('statusLbl');
  const btn   = document.getElementById('statusBtn');
  const dot   = document.getElementById('statusDot');
  const avDot = document.getElementById('avatarDot');

  if (isAvailable) {
    if (lbl)   lbl.textContent       = 'متاح';
    if (btn) { btn.style.background  = 'rgba(34,197,94,0.12)'; btn.style.color = 'var(--green)'; }
    if (dot)   dot.style.animation   = 'blink 1.4s ease infinite';
    avDot?.classList.remove('offline');
  } else {
    if (lbl)   lbl.textContent       = 'غير متاح';
    if (btn) { btn.style.background  = 'rgba(136,136,136,0.1)'; btn.style.color = 'var(--muted)'; }
    if (dot) { dot.style.animation   = 'none'; dot.style.opacity = '0.5'; }
    avDot?.classList.add('offline');
  }
}

// ════════════════════════════════════════
// فلترة الكروت
// ════════════════════════════════════════
function filterCards(type, tabEl) {
  document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');

  let visible = 0;
  document.querySelectorAll('#cards-container .req-card').forEach(card => {
    const match = type === 'all' || card.dataset.urgency === type;
    card.style.display = match ? '' : 'none';
    if (match) visible++;
  });

  const empty = document.getElementById('empty-state');
  if (empty) empty.style.display = visible === 0 ? 'block' : 'none';
  updateVisibleCount(visible);
}

function updateVisibleCount(count) {
  const el = document.getElementById('visible-count');
  if (!el) return;
  const n = count !== undefined
    ? count
    : document.querySelectorAll('#cards-container .req-card').length;
  el.textContent = n + ' طلبات';
}

// ════════════════════════════════════════
// DOMContentLoaded
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  loadNearbyRequests();
  updateVisibleCount(0);
});