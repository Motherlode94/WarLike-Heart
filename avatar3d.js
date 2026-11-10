/* WarLike Heart — viewer for a real user-supplied GLB.
   No placeholder cartoon is presented as the canonical 3D avatar. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { inspectAvatar, VISEME_PATTERNS, visemeForText } from "./avatar-rig.mjs";

const holder=document.getElementById("heart3d");
const originalParent=holder.parentElement;
const canvas=document.getElementById("heartCanvas");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"low-power"});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.01,200);
camera.position.set(0,1.1,4.8);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.075;
controls.minDistance=1.4;controls.maxDistance=9;
controls.minPolarAngle=.18;controls.maxPolarAngle=Math.PI-.18;
controls.enablePan=false;controls.target.set(0,.15,0);
controls.update();
const initialCamera=camera.position.clone();
let autoRotate=false,animationsEnabled=true;
function framePose(mode="full"){
 if(!current)return false;
 const distance=mode==="face"?2.05:4.2;
 controls.target.set(0,mode==="face"?.62:.08,0);
 camera.position.set(0,mode==="face"?.65:.38,distance);
 controls.update();return true;
}
function resetView(){camera.position.copy(initialCamera);controls.target.set(0,.15,0);controls.update();}
function addStage(){
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.45,.14,80),new THREE.MeshStandardMaterial({color:0x3d263e,metalness:.62,roughness:.27}));
 base.position.y=-1.78;scene.add(base);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.24,.018,12,90),new THREE.MeshStandardMaterial({color:0xeebda4,emissive:0xa34e7b,emissiveIntensity:.55,metalness:.8,roughness:.18}));
 ring.rotation.x=Math.PI/2;ring.position.y=-1.69;scene.add(ring);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(18,90),new THREE.MeshStandardMaterial({color:0x17111e,metalness:.25,roughness:.6}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-1.86;scene.add(floor);
}
addStage();
scene.add(new THREE.HemisphereLight(0xffffff,0x4b3144,2.1));
const key=new THREE.DirectionalLight(0xffeadb,2.0);key.position.set(-3,5,7);scene.add(key);
const rim=new THREE.DirectionalLight(0xb88ccf,1.4);rim.position.set(4,3,-2);scene.add(rim);
const clock=new THREE.Clock();
let current=null,mixer=null,speaking=false, mood="neutral", glbUrl=null;
let speechPose="neutral", speechBoundaryAt=0;
let readyReport=null;
const morphs=[];
function resize(){
 const {width,height}=holder.getBoundingClientRect();
 if(!width||!height)return;
 renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(holder);
function setMorph(pattern,value){
 for(const {mesh,index,name} of morphs){
  if(pattern.test(name)) mesh.morphTargetInfluences[index]=Math.max(0,Math.min(1,value));
 }
}
function resetExpressions(){
 for(const {mesh,index,name} of morphs)
  if(Object.values(VISEME_PATTERNS).some(pattern=>pattern.test(name)))
   mesh.morphTargetInfluences[index]=0;
}
function applyViseme(pose,value){
 const pattern=VISEME_PATTERNS[pose];
 if(pattern)setMorph(pattern,value);
}
const api={
 mountInto(target){if(target&&holder.parentElement!==target)target.append(holder);resize();},
 restoreMount(){if(originalParent&&holder.parentElement!==originalParent)originalParent.append(holder);resize();},
 isModelLoaded(){return Boolean(current);},
 setAutoRotate(value){autoRotate=Boolean(value);return autoRotate;},
 setAnimationEnabled(value){animationsEnabled=Boolean(value);return animationsEnabled;},
 frame(mode){return framePose(mode);},
 resetView,
 zoom(direction){const factor=direction>0?.8:1.25;camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();},
 async loadPublishedGLB(){
  const response=await fetch("/api/avatar",{cache:"no-store"});
  if(response.status===404)return false;
  if(!response.ok)throw Error("Impossible de récupérer l'avatar GLB publié.");
  const size=Number(response.headers.get("content-length")||0);
  if(size>30*1024*1024)throw Error("Avatar publié trop volumineux.");
  const buffer=await response.arrayBuffer();
  if(buffer.byteLength>30*1024*1024)throw Error("Avatar publié trop volumineux.");
  await api.loadGLB(new File([buffer],"official-avatar.glb",{type:"model/gltf-binary"}));
  return true;
 },
 setMood(value){mood=value;},
 setSpeaking(value){speaking=!!value;if(!speaking)speechPose="neutral";},
 setSpeechPosition(text,charIndex){speechPose=visemeForText(text,charIndex);speechBoundaryAt=performance.now();},
 inspect(){return readyReport;},
 setListening(){},
 async loadGLB(file){
  if(!file || !/\.glb$/i.test(file.name) || file.size>30*1024*1024)throw Error("Un fichier .glb de 30 Mo maximum est requis.");
  if(glbUrl)URL.revokeObjectURL(glbUrl);
  glbUrl=URL.createObjectURL(file);
  try{
   const gltf=await new GLTFLoader().loadAsync(glbUrl);
   const box=new THREE.Box3().setFromObject(gltf.scene);
   if(box.isEmpty())throw Error("Le GLB ne contient aucune géométrie visible.");
   // Validate the incoming model before removing the previously displayed avatar.
   if(current){scene.remove(current);current.traverse(o=>{if(o.isMesh){o.geometry?.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m?.dispose());}});}
   mixer=null;morphs.length=0;current=gltf.scene;scene.add(current);
   const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
   const max=Math.max(size.x,size.y,size.z,0.01);
   current.position.sub(center);
   current.position.y+=size.y*.12;
   const scale=2.9/max;current.scale.setScalar(scale);
   camera.position.set(0,size.y*scale*.18,Math.max(2.5,max*scale*1.25));
   controls.target.set(0,0,0);
   controls.update();
   const bones=[],shapes=[];let skinnedMeshes=0,meshes=0;
   current.traverse(object=>{
    if(object.isBone)bones.push(object.name);
    if(object.isMesh)meshes++;
    if(object.isSkinnedMesh)skinnedMeshes++;
    if(object.isMesh && object.morphTargetDictionary && object.morphTargetInfluences){
      for(const [name,index] of Object.entries(object.morphTargetDictionary)){
       morphs.push({mesh:object,index,name:name.toLowerCase()});shapes.push(name);
      }
    }
   });
   if(gltf.animations.length){mixer=new THREE.AnimationMixer(current);const idle=gltf.animations.find(a=>/idle|breath/i.test(a.name))||gltf.animations[0];mixer.clipAction(idle).play();}
   readyReport=inspectAvatar({bones,shapes,animations:gltf.animations.length,skinnedMeshes,meshes});
   document.dispatchEvent(new CustomEvent("warlike-heart-avatar-loaded",{detail:readyReport}));
   resize();
   return readyReport;
  }finally{if(glbUrl){URL.revokeObjectURL(glbUrl);glbUrl=null;}}
 }
};
window.WarLikeHeart3D=api;
document.dispatchEvent(new Event("warlike-heart-3d-ready"));
let lastBlink=0;
function animate(t){
 requestAnimationFrame(animate);
 const delta=Math.min(clock.getDelta(),.1);
 if(animationsEnabled)mixer?.update(delta);
 controls.autoRotate=autoRotate&&Boolean(current);
 controls.autoRotateSpeed=.55;
 controls.update();
 if(current){
  if(morphs.length){
   resetExpressions();
   if(mood==="happy")setMorph(/smile|happy/,0.65);
   if(mood==="sad")setMorph(/sad/,0.4);
   // Boundary events give word/character alignment, not true audio phoneme timings.
   // Hold a pose briefly after each boundary; if no events arrive, keep mouth neutral.
   if(speaking && performance.now()-speechBoundaryAt<360)applyViseme(speechPose,0.72);
   const blink=(t-lastBlink<160)?1:0;
   setMorph(/blink/,blink);
   if(t-lastBlink>3700)lastBlink=t;
  }
 }
 renderer.render(scene,camera);
}
resize();requestAnimationFrame(animate);
