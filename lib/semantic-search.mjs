// No message or embedding is posted to an inference API. A dedicated worker
// downloads fixed public model files only after the explicit load action.
export function createSemanticSearch({workerFactory=()=>new Worker(new URL('./semantic-worker.mjs',import.meta.url),{type:'module'}),onState=()=>{},onProgress=()=>{}}={}){
 let worker=null,pending=null,state='idle',sequence=0;
 const update=value=>{state=value;onState(value);};
 function stop(){worker?.terminate();worker=null;if(pending){clearTimeout(pending.timer);pending.reject(Error('Recherche sémantique arrêtée.'));pending=null;}update('idle');}
 function request(type,payload={}){
  if(pending)return Promise.reject(Error('Recherche sémantique occupée.'));
  return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{stop();},180000);pending={id,resolve,reject,timer};worker.postMessage({id,type,...payload});});
 }
 return {stop,status:()=>state,async load(){stop();update('loading');const current=worker=workerFactory();
  current.onmessage=({data})=>{if(current!==worker||data.id!==pending?.id)return;if(data.type==='progress'){onProgress(data.detail);return;}const p=pending;pending=null;clearTimeout(p.timer);if(data.type==='error')p.reject(Error(data.error));else p.resolve(data);};
  current.onerror=()=>{if(current===worker)stop();};
  try{await request('load');if(worker===current)update('ready');}catch(error){if(worker===current){stop();update('error');}throw error;}
 },async search(query,records){if(state!=='ready')return [];update('searching');const current=worker;try{return (await request('search',{query,records})).rows;}finally{if(current===worker)update('ready');}}};
}
