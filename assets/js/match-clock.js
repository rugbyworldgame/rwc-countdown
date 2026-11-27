(() => {
  const config = document.getElementById('match-config');
  if (!config) return;
  const {start,status} = JSON.parse(config.textContent);
  const target = Date.parse(start), label = document.getElementById('countdownLabel');
  const values = document.getElementById('countdownValues');
  const wrap = document.getElementById('matchCountdown');
  const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Moscow'}).format(new Date());
  const activeDays = document.querySelectorAll('details[open][data-match-day]');
  if (activeDays.length > 1 && matchMedia('(max-width:900px)').matches) {
    activeDays.forEach(group => {
      group.open = group.dataset.matchDay === today || !!group.querySelector('[aria-current="page"]');
    });
  }
  if (!label) return;
  const statusText = label.textContent;
  function tick() {
    const left = target-Date.now();
    if (status !== 'scheduled' || left<=0) {
      values.hidden=true;
      wrap.dataset.state=status === 'scheduled' ? 'started' : status;
      label.textContent=statusText;
      return;
    }
    label.textContent='До стартового свистка'; values.hidden=false;
    const parts=[Math.floor(left/86400000),Math.floor(left/3600000)%24,Math.floor(left/60000)%60,Math.floor(left/1000)%60];
    ['Days','Hours','Minutes','Seconds'].forEach((key,i)=>document.getElementById('match'+key).textContent=String(parts[i]).padStart(2,'0'));
  }
  tick();
  if (!values.hidden) { const timer=setInterval(()=>{tick();if(values.hidden)clearInterval(timer);},1000); }
})();
