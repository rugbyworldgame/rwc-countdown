// Отделяем отказ WebGL 2 от ошибок импорта и ошибок самой сцены.
export function startWebGL(THREE,makeCanvas){
 const attempts=[];
 for(const antialias of [true,false]){
  const canvas=makeCanvas();let status='';
  canvas.addEventListener('webglcontextcreationerror',e=>{status=e.statusMessage||'Причина не сообщена браузером'});
  let context;
  try{context=canvas.getContext('webgl2',{alpha:false,antialias,powerPreference:'default'})}
  catch(error){attempts.push({antialias,error:status||String(error.message||error)});continue}
  if(!context){attempts.push({antialias,error:status||'Браузер вернул null для WebGL 2'});continue}
  // Ошибка Three.js при живом контексте должна быть видна, а не скрыта SVG.
  const renderer=new THREE.WebGLRenderer({canvas,context,antialias,alpha:false});
  return {renderer,attempts,antialias};
 }
 return {renderer:null,attempts};
}
export function rendererReport(revision,result){
 return 'Three.js r'+revision+' загружена. Требуется WebGL 2.\n'+
 (result.renderer?'WebGL 2 создан'+(result.antialias?' со сглаживанием.':' без сглаживания.'):'WebGL 2 не создан; используется резервный SVG.')+'\n'+
 result.attempts.map(a=>(a.antialias?'Со сглаживанием':'Без сглаживания')+': '+a.error).join('\n');
}
