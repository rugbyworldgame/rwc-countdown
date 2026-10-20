// Авторская процедурная модель. Никаких сторонних моделей или текстур.
import * as THREE from 'https://esm.sh/three@0.170.0';
const yAxis=new THREE.Vector3(0,1,0);
// Общий скелет для деформируемой оболочки и существующей постановки.
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
// Closed ring surface with smooth normals and two normalized bone influences.
function skinSurface(rings,radial,skeleton,materials){
 const positions=[],indices=[],weights=[],triangles=[],groups=[];
 for(const ring of rings){
  const center=new THREE.Vector3(...ring.center),axis=new THREE.Vector3(...ring.axis).normalize();
  const u=new THREE.Vector3(0,0,1).addScaledVector(axis,-axis.z).normalize();
  const v=new THREE.Vector3().crossVectors(axis,u).normalize();
  for(let j=0;j<radial;j++){
   const angle=j/radial*Math.PI*2;
   const point=center.clone().addScaledVector(u,Math.cos(angle)*ring.width).addScaledVector(v,Math.sin(angle)*ring.depth);
   positions.push(...point.toArray());indices.push(...ring.bones,0,0);weights.push(1-ring.blend,ring.blend,0,0);
  }
 }
 for(let i=0;i<rings.length-1;i++){
  const start=triangles.length;
  for(let j=0;j<radial;j++){const a=i*radial+j,b=i*radial+(j+1)%radial,c=a+radial,d=b+radial;triangles.push(a,b,c,b,d,c)}
  groups.push([start,triangles.length-start,rings[i].material||0]);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geometry.setIndex(triangles);groups.forEach(g=>geometry.addGroup(...g));geometry.computeVertexNormals();
 const mesh=new THREE.SkinnedMesh(geometry,materials);mesh.bind(skeleton,new THREE.Matrix4());
 // Skeleton moves over the whole pitch; bind-pose bounds must not cull it.
 mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;
 return mesh;
}
export function createPlayer(scene,shirt,skin=0xc58b65){
 const root=new THREE.Group(),pelvis=new THREE.Group();root.add(pelvis);scene.add(root);const rig=createSkeletonRig(root);
 const software=!!scene.userData.software,skins=[],proxies=[];
 const materials={shirt:new THREE.MeshStandardMaterial({color:shirt,roughness:.9}),skin:new THREE.MeshStandardMaterial({color:skin,roughness:.85}),shorts:new THREE.MeshStandardMaterial({color:0x172737,roughness:.95}),boot:new THREE.MeshStandardMaterial({color:0x161b21,roughness:.55}),sock:new THREE.MeshStandardMaterial({color:shirt,roughness:1}),hair:new THREE.MeshStandardMaterial({color:0x30231e,roughness:1})};
 function ellipsoid(material,radii){const m=new THREE.Mesh(new THREE.SphereGeometry(1,software?12:28,software?8:20),material);m.scale.set(...radii);m.castShadow=true;pelvis.add(m);return m}
 const head=ellipsoid(materials.skin,[.10,.13,.105]),hair=ellipsoid(materials.hair,[.102,.055,.106]),nose=ellipsoid(materials.skin,[.025,.035,.025]);
 const neck=ellipsoid(materials.skin,[.065,.10,.065]);
 const hands=[0,1].map(()=>ellipsoid(materials.skin,[.045,.075,.035]));
 const boots=[0,1].map(()=>ellipsoid(materials.boot,[.15,.075,.068]));
 let torso;
 const index=name=>rig.skeleton.bones.indexOf(rig.bones[name]);
 const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t)};
 function addSkin(rings,mats){
  const mesh=skinSurface(rings,software?12:24,rig.skeleton,mats);skins.push(mesh);
  if(software){
   // SVGRenderer does not perform GPU skinning. Bake exactly the same bone
   // transforms into a separate Mesh, never overwrite the bind geometry.
   const proxy=new THREE.Mesh(mesh.geometry.clone(),mats);proxy.frustumCulled=false;pelvis.add(proxy);proxies.push(proxy);
  }else pelvis.add(mesh);
  return mesh;
 }
 function build(p){
  const profile=[[-.12,.001,.001],[-.08,.16,.115],[0,.18,.14],[.15,.205,.145],[.32,.25,.16],[.45,.255,.145],[.54,.16,.105],[.60,.07,.065],[.61,.001,.001]];
  const rings=[];
  for(let n=0;n<=40;n++){
   const h=-.12+n/40*.73;let k=0;while(k<profile.length-2&&h>profile[k+1][0])k++;
   const a=profile[k],b=profile[k+1],t=smooth((h-a[0])/(b[0]-a[0]));
   const upper=h>.18,blend=upper?smooth((h-.18)/.18):smooth(h/.18);
   rings.push({center:p.local(h),axis:p.up,width:a[1]+(b[1]-a[1])*t,depth:a[2]+(b[2]-a[2])*t,bones:[index(upper?'Spine':'Hips'),index(upper?'Chest':'Spine')],blend,material:h<.035?1:0});
  }
  torso=addSkin(rings,[materials.shirt,materials.shorts]);
  for(const [side,i] of [['L',0],['R',1]])for(const arm of [true,false]){
   const start=new THREE.Vector3(...(arm?p.shoulders[i]:p.hips[i]));
   const joint=new THREE.Vector3(...(arm?p.arms[i].joint:p.legs[i].joint));
   const end=new THREE.Vector3(...(arm?p.arms[i].end:p.legs[i].end));
   const first=joint.clone().sub(start),second=end.clone().sub(joint),a=first.length(),b=second.length();first.normalize();second.normalize();
   const list=[];
   for(let n=0;n<=40;n++){
    const d=n/40*(a+b),upper=d<=a,center=upper?start.clone().addScaledVector(first,d):joint.clone().addScaledVector(second,d-a);
    const blend=smooth((d-a+.095)/.19),axis=first.clone().lerp(second,blend).normalize();
    const fraction=upper?d/a:(d-a)/b;
    const radius=arm?(upper?.097-.028*fraction:.069-.027*fraction):(upper?.135-.047*fraction:.082+.009*Math.sin(fraction*Math.PI)-.032*fraction);
    const cap=Math.min(1,Math.sin(Math.min(1,n/2)*Math.PI/2),Math.sin(Math.min(1,(40-n)/2)*Math.PI/2));
    list.push({center:center.toArray(),axis:axis.toArray(),width:Math.max(.001,radius*cap),depth:Math.max(.001,radius*cap),bones:[index((arm?'UpperArm.':'UpperLeg.')+side),index((arm?'LowerArm.':'LowerLeg.')+side)],blend,material:arm?(d<a*.6?0:1):(d<a*.56?2:d>a+.12?3:1)});
   }
   addSkin(list,[materials.shirt,materials.skin,materials.shorts,materials.sock]);
  }
 }
 function point(mesh,p){mesh.position.set(...p)}
 function align(mesh,up){mesh.quaternion.setFromUnitVectors(yAxis,new THREE.Vector3(...up).normalize())}
 const vertex=new THREE.Vector3();
 function apply(p){
  rig.apply(p);if(!skins.length)build(p);
  point(head,p.head);align(head,p.up);point(neck,p.neck);align(neck,p.up);
  point(hair,p.head.map((v,i)=>v+p.up[i]*.10));align(hair,p.up);
  point(nose,p.head.map((v,i)=>v+p.front[i]*.105));
  hands.forEach((m,i)=>{point(m,p.arms[i].end);align(m,p.front)});
  boots.forEach((m,i)=>{point(m,p.legs[i].end);m.rotation.y=Math.atan2(-p.front[2],p.front[0])});
  if(software)skins.forEach((mesh,i)=>{
   const source=mesh.geometry.attributes.position,target=proxies[i].geometry.attributes.position;
   for(let j=0;j<source.count;j++){vertex.fromBufferAttribute(source,j);mesh.applyBoneTransform(j,vertex);target.setXYZ(j,vertex.x,vertex.y,vertex.z)}
   target.needsUpdate=true;proxies[i].geometry.computeVertexNormals();
  });
 }
 // Material handle retained for scene review highlights, independent of groups.
 return {root,pelvis,torso:{material:materials.shirt},apply,rig,skeleton:rig.skeleton,skins,proxies};
}
