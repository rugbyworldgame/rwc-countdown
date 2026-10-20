// Интеграционная проверка без WebGL: настоящая геометрия Three.js,
// имитация DOM, renderer и OrbitControls. Не заменяет браузерную проверку.
// THREE_MODULE=file:///path/to/three.mjs node rugby-lab/check-scene.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import * as choreography from './choreography.js';
import * as timeline from './timeline.js';
import {rendererReport} from './renderer-startup.js';
if(!process.env.THREE_MODULE)throw new Error('Укажите THREE_MODULE (локальный модуль Three.js 0.170.0)');
const actual=await import(process.env.THREE_MODULE);
assert.equal(actual.REVISION,'170');
class Element {
 constructor(){this.attributes={};this.style={};this.dataset={};this.clientWidth=1100;this.clientHeight=550;this.children=[];this.material={};}
 setAttribute(k,v){this.attributes[k]=v}
 removeAttribute(k){delete this.attributes[k]}
 addEventListener(k,fn){this[k]=fn}
 append(...v){this.children.push(...v)}
 replaceChildren(){this.children=[]}
 click(){(this.onclick||this['click-handler'])?.({target:this})}
}
const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id)};
const markers=[0,4.4,6.4,8.7,10.5].map(t=>{const e=new Element();e.dataset.seek=String(t);e.addEventListener=(k,fn)=>e['click-handler']=fn;return e});
const terms=['tackle','ruck','jackal','offside'].map(term=>{const e=new Element();e.dataset.term=term;e.addEventListener=(k,fn)=>e['click-handler']=fn;return e});
const document={getElementById:node,querySelectorAll:q=>q==='[data-seek]'?markers:terms,createElement:()=>new Element(),addEventListener:(k,fn)=>document[k]=fn,activeElement:null};
let frame;
class Renderer{constructor(){this.domElement=new Element();this.shadowMap={}}setPixelRatio(){}setSize(){}render(){}}
class Controls{constructor(){this.target=new actual.Vector3()}update(){}}
const context=vm.createContext({...choreography,...timeline,rendererReport,startWebGL:()=>({renderer:new Renderer(),attempts:[],antialias:true}),THREE:{...actual,WebGLRenderer:Renderer},OrbitControls:Controls,GLTFLoader:class {},document,devicePixelRatio:1,performance:{now:()=>0},ResizeObserver:class{observe(){}},fetch:async()=>({ok:true,json:async()=>({carrier:null,tackler:null,support:null})}),requestAnimationFrame:fn=>frame=fn,console});
const strip=source=>source.replace(/^import .*;\n/gm,'').replace('export function createPlayer','function createPlayer');
vm.runInContext(strip(await fs.readFile(new URL('./characters.js',import.meta.url),'utf8')),context);
const sceneSource=strip(await fs.readFile(new URL('./scene.js',import.meta.url),'utf8'));
// The simulated renderer succeeds, so the fallback import is never executed.
vm.runInContext(sceneSource.replace("await import('https://esm.sh/three@0.170.0/examples/jsm/renderers/SVGRenderer.js')","null"),context);
for(const time of [0,4.4,6.4,8.7,10.5,12,0]){
 node('seek').oninput({target:{value:time}});
 assert.equal(Number(node('seek').value),time);
 const result=vm.runInContext(`(()=>{scene.updateMatrixWorld(true);let count=0;scene.traverse(n=>{if(n.isMesh){count++;if(!n.matrixWorld.elements.every(Number.isFinite))throw Error('Invalid mesh matrix')}});return count})()`,context);
 assert.ok(result>=40);
}
node('review').onclick();assert.ok(node('explanation').textContent.includes('Разбор:'));
node('detailed').onclick();assert.ok(node('explanation').textContent.includes('Разбор:'));
node('restart').onclick();assert.equal(Number(node('seek').value),0);assert.equal(vm.runInContext('support.torso.material.emissive.getHex()',context),0);
markers[3].click();assert.equal(Number(node('seek').value),8.7);assert.equal(markers[3].attributes['aria-current'],'step');
node('speed').onchange({target:{value:'.5'}});node('play').onclick();frame(50);assert.ok(Number(node('seek').value)>8.7);
node('play').onclick();const paused=Number(node('seek').value);frame(100);assert.equal(Number(node('seek').value),paused);
for(const id of ['top','side','free','resetCamera']){node(id).onclick();assert.ok(vm.runInContext('camera.position.toArray().every(Number.isFinite)',context))}
node('quality').onclick({target:node('quality')});assert.equal(node('quality').dataset.low,'1');
node('stage').clientWidth=390;node('stage').clientHeight=320;vm.runInContext('resize()',context);assert.equal(vm.runInContext('camera.aspect',context),390/320);
terms[1].click();assert.equal(node('glossary').hidden,false);
for(const time of [0,3.8,5.6,9,12,0]){
 vm.runInContext(`setTime(${time})`,context);
 const rigErrors=vm.runInContext(`(()=>{const errors=[];const pose=sampleEpisode(t);for(const [role,actor] of Object.entries(actors)){for(const [bone,target] of [['Hand.L',pose[role].arms[0].end],['Hand.R',pose[role].arms[1].end],['Foot.L',pose[role].legs[0].end],['Head',pose[role].head]])errors.push(actor.rig.bones[bone].getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(...target)))}return errors})()`,context);
 assert.ok(rigErrors.every(error=>error<1e-6));
}
console.log('PASS: Three.js geometry, seek/restart/review, playback/pause/speed, cameras, quality, resize and glossary (mock DOM/renderer; no WebGL).');

