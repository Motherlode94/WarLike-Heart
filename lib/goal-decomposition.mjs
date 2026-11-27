// Deterministic draft, never creates or executes an objective.
export function decomposeGoal(title){
 if(typeof title!=='string'||!title.trim()||title.length>160)throw Error('Objectif invalide');
 const t=title.trim();return [{text:'Définir les critères de réussite : '+t,done:false},{text:'Inventorier les ressources et contraintes.',done:false},{text:'Préparer les actions et leurs dépendances.',done:false},{text:'Réaliser les actions autorisées.',done:false},{text:'Vérifier le résultat et documenter les écarts.',done:false}];
}
