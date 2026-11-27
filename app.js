/* WarLike Heart · local demo + optional authenticated Cloudflare AI */
"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const KEY = "warlike-heart-demo-v1"; // keep compatibility with v0.2 history
  const MAX = 100;
  const nativeReady=import('./lib/native-assistant.mjs?v=25.01');
  const welcome = {role:"assistant",text:"Coucou ❤️ Bienvenue sur WarLike HEART ! Je peux répondre localement, apprendre des réponses que tu approuves dans l'espace Cerveau et conserver des souvenirs avec ton accord."};
  let history = [welcome];
  let recognition = null;
  let busy = false;
  let conversationRevision=0;
  let portraitObjectUrl = null;
  const state = {voiceEnabled:false,remember:false};
  const MEMORY_KEY = "warlike-heart-explicit-memories-v1";
  const LEARNING_KEY = "warlike-heart-learning-v1";
  const learningApi=window.WarLikeLearningBrain;
  const readLearning=()=>{
    if(!state.remember || !learningApi)return {version:1,dialogues:[],knowledge:[]};
    try{return learningApi.validated(JSON.parse(localStorage.getItem(LEARNING_KEY)||"null"));}
    catch{return learningApi.validated(null);}
  };
  const writeLearning=data=>{
    if(!state.remember||!learningApi)return false;
    try{localStorage.setItem(LEARNING_KEY,JSON.stringify(learningApi.validated(data)));return true;}
    catch{return false;}
  };
  const learningEngine=learningApi?.create({read:readLearning,enabled:()=>state.remember});
  window.WarLikeHeartLearningBridge={read:readLearning,write:writeLearning,enabled:()=>state.remember};
  const readMemories = () => {
    if (!state.remember) return [];
    try {
      const facts=JSON.parse(localStorage.getItem(MEMORY_KEY)||"[]");
      return Array.isArray(facts)?facts.filter(f=>typeof f==="string"&&f.length<=300).slice(0,40):[];
    } catch { return []; }
  };
  const writeMemories = facts => {
    if (!state.remember) return false;
    try {
      localStorage.setItem(MEMORY_KEY,JSON.stringify(facts));
      return true;
    } catch { return false; }
  };
  const localBrain=window.WarLikeLocalBrain?.createEngine({
    readMemory:readMemories,writeMemory:writeMemories,canRemember:()=>state.remember
  });
  const localChatReady=import('./local-chat.mjs?v=24.05').then(({createLocalChat})=>{
    const chat=createLocalChat({readLearning,readMemories,writeLearning,canRemember:()=>state.remember});
    window.WarLikeHeartLocalChat=chat;return chat;
  }).catch(()=>{ $("localModelStatus").textContent="Le module local n’a pas pu être chargé. Recharge la page.";return null; });
  const resetLocalContext=()=>{conversationRevision++;learningEngine?.resetContext();window.WarLikeHeartLocalChat?.reset();};
  const status = (text) => { $("status").textContent = text; };
  const brainStatus=$("localBrainStatus");
  if(brainStatus){
    brainStatus.textContent=localBrain
      ?"Mode à règles disponible. Charge un modèle pour une conversation générative locale."
      :"⚠ Moteur local indisponible : vérifie le chargement de local-brain.js.";
  }
  if(localBrain)$("aiMode").textContent="Modèle local · chargement requis";
  const safeHistory = (value) => Array.isArray(value) ? value.filter(x => x && ["user","assistant"].includes(x.role) && typeof x.text === "string" && x.text.length <= 4000).slice(-MAX) : null;
  const render = () => {
    const area = $("messages"); area.replaceChildren();
    for (const [index,item] of history.entries()) {
      const el = document.createElement("div");
      el.className = "bubble " + item.role;
      el.textContent = item.text;
      area.appendChild(el);
      const question=item.role==='assistant'?history.slice(0,index).reverse().find(turn=>turn.role==='user')?.text:null;
      if(question){const action=document.createElement('button');action.type='button';action.className='reply-teach';action.textContent='Corriger et enseigner';action.setAttribute('aria-label','Corriger cette réponse de Heart');action.onclick=async()=>{const chat=await localChatReady;if(chat){chat.prepareTeaching({question,answer:item.text});$("localTeachingDialog").showModal();}};area.append(action);}
    }
    area.scrollTop = area.scrollHeight;
  };
  const persist = () => {
    if (!state.remember) { try { localStorage.removeItem(KEY); } catch {} return; }
    try { localStorage.setItem(KEY,JSON.stringify({version:1,history:history.slice(-MAX),voiceEnabled:state.voiceEnabled,remember:true})); }
    catch { status("Stockage local indisponible. Exporte ton JSON pour sauvegarder."); }
  };
  const stopVoice = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    $("portrait").classList.remove("speaking");
    window.WarLikeHeart3D?.setSpeaking(false);
  };
  const speak = (text) => {
    if (!state.voiceEnabled) return;
    if (!("speechSynthesis" in window)) { status("Synthèse vocale non prise en charge ici."); return; }
    stopVoice();
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "fr-FR"; utterance.rate = 1; utterance.pitch = 1;
    utterance.onstart = () => {$("portrait").classList.add("speaking");window.WarLikeHeart3D?.setSpeaking(true);};
    utterance.onboundary = event => { if(Number.isFinite(event.charIndex)) window.WarLikeHeart3D?.setSpeechPosition(text,event.charIndex); };
    utterance.onend = utterance.onerror = () => {$("portrait").classList.remove("speaking");window.WarLikeHeart3D?.setSpeaking(false);};
    window.speechSynthesis.speak(utterance);
  };
  function reply(text) {
    const normalized = text.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    if (/bonjour|salut|coucou|hello/.test(normalized)) return "Bonjour ! Je suis là pour construire ton projet WarLike Heart. ♥";
    if (/qui es.tu|ton nom|tu es qui/.test(normalized)) return "Je suis WarLike Heart, un personnage d'assistante virtuelle. Pour l'instant, ce site est une interface de démonstration sans IA connectée.";
    if (/raspberry|materiel|appareil/.test(normalized)) return "La cible prévue est un Raspberry Pi 5. Il reste à installer un service audio, un moteur de dialogue et l'avatar officiel.";
    if (/voix|parler|micro/.test(normalized)) return "Active la lecture vocale ci-dessous et essaie « Dicter ». Les fonctions disponibles dépendent de ton navigateur et de ses autorisations.";
    if (/sauvegard|memoire|export/.test(normalized)) return "Clique sur « Exporter JSON » pour conserver cette conversation. Le stockage local est facultatif et désactivé par défaut.";
    return "J'ai reçu ton message. Ce prototype ne génère pas encore de réponses IA. On pourra connecter un moteur conversationnel autorisé dans une prochaine version.";
  }
  function append(role,text) {
    history.push({role,text}); history=history.slice(-MAX); render(); persist();
  }
  // Clavier emoji local : aucun transfert réseau, insertion au curseur.
  const emojiToggle=$("emojiToggle"), emojiPicker=$("emojiPicker"),messageField=$("message");
  const emojis=["❤️","💕","💖","💗","💓","💞","💋","😘","🥰","😍","😊","☺️","😏","😉","😂","🤣","🥹","😭","😢","😔","😴","😳","🤭","😎","🙃","😇","😡","😤","🤔","🫶","🤗","👀","✨","🌹","🌷","🌙","💐","🔥","🎶","🎉","💜","💙","💚","🖤","🤍","💛","🍀","🌺"];
  for (const emoji of emojis) {
    const button=document.createElement("button");button.type="button";button.textContent=emoji;button.title="Insérer "+emoji;button.setAttribute("aria-label","Insérer "+emoji);
    button.addEventListener("click",()=>{
      const start=messageField.selectionStart ?? messageField.value.length,end=messageField.selectionEnd ?? start;
      const next=messageField.value.slice(0,start)+emoji+messageField.value.slice(end);
      if(next.length>messageField.maxLength)return;
      messageField.value=next;messageField.focus();messageField.setSelectionRange(start+emoji.length,start+emoji.length);
      emojiPicker.hidden=true;emojiToggle.setAttribute("aria-expanded","false");
    });emojiPicker.append(button);
  }
  emojiToggle.addEventListener("click",()=>{emojiPicker.hidden=!emojiPicker.hidden;emojiToggle.setAttribute("aria-expanded",String(!emojiPicker.hidden));});
  document.addEventListener("pointerdown",event=>{if(!emojiPicker.hidden && !event.target.closest(".emoji-wrap")){emojiPicker.hidden=true;emojiToggle.setAttribute("aria-expanded","false");}});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!emojiPicker.hidden){emojiPicker.hidden=true;emojiToggle.setAttribute("aria-expanded","false");emojiToggle.focus();}});
  const fitConversation=()=>{
    if($("homeView").hidden)return;
    const chat=document.querySelector('#homeView .chat');
    const top=chat.getBoundingClientRect().top+window.scrollY;
    chat.style.setProperty('--chat-height',Math.max(280,window.innerHeight-top-16)+'px');
  };
  const scheduleFit=()=>requestAnimationFrame(fitConversation);
  window.addEventListener('resize',scheduleFit);
  document.addEventListener('warlike-heart-view-changed',scheduleFit);
  document.fonts?.ready.then(scheduleFit);
  if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(scheduleFit);for(const node of document.querySelectorAll('#homeView .avatar,.heart-navigation,.top,#pageTitle'))observer.observe(node);}
  scheduleFit();
  const openBrain=()=>{document.querySelector('[data-nav="account"]').click();$("brainSettings").open=true;$("brainSettings").scrollIntoView({block:'start'});};
  $("openBrainSettings").addEventListener("click",openBrain);
  $("backToChat").addEventListener("click",()=>document.querySelector('[data-nav="home"]').click());
  $("localTeachingClose").addEventListener("click",()=>$("localTeachingDialog").close());
  const memoryCommandPattern=/^(?:(?:souviens toi|retiens|memorise|rappelle toi) que |(?:efface|supprime|oublie) (?:tous )?(?:tes |mes |nos )?(?:souvenirs|memoires)\b|que sais tu de moi|de quoi te souviens tu|rappelle moi (?:mes|tes) souvenirs|liste (?:mes|tes) souvenirs|(?:oublie|supprime) (?:que |le fait que ))/;
  $("chatForm").addEventListener("submit",async ev => {
    ev.preventDefault();
    const field=$("message"); const text=field.value.trim();
    if (!text || busy) return;
    const selected=$("conversationEngine").value;
    const native=(await nativeReady).nativeReply(text);
    if(busy)return;
    const explicitMemory=memoryCommandPattern.test(window.WarLikeLocalBrain?.normalize(text)||'');
    if(!native&&selected==='local-llm'&&!explicitMemory&&window.WarLikeHeartLocalChat?.status().state!=='ready'){status('Charge un modèle dans Cerveau pour commencer. Ton message est conservé.');openBrain();return;}
    if(!native&&selected==='remote'&&!$("accessToken").value.trim()){status('Configure le service distant dans Cerveau. Ton message est conservé.');openBrain();return;}
    busy=true; const sendButton=$("chatForm").querySelector("button[type=submit]");
    sendButton.disabled=true; field.disabled=true;
    const turnRevision=conversationRevision;
    stopVoice();append("user",text);field.value="";
    window.WarLikeHeartLocalChat?.clearTeaching();
    const token=$("accessToken").value.trim();
    let answer,canTeach=false;
    try {
    if(native){answer=native.reply;$("aiMode").textContent='Outil natif · sur cet appareil';$("apiStatus").textContent=native.verification.status==='native-verified'?'Résultat vérifié par calcul natif.':'Précise les données du calcul.';}else if(selected==='local-llm'){
      $("aiMode").textContent="Modèle de langage local · sur cet appareil";
      try{
        if(explicitMemory&&localBrain){answer=localBrain.reply(text).text;$("apiStatus").textContent="Commande de mémoire locale traitée.";}
        else{
          const chat=await localChatReady;
          if(!chat)throw Error('Le module local n’a pas pu être chargé. Recharge la page.');
          answer=await chat.reply(history);canTeach=true;
          $("apiStatus").textContent="Réponse générée localement, sans envoi du chat à une API.";
        }
      }catch(error){answer=error.message;$("apiStatus").textContent="Modèle local indisponible. Utilise « Charger le modèle local » ou choisis un autre moteur.";}
    } else if (selected==='rules') {
      const explicitWeb=text.match(/^(?:cherche|recherche|renseigne[- ]toi)(?: sur internet| sur le web| en ligne)?(?:\s*[:,-])?\s+(.+)$/i);
      const learned=explicitWeb?null:learningEngine?.answer(text);
      const local=explicitWeb?null:learned?null:localBrain?.reply(text);
      const needsWeb=Boolean(explicitWeb||(local?.intent==="unknown"&&window.WarLikeHeartWebResearch?.autoEnabled()));
      if(needsWeb && window.WarLikeHeartWebResearch?.lookup){
        const query=(explicitWeb?.[1]||text).trim().slice(0,240);
        $("aiMode").textContent="Recherche Internet autorisée · sources externes";
        try{
          const result=await window.WarLikeHeartWebResearch.lookup(query,"wikipedia");
          answer=result.sources?.length
           ?"J'ai trouvé ces pistes sur Wikipédia, à vérifier avant tout apprentissage :\n"+
            result.sources.slice(0,3).map((x,i)=>(i+1)+". "+x.title+" — "+x.snippet+"\n"+x.url).join("\n\n")+
            "\n\nJe ne les enregistrerai pas sans ton autorisation. Tu peux ouvrir Cerveau pour vérifier et créer une fiche."
           :"Aucune source disponible pour cette question. Essaie une formulation plus précise dans le menu Cerveau.";
          $("apiStatus").textContent="Recherche Internet effectuée ; aucune mémoire ajoutée.";
        }catch(error){
          answer=(local?.text||"Je ne peux pas vérifier cette question sur Internet actuellement.")+
           "\nRecherche Internet : "+(error?.message||"service indisponible");
          $("apiStatus").textContent="Recherche Internet impossible.";
        }
      }else{
        answer=learned?.text||local?.text||reply(text);
        $("apiStatus").textContent="Réponse produite localement, sans API IA.";
        $("aiMode").textContent="Moteur local · indépendant de l'API";
      }
    } else {
      $("apiStatus").textContent="Connexion au modèle IA…";
      $("aiMode").textContent="Mode IA · connexion privée";
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),30000);
      try {
        const result=await fetch("/api/chat", {
          method:"POST",
          credentials:"same-origin",
          headers:{"content-type":"application/json","authorization":"Bearer "+token},
          body:JSON.stringify({messages:history.filter(m=>["user","assistant"].includes(m.role)).slice(-20),useCognitiveContext:$("chatCognitiveContext").checked}),
          signal:controller.signal,
          cache:"no-store"
        });
        const data=await result.json().catch(()=>({}));
        if(!result.ok||typeof data.reply!=="string") throw Error(data.error||"Serveur indisponible.");
        answer=data.reply;
        $("apiStatus").textContent="Connectée au moteur IA pour cette réponse.";
      } catch(error) {
        answer="La réponse IA n'a pas pu être obtenue : "+(error.name==="AbortError"?"délai dépassé.":error.message)+" Tu peux réessayer ou choisir un autre moteur de conversation.";
        $("apiStatus").textContent="Connexion IA en erreur.";
        status("Le serveur IA n'a pas répondu.");
      } finally {clearTimeout(timeout);}
    }
    if(turnRevision!==conversationRevision)return;
    append("assistant",answer);
    if(canTeach)window.WarLikeHeartLocalChat?.onReply({question:text,answer});
    if(window.WarLikeHeart3D){const l=answer.toLowerCase();const next=/heureuse|content|bonjour|plaisir|♥|❤️/.test(l)?"happy":/désol|erreur|impossible/.test(l)?"sad":(/pourquoi|comment/.test(l)||l.includes("?"))?"curious":"neutral";window.WarLikeHeart3D.setMood(next);}
    // Do not speak technical error messages.
    if($("apiStatus").textContent==="Connectée au moteur IA pour cette réponse." || canTeach || selected==='rules') speak(answer);
    } finally {busy=false;sendButton.disabled=false;field.disabled=false;field.focus();}
  });
  $("threeMode").addEventListener("click",()=> $("modelFile").click());
  $("modelFile").addEventListener("change",async ev=>{
    const file=ev.target.files?.[0];ev.target.value="";
    if(!file)return;
    if(!window.WarLikeHeart3D){status("La visionneuse 3D n'est pas disponible. Vérifie WebGL et l'accès au module Three.js.");return;}
    status("Chargement et vérification du véritable modèle GLB…");
    try{
      const result=await window.WarLikeHeart3D.loadGLB(file,{rememberLocal:true});
      $("portrait").classList.add("is3d");
      $("heart3d").classList.add("active");
      const rig=result.fullBodyRigCandidate?"squelette humanoïde candidat détecté":"squelette incomplet ("+result.missingBones.join(", ")+")";
      const lips=result.speechReady?"visèmes de base détectés":"visèmes insuffisants";
      status("GLB : "+result.meshes+" maillages, "+result.boneCount+" os, "+result.animations+" animations — "+rig+" ; "+lips+". Ressemblance officielle non validée.");
    }catch(error){
      status("Modèle 3D non chargé : "+error.message);
    }
  });
  $("checkServer").addEventListener("click",async()=>{
    const btn=$("checkServer");btn.disabled=true;$("serverStatus").textContent="Vérification de la disponibilité…";
    try{
      const r=await fetch("/api/server-status",{cache:"no-store"});
      if(!r.ok)throw Error("Diagnostic indisponible");
      const data=await r.json();
      $("serverStatus").textContent=(typeof data.note==="string" && data.note.length<260)
        ?data.note:"État du serveur non déterminé. Aucun compte authentifié.";
    }catch{$("serverStatus").textContent="Diagnostic non disponible : déployer les fonctions Cloudflare Pages. Aucun compte connecté.";}
    finally{btn.disabled=false;}
  });
  document.addEventListener("warlike-heart-3d-ready",()=>{
    if(window.WarLikeHeart3D?.isModelLoaded()){
      $("portrait").classList.add("is3d");
      $("heart3d").classList.add("active");
      status("Avatar 3D restauré depuis ce navigateur. Ouvre Espace 3D pour le visualiser.");
    }else status("Visionneuse GLB disponible. Aucun modèle officiel n'est encore importé.");
  });
  document.addEventListener("warlike-heart-avatar-storage",event=>{
    const {type,name,message}=event.detail||{};
    if(type==="saved")status("Avatar GLB sauvegardé sur cet appareil : "+name+". Il sera restauré après rechargement.");
    if(type==="save-error")status("Avatar visible mais pas sauvegardé : "+message+". Publie-le dans R2 pour l'afficher sur d'autres appareils.");
    if(type==="restored")status("Avatar GLB restauré automatiquement : "+name+".");
    if(type==="cleared")status("Copie locale du modèle supprimée. L'avatar public R2, s'il existe, reste disponible.");
  });
  const clearLocalAvatar=document.getElementById("forgetLocalAvatar");
  clearLocalAvatar?.addEventListener("click",async()=>{
    if(!confirm("Effacer la copie GLB conservée dans ce navigateur ? Cela n'efface pas l'avatar public R2."))return;
    try{await window.WarLikeHeart3D?.forgetLocalGLB();}catch(error){status("Impossible de retirer la copie locale : "+error.message);}
  });
  // The original portrait is the canonical fallback if the asset is in this repository.
  const officialPortrait=$("officialPortrait");
  if(officialPortrait){
    const portraitReady=()=>{
      if(!officialPortrait.naturalWidth)return;
      if($("portrait").querySelector("img:not(#officialPortrait)"))return;
      officialPortrait.hidden=false;
      $("portrait").classList.add("has-image");
      $("portrait").classList.remove("is3d");
      $("heart3d").classList.remove("active");
      status("Portrait officiel affiché.");
    };
    officialPortrait.addEventListener("load",portraitReady);
    officialPortrait.addEventListener("error",()=>status("Image officielle absente du dépôt : charge le portrait validé ou ajoute assets/portrait-officiel.webp sur GitHub."));
    if(officialPortrait.complete && officialPortrait.naturalWidth)portraitReady();
  }
  // High-resolution image stays in this browser's IndexedDB, never on the API.
  const portraitDB=()=>new Promise((resolve,reject)=>{
    if(!("indexedDB" in window))return reject(Error("IndexedDB indisponible"));
    const request=indexedDB.open("warlike-heart-portrait",1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains("assets"))request.result.createObjectStore("assets");};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
  const portraitStore=async(mode,value)=>{
    const db=await portraitDB();
    try{
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction("assets",mode==="read"?"readonly":"readwrite");
        const store=tx.objectStore("assets");
        const request=mode==="read"?store.get("official"):mode==="delete"?store.delete("official"):store.put(value,"official");
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>reject(request.error);
      });
    }finally{db.close();}
  };
  const applyHDPortrait=(blob,note)=>{
    if(portraitObjectUrl)URL.revokeObjectURL(portraitObjectUrl);
    portraitObjectUrl=URL.createObjectURL(blob);
    const img=$("portrait").querySelector("img:not(#officialPortrait)")||document.createElement("img");
    img.alt="Portrait HD local de WarLike Heart";
    img.onload=()=>{
      status(note+" · "+img.naturalWidth+" × "+img.naturalHeight+" pixels.");
    };
    img.src=portraitObjectUrl;
    if(!img.isConnected)$("portrait").appendChild(img);
    if(officialPortrait)officialPortrait.hidden=true;
    $("portrait").classList.add("has-image");
    $("portrait").classList.remove("is3d");$("heart3d").classList.remove("active");
  };
  // Restore user-selected high-resolution photo before the embedded thumbnail can override it.
  portraitStore("read").then(blob=>{if(blob instanceof Blob)applyHDPortrait(blob,"Portrait HD local restauré");}).catch(()=>{});
  $("clearPortrait").addEventListener("click",async()=>{
    try{await portraitStore("delete");}catch{}
    if(portraitObjectUrl){URL.revokeObjectURL(portraitObjectUrl);portraitObjectUrl=null;}
    const custom=$("portrait").querySelector("img:not(#officialPortrait)");custom?.remove();
    if(officialPortrait&&officialPortrait.naturalWidth){officialPortrait.hidden=false;$("portrait").classList.add("has-image");}
    status("Portrait HD local supprimé. La miniature publique reste disponible.");
  });
  $("pickPortrait").addEventListener("click",()=> $("portraitFile").click());
  $("portraitFile").addEventListener("change",async ev=>{
    const file=ev.target.files?.[0];ev.target.value="";
    if(!file)return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size>5*1024*1024){
      status("Portrait refusé : utilise JPG, PNG ou WebP, 5 Mo maximum.");return;
    }
    try{
      const bitmap=await createImageBitmap(file);
      const width=bitmap.width,height=bitmap.height;bitmap.close();
      if(width<600||height<650)status("Attention : cette image est trop petite pour une présentation HD ("+width+" × "+height+").");
      applyHDPortrait(file,"Portrait sélectionné");
      try{await portraitStore("write",file);}catch{status("Portrait affiché, mais la sauvegarde locale a échoué.");}
    }catch{status("Fichier image invalide ou non pris en charge.");}

  });
  // Public readiness checks return only booleans; no API key or token is exposed.
  (async()=>{
    try{
      const response=await fetch("/api/chat",{method:"GET",cache:"no-store"});
      if(!response.ok)throw Error("endpoint unavailable");
      const data=await response.json();
      if(data.aiConfigured===true){
        if($("conversationEngine").value==='remote')$("aiMode").textContent="Service IA prêt — identification privée requise";
        if($("conversationEngine").value==='remote')$("apiStatus").textContent="Serveur IA configuré. Saisis ton jeton privé pour discuter.";
      }else{
        if($("conversationEngine").value==='remote')$("aiMode").textContent="Service distant non configuré";
        if($("conversationEngine").value==='remote')$("apiStatus").textContent="Service IA distant non configuré.";
      }
    }catch{
      if($("conversationEngine").value==='remote')$("aiMode").textContent="Service distant non vérifié";
      if($("conversationEngine").value==='remote')$("apiStatus").textContent="La vérification de l'API n'est pas disponible.";
    }
  })();
  $("accessToken").addEventListener("input",()=>{
    const connected=Boolean($("accessToken").value.trim());
    if($("conversationEngine").value==='remote')$("aiMode").textContent=connected?"Mode IA distant demandé · vérifier la connexion":"Service distant · jeton requis";
    if($("conversationEngine").value==='remote')$("apiStatus").textContent=connected?"Jeton présent en mémoire pour le service distant.":"Jeton privé requis pour le service distant.";
  });
  $("conversationEngine").addEventListener("change",()=>{
    const mode=$("conversationEngine").value;
    $("aiMode").textContent=mode==='local-llm'?'Modèle de langage local':mode==='rules'?'Mode à règles · réponses limitées':'Service IA distant · jeton requis';
    $("localModelPanel").hidden=mode!=='local-llm';
    $("apiStatus").textContent=mode==='remote'?'Le prochain message sera envoyé au service distant avec le jeton privé.':'Les réponses restent sur cet appareil.';
  });
  $("localCognitiveContext").addEventListener("change",()=>{if(!$("localCognitiveContext").checked)resetLocalContext();else conversationRevision++;});
  let cognitiveOwner=null;
  document.addEventListener("warlike-heart-account-updated",event=>{const owner=event.detail?.connected?event.detail.user?.id:null;if(owner!==cognitiveOwner&&$("localCognitiveContext").checked)resetLocalContext();cognitiveOwner=owner;});
  $("voiceEnabled").addEventListener("change",ev => {state.voiceEnabled=ev.target.checked; if(!state.voiceEnabled) stopVoice();persist();});
  $("remember").addEventListener("change",ev => {
    if(!ev.target.checked)resetLocalContext();
    else {conversationRevision++;learningEngine?.resetContext();window.WarLikeHeartLocalChat?.clearTeaching();}
    state.remember=ev.target.checked;
    if(!state.remember){try{localStorage.removeItem(MEMORY_KEY);localStorage.removeItem(LEARNING_KEY);}catch{}}
    persist();
    status(state.remember?"Historique et souvenirs explicites autorisés sur cet appareil.":"Historique et souvenirs explicites locaux supprimés.");
  });
  $("stop").addEventListener("click",() => {stopVoice();if(recognition){recognition.abort();recognition=null;}$("portrait").classList.remove("listening");status("Voix arrêtée.");});
  $("listen").addEventListener("click",() => {
    const Engine=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Engine){status("Reconnaissance vocale non prise en charge par ce navigateur.");return;}
    if(recognition){recognition.abort();recognition=null;}
    const rec=new Engine(); recognition=rec;rec.lang="fr-FR";rec.interimResults=false;rec.maxAlternatives=1;
    rec.onresult=ev=>{if(ev.results?.[0]?.[0]?.transcript){$("message").value=ev.results[0][0].transcript;$("message").focus();status("Dictée insérée. Appuie sur Envoyer pour confirmer.");}};
    rec.onerror=ev=>status("Microphone : "+ev.error+". Vérifie l'autorisation et la connexion.");
    rec.onend=()=>{if(recognition===rec)recognition=null;$("portrait").classList.remove("listening");window.WarLikeHeart3D?.setListening(false);};
    try{rec.start();window.WarLikeHeart3D?.setListening(true);$("portrait").classList.add("listening");status("Écoute en cours…");}catch{status("Impossible de démarrer la dictée.");}
  });
  $("export").addEventListener("click",()=>{
    const json=JSON.stringify({format:"warlike-heart-conversation",version:1,exportedAt:new Date().toISOString(),history,memories:readMemories(),learning:readLearning(),settings:{voiceEnabled:state.voiceEnabled}},null,2);
    const blob=new Blob([json],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download="warlike-heart-conversation.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);status("Export JSON préparé.");
  });
  $("import").addEventListener("click",()=>$("importFile").click());
  $("importFile").addEventListener("change",async ev=>{
    const file=ev.target.files?.[0];ev.target.value="";if(!file)return;
    if(file.size>1024*1024){status("Fichier trop volumineux (maximum 1 Mo).");return;}
    try {const data=JSON.parse(await file.text());if(data.format!=="warlike-heart-conversation"||data.version!==1)throw Error("format");
      const imported=safeHistory(data.history);if(!imported||!imported.length)throw Error("content");
      resetLocalContext();history=imported;stopVoice();render();persist();
      // Only restore explicit memories if the user has already opted into local storage.
      if(state.remember&&Array.isArray(data.memories)){
        const valid=data.memories.filter(x=>typeof x==="string"&&x.length>=3&&x.length<=300).slice(0,40);
        writeMemories(valid);
      }
      if(state.remember&&data.learning&&learningApi){
        writeLearning(data.learning);
      }
      status("Conversation importée. Les souvenirs ne sont restaurés que si la mémoire locale est activée.");
    }catch{status("Import impossible : format ou contenu non valide.");}
  });
  $("clear").addEventListener("click",()=>{
    resetLocalContext();stopVoice();history=[welcome];render();
    state.remember=false;$("remember").checked=false;
    try{localStorage.removeItem(KEY);localStorage.removeItem(MEMORY_KEY);localStorage.removeItem(LEARNING_KEY);}catch{}
    status("Conversation et souvenirs explicites locaux effacés.");
  });
  try {
    const stored=JSON.parse(localStorage.getItem(KEY)||"null");
    if(stored?.remember===true){const h=safeHistory(stored.history);if(h?.length){history=h;state.remember=true;$("remember").checked=true;}}
    if(state.remember&&typeof stored.voiceEnabled==="boolean"){state.voiceEnabled=stored.voiceEnabled;$("voiceEnabled").checked=state.voiceEnabled;}
  }catch{status("Aucune sauvegarde locale valide.");}
  // Explicit backup/restore bridge. Cloud sync is NEVER triggered by chat messages.
  window.WarLikeHeartCloudBridge={
    enabled:()=>state.remember,
    snapshot:()=>({version:1,history:history.slice(-MAX),memories:readMemories(),learning:readLearning()}),
    restore:data=>{
      if(!state.remember)return false;
      const imported=safeHistory(data?.history);
      if(!imported||!Array.isArray(data?.memories)||!data?.learning)return false;
      resetLocalContext();
      const previous={history,memories:readMemories(),learning:readLearning()};
      if(!writeMemories(data.memories)||!writeLearning(data.learning))return false;
      history=imported.length?imported:[welcome];
      render();persist();
      document.dispatchEvent(new Event("warlike-heart-learning-restored"));
      return true;
    }
  };
  render();
})();
