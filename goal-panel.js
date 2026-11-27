(()=>{
 const $=id=>document.getElementById(id),list=$('goalList'),form=$('goalForm'),status=$('goalStatus');
 let epoch=0,active=false,busy=false;
 const labels={planned:'Planifié',active:'En cours',paused:'En pause',done:'Terminé'};
 async function api(body){const response=await fetch('/api/goals',{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok)throw Error(data.error||'Service indisponible');return data;}
 function clear(){epoch++;list.replaceChildren();form.reset();busy=false;status.textContent='';}
 function render(goals){
  list.replaceChildren();
  for(const g of goals){
   const box=document.createElement('section');box.className='panel';box.style.padding='16px';
   const title=document.createElement('h3');title.textContent=g.title;box.append(title);
   const label=document.createElement('label');label.textContent='État ';const select=document.createElement('select');
   for(const [value,name] of Object.entries(labels)){const o=document.createElement('option');o.value=value;o.textContent=name;select.append(o);}select.value=g.status;label.append(select);box.append(label);
   const steps=g.steps.map(s=>{const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=s.done;label.append(input,document.createTextNode(' '+s.text));label.style.display='block';box.append(label);return {input,text:s.text};});
   const save=document.createElement('button');save.textContent='Enregistrer';save.type='button';save.onclick=()=>mutate({action:'update',id:g.id,revision:g.revision,title:g.title,status:select.value,steps:steps.map(s=>({text:s.text,done:s.input.checked}))});
   const del=document.createElement('button');del.textContent='Supprimer';del.type='button';del.onclick=()=>{if(confirm('Supprimer cet objectif ?'))mutate({action:'delete',id:g.id,revision:g.revision});};box.append(save,del);list.append(box);
  }
  if(!goals.length)list.textContent='Aucun objectif.';
 }
 async function load(){const e=++epoch;try{const data=await api();if(e===epoch&&active){render(data.goals);status.textContent='Objectifs synchronisés.';}}catch(err){if(e===epoch&&active){list.replaceChildren();status.textContent=err.message;}}}
 async function mutate(body){if(busy||!active)return;busy=true;const e=epoch;try{await api(body);if(e===epoch&&active){if(body.action==='create')form.reset();await load();}}catch(err){if(e===epoch&&active)status.textContent=err.message;}finally{busy=false;}}
 form.onsubmit=e=>{e.preventDefault();const steps=$('goalSteps').value.split(/\r?\n/).map(text=>text.trim()).filter(Boolean).map(text=>({text,done:false}));mutate({action:'create',title:$('goalTitle').value,steps,status:'planned'});};
 $('goalDecompose').onclick=async()=>{if(busy||!active)return;const e=epoch,title=$('goalTitle').value,previous=$('goalSteps').value;if(previous.trim()&&!confirm('Remplacer les étapes actuelles par une proposition modifiable ?'))return;busy=true;try{const data=await api({action:'previewDecomposition',title});if(e===epoch&&active&&$('goalTitle').value===title&&$('goalSteps').value===previous){$('goalSteps').value=data.steps.map(s=>s.text).join('\n');status.textContent='Proposition modifiable, non enregistrée.';}}catch(err){if(e===epoch&&active)status.textContent=err.message;}finally{if(e===epoch)busy=false;}};
 $('goalReload').onclick=()=>{if(!busy)load();};
 document.addEventListener('warlike-heart-view-changed',e=>{active=e.detail.view==='goals';clear();if(active)load();});
 document.addEventListener('warlike-heart-account-updated',()=>{clear();if(active)load();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active){clear();load();}});
 if(!document.querySelector('[data-view="goals"]').hidden){active=true;load();}
})();