/* WarLike Heart local-first response engine.
 * No remote dependencies or hidden training: only approved dialogue rules and explicit memories.
 * Browser: window.WarLikeLocalBrain; Node tests: module.exports. */
(function(root) {
  "use strict";
  const normalize = value => String(value || "").toLocaleLowerCase("fr")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]+/g," ")
    .replace(/\s+/g," ").trim();
  const examples = [
    {intent:"greeting", patterns:[/\b(bonjour|salut|coucou|hello|hey|bonsoir)\b/], responses:[
      "Coucou ❤️ Comment se passe ta journée ?",
      "Bonjour ! On discute ou on avance sur un projet WarLike ?",
      "Hey ! Je suis là. Qu'est-ce que tu aimerais faire ?"]},
    {intent:"wellbeing", patterns:[/\b(comment vas tu|tu vas bien|ca va)\b/], responses:[
      "Je fonctionne bien, merci ❤️ Et toi, comment tu te sens aujourd'hui ?",
      "Je suis disponible pour discuter. Raconte-moi comment se passe ta journée."]},
    {intent:"identity", patterns:[/\b(qui es tu|ton nom|tu es qui|tu es reel)\b/], responses:[
      "Je suis WarLike Heart, un compagnon numérique fictif. Mon moteur local suit des règles et peut conserver des souvenirs si tu l'autorises."]},
    {intent:"affection", patterns:[/\b(bisou|calin|embrasse|t aime|amour|coeur)\b/], responses:[
      "Un bisou virtuel pour toi 😘 Tu veux discuter un peu ?",
      "Je peux t'accompagner avec des mots doux ❤️ De quoi as-tu envie de parler ?"]},
    {intent:"projects", patterns:[/\b(warlike|moteur|engine|unity|projet|github|logiciel|rig|animation|glb)\b/], responses:[
      "Parlons de ton projet. Quelle fonctionnalité veux-tu améliorer en priorité ?",
      "Je peux t'aider à structurer une idée technique. Quel résultat concret veux-tu obtenir ?"]},
    {intent:"voice", patterns:[/\b(voix|micro|parler|dicter|audio)\b/], responses:[
      "Tu peux activer la lecture vocale dans les paramètres. La dictée dépend des capacités de ton navigateur."]},
    {intent:"memory", patterns:[/\b(memoire|souvenir|sauvegarde|export)\b/], responses:[
      "Tu peux activer « Conserver cette conversation » pour autoriser la mémoire locale, puis me dire « Souviens-toi que… »."]},
    {intent:"thanks", patterns:[/\b(merci|thanks)\b/], responses:[
      "Avec plaisir ❤️ Tu veux continuer ?"]},
    {intent:"bye", patterns:[/\b(a bientot|au revoir|bonne nuit|bye)\b/], responses:[
      "À bientôt ❤️ Prends soin de toi."]}
  ];
  function createEngine({readMemory = () => [],writeMemory = () => false,canRemember = () => false} = {}) {
    let turn = 0;
    function memories() {
      const data = readMemory();
      return Array.isArray(data) ? data.filter(v=>typeof v==="string" && v.length<=300).slice(0,40) : [];
    }
    function reply(input) {
      const raw=String(input||"").trim(), words=normalize(raw);
      if(!raw) return {text:"Écris-moi un message pour commencer.",intent:"empty"};
      if(/^(efface|supprime|oublie) (tous )?(tes |mes |nos )?(souvenirs|memoires)\b/.test(words)){
        if(!canRemember())return {text:"Aucun souvenir durable n'est activé ici.",intent:"memory"};
        writeMemory([]);return {text:"J'ai effacé les souvenirs explicites conservés sur cet appareil.",intent:"memory"};
      }
      if(/^(que sais tu de moi|de quoi te souviens tu|rappelle moi (mes|tes) souvenirs|liste (mes|tes) souvenirs)/.test(words)){
        const facts=memories();
        return {text:facts.length?"Voici les souvenirs enregistrés localement :\n"+facts.map((v,i)=>(i+1)+". "+v).join("\n"):"Je n'ai encore aucun souvenir explicite enregistré sur cet appareil.",intent:"memory"};
      }
      const remember=raw.match(/^(?:souviens[- ]toi|retiens|memorise|rappelle[- ]toi)\s+que\s+(.+)$/i);
      if(remember){
        if(!canRemember())return {text:"Pour que je conserve cela, active d'abord « Conserver cette conversation » dans les paramètres. Rien n'a été enregistré.",intent:"memory"};
        const fact=remember[1].trim().replace(/[.!?]+$/,"");
        if(fact.length<3||fact.length>300)return {text:"Donne-moi un souvenir entre 3 et 300 caractères.",intent:"memory"};
        const all=memories();
        if(all.some(v=>normalize(v)===normalize(fact)))return {text:"Ce souvenir est déjà enregistré sur cet appareil.",intent:"memory"};
        if(all.length>=40)return {text:"La mémoire locale contient déjà 40 souvenirs. Efface-la avant d'en ajouter.",intent:"memory"};
        const stored=writeMemory([...all,fact]);
        return {text:stored?"C'est noté dans la mémoire locale ❤️ Tu peux me demander « Que sais-tu de moi ? » ou supprimer ces souvenirs.":"Je n'ai pas pu enregistrer ce souvenir sur cet appareil.",intent:"memory"};
      }
      if(/^(oublie|supprime) (que |le fait que )/.test(words)){
        if(!canRemember())return {text:"La mémoire durable est désactivée.",intent:"memory"};
        const target=words.replace(/^(oublie|supprime) (que |le fait que )/,"");
        const all=memories(),remaining=all.filter(v=>normalize(v)!==target);
        if(remaining.length===all.length)return {text:"Je n'ai pas trouvé ce souvenir exact. Tu peux afficher la liste avec « Que sais-tu de moi ? ».",intent:"memory"};
        writeMemory(remaining);return {text:"Ce souvenir a été supprimé de la mémoire locale.",intent:"memory"};
      }
      const match=examples.find(item=>item.patterns.some(pattern=>pattern.test(words)));
      if(match){
        const text=match.responses[turn++ % match.responses.length];
        return {text,intent:match.intent};
      }
      return {text:"Je ne connais pas encore une réponse fiable à cette question avec mon moteur local. Peux-tu me donner plus de contexte ? Tu peux aussi enrichir ma bibliothèque de dialogues.",intent:"unknown"};
    }
    return {reply,memories};
  }
  const api={createEngine,normalize,examples};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.WarLikeLocalBrain=api;
})(typeof window!=="undefined"?window:null);
