const words=s=>new Set(String(s??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[]);
export function selectEvidence(question,records,max=12){
 const q=words(question);return records.map(r=>({...r,relevance:[...words(r.title+' '+(r.content||''))].filter(w=>q.has(w)).length})).filter(r=>r.relevance>0).sort((a,b)=>b.relevance-a.relevance||a.id.localeCompare(b.id)).slice(0,max);
}
export function compareOptions(options,criteria){
 if(!Array.isArray(options)||options.length<2||options.length>8||!Array.isArray(criteria)||!criteria.length||criteria.length>8)throw Error('Options ou critères invalides');
 const validLabel=s=>typeof s==='string'&&s.trim()&&s.length<=120;
 if(criteria.some(c=>!validLabel(c?.label)||!Number.isFinite(c.weight)||c.weight<=0||c.weight>100)||options.some(o=>!validLabel(o?.label)||!Array.isArray(o.scores)||o.scores.length!==criteria.length||o.scores.some(s=>!Number.isFinite(s)||s<0||s>10)))throw Error('Notation invalide');
 const total=criteria.reduce((a,c)=>a+c.weight,0);
 return options.map(o=>({label:o.label,score:o.scores.reduce((a,s,i)=>a+s*criteria[i].weight,0)/total})).sort((a,b)=>b.score-a.score);
}

export function contextualEvidence(question,records,max=12){const q=words(question);if(!q.size)return [];return records.map(r=>{const title=words(r.title),body=words(r.content),matched=[...q].filter(w=>title.has(w)||body.has(w));return {...r,relevance:matched.reduce((s,w)=>s+(title.has(w)?3:0)+(body.has(w)?1:0),0),coverage:matched.length/q.size,matchedTerms:matched};}).filter(r=>r.coverage>0).sort((a,b)=>b.coverage-a.coverage||b.relevance-a.relevance||String(a.id).localeCompare(String(b.id))).slice(0,max);}

export function explainDecision(options,criteria){const ranking=compareOptions(options,criteria);const total=criteria.reduce((n,c)=>n+c.weight,0);const contributions=options.map(o=>({label:o.label,criteria:criteria.map((c,i)=>({label:c.label,weight:c.weight/total,score:o.scores[i],contribution:o.scores[i]*c.weight/total}))}));const gap=ranking[0].score-ranking[1].score;return {ranking,contributions,margin:gap,tied:gap<1e-9,method:'weighted-user-scores',limitations:'Scores and weights are user supplied; not probabilities or independent evidence.'};}
