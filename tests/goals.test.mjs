import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,normalizeGoal} from '../functions/api/goals.js';
import {onRequestPost as pair} from '../functions/api/account.js';
const origin='https://heart.example',secret='test-secret-for-heart-goal-engine-123456789';
test('account-scoped goals, progress, CAS and deletion',async()=>{
 const raw=new DatabaseSync(':memory:');raw.exec(readFileSync(new URL('../migrations/0003_heart_goals.sql',import.meta.url),'utf8'));
 const db={prepare(sql){return {bind(...args){return {first:async()=>raw.prepare(sql).get(...args)||null,all:async()=>({results:raw.prepare(sql).all(...args)})};}};}};
 const env={HEART_DB:db,HEART_SESSION_SECRET:secret};
 async function cookie(id){const res=await pair({request:new Request(origin+'/api/account',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({code:'a'.repeat(43),verifier:'b'.repeat(43)})}),env:{...env,WARLIKE_SERVER:{fetch:async()=>Response.json({user:{id,name:id,role:'member'}})}}});assert.equal(res.status,200);return res.headers.get('set-cookie').split(';')[0];}
 const a=await cookie('a'),b=await cookie('b');
 const get=c=>onRequestGet({request:new Request(origin+'/api/goals',{headers:{cookie:c}}),env});
 const post=(c,body,o=origin)=>onRequestPost({request:new Request(origin+'/api/goals',{method:'POST',headers:{cookie:c,origin:o,'content-type':'application/json'},body:JSON.stringify(body)}),env});
 assert.equal((await get('')).status,401);
 const data={title:'Engine',steps:[{text:'Test',done:false}],status:'planned'};
 assert.equal(normalizeGoal({...data,status:'done'}),null);
 const created=await post(a,{action:'create',...data});assert.equal(created.status,201);
 const {goal}=await created.json();assert.equal((await (await get(b)).json()).goals.length,0);
 assert.equal((await post(b,{action:'delete',id:goal.id,revision:1})).status,409);
 assert.equal((await post(a,{action:'update',...goal,status:'active'})).status,200);
 assert.equal((await post(a,{action:'update',...goal,status:'paused'})).status,409);
 assert.equal((await post(a,{action:'delete',id:goal.id,revision:2},'https://evil.example')).status,403);
 assert.equal((await post(a,{action:'delete',id:goal.id,revision:2})).status,200);
 assert.equal((await (await get(a)).json()).goals.length,0);
 raw.close();
});
