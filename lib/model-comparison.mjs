import {buildLocalContext} from './local-context.mjs';
import {LOCAL_MODELS} from './local-model.mjs';
export const COMPARISON_CASES=Object.freeze([
 {id:'personality',name:'Personnalité',history:[{role:'user',text:'Tu fais quoi de beau ?'}],criterion:'Français, tutoiement, ton naturel ; aucune activité personnelle inventée.'},
 {id:'reformulation',name:'Reformulation',history:[{role:'user',text:'Explique une variable en programmation.'},{role:'assistant',text:'Une variable est une boîte avec un nom et une valeur.'},{role:'user',text:'Explique cela autrement, sans reprendre la boîte.'}],criterion:'Une nouvelle explication de la même notion, sans répétition de la métaphore.'},
 {id:'correction',name:'Continuité',history:[{role:'user',text:'Aster est mon jeu maritime.'},{role:'assistant',text:'Je comprends.'},{role:'user',text:'Non, je corrige : Aster sera un jeu spatial.'},{role:'assistant',text:'La correction est prise en compte.'},{role:'user',text:'Quel est le cadre actuel de mon jeu Aster ?'}],criterion:'Le cadre spatial doit remplacer le cadre maritime.'},
 {id:'memory',name:'Mémoire',memories:['Le projet Aster utilise des voiliers sur une planète de glace.'],history:[{role:'user',text:'Quels véhicules utilise le projet Aster ?'}],criterion:'Des voiliers ; utilisation du souvenir fourni, sans détail inventé.'},
 {id:'reasoning',name:'Raisonnement',history:[{role:'user',text:'Quatre objets coûtent 3 € chacun, plus 7 € de livraison. Mon budget est 18 €. Quel total et puis-je payer ? Explique brièvement.'}],criterion:'Total 19 € ; budget insuffisant de 1 €, avec calcul vérifiable.'}
]);
// Outputs and durations are measurements. Quality remains a human judgement.
export async function compareLocalModels({model,modelIds=LOCAL_MODELS.map(x=>x.id),signal,onResult=()=>{},now=()=>performance.now()}={}){
 const valid=new Set(LOCAL_MODELS.map(x=>x.id));
 if(!modelIds.length||modelIds.some(id=>!valid.has(id)))throw Error('Sélection de modèles invalide.');
 const results=[],abort=()=>model.stop();signal?.addEventListener('abort',abort,{once:true});
 const check=()=>signal?.throwIfAborted();
 try{
  for(const modelId of modelIds){
   check();const loading=now();let loadMs;
   try{await model.load(modelId);check();loadMs=Math.round(now()-loading);}
   catch(error){check();const row={model:modelId,caseId:'load',error:error.message,review:'not-reviewed'};results.push(row);onResult(row);continue;}
   for(const scenario of COMPARISON_CASES){
    check();const context=buildLocalContext({history:scenario.history,memories:scenario.memories||[]}),start=now();let row;
    try{const result=await model.generate(context.messages);check();row={model:modelId,caseId:scenario.id,name:scenario.name,reply:result.reply,latencyMs:Math.round(now()-start),loadMs,criterion:scenario.criterion,review:'not-reviewed'};}
    catch(error){check();row={model:modelId,caseId:scenario.id,error:error.message,review:'not-reviewed'};}
    results.push(row);onResult(row);
   }
   model.stop();
  }
  return {schema:'heart.model-comparison.v1',createdAt:new Date().toISOString(),qualityCertified:false,results};
 }finally{signal?.removeEventListener('abort',abort);model.stop();}
}
