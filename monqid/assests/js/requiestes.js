/* ═══════════════════════════════════════
   Monqid — Blood Requests Page
   assests/js/requistes.js
═══════════════════════════════════════ */

const API = '../backend/handlers/api.php';
let requests     = [];
let selectedBlood = '';
let activeUrgency = 'all';

// ════════════════════════════════════════
// تحميل الطلبات من API
// ════════════════════════════════════════
async function loadRequests() {
  try {
    const res  = await fetch(`${API}?action=requests`);
    const data = await res.json();

    if (data.success && data.data.length > 0) {
      requests = data.data;
    } else {
      requests = getSeedData();
    }
  } catch {
    requests = JSON.parse(localStorage.getItem('monqid-requests') || '[]');
    if (!requests.length) requests = getSeedData();
  }

  localStorage.setItem('monqid-requests', JSON.stringify(requests));
  updateStats();
  renderCards();
  updateNavBadge();
}

// بيانات احتياطية إذا فشل الاتصال
function getSeedData() {
  return [
    { id:1, name:'أحمد بنعلي',    hospital:'مستشفى ابن سينا',   blood:'O+', city:'الرباط',        bags:3, urgency:'critical', phone:'0612345678', notes:'', donated:false },
    { id:2, name:'فاطمة الزهراء', hospital:'مستشفى الشيخ زايد', blood:'A-', city:'الدار البيضاء', bags:2, urgency:'high',     phone:'0698765432', notes:'', donated:false },
    { id:3, name:'يوسف المنصوري', hospital:'المستشفى الجامعي',  blood:'B+', city:'مراكش',         bags:4, urgency:'normal',   phone:'0677889900', notes:'', donated:false },
  ];
}

// ════════════════════════════════════════
// تحديث الإحصائيات
// ════════════════════════════════════════
function updateStats() {
  const total    = requests.length;
  const critical = requests.filter(r => r.urgency === 'critical').length;
  const cities   = new Set(requests.map(r => r.city)).size;
  const bags     = requests.reduce((s, r) => s + Number(r.bags), 0);

  setNum('stat-total',    total);
  setNum('stat-critical', critical);
  setNum('stat-cities',   cities);
  setNum('stat-bags',     bags);

  // تحديث فلتر المدن
  const citySelect = document.getElementById('f-city');
  if (citySelect) {
    const current = citySelect.value;
    citySelect.innerHTML = '<option value="all">كل المدن</option>';
    [...new Set(requests.map(r => r.city))].sort().forEach(c => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = c;
      citySelect.appendChild(opt);
    });
    if (current) citySelect.value = current;
  }
}

