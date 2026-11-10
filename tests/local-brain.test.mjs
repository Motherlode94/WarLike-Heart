import test from "node:test";
import assert from "node:assert/strict";
import brain from "../local-brain.js";

test("responds to known intents without network",()=>{
  const b=brain.createEngine();
  assert.equal(b.reply("Salut !").intent,"greeting");
  assert.equal(b.reply("Parlons de WarLike Engine").intent,"projects");
  assert.equal(b.reply("Question sans réponse connue sur les galaxies lointaines").intent,"unknown");
});
test("does not persist facts without consent",()=>{
  let saved=[];
  const b=brain.createEngine({readMemory:()=>saved,writeMemory:x=>(saved=x,true),canRemember:()=>false});
  assert.match(b.reply("Souviens-toi que je préfère le piano").text,/active d'abord/);
  assert.equal(saved.length,0);
});
test("explicit memories can be recalled and deleted",()=>{
  let saved=[],enabled=true;
  const b=brain.createEngine({readMemory:()=>saved,writeMemory:x=>(saved=x,true),canRemember:()=>enabled});
  assert.match(b.reply("Souviens-toi que mon instrument est la guitare").text,/noté/);
  assert.match(b.reply("Que sais-tu de moi ?").text,/guitare/);
  assert.equal(saved.length,1);
  b.reply("Souviens-toi que mon instrument est la guitare");
  assert.equal(saved.length,1);
  assert.match(b.reply("Oublie que mon instrument est la guitare").text,/supprimé/);
  assert.equal(saved.length,0);
  b.reply("Souviens-toi que je crée des jeux");
  b.reply("Efface tes souvenirs");
  assert.equal(saved.length,0);
  enabled=false;
  assert.equal(b.reply("Souviens-toi que je préfère le piano").intent,"memory");
});
test("normalizes accents and rejects oversized facts",()=>{
  assert.equal(brain.normalize("MÉMOIRE,   ÉTÉ !"),"memoire ete");
  let saved=[];const b=brain.createEngine({readMemory:()=>saved,writeMemory:x=>(saved=x,true),canRemember:()=>true});
  b.reply("Souviens-toi que "+ "a".repeat(310));
  assert.equal(saved.length,0);
});
