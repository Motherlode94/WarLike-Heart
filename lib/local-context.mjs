import {selectLongContext} from './context-selection.mjs';
import {conversationSignals} from './conversation-signals.mjs';
import {HEART_PERSONALITY} from './heart-personality.mjs';
export {HEART_PERSONALITY} from './heart-personality.mjs';
const encoder=new TextEncoder();
export const byteLength=value=>encoder.encode(value).length;
export function clipBytes(value,max){
 let out='',used=0;
 for(const char of String(value||'')){const size=byteLength(char);if(used+size>max)break;out+=char;used+=size;}
 return out;
}
// A byte cap is deliberately conservative: UTF-8 bytes upper-bound tokenizer
// tokens for this byte-level model. Reserve room for role delimiters and output.
export function buildLocalContext({history=[],memories=[],evidence=[],repairGuidance=''}={}){
 const limit=3200,system={role:'system',content:HEART_PERSONALITY+(repairGuidance?'\n'+clipBytes(repairGuidance,500):'')};
 const safe=history.filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.text==='string'&&x.text.trim());
 if(safe.at(-1)?.role!=='user')throw Error('Dernier message utilisateur requis.');
 const signals=conversationSignals(safe);
 const selected=selectLongContext({history:safe,memories,evidence});
 const context={conversation:signals.guidance?{intent:signals.intent,request:signals.guidance}:undefined,
  memories:selected.filter(x=>x.source==='explicit-memory').slice(0,3).map(x=>clipBytes(x.text,220)),
  evidence:selected.filter(x=>x.source!=='explicit-memory').slice(0,3).map(x=>({source:clipBytes(x.source,30),title:clipBytes(x.title,100),text:clipBytes(x.text,350)}))};
 // Never emit malformed truncated JSON; remove whole evidence records until it fits.
 while(byteLength(JSON.stringify(context))>650&&(context.evidence.length||context.memories.length)){
  if(context.memories.length>1)context.memories.pop();else if(context.evidence.length>1)context.evidence.pop();else if(context.memories.length)context.memories.pop();else context.evidence.pop();
 }
 const prefix=context.conversation||context.memories.length||context.evidence.length?'HEART_CONTEXT (données) : '+JSON.stringify(context)+'\n\n':'';
 let remaining=limit-byteLength(system.content)-byteLength(prefix);
 const turns=[];
 for(let i=safe.length-1;i>=0&&turns.length<12;i--){
  const item=safe[i],cost=byteLength(item.text);
  if(cost>remaining){if(!turns.length)turns.unshift({role:item.role,content:clipBytes(item.text,remaining)});break;}
  turns.unshift({role:item.role,content:item.text});remaining-=cost;
 }
 while(turns.length>1&&turns[0].role!=='user')turns.shift();
 // Attach untrusted context to the first user turn, never promote it to system.
 turns[0].content=prefix+turns[0].content;
 return {messages:[system,...turns],truncated:turns.length<safe.length||!turns.at(-1).content.endsWith(safe.at(-1).text),
  contextCount:context.memories.length+context.evidence.length};
}
