// One-day editorial treatment. UTC bounds equal 1 October 2026 in Moscow.
(() => {
  const start = Date.parse('2026-09-30T21:00:00Z');
  const end = Date.parse('2026-10-01T21:00:00Z');
  if (Date.now() >= end || document.getElementById('one-year-style')) return;
  const css = document.createElement('link');
  css.id = 'one-year-style'; css.rel = 'stylesheet';
  css.href = '/assets/css/one-year.css?v=20261001';
  let ready = false, block, hero, originals = [], timer;
  function remove() {
    block?.remove(); block = null;
    originals.forEach(([node, hidden]) => { node.hidden = hidden; });
    originals = [];
    hero?.classList.remove('one-year-hero');
  }
  function sync() {
    clearTimeout(timer);
    const now = Date.now();
    if (now >= end) {
      remove(); css.remove();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pageshow', sync);
      window.removeEventListener('focus', sync);
      return;
    }
    if (now < start) remove();
    else if (ready && !block) {
      const copy = document.querySelector('.hero .hero-copy');
      if (copy) {
        hero = document.querySelector('.hero');
        originals = [...copy.children].filter(node => !node.classList.contains('hero-actions')).map(node => [node, node.hidden]);
        originals.forEach(([node]) => { node.hidden = true; });
        block = document.createElement('div'); block.className = 'one-year-copy';
        block.innerHTML = '<div class="one-year-eyebrow">1 октября 2026 · особенный день</div><h1>РОВНО ГОД<br>ДО СТАРТА</h1><div class="one-year-number"><strong>365</strong><span>дней</span></div><p class="one-year-lead">До первого матча Кубка мира по регби 2027</p><p class="one-year-fixture"><span>1 октября 2027 · Перт</span><b>Австралия — Гонконг</b></p><p class="one-year-end">Обратный отсчёт начался.</p>';
        copy.prepend(block); hero.classList.add('one-year-hero');
      } else {
        const main = document.querySelector('main');
        if (main) {
          block = document.createElement('aside'); block.className = 'one-year-strip';
          block.setAttribute('aria-label','Год до Кубка мира');
          block.innerHTML = '<div class="shell"><span aria-hidden="true">365</span><p>Ровно год до старта Кубка мира 2027</p></div>';
          main.prepend(block);
        }
      }
    }
    // Exact boundary timer plus recovery from sleeping tabs / clock adjustments.
    timer = setTimeout(sync, Math.min(60000, (now < start ? start : end) - now));
  }
  css.onload = () => { ready = true; sync(); };
  css.onerror = () => { remove(); css.remove(); clearTimeout(timer); };
  document.head.append(css);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', sync);
  window.addEventListener('focus', sync);
  sync();
})();
