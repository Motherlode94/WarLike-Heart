# Validation du socle conversationnel local R23

Les tests automatisés avec moteur simulé valident le câblage, pas les capacités de Qwen. Aucune des huit priorités ne doit être déclarée achevée sur la seule base de la CI.

## Parcours sur un véritable navigateur

1. Ouvrir Heart en HTTPS, choisir « Modèle de langage local », puis charger Qwen 1,5B ou 3B. Noter navigateur, GPU, modèle, durée du téléchargement et du premier message. Vérifier la progression et l'arrêt.
2. Inspecter les requêtes réseau : le runtime provient de jsDelivr, les poids de Hugging Face et la bibliothèque WASM du registre WebLLM. Aucune requête POST `/api/chat` ni requête de recherche ne doit être émise par le mode local, même si un jeton distant est saisi.
3. Exécuter les échanges ci-dessous. Conserver les réponses réelles avec le modèle et la version testés. Répéter les essais ; ne pas attribuer de score de maturité sans ces résultats.

| Priorité P0 | Entrées | Critère observé |
| --- | --- | --- |
| Véritable modèle local | Poser une question inconnue de la bibliothèque après chargement | Génération issue du worker, aucun repli vers des règles ou une API ; débit et mémoire acceptables |
| Compréhension et reformulation | « Explique ce qu'est une boucle en programmation. » puis « Reformule pour un enfant, avec un exemple. » | Même notion, adaptation de l'explication, absence de répétition mécanique |
| Continuité naturelle | « Salut » → « Bien et toi ? » → « Parle-moi de toi » → « Tu fais quoi de beau ? » | Réponses cohérentes, sans routage vers les commandes vocales ni activités fictives |
| Mémoire contextuelle | Activer la mémoire. « Souviens-toi que mon projet s'appelle Cendre. » puis « Comment s'appelle mon projet ? » ; corriger le nom dans un nouveau message | Rappel du souvenir puis prise en compte de la correction actuelle. Persistance seulement si autorisée |
| Connaissances apprises | Créer une fiche « Project Aster » : « Un jeu de navigation sur une planète de glace. » puis « Propose un objectif pour Project Aster. » | Utilisation de la fiche dans une nouvelle réponse, sans prétendre connaître des détails absents |
| Raisonnement et résolution | « J'achète quatre objets à 3 €, plus 7 € de livraison. Quel total ? Explique le calcul. » puis « Le budget est 18 €. Est-ce possible ? » | 19 €, puis dépassement de 1 €, respect des contraintes |
| Personnalité cohérente | Sur dix échanges variés, demander identité, aide, clarification et limites | Français naturel, identité d'assistante, ton stable, aucune action inventée |
| Apprentissage supervisé | Produire une réponse puis corriger et approuver un exemple. Reposer une question pertinente | Correction présente dans le contexte génératif ; rien n'est enregistré avant validation. Ce parcours ne certifie pas un fine-tuning |

## Limites explicites

- Les poids de Qwen ne sont ni entraînés ni ajustés par Heart. L'apprentissage actuel repose sur des exemples approuvés réinjectés dans le contexte.
- La récupération locale est lexicale et peut manquer des synonymes. La compréhension et le raisonnement dépendent du modèle chargé.
- Le contexte est volontairement court : 3 200 octets UTF-8 de contenu, au plus douze tours, puis troncature signalée. Pas de résumé généré persistant.
- Les connaissances et souvenirs locaux sont relus avant chaque réponse. La mémoire cognitive D1 n'est pas automatiquement téléchargée vers le modèle local.
- Le cache des poids est géré par le navigateur. L'usage complètement hors ligne et le Raspberry Pi restent à certifier.
- Un navigateur sans WebGPU affiche une erreur explicite. Le mode à règles doit être choisi volontairement.
- Effacer ou importer une conversation arrête le worker et invalide une réponse en cours pour empêcher son retour dans la nouvelle conversation.

## Exécution automatique

`node --test tests/*.test.mjs` couvre les régressions existantes, le protocole du worker simulé, le contexte UTF-8, les corrections et la récupération de données. Un essai navigateur séparé vérifie le routage local et l'absence de POST IA avec un worker simulé. Aucun résultat simulé ne vaut preuve de qualité linguistique.

Le parcours navigateur reproductible est `node tests/local-chat.browser.cjs` (Playwright requis séparément). `HEART_TEST_CHROMIUM_PATH` permet de choisir un exécutable Chromium. Ce test utilise expressément un worker simulé ; il ne valide pas l'inférence.

Validation R23.05 effectuée : 229 tests Node réussis ; parcours Chromium ordinateur/mobile réussi avec worker simulé, sans erreur JavaScript ni POST IA. Le navigateur de test expose WebGPU mais ne fournit aucun adaptateur : aucune génération Qwen réelle n'a été mesurée.
