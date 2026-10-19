import {isLocalModelPath, phaseAt, clipTimeAt} from './timeline.js';
import * as THREE from 'https://esm.sh/three@0.170.0';
import {OrbitControls} from 'https://esm.sh/three@0.170.0/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'https://esm.sh/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
const stage=document.getElementById('stage'),error=document.getElementById('error');
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}catch(e){error.style.display='grid';throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(stage.clientWidth,stage.clientHeight);renderer.shadowMap.enabled=true;stage.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#102332');
const camera=new THREE.PerspectiveCamera(45,stage.clientWidth/stage.clientHeight,.1,100);camera.position.set(8,8,12);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1,0);controls.enableDamping=true;controls.minDistance=4;controls.maxDistance=30;controls.maxPolarAngle=Math.PI/2-.04;
scene.add(new THREE.HemisphereLight(0xd9f4ff,0x284b35,2));const sun=new THREE.DirectionalLight(0xffffff,2.4);sun.position.set(5,12,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const field=new THREE.Mesh(new THREE.PlaneGeometry(36,24),new THREE.MeshStandardMaterial({color:0x20563e,roughness:1}));field.rotation.x=-Math.PI/2;field.receiveShadow=true;scene.add(field);
const lineMat=new THREE.MeshBasicMaterial({color:0xc3e4d8});for(let x=-16;x<=16;x+=4){const line=new THREE.Mesh(new THREE.PlaneGeometry(.055,22),lineMat);line.rotation.x=-Math.PI/2;line.position.set(x,.012,0);scene.add(line)}
function part(parent,geometry,color,x,y,z){const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.75}));mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh}
// Иерархический процедурный риг: каждый сустав имеет собственную точку вращения.
function player(shirt,x,z){
 const root=new THREE.Group();scene.add(root);root.position.set(x,0,z);
 const pelvis=new THREE.Group();pelvis.position.y=1.5;root.add(pelvis);
 part(pelvis,new THREE.BoxGeometry(.61,.35,.42),0x1c2a36,0,-.06,0);
 const spine=new THREE.Group();spine.position.y=.19;pelvis.add(spine);
 const torso=part(spine,new THREE.BoxGeometry(.78,.75,.43),shirt,0,.38,0);
 const neck=new THREE.Group();neck.position.y=.82;spine.add(neck);
 part(neck,new THREE.CylinderGeometry(.11,.12,.16,10),0xe4b58d,0,.06,0);
 part(neck,new THREE.SphereGeometry(.235,16,12),0xe4b58d,0,.36,0);
 const arms=[],elbows=[],legs=[],knees=[];
 for(const s of [-1,1]){
  const shoulder=new THREE.Group();shoulder.position.set(s*.48,.71,0);spine.add(shoulder);
  part(shoulder,new THREE.CapsuleGeometry(.125,.38,5,10),shirt,0,-.3,0);
  const elbow=new THREE.Group();elbow.position.y=-.59;shoulder.add(elbow);
  part(elbow,new THREE.CapsuleGeometry(.095,.31,5,10),0xe4b58d,0,-.23,0);
  part(elbow,new THREE.SphereGeometry(.11,10,8),0xe4b58d,0,-.48,0);
  arms.push(shoulder);elbows.push(elbow);
  const hip=new THREE.Group();hip.position.set(s*.19,-.19,0);pelvis.add(hip);
  part(hip,new THREE.CapsuleGeometry(.16,.4,5,10),0x25384a,0,-.34,0);
  const knee=new THREE.Group();knee.position.y=-.62;hip.add(knee);
  part(knee,new THREE.CapsuleGeometry(.12,.37,5,10),0x23313e,0,-.29,0);
  part(knee,new THREE.BoxGeometry(.24,.13,.43),0x101b24,0,-.62,.13);
  legs.push(hip);knees.push(knee);
 }
 return {root,pelvis,spine,neck,torso,arms,elbows,legs,knees};
}
const carrier=player(0xf3f4f5,-5,0),tackler=player(0xc43f43,-.9,-1.1),support=player(0xc43f43,4,1.1);
// GLB-конвейер: модели загружаются только из локального каталога assets/models.
// При отсутствии файла сохраняется рабочий процедурный риг, без пустого поля.
const actors={carrier,tackler,support};
const gltfLoader=new GLTFLoader();
const modelStatus=document.getElementById('modelStatus');
async function loadVisualModels(){
 let manifest;
 try{
  const response=await fetch('./models.json',{cache:'no-store'});
  if(!response.ok)throw new Error('Манифест моделей недоступен');
  manifest=await response.json();
  if(!manifest||typeof manifest!=='object')throw new Error('Некорректный манифест');
 }catch(e){modelStatus.textContent='Временные 3D-модели · GLB пока не подключены';return}
 const tasks=Object.entries(actors).map(async ([name,actor])=>{
  const entry=manifest[name];if(!entry?.file)return false;
  // Запрещаем сторонние URL и выход за каталог моделей.
  if(!isLocalModelPath(entry.file))return false;
  try{
   const gltf=await gltfLoader.loadAsync('./'+entry.file);
   const visual=gltf.scene;
   visual.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true}});
   visual.scale.setScalar(Number.isFinite(entry.scale)&&entry.scale>0&&entry.scale<10?entry.scale:1);
   visual.rotation.y=Number.isFinite(entry.rotationY)?entry.rotationY:0;
   // Модель прикреплена к actor.root. Позиция и таймлайн остаются общими.
   // Отдельная опорная группа позволяет управлять визуальной моделью независимо от рига-заглушки.
   const anchor=new THREE.Group();actor.root.add(anchor);anchor.add(visual);actor.visualAnchor=anchor;
   actor.visual=visual;actor.mixer=gltf.animations.length?new THREE.AnimationMixer(visual):null;
   actor.clips=gltf.animations;
   actor.actions={};
   if(actor.mixer){
    for(const clip of actor.clips){const action=actor.mixer.clipAction(clip);action.play();action.paused=false;actor.actions[clip.name.toLowerCase()]=action}
   }
   actor.pelvis.visible=false;
   return true;
  }catch(e){return false}
 });
 const results=await Promise.all(tasks);
 const count=results.filter(Boolean).length;
 modelStatus.textContent=count===3?'GLB-модели загружены':count?('GLB-модели: '+count+'/3 · остальные временные'):'Временные 3D-модели · GLB пока не подключены';
}
loadVisualModels();
const ball=new THREE.Group();scene.add(ball);
const ballMesh=part(ball,new THREE.SphereGeometry(1,24,16),0xe7d2a6,0,0,0);ballMesh.scale.set(.31,.19,.19);
const seam=new THREE.Mesh(new THREE.TorusGeometry(.185,.012,5,30),new THREE.MeshBasicMaterial({color:0x5e4633}));seam.rotation.y=Math.PI/2;ball.add(seam);
const seek=document.getElementById('seek'),play=document.getElementById('play'),timeEl=document.getElementById('time'),explanation=document.getElementById('explanation');let t=0,playing=false,speed=1,previous=performance.now(),review=false,detail=false;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)},lerp=(a,b,u)=>a+(b-a)*u;
function update(){
support.torso.material.emissive.setHex(review?0x476a00:0);
const markers=[...document.querySelectorAll('[data-seek]')];
const active=markers.filter(b=>Number(b.dataset.seek)<=t).at(-1);
markers.forEach(b=>b===active?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current'));
const approach=smooth(t/4),fall=smooth((t-3.8)/2.1),contest=smooth((t-6)/3);
carrier.root.position.set(lerp(-5,-.5,approach),0,0);carrier.root.rotation.set(0,0,0);
carrier.pelvis.rotation.z=-fall*1.18;carrier.pelvis.position.y=lerp(1.5,.66,fall);carrier.spine.rotation.z=-fall*.18;
const run=(1-fall)*Math.sin(t*10)*.48;carrier.legs[0].rotation.x=run;carrier.legs[1].rotation.x=-run;
carrier.knees[0].rotation.x=Math.max(0,-run)*.55+fall*.35;carrier.knees[1].rotation.x=Math.max(0,run)*.55+fall*.7;
carrier.arms[0].rotation.x=-run*.7;carrier.arms[1].rotation.x=run*.7;carrier.arms[0].rotation.z=-.25-fall*.35;carrier.arms[1].rotation.z=.25+fall*.35;
tackler.root.position.set(lerp(-.9,-.45,smooth((t-2.8)/1.6)),0,-lerp(1.1,.25,smooth((t-2.8)/1.6)));
const tackle=smooth((t-3.2)/1.8),release=smooth((t-5.3)/1.2);
tackler.pelvis.rotation.z=-tackle*.55;tackler.spine.rotation.z=-tackle*.25;
tackler.arms[0].rotation.z=-tackle*1.1+release*.9;tackler.arms[1].rotation.z=tackle*1.1-release*.9;
tackler.arms[0].rotation.x=-tackle*.4;tackler.arms[1].rotation.x=-tackle*.4;
tackler.legs[0].rotation.x=tackle*.35;tackler.legs[1].rotation.x=-tackle*.25;
support.root.position.set(lerp(4,.8,contest),0,lerp(1.1,.45,contest));
support.pelvis.rotation.z=-contest*.12;support.spine.rotation.z=-contest*.35;
support.arms[0].rotation.z=-contest*.8;support.arms[1].rotation.z=contest*.8;
support.legs[0].rotation.x=(1-contest)*Math.sin(t*8)*.35;support.legs[1].rotation.x=-(1-contest)*Math.sin(t*8)*.35;
// Кадрирование GLB-клипов по абсолютному времени делает перемотку детерминированной.
for(const [role,actor] of Object.entries(actors)){
 if(!actor.mixer||!actor.clips?.length)continue;
 const phase=phaseAt(role,t);
 const named=actor.clips.find(clip=>clip.name.toLowerCase()===phase.name);
 const clip=named||actor.clips[0];
 for(const action of Object.values(actor.actions))action.setEffectiveWeight(0);
 const action=actor.actions[clip.name.toLowerCase()];
 if(action){
 const clipTime=clipTimeAt(phase,t,clip.duration);
 action.enabled=true;action.setEffectiveWeight(1);actor.mixer.setTime(clipTime);
 }
}
// Синхронизируем наклон GLB с движением персонажа, даже если клип падения отсутствует.
if(carrier.visualAnchor){const fallback=!carrier.clips?.some(c=>c.name.toLowerCase()===phaseAt('carrier',t).name);carrier.visualAnchor.rotation.z=fallback?-fall*.85:0;carrier.visualAnchor.position.y=fallback?fall*.18:0}
if(tackler.visualAnchor)tackler.visualAnchor.rotation.z=tackler.clips?.some(c=>c.name.toLowerCase()===phaseAt('tackler',t).name)?0:-tackle*.4;
if(support.visualAnchor)support.visualAnchor.rotation.z=support.clips?.some(c=>c.name.toLowerCase()===phaseAt('support',t).name)?0:-contest*.15;
const ballRelease=smooth((t-5.1)/1.4);
ball.position.set(carrier.root.position.x+lerp(.28,.75,ballRelease),lerp(1.9,.21,fall),.35);
ball.rotation.z=fall*.8;
const phases=[[3.5,'Игрок с мячом продвигается навстречу защитнику.'],[5.8,'Захват: игрок с мячом опускается на землю.'],[7.3,'После захвата важно проверить действия захватывающего и освобождение мяча.'],[9.4,'Третий игрок приближается к месту захвата. Его право бороться за мяч зависит от положения и момента вступления.'],[12.1,'Контрольная остановка. Для решения необходимо установить, возник ли рак, и оценить действия каждого игрока.']];const simple=phases.find(p=>t<p[0])[1];explanation.textContent=review?'Разбор: захватывающий должен отпустить соперника, а игрок на земле — сделать мяч доступным. Третий игрок обязан оставаться на ногах. В этой сцене нет контакта двух стоящих соперников над мячом, поэтому образование рака не показано (World Rugby, правила 14 и 15).':detail?('Что проверяем: '+simple+' Судейское решение нельзя определить только по этой упрощённой постановке. Нужно отдельно установить момент завершения захвата, действия захватывающего, положение третьего игрока и факт образования рака.'):simple;timeEl.textContent=t.toFixed(1).replace('.',',')+' / 12,0 с';seek.value=t;play.textContent=playing?'Ⅱ Пауза':'▶ Воспроизвести'}
function setTime(v){review=false;t=clamp(v,0,12);update()}document.querySelectorAll('[data-seek]').forEach(b=>b.addEventListener('click',()=>{playing=false;setTime(Number(b.dataset.seek));document.querySelectorAll('[data-seek]').forEach(x=>x.removeAttribute('aria-current'));b.setAttribute('aria-current','step')}));const terms={tackle:['Tackle — захват','Игрок с мячом удерживается соперником и оказывается на земле. После захвата у участников возникают определённые обязанности.'],ruck:['Ruck — рак','Фаза игры, когда по меньшей мере по одному игроку каждой команды, находящемуся на ногах, вступают в контакт над мячом на земле.'],jackal:['Jackal — джекал','Общеупотребительное название попытки игрока завладеть мячом после захвата, пока рак ещё не образован. Это не отдельное правило.'],offside:['Offside — офсайд','Положение вне игры. Конкретные ограничения зависят от игровой ситуации и соответствующей линии офсайда.']};document.querySelectorAll('[data-term]').forEach(b=>b.addEventListener('click',()=>{const [title,body]=terms[b.dataset.term];const g=document.getElementById('glossary');g.replaceChildren();const strong=document.createElement('strong');strong.textContent=title;const p=document.createElement('p');p.textContent=body;g.append(strong,p);g.hidden=false}));play.onclick=()=>{review=false;if(t>=12)t=0;playing=!playing;update()};document.getElementById('restart').onclick=()=>{playing=false;setTime(0)};seek.oninput=e=>{playing=false;setTime(+e.target.value)};document.getElementById('speed').onchange=e=>speed=+e.target.value;
function view(x,y,z){camera.position.set(x,y,z);controls.target.set(0,1,0);controls.update()}document.getElementById('free').onclick=()=>view(8,8,12);document.getElementById('side').onclick=()=>view(0,4,13);document.getElementById('top').onclick=()=>view(0,16,.01);document.getElementById('resetCamera').onclick=()=>view(8,8,12);
document.getElementById('quality').onclick=e=>{const low=e.target.dataset.low!=='1';e.target.dataset.low=low?'1':'0';renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=!low;e.target.textContent=low?'Качество: низкое':'Качество: обычное';resize()};
document.getElementById('simple').onclick=()=>{detail=false;document.getElementById('simple').setAttribute('aria-pressed','true');document.getElementById('detailed').setAttribute('aria-pressed','false');update()};document.getElementById('detailed').onclick=()=>{detail=true;document.getElementById('simple').setAttribute('aria-pressed','false');document.getElementById('detailed').setAttribute('aria-pressed','true');update()};document.getElementById('review').onclick=()=>{playing=false;setTime(9.5);review=true;update();support.torso.material.emissive.setHex(0x476a00)};
function resize(){const w=stage.clientWidth,h=stage.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)}new ResizeObserver(resize).observe(stage);
document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName))return;if(e.code==='Space'){e.preventDefault();play.click()}else if(e.code==='ArrowRight'){playing=false;setTime(t+.25)}else if(e.code==='ArrowLeft'){playing=false;setTime(t-.25)}});function frame(now){const dt=Math.min((now-previous)/1000,.05);previous=now;if(playing){t=Math.min(12,t+dt*speed);if(t===12)playing=false;update()}controls.update();renderer.render(scene,camera);requestAnimationFrame(frame)}update();requestAnimationFrame(frame);
