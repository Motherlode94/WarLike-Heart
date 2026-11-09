/* Procedural WebGL avatar, independently animated expressions.
   This is an original stylized 3D prototype, NOT the approved realistic likeness. */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

const holder = document.getElementById("heart3d");
const canvas = document.getElementById("heartCanvas");
if (!holder || !canvas) throw new Error("Missing avatar mount");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
camera.position.set(0, .0, 5.8);
const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
const light = new THREE.HemisphereLight(0xffddeb,0x382232,2.3);scene.add(light);
const key=new THREE.DirectionalLight(0xfff3e8,2.8);key.position.set(-3,4,5);scene.add(key);
const fill=new THREE.DirectionalLight(0xbd8bdf,1.7);fill.position.set(3,1,3);scene.add(fill);
const root=new THREE.Group();scene.add(root);
const mat=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0});
const skin=mat(0x663b2b), skinLight=mat(0x84513a), hair=mat(0x151016), white=mat(0xf4e5d9), iris=mat(0x42251a), black=mat(0x100b10), lip=mat(0x8b4250), gold=new THREE.MeshStandardMaterial({color:0xc89d58,metalness:.75,roughness:.22}),cloth=mat(0x17141d);
function sphere(r,x,y,z,material,sx=1,sy=1,sz=1,segments=24){
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,segments,16),material);
 mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);root.add(mesh);return mesh;
}
sphere(1.0,0,-1.6,-.12,cloth,1.3,.65,.52);
sphere(.32,0,-.97,.08,skin, .95,1.2,.92);
sphere(.86,0,.09,0,skin, .76,1.10,.68,40);
sphere(.80,0,.14,-.28,hair,.94,1.17,.92,36);
// Voluminous dark curls
for(let row=0;row<5;row++)for(let i=0;i<12;i++){
 const a=(i/12)*Math.PI*2+row*.3;
 const radius=.60+row*.035;
 const x=Math.cos(a)*radius, z=Math.sin(a)*.48-.10;
 const y=1.08-row*.15+(Math.sin(i*3+row)*.04);
 if(z>.2 && row>1 && Math.abs(x)<.39)continue;
 sphere(.19,x,y,z,hair,1,1,1,12);
}
for(const side of [-1,1]){
 for(let i=0;i<5;i++)sphere(.22,side*(.66+Math.sin(i)*.05),.42-i*.31,-.05,hair,.9,1.2,1,12);
 sphere(.12,side*.78,-.07,.02,skin);
 const hoop=new THREE.Mesh(new THREE.TorusGeometry(.13,.018,9,24),gold);hoop.position.set(side*.80,-.31,.1);root.add(hoop);
}
const leftEye=sphere(.118,-.285,.23,.637,white,1.5,.72,.35);
const rightEye=sphere(.118,.285,.23,.637,white,1.5,.72,.35);
const eyelids=[leftEye,rightEye];
for(const side of [-1,1]){
 sphere(.075,side*.285,.23,.737,iris,.85,1,.32);
 sphere(.041,side*.285,.23,.766,black,.85,1,.3);
 sphere(.025,side*.265,.26,.786,white,.6,.6,.3);
}
const browL=sphere(.065,-.285,.43,.665,hair,1.7,.40,.30);
const browR=sphere(.065,.285,.43,.665,hair,1.7,.40,.30);
sphere(.16,0,-.06,.67,skinLight,.57,1.0,.65);
sphere(.10,0,-.24,.72,skinLight,1.4,.54,.65);
const mouth=sphere(.11,0,-.43,.679,lip,1.6,.28,.29);
sphere(.07,0,-.69,.56,skinLight,1.9,.34,.75);
// Heart pendant
const pendant=new THREE.Mesh(new THREE.SphereGeometry(.056,16,12),gold);pendant.position.set(0,-1.03,.48);pendant.scale.set(1.2,1,.42);root.add(pendant);
const collar=new THREE.Mesh(new THREE.TorusGeometry(.40,.012,8,48,Math.PI),gold);collar.rotation.z=Math.PI;collar.position.set(0,-.78,.34);root.add(collar);
let mood="neutral",speaking=false,listening=false,blink=0;
const moods={neutral:[.28,0],happy:[.12,-.05],curious:[.24,.1],sad:[.1,-.15],thinking:[.2,.06]};
function setMood(next){mood=moods[next]?next:"neutral";}
const api={setMood,setSpeaking(v){speaking=!!v;},setListening(v){listening=!!v;}};
window.WarLikeHeart3D=api;
document.dispatchEvent(new CustomEvent("warlike-heart-3d-ready"));
let start=performance.now(),last=0;
function tick(now){
 requestAnimationFrame(tick);
 const t=(now-start)/1000;
 if(now-last>2400+Math.random()*50){blink=1;last=now;}
 blink=Math.max(0,blink-.09);
 const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
 root.rotation.y=reduced?0:Math.sin(t*.5)*.09+(listening?.075:0);
 root.rotation.x=reduced?0:Math.sin(t*.7)*.025;
 root.position.y=reduced?0:Math.sin(t*1.2)*.025;
 const [smile,brow]=moods[mood];
 mouth.scale.y=speaking&&!reduced?.3+Math.abs(Math.sin(t*16))*.95:smile;
 mouth.scale.x=speaking?1.1:1.6;
 mouth.position.y=-.43+(mood==="happy"?.025:0);
 browL.position.y=.43+brow; browR.position.y=.43+brow;
 eyelids.forEach(e=>e.scale.y=Math.max(.06,(mood==="happy"?.54:.72)*(1-blink)));
 renderer.render(scene,camera);
}
function resize(){
 const {width,height}=holder.getBoundingClientRect();
 if(!width||!height)return;
 renderer.setSize(width,height,false);
 camera.aspect=width/height;
 camera.updateProjectionMatrix();
}
const observer=new ResizeObserver(resize);observer.observe(holder);resize();
requestAnimationFrame(tick);
