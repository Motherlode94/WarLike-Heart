// Lexical retrieval selects evidence for generation; it never fabricates an answer.
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ');
const stop=new Set('le la les un une des du de et ou en a au aux je tu il elle nous vous ils elles ce ces cette mon ma mes ton ta tes son sa ses pour par sur dans avec est sont que qui quoi comment pourquoi peux peut moi toi explique reformule autrement cela ca encore plus details merci stp'.split(' '));
const words=value=>new Set(normalize(value).split(/\s+/).filter(x=>x.length>2&&!stop.has(x)).map(x=>x.length>4?x.replace(/s$/,''):x));
const followup=value=>/\b(cela|ca|autrement|reformule|continue|encore|detail|developpe|lui|elle)\b/.test(normalize(value));
export function retrieveLocalEvidence({query='',history=[],learning={}}={}){
 let terms=words(query);
 if(followup(query)){
  const prior=history.filter(x=>x?.role==='user'&&typeof x.text==='string'&&x.text!==query).slice(-2);
  for(const item of prior)for(const term of words(item.text))terms.add(term);
 }
 if(!terms.size)return [];
 const rows=[];
 for(const entry of (Array.isArray(learning.knowledge)?learning.knowledge:[]).slice(0,500)){
  if(typeof entry?.subject==='string'&&typeof entry.content==='string')rows.push({source:'knowledge',title:entry.subject.slice(0,100),text:entry.content.slice(0,700)});
 }
 for(const entry of (Array.isArray(learning.dialogues)?learning.dialogues:[]).slice(0,500)){
  if(typeof entry?.question==='string'&&typeof entry.answer==='string')rows.push({source:'approved-example',title:entry.question.slice(0,240),text:entry.answer.slice(0,700)});
 }
 return rows.map((row,index)=>{
  const title=words(row.title),content=words(row.text);
  let matches=0,weight=0;
  for(const term of terms){if(title.has(term)){matches++;weight+=3;}else if(content.has(term)){matches++;weight++;}}
  return {...row,index,weight,matches};
 }).filter(x=>x.matches>=Math.min(2,terms.size)).sort((a,b)=>b.weight-a.weight||a.index-b.index).slice(0,3)
 .map(({source,title,text})=>({source,title,text}));
}
