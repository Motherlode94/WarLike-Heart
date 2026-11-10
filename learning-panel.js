/* WarLike Heart Learning Brain v2: explicit local edit, search and test.
 * No training or remote calls in this file. */
(() => {
"use strict";
const $=id=>document.getElementById(id),bridge=window.WarLikeHeartLearningBridge,brain=window.WarLikeLearningBrain;
if(!bridge||!brain)return;
const message=$("learningFeedback"),dialogues=$("learnedDialogues"),knowledge=$("learnedKnowledge");
let editing=null,filter="";
const show=value=>{message.textContent=value;};
const fieldMap={dialogues:["learningQuestion","learningAnswer"],knowledge:["learningSubject","learningContent"]};
const attributes={dialogues:["question","answer"],knowledge:["subject","content"]};
function clearEdit(){
 editing=null;
 $("learningDialogueForm").reset();$("learningKnowledgeForm").reset();
 $("learningDialogueSubmit").textContent="Enregistrer le dialogue";
 $("learningKnowledgeSubmit").textContent="Enregistrer la connaissance";
 $("learningCancelEdit").hidden=true;
}
function render(){
 const data=bridge.read();
 $("learningStats").textContent=data.dialogues.length+" dialogues · "+data.knowledge.length+" connaissances approuvées";
 $("learningControls").disabled=!bridge.enabled();
 dialogues.replaceChildren();knowledge.replaceChildren();
 let visible=0;
 for(const category of ["dialogues","knowledge"]){
  const list=category==="dialogues"?dialogues:knowledge;
  data[category].forEach((item,index)=>{
   const [a,b]=attributes[category];
   if(filter&&!brain.clean(item[a]+" "+item[b]).includes(brain.clean(filter)))return;
   visible++;
   const li=document.createElement("li"),body=document.createElement("span"),actions=document.createElement("div");
   const edit=document.createElement("button"),remove=document.createElement("button");
   body.textContent=item[a]+(category==="dialogues"?" → ":" : ")+item[b];body.style.overflowWrap="anywhere";
   actions.className="learning-item-actions";
   edit.type="button";edit.textContent="Modifier";edit.setAttribute("aria-label","Modifier cette entrée");
   edit.addEventListener("click",()=>{
    if(!bridge.enabled())return show("Active la mémoire locale pour modifier.");
    editing={category,index,old:brain.clean(item[a])};
    const [first,second]=fieldMap[category].map($);
    first.value=item[a];second.value=item[b];first.focus();
    $("learningDialogueSubmit").textContent=category==="dialogues"?"Enregistrer les modifications":"Enregistrer le dialogue";
    $("learningKnowledgeSubmit").textContent=category==="knowledge"?"Enregistrer les modifications":"Enregistrer la connaissance";
    $("learningCancelEdit").hidden=false;show("Modifie puis enregistre cette entrée, ou annule.");
   });
   remove.type="button";remove.textContent="Supprimer";remove.setAttribute("aria-label","Supprimer cette entrée");
   remove.addEventListener("click",()=>{
    if(!bridge.enabled())return show("Active la mémoire locale pour supprimer.");
    if(!confirm("Supprimer cette entrée enregistrée localement ?"))return;
    const data=bridge.read();
    if(brain.clean(data[category]?.[index]?.[a])!==brain.clean(item[a]))return show("La bibliothèque a changé : actualise-la.");
    data[category].splice(index,1);
    if(bridge.write(data)){clearEdit();render();show("Entrée supprimée localement.");}
    else show("Écriture locale refusée.");
   });
   actions.append(edit,remove);li.append(body,actions);list.append(li);
  });
 }
 $("learningSearchStats").textContent=filter?visible+" résultat(s) pour « "+filter+" »":"Toutes les entrées sont visibles.";
}
function submit(category,event){
 event.preventDefault();
 if(!bridge.enabled())return show("Active d'abord la mémoire locale depuis Mon compte.");
 const [first,second]=fieldMap[category].map($);
 const [a,b]=attributes[category];
 const valueA=first.value.trim(),valueB=second.value.trim(),data=bridge.read();
 const found=data[category].findIndex((item,index)=>brain.clean(item[a])===brain.clean(valueA) && (!editing||editing.category!==category||editing.index!==index));
 if(found!==-1)return show("Cette entrée existe déjà. Utilise Modifier pour la mettre à jour.");
 if(editing?.category===category){
  const item=data[category][editing.index];
  if(!item||brain.clean(item[a])!==editing.old)return show("L'entrée a changé : relance la modification.");
  data[category][editing.index]={[a]:valueA,[b]:valueB};
 }else{
  if(data[category].length>=500)return show("Limite de 500 entrées atteinte.");
  data[category].push({[a]:valueA,[b]:valueB});
 }
 if(!bridge.write(data))return show("Impossible d'enregistrer dans ce navigateur.");
 const action=editing?"Entrée modifiée.":"Nouvelle entrée enregistrée.";
 clearEdit();render();show(action+" Tu peux la tester sans envoyer de message.");
}
$("learningDialogueForm").addEventListener("submit",e=>submit("dialogues",e));
$("learningKnowledgeForm").addEventListener("submit",e=>submit("knowledge",e));
$("learningCancelEdit").addEventListener("click",()=>{clearEdit();show("Modification annulée.");});
$("learningSearch").addEventListener("input",e=>{filter=e.target.value.trim().slice(0,100);render();});
$("learningTest").addEventListener("click",()=>{
 const input=$("learningTestInput").value.trim();
 if(!input)return show("Saisis une question à tester.");
 if(!bridge.enabled())return show("Active la mémoire locale pour tester les connaissances.");
 const result=brain.retrieval(input,bridge.read());
 $("learningTestResult").textContent=result
  ?("Source : "+(result.source==="dialogue"?"dialogue":"connaissance")+
    " · correspondance "+Math.round(result.confidence*100)+" %\n"+result.text)
  :"Aucune réponse fiable dans la bibliothèque. Tu peux rechercher sur Internet ou enseigner une réponse.";
});
$("learningExport").addEventListener("click",()=>{
 const blob=new Blob([JSON.stringify({format:"warlike-heart-learning",...bridge.read()},null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="warlike-heart-learning.json";a.click();
 setTimeout(()=>URL.revokeObjectURL(url),2000);show("Bibliothèque exportée : conserve ce JSON en lieu sûr.");
});
$("learningImport").addEventListener("change",async e=>{
 const file=e.target.files?.[0];e.target.value="";if(!file)return;
 if(!bridge.enabled())return show("Active d'abord la mémoire locale.");
 if(file.size>1024*1024)return show("Import refusé : maximum 1 Mo.");
 try{
  const raw=JSON.parse(await file.text());
  if(raw.format!=="warlike-heart-learning"||raw.version!==1)throw Error("format");
  const data=brain.validated(raw);
  if(!confirm("Remplacer la bibliothèque locale actuelle par ce fichier JSON ?"))return;
  if(!bridge.write(data))throw Error("storage");
  clearEdit();render();show("Bibliothèque importée localement.");
 }catch{show("Fichier incompatible ou stockage indisponible.");}
});
$("learningClear").addEventListener("click",()=>{
 if(!bridge.enabled())return show("Mémoire désactivée.");
 if(!confirm("Effacer tous les dialogues et connaissances de cet appareil ?"))return;
 if(bridge.write({version:1,dialogues:[],knowledge:[]})){clearEdit();render();show("Bibliothèque locale effacée.");}
});
$("remember").addEventListener("change",()=>{
 clearEdit();render();
 show(bridge.enabled()?"Apprentissage local activé.":"Apprentissage local désactivé. Vérifie tes sauvegardes.");
});
$("clear").addEventListener("click",()=>{clearEdit();render();});
document.addEventListener("warlike-heart-learning-restored",()=>{clearEdit();render();});
document.addEventListener("warlike-heart-learning-external-update",render);
window.WarLikeHeartLearningPanel={refresh:render};
render();
})();