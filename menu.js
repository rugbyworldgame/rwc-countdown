// menu.js
// Единая, стабильная инициализация меню для всех страниц
// CLEAN VERSION — без эффектов, без побочных состояний

(function () {
  let isOpen = false;
  let isInitialized = false;

  function initMenu() {
    if (isInitialized) return;
    isInitialized = true;

    const menuBtn = document.getElementById("menuBtn");
    const sideMenu = document.getElementById("sideMenu");
    const menuOverlay = document.getElementById("menuOverlay");

    if (!menuBtn || !sideMenu || !menuOverlay) return;

    const menuLinks = sideMenu.querySelectorAll("a");

    function openMenu() {
      if (isOpen) return;
      isOpen = true;

      menuBtn.classList.add("active");
      sideMenu.classList.add("active");
      menuOverlay.classList.add("active");

      document.body.classList.add("menu-open");
    }

    function closeMenu() {
      if (!isOpen) return;
      isOpen = false;

      menuBtn.classList.remove("active");
      sideMenu.classList.remove("active");
      menuOverlay.classList.remove("active");

      document.body.classList.remove("menu-open");
    }

    menuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      isOpen ? closeMenu() : openMenu();
    });

    menuOverlay.addEventListener("click", () => {
      closeMenu();
    });

    menuLinks.forEach(link => {
      link.addEventListener("click", () => {
        closeMenu();
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    });

    // На случай ресайза (чтобы меню не залипало)
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900 && isOpen) {
        closeMenu();
      }
    });
  }

  function loadMenu() {
    const container = document.getElementById("menu-container");
    if (!container) return;

    fetch("/menu.html", { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Menu load failed");
        return response.text();
      })
      .then(html => {
        container.innerHTML = html;
        initMenu();
      })
      .catch(() => {
        /* намеренно без логов */
      });
  }

  document.addEventListener("DOMContentLoaded", loadMenu);
})();
