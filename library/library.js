const search = document.querySelector('#tournament-search');
const query = document.querySelector('#query');
const filters = document.querySelectorAll('[data-filter]');
function normalize(text) {
  return text.toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[-–]/g, ' ').trim();
}
function render() {
  const params = new URLSearchParams(location.hash.slice(1));
  query.value = params.get('q') || '';
  const filter = params.get('filter') || 'all';
  const terms = normalize(query.value).split(/\s+/);
  let count = 0;
  for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
  for (const shelf of document.querySelectorAll('.shelf')) {
    let visible = 0;
    for (const row of shelf.querySelectorAll(':scope > details')) {
      const words = normalize([shelf.querySelector('h3').textContent, row.querySelector('summary').textContent, row.dataset.aliases].join(' '));
      row.hidden = (filter === 'women' && row.dataset.women !== 'true') || !terms.every(term => words.includes(term));
      if (!row.hidden) visible++;
    }
    shelf.hidden = visible === 0;
    count += visible;
  }
  document.querySelector('#empty').hidden = count > 0;
}
function select(filter) {
  const params = new URLSearchParams();
  if (query.value.trim()) params.set('q', query.value.trim());
  if (filter === 'women') params.set('filter', filter);
  location.hash = params.toString();
  render();
}
search.addEventListener('submit', event => {
  event.preventDefault();
  select(document.querySelector('[data-filter][aria-pressed="true"]').dataset.filter);
});
for (const button of filters) button.addEventListener('click', () => select(button.dataset.filter));
window.addEventListener('hashchange', render);
render();

const matchSearch = document.querySelector('#match-search');
const competition = document.querySelector('#competition');
const teams = document.querySelector('#teams');
const matchStatus = document.querySelector('#match-status');
for (const shelf of document.querySelectorAll('.shelf')) {
  const group = document.createElement('optgroup');
  group.label = shelf.querySelector('h3').textContent;
  for (const summary of shelf.querySelectorAll(':scope > details > summary')) {
    group.append(new Option(summary.textContent, summary.textContent));
  }
  competition.append(group);
}
function showMatchStatus() {
  matchStatus.hidden = false;
  matchStatus.textContent = competition.value
    ? 'В архиве турнира «' + competition.value + '» пока нет записей.'
    : 'В библиотеку пока не добавлены записи матчей.';
}
matchSearch.addEventListener('submit', event => {
  event.preventDefault();
  showMatchStatus();
});
competition.addEventListener('change', showMatchStatus);
