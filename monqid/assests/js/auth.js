/* ═══════════════════════════════════════
   Monqid — Auth Logic
   assests/js/auth.js
═══════════════════════════════════════ */

const API = '../backend/handlers/api.php';

// ════════════════════════════════════════
// تسجيل الدخول
// ════════════════════════════════════════
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn   = this.querySelector('.btn-submit');
    const email = document.getElementById('l-email')?.value.trim();
    const pass  = document.getElementById('l-pass')?.value;

    if (!email || !pass) return showToast('⚠️ أدخل البريد وكلمة المرور');

    btn.disabled    = true;
    btn.innerHTML   = '<span>⏳</span> جاري الدخول...';

    const fd = new FormData();
    fd.append('email', email);
    fd.append('password', pass);

    try {
      const res  = await fetch(`${API}?action=login`, { method: 'POST', body: fd });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('monqid-user-id',   data.user.id);
        localStorage.setItem('monqid-user-name', data.user.name);
        localStorage.setItem('monqid-user-email', data.user.email);

        btn.innerHTML          = '<span>✅</span> تم!';
        btn.style.background   = '#22c55e';
        setTimeout(() => window.location.href = data.redirect || 'profil.html', 800);
      } else {
        showToast('❌ ' + data.message);
        btn.disabled  = false;
        btn.innerHTML = '<span>❤️</span> تسجيل الدخول';
      }
    } catch {
      showToast('❌ خطأ في الاتصال بالسيرفر');
      btn.disabled  = false;
      btn.innerHTML = '<span>❤️</span> تسجيل الدخول';
    }
  });
}

// ════════════════════════════════════════
// إنشاء حساب
// ════════════════════════════════════════
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('.btn-submit');
    btn.disabled  = true;
    btn.innerHTML = '<span>⏳</span> جاري التسجيل...';

    // جمع حقول الفورم بالترتيب الصحيح
    const inputs = this.querySelectorAll('input, select');
    const fields = ['f_nom','l_nom','email','tel','blood_type','ville','adresse','password','confirm_password'];

    const fd = new FormData();
    inputs.forEach((el, i) => {
      if (fields[i]) fd.append(fields[i], el.value);
    });

    try {
      const res  = await fetch(`${API}?action=register`, { method: 'POST', body: fd });
      const data = await res.json();

      if (data.success) {
        btn.innerHTML        = '<span>✅</span> تم إنشاء الحساب!';
        btn.style.background = '#22c55e';
        setTimeout(() => window.location.href = data.redirect || 'login.html', 1000);
      } else {
        const msgs = data.errors ? data.errors.join('\n') : data.message;
        showToast('❌ ' + msgs);
        btn.disabled  = false;
        btn.innerHTML = '<span>🩸</span> إنشاء الحساب';
      }
    } catch {
      showToast('❌ خطأ في الاتصال بالسيرفر');
      btn.disabled  = false;
      btn.innerHTML = '<span>🩸</span> إنشاء الحساب';
    }
  });
}