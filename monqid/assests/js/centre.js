/* ═══════════════════════════════════════
   Monqid — Centers Map Page
   assets/js/centers.js
   (requires Leaflet to be loaded first)
═══════════════════════════════════════ */

const CENTERS = [
  { id: 1, name: 'مركز تحاقن الدم – الرباط',        city: 'الرباط',        address: 'شارع محمد الخامس، الرباط',          phone: '+212 537 767 111', hours: 'السبت–الخميس: 08:00–16:00', lat: 34.020882, lng: -6.841650, open: true,  blood: ['A+','A-','B+','O+','O-'] },
  { id: 2, name: 'مركز تحاقن الدم – الدار البيضاء', city: 'الدار البيضاء', address: 'حي الحسن الثاني، الدار البيضاء',     phone: '+212 522 251 000', hours: 'السبت–الخميس: 07:30–15:30', lat: 33.573110, lng: -7.589843, open: true,  blood: ['A+','B+','B-','AB+','O+'] },
  { id: 3, name: 'مركز تحاقن الدم – مراكش',         city: 'مراكش',         address: 'المستشفى الإقليمي، مراكش',          phone: '+212 524 336 222', hours: 'الاثنين–الجمعة: 08:00–14:00', lat: 31.629472, lng: -7.981084, open: false, blood: ['A+','O+','O-'] },
  { id: 4, name: 'مركز تحاقن الدم – فاس',           city: 'فاس',           address: 'المستشفى الجامعي ابن سينا، فاس',   phone: '+212 535 622 333', hours: 'السبت–الخميس: 08:00–16:00', lat: 34.033333, lng: -5.000000, open: true,  blood: ['B+','B-','AB-','O+','O-'] },
  { id: 5, name: 'مركز تحاقن الدم – طنجة',          city: 'طنجة',          address: 'المستشفى المحمدي، طنجة',            phone: '+212 539 940 444', hours: 'السبت–الخميس: 08:00–15:00', lat: 35.759465, lng: -5.833954, open: true,  blood: ['A-','AB+','O+','O-'] },
  { id: 6, name: 'مركز تحاقن الدم – أكادير',        city: 'أكادير',        address: 'المستشفى الحسن الثاني، أكادير',    phone: '+212 528 822 555', hours: 'الاثنين–السبت: 08:00–14:00', lat: 30.427755, lng: -9.598107, open: true,  blood: ['A+','B+','O+'] },
  { id: 7, name: 'مركز تحاقن الدم – وجدة',          city: 'وجدة',          address: 'المستشفى الإقليمي الفارابي، وجدة', phone: '+212 536 683 666', hours: 'السبت–الخميس: 08:00–16:00', lat: 34.686667, lng: -1.911389, open: false, blood: ['A+','A-','B-','O-'] },
];

let map, markersMap = {};

function initMap() {
  map = L.map('map', { zoomControl: false }).setView([31.7917, -7.0926], 6);
  L.control.zoom({ position: 'bottomleft' }).addTo(map);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 19
  }).addTo(map);
  addMarkers();
  renderList();
}

function makeIcon(open) {
  return L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:${open ? '#e8304a' : '#555'};border:2px solid ${open ? '#ff6b80' : '#888'};display:flex;align-items:center;justify-content:center;transform:rotate(-45deg);box-shadow:0 0 ${open ? '14px rgba(232,48,74,0.6)' : '6px rgba(0,0,0,0.4)'}"><span style="transform:rotate(45deg);font-size:14px">🩸</span></div>`,
    iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -38]
  });
}

function addMarkers() {
  CENTERS.forEach(c => {
    const m = L.marker([c.lat, c.lng], { icon: makeIcon(c.open) }).addTo(map);
    const bloodHTML = c.blood.map(b => `<span style="background:rgba(232,48,74,0.15);border:1px solid rgba(232,48,74,0.3);color:#e8304a;font-size:10px;font-weight:800;padding:1px 6px;border-radius:4px;margin-left:3px">${b}</span>`).join('');
    m.bindPopup(`
      <div style="min-width:200px;padding:4px 2px;font-family:'Cairo',sans-serif">
        <div style="font-size:15px;font-weight:900;margin-bottom:8px;color:#f0f0f2">🩸 ${c.name}</div>
        <div style="font-size:12px;color:#888;margin-bottom:5px"><i class="fa fa-map-marker-alt" style="color:#e8304a;margin-left:6px"></i><span style="color:#ccc">${c.address}</span></div>
        <div style="font-size:12px;color:#888;margin-bottom:5px"><i class="fa fa-phone" style="color:#e8304a;margin-left:6px"></i><span style="color:#ccc">${c.phone}</span></div>
        <div style="font-size:12px;color:#888;margin-bottom:5px"><i class="fa fa-clock" style="color:#e8304a;margin-left:6px"></i><span style="color:#ccc">${c.hours}</span></div>
        <div style="font-size:12px;color:#888;margin-bottom:5px"><i class="fa fa-tint" style="color:#e8304a;margin-left:6px"></i>${bloodHTML}</div>
        <div style="font-size:12px;margin-bottom:10px"><i class="fa fa-circle" style="color:${c.open ? '#4ade80' : '#f87171'};margin-left:6px"></i><span style="color:${c.open ? '#4ade80' : '#f87171'}">${c.open ? 'مفتوح الآن' : 'مغلق حالياً'}</span></div>
        <button onclick="window.location.href='tel:${c.phone}'" style="width:100%;padding:8px;background:#e8304a;border:none;border-radius:8px;color:#fff;font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer"><i class="fa fa-phone"></i> اتصل الآن</button>
      </div>`, { maxWidth: 260 });
    m.on('click', () => setActive(c.id));
    markersMap[c.id] = m;
  });
}

function renderList(query = '') {
  const list = document.getElementById('centers-list');
  const q = query.trim().toLowerCase();
  const filtered = CENTERS.filter(c => !q || c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));

  if (!filtered.length) {
    list.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--muted)"><i class="fa fa-map-marked-alt" style="font-size:32px;margin-bottom:12px;display:block;color:var(--border-r)"></i><p>لا توجد مراكز تطابق البحث</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(c => `
    <div class="center-item" id="item-${c.id}" onclick="setActive(${c.id})">
      <div class="center-item-top">
        <div class="center-name">${c.name}</div>
        <span class="center-status ${c.open ? 'status-open' : 'status-closed'}">${c.open ? 'مفتوح' : 'مغلق'}</span>
      </div>
      <div class="center-meta-row"><i class="fa fa-map-marker-alt"></i><span>${c.address}</span></div>
      <div class="center-meta-row"><i class="fa fa-clock"></i><span>${c.hours}</span></div>
      <div class="center-meta-row"><i class="fa fa-phone"></i><span>${c.phone}</span></div>
      <div class="center-blood-types">${c.blood.map(b => `<span class="blood-chip">${b}</span>`).join('')}</div>
    </div>`).join('');
}

function setActive(id) {
  document.querySelectorAll('.center-item').forEach(el => el.classList.remove('active'));
  const item = document.getElementById(`item-${id}`);
  if (item) { item.classList.add('active'); item.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  const c = CENTERS.find(x => x.id === id);
  if (c) { map.setView([c.lat, c.lng], 13, { animate: true }); markersMap[id].openPopup(); }
}

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  document.getElementById('search-inp')?.addEventListener('input', function () { renderList(this.value); });
});