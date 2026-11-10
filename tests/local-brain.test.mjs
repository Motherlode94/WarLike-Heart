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

test("French ligatures and natural reciprocal small talk",()=>{
  const b=brain.createEngine();
  assert.equal(brain.normalize("Mon cœur et ma sœur"),"mon coeur et ma soeur");
  assert.equal(b.reply("hey").intent,"greeting");
  for(const text of ["bien mon cœur et toi ?", "Bien mon coeur et toi ?", "Ça va bien et toi ?", "très bien merci", "je vais bien mon cœur et toi ?"]){
    const result=b.reply(text);
    assert.equal(result.intent,"social-positive",text);
    assert.doesNotMatch(result.text,/ne connais pas encore une reponse fiable/i);
  }
  assert.equal(b.reply("Et toi ?").intent,"social-reciprocal");
  assert.equal(b.reply("Bof").intent,"social-support");
});
test("small talk never swallows precise technical or memory requests",()=>{
  const b=brain.createEngine();
  assert.equal(b.reply("Comment fonctionne WarLike Engine ?").intent,"projects");
  assert.equal(b.reply("Souviens-toi que je vais bien").intent,"memory");
  assert.equal(b.reply("Comment installer un moteur de recherche vectoriel ?").intent,"unknown");
});
