/* ═══════════════════════════════════════
   Monqid — Campaigns Page
   assests/js/campaigns.js
═══════════════════════════════════════ */

const API = '../backend/handlers/api.php';
let selectedBloods = [];

// ════════════════════════════════════════
// تحميل الحملات من قاعدة البيانات
// ════════════════════════════════════════
async function loadCampaigns() {
  try {
    const res  = await fetch(`${API}?action=campaigns`);
    const data = await res.json();

    if (data.success && data.data.length > 0) {
      data.data.forEach(c => addCampaignCard({
        org:     c.organization,
        title:   c.title,
        desc:    c.description  || '',
        city:    c.city,
        bags:    c.goal,
        start:   c.start_date,
        end:     c.end_date,
        urgency: c.priority     || 'normal',
        phone:   c.phone,
        bloods:  c.blood_types  ? c.blood_types.split(',') : ['O+']
      }));
    } else {
      // إظهار حالة فارغة
      const grid = document.getElementById('cards-grid');
      if (grid && !grid.children.length) {
        grid.innerHTML = `<div class="empty-state">
          <i class="fa fa-bullhorn"></i>
          <p>لا توجد حملات حالياً — كن أول من ينشر حملة!</p>
        </div>`;
      }
    }
  } catch (e) {
    console.warn('تعذر تحميل الحملات:', e);
  }
}

// ════════════════════════════════════════
// فلاتر البحث
// ════════════════════════════════════════
function applyFilters() {
  const q     = document.getElementById('search-inp')?.value.trim().toLowerCase() || '';
  const blood = document.getElementById('f-blood')?.value || 'all';
  const city  = document.getElementById('f-city')?.value  || 'all';

  document.querySelectorAll('.campaign-card').forEach(c => {
    const matchQ = !q
      || c.querySelector('.campaign-title')?.textContent.toLowerCase().includes(q)
      || c.querySelector('.org-name')?.textContent.toLowerCase().includes(q)
      || c.dataset.city?.toLowerCase().includes(q);
    const matchB = blood === 'all' || c.dataset.blood?.includes(blood);
    const matchC = city  === 'all' || c.dataset.city === city;
    c.style.display = (matchQ && matchB && matchC) ? '' : 'none';
  });
}

// ════════════════════════════════════════
// مشاركة بطاقة الحملة
// ════════════════════════════════════════
function shareCard(btn) {
  const card = btn.closest('.campaign-card');
  const txt  = `📣 حملة تبرع بالدم!\n${card.querySelector('.campaign-title')?.textContent}\n${card.querySelector('.org-name')?.textContent.trim()}\nالمدينة: ${card.dataset.city}\nتطبيق Monqid`;
  shareText('حملة تبرع', txt);
}

// ════════════════════════════════════════
// إرسال حملة جديدة
// ════════════════════════════════════════
async function submitCampaign() {
  const org     = document.getElementById('m-org')?.value.trim();
  const title   = document.getElementById('m-title')?.value.trim();
  const desc    = document.getElementById('m-desc')?.value.trim();
  const city    = document.getElementById('m-city')?.value.trim();
  const bags    = parseInt(document.getElementById('m-bags')?.value) || 0;
  const start   = document.getElementById('m-start')?.value;
  const end     = document.getElementById('m-end')?.value;
  const urgency = document.getElementById('m-urgency')?.value;
  const phone   = document.getElementById('m-phone')?.value.trim();

  if (!org)                   return showToast('⚠️ أدخل اسم الجمعية');
  if (!title)                 return showToast('⚠️ أدخل عنوان الحملة');
  if (!selectedBloods.length) return showToast('⚠️ اختر فصيلة دم واحدة على الأقل');
  if (!city)                  return showToast('⚠️ أدخل المدينة');
  if (bags < 1)               return showToast('⚠️ أدخل عدد الوحدات');
  if (!phone)                 return showToast('⚠️ أدخل رقم التواصل');

  try {
    const fd = new FormData();
    fd.append('organization', org);
    fd.append('title',        title);
    fd.append('description',  desc);
    fd.append('city',         city);
    fd.append('goal',         bags);
    fd.append('start_date',   start);
    fd.append('end_date',     end);
    fd.append('priority',     urgency);
    fd.append('phone',        phone);
    fd.append('blood_types',  selectedBloods.join(','));

    await fetch(`${API}?action=add_campaign`, { method: 'POST', body: fd });
  } catch (e) {
    console.warn('API error:', e);
  }

  addCampaignCard({ org, title, desc, city, bags, start, end, urgency, phone, bloods: selectedBloods });
  closeCampaignModal();
  showToast('✅ تم نشر الحملة بنجاح!');
}

