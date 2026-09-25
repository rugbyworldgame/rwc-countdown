// One shared counter for every public page. Analytics never blocks navigation.
(() => {
  if (window.__rugbyMetrika || !['rugby2027.ru', 'www.rugby2027.ru'].includes(location.hostname) || location.pathname.startsWith('/checks/') || window.self !== window.top) return;
  window.__rugbyMetrika = true;
  const id = 113073211;
  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
  window.ym.l = window.ym.l || Date.now();
  if (![...document.scripts].some(s => /^https:\/\/mc\.yandex\.ru\/metrika\/tag\.js(?:\?|$)/.test(s.src))) {
    const script = document.createElement('script');
    script.async = true; script.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + id;
    script.onload = () => { script.dataset.loaded = 'true'; };
    document.head.append(script);
  }
  const queued = [...(window.ym.a || [])].some(args => args[0] === id && args[1] === 'init');
  if (!queued && !window['yaCounter' + id]) window.ym(id, 'init', {
    ssr: true, webvisor: true, clickmap: true, ecommerce: 'dataLayer',
    referrer: document.referrer, url: location.href, accurateTrackBounce: true, trackLinks: true
  });
  const goal = (name, params = {}) => { try { window.ym(id, 'reachGoal', name, params); } catch {} };
  let match = {};
  for (const node of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(node.textContent);
      const event = (Array.isArray(data) ? data : data['@graph'] || [data]).find(item => item['@type'] === 'SportsEvent');
      if (event) { match = {match_id: event['@id'] || location.pathname, match_name: event.name, start_date: event.startDate}; break; }
    } catch {}
  }
  if (match.match_id) goal('match_open', match);
  document.addEventListener('rugby:player-open', event => {
    if (typeof event.detail?.playerId === 'string') goal('player_card_open', {...match, player_id: event.detail.playerId});
  });
  document.addEventListener('click', event => {
    const target = event.target.closest?.('a,button,summary,#supportCard');
    if (!target) return;
    if (target.matches('a')) {
      const url = new URL(target.href, location.href);
      if (url.hostname === 'danilexpert.taplink.ws' && url.pathname === '/p/1105f4c/' && url.searchParams.get('refLinkId') === '246672') goal('balance_click', match);
      if (target.getAttribute('href') === '#project-support') goal('support_click', {action: 'open_link'});
    }
    if (target.matches('#project-support summary') && !target.closest('details').open) goal('support_click', {action: 'open_details'});
    if (target.matches('#supportCard')) goal('support_click', {action: 'requisites'});
    if (target.matches('#copySupportCard')) goal('support_click', {action: 'copy_attempt'});
  });
})();
