import {reviewResponse} from './response-review.mjs';
export function reviewPayload(d){const local=reviewResponse(d.question,d.answer,d.evidence);return {local,input:{question:d.question,answer:d.answer,evidence:d.evidence.slice(0,12).map(r=>({title:String(r.title??'').slice(0,160),content:String(r.content??'').slice(0,300)}))}};}
