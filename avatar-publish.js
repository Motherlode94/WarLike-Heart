/* Operator-only publisher. The server enforces owner/referent permissions. */
(() => {
 "use strict";
 const $=id=>document.getElementById(id);
 const input=$("officialGlbFile"),publish=$("officialGlbPublish"),remove=$("officialGlbRemove"),status=$("officialGlbStatus");
 if(!input||!publish||!remove||!status)return;
 const set=text=>{status.textContent=text;};
 const check=()=>{
  const file=input.files?.[0];
  return file&&/\.glb$/i.test(file.name)&&file.size>20&&file.size<=30*1024*1024;
 };
 input.addEventListener("change",()=>{
  const file=input.files?.[0];set(!file?"Choisis le GLB Web optimisé.":check()
    ?"Prêt à publier : "+file.name+" ("+(file.size/1048576).toFixed(1)+" Mo)."
    :"Fichier invalide ou supérieur à 30 Mo. Utilise le GLB optimisé.");
 });
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
  finally{publish.disabled=false;}
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
