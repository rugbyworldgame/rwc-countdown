// Авторская процедурная модель. Никаких сторонних моделей или текстур.
import * as THREE from 'https://esm.sh/three@0.170.0';
const yAxis=new THREE.Vector3(0,1,0);
// Скелет служит общим контрактом для будущей привязки SkinnedMesh/GLB.
// Текущие визуальные части пока отдельные Mesh, а не скиннированная оболочка.
function createSkeletonRig(root){
 const bones={},order=[];
 function bone(name,parent){const b=new THREE.Bone();b.name=name;(parent?bones[parent]:root).add(b);bones[name]=b;order.push(b)}
 bone('Hips');bone('Spine','Hips');bone('Chest','Spine');bone('Neck','Chest');bone('Head','Neck');
 for(const side of ['L','R']){bone('UpperArm.'+side,'Chest');bone('LowerArm.'+side,'UpperArm.'+side);bone('Hand.'+side,'LowerArm.'+side);bone('UpperLeg.'+side,'Hips');bone('LowerLeg.'+side,'UpperLeg.'+side);bone('Foot.'+side,'LowerLeg.'+side)}
 const skeleton=new THREE.Skeleton(order);let bound=false;
 function apply(p){
  const positions={Hips:p.pelvis,Spine:p.local(.18),Chest:p.chest,Neck:p.neck,Head:p.head};
  const directions={Hips:p.up,Spine:p.up,Chest:p.up,Neck:p.up,Head:p.up};
  ['L','R'].forEach((side,i)=>{
   positions['UpperArm.'+side]=p.shoulders[i];positions['LowerArm.'+side]=p.arms[i].joint;positions['Hand.'+side]=p.arms[i].end;
   positions['UpperLeg.'+side]=p.hips[i];positions['LowerLeg.'+side]=p.legs[i].joint;positions['Foot.'+side]=p.legs[i].end;
   directions['Hand.'+side]=p.front;directions['Foot.'+side]=p.front;
   for(const [a,b] of [['UpperArm','LowerArm'],['LowerArm','Hand'],['UpperLeg','LowerLeg'],['LowerLeg','Foot']])directions[a+'.'+side]=positions[b+'.'+side].map((v,j)=>v-positions[a+'.'+side][j]);
  });
  root.updateMatrixWorld(true);
  for(const b of order){
   b.position.copy(b.parent.worldToLocal(new THREE.Vector3(...positions[b.name])));
   const world=new THREE.Quaternion().setFromUnitVectors(yAxis,new THREE.Vector3(...directions[b.name]).normalize());
   b.quaternion.copy(b.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));
   b.updateMatrixWorld(true);
  }
  if(!bound){skeleton.calculateInverses();bound=true}skeleton.update();
 }
 return {bones,skeleton,apply};
}
export function createPlayer(scene,shirt,skin=0xc58b65){
 const root=new THREE.Group(),pelvis=new THREE.Group();root.add(pelvis);scene.add(root);const rig=createSkeletonRig(root);
 const materials={shirt:new THREE.MeshStandardMaterial({color:shirt,roughness:.9}),skin:new THREE.MeshStandardMaterial({color:skin,roughness:.85}),shorts:new THREE.MeshStandardMaterial({color:0x172737,roughness:.95}),boot:new THREE.MeshStandardMaterial({color:0x161b21,roughness:.55}),sock:new THREE.MeshStandardMaterial({color:shirt,roughness:1}),hair:new THREE.MeshStandardMaterial({color:0x30231e,roughness:1})};
 function ellipsoid(material,radii){const m=new THREE.Mesh(new THREE.SphereGeometry(1,scene.userData.software?12:24,scene.userData.software?8:16),material);m.scale.set(...radii);m.castShadow=true;pelvis.add(m);return m}
 function segment(material,radius){const m=new THREE.Mesh(new THREE.CapsuleGeometry(radius,.8,4,scene.userData.software?8:16),material);m.geometry.scale(1,1/(.8+2*radius),1);m.castShadow=true;pelvis.add(m);return m}
 const torso=ellipsoid(materials.shirt,[.16,.29,.26]),waist=ellipsoid(materials.shorts,[.15,.14,.18]);
 const neck=segment(materials.skin,.065),head=ellipsoid(materials.skin,[.10,.13,.105]),hair=ellipsoid(materials.hair,[.102,.055,.106]);
 const nose=ellipsoid(materials.skin,[.025,.035,.025]);
 const arms=[0,1].map(()=>({shoulder:ellipsoid(materials.shirt,[.105,.11,.105]),upper:segment(materials.shirt,.085),lower:segment(materials.skin,.062),elbow:ellipsoid(materials.skin,[.068,.068,.068]),hand:ellipsoid(materials.skin,[.045,.075,.035])}));
 const legs=[0,1].map(()=>({shorts:segment(materials.shorts,.122),upper:segment(materials.skin,.105),lower:segment(materials.sock,.074),knee:ellipsoid(materials.skin,[.078,.078,.078]),boot:ellipsoid(materials.boot,[.15,.075,.068])}));
 function point(mesh,p){mesh.position.set(...p)}
 function align(mesh,up){mesh.quaternion.setFromUnitVectors(yAxis,new THREE.Vector3(...up).normalize())}
 function link(mesh,a,b){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);mesh.position.copy(start).add(end).multiplyScalar(.5);const delta=end.sub(start);mesh.scale.y=delta.length();mesh.quaternion.setFromUnitVectors(yAxis,delta.normalize())}
 function apply(pose){
  rig.apply(pose);
  point(torso,pose.chest);align(torso,pose.up);point(waist,pose.pelvis);align(waist,pose.up);
  link(neck,pose.neck,pose.head);point(head,pose.head);align(head,pose.up);
  point(hair,pose.head.map((v,i)=>v+pose.up[i]*.10));align(hair,pose.up);
  point(nose,pose.head.map((v,i)=>v+pose.front[i]*.105));
  arms.forEach((a,i)=>{const p=pose.arms[i];point(a.shoulder,pose.shoulders[i]);link(a.upper,pose.shoulders[i],p.joint);link(a.lower,p.joint,p.end);point(a.elbow,p.joint);point(a.hand,p.end);align(a.hand,pose.front)});
  legs.forEach((a,i)=>{const p=pose.legs[i];link(a.shorts,pose.hips[i],pose.hips[i].map((v,j)=>v+(p.joint[j]-v)*.58));link(a.upper,pose.hips[i],p.joint);link(a.lower,p.joint,p.end);point(a.knee,p.joint);point(a.boot,p.end)});
 }
 return {root,pelvis,torso,apply,rig,skeleton:rig.skeleton};
}
