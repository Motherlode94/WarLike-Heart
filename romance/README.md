# WarLike Heart · Novelas adultes

Bibliothèque procédurale de **350 intrigues × 100 scènes = 35 000 scènes**, accessible sur `novelas.html`.

## Architecture

- `romance/novelas.mjs` : bibliothèque ES module sans dépendances et sans réseau. Expose `getStory(story)`, `getScene(story, chapter)`, `getSceneById(id)`, `allScenes()`.
- `novelas.html` : lecture des intrigues, navigation et export JSON d'une scène.
- `tests/novelas.test.mjs` : tests de cardinalité, identifiants, bornes et continuité.

Toutes les entrées ont un identifiant **stable**, une phase relationnelle, une humeur fictionnelle, une initiative, une narration, des dialogues, des choix suggérés et des liens de continuité. On peut régénérer ou enrichir les scènes individuellement sans casser leurs références.

**Limite littéraire importante** : il s'agit de combinaisons procédurales de trames répétables, pas de 35 000 scènes uniques écrites à la main, ni de 350 novelas abouties. L'étape suivante est de rédiger manuellement des arcs complets et d'ajouter un système de conséquences de choix, de mémoire consentie et de non-répétition.

## Portée / sécurité

Personnages fictifs adultes uniquement ; romance mature, sensualité non explicite, autonomie, consentement et limites. Aucune mémoire personnelle, aucun jeton ni historique privé n'est publié. Les humeurs sont des états fictionnels, pas des sentiments de l'IA. Les initiatives automatiques et les notifications ne sont **pas** actives.

## Développement

```sh
node --test tests/novelas.test.mjs
```

Pour intégrer la bibliothèque au chat, relier une sélection explicite d'arc et un contexte narratif limité au moteur de réponse, puis enregistrer les choix sur un stockage privé avec consentement. Ne pas injecter les 35 000 entrées dans un seul prompt.
