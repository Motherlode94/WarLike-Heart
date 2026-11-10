/* WarLike Heart Learning Brain v2 — deterministic retrieval from user-approved entries.
 * Compatible with version 1 localStorage and Cloud D1 snapshots.
 * No remote call, generated training, arbitrary code execution or hidden learning.
 */
(function(root){
"use strict";
const stopwords=new Set(("a au aux avec ce ces cet cette de des du dans en et est etre il ils je j le la les leur lui ma mes moi mon ne nos notre nous on ou par pas plus pour que quel quelle quelles quels qui quoi sa se ses son sont sur ta te tes toi ton tu un une vos votre vous y comment explique dis donne parle sais voudrais veux peux pourrait propos concernant").split(" "));
const clean=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
 .replace(/['’\u2010-\u2015_-]/g," ").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const tokens=value=>clean(value).split(" ").filter(w=>w.length>=2&&!stopwords.has(w));
const validText=(v,max=500)=>typeof v==="string"&&v.trim().length>=3&&v.trim().length<=max;
function validated(data){
 const input=data&&typeof data==="object"?data:{},uniqueDialogue=new Set(),uniqueFact=new Set();
 const dialogues=(Array.isArray(input.dialogues)?input.dialogues:[]).filter(x=>{
  if(!x||!validText(x.question,240)||!validText(x.answer,700))return false;
  const key=clean(x.question);if(uniqueDialogue.has(key))return false;uniqueDialogue.add(key);return true;
 }).slice(0,500).map(x=>({question:x.question.trim(),answer:x.answer.trim()}));
 const knowledge=(Array.isArray(input.knowledge)?input.knowledge:[]).filter(x=>{
  if(!x||!validText(x.subject,100)||!validText(x.content,700))return false;
  const key=clean(x.subject);if(uniqueFact.has(key))return false;uniqueFact.add(key);return true;
 }).slice(0,500).map(x=>({subject:x.subject.trim(),content:x.content.trim()}));
 return {version:1,dialogues,knowledge};
}
function score(query,entry){
 const q=clean(query),e=clean(entry);
 if(!q||!e)return 0;
 if(q===e)return 1;
 const qTokens=[...new Set(tokens(q))],eTokens=[...new Set(tokens(e))];
 if(!qTokens.length||!eTokens.length)return 0;
 const overlap=eTokens.filter(w=>qTokens.includes(w)).length;
 if(!overlap)return 0;
 const coverage=overlap/eTokens.length,precision=overlap/qTokens.length;
 // Candidate relevance outweighs greetings/filler in the user's query.
 const value=coverage*.75+precision*.25;
 // A one-word overlap should not match a multiword subject.
 if(eTokens.length>=2&&coverage<.65)return Math.min(value,.72);
 // One-word subjects must be explicitly included as a whole word.
 if(eTokens.length===1 && qTokens.length>4)return Math.min(value,.73);
 return Math.min(.99,value);
}
function retrieval(query,data){
 const db=validated(data);
 let best=null;
 function consider(kind,entry,value,text,priority){
  const weight=score(query,value);
  const min=kind==="dialogue"?.81:.79;
  if(weight<min)return;
  // Dialogues with multiple informative words need at least two.
  if(kind==="dialogue"&&tokens(value).length>1){
   const q=new Set(tokens(query)),matched=new Set(tokens(value).filter(x=>q.has(x)));
   if(matched.size<2)return;
  }
  const candidate={text,source:kind,confidence:weight,matched:value};
  if(!best||weight>best.confidence+.001||(Math.abs(weight-best.confidence)<.001&&priority>best.priority))
   best={...candidate,priority};
 }
 db.dialogues.forEach(x=>consider("dialogue",x,x.question,x.answer,2));
 db.knowledge.forEach(x=>consider("knowledge",x,x.subject,x.content,1));
 if(!best)return null;
 const {priority,...result}=best;return result;
}
const followUp=/^(?:et (?:sur |pour |a propos de )?(?:ca|cela|lui|elle|ce sujet)|et alors|explique encore|tu peux preciser|peux tu preciser|plus de details|developpe|rappelle moi ce sujet)$/;
function create({read=()=>({}),enabled=()=>false}={}){
 let lastTopic=null;
 function answer(message){
  const input=clean(message);
  if(!enabled()||!input)return null;
  let result=retrieval(message,read());
  if(!result && lastTopic && followUp.test(input))
   result=retrieval(lastTopic,read());
  if(result?.source==="knowledge")lastTopic=result.matched;
  else if(result?.source==="dialogue")lastTopic=null;
  else if(!followUp.test(input))lastTopic=null;
  return result;
 }
 return {answer,preview:input=>enabled()?retrieval(input,read()):null,
  stats:()=>{const v=validated(read());return {dialogues:v.dialogues.length,knowledge:v.knowledge.length};},
  resetContext:()=>{lastTopic=null;}};
}
const api={create,validated,score,clean,tokens,retrieval};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.WarLikeLearningBrain=api;
})(typeof window!=="undefined"?window:null);
