import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../assets/js/one-year.js',import.meta.url),'utf8');
const start=Date.parse('2026-09-30T21:00:00Z'),end=Date.parse('2026-10-01T21:00:00Z');
function run(home,initial){
 let now=initial,timers=new Map(),seq=0;
 class Node {
  constructor(classes=[]){this.children=[];this.hidden=false;this.classes=new Set(classes);this.classList={contains:x=>this.classes.has(x),add:x=>this.classes.add(x),remove:x=>this.classes.delete(x)};}
  append(n){this.children.push(n);n.parent=this;} prepend(n){this.children.unshift(n);n.parent=this;}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
  setAttribute(){}
 }
 const hero=new Node(),copy=new Node(),main=new Node(),head=new Node(),saved=[new Node(),new Node(),new Node(),new Node(['hero-actions'])];
 saved.forEach(n=>copy.append(n));
 const events={};const doc={head,getElementById:id=>head.children.find(x=>x.id===id),querySelector:s=>s==='.hero .hero-copy'?(home?copy:null):s==='.hero'?hero:s==='main'?main:null,createElement:()=>new Node(),addEventListener:(n,f)=>events[n]=f,removeEventListener:n=>delete events[n]};
 vm.runInNewContext(code,{document:doc,window:doc,Date:{now:()=>now,parse:Date.parse},setTimeout:(f,ms)=>{timers.set(++seq,{f,ms});return seq;},clearTimeout:id=>timers.delete(id)});
 const css=head.children[0];css?.onload();
 const active=()=>home?copy.children.length===5:main.children.length===1;
 function at(t){now=t;const callback=[...timers.values()][0]?.f;callback?.();}
 return {at,active,copy,hero,head,saved,timers,events};
}
for(const home of [true,false]){
 const x=run(home,start-1);assert.equal(x.active(),false);x.at(start);assert.equal(x.active(),true);x.at(end-1);assert.equal(x.active(),true);assert.equal([...x.timers.values()][0].ms,1);x.at(end);assert.equal(x.active(),false);assert.equal(x.head.children.length,0);assert.equal(x.timers.size,0);
 if(home){assert.deepEqual(x.copy.children,x.saved);assert(x.saved.every(n=>!n.hidden));assert(!x.hero.classes.has('one-year-hero'));}
 const late=run(home,end);assert.equal(late.active(),false);assert.equal(late.head.children.length,0);
 const resumed=run(home,start+1000);resumed.at(end+3600000);assert.equal(resumed.active(),false);
}
console.log('Campaign: inclusive start, exclusive end, exact boundary timer, late/sleeping tabs and original DOM restoration verified.');
