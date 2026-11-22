import test from 'node:test';import assert from 'node:assert/strict';import {providerOrder,runModel} from '../lib/model-router.mjs';
const env={OPENAI_API_KEY:'test',AI:{run:async()=>({response:'local provider'})},HEART_WORKERS_AI_MODEL:'test-model'};
const task={messages:[{role:'user',content:'hello'}],instructions:'test'};
test('explicit provider and disabled fallback',async()=>{assert.deepEqual(providerOrder(env,'workers-ai').map(p=>p.id),['workers-ai']);assert.throws(()=>providerOrder(env,'https://evil'));const r=await runModel(env,task,async()=>new Response('',{status:503}));assert.equal(r.status,502);});
test('opt-in fallback and explicit provider isolation',async()=>{const e={...env,HEART_ALLOW_PROVIDER_FALLBACK:'true'};const fail=async()=>new Response('',{status:503});assert.equal((await runModel(e,task,fail)).provider,'workers-ai');assert.equal((await runModel(e,{...task,provider:'openai'},fail)).status,502);});
test('openai success',async()=>{const r=await runModel(env,task,async()=>Response.json({output:[{content:[{type:'output_text',text:'ok'}]}]}));assert.equal(r.reply,'ok');assert.equal(r.provider,'openai');});
