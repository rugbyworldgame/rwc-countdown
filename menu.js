// Calendar-bounded campaign; no campaign assets are requested after expiry.
if (Date.now() < Date.parse('2026-10-01T21:00:00Z')) {
  import('/assets/js/one-year.js?v=20261001').catch(() => {});
}

// Shared page controls: loaded once on every page that uses the site menu.
(function initPageControls() {
  if (document.getElementById('back-to-top')) return;
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = '/assets/css/page-controls.css?v=20260927';
  document.head.append(css);
  const button = document.createElement('button');
  button.id = 'back-to-top'; button.type = 'button'; button.hidden = true;
  button.setAttribute('aria-label', 'Вернуться к началу страницы');
  button.title = 'Наверх';
  button.innerHTML = '<span aria-hidden="true">↑</span><span class="back-to-top-label">Наверх</span>';
  document.body.append(button);
  let scheduled = false;
  function update() {
    scheduled = false;
    button.hidden = window.scrollY < 500 || !!document.fullscreenElement;
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }, {passive:true});
  document.addEventListener('fullscreenchange', update);
  button.addEventListener('click', () => {
    // Return keyboard focus as well as the viewport; do not change the page URL.
    const target = document.querySelector('.skip-link, .brand, header a');
    target?.focus({preventScroll:true});
    window.scrollTo({top:0, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
  update();
})();

// Fallback for future pages using the shared menu. The counter guards duplicate execution.
if (!document.querySelector('script[src^="/assets/js/analytics.js"]')) {
  const analytics = document.createElement('script'); analytics.src = '/assets/js/analytics.js?v=20260926'; analytics.async = true; document.head.append(analytics);
}
// Shared enhancement for current and future match pages; no image downloads here.
if (document.querySelector('.lineups')) {
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/css/player-cards.css'; document.head.append(css);
  import('/assets/js/player-cards.js?v=20260927-registry').catch(() => {});
}

(async function () {
  const host = document.getElementById("menu-container");
  if (!host) return;
  try {
    if (!host.querySelector('header')) {
      const response = await fetch("/menu.html");
      if (!response.ok) return;
      host.innerHTML = await response.text();
    }
    const toggle = document.getElementById("menuToggle");
    const nav = document.getElementById("mobileNav");
    toggle?.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "×" : "☰";
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav?.classList.contains('open')) {
        nav.classList.remove('open'); toggle.setAttribute('aria-expanded','false');
        toggle.setAttribute('aria-label','Открыть меню'); toggle.textContent='☰'; toggle.focus();
      }
    });
    const current = location.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "") || "/";
    host.querySelectorAll("a").forEach(link => {
      const target = new URL(link.href).pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "") || "/";
      if (target === current || (target !== "/" && current.startsWith(target))) link.setAttribute("aria-current", "page");
    });
  } catch {}
})();

(async function loadProjectSupport() {
  if (!document.querySelector('link[href^="/assets/css/support.css"]')) {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet'; stylesheet.href = '/assets/css/support.css?v=20260920';
  document.head.appendChild(stylesheet);
  }
  try {
    let slot = document.getElementById('project-support-slot');
    if (!slot) {
      slot = document.createElement('div'); slot.className = 'shell support-shell';
      const footer = document.querySelector('footer');
      if (footer) footer.before(slot); else document.body.appendChild(slot);
    }
    if (!slot.querySelector('#project-support')) {
      const response = await fetch('/support.html');
      if (!response.ok) throw new Error('Support unavailable');
      slot.innerHTML = await response.text();
    }
    const button = slot.querySelector('#copySupportCard');
    const status = slot.querySelector('#supportStatus');
    button.hidden = false;
    button.addEventListener('click', async () => {
      const card = slot.querySelector('#supportCard');
      try {
        await navigator.clipboard.writeText(card.textContent.replace(/\s/g, ''));
        status.textContent = 'Номер скопирован. Спасибо за поддержку!';
      } catch {
        const range = document.createRange(); range.selectNodeContents(card);
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
        status.textContent = 'Выделили номер — скопируйте его вручную.';
      }
    });
    function revealSupport(event) {
      if (!event.target.closest('a[href="#project-support"]')) return;
      event.preventDefault();
      slot.querySelector('details').open = true;
      slot.querySelector('#project-support').scrollIntoView({block:'center'});
      slot.querySelector('summary').focus({preventScroll:true});
    }
    document.addEventListener('click', revealSupport);
    if (location.hash === '#project-support') {
      slot.querySelector('details').open = true;
      slot.scrollIntoView();
    }
  } catch { /* Navigation and page content remain available. */ }
})();
