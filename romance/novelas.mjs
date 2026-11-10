/* WarLike Heart — bibliothèque procédurale de novelas adultes.
   350 arcs x 100 scènes = 35 000 identifiants stables.
   Fiction relationnelle adulte, non explicite. Pas de mémoire personnelle. */
export const TOTAL_ARCS = 350;
export const SCENES_PER_ARC = 100;
export const TOTAL_SCENES = TOTAL_ARCS * SCENES_PER_ARC;
const women = ["Naya","Leïla","Maya","Inès","Amara","Elena","Soraya","Lina","Naomi","Sélène","Aïcha","Nora","Dalia","Victoria","Maëlle","Iris","Jade","Zara","Roxane","Aurore","Mina","Sofia","Célia","Talia","Mélissa","Yara","Alma","Salomé","Eva","Nina","Clara","Eden","Assia","Kenza","Léonie","Flora","Mira","Adèle","Mylène","Thalia"];
const men = ["Elias","Noam","Gabriel","Sacha","Adam","Malik","Raphaël","Yanis","Mathis","Dario","Isaac","Théo","Léon","Nathan","Hugo","Milan","Ruben","Kamil","Samuel","Ariel","Nassim","Victor","Alex","Ilyes","Émile","Nolan","David","Louis","Rayan","Léo","Cyril","Mathéo","Liam","Jules","Evan"];
const places = ["une librairie nocturne","un studio de musique","un hôtel au bord de la mer","une galerie d’art","une petite ville sous la pluie","un train de nuit","une maison héritée","un café de quartier","un observatoire","un atelier de restauration","un festival de cinéma","un jardin botanique","un restaurant familial","un théâtre ancien","une résidence d’artistes","un village de montagne","un appartement parisien","un port méditerranéen","une station de radio","une ville futuriste"];
const secrets = ["une promesse ancienne","une lettre jamais envoyée","un projet abandonné","une séparation mal comprise","un héritage disputé","un départ imminent","un échec professionnel","une peur de l’engagement","une amitié trahie","un deuil encore sensible","une dette familiale","un rêve longtemps caché","un retour inattendu","un choix de carrière difficile"];
const objects = ["un carnet bleu","un disque vinyle","une photographie pliée","une clé de cuivre","un parapluie rouge","une tasse ébréchée","une bague sans inscription","un vieux billet de train","une écharpe","un roman annoté","une partition froissée","une carte postale"];
const phases = ["Rencontre","Curiosité","Rapprochement","Confiance","Désir et limites","Fêlure","Éloignement","Réconciliation","Projet commun","Amour au quotidien"];
const beats = [
 ["Un détail remarqué","Une observation banale change le sens de leur échange.","curiosité"],
 ["Une invitation imprévue","Une activité est proposée sans attendre que l’autre prenne les devants.","initiative"],
 ["Une confidence prudente","Un souvenir sensible refait surface.","vulnérabilité"],
 ["Un désaccord honnête","Deux convictions s’opposent sans mépris.","désaccord"],
 ["Un geste tendre","La proximité est proposée, jamais présumée.","tendresse"],
 ["Un moment de silence","Le silence devient une forme d’écoute.","intimité"],
 ["Une complication extérieure","Une obligation bouleverse leurs plans.","stress"],
 ["Une décision personnelle","L’un affirme une préférence indépendante.","autonomie"],
 ["Une surprise","Une initiative inattendue change l’atmosphère.","spontanéité"],
 ["Une conséquence","La décision précédente modifie leur confiance.","évolution"]
];
const openers = [
 "Tu as deux minutes ? J’ai quelque chose à te proposer.",
 "Je peux te poser une question un peu indiscrète ?",
 "Je t’ai vu hésiter. Tu veux m’en parler ?",
 "Je ne suis pas d’accord, mais je veux comprendre.",
 "Est-ce que je peux m’asseoir près de toi ?",
 "On n’est pas obligés de remplir ce silence.",
 "Ma journée a été longue. Je préfère être sincère.",
 "Cette fois, j’ai décidé de choisir pour moi.",
 "J’ai prévu une surprise. Tu peux dire non.",
 "Ce qu’on s’est dit hier me travaille encore."
];
const replies = [
 "Oui, mais j’aimerais qu’on prenne notre temps.",
 "Tu me surprends. Continue, je t’écoute.",
 "Je ne sais pas encore ce que je ressens.",
 "Merci de me le dire au lieu de faire semblant.",
 "J’en ai envie aussi, tant qu’on est à l’aise tous les deux.",
 "Je peux rester un peu, sans te demander de parler.",
 "Alors on reporte. Ton repos compte aussi.",
 "Même si je choisis autrement, je tiens à toi.",
 "D’accord pour la surprise, à condition de pouvoir changer d’avis.",
 "Revenons-y calmement. Je ne veux pas deviner à ta place."
];
const moods = ["tendre","joueuse","réservée","affirmée","fatiguée","confiante","mélancolique","curieuse","impatiente","apaisée"];
const initiatives = ["propose un café","invite à une promenade","demande un moment de calme","partage un souvenir","reporte un rendez-vous","propose un choix alternatif","pose une question inattendue","suggère de cuisiner ensemble","reconnaît une erreur","prépare une petite surprise"];
const pad = (n) => String(n).padStart(3,"0");
function check(story,chapter) {
 if(!Number.isInteger(story)||story<1||story>TOTAL_ARCS) throw RangeError("story doit être compris entre 1 et 350");
 if(!Number.isInteger(chapter)||chapter<1||chapter>SCENES_PER_ARC) throw RangeError("chapter doit être compris entre 1 et 100");
}
export function getStory(story) {
 check(story,1); const s=story-1;
 const protagonist=women[s%women.length], partner=men[(s*9+Math.floor(s/women.length))%men.length];
 const setting=places[(s*7+Math.floor(s/20))%places.length];
 const secret=secrets[(s*11+Math.floor(s/14))%secrets.length];
 const motif=objects[(s*5+Math.floor(s/12))%objects.length];
 return {id:`WH-N-${pad(story)}`,story,protagonist,partner,setting,secret,motif,title:`${protagonist} et ${partner} — ${motif} à ${setting}`,chapters:SCENES_PER_ARC,characters_are_adults:true};
}
export function getScene(story,chapter) {
 check(story,chapter); const arc=getStory(story), n=chapter-1, beat=n%10;
 const [name,description,theme]=beats[beat], phase=phases[Math.floor(n/10)], mood=moods[(n+Math.floor((story-1)/5))%moods.length];
 const initiative=initiatives[((story-1)*3+n)%initiatives.length];
 const dialogue=[
  {speaker:arc.protagonist,text:openers[beat]},
  {speaker:arc.partner,text:replies[(beat+Math.floor((story-1)/17))%replies.length]},
  {speaker:arc.protagonist,text:`Aujourd’hui je me sens ${mood}. Je veux qu’on respecte mon rythme.`},
  {speaker:arc.partner,text:"D’accord. Rien ne nous oblige à décider maintenant."}
 ];
 return {id:`WH-R-${pad(story)}-${pad(chapter)}`,story_id:arc.id,chapter,total_chapters:SCENES_PER_ARC,title:name,phase,theme,mood,initiative,description,
 narration:`Dans ${arc.setting}, ${arc.protagonist} retrouve ${arc.partner}. ${description} ${arc.motif} leur rappelle ${arc.secret}. Leur histoire évolue avec les choix et la confiance de chacun.`,
 dialogue,choices:["Accepter","Demander du temps","Proposer autre chose","Refuser avec respect"],
 continuity:{previous:chapter>1?`WH-R-${pad(story)}-${pad(chapter-1)}`:null,next:chapter<100?`WH-R-${pad(story)}-${pad(chapter+1)}`:null},
 consent_required:[4,5,8].includes(beat),adult_non_explicit:true,editable:true,version:1};
}
export function getSceneById(id) {
 const match=/^WH-R-(\d{3})-(\d{3})$/.exec(id||"");
 if(!match) throw TypeError("Identifiant invalide");
 return getScene(Number(match[1]),Number(match[2]));
}
export function* allScenes() {
 for(let story=1;story<=TOTAL_ARCS;story++) for(let chapter=1;chapter<=SCENES_PER_ARC;chapter++) yield getScene(story,chapter);
}
