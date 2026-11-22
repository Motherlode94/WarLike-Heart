import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';import {claimRun,finishRun,expireRuns,deleteRun} from '../lib/agent-execution.mjs';
test('atomic claim, policy, terminal state, timeout and deletion',async()=>{
 const raw=new DatabaseSync(':memory:');
 try{
 for(const name of ['0006_heart_agents.sql','0007_heart_plugin_settings.sql','0008_heart_plugin_permissions.sql'])raw.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
 const db={prepare(sql){return {bind(...args){return {run:()=>({meta:{changes:raw.prepare(sql).run(...args).changes}})}}};},async batch(stmts){raw.exec('BEGIN');try{const r=stmts.map(s=>s.run());raw.exec('COMMIT');return r;}catch(e){raw.exec('ROLLBACK');throw e;}}};
 const insert=raw.prepare("INSERT INTO heart_agent_runs(member_id,id,action,query,status,created_at,updated_at) VALUES(?,?, 'github.repo.inspect','Heart','approved',1,1)");
 insert.run('a','one');insert.run('a','two');
 assert.equal(await claimRun(db,'a','one','github',10),false);
 raw.prepare('INSERT INTO heart_plugin_settings(member_id,plugin_id,enabled,updated_at) VALUES(?,?,1,1)').run('a','github');
 assert.equal(await claimRun(db,'b','one','github',10),false);
 assert.equal(await claimRun(db,'a','one','github',10),false);
 raw.prepare('INSERT INTO heart_plugin_permissions(member_id,action,permission,granted,updated_at) VALUES(?,?,?,?,?)').run('a','github.repo.inspect','read',1,1);
 assert.equal(await claimRun(db,'a','one','github',10,'diagnostic'),false);
 const claims=await Promise.all([claimRun(db,'a','one','github',10),claimRun(db,'a','one','github',10)]);assert.deepEqual(claims,[true,false]);
 assert.equal(await deleteRun(db,'a','one'),false);
 assert.equal(await finishRun(db,'a','one','done','[]',20),true);
 assert.equal(await finishRun(db,'a','one','failed',null,30),false);
 assert.equal(await deleteRun(db,'b','one'),false);
 assert.equal(await deleteRun(db,'a','one'),true);
 assert.equal(raw.prepare("SELECT COUNT(*) AS n FROM heart_agent_events WHERE run_id='one'").get().n,0);
 assert.equal(await claimRun(db,'a','two','github',10),true);
 await expireRuns(db,'a',121000);
 assert.equal(raw.prepare("SELECT status FROM heart_agent_runs WHERE id='two'").get().status,'failed');
 assert.equal(await finishRun(db,'a','two','done','[]',122000),false);
 }finally{raw.close();}
});
