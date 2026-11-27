import test from 'node:test';import assert from 'node:assert/strict';import {compareLocalModels,COMPARISON_CASES} from '../lib/model-comparison.mjs';import {LOCAL_MODELS} from '../lib/local-model.mjs';
test('models receive identical synthetic cases with ungraded answers and timings',async()=>{
 const prompts=[],loads=[];let tick=0,stops=0;
 const report=await compareLocalModels({model:{load:async id=>loads.push(id),generate:async messages=>{prompts.push(messages);return {reply:'Une réponse.'};},stop:()=>stops++},now:()=>++tick});
 assert.equal(report.results.length,COMPARISON_CASES.length*2);assert.equal(report.qualityCertified,false);assert.deepEqual(prompts[0],prompts[COMPARISON_CASES.length]);assert.equal(report.results[0].review,'not-reviewed');assert.equal(loads.length,2);assert.ok(stops>0);
});
test('loading failure is reported and cancellation stops further evaluation',async()=>{
 const failed=await compareLocalModels({model:{load:async()=>{throw Error('WebGPU absent');},stop(){}},modelIds:[LOCAL_MODELS[0].id]});assert.match(failed.results[0].error,/WebGPU/);assert.equal(failed.qualityCertified,false);
 const controller=new AbortController();controller.abort();await assert.rejects(compareLocalModels({model:{stop(){}},signal:controller.signal}),{name:'AbortError'});
});
