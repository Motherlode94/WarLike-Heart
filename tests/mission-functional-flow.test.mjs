import test from 'node:test';import assert from 'node:assert/strict';
import {parseAiMission} from '../lib/ai-mission-plan.mjs';
import {runInternalMission} from '../lib/internal-mission-run.mjs';
import {resumeDraft} from '../lib/mission-resume.mjs';
import {onRequestGet as notices} from '../functions/api/mission-notices.js';
import {onRequestGet as inspection} from '../functions/api/mcp-inspection-result.js';
test('validated AI draft runs internal reads, blocks failed dependencies, and produces explicit recovery draft',async()=>{const tasks=[{id:'a',action:'heart.memory.search',query:'Engine',dependsOn:[]},{id:'b',action:'heart.goal.inspect',query:'Engine',dependsOn:['a']}];const draft=parseAiMission(JSON.stringify({tasks}));assert.equal(draft.executed,false);assert.deepEqual(draft.tasks,tasks);let calls=0;const db={prepare(){return {bind(owner){assert.equal(owner,'owner');return {async all(){calls++;throw Error('unavailable');}};}};}};const r=await runInternalMission(db,'owner',draft.tasks,100);assert.equal(calls,1);assert.deepEqual(r.results.map(x=>x.status),['failed','blocked']);const next=resumeDraft(tasks,r.results);assert.deepEqual(next.tasks,tasks);assert.equal(next.executed,false);});
test('private notices and MCP receipt lookup reject anonymous access',async()=>{for(const handler of [notices,inspection]){const r=await handler({request:new Request('https://heart.example/api/test'),env:{}});assert.equal(r.status,403);assert.match(r.headers.get('cache-control'),/no-store/);}});