function setNum(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<span>${val}</span>`;
}

// ════════════════════════════════════════
// عرض الكروت
// ════════════════════════════════════════
function renderCards() {
  const query = document.getElementById('search-inp')?.value.trim().toLowerCase() || '';
  const blood = document.getElementById('f-blood')?.value || 'all';
  const city  = document.getElementById('f-city')?.value  || 'all';
  const grid  = document.getElementById('cards-grid');
  if (!grid) return;

  const urgLabel = { critical:'حرجة', high:'عاجلة', normal:'عادية' };
  const urgClass = { critical:'critical', high:'high', normal:'normal' };

  const filtered = requests.filter(r => {
    const matchQ   = !query || r.name.toLowerCase().includes(query) || r.city.toLowerCase().includes(query);
    const matchB   = blood === 'all' || r.blood === blood;
    const matchC   = city  === 'all' || r.city  === city;
    const matchUrg = activeUrgency === 'all' || r.urgency === activeUrgency;
    return matchQ && matchB && matchC && matchUrg;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><i class="fa fa-tint-slash"></i><p>لا توجد طلبات تطابق البحث</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(r => {
    const fillPct    = r.donated ? 100 : Math.round((1 / Math.max(r.bags, 1)) * 100);
    const donatedTxt = r.donated ? 'تم التبرع ✓' : 'التواصل للتبرع';
    return `
      <div class="req-card ${r.urgency === 'critical' ? 'urgent' : ''}">
        <div class="card-top">
          <div class="blood-badge"><span class="drop">🩸</span><span class="type">${r.blood}</span></div>
          <div class="urgency-tag ${urgClass[r.urgency]}"><span class="dot"></span>${urgLabel[r.urgency]}</div>
        </div>
        <div class="card-name">${r.name}</div>
        <div class="card-sub">${r.hospital}</div>
        <div class="card-meta">
          <div class="meta-row"><i class="fa fa-map-marker-alt"></i><span>${r.city}</span></div>
          <div class="meta-row"><i class="fa fa-tint"></i><span>${r.bags} أكياس</span></div>
        </div>
        <div class="bags-bar-wrap">
          <div class="bags-label"><span>التقدم</span><span class="val">${fillPct}%</span></div>
          <div class="bags-bar"><div class="bags-fill" style="width:${fillPct}%"></div></div>
        </div>
        <div class="card-actions">
          <button class="btn-donate ${r.donated ? 'donated' : ''}" onclick="callDonor('${r.phone}', ${r.donated})">
            <i class="fa fa-phone"></i> ${donatedTxt}
          </button>
          <button class="btn-share" onclick="shareReq(${r.id})"><i class="fa fa-share-alt"></i></button>
        </div>
      </div>`;
  }).join('');
}

// ════════════════════════════════════════
// دوال مساعدة
// ════════════════════════════════════════
function callDonor(phone, donated) {
  if (!donated) window.location.href = `tel:${phone}`;
}

function shareReq(id) {
  const r = requests.find(x => x.id === id);
  if (!r) return;
  shareText('طلب دم', `🩸 طلب دم عاجل!\nالمريض: ${r.name}\nالفصيلة: ${r.blood}\nالمدينة: ${r.city}\nالمستشفى: ${r.hospital}\nللتواصل: ${r.phone}`);
}

// ════════════════════════════════════════
// إرسال طلب جديد
// ════════════════════════════════════════
async function submitRequest() {
  const name     = document.getElementById('m-name')?.value.trim();
  const hospital = document.getElementById('m-hospital')?.value.trim();
  const city     = document.getElementById('m-city')?.value.trim();
  const bags     = parseInt(document.getElementById('m-bags')?.value) || 0;
  const urgency  = document.getElementById('m-urgency')?.value;
  const phone    = document.getElementById('m-phone')?.value.trim();
  const notes    = document.getElementById('m-notes')?.value.trim();

  if (!name)          return showToast('⚠️ أدخل اسم المريض');
  if (!hospital)      return showToast('⚠️ أدخل اسم المستشفى');
  if (!selectedBlood) return showToast('⚠️ اختر فصيلة الدم');
  if (!city)          return showToast('⚠️ أدخل المدينة');
  if (bags < 1)       return showToast('⚠️ أدخل عدد الأكياس');
  if (!phone)         return showToast('⚠️ أدخل رقم التواصل');

  try {
    const fd = new FormData();
    fd.append('patient_name', name);
    fd.append('hospital',     hospital);
    fd.append('blood_type',   selectedBlood);
    fd.append('city',         city);
    fd.append('bags',         bags);
    fd.append('urgency',      urgency);
    fd.append('phone',        phone);
    fd.append('notes',        notes || '');

    const res  = await fetch(`${API}?action=add_request`, { method: 'POST', body: fd });
    const data = await res.json();

    if (data.success) {
      requests.unshift({ ...data.data, name, blood: selectedBlood, donated: false });
    } else {
      const newId = requests.length ? Math.max(...requests.map(r => r.id)) + 1 : 1;
      requests.unshift({ id: newId, name, hospital, blood: selectedBlood, city, bags, urgency, phone, notes: notes || '', donated: false });
    }
  } catch {
    const newId = requests.length ? Math.max(...requests.map(r => r.id)) + 1 : 1;
    requests.unshift({ id: newId, name, hospital, blood: selectedBlood, city, bags, urgency, phone, notes: notes || '', donated: false });
  }

  localStorage.setItem('monqid-requests', JSON.stringify(requests));
  updateStats();
  renderCards();
  closeModal();
  showToast('✅ تم نشر الطلب بنجاح!');
}

function closeModal() {
  document.getElementById('modal')?.classList.remove('open');
  document.body.style.overflow = '';
  resetForm();
}

function resetForm() {
  ['m-name','m-hospital','m-city','m-bags','m-phone','m-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const urg = document.getElementById('m-urgency');
  if (urg) urg.value = 'critical';
  document.querySelectorAll('.blood-opt').forEach(b => b.classList.remove('selected'));
  selectedBlood = '';
}

// ════════════════════════════════════════
// DOMContentLoaded
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // تبويبات الأولوية
  document.getElementById('urg-tabs')?.addEventListener('click', e => {
    const btn = e.target.closest('.urg-btn');
    if (!btn) return;
    document.querySelectorAll('.urg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeUrgency = btn.dataset.urg;
    renderCards();
  });

  // بحث وفلاتر
  document.getElementById('search-inp')?.addEventListener('input', renderCards);
  document.getElementById('f-blood')?.addEventListener('change', renderCards);
  document.getElementById('f-city')?.addEventListener('change', renderCards);

  // اختيار فصيلة الدم
  document.getElementById('blood-selector')?.addEventListener('click', e => {
    const btn = e.target.closest('.blood-opt');
    if (!btn) return;
    document.querySelectorAll('.blood-opt').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedBlood = btn.dataset.blood;
  });

  // المودال
  document.getElementById('btn-open-modal')?.addEventListener('click', () => {
    document.getElementById('modal')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
  document.getElementById('modal')?.addEventListener('click', e => {
    if (e.target.id === 'modal') closeModal();
  });
  document.getElementById('btn-submit')?.addEventListener('click', submitRequest);

  // تحميل الطلبات
  loadRequests();
});