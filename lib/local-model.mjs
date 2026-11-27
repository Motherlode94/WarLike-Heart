// A dedicated worker owns the model and GPU. No conversation is sent to an API.
export const LOCAL_MODELS = Object.freeze([
  {id:'Qwen2.5-1.5B-Instruct-q4f32_1-MLC', label:'Qwen 2.5 · 1,5B', memory:'environ 1,6 Go de mémoire GPU'},
  {id:'Qwen2.5-3B-Instruct-q4f32_1-MLC', label:'Qwen 2.5 · 3B', memory:'environ 3 Go de mémoire GPU'}
]);
export function createLocalModel({workerFactory=()=>new Worker(new URL('./local-model-worker.mjs',import.meta.url),{type:'module'}), onState=()=>{}, onProgress=()=>{}, supported=()=>Boolean(globalThis.navigator?.gpu)&&globalThis.isSecureContext===true}={}) {
  let worker=null, pending=null, sequence=0, state='idle', model=null;
  const update=(next,detail='')=>{state=next;onState({state,model,detail});};
  function stop(){
    worker?.terminate();worker=null;
    if(pending){pending.reject(Error('Modèle local arrêté.'));pending=null;}
    model=null;update('idle');
  }
  function request(type,payload={}){
    if(pending)return Promise.reject(Error('Le modèle local est déjà occupé.'));
    const id=++sequence;
    return new Promise((resolve,reject)=>{pending={id,resolve,reject};worker.postMessage({id,type,...payload});});
  }
  async function load(modelId){
    if(!LOCAL_MODELS.some(m=>m.id===modelId))throw Error('Modèle inconnu.');
    if(!supported())throw Error('WebGPU est requis dans un navigateur compatible en HTTPS.');
    stop();model=modelId;update('loading');
    try{
      const current=worker=workerFactory();
      current.onmessage=({data})=>{
        if(current!==worker||!pending||data.id!==pending.id)return;
        if(data.type==='progress'){onProgress(data.progress);return;}
        const task=pending;pending=null;
        if(data.type==='error')task.reject(Error(data.error||'Erreur du modèle local.'));
        else task.resolve(data);
      };
      current.onerror=()=>{if(current===worker){stop();update('error','Le moteur local a été interrompu.');}};
      await request('load',{model:modelId});
      update('ready');
    }catch(error){worker?.terminate();worker=null;model=null;update('error',error.message);throw error;}
  }
  async function generate(messages){
    if(state!=='ready')throw Error('Charge le modèle local avant de discuter.');
    update('generating');
    try{
      const result=await request('generate',{messages});
      if(typeof result.reply!=='string'||!result.reply.trim())throw Error('Réponse locale vide.');
      update('ready');return {reply:result.reply,model,mode:'local-llm'};
    }catch(error){if(worker)update('ready');throw error;}
  }
  return {load,generate,stop,status:()=>({state,model}),supported};
}
