// Nhãn gói hiện tại ở đầu trang: khách, miễn phí, hoặc tên gói trả phí.
// Lấy từ /api/me/entitlements (qua máy chủ tài khoản). Không có máy chủ thì không hiện gì.
(function () {
  function label(ent, plans) {
    if (ent.tier === 'admin') return { text: 'Quản trị viên', cls: 'plan-admin' };
    if (ent.tier === 'plan') {
      const p = plans.find(x => x.id === ent.planId);
      return { text: 'Gói: ' + (p ? p.name : 'trả phí'), cls: 'plan-paid' };
    }
    if (ent.tier === 'free') return { text: 'Miễn phí', cls: 'plan-free' };
    return { text: 'Khách', cls: 'plan-guest' };
  }

  async function run() {
    const host = document.querySelector('header');
    if (!host) return;
    let ent;
    try {
      const me = await fetch('/api/me', { credentials: 'same-origin' });
      const loggedIn = me.ok;
      const r = await fetch('/api/me/entitlements', { credentials: 'same-origin' });
      if (!r.ok) return;
      ent = await r.json();
      // Khách chưa đăng nhập: server coi như gói miễn phí, nhưng hiện là "Khách"
      if (!loggedIn) ent = { tier: 'guest' };
    } catch (_) { return; }

    let plans = [];
    if (ent.tier === 'plan') {
      try {
        const r = await fetch('/api/plans', { credentials: 'same-origin' });
        if (r.ok) plans = (await r.json()).plans || [];
      } catch (_) { /* giữ nhãn chung */ }
    }

    const info = label(ent, plans);
    const badge = document.createElement('span');
    badge.className = 'plan-badge ' + info.cls;
    badge.textContent = info.text;
    badge.setAttribute('aria-label', 'Gói đang dùng: ' + info.text);
    // Đặt ngay cạnh tên app (tiêu đề), nếu không có thì đặt cuối header
    const title = host.querySelector('h1, b, .brand, .hud-title');
    if (title) title.insertAdjacentElement('afterend', badge); else host.appendChild(badge);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
