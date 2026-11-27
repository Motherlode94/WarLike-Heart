import {LOCAL_GENERATION_SETTINGS} from './heart-personality.mjs';
// Pinned runtime, downloaded only after the user presses Load.
export const RUNTIME_URL='https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.79/+esm';
const allowedModels=new Set(['Qwen2.5-1.5B-Instruct-q4f32_1-MLC','Qwen2.5-3B-Instruct-q4f32_1-MLC']);
export function createModelWorker({loadRuntime=()=>import(RUNTIME_URL),post=()=>{}}={}){
  let engine=null;
  return async ({id,type,model,messages})=>{
    try{
      if(type==='load'){
        if(!allowedModels.has(model))throw Error('Modèle inconnu.');
        const {CreateMLCEngine}=await loadRuntime();
        engine=await CreateMLCEngine(model,{initProgressCallback:progress=>post({id,type:'progress',progress})},{context_window_size:4096});
        post({id,type:'loaded'});
      }else if(type==='generate'){
        if(!engine)throw Error('Modèle non chargé.');
        if(!Array.isArray(messages)||!messages.length)throw Error('Contexte invalide.');
        const result=await engine.chat.completions.create({messages,...LOCAL_GENERATION_SETTINGS,stream:false});
        const reply=result.choices?.[0]?.message?.content;
        if(typeof reply!=='string'||!reply.trim())throw Error('Réponse locale vide.');
        post({id,type:'result',reply:reply.trim().slice(0,4000)});
      }else throw Error('Commande inconnue.');
    }catch(error){post({id,type:'error',error:String(error?.message||'Erreur du modèle local.').slice(0,400)});}
  };
}
if(typeof self!=='undefined'&&typeof self.postMessage==='function'&&typeof document==='undefined'){
  const handle=createModelWorker({post:data=>self.postMessage(data)});
  self.onmessage=event=>handle(event.data);
}
