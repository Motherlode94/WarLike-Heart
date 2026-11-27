export const SEMANTIC_MODEL='Xenova/paraphrase-multilingual-MiniLM-L12-v2';
export const SEMANTIC_REVISION='2c4055b12046f11709e9df2c122e59ffbdc2f900';
export function cosine(a,b){
 if(!Array.isArray(a)||!Array.isArray(b)||!a.length||a.length!==b.length||a.some(x=>!Number.isFinite(x))||b.some(x=>!Number.isFinite(x)))throw Error('Vecteurs invalides.');
 let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]**2;bb+=b[i]**2;}return aa&&bb?dot/Math.sqrt(aa*bb):0;
}
export function semanticCorpus({learning={},memories=[],archive=[]}={}){
 const rows=[...memories.map(text=>({source:'explicit-memory',title:'Souvenir approuvé',text})),
 ...(learning.knowledge||[]).map(x=>({source:'knowledge',title:x.subject,text:x.content})),
 ...(learning.dialogues||[]).map(x=>({source:'approved-example',title:x.question,text:x.answer})),
 ...archive.map((x,i)=>({source:'conversation-excerpt',title:'Échange '+(i+1)+' · '+x.role+(x.partial?' · partiel':''),text:x.text}))];
 return rows.filter(x=>typeof x.text==='string'&&typeof x.title==='string').slice(0,1200).map(x=>({source:x.source,title:x.title.slice(0,160),text:x.text.slice(0,512)}));
}
export function createSemanticIndex(embed){
 const cache=new Map();
 return {clear:()=>cache.clear(),async search(query,records,{limit=3,threshold=.35,progress=()=>{}}={}){
  const rows=records.filter(x=>typeof x?.text==='string').slice(0,1200),texts=rows.map(x=>((x.title||'')+' : '+x.text).slice(0,600)),live=new Set(texts);
  for(const key of cache.keys())if(!live.has(key))cache.delete(key);
  for(let start=0;start<texts.length;start+=8){const missing=[...new Set(texts.slice(start,start+8).filter(x=>!cache.has(x)))];if(missing.length){const vectors=await embed(missing);if(vectors.length!==missing.length)throw Error('Index incomplet.');missing.forEach((x,i)=>cache.set(x,vectors[i]));}progress({done:Math.min(start+8,texts.length),total:texts.length});}
  if(!rows.length)return [];
  const [vector]=await embed([String(query).slice(0,500)]);
  return rows.map((row,index)=>({...row,score:cosine(vector,cache.get(texts[index])),index})).filter(x=>x.score>=threshold).sort((a,b)=>b.score-a.score||b.index-a.index).slice(0,limit).map(({index,...row})=>row);
 }};
}
