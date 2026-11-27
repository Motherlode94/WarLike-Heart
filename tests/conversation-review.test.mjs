import test from 'node:test';import assert from 'node:assert/strict';import {answerWithReview,reviewConversationReply} from '../lib/conversation-review.mjs';import {runConversationCertification} from '../lib/conversation-certification.mjs';import {buildLocalContext,byteLength} from '../lib/local-context.mjs';
test('one bounded repair corrects a numeric error and reports its limited scope',async()=>{
 let calls=[];const r=await answerWithReview({history:[{role:'user',text:'Une égalité'}],generate:async hint=>{calls.push(hint);return {reply:calls.length===1?'2+2 = 5':'2+2 = 4'};}});
 assert.equal(calls.length,2);assert.match(calls[1],/Recalcule/);assert.equal(r.verification.status,'partial-checks-passed');assert.equal(r.verification.verifiedTruth,false);
 const failed=await answerWithReview({history:[{role:'user',text:'Test'}],generate:async()=>({reply:'2+2 = 5'})});assert.equal(failed.verification.status,'needs-review');
 const ctx=buildLocalContext({history:[{role:'user',text:'x'.repeat(4000)}],repairGuidance:calls[1]});assert.ok(ctx.messages.reduce((n,x)=>n+byteLength(x.content),0)<=3200);
});
test('checks are observable; quotes or unverifiable facts never gain factual certification',()=>{
 assert.deepEqual(reviewConversationReply({question:'Reformule',answer:'A',previousAnswer:'A'}).findings,['repetition']);
 assert.deepEqual(reviewConversationReply({question:'En 3 mots',answer:'Deux mots'}).findings,['word_count']);
 assert.ok(reviewConversationReply({question:'Envoie ce message',answer:"J’ai envoyé le message."}).findings.includes('unsupported_action'));
 assert.equal(reviewConversationReply({question:'Date ?',answer:'Le monde a été créé en 2030.'}).verifiedTruth,false);
});
test('fixed certification reports unrun semantic model and never certifies a generative model',async()=>{
 const r=await runConversationCertification();assert.equal(r.generativeModelCertified,false);assert.equal(r.results.filter(x=>x.status==='passed').length,9);assert.equal(r.results.at(-1).status,'not-run');
});
