// LoveLand extensions: import rigged GLB and optional authenticated AI chat.
import {GLTFLoader} from "https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/GLTFLoader.js";
const {THREE,companion,openDialog,closeDialog,toast}=window.LoveLandBridge;
const fileInput=document.getElementById('modelFile');
let activeModel=null,mixer=null;
document.getElementById('modelButton').addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',async()=>{
 const file=fileInput.files?.[0];if(!file)return;
 if(!/\.glb$/i.test(file.name)||file.size>30*1024*1024){toast('GLB de 30 Mo maximum requis.');return}
 const url=URL.createObjectURL(file);
 try{
  const gltf=await new GLTFLoader().loadAsync(url);const model=gltf.scene;
  const bounds=new THREE.Box3().setFromObject(model);
  if(bounds.isEmpty())throw Error('Le GLB est vide.');
  let bones=0,skinned=0,shapes=0;
  model.traverse(o=>{if(o.isBone)bones++;if(o.isSkinnedMesh)skinned++;if(o.morphTargetDictionary)shapes+=Object.keys(o.morphTargetDictionary).length});
  if(!bones||!skinned)throw Error('Un vrai rig avec SkinnedMesh et os est requis.');
  const size=bounds.getSize(new THREE.Vector3()), center=bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);model.position.y+=size.y/2;
  model.scale.setScalar(3.3/Math.max(size.y,.001));
  if(activeModel)companion.remove(activeModel);
  activeModel=model;companion.add(model);
  // Only hide the procedural placeholder after the import is validated.
  companion.children.forEach(child=>{if(child!==model)child.visible=false});
  if(mixer){mixer.stopAllAction();mixer=null}
  if(gltf.animations.length){mixer=new THREE.AnimationMixer(model);const idle=gltf.animations.find(c=>/idle|breath/i.test(c.name))||gltf.animations[0];mixer.clipAction(idle).play()}
  toast('GLB chargé : '+bones+' os, '+gltf.animations.length+' clips, '+shapes+' morph targets. Ressemblance non validée.');
 }catch(e){toast('Import refusé : '+e.message)}
 finally{URL.revokeObjectURL(url);fileInput.value=''}
});
const clock=new THREE.Clock();function tick(){requestAnimationFrame(tick);mixer?.update(Math.min(clock.getDelta(),.05))}tick();
let accessToken='';const history=[];
document.getElementById('aiButton').addEventListener('click',()=>{
 openDialog('WarLike Heart · IA','Ce dialogue utilise /api/chat de WarLike Heart. Aucun jeton n’est enregistré dans le navigateur.',[
 ['Définir le jeton',()=>{const value=prompt('HEART_ACCESS_TOKEN (jeton privé, jamais la clé API OpenAI)');if(value!==null)accessToken=value;toast(accessToken?'Jeton défini en mémoire':'Aucun jeton');closeDialog()}],
 ['Discuter',()=>showComposer()],['Fermer',closeDialog]
 ]);
});
function showComposer(){
 openDialog('Conversation IA','Parle à ton personnage virtuel. Le service nécessite des secrets Cloudflare configurés.',[['Fermer',closeDialog]]);
 const dialog=document.getElementById('dialog');dialog.querySelector('#lovelandComposer')?.remove();
 const form=document.createElement('form');form.id='lovelandComposer';form.style.cssText='display:flex;gap:6px;margin:10px 0';
 const input=document.createElement('input');input.required=true;input.maxLength=1500;input.placeholder='Ton message';input.style.cssText='min-width:0;flex:1;background:#130f24;color:white;padding:10px;border:1px solid #b88eb9;border-radius:8px';
 const button=document.createElement('button');button.type='submit';button.textContent='Envoyer';form.append(input,button);
 dialog.querySelector('#dialogButtons').before(form);
 form.addEventListener('submit',async e=>{
  e.preventDefault();const message=input.value.trim();if(!message)return;
  if(!accessToken){document.getElementById('dialogText').textContent='Définis d’abord ton jeton via « Parler avec Heart (IA) ». ';return}
  button.disabled=true;document.getElementById('dialogText').textContent='Connexion IA en cours…';
  try{
   const messages=[...history.slice(-18),{role:'user',text:message}];
   const response=await fetch('../api/chat',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+accessToken},body:JSON.stringify({messages}),cache:'no-store'});
   const data=await response.json();
   if(!response.ok||typeof data.reply!=='string')throw Error(data.error||'Réponse IA absente');
   history.push({role:'user',text:message},{role:'assistant',text:data.reply});while(history.length>18)history.shift();
   document.getElementById('dialogText').textContent='Heart : '+data.reply;input.value='';
  }catch(error){document.getElementById('dialogText').textContent='Service IA indisponible : '+error.message}
  finally{button.disabled=false}
 });
}
