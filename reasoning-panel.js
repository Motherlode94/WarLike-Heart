(()=>{const $=id=>document.getElementById(id),view=document.querySelector('[data-view="reasoning"]');let epoch=0;
function clear(){epoch++;$('reasonForm').reset();$('reasonOutput').replaceChildren();$('reasonStatus').textContent='';}
function add(parent,title,body){const h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=body;parent.append(h,p);}
$('reasonForm').onsubmit=async e=>{e.preventDefault();if(view.hidden||document.hidden)return;const ticket=++epoch,out=$('reasonOutput');out.replaceChildren();$('reasonStatus').textContent='Analyse…';try{
 const body={question:$('reasonQuestion').value};const raw=$('reasonOptions').value.trim();if(raw){const options=raw.split('\n').filter(s=>s.trim()).map(line=>{const [label,impact,cost,...extra]=line.split('|');if(extra.length||!impact?.trim()||!cost?.trim())throw Error('Format : option | impact | maîtrise du coût');return {label:label.trim(),scores:[Number(impact),Number(cost)]};});body.options=options;body.criteria=[{label:'Impact',weight:Number($('reasonImpact').value)},{label:'Maîtrise du coût',weight:Number($('reasonCost').value)}];}
 const r=await fetch('/api/reasoning',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(ticket!==epoch||view.hidden)return;if(!r.ok)throw Error(d.error||'Erreur');
 add(out,'Éléments retrouvés',d.needsEvidence?'Aucune preuve lexicale correspondante. Enrichis les mémoires ou reformule.':'Éléments déclaratifs, à vérifier.');
 for(const x of d.evidence)add(out,x.title,x.type+' · '+(x.content||'')+' · '+(x.source||'Source non indiquée'));
 for(const x of d.links)add(out,'Relation : '+x.relation,x.from_id+' → '+x.to_id+' · '+x.confidence+' % déclarés');
 for(const x of d.ranking)add(out,x.label,x.score.toFixed(2)+' / 10');
 add(out,'Limites',d.limitations.join(' · '));$('reasonStatus').textContent='Analyse terminée. Aucune action exécutée.';
 }catch(err){if(ticket===epoch)$('reasonStatus').textContent=err.message;}};
 for(const event of ['warlike-heart-view-changed','warlike-heart-account-updated','visibilitychange'])document.addEventListener(event,clear);clear();})();