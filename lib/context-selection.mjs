import {contextQuery} from './conversation-signals.mjs';
const stop=new Set('les des une mon mes ton tes son ses dans pour avec sur que qui quoi comment pourquoi peux moi toi est sont cela plus encore explique reformule quelle quel'.split(' '));
export const contextTerms=value=>[...new Set((String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9]+/g)||[]).filter(x=>x.length>2&&!stop.has(x)).map(x=>x.replace(/s$/,'')))];
export function selectContextRecords(records,query,{limit=6}={}){
 const q=contextTerms(query);if(!q.length)return [];
 const valid=records.filter(x=>x&&typeof x.text==='string'&&x.text.trim());
 const counts=new Map();for(const r of valid)for(const w of contextTerms((r.title||'')+' '+r.text))counts.set(w,(counts.get(w)||0)+1);
 return valid.map((record,index)=>{
  const title=new Set(contextTerms(record.title)),body=new Set(contextTerms(record.text));
  const score=q.reduce((sum,w)=>sum+((title.has(w)?3:0)+(body.has(w)?1:0))*Math.log(2+valid.length/(counts.get(w)||1)),0);
  return {record,index,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.index-a.index).slice(0,limit).map(x=>x.record);
}
export function selectLongContext({history=[],memories=[],evidence=[]}={}){
 const query=contextQuery(history);
 const records=memories.filter(x=>typeof x==='string').map((text,index)=>({source:'explicit-memory',title:'Souvenir '+(index+1),text}));
 // User-approved evidence arrives already ranked; preserve it even on a short follow-up.
 const ranked=selectContextRecords([...records,...evidence],query);
 const result=[...ranked];for(const item of evidence)if(!result.some(x=>x.source===item.source&&x.text===item.text))result.push(item);
 return result.slice(0,6);
}
export async function fetchCognitiveContext(query,{enabled=false,fetcher=globalThis.fetch,signal}={}){
 if(!enabled)return [];
 const response=await fetcher('/api/cognitive-memory?search=ranked&q='+encodeURIComponent(query.slice(0,160)),{credentials:'same-origin',cache:'no-store',signal});
 if(!response.ok)throw Error('Mémoire Cloud indisponible ('+response.status+'). Désactive son utilisation pour continuer sans elle.');
 const data=await response.json();
 return (Array.isArray(data.memories)?data.memories:[]).filter(x=>typeof x?.content==='string'&&typeof x.title==='string').slice(0,6).map(x=>({source:'cognitive-memory',title:x.title.slice(0,160),text:x.content.slice(0,2500)}));
}