// ════════════════════════════════════════
// إضافة بطاقة حملة إلى الـ DOM
// ════════════════════════════════════════
function addCampaignCard({ org, title, desc, city, bags, start, end, urgency, phone, bloods }) {
  const urgMap   = { critical: 'عاجلة', high: 'مهمة', normal: 'عادية' };
  const badgeCls = { critical: 'badge-critical', high: 'badge-urgent', normal: 'badge-normal' };
  const cardCls  = { critical: 'critical', high: 'urgent', normal: '' };

  const dateStr  = (start && end)
    ? `من ${fmtDate(start)} — إلى ${fmtDate(end)}`
    : 'تاريخ التبرع عند التواصل';
  const tagsHTML = bloods.map(b => `<span class="blood-tag">${b}</span>`).join('');

  const card = document.createElement('div');
  card.className        = `campaign-card ${cardCls[urgency] || ''}`;
  card.dataset.urgency  = urgency;
  card.dataset.city     = city;
  card.dataset.blood    = bloods.join(',');

  card.innerHTML = `
    <div class="card-top">
      <div class="urgency-badge ${badgeCls[urgency]}">
        <span class="dot"></span> ${urgMap[urgency]}
      </div>
      <div class="blood-badge">
        <span class="drop">🩸</span>
        <span class="type">${bloods[0]}</span>
      </div>
    </div>
    <div class="card-body">
      <div class="org-badge"><i class="fa fa-building"></i> جمعية</div>
      <div class="campaign-title">${title}</div>
      <div class="org-name"><i class="fa fa-heart"></i> ${org}</div>
      <div class="campaign-desc">${desc || '—'}</div>
      <div class="blood-tags">${tagsHTML}</div>
      <div class="date-range"><i class="fa fa-calendar-alt"></i> ${dateStr}</div>
      <div class="card-meta">
        <div class="meta-row"><i class="fa fa-map-marker-alt"></i><span>${city}</span></div>
        <div class="meta-row"><i class="fa fa-phone"></i><span>${phone}</span></div>
      </div>
      <div class="target-info">
        <span>الهدف: ${bags} وحدة</span>
        <span>0 / ${bags}</span>
      </div>
      <div class="progress-wrap">
        <div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div>
      </div>
    </div>
    <div class="card-footer">
      <div class="card-actions">
        <button class="btn-join" onclick="window.location.href='tel:${phone}'">
          <i class="fa fa-heart"></i> المشاركة في الحملة
        </button>
        <button class="btn-info" onclick="shareCard(this)">
          <i class="fa fa-share-alt"></i>
        </button>
      </div>
    </div>`;

  const grid = document.getElementById('cards-grid');
  // إزالة empty state إن وجد
  const empty = grid?.querySelector('.empty-state');
  if (empty) empty.remove();
  grid?.prepend(card);
}

// ════════════════════════════════════════
// إغلاق وإعادة تعيين المودال
// ════════════════════════════════════════
function closeCampaignModal() {
  document.getElementById('modal')?.classList.remove('open');
  document.body.style.overflow = '';
  resetCampaignForm();
}

function resetCampaignForm() {
  ['m-org','m-title','m-desc','m-city','m-bags','m-start','m-end','m-phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const urg = document.getElementById('m-urgency');
  if (urg) urg.value = 'critical';
  document.querySelectorAll('#blood-selector .blood-opt').forEach(b => b.classList.remove('selected'));
  selectedBloods = [];
}

// ════════════════════════════════════════
// DOMContentLoaded
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // تحميل الحملات من DB
  loadCampaigns();

  // بحث وفلاتر
  document.getElementById('search-inp')?.addEventListener('input', applyFilters);
  document.getElementById('f-blood')?.addEventListener('change', applyFilters);
  document.getElementById('f-city')?.addEventListener('change', applyFilters);

  // تبويبات الأولوية
  document.getElementById('urg-tabs')?.addEventListener('click', e => {
    const btn = e.target.closest('.urg-btn');
    if (!btn) return;
    document.querySelectorAll('.urg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const urg = btn.dataset.urg;
    document.querySelectorAll('.campaign-card').forEach(c => {
      c.style.display = (urg === 'all' || c.dataset.urgency === urg) ? '' : 'none';
    });
  });

  // اختيار فصائل الدم (متعدد)
  document.getElementById('blood-selector')?.addEventListener('click', e => {
    const btn = e.target.closest('.blood-opt');
    if (!btn) return;
    btn.classList.toggle('selected');
    const b = btn.dataset.blood;
    selectedBloods = btn.classList.contains('selected')
      ? [...selectedBloods, b]
      : selectedBloods.filter(x => x !== b);
  });

  // فتح/إغلاق المودال
  document.getElementById('btn-open-modal')?.addEventListener('click', () => {
    document.getElementById('modal')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('btn-close-modal')?.addEventListener('click', closeCampaignModal);
  document.getElementById('modal')?.addEventListener('click', e => {
    if (e.target.id === 'modal') closeCampaignModal();
  });

  // إرسال الحملة
  document.getElementById('btn-submit')?.addEventListener('click', submitCampaign);
});
