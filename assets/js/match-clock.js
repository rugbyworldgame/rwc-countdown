(() => {
  const config = document.getElementById('match-config');
  if (!config) return;
  const {start,status} = JSON.parse(config.textContent);
  const target = Date.parse(start), label = document.getElementById('countdownLabel');
  const values = document.getElementById('countdownValues');
  function tick() {
    const left = target-Date.now();
    const fixed = {finished:'Матч завершён',live:'Прямой эфир',postponed:'Матч перенесён',cancelled:'Матч отменён'}[status];
    if (fixed || left<=0) {
      values.hidden=true;
      label.textContent=fixed || 'Время начала по расписанию прошло · включайте плеер';
      return;
    }
    label.textContent='До стартового свистка'; values.hidden=false;
    const parts=[Math.floor(left/86400000),Math.floor(left/3600000)%24,Math.floor(left/60000)%60,Math.floor(left/1000)%60];
    ['Days','Hours','Minutes','Seconds'].forEach((key,i)=>document.getElementById('match'+key).textContent=String(parts[i]).padStart(2,'0'));
  }
  tick();setInterval(tick,1000);
})();
