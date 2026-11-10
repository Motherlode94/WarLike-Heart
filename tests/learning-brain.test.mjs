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

test("questions with polite filler resolve a precisely taught topic",()=>{
 const data={dialogues:[{question:"Comment fonctionne la sauvegarde WarLike Engine ?",answer:"La sauvegarde conserve le projet."}],
 knowledge:[{subject:"WarLike Engine",content:"Un moteur Web de jeux."}]};
 assert.equal(brain.retrieval("Parle-moi de WarLike Engine, s'il te plaît",data)?.text,"Un moteur Web de jeux.");
 assert.equal(brain.retrieval("Explique la sauvegarde WarLike Engine",data)?.text,"La sauvegarde conserve le projet.");
});
test("prevents unrelated false matches and duplicate knowledge entries",()=>{
 const data={knowledge:[{subject:"WarLike Engine",content:"Moteur Web."},{subject:"warlike engine",content:"Doublon."}]};
 assert.equal(brain.validated(data).knowledge.length,1);
 assert.equal(brain.retrieval("Un moteur sans rapport avec mes projets",data),null);
});
test("knowledge preview never modifies conversation context",()=>{
 const data={knowledge:[{subject:"WarLike Engine",content:"Un moteur de jeu Web."}]};
 const engine=brain.create({enabled:()=>true,read:()=>data});
 assert.equal(engine.preview("WarLike Engine").source,"knowledge");
 assert.equal(engine.answer("Et alors ?"),null);
 assert.equal(engine.answer("WarLike Engine").source,"knowledge");
 assert.equal(engine.answer("Et alors ?").source,"knowledge");
});
