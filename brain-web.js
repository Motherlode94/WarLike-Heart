/* Explicit Internet research. Never imports unreviewed web text automatically.
 * Searches require signed WarLike account; only sanitized results enter the DOM.
 */
(() => {
"use strict";
const $=id=>document.getElementById(id);
const form=$("brainWebForm"),list=$("brainWebResults"),status=$("brainWebStatus"),search=$("brainWebSearch");
if(!form||!list||!status||!search)return;
const text=value=>{status.textContent=value;};
function prepareSource(item){
 const bridge=window.WarLikeHeartLearningBridge;
 if(!bridge?.enabled())return text("Active d'abord la mémoire locale depuis Mon compte.");
 const subject=$("learningSubject"),content=$("learningContent");
 if(!subject||!content)return;
 const title=String(item.title).trim().slice(0,100);
 const summary=String(item.snippet||"").trim();
 if(!summary||summary.length<3)return text("Cette source n'a pas assez de contenu pour créer une fiche fiable.");
 subject.value=title;
 content.value=(summary+" (Source : "+item.url+")").slice(0,700);
 document.querySelector('[data-view="brain"]')?.scrollIntoView({behavior:"smooth",block:"start"});
 subject.focus();
 text("Brouillon préparé depuis "+item.url+". Vérifie la source et la formulation, puis clique sur « Enregistrer la connaissance ». Rien n'a été mémorisé.");
}
function showResults(data){
 list.replaceChildren();
 for(const entry of data.sources||[]){
  if(!entry?.title||!entry?.url)continue;
  let parsed;
  try{parsed=new URL(entry.url);}catch{continue;}
  if(parsed.protocol!=="https:")continue;
  const item=document.createElement("li"),head=document.createElement("a"),excerpt=document.createElement("p"),button=document.createElement("button");
  head.textContent=entry.title;head.href=parsed.href;head.target="_blank";head.rel="noopener noreferrer";
  excerpt.textContent=entry.snippet||"Extrait indisponible. Ouvre la source pour vérifier les informations.";
  button.type="button";button.textContent="Préparer une fiche";button.addEventListener("click",()=>prepareSource(entry));
  item.append(head,excerpt,button);list.append(item);
 }
 if(!list.children.length)text("Aucun résultat pertinent. Réessaie avec une autre formulation.");
 else text(list.children.length+" source(s) consultable(s). "+data.remaining+" recherche(s) restantes aujourd'hui. Vérifie avant d'enregistrer.");
}
form.addEventListener("submit",async event=>{
 event.preventDefault();
 const query=$("brainWebQuery").value.trim(),provider=$("brainWebProvider").value;
 if(query.length<3||query.length>240)return text("Question invalide (3 à 240 caractères).");
 search.disabled=true;list.replaceChildren();text("Recherche en cours auprès du fournisseur choisi…");
 try{
  const response=await fetch("/api/research",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({query,provider})});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||"Recherche indisponible.");
  showResults(data);
 }catch(error){text(error?.message||"Recherche impossible.");}
 finally{search.disabled=false;}
});
window.WarLikeHeartWebResearch={
  autoEnabled:()=>Boolean($("brainAutoWeb")?.checked),
  lookup:async(query,provider="wikipedia")=>{
    const response=await fetch("/api/research",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({query,provider})});
    const data=await response.json();
    if(!response.ok)throw Error(data.error||"Recherche indisponible.");
    return data;
  },
  research:async(query)=>{
 $("brainWebQuery").value=String(query||"").slice(0,240);
 $("brainWebProvider").value="wikipedia";
 form.requestSubmit();
}};
})();