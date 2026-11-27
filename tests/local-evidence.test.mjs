import test from 'node:test';import assert from 'node:assert/strict';
import {retrieveLocalEvidence} from '../lib/local-evidence.mjs';
const learning={knowledge:[{subject:'WarLike Engine',content:'Un moteur de jeux avec des composants et des scènes.'},{subject:'Studio',content:'Une station audio pour enregistrer la voix.'}],dialogues:[{question:'Comment sauvegarder Engine ?',answer:'Enregistre le projet dans le menu Fichier.'}]};
test('retrieves content and approved examples rather than returning a canned response',()=>{
 assert.equal(retrieveLocalEvidence({query:'enregistrer la voix',learning})[0].title,'Studio');
 assert.equal(retrieveLocalEvidence({query:'sauvegarder Engine',learning})[0].source,'approved-example');
 assert.equal(retrieveLocalEvidence({query:'météorite inconnue',learning}).length,0);
});
test('explicit reformulation retrieves the prior topic, a new topic does not',()=>{
 const history=[{role:'user',text:'Parle-moi de WarLike Engine'},{role:'assistant',text:'Un moteur de jeux.'},{role:'user',text:'Reformule cela.'}];
 assert.equal(retrieveLocalEvidence({query:'Reformule cela.',history,learning})[0].title,'WarLike Engine');
 assert.equal(retrieveLocalEvidence({query:'recette du gâteau',history,learning}).length,0);
});
test('retrieval is bounded and malformed imported entries are ignored',()=>{
 assert.deepEqual(retrieveLocalEvidence({query:'Engine',learning:{knowledge:[null,{}, {subject:'Engine',content:3}]}}),[]);
 assert.ok(retrieveLocalEvidence({query:'Engine',learning}).length<=3);
});
