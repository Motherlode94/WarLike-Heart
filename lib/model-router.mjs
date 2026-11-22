// Fixed destinations: never accept provider URLs, credentials or model names from clients.
export function configuredProviders(env){
 const p=[];
 if(env.OPENAI_API_KEY)p.push({id:'openai',model:env.HEART_MODEL||'gpt-4.1-mini'});
 if(env.AI&&env.HEART_WORKERS_AI_MODEL)p.push({id:'workers-ai',model:env.HEART_WORKERS_AI_MODEL});
 return p;
}
export function providerOrder(env,requested='auto'){
 const p=configuredProviders(env),preferred=requested==='auto'?(env.HEART_PRIMARY_PROVIDER||'openai'):requested;
 if(!['openai','workers-ai'].includes(preferred))throw Error('Fournisseur invalide');
 if(requested!=='auto')return p.filter(x=>x.id===preferred);
 const first=p.find(x=>x.id===preferred);
 return [...(first?[first]:[]),...p.filter(x=>x!==first)];
}
export async function runModel(env,{messages,instructions,provider='auto'},fetcher=fetch){
 const candidates=providerOrder(env,provider);
 if(!candidates.length)return {error:'Fournisseur non configuré',status:503};
 const allowFallback=provider==='auto'&&env.HEART_ALLOW_PROVIDER_FALLBACK==='true';
 const plan=allowFallback?candidates:candidates.slice(0,1);
 const started=Date.now();
 for(const p of plan){
  const remaining=24000-(Date.now()-started);if(remaining<=0)break;
  try{
   let answer;
   if(p.id==='openai'){
    const r=await fetcher('https://api.openai.com/v1/responses',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+env.OPENAI_API_KEY},body:JSON.stringify({model:p.model,instructions,input:messages,max_output_tokens:400,store:false}),signal:AbortSignal.timeout(Math.min(remaining,12000))});
    if(!r.ok){if(r.status===429||r.status>=500)continue;return {error:'Requête refusée par le fournisseur',status:502};}
    const d=await r.json();answer=(d.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n');
   }else{
    let timer;try{const d=await Promise.race([env.AI.run(p.model,{messages:[{role:'system',content:instructions},...messages],max_tokens:400}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),Math.min(remaining,12000));})]);answer=d?.response;}finally{clearTimeout(timer);}
   }
   if(typeof answer==='string'&&answer.trim())return {reply:answer.trim().slice(0,4000),provider:p.id,model:p.model,latencyMs:Date.now()-started,mode:'ai'};
  }catch{/* upstream errors and credentials are never returned */}
 }
 return {error:'Fournisseur IA indisponible',status:502};
}
