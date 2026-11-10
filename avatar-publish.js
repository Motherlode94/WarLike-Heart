/* Operator-only publisher. The server enforces owner/referent permissions. */
(() => {
 "use strict";
 const $=id=>document.getElementById(id);
 const input=$("officialGlbFile"),publish=$("officialGlbPublish"),remove=$("officialGlbRemove"),status=$("officialGlbStatus");
 if(!input||!publish||!remove||!status)return;
 const set=text=>{status.textContent=text;};
 const limit=30*1024*1024;
 const check=()=>{
  const file=input.files?.[0];
  return Boolean(file && /\.glb$/i.test(file.name) && file.size>20 && file.size<=limit);
 };
 const humanSize=bytes=>(bytes/1048576).toFixed(1)+" Mo";
 function updateFileStatus(){
  const file=input.files?.[0];
  publish.disabled=!check();
  status.dataset.state=check()?"success":file?"error":"idle";
  if(!file)return set("Choisis un modèle GLB optimisé, de 30 Mo maximum.");
  if(!/\.glb$/i.test(file.name))return set("Format non accepté : sélectionne un fichier .glb.");
  if(file.size>limit)return set(
   "Fichier trop volumineux : "+humanSize(file.size)+" / 30 Mo maximum. "+
   "Tu as probablement sélectionné le modèle Meshy original. "+
   "Télécharge et sélectionne WarLike_Heart_Avatar_Web_Optimized.glb (23,5 Mo)."
  );
  if(file.size<=20)return set("Le fichier est vide ou incomplet : choisis un GLB valide.");
  set("Prêt à publier : "+file.name+" ("+humanSize(file.size)+" / 30 Mo).");
 }
 input.addEventListener("change",updateFileStatus);
 updateFileStatus();
 publish.addEventListener("click",async()=>{
  if(!check())return set("Sélectionne un fichier .glb de moins de 30 Mo.");
  if(!confirm("Publier ce modèle 3D officiellement ? Il sera visible par tous les visiteurs de WarLike Heart."))return;
  publish.disabled=true;
  try{
   set("Publication du GLB dans le stockage WarLike Heart…");
   const response=await fetch("/api/avatar",{method:"PUT",credentials:"same-origin",headers:{"content-type":"model/gltf-binary"},body:input.files[0]});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"Échec de publication.");
   set("Modèle officiel publié ("+(data.size/1048576).toFixed(1)+" Mo). Il apparaîtra dans Espace 3D.");
   document.dispatchEvent(new Event("warlike-heart-avatar-published"));
  }catch(e){set(e?.message||"Publication impossible.");}
  finally{updateFileStatus();}
 });
 remove.addEventListener("click",async()=>{
  if(!confirm("Retirer l'avatar GLB publié pour tous les visiteurs ? Le portrait 2D restera disponible."))return;
  remove.disabled=true;
  try{
   const response=await fetch("/api/avatar",{method:"DELETE",credentials:"same-origin"});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"Suppression refusée.");
   set("Modèle 3D public retiré. Les visiteurs retrouveront le portrait 2D après rechargement.");
  }catch(e){set(e?.message||"Suppression impossible.");}
  finally{remove.disabled=false;}
 });
})();
