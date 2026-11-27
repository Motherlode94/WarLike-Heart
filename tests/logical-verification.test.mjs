import test from 'node:test';import assert from 'node:assert/strict';import {verifyLogic,verifyConstraints,logicReply} from '../lib/logical-verification.mjs';
test('Horn proofs distinguish unknown, refutation and inconsistency with provenance',()=>{
 const base={faits:['pluie'],regles:[{si:['mouille'],alors:'glisse'},{si:['pluie'],alors:'mouille'}],conclusion:'glisse'};
 const a=verifyLogic(base);assert.equal(a.status,'proved');assert.deepEqual(a.proof.map(x=>x.proposition),['pluie','mouille','glisse']);assert.equal(a.proof.at(-1).rule,1);
 assert.equal(verifyLogic({...base,conclusion:'soleil'}).status,'unknown');
 assert.equal(verifyLogic({...base,faits:['!glisse']}).status,'refuted');
 assert.equal(verifyLogic({...base,faits:['pluie','!mouille']}).status,'inconsistent');
 assert.equal(verifyLogic({regles:[{si:['a'],alors:'b'},{si:['b'],alors:'a'}],conclusion:'a'}).status,'unknown');
});
test('numeric constraints verify supplied assignments exactly and reject missing values',()=>{
 const a=verifyConstraints('x=10 ; x>=5 ; x<=8');assert.equal(a.passes,false);assert.deepEqual(a.checks.map(x=>x.passes),[true,false]);
 assert.equal(verifyConstraints('x=0,1+0,2 ; x==0,3').passes,true);
 for(const q of ['y<3','x=2 ; x=3 ; x>0','x=2','x=2 ; process.exit()>0'])assert.throws(()=>verifyConstraints(q));
 assert.equal(logicReply('/logique {bad').verification.status,'input-error');
});
