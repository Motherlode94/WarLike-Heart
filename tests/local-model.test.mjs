import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalModel,LOCAL_MODELS} from '../lib/local-model.mjs';
import {createModelWorker,RUNTIME_URL} from '../lib/local-model-worker.mjs';
const model=LOCAL_MODELS[0].id;
test('model runtime calls actual inference API with bounded generation',async()=>{
 const output=[];let request,loads=0;
 const handle=createModelWorker({post:data=>output.push(data),loadRuntime:async()=>({CreateMLCEngine:async(id,opts,config)=>{
  loads++;assert.equal(id,model);assert.equal(config.context_window_size,4096);opts.initProgressCallback({progress:.5});
  return {chat:{completions:{create:async input=>{request=input;return {choices:[{message:{content:'Une réponse générée.'}}]};}}}};
 }})});
 assert.match(RUNTIME_URL,/@0\.2\.79/);
 await handle({id:1,type:'generate',messages:[]});assert.equal(output.at(-1).type,'error');assert.equal(loads,0);
 await handle({id:2,type:'load',model});assert.equal(output.at(-1).type,'loaded');
 const messages=[{role:'user',content:'Salut'}];await handle({id:3,type:'generate',messages});
 assert.deepEqual(request.messages,messages);assert.equal(request.max_tokens,512);assert.equal(output.at(-1).reply,'Une réponse générée.');
 await handle({id:4,type:'load',model:'https://foreign.test/model'});assert.equal(output.at(-1).type,'error');assert.equal(loads,1);
});
test('local model lifecycle rejects unsupported devices, concurrent generation and cancels pending work',async()=>{
 let worker,posted;
 const engine=createLocalModel({supported:()=>true,workerFactory:()=>worker={postMessage:x=>{posted=x;},terminate(){this.terminated=true;}}});
 const loading=engine.load(model);assert.equal(engine.status().state,'loading');
 worker.onmessage({data:{id:posted.id,type:'loaded'}});await loading;assert.equal(engine.status().state,'ready');
 const generating=engine.generate([{role:'user',content:'Bonjour'}]);
 await assert.rejects(engine.generate([]),/Charge/);
 const stopped=assert.rejects(generating,/arrêté/);engine.stop();await stopped;assert.equal(worker.terminated,true);assert.equal(engine.status().state,'idle');
 const unsupported=createLocalModel({supported:()=>false});await assert.rejects(unsupported.load(model),/WebGPU/);
});
test('failed model download is recoverable without a remote fallback',async()=>{
 const engine=createLocalModel({supported:()=>true,workerFactory:()=>({terminate(){},postMessage(x){queueMicrotask(()=>this.onmessage({data:{id:x.id,type:'error',error:'Téléchargement impossible'}}));}})});
 await assert.rejects(engine.load(model),/Téléchargement/);assert.equal(engine.status().state,'error');
});
