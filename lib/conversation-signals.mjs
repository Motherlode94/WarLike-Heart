const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ');
export function conversationSignals(history=[]){
 const turns=history.filter(x=>['user','assistant'].includes(x?.role)&&typeof (x.text??x.content)==='string');
 const text=turns.at(-1)?.text??turns.at(-1)?.content??'',n=normalize(text).trim();
 let intent='message';
 if(/\b(reformul|autrement|plus simple|en d autres mots)/.test(n))intent='reformulation';
 else if(/^(non\b|plutot\b|je corrige\b|correction\b|en fait\b)/.test(n))intent='correction';
 else if(/^(continue|poursuis|developpe|plus de details|et ensuite|la suite)\b/.test(n))intent='continuation';
 else if(/^(pourquoi|comment|qu est ce|explique)\b/.test(n))intent='question';
 const reference=/\b(ca|cela|celui|celle|ce dernier|ce sujet|lui|elle)\b/.test(n)||['reformulation','continuation'].includes(intent);
 const prior=turns.slice(0,-1).filter(x=>x.role==='user').at(-1);
 const previousUser=prior?.text??prior?.content??'';
 const guidance={message:'',reformulation:'Reformule le sujet précédent avec une autre explication, sans recopier la réponse.',correction:'Intègre la correction actuelle et abandonne la donnée remplacée.',continuation:'Poursuis le sujet déjà engagé sans recommencer sa présentation.',question:'Réponds à la question concrète avant de proposer la suite.'}[intent];
 return {intent,reference,previousUser:reference?previousUser.slice(0,500):'',guidance};
}
export function contextQuery(history=[]){
 const latest=history.at(-1)?.text??history.at(-1)?.content??'',signals=conversationSignals(history);
 return (signals.reference?signals.previousUser+' '+latest:latest).trim().slice(0,500);
}
