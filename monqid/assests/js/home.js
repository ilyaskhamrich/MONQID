/* ═══════════════════════════════════════
   Monqid — Home Page Script
   assets/js/home.js
═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const statsSection = document.querySelector('.stats-section');
  if (!statsSection) return;

  let animated = false;
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      animateCounter(document.getElementById('users-count'),    1500);
      animateCounter(document.getElementById('hospitals-count'),  35);
      animateCounter(document.getElementById('orders-count'),  12000);
    }
  }, { threshold: 0.3 });

  observer.observe(statsSection);
});