# R25 — périmètre et validation

Les cinq phases sont cumulatives. Fusionner 01, 02, 03, 04 puis 05. Chaque PR cible main. Aucun nouveau compte, secret ou service payant n’est requis pour les outils natifs et la recherche locale.

## Fonctionnement

- Calcul : grammaire arithmétique bornée, nombres rationnels BigInt, aucun eval. Affichage de dix décimales maximum ; un résultat non décimal fini est arrondi. Pourcentages, budgets explicitement en euros, conversions par facteurs fixes et températures. Les monnaies étrangères sont refusées.
- Logique : propositions nommées et règles Horn avec négation explicite. Provenance des preuves, pas de raisonnement par absence, contradictions signalées. Les contraintes comparent des valeurs affectées ; ce n’est pas un solveur symbolique ni une preuve sur le monde réel.
- Mémoire : 100 messages récents + 160 extraits maximum (400 caractères, 80 Ko cumulés). Synthèse extractive, coupes signalées, aucune promotion vers des faits approuvés. Persistance sur consentement local, export/import et sauvegarde Cloud manuelle existante. La limite globale Cloud reste 190 Ko ; un gros corpus d’apprentissage peut empêcher une sauvegarde. Réduire le contenu ou exporter localement dans ce cas.
- Sémantique : Transformers.js 2.17.2, MiniLM multilingue à révision `2c4055b12046f11709e9df2c122e59ffbdc2f900`, ONNX quantifié CPU/WASM, moyenne normalisée et cosinus. Jusqu’à 1 200 extraits, cache des vecteurs en RAM, déchargé à l’arrêt ou à la réinitialisation du contexte. Les poids publics peuvent rester en cache navigateur. Le bouton autorise des téléchargements, pas un envoi des conversations à une API. Hors ligne complet non certifié. Seuil de similarité heuristique de 0,35, aucune probabilité de vérité.
- Réponses : contrôles de format, répétition lors d’une reformulation, tutoiement, égalités numériques isolées, certaines déclarations d’actions externes. Une réparation maximum. La vérité générale reste non vérifiée ; un échec persistant est affiché « À vérifier ».

## Vérifications du 27 novembre 2026

- Suite Node : calcul exact, refus des entrées exécutables et unités incompatibles, preuves/contradictions, archive bornée et sauvegardes privées, vecteurs simulés et annulation, contexte de réparation borné, API distante avec réparation et contrôles d’accès.
- Navigateur Chromium 131 : outils natifs sans charger Qwen ; éviction d’un ancien budget, récupération après rechargement, mémoire sur consentement ; adaptateur sémantique simulé ; réponse numérique erronée réparée en deux appels maximum ; échec persistant signalé ; rapport JSON de cas fixes ; écrans desktop/mobile. Les appels Qwen et Cloud sont simulés et aucun POST de conversation n’est envoyé.
- Essai **réel** de MiniLM sur CPU/WASM : « Quel est mon salaire mensuel ? » retrouve « Ma rémunération est de 2 200 euros chaque mois. » devant un passage sur la couleur d’une maison. Similarité observée environ 0,561. Runtime et poids publics réellement téléchargés, aucune simulation de vecteur pour cet essai. Il s’agit d’un cas de paraphrase, pas d’un benchmark exhaustif des synonymes français.
- L’inférence Qwen WebGPU réelle, les conversations longues libres et la qualité du raisonnement génératif ne sont pas certifiées ici. Reprendre `LOCAL_MODEL_VALIDATION.md` sur le matériel cible.

## Reproduire

```sh
node --test tests/*.test.mjs
node tests/local-chat.browser.cjs
# Opt-in : télécharge le runtime et le modèle public, CPU uniquement
HEART_RUN_SEMANTIC_MODEL=1 node tests/semantic-model.browser.cjs
```

Playwright et Chromium sont requis pour les scripts navigateur. `HEART_TEST_CHROMIUM_PATH` sélectionne un navigateur installé. Le script réel utilise HTTPS_PROXY lorsqu’il existe ; le test de cet environnement a utilisé le proxy disponible et une exception de certificat de test. Cette exception n’est pas dans l’application.

Depuis Mon compte → Cerveau, « Exécuter les cas fixes » produit neuf vérifications natives/de câblage ; le dixième cas de paraphrase ne s’exécute que si MiniLM est chargé. Le rapport indique les cas non exécutés et `generativeModelCertified: false`. Les neuf premiers cas ne mesurent pas les réponses d’un modèle génératif.
