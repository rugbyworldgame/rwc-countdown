(async function () {
  const host = document.getElementById("menu-container");
  if (!host) return;
  try {
    const response = await fetch("/menu.html");
    host.innerHTML = await response.text();
    const toggle = document.getElementById("menuToggle");
    const nav = document.getElementById("mobileNav");
    toggle?.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "×" : "☰";
    });
    const current = location.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "") || "/";
    host.querySelectorAll("a").forEach(link => {
      const target = new URL(link.href).pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "") || "/";
      if (target === current || (target !== "/" && current.startsWith(target))) link.setAttribute("aria-current", "page");
    });
  } catch {}
})();

(async function loadProjectSupport() {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet'; stylesheet.href = '/assets/css/support.css?v=20260920';
  document.head.appendChild(stylesheet);
  try {
    const response = await fetch('/support.html');
    if (!response.ok) throw new Error('Support unavailable');
    let slot = document.getElementById('project-support-slot');
    if (!slot) {
      slot = document.createElement('div'); slot.className = 'shell support-shell';
      const footer = document.querySelector('footer');
      if (footer) footer.before(slot); else document.body.appendChild(slot);
    }
    slot.innerHTML = await response.text();
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
