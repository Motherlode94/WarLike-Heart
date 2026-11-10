/* UI for explicitly taught local-only responses; no network calls. */
(() => {
"use strict";
const $=id=>document.getElementById(id), bridge=window.WarLikeHeartLearningBridge;
if(!bridge)return;
const panel=$("learningPanel"), msg=$("learningFeedback"), dialogueList=$("learnedDialogues"), knowledgeList=$("learnedKnowledge");
const show=text=>{msg.textContent=text;};
function render(){
  const data=bridge.read();
  $("learningStats").textContent=data.dialogues.length+" dialogues enseignés · "+data.knowledge.length+" connaissances";
  $("learningControls").disabled=!bridge.enabled();
  dialogueList.replaceChildren();knowledgeList.replaceChildren();
  function add(list,item,category,index){
    const li=document.createElement("li"),text=document.createElement("span"),remove=document.createElement("button");
    text.textContent=category==="dialogues"?item.question+" → "+item.answer:item.subject+" : "+item.content;
    text.style.overflowWrap="anywhere";
    remove.textContent="Supprimer";remove.type="button";remove.setAttribute("aria-label","Supprimer cette entrée");
    remove.addEventListener("click",()=>{const updated=bridge.read();updated[category].splice(index,1);if(bridge.write(updated)){render();show("Entrée supprimée de cet appareil.");}else show("Écriture refusée.");});
    li.append(text,remove);list.append(li);
  }
  data.dialogues.forEach((x,i)=>add(dialogueList,x,"dialogues",i));
  data.knowledge.forEach((x,i)=>add(knowledgeList,x,"knowledge",i));
}
$("learningDialogueForm").addEventListener("submit",e=>{
  e.preventDefault();
  if(!bridge.enabled())return show("Active d'abord la mémoire locale.");
  const question=$("learningQuestion").value.trim(),answer=$("learningAnswer").value.trim();
  const data=bridge.read();
  if(data.dialogues.length>=500)return show("Limite de 500 dialogues atteinte.");
  if(data.dialogues.some(x=>window.WarLikeLearningBrain.clean(x.question)===window.WarLikeLearningBrain.clean(question)))return show("Cette question existe déjà : supprime l'ancienne entrée pour la remplacer.");
  data.dialogues.push({question,answer});
  if(!bridge.write(data))return show("Impossible de sauvegarder sur cet appareil.");
  e.target.reset();render();show("Dialogue ajouté. Tu peux le tester dans le chat.");
});
$("learningKnowledgeForm").addEventListener("submit",e=>{
  e.preventDefault();
  if(!bridge.enabled())return show("Active d'abord la mémoire locale.");
  const subject=$("learningSubject").value.trim(),content=$("learningContent").value.trim(),data=bridge.read();
  if(data.knowledge.length>=500)return show("Limite de 500 connaissances atteinte.");
  data.knowledge.push({subject,content});
  if(!bridge.write(data))return show("Impossible de sauvegarder sur cet appareil.");
  e.target.reset();render();show("Connaissance ajoutée localement.");
});
$("learningExport").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify({format:"warlike-heart-learning",...bridge.read()},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="warlike-heart-learning.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);show("Export JSON créé : conserve-le en lieu sûr, il n'est pas chiffré.");
});
$("learningImport").addEventListener("change",async e=>{
  const file=e.target.files?.[0];e.target.value="";if(!file)return;
  if(!bridge.enabled())return show("Active d'abord la mémoire locale.");
  if(file.size>1024*1024)return show("Import refusé : taille supérieure à 1 Mo.");
  try{
    const raw=JSON.parse(await file.text());if(raw.format!=="warlike-heart-learning"||raw.version!==1)throw Error("format");
    const data=window.WarLikeLearningBrain.validated(raw);
    if(!bridge.write(data))throw Error("storage");
    render();show("Bibliothèque locale restaurée.");
  }catch{show("Fichier incompatible ou stockage indisponible.");}
});
$("learningClear").addEventListener("click",()=>{
  if(!bridge.enabled())return show("Mémoire désactivée.");
  if(!confirm("Supprimer tous les dialogues et connaissances appris sur cet appareil ?"))return;
  if(bridge.write({version:1,dialogues:[],knowledge:[]})){render();show("Bibliothèque effacée.");}
});
$("remember").addEventListener("change",()=>{render();show(bridge.enabled()?"Apprentissage local activé.":"Apprentissage local désactivé et bibliothèque supprimée.");});
$("clear").addEventListener("click",()=>{render();show("Bibliothèque locale effacée avec les données du chat.");});
render();
})();
