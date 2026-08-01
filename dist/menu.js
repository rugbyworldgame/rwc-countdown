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
    const current = location.pathname.replace(/\.html$/, "") || "/";
    host.querySelectorAll("a").forEach(link => {
      const target = new URL(link.href).pathname.replace(/\.html$/, "") || "/";
      if (target === current) link.setAttribute("aria-current", "page");
    });
  } catch {}
})();
