import test from 'node:test';import assert from 'node:assert/strict';
import {approveTeaching} from '../lib/local-teaching.mjs';
import {retrieveLocalEvidence} from '../lib/local-evidence.mjs';
test('requires explicit approval and valid lengths without modifying existing data',()=>{
 const learning={version:1,dialogues:[],knowledge:[]};
 assert.throws(()=>approveTeaching({learning,question:'Un projet ?',answer:'Une réponse.'}),/mémoire/);
 assert.throws(()=>approveTeaching({learning,question:'a',answer:'Une réponse.',consent:true}),/question/);
 assert.throws(()=>approveTeaching({learning,question:'Un projet ?',answer:'a'.repeat(701),consent:true}),/réponse/);
 assert.equal(learning.dialogues.length,0);
});
test('an approved correction replaces an old example and is available for generation',()=>{
 const learning={version:1,dialogues:[{question:'Comment sauvegarder ?',answer:'Ancienne réponse'}],knowledge:[{subject:'Engine',content:'Un moteur'}]};
 const corrected=approveTeaching({learning,question:'Comment sauvegarder ?',answer:'Menu Fichier, puis Enregistrer.',consent:true});
 assert.equal(corrected.dialogues.length,1);assert.equal(learning.dialogues[0].answer,'Ancienne réponse');
 assert.equal(retrieveLocalEvidence({query:'sauvegarder',learning:corrected})[0].text,'Menu Fichier, puis Enregistrer.');
});
test('a full store allows corrections but rejects silent loss of new examples',()=>{
 const learning={dialogues:Array.from({length:500},(_,i)=>({question:'Question '+i,answer:'Réponse existante'})),knowledge:[]};
 assert.throws(()=>approveTeaching({learning,question:'Nouvelle question',answer:'Réponse nouvelle',consent:true}),/Limite/);
 assert.equal(approveTeaching({learning,question:'Question 2',answer:'Réponse corrigée',consent:true}).dialogues[2].answer,'Réponse corrigée');
});
