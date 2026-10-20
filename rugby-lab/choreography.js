// Метры, Y вверх, атака белых вдоль +X. Чистая постановка по абсолютному времени.
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,s)=>a.map(v=>v*s);
export const length=a=>Math.hypot(...a);
export const unit=a=>mul(a,1/(length(a)||1));
export const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const clamp=t=>Math.max(0,Math.min(1,t));
export const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
export const BODY={upperArm:.32,forearm:.30,thigh:.43,shin:.43};
// Аналитическая двухзвенная IK; цель за пределами досягаемости ограничивается.
export function solveLimb(start,target,pole,a,b){
 const delta=sub(target,start),direction=length(delta)>1e-9?unit(delta):[0,-1,0];
 const distance=Math.max(Math.abs(a-b)+1e-6,Math.min(a+b-1e-6,length(delta)));
 let bend=sub(pole,mul(direction,dot(pole,direction)));
 if(length(bend)<1e-6){const axis=Math.abs(direction[0])<.8?[1,0,0]:[0,0,1];bend=sub(axis,mul(direction,dot(axis,direction)))}
 bend=unit(bend);
 const along=(a*a-b*b+distance*distance)/(2*distance);
 return {joint:add(add(start,mul(direction,along)),mul(bend,Math.sqrt(Math.max(0,a*a-along*along)))),end:add(start,mul(direction,distance))};
}
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function skeleton(pelvis,lean,facing,roll=0){
 const up=[Math.sin(lean),Math.cos(lean)*Math.cos(roll),Math.cos(lean)*Math.sin(roll)];
 const front=mul([Math.cos(lean),-Math.sin(lean)*Math.cos(roll),-Math.sin(lean)*Math.sin(roll)],facing);
 const side=mul(unit(cross(front,up)),facing);
 const local=(height,forward=0,z=0)=>add(add(add(pelvis,mul(up,height)),mul(front,forward)),mul(side,z));
 // Look ahead during approach; lift the face clear of the turf on landing.
 const headFront=unit(add(front,[0,Math.max(0,Math.abs(lean)-.5)*.65,0]));
 const headSide=unit(cross(headFront,up)),headUp=unit(cross(headSide,headFront));
 return {pelvis,up,front,side,headFront,headUp,local,chest:local(.36),neck:local(.59),head:local(.74),shoulders:[local(.49,0,-.25),local(.49,0,.25)],hips:[local(0,0,-.13),local(0,0,.13)]};
}
function limbs(body,hands,feet){
 const arms=body.shoulders.map((p,i)=>solveLimb(p,hands[i],add(mul(body.side,i?1:-1),mul(body.up,-.35)),BODY.upperArm,BODY.forearm));
 const legs=body.hips.map((p,i)=>{
  const preferred=add(mul(body.front,.7),[0,.8,0]);
  let result=solveLimb(p,feet[i],preferred,BODY.thigh,BODY.shin);
  // Smoothly raise the knee pole near the turf, retaining exact bone lengths.
  const correction=ease((.16-result.joint[1])/.10);
  if(correction>0)result=solveLimb(p,feet[i],mix(preferred,[0,1,0],correction),BODY.thigh,BODY.shin);
  return result;
 });
 return {...body,arms,legs};
}
// World-space stance endpoints: each planted foot stays fixed while the pelvis
// travels over it; the other foot follows a lifted swing arc.
function gait(x0,x1,t,start,duration,z,facing=1){
 const u=Math.max(0,Math.min(1,(t-start)/duration)),steps=4,progress=u*steps;
 return [-1,1].map((side,i)=>{
  const phase=progress+i*.5,cycle=Math.floor(phase),f=phase-cycle;
  const from=Math.max(0,Math.min(1,(cycle-i*.5)/steps)),to=Math.max(0,Math.min(1,(cycle+1-i*.5)/steps));
  const swing=ease((f-.52)/.48),x=x0+(x1-x0)*(from+(to-from)*swing);
  return [x,.09+(f>.52?Math.sin(swing*Math.PI)*.12:0),z+side*.16*facing];
 });
}
const offset=(point,x,y,z)=>add(point,[x,y,z]);
export function sampleEpisode(time){
 const t=Math.max(0,Math.min(12,Number.isFinite(time)?time:0));
 const approach=Math.min(1,t/3.8),wrap=ease((t-3.1)/.7),fall=ease((t-3.8)/1.8),release=ease((t-5.6)/.8),arrive=ease((t-6.4)/2.6),reach=ease((t-8.4)/.6),lift=ease((t-9.5)/1);
 const cx=-3.8+3.3*approach+.45*fall;
 const sink=ease((t-3.8)/.55),tip=ease((t-4.15)/1.25),settle=ease((t-5.2)/.4);
 const carrier=skeleton([cx,.86-.11*sink-.48*tip-.025*settle,-.10*tip],.10+.08*sink+1.24*tip,1,.82*tip);
 const carried=carrier.local(.32,.28-.16*fall,0),placed=[cx+.82,.16,-.32];
 const ball=mix(mix(carried,placed,release),[placed[0],.42,placed[2]],lift);
 const carrierHands=[offset(ball,0,0,-.09),offset(ball,0,0,.09)].map((p,i)=>mix(p,carrier.local(.12,.2,i?.35:-.35),release));
 const walking=gait(-3.8,-.5,t,0,3.8,0);
 const carrierFeet=walking.map((foot,i)=>mix(foot,[cx-.65,.105+(i?.12:0),i?.32:-.22],tip));
 const defenderX=.4+(cx+.72-.4)*wrap+.65*release;
 const defenderZ=.42-.12*wrap+.62*release;
 const defender=skeleton([defenderX,.91-.22*wrap-.38*tip+.06*release,defenderZ],-.48*wrap-.82*tip+.48*release,-1,-.25*tip);
 const defenderHands=[-1,1].map(s=>mix(defender.local(.02,.22,s*.32),carrier.local(.14,0,s*.21),wrap*(1-release)));
 const defenderFeet=[-1,1].map(s=>mix([.48,.09,.42+s*.2],[defenderX+.55,.10,defenderZ+s*.24],Math.max(wrap*.35,tip,release)));
 const challengerX=3.4+(placed[0]+.40-3.4)*arrive;
 const challenger=skeleton([challengerX,.96-.41*reach,placed[2]],-1.15*reach,-1);
 const challengerHands=[-1,1].map(s=>mix(challenger.local(.1,.12,s*.27),offset(ball,0,0,s*.09),reach));
 const run=Math.sin((t-6.4)*8)*.18*(t>=6.4?1-arrive:0);
 const challengerFeet=[-1,1].map((s,i)=>[challengerX+(i?run:-run)+.12*reach,.09,placed[2]+s*.23]);
 return {time:t,ball,contact:wrap*(1-release),fall,release,reach,lift,
 carrier:limbs(carrier,carrierHands,carrierFeet),
 tackler:limbs(defender,defenderHands,defenderFeet),
 support:limbs(challenger,challengerHands,challengerFeet)};
}
