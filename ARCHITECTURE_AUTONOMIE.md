# WarLike Heart — autonomie offline-first et notifications

## État vérifié du dépôt (10 novembre 2026)
- `app.js` dispose de règles locales limitées, d'un historique facultatif en localStorage et d'un export JSON.
- `functions/api/chat.js` propose une intégration OpenAI facultative via Cloudflare Pages Functions, non validée en production.
- `heart-initiatives.js` crée des invitations *simulées* tant que l'onglet est visible, toutes les 2/5/10 minutes, désactivées par défaut.
- Le dépôt ne contient actuellement ni modèle local, ni base d'apprentissage sémantique, ni vraies Web Push, ni authentification WarLike Keys effective.
- Ne pas stocker les conversations privées, préférences et clés dans ce dépôt **public**.

## Principe : ne pas dépendre d'une API IA payante pour répondre
**Niveau 1 (zéro IA générative)** : détecteur d'intentions + dialogues rédigés et validés (salutations, amour, projets, rappels, aide). Un petit corpus de centaines/milliers de dialogues peut alimenter les variantes. Les réponses inconnues déclenchent une question clarificatrice, jamais une réponse factuelle inventée.

**Niveau 2 (recherche)** : SQLite local ou Cloudflare D1, recherche plein texte FTS + synonymes/intentions, fiches de connaissances sourcées, conversation résumée avec accord. Ce système apprend au sens où il *enregistre* de nouveaux faits et corrections; il ne modifie pas automatiquement les poids d'un réseau neuronal.

**Niveau 3 (facultatif, IA locale)** : petit modèle open-weight exécuté sur le PC ou serveur personnel pour générer une réponse souple à partir de connaissances retrouvées (RAG). Utiliser une licence compatible, un budget RAM/CPU/GPU vérifié, et un fournisseur local tel qu'Ollama/llama.cpp selon la plateforme. Un Raspberry Pi 5 peut exécuter certains petits modèles quantifiés mais avec des performances à mesurer; ne rien promettre pour la voix temps réel sans benchmark. L'IA locale reste distincte du modèle GPT-6 de ChatGPT.

## Schéma de données proposé (SQLite local en priorité)
```sql
CREATE TABLE knowledge (
  id TEXT PRIMARY KEY, subject TEXT NOT NULL, content TEXT NOT NULL,
  source TEXT, verified INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE TABLE dialogue_examples (
  id TEXT PRIMARY KEY, intent TEXT NOT NULL,
  example_input TEXT NOT NULL, response TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'warm', approved INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE memories (
  id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, kind TEXT NOT NULL,
  content TEXT NOT NULL, consented INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE TABLE reminders (
  id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, title TEXT NOT NULL,
  due_at TEXT NOT NULL, delivered_at TEXT
);
```
La base doit être privée, chiffrée au repos selon la plateforme, sauvegardable et exportable; ajout et suppression des souvenirs sous contrôle utilisateur. Une « correction » utilisateur devient une donnée candidate à validation, et non une vérité publiée automatiquement.

## Exécution des réponses
1. Identifier l'intention du message.
2. Retrouver les faits dans la mémoire autorisée et la base de connaissances.
3. Si une réponse approuvée correspond, l'utiliser et varier éventuellement la formulation avec des règles.
4. Si un modèle local est disponible, lui transmettre uniquement les éléments pertinents et générer une réponse; éviter hallucinations et faux souvenirs.
5. Si aucun résultat fiable n'existe, le dire et demander une précision.
6. Journaliser les retours et corrections avec accord, sans entraîner silencieusement un modèle.

## Notifications autonomes : configuration choisie
- Les catégories sont `conversation`, `projects`, `reminders`, `affection`.
- Objectif 3 à 5 notifications par jour maximum (pas une obligation); 4 créneaux potentiels : **09:00, 12:00, 17:00, 20:00**, fuseau `Europe/Paris`.
- Aucune notification entre **23:00 et 08:00** et aucun envoi sans consentement explicite. Jamais de faux prétexte émotionnel pour pousser à répondre.
- `notifications/scheduler.mjs` contient dès maintenant la politique et un calcul de créneau *pur*, sans envoi réseau. `tests/notifications.test.mjs` définit les cas à valider.
- Pour recevoir des messages lorsque l'application est fermée, ajouter ultérieurement : `sw.js` + abonnement Web Push VAPID + Cloudflare Worker avec Cron Triggers + D1 + authentification fiable, journal d'envois atomique et désabonnement.
- Les notifications peuvent être générées par des modèles de phrases/intentions locaux, sans appel à OpenAI. Une vraie notification push dépend néanmoins de l'infrastructure push du navigateur et d'un serveur toujours disponible. Pour une autonomie *entièrement locale*, choisir une application native avec notifications OS et planificateur local; sur mobile les restrictions d'arrière-plan restent à tester.

## Validation avant publication
- Tester les règles de repos, quotas, passage heure été/hiver, désactivation, déduplication.
- Tester conservation et suppression des souvenirs; refuser toute fuite de données privées vers GitHub.
- Tester Chrome/Edge + Android, permissions push, onglet fermé, absence de connexion, reconnexion, iOS si ciblé.
- Ne pas annoncer une Web Push opérationnelle, un apprentissage de modèle ou une connexion WarLike Server avant validation réelle.
