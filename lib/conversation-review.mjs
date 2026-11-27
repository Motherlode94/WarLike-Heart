import {calculate,equalRational} from './native-calculator.mjs';
const normalized=x=>String(x||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const guidance={arithmetic:'Recalcule les égalités numériques ; donne un résultat exact ou indique explicitement un arrondi.',repetition:'La demande est une reformulation : apporte une formulation différente et utile.',tutoiement:'Tutoie ton interlocuteur.',word_count:'Respecte le nombre de mots demandé.',unsupported_action:'Ne prétends pas avoir exécuté une action externe. Aucun outil d’écriture externe n’a été exécuté dans ce chat.'};
export function reviewConversationReply({question='',answer='',previousAnswer=''}={}){
 const findings=[];
 if(/\b(reformule|autrement|developpe|développe)\b/i.test(question)&&normalized(answer)===normalized(previousAnswer))findings.push('repetition');
 if(/\b(vous|votre|vos)\b/i.test(answer)&&! /\b(vous|vouvoiement|vouvoyer|citation|cite|traduire|traduis)\b/i.test(question))findings.push('tutoiement');
 const count=question.match(/\ben\s+(\d{1,2})\s+mots\b/i);if(count&&answer.trim().split(/\s+/u).length!==Number(count[1]))findings.push('word_count');
 if(/\b(?:j[’']ai|je viens de)\s+(?:envoyé|publie|publié|modifié|supprimé|créé|fusionné|déployé|acheté|réservé)(?![\p{L}])/iu.test(answer))findings.push('unsupported_action');
 // Only standalone numeric equalities are checked; prose and symbolic algebra
 // are outside this check. Rounded/approximate equalities are explicitly exempt.
 for(const match of answer.matchAll(/(?:^|\n)\s*([\d\s.,()+*/^%×÷−-]{1,150})\s*=\s*([+-]?\d+(?:[.,]\d+)?)[.!]?\s*(?=$|\n)/g)){
  try{if(!equalRational(calculate(match[1]),calculate(match[2])))findings.push('arithmetic');}catch{/* expression outside bounded calculator scope */}
 }
 return {status:findings.length?'needs-review':'partial-checks-passed',findings:[...new Set(findings)],verifiedTruth:false,scope:'format-repetition-numeric-equalities-action-claims'};
}
export async function answerWithReview({generate,history=[]}){
 const question=history.at(-1)?.text||'',previousAnswer=history.slice(0,-1).findLast(x=>x.role==='assistant')?.text||'';
 const first=await generate('');if(first.error)return first;
 const initial=reviewConversationReply({question,answer:first.reply,previousAnswer});
 if(!initial.findings.length)return {...first,verification:{...initial,repairAttempted:false}};
 try{
  const repaired=await generate('Contrôle de la réponse : '+initial.findings.map(x=>guidance[x]).join(' '));
  if(repaired.error)throw Error('repair unavailable');
  return {...repaired,verification:{...reviewConversationReply({question,answer:repaired.reply,previousAnswer}),repairAttempted:true,initialFindings:initial.findings}};
 }catch{return {...first,verification:{...initial,repairAttempted:true,repairUnavailable:true}};}
}
