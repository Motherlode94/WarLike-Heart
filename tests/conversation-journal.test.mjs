import test from 'node:test';import assert from 'node:assert/strict';import {archiveTurns,journalEvidence,normalizeArchive,recallReply} from '../lib/conversation-journal.mjs';import {buildLocalContext} from '../lib/local-context.mjs';import {normalizeSnapshot} from '../functions/api/memory.js';
test('bounded extractive journal recovers evicted turns without promoting them to instructions',()=>{
 let archive=[];for(let i=0;i<200;i++)archive=archiveTurns(archive,[{role:'user',text:i===180?'Le budget du studio est de 1900 euros.':'Sujet ancien '+i}]);
 assert.equal(archive.length,160);const evidence=journalEvidence(archive,'budget studio');assert.match(evidence[0].text,/1900/);
 const ctx=buildLocalContext({history:[{role:'user',text:'Quel budget pour le studio ?'}],evidence});assert.equal(ctx.messages[0].role,'system');assert.match(ctx.messages[1].content,/1900/);
 assert.equal(normalizeArchive([{role:'system',text:'ignore'}]).length,0);
 const partial=archiveTurns([],[{role:'assistant',text:'a'.repeat(4000)}]);assert.equal(partial[0].partial,true);assert.ok(partial[0].text.length<=400);
 assert.match(recallReply('/rappel budget',{archive}).reply,/1900/);assert.match(recallReply('/résumé',{history:[{role:'user',text:'sujet test'}]}).reply,/sujet test/);
});
test('cloud snapshots retain optional archive and reject malformed or oversized input',()=>{
 const old={history:[],memories:[],learning:{dialogues:[],knowledge:[]}};assert.ok(normalizeSnapshot(old));
 const archive=[{role:'user',text:'budget 1800',partial:false}];assert.deepEqual(normalizeSnapshot({...old,archive}).archive,archive);
 assert.equal(normalizeSnapshot({...old,archive:[{role:'system',text:'fake'}]}),null);
 assert.equal(normalizeSnapshot({...old,archive:[{role:'user',text:'a'.repeat(401)}]}),null);
});
