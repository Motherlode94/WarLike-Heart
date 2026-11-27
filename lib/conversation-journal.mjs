import {selectContextRecords} from './context-selection.mjs';
const bytes=x=>new TextEncoder().encode(JSON.stringify(x)).length;
export function normalizeArchive(value){
 if(!Array.isArray(value))return [];
 const result=value.filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.text==='string'&&x.text.length<=400).slice(-160).map(x=>({role:x.role,text:x.text,partial:x.partial===true}));
 while(bytes(result)>80000)result.shift();return result;
}
export function archiveTurns(archive,turns){
 const excerpts=turns.filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.text==='string').map(x=>({role:x.role,text:x.text.length>400?x.text.slice(0,270)+' […] '+x.text.slice(-120):x.text,partial:x.text.length>400}));
 return normalizeArchive([...normalizeArchive(archive),...excerpts]);
}
export function journalEvidence(archive,query,limit=3){
 return selectContextRecords(normalizeArchive(archive).map((x,index)=>({source:'conversation-excerpt',title:'Ancien échange '+(index+1)+' · '+(x.role==='user'?'toi':'Heart')+(x.partial?' · extrait partiel':''),text:x.text})),query,{limit});
}
export function recallReply(text,{archive=[],history=[]}={}){
 const summary=/^\/(?:resume|résumé)\s*$/i.test(text),recall=text.match(/^\/rappel\s+(.+)$/i);
 if(!summary&&!recall)return null;
 const all=[...normalizeArchive(archive),...history.filter(x=>x?.role==='user'&&typeof x.text==='string'&&!/^\/(?:rappel|résumé|resume)\b/i.test(x.text)).map(x=>({role:x.role,text:x.text.slice(0,400),partial:x.text.length>400}))];
 const rows=summary?all.filter(x=>x.role==='user').slice(-6).map(x=>({title:'Toi'+(x.partial?' · extrait partiel':''),text:x.text})):journalEvidence(all,recall[1]);
 return {kind:'conversation-recall',reply:rows.length?(summary?'Synthèse extractive des derniers sujets abordés :\n':'Extraits retrouvés dans la conversation (déclarations non vérifiées) :\n')+rows.map(x=>x.title+' : « '+x.text+' »').join('\n'):'Aucun extrait pertinent conservé. L’archive est limitée ; précise le sujet ou réintroduis l’information.',verification:{status:'source-excerpts',scope:'retained-conversation'}};
}
