const key=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
// Human-approved examples condition later inference; model weights are unchanged.
export function approveTeaching({learning,question,answer,consent=false}={}){
 if(consent!==true)throw Error('Active la mémoire locale avant de valider un exemple.');
 if(typeof question!=='string'||question.trim().length<3||question.trim().length>240)throw Error('La question doit contenir de 3 à 240 caractères.');
 if(typeof answer!=='string'||answer.trim().length<3||answer.trim().length>700)throw Error('La réponse doit contenir de 3 à 700 caractères.');
 const dialogues=Array.isArray(learning?.dialogues)?learning.dialogues:[];
 const match=dialogues.findIndex(x=>typeof x?.question==='string'&&key(x.question)===key(question));
 if(match<0&&dialogues.length>=500)throw Error('Limite de 500 exemples atteinte.');
 const next=dialogues.map(x=>({...x})),entry={question:question.trim(),answer:answer.trim()};
 if(match<0)next.push(entry);else next[match]=entry;
 return {version:1,dialogues:next,knowledge:(learning?.knowledge||[]).map(x=>({...x}))};
}
