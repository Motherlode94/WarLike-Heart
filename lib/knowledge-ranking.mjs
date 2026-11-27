// Local lexical ranking with partial coverage, accent normalization and stable ties.
const words=s=>String(s??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
const stop=new Set(['le','la','les','de','des','du','un','une','et','en','dans','sur','pour','avec','je','tu','mes','mon','ma','the','a','an','of','and','for','in','to']);
export function rankKnowledge(records,query){
 const raw=[...new Set(words(query))],terms=raw.filter(w=>!stop.has(w));const q=(terms.length?terms:raw).slice(0,20);if(!q.length)return [];
 return records.map((record,index)=>{const title=new Set(words(record.title)),body=new Set(words(record.content)),source=new Set(words(record.source));let score=0,matched=0;for(const w of q){const n=(title.has(w)?5:0)+(body.has(w)?2:0)+(source.has(w)?1:0);if(n)matched++;score+=n;}return {record,index,matched,score};}).filter(x=>x.matched>0).sort((a,b)=>b.matched-a.matched||b.score-a.score||a.index-b.index).map(({record,matched,score})=>({record,matched,score}));
}
