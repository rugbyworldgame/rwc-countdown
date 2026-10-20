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
function skeleton(pelvis,lean,facing){
 const up=[Math.sin(lean),Math.cos(lean),0],front=mul([Math.cos(lean),-Math.sin(lean),0],facing);
 const local=(height,forward=0,z=0)=>add(add(add(pelvis,mul(up,height)),mul(front,forward)),[0,0,z]);
 return {pelvis,up,front,local,chest:local(.36),neck:local(.59),head:local(.74),shoulders:[local(.49,0,-.25),local(.49,0,.25)],hips:[local(0,0,-.13),local(0,0,.13)]};
}
function limbs(body,hands,feet){
 return {...body,arms:body.shoulders.map((p,i)=>solveLimb(p,hands[i],[body.front[0]*.3,body.pelvis[1]<.4?.4:-.5,i?1:-1],BODY.upperArm,BODY.forearm)),legs:body.hips.map((p,i)=>solveLimb(p,feet[i],[body.front[0],.8,0],BODY.thigh,BODY.shin))};
}
const offset=(point,x,y,z)=>add(point,[x,y,z]);
export function sampleEpisode(time){
 const t=Math.max(0,Math.min(12,Number.isFinite(time)?time:0));
 const approach=ease(t/3.8),wrap=ease((t-3.1)/.7),fall=ease((t-3.8)/1.8),release=ease((t-5.6)/.8),arrive=ease((t-6.4)/2.6),reach=ease((t-8.4)/.6),lift=ease((t-9.5)/1);
 const cx=-3.8+3.3*approach+.45*fall;
 const carrier=skeleton([cx,.96-.67*fall,0],1.48*fall,1);
 const carried=carrier.local(.32,.28-.16*fall,0),placed=[cx+.82,.16,-.32];
 const ball=mix(mix(carried,placed,release),[placed[0],.42,placed[2]],lift);
 const stride=Math.sin(t*8)*.19*(1-wrap);
 const carrierHands=[offset(ball,0,0,-.09),offset(ball,0,0,.09)].map((p,i)=>mix(p,carrier.local(.12,.2,i?.35:-.35),release));
 const carrierFeet=[-1,1].map((s,i)=>mix([cx+(i?stride:-stride),.09,s*.15],[cx-.69,.12,s*.18],fall));
 const defenderX=.4+(cx+.72-.4)*wrap+.65*release;
 const defenderZ=.35-.23*wrap+.5*release;
 const defender=skeleton([defenderX,.94-.22*wrap-.42*fall,defenderZ],-.65*wrap-.5*fall,-1);
 const defenderHands=[-1,1].map(s=>mix(defender.local(.02,.22,s*.32),carrier.local(.14,0,s*.21),wrap*(1-release)));
 const defenderFeet=[-1,1].map(s=>mix([defenderX+.08,.09,defenderZ+s*.2],[defenderX+.5,.1,defenderZ+s*.24],fall));
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
