import {mountModelComparison} from './model-comparison-panel.mjs';
import {fetchCognitiveContext} from './lib/context-selection.mjs';
import {contextQuery} from './lib/conversation-signals.mjs';
import {createLocalModel,LOCAL_MODELS} from './lib/local-model.mjs';
import {buildLocalContext} from './lib/local-context.mjs';
import {retrieveLocalEvidence} from './lib/local-evidence.mjs';
import {approveTeaching} from './lib/local-teaching.mjs';
export function createLocalChat({readLearning,readMemories,writeLearning,canRemember,document:doc=globalThis.document,modelFactory=createLocalModel}){
 const $=id=>doc.getElementById(id),feedback=$('localTeachingStatus');
 const modelSelect=$('localModelSelect'),load=$('localModelLoad'),stop=$('localModelStop');
 for(const model of LOCAL_MODELS){const option=doc.createElement('option');option.value=model.id;option.textContent=model.label+' — '+model.memory;modelSelect.append(option);}
 let comparing=false,comparison=null;
 const model=modelFactory({onState:({state,detail})=>{
  const labels={idle:'Modèle non chargé.',loading:'Chargement du modèle…',ready:'Modèle local prêt.',generating:'Génération locale…',error:'Modèle indisponible : '+detail};
  $('localModelStatus').textContent=labels[state];load.disabled=comparing||['loading','generating'].includes(state);modelSelect.disabled=comparing||['loading','generating'].includes(state);stop.disabled=state==='idle';
 },onProgress:progress=>{$('localModelStatus').textContent='Chargement : '+Math.round(Math.max(0,Math.min(1,Number(progress?.progress)||0))*100)+' % — '+String(progress?.text||'').slice(0,200);}});
 load.disabled=false;
 load.addEventListener('click',async()=>{try{await model.load(modelSelect.value);}catch(error){$('localModelStatus').textContent=error.message;}});
 stop.addEventListener('click',()=>{comparison?.stop();model.stop();});
 if($('modelComparisonPanel')?.querySelector)comparison=mountModelComparison($('modelComparisonPanel'),{model,onBusy:value=>{comparing=value;load.disabled=value;modelSelect.disabled=value;}});
 $('localTeachingUseLast').addEventListener('click',()=>{
  if(!lastReply)return;
  $('localTeachingQuestion').value=lastReply.question.slice(0,240);$('localTeachingAnswer').value=lastReply.answer.slice(0,700);
  feedback.textContent='Vérifie et corrige cet exemple, puis valide son enregistrement.';
 });
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
   const ticket=epoch;cloudRequest?.abort();cloudRequest=new AbortController();
   const cloud=await fetchCognitiveContext(contextQuery(history),{enabled:$('localCognitiveContext')?.checked===true,signal:AbortSignal.any([cloudRequest.signal,AbortSignal.timeout(10000)])});
   if(ticket!==epoch)throw Error('Contexte de conversation modifié.');
   const evidence=retrieveLocalEvidence({query:contextQuery(history),history,learning:readLearning()});
   const context=buildLocalContext({history,memories:readMemories(),evidence:[...evidence,...cloud]});
   const result=await model.generate(context.messages);
   $('localModelStatus').textContent='Réponse générée sur cet appareil.'+(context.contextCount?' Contexte approuvé : '+context.contextCount+' élément(s).':'')+(context.truncated?' Historique réduit pour la fenêtre du modèle.':'');
   return result.reply;
  },
  onReply({question,answer}){lastReply={question,answer};$('localTeachingUseLast').disabled=false;},
  reset(){comparison?.stop();epoch++;cloudRequest?.abort();model.stop();clearTeaching();},clearTeaching,status:model.status
 };
}
