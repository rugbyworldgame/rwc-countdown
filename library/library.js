const search = document.querySelector('#archive-search');
const query = document.querySelector('#query');
const statusLine = document.querySelector('#search-status');
function words(value) {
  return value.toLowerCase().replace(/ё/g, 'е').split(/[^a-zа-я0-9]+/u).filter(Boolean);
}
function render() {
  query.value = new URLSearchParams(location.search).get('q') || '';
  const terms = words(query.value);
  for (const section of document.querySelectorAll('#catalog details')) section.open = false;
  let count = 0;
  for (const year of document.querySelectorAll('.cup-year')) {
    const rows = year.querySelectorAll('.recordings li');
    let hits = 0;
    for (const row of rows) {
      const index = words([row.textContent, row.dataset.search, 'Кубок мира', year.querySelector('summary').textContent].join(' '));
      row.hidden = !terms.every(term => index.some(word => word.startsWith(term)));
      if (!row.hidden) hits++;
    }
    year.hidden = terms.length > 0 && !hits;
    if (hits && terms.length) year.open = true;
    count += hits;
  }
  if (terms.length && count) {
    document.querySelector('#world-cup').open = true;
    document.querySelector('#catalog .shelf').open = true;
  }
  const target = document.getElementById(location.hash.slice(1));
  if (target?.matches('#catalog details')) {
    for (let node = target; node; node = node.parentElement.closest('details')) node.open = true;
  }
  statusLine.textContent = terms.length ? (count ? 'Найдено записей: ' + count : 'Записей по этому запросу пока нет.') : '';
}
search.addEventListener('submit', event => {
  event.preventDefault();
  const url = new URL(location.href);
  if (query.value.trim()) url.searchParams.set('q', query.value.trim());
  else url.searchParams.delete('q');
  history.pushState(null, '', url);
  render();
});
query.addEventListener('input', () => {
  if (!query.value && location.search) search.requestSubmit();
});
window.addEventListener('popstate', render);
window.addEventListener('hashchange', render);
render();
