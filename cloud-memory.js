/* Manual, account-bound cloud backups. Never sync without the user's click. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const bridge=()=>window.WarLikeHeartCloudBridge;
const status=$("cloudMemoryStatus"),summary=$("cloudMemorySummary");
const upload=$("cloudMemoryUpload"),download=$("cloudMemoryDownload"),remove=$("cloudMemoryDelete"),check=$("cloudMemoryCheck");
if(!status||!upload||!download||!remove||!check)return;
let remote=null;
const message=x=>{status.textContent=x;};
function label(snapshot,revision,updatedAt){
 if(!snapshot)return "Aucune sauvegarde Cloud pour ce compte.";
 const count=(snapshot.learning?.dialogues?.length||0)+" dialogues, "+(snapshot.learning?.knowledge?.length||0)+" fiches, "+(snapshot.memories?.length||0)+" souvenirs et "+(snapshot.history?.length||0)+" messages";
 return "Sauvegarde distante : "+count+" · révision "+revision+(updatedAt?" · "+new Date(updatedAt).toLocaleString("fr-FR"):"");
}
function setBusy(yes){for(const b of [upload,download,remove,check])b.disabled=yes;}
async function fetchRemote(){
 const response=await fetch("/api/memory",{credentials:"same-origin",cache:"no-store"});
 const data=await response.json();
 if(!response.ok)throw Error(data.error||"Lecture Cloud indisponible.");
 remote=data;
 summary.textContent=label(remote.snapshot,remote.revision,remote.updatedAt);
 return data;
}
check.addEventListener("click",async()=>{
 setBusy(true);try{await fetchRemote();message("État de la mémoire Cloud actualisé.");}catch(e){remote=null;message(e.message);}finally{setBusy(false);}
});
upload.addEventListener("click",async()=>{
 if(!bridge()?.enabled())return message("Active d'abord la conservation locale pour autoriser la sauvegarde Cloud.");
 setBusy(true);
 try {
  const current=await fetchRemote();
  const question=current.revision
   ?"Remplacer la sauvegarde Cloud révision "+current.revision+" par les données de cet appareil ? Cela ne fusionne pas les deux versions."
   :"Créer une sauvegarde privée sur Cloudflare D1 ? Le contenu sera lisible par l'application serveur.";
  if(!confirm(question))return message("Sauvegarde annulée.");
  const response=await fetch("/api/memory",{method:"PUT",credentials:"same-origin",headers:{"content-type":"application/json"},
   body:JSON.stringify({expectedRevision:current.revision,snapshot:bridge().snapshot()})});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||"Sauvegarde refusée.");
  await fetchRemote();message("Sauvegarde Cloud enregistrée. Les données locales sont conservées.");
 }catch(e){message(e.message);}finally{setBusy(false);}
});
download.addEventListener("click",async()=>{
 if(!bridge()?.enabled())return message("Active d'abord la conservation locale pour restaurer.");
 setBusy(true);
 try{
  const data=await fetchRemote();
  if(!data.snapshot)return message("Aucune sauvegarde Cloud à restaurer.");
  if(!confirm("Remplacer les conversations, souvenirs et connaissances de CE navigateur par la sauvegarde Cloud ? Exporte d'abord ton JSON si tu veux conserver l'ancienne version."))return message("Restauration annulée.");
  if(!bridge().restore(data.snapshot))throw Error("Impossible de restaurer les données locales.");
  message("Restauration effectuée depuis la révision "+data.revision+". Les données Cloud restent inchangées.");
 }catch(e){message(e.message);}finally{setBusy(false);}
});
remove.addEventListener("click",async()=>{
 setBusy(true);
 try{
  const data=await fetchRemote();
  if(!data.revision)return message("Aucune mémoire Cloud à supprimer.");
  if(!confirm("Supprimer définitivement la sauvegarde Cloud de CE compte ? Les données locales restent disponibles."))return message("Suppression annulée.");
  const response=await fetch("/api/memory",{method:"DELETE",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({expectedRevision:data.revision})});
  const result=await response.json();
  if(!response.ok)throw Error(result.error||"Suppression refusée.");
  await fetchRemote();message("Sauvegarde Cloud supprimée. Mémoire locale inchangée.");
 }catch(e){message(e.message);}finally{setBusy(false);}
});
document.addEventListener("warlike-heart-learning-restored",()=>{if($("learningStats"))$("learningStats").textContent+=" · restauré depuis Cloud";});
})();
