/* WarLike Heart Learning Brain v1 — approved teaching data only.
 * Pure JavaScript: no network, model weights, background training or hidden collection.
 */
(function(root){
"use strict";
const clean=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const tokens=v=>clean(v).split(" ").filter(w=>w.length>=3&&!["avec","pour","dans","elle","nous","vous","comment","quelle","quels","sont","avoir","plus","mais","donc","cela","cette","suis","sera"].includes(w));
const validText=(v,max=500)=>typeof v==="string"&&v.trim().length>=3&&v.trim().length<=max;
function validated(data){
 const input=data&&typeof data==="object"?data:{};
 const unique=new Set();
 const dialogues=(Array.isArray(input.dialogues)?input.dialogues:[]).filter(x=>{
   if(!x||!validText(x.question,240)||!validText(x.answer,700))return false;
   const key=clean(x.question);if(unique.has(key))return false;unique.add(key);return true;
 }).slice(0,500).map(x=>({question:x.question.trim(),answer:x.answer.trim()}));
 const knowledge=(Array.isArray(input.knowledge)?input.knowledge:[]).filter(x=>x&&validText(x.subject,100)&&validText(x.content,700)).slice(0,500).map(x=>({subject:x.subject.trim(),content:x.content.trim()}));
 return {version:1,dialogues,knowledge};
}
function score(query,entry) {
 const q=clean(query),e=clean(entry);
 if(!q||!e)return 0;
 if(q===e)return 1;
 const a=new Set(tokens(q)),b=new Set(tokens(e));
 if(!a.size||!b.size)return 0;
 const common=[...a].filter(w=>b.has(w)).length;
 return common/Math.max(a.size,b.size);
}
function create({read=()=>({}),enabled=()=>false}={}){
 let topic="";
 function answer(message){
   const input=clean(message);
   if(!enabled()||!input)return null;
   const db=validated(read());
   const dialogue=db.dialogues.map(x=>({...x,weight:score(input,x.question)})).sort((a,b)=>b.weight-a.weight)[0];
   if(dialogue?.weight>=0.75){topic="";return {text:dialogue.answer,source:"dialogue",confidence:dialogue.weight};}
   const query=/^(et (pour |sur |a propos de )?(cela|ca|lui|elle)|et alors|explique encore|tu peux preciser)/.test(input)&&topic?topic:input;
   const knowledge=db.knowledge.map(x=>({...x,weight:score(query,x.subject)})).sort((a,b)=>b.weight-a.weight)[0];
   if(knowledge?.weight>=0.75){
     topic=knowledge.subject;
     return {text:knowledge.content,source:"knowledge",confidence:knowledge.weight};
   }
   return null;
 }
 return {answer,stats:()=>{const v=validated(read());return {dialogues:v.dialogues.length,knowledge:v.knowledge.length};}};
}
const api={create,validated,score,clean};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.WarLikeLearningBrain=api;
})(typeof window!=="undefined"?window:null);
