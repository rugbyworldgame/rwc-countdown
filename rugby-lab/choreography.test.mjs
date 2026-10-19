import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleEpisode,solveLimb,BODY,length,sub} from './choreography.js';
const near=(a,b,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
test('IK preserves limb lengths for reachable, unreachable and coincident targets',()=>{
 for(const target of [[.2,.3,.1],[10,0,0],[0,0,0]]){
  const result=solveLimb([0,0,0],target,[1,0,0],.32,.30);
  near(length(result.joint),.32);near(length(sub(result.end,result.joint)),.30);
 }
});
test('all 721 samples: finite poses, anatomical limb lengths and feet above ground',()=>{
 for(let i=0;i<=720;i++){
  const p=sampleEpisode(i/60);
  assert.ok(p.ball[1]>=.095, "Ball above field");
  for(const role of ['carrier','tackler','support']){
   const actor=p[role];
   for(const v of [actor.pelvis,actor.chest,actor.head,p.ball])assert.ok(v.every(Number.isFinite));
   actor.arms.forEach((limb,j)=>{near(length(sub(limb.joint,actor.shoulders[j])),BODY.upperArm);near(length(sub(limb.end,limb.joint)),BODY.forearm)});
   actor.legs.forEach((limb,j)=>{near(length(sub(limb.joint,actor.hips[j])),BODY.thigh);near(length(sub(limb.end,limb.joint)),BODY.shin);assert.ok(limb.end[1]>=.075);assert.ok(limb.joint[1]>=.078, "Knee above field")});
  }
 }
});
test('carrier holds ball, tackler grips torso during fall, challenger reaches and lifts ball',()=>{
 for(const time of [0,3.8,4.7,5.6]){
  const p=sampleEpisode(time);
  p.carrier.arms.forEach(arm=>near(length(sub(arm.end,p.ball)),.09));
 }
 for(const time of [3.8,4.7,5.6]){
  const p=sampleEpisode(time);
  p.tackler.arms.forEach((arm,i)=>near(length(sub(arm.end,p.carrier.local(.14,0,i?.21:-.21))),0));
 }
 for(const time of [9,9.5,10,10.5,12]){
  const p=sampleEpisode(time);p.support.arms.forEach(arm=>near(length(sub(arm.end,p.ball)),.09));
 }
 assert.ok(sampleEpisode(10.5).ball[1]>sampleEpisode(9).ball[1]);
});
test('seeking is deterministic; movement is continuous across phase boundaries',()=>{
 const serialize=t=>JSON.stringify(sampleEpisode(t));
 const initial=serialize(0),contact=serialize(4.7);sampleEpisode(12);
 assert.equal(serialize(0),initial);assert.equal(serialize(4.7),contact);
 for(const t of [3.1,3.8,5.6,6.4,8.4,9,9.5,10.5]){
  const before=sampleEpisode(t-.00001),after=sampleEpisode(t+.00001);
  assert.ok(length(sub(before.ball,after.ball))<.001);
  for(const role of ['carrier','tackler','support'])assert.ok(length(sub(before[role].pelvis,after[role].pelvis))<.001);
 }
});
