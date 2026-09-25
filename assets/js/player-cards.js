// Progressive enhancement: untouched names remain useful if data or images fail.
const lineups = [...document.querySelectorAll('.lineups')];
const normalize = name => name.toLowerCase().replace(/ё/g,'е').replace(/\s*[—–]\s*капитан\s*$/,'').trim().replace(/\s+/g,' ');
const el = (tag, text) => { const node=document.createElement(tag); if(text) node.textContent=text; return node; };
async function start() {
  const response=await fetch('/assets/players/players.json');
  if(!response.ok) return;
  const data=await response.json(), aliases=new Map(), ids=new Map();
  for(const player of data.players || []) {
    if(!player.image?.src?.startsWith('/assets/players/') || !player.image.author || !player.image.licenseUrl) continue;
    ids.set(player.id,player);
    for(const name of [player.name,...(player.aliases||[])]) {
      const key=normalize(name);
      if(aliases.has(key) && aliases.get(key)?.id!==player.id) aliases.set(key,null);
      else if(!aliases.has(key)) aliases.set(key,player);
    }
  }
  const box=el('div');box.className='player-photo-popover';box.id='player-photo-popover';box.hidden=true;
  box.setAttribute('role','dialog');box.setAttribute('aria-label','Фотография игрока');
  document.body.append(box);
  let active=null,pinned=false,ticket=0,leaveTimer;
  const cache=new Map(),buttons=new Map();
  function close(returnFocus=false) {
    ticket++; clearTimeout(leaveTimer); const previous=active;
    active?.setAttribute('aria-expanded','false');active=null;pinned=false;box.hidden=true;
    if(returnFocus) previous?.focus({preventScroll:true});
  }
  function position() {
    if(!active || box.hidden) return;
    const v=window.visualViewport, w=v?.width||innerWidth,h=v?.height||innerHeight,ox=v?.offsetLeft||0,oy=v?.offsetTop||0;
    box.style.width=Math.min(260,w-24)+'px';box.style.maxHeight=(h-24)+'px';
    const r=active.getBoundingClientRect(),bh=box.getBoundingClientRect().height;
    box.style.left=Math.max(ox+12,Math.min(r.left,ox+w-box.offsetWidth-12))+'px';
    const y=r.top-bh-10>=oy+12?r.top-bh-10:r.bottom+10;
    box.style.top=Math.max(oy+12,Math.min(y,oy+h-bh-12))+'px';
  }
  function imageFor(player) {
    if(!cache.has(player.id)) cache.set(player.id,new Promise((resolve,reject)=>{
      const img=new Image();img.alt=player.name;img.width=player.image.width;img.height=player.image.height;
      img.decoding='async';img.onload=()=>resolve(img);img.onerror=reject;img.src=player.image.src;
    }));
    return cache.get(player.id);
  }
  function link(text,href) {const a=el('a',text);a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a;}
  async function open(button,player,pin=false) {
    clearTimeout(leaveTimer);
    if(active===button) {if(pin)pinned=true;return;}
    close();active=button;pinned=pin;const request=++ticket;
    try {
      const img=await imageFor(player);
      if(ticket!==request || active!==button)return;
      const title=el('h3',player.name),dismiss=el('button','×');dismiss.type='button';dismiss.className='player-photo-close';dismiss.setAttribute('aria-label','Закрыть фотографию');dismiss.onclick=()=>close(true);
      const credit=el('p',`Фото ${player.image.year} · ${player.image.author}. `);
      credit.append(link('Источник',player.image.source),' · ',link(player.image.license,player.image.licenseUrl));
      const changes=el('p',player.image.changes);
      box.replaceChildren(dismiss,title,img,credit,changes);box.hidden=false;button.setAttribute('aria-expanded','true');position();
    } catch {
      if(active===button)close();
      for(const b of buttons.get(player.id)||[]) b.replaceWith(document.createTextNode(b.textContent));
    }
  }
  const leave=()=>{clearTimeout(leaveTimer);leaveTimer=setTimeout(()=>{if(!pinned&&!box.matches(':hover')&&!box.contains(document.activeElement)&&!active?.matches(':hover'))close();},180);};
  box.addEventListener('pointerenter',()=>clearTimeout(leaveTimer));box.addEventListener('pointerleave',leave);
  for(const section of lineups) {
    let count=0;
    for(const item of section.querySelectorAll('.lineup-card li')) {
      if(item.querySelector('a,button'))continue;
      const player=item.dataset.playerId?ids.get(item.dataset.playerId):aliases.get(normalize(item.textContent));
      if(!player)continue;
      const button=el('button',item.textContent);button.type='button';button.className='player-photo-trigger';
      button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls',box.id);button.setAttribute('aria-expanded','false');
      button.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')open(button,player);});
      button.addEventListener('pointerleave',leave);
      button.addEventListener('click',()=>{if(active===button&&pinned)close();else open(button,player,true);});
      button.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();open(button,player,true).then(()=>{if(active===button&&!box.hidden)box.querySelector('button').focus();});}});
      item.replaceChildren(button);if(!buttons.has(player.id))buttons.set(player.id,[]);buttons.get(player.id).push(button);count++;
    }
    if(count){const hint=el('p','Подчёркнутые имена: наведите курсор или нажмите, чтобы увидеть фото.');hint.className='player-photo-hint';section.querySelector('.lineup-grid')?.before(hint);}
  }
  document.addEventListener('pointerdown',event=>{if(active&&!active.contains(event.target)&&!box.contains(event.target))close();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active){event.preventDefault();close(true);}});
  document.addEventListener('focusin',event=>{if(active&&!active.contains(event.target)&&!box.contains(event.target))close();});
  document.addEventListener('scroll',event=>{if(!box.contains(event.target))close();},true);
  window.addEventListener('resize',position);window.visualViewport?.addEventListener('resize',position);
}
if(lineups.length) start().catch(()=>{});