// Real skin attributes, deformed vertices, deterministic seeking and SVG parity.
vm.runInContext(`globalThis.svgScene=new THREE.Scene();svgScene.userData.software=true;globalThis.svgActor=createPlayer(svgScene,0xffffff);svgActor.apply(sampleEpisode(0).carrier);`,context);
for(const time of [0,3.8,4.4,5.6,6.4,9,12,0]){
 const result=vm.runInContext(`(()=>{
  setTime(${time});svgActor.apply(sampleEpisode(${time}).carrier);
  let maximumError=0,weighted=0;
  for(const actor of [carrier,tackler,support,svgActor]){
   if(actor.skins.length!==5)throw Error('Missing deformable surfaces');
   actor.skins.forEach((mesh,m)=>{
    if(!mesh.isSkinnedMesh)throw Error('Expected SkinnedMesh');
    const {position,skinIndex,skinWeight}=mesh.geometry.attributes;
    for(let i=0;i<position.count;i++){
     const sum=skinWeight.getX(i)+skinWeight.getY(i);
     if(Math.abs(sum-1)>1e-6||skinIndex.getX(i)>=17||skinIndex.getY(i)>=17)throw Error('Invalid skin weights');
     if(skinWeight.getX(i)>0&&skinWeight.getY(i)>0)weighted++;
     const vertex=mesh.applyBoneTransform(i,new THREE.Vector3().fromBufferAttribute(position,i));
     if(!vertex.toArray().every(Number.isFinite))throw Error('Invalid deformed vertex');
     if(vertex.y<0)throw Error('Body surface below turf at '+t+': '+vertex.y);
     if(vertex.distanceTo(new THREE.Vector3(...sampleEpisode(${time})[actor===tackler?'tackler':actor===support?'support':'carrier'].pelvis))>2.2)throw Error('Exploded skin');
     if(actor===svgActor)maximumError=Math.max(maximumError,vertex.distanceTo(new THREE.Vector3().fromBufferAttribute(actor.proxies[m].geometry.attributes.position,i)));
    }
   });
  }
  return {maximumError,weighted,sample:carrier.skins[1].applyBoneTransform(200,new THREE.Vector3().fromBufferAttribute(carrier.skins[1].geometry.attributes.position,200)).toArray()};
 })()`,context);
 assert.ok(result.maximumError<1e-6);assert.ok(result.weighted>100);
 if(time===0){if(globalThis.initialSkinSample)assert.deepEqual(result.sample,globalThis.initialSkinSample);else globalThis.initialSkinSample=result.sample;}
}
console.log('PASS: five SkinnedMesh surfaces per player, normalized weights, finite deformations, SVG CPU parity, reverse seek.');
// Corrected joints must retain their cross-section throughout the episode.
for(let frame=0;frame<=120;frame++){
 const time=frame/10;
 const minimum=vm.runInContext(`(()=>{setTime(${time});let minimum=Infinity;
 for(const actor of [carrier,tackler,support])for(const mesh of actor.skins.slice(1)){
  const positions=mesh.geometry.attributes.position,radial=positions.count/41;
  for(let ring=14;ring<=27;ring++){
   const a=ring*radial,b=a+radial/2;
   const first=mesh.applyBoneTransform(a,new THREE.Vector3().fromBufferAttribute(positions,a));
   const second=mesh.applyBoneTransform(b,new THREE.Vector3().fromBufferAttribute(positions,b));
   minimum=Math.min(minimum,first.distanceTo(second));
  }
 }return minimum})()`,context);
 assert.ok(minimum>.075,`Collapsed joint at ${time}: ${minimum}`);
}
vm.runInContext('setTime(0)',context);
node('resetCamera').onclick();
assert.ok(vm.runInContext('camera.position.distanceTo(controls.target)<8',context));
console.log('PASS: joint thickness across 121 poses; closer reset camera.');

for(const time of [0,4.4,5.6,9]){
 vm.runInContext(`setTime(${time});scene.updateMatrixWorld(true)`,context);
 const error=vm.runInContext(`(()=>{const p=sampleEpisode(t);return Math.max(...Object.entries(actors).map(([role,actor])=>new THREE.Vector3(1,0,0).applyQuaternion(actor.head.quaternion).distanceTo(new THREE.Vector3(...p[role].headFront))))})()`,context);
 assert.ok(error<1e-6,'Face must follow the intended direction');
}
node('close').onclick();assert.ok(vm.runInContext('camera.position.distanceTo(controls.target)<5',context));
console.log('PASS: head orientation and inspection camera.');
