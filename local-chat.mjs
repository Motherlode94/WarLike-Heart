import {answerWithReview} from './lib/conversation-review.mjs';
import {runConversationCertification} from './lib/conversation-certification.mjs';
import {createSemanticSearch} from './lib/semantic-search.mjs';
import {semanticCorpus} from './lib/semantic-index.mjs';
import {journalEvidence} from './lib/conversation-journal.mjs';
import {mountModelComparison} from './model-comparison-panel.mjs';
import {fetchCognitiveContext} from './lib/context-selection.mjs';
import {contextQuery} from './lib/conversation-signals.mjs';
import {createLocalModel,LOCAL_MODELS} from './lib/local-model.mjs';
import {buildLocalContext} from './lib/local-context.mjs';
import {retrieveLocalEvidence} from './lib/local-evidence.mjs';
import {approveTeaching} from './lib/local-teaching.mjs';
export function createLocalChat({readLearning,readMemories,readArchive=()=>[],writeLearning,canRemember,document:doc=globalThis.document,modelFactory=createLocalModel,semanticFactory=createSemanticSearch}){
 const $=id=>doc.getElementById(id),feedback=$('localTeachingStatus');
 const semantic=semanticFactory({onState:value=>{if($('semanticStatus'))$('semanticStatus').textContent={idle:'Recherche par mots. Modèle sémantique non chargé.',loading:'Chargement du modèle sémantique…',ready:'Recherche sémantique locale prête.',searching:'Recherche sémantique locale…',error:'Modèle sémantique indisponible ; recherche par mots.'}[value];if($('semanticLoad'))$('semanticLoad').disabled=['loading','searching'].includes(value);},onProgress:detail=>{if($('semanticStatus'))$('semanticStatus').textContent=detail;}});
 $('semanticLoad')?.addEventListener('click',async()=>{try{await semantic.load();}catch(error){$('semanticStatus').textContent=error.message+' Recherche par mots conservée.';}});
 $('semanticStop')?.addEventListener('click',()=>{epoch++;cloudRequest?.abort();semantic.stop();});
 const corpus=(history=[])=>semanticCorpus({learning:readLearning(),memories:readMemories(),archive:readArchive(),history});
 const modelSelect=$('localModelSelect'),load=$('localModelLoad'),stop=$('localModelStop');
 for(const model of LOCAL_MODELS){const option=doc.createElement('option');option.value=model.id;option.textContent=model.label+' — '+model.memory;modelSelect.append(option);}
 let comparing=false,comparison=null,replying=false,certificationReport=null,lastVerification=null;
 $('certificationRun')?.addEventListener('click',async()=>{if(replying||comparing||['loading','searching'].includes(semantic.status()))return;$('certificationRun').disabled=true;try{certificationReport=await runConversationCertification({semanticSearch:semantic.status()==='ready'?(q,r)=>semantic.search(q,r):null});$('certificationStatus').textContent=certificationReport.results.map(x=>x.id+' : '+x.status).join(' · ')+'. Cas fixes uniquement ; modèle conversationnel non certifié.';$('certificationExport').disabled=false;}catch(error){$('certificationStatus').textContent=error.message;}finally{$('certificationRun').disabled=false;}});
 $('certificationExport')?.addEventListener('click',()=>{if(!certificationReport)return;const url=URL.createObjectURL(new Blob([JSON.stringify(certificationReport,null,2)],{type:'application/json'})),a=doc.createElement('a');a.href=url;a.download='heart-conversation-certification.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 const model=modelFactory({onState:({state,detail})=>{
  const compact={idle:'À charger',loading:'Chargement…',ready:'Prête',generating:'Réponse en cours…',error:'Indisponible'};
  if($('conversationStatus'))$('conversationStatus').textContent=compact[state];
  const labels={idle:'Modèle non chargé.',loading:'Chargement du modèle…',ready:'Modèle local prêt.',generating:'Génération locale…',error:'Modèle indisponible : '+detail};
  $('localModelStatus').textContent=labels[state];load.disabled=comparing||['loading','generating'].includes(state);modelSelect.disabled=comparing||['loading','generating'].includes(state);stop.disabled=state==='idle';
 },onProgress:progress=>{$('localModelStatus').textContent='Chargement : '+Math.round(Math.max(0,Math.min(1,Number(progress?.progress)||0))*100)+' % — '+String(progress?.text||'').slice(0,200);}});
 load.disabled=false;
 load.addEventListener('click',async()=>{try{await model.load(modelSelect.value);}catch(error){$('localModelStatus').textContent=error.message;}});
 stop.addEventListener('click',()=>{epoch++;cloudRequest?.abort();comparison?.stop();model.stop();});
 if($('modelComparisonPanel')?.querySelector)comparison=mountModelComparison($('modelComparisonPanel'),{model,canStart:()=>!replying&&!['loading','generating'].includes(model.status().state),onBusy:value=>{comparing=value;load.disabled=value;modelSelect.disabled=value;}});
 function prepareTeaching({question,answer}){
  $('localTeachingQuestion').value=question.slice(0,240);$('localTeachingAnswer').value=answer.slice(0,700);
  feedback.textContent='Vérifie et corrige cet exemple, puis valide son enregistrement.';
 }
 $('localTeachingUseLast').addEventListener('click',()=>{if(lastReply)prepareTeaching(lastReply);});
 $('localTeachingForm').addEventListener('submit',event=>{
  event.preventDefault();
  try{
   const next=approveTeaching({learning:readLearning(),question:$('localTeachingQuestion').value,answer:$('localTeachingAnswer').value,consent:canRemember()});
   if(!writeLearning(next))throw Error('Impossible d’enregistrer cet exemple sur cet appareil.');
   feedback.textContent='Exemple approuvé et enregistré. Il pourra guider les prochaines réponses ; les poids du modèle restent inchangés.';
   doc.dispatchEvent(new Event('warlike-heart-learning-external-update'));
  }catch(error){feedback.textContent=error.message;}
 });
 let lastReply=null,epoch=0,cloudRequest=null;
 function clearTeaching(){lastReply=null;$('localTeachingUseLast').disabled=true;$('localTeachingForm').reset();feedback.textContent='Aucun exemple enregistré automatiquement.';}
 return {
  async reply(history){
   if(comparing)throw Error('Comparaison en cours : arrête-la avant de discuter.');
   if(model.status().state!=='ready')throw Error('Charge le modèle local avant de discuter.');
   replying=true;
   try{
   const ticket=epoch;cloudRequest?.abort();cloudRequest=new AbortController();
   const cloud=await fetchCognitiveContext(contextQuery(history),{enabled:$('localCognitiveContext')?.checked===true,signal:AbortSignal.any([cloudRequest.signal,AbortSignal.timeout(10000)])});
   if(ticket!==epoch)throw Error('Contexte de conversation modifié.');
   const evidence=retrieveLocalEvidence({query:contextQuery(history),history,learning:readLearning()});
   let semanticRows=[];if(semantic.status()==='ready'){try{semanticRows=await semantic.search(contextQuery(history),corpus(history));}catch(error){if(ticket!==epoch)throw error;$('semanticStatus').textContent='Recherche par mots : '+error.message;}}
   if(ticket!==epoch)throw Error('Contexte de conversation modifié.');
   const context=buildLocalContext({history,memories:readMemories(),evidence:[...semanticRows,...evidence,...journalEvidence(readArchive(),contextQuery(history)),...cloud]});
   const result=await answerWithReview({history,generate:async repairGuidance=>{if(ticket!==epoch)throw Error('Conversation modifiée.');return model.generate(repairGuidance?buildLocalContext({history,memories:readMemories(),evidence:[...semanticRows,...evidence,...journalEvidence(readArchive(),contextQuery(history)),...cloud],repairGuidance}).messages:context.messages);}});
   if(ticket!==epoch)throw Error('Conversation modifiée.');lastVerification=result.verification;
   $('localModelStatus').textContent='Réponse générée sur cet appareil.'+(context.contextCount?' Éléments de contexte : '+context.contextCount+' élément(s).':'')+(context.truncated?' Historique réduit pour la fenêtre du modèle.':'');
   return result.reply;
   }finally{replying=false;}
  },
  async recall(text,{history=[]}={}){if(semantic.status()!=='ready')return null;try{const rows=await semantic.search(text.replace(/^\/rappel\s+/i,''),corpus(history));return rows.length?'Extraits retrouvés par similarité sémantique (exactitude non vérifiée) :\n'+rows.map(x=>x.title+' : « '+x.text+' »').join('\n'):null;}catch{return null;}},
  verification:()=>lastVerification,
  prepareTeaching,
  onReply({question,answer}){lastReply={question,answer};$('localTeachingUseLast').disabled=false;},
  reset(){comparison?.stop();epoch++;cloudRequest?.abort();semantic.stop();certificationReport=null;lastVerification=null;if($('certificationExport'))$('certificationExport').disabled=true;model.stop();clearTeaching();},clearTeaching,status:model.status
 };
}
