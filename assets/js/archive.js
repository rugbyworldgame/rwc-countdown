(()=>{
 const el=id=>document.getElementById(id),rows=Array.from(el('fixtures').children);
 const norm=s=>s.toLocaleLowerCase('ru').replaceAll('ё','е').trim();
 const entries=rows.map(row=>({row,name:norm(row.querySelector('a').textContent)}));
 let page=0;
 function show(){
  const q=norm(el('query').value),c=el('competition').value,s=el('season').value;
  const found=entries.filter(x=>x.name.includes(q)&&(!c||x.row.dataset.comp===c)&&(!s||x.row.dataset.season===s));
  const total=Math.ceil(found.length/25);
  page=Math.max(0,Math.min(page,total-1));
  const visible=new Set(found.slice(page*25,page*25+25));
  entries.forEach(x=>x.row.hidden=!visible.has(x));
  el('count').textContent=found.length?'Найдено матчей: '+found.length:'Матчей не найдено.';
  el('pages').hidden=total<=1;el('prev').disabled=page===0;el('next').disabled=page>=total-1;
  el('number').textContent=total?'Страница '+(page+1)+' из '+total:'';
 }
 function restart(){page=0;show()}
 el('query').oninput=restart;el('competition').onchange=el('season').onchange=restart;
 el('reset').onclick=()=>{for(const id of ['query','competition','season'])el(id).value='';restart()};
 function move(delta){page+=delta;show();el('fixtures').querySelector('li:not([hidden]) a')?.focus()}
 el('prev').onclick=()=>move(-1);el('next').onclick=()=>move(1);
 el('filters').hidden=false;show();
})();
