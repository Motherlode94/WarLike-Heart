import {compareLocalModels} from './lib/model-comparison.mjs';
export function mountModelComparison(root,{model,onBusy=()=>{}}){
 root.innerHTML='<summary>Comparer les modèles et leurs réponses</summary><p>Compare Qwen 1,5B et 3B sur les mêmes cinq cas. Leurs poids peuvent être téléchargés. Le chat personnel est exclu de cet essai. Les réponses doivent être évaluées par toi.</p><div class="controls"><button type="button" data-compare>Comparer les deux modèles</button><button type="button" data-cancel disabled>Arrêter</button><button type="button" data-export disabled>Exporter le compte rendu JSON</button></div><p data-status role="status"></p><div data-results></div>';
 const $=q=>root.querySelector(q),button=$('[data-compare]'),cancel=$('[data-cancel]'),out=$('[data-results]');let controller,report;
 button.onclick=async()=>{
  if(controller)return;controller=new AbortController();report=null;out.replaceChildren();button.disabled=true;cancel.disabled=false;$('[data-export]').disabled=true;onBusy(true);
  try{report=await compareLocalModels({model,signal:controller.signal,onResult:row=>{
   const card=document.createElement('section'),title=document.createElement('strong'),reply=document.createElement('p'),criterion=document.createElement('small'),review=document.createElement('select');
   title.textContent=row.model+' · '+(row.name||row.caseId)+(Number.isFinite(row.latencyMs)?' · '+row.latencyMs+' ms':'');reply.textContent=row.error||row.reply;criterion.textContent=row.criterion||'Chargement indisponible.';
   for(const [value,label] of [['not-reviewed','À évaluer'],['satisfactory','Satisfaisant'],['needs-correction','À corriger']])review.add(new Option(label,value));
   review.setAttribute('aria-label','Évaluer '+row.model+' '+row.caseId);review.disabled=!!row.error;review.onchange=()=>{row.review=review.value;};
   card.append(title,reply,criterion,review);out.append(card);$('[data-status]').textContent='Comparaison en cours…';
  }});$('[data-status]').textContent='Comparaison terminée. Évalue les réponses ; aucun modèle n’est déclaré meilleur automatiquement. Recharge le modèle choisi pour discuter.';$('[data-export]').disabled=false;
  }catch(error){$('[data-status]').textContent=controller.signal.aborted?'Comparaison arrêtée.':error.message;}
  finally{controller=null;button.disabled=false;cancel.disabled=true;onBusy(false);}
 };
 cancel.onclick=()=>controller?.abort();
 $('[data-export]').onclick=()=>{if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='heart-model-comparison.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return {stop:()=>controller?.abort(),busy:()=>!!controller};
}
