import test from "node:test";
import assert from "node:assert/strict";
import brain from "../learning-brain.js";
test("starts with an empty validated store",()=>{
 assert.deepEqual(brain.validated(null),{version:1,dialogues:[],knowledge:[]});
});
test("does not answer without user consent",()=>{
 const b=brain.create({enabled:()=>false,read:()=>({dialogues:[{question:"Salut",answer:"Coucou !"}]})});
 assert.equal(b.answer("Salut"),null);
});
test("trained examples answer, unknown messages fall back",()=>{
 const data={dialogues:[{question:"Comment avance mon jeu ?",answer:"Vérifie tes scènes."}],knowledge:[{subject:"WarLike Engine",content:"Moteur de jeux web."}]};
 const b=brain.create({enabled:()=>true,read:()=>data});
 assert.equal(b.answer("Comment avance mon jeu ?").text,"Vérifie tes scènes.");
 assert.equal(b.answer("WarLike Engine").text,"Moteur de jeux web.");
 assert.equal(b.answer("question sans aucun lien"),null);
});
test("rejects malformed and oversized teaching data",()=>{
 const huge="x".repeat(1000),v=brain.validated({dialogues:[{question:"Q?",answer:huge},{question:"salut",answer:"Une réponse"},{question:"SALUT",answer:"Autre réponse"}],knowledge:[{subject:"projet",content:"Une description"},{subject:"X",content:"Y"}]});
 assert.equal(v.dialogues.length,1);
 assert.equal(v.knowledge.length,1);
 assert.equal(brain.score("un sujet","un sujet"),1);
});
test("limited context resolves a follow-up on last topic",()=>{
 const b=brain.create({enabled:()=>true,read:()=>({knowledge:[{subject:"WarLike Engine",content:"Un moteur de jeux web."}]})});
 assert.equal(b.answer("WarLike Engine").text,"Un moteur de jeux web.");
 assert.equal(b.answer("Et alors ?").text,"Un moteur de jeux web.");
});
