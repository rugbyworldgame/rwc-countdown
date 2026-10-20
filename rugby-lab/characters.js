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
  const u=new THREE.Vector3(0,0,1).addScaledVector(axis,-axis.z);
  if(u.lengthSq()<1e-8)u.set(1,0,0).addScaledVector(axis,-axis.x);
  u.normalize();
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
 const software=!!scene.userData.software,skins=[],proxies=[],limbSurfaces=[];
 const materials={shirt:new THREE.MeshStandardMaterial({color:shirt,roughness:.9}),skin:new THREE.MeshStandardMaterial({color:skin,roughness:.85}),shorts:new THREE.MeshStandardMaterial({color:0x172737,roughness:.95}),boot:new THREE.MeshStandardMaterial({color:0x161b21,roughness:.55}),sock:new THREE.MeshStandardMaterial({color:shirt,roughness:1}),hair:new THREE.MeshStandardMaterial({color:0x30231e,roughness:1})};
 function ellipsoid(material,radii){const m=new THREE.Mesh(new THREE.SphereGeometry(1,software?12:28,software?8:20),material);m.scale.set(...radii);m.castShadow=true;pelvis.add(m);return m}
 const head=ellipsoid(materials.skin,[.10,.13,.105]),hair=ellipsoid(materials.hair,[.102,.055,.106]),nose=ellipsoid(materials.skin,[.025,.035,.025]);
 const neck=ellipsoid(materials.skin,[.065,.10,.065]);
 const hands=[0,1].map(()=>ellipsoid(materials.skin,[.045,.075,.035]));
 const boots=[0,1].map(()=>ellipsoid(materials.boot,[.15,.075,.068]));

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
  const profile=new THREE.CatmullRomCurve3([[-.12,.001,.001],[-.07,.155,.12],[.05,.175,.137],[.20,.20,.15],[.35,.248,.164],[.43,.25,.15],[.50,.21,.125],[.56,.13,.09],[.61,.071,.065],[.65,.001,.001]].map(v=>new THREE.Vector3(...v)),false,'centripetal');
  const rings=[];
  for(let n=0;n<=40;n++){
   const section=profile.getPoint(n/40),h=section.x;
   const upper=h>.18,blend=upper?smooth((h-.18)/.18):smooth(h/.18);
   rings.push({center:p.local(h),axis:p.up,width:Math.max(.001,section.y),depth:Math.max(.001,section.z),bones:[index(upper?'Spine':'Hips'),index(upper?'Chest':'Spine')],blend,material:h<.035?1:0});
  }
  addSkin(rings,[materials.shirt,materials.shorts]);
  for(const [side,i] of [['L',0],['R',1]])for(const arm of [true,false]){
   const list=limbRings(p,arm,i,side);
   const mesh=addSkin(list,[materials.shirt,materials.skin,materials.shorts,materials.sock]);
   limbSurfaces.push({mesh,arm,i,side});
  }
 }
 // Pose-space corrective surface: a rounded bend with a transported frame.
 // Linear bone blending alone collapses the inside of deep elbows/knees.
 function limbRings(p,arm,i,side){
  const start=new THREE.Vector3(...(arm?p.shoulders[i]:p.hips[i]));
  const joint=new THREE.Vector3(...(arm?p.arms[i].joint:p.legs[i].joint));
  const end=new THREE.Vector3(...(arm?p.arms[i].end:p.legs[i].end));
  const first=joint.clone().sub(start),second=end.clone().sub(joint),a=first.length(),b=second.length();first.normalize();second.normalize();
  const round=arm?.105:.13,extension=arm?.065:.055,total=a+b+extension;
  const before=joint.clone().addScaledVector(first,-round),after=joint.clone().addScaledVector(second,round);
  const rings=[];
  for(let n=0;n<=40;n++){
   const d=n/40*total-extension;
   let center,axis;
   if(d<a-round){center=start.clone().addScaledVector(first,d);axis=first.clone()}
   else if(d>a+round){center=joint.clone().addScaledVector(second,d-a);axis=second.clone()}
   else {const t=(d-a+round)/(2*round);center=before.clone().multiplyScalar((1-t)**2).addScaledVector(joint,2*t*(1-t)).addScaledVector(after,t*t);axis=first.clone().lerp(second,t).normalize()}
   const u=Math.max(0,Math.min(1,d/a)),v=Math.max(0,Math.min(1,(d-a)/b));
   // Deltoid, biceps, forearm / quadriceps, patella, calf and ankle profiles.
   const upper=arm?.072+.033*Math.exp(-(((u-.22)/.40)**2)):.087+.047*Math.exp(-(((u-.20)/.55)**2));
   const lower=arm?.043+.028*Math.exp(-(((v-.23)/.46)**2)):.051+.047*Math.exp(-(((v-.32)/.38)**2));
   const blend=smooth((d-a+round)/(2*round));
   const radius=upper*(1-blend)+lower*blend;
   const cap=n===40?.001:radius; // socket overlaps torso instead of tapering to a pin
   rings.push({center:center.toArray(),axis:axis.toArray(),width:cap,depth:cap*(arm?.94:1.04),bones:[index((arm?'UpperArm.':'UpperLeg.')+side),index((arm?'LowerArm.':'LowerLeg.')+side)],blend,material:arm?(d<a*.58?0:1):(d<a*.57?2:d>a+.12?3:1)});
  }
  return rings;
 }
 const correction=new THREE.Matrix4(),boneA=new THREE.Matrix4(),boneB=new THREE.Matrix4();
 const center=new THREE.Vector3(),axis=new THREE.Vector3(),across=new THREE.Vector3(),depth=new THREE.Vector3(),corrected=new THREE.Vector3();
 function correctLimbs(p){
  for(const {mesh,arm,i,side} of limbSurfaces){
   const rings=limbRings(p,arm,i,side),position=mesh.geometry.attributes.position,radial=position.count/rings.length;
   rings.forEach((ring,r)=>{
    boneA.fromArray(rig.skeleton.boneMatrices,ring.bones[0]*16);boneB.fromArray(rig.skeleton.boneMatrices,ring.bones[1]*16);
    for(let k=0;k<16;k++)correction.elements[k]=boneA.elements[k]*(1-ring.blend)+boneB.elements[k]*ring.blend;
    // Inverse blended skin transform converts the desired anatomical surface
    // into a corrective bind-space shape. GPU and SVG then share the same skin.
    if(Math.abs(correction.determinant())<1e-8)throw Error('Degenerate corrective skin transform');
    correction.invert();center.fromArray(ring.center);axis.fromArray(ring.axis);
    across.set(0,0,1).addScaledVector(axis,-axis.z);
    if(across.lengthSq()<1e-8)across.set(1,0,0).addScaledVector(axis,-axis.x);
    across.normalize();depth.crossVectors(axis,across).normalize();
    for(let j=0;j<radial;j++){
     const angle=j/radial*Math.PI*2;
     corrected.copy(center).addScaledVector(across,Math.cos(angle)*ring.width).addScaledVector(depth,Math.sin(angle)*ring.depth).applyMatrix4(correction);
     position.setXYZ(r*radial+j,corrected.x,corrected.y,corrected.z);
    }
   });
   position.needsUpdate=true;mesh.geometry.computeVertexNormals();
  }
 }
 function point(mesh,p){mesh.position.set(...p)}
 function align(mesh,up){mesh.quaternion.setFromUnitVectors(yAxis,new THREE.Vector3(...up).normalize())}
 const vertex=new THREE.Vector3();
 function apply(p){
  rig.apply(p);if(!skins.length)build(p);correctLimbs(p);
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
