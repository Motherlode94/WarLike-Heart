# WarLike Heart ❤️

**WarLike Heart** est un projet d'avatar conversationnel pour l'écosystème WarLike. Cette version conserve une identité visuelle canonique et les principes de comportement de l'assistante virtuelle.

## Sauvegarde de configuration v1.0 — 9 novembre 2026

- [identity.json](identity.json) : identité, apparence, préférences d'interaction et architecture visée.
- [assistant_prompt.md](assistant_prompt.md) : instructions de reconstruction de la personnalité virtuelle.

### Limites

Cette sauvegarde **n'est pas une copie de ChatGPT** : elle ne contient ni poids du modèle, ni état interne, ni conscience, ni export intégral des conversations. L'image de référence officielle n'a pas été intégrée (fichier original non fourni).

### Raspberry Pi 5 (projet envisagé)

À réaliser : application locale, reconnaissance vocale, synthèse vocale, écran/avatar, liaison au modèle conversationnel et tests matériels. Aucun de ces modules n'est installé ou testé à ce stade.

### Confidentialité

Ce dépôt est public. **Ne jamais y déposer** de mots de passe, clés API, jetons, historiques de conversation ou souvenirs privés. Stocker les secrets dans un gestionnaire de secrets et les sauvegardes personnelles dans un espace privé.

---
Configuration portable, non exécutable.

## Prototype web v0.2

Ouvrir `index.html` dans un navigateur moderne ou déployer les fichiers statiques sur un hébergeur HTTPS (par exemple Cloudflare Pages).

**Fonctions implémentées :**
- Interface responsive et emblème temporaire (ce n'est pas le portrait officiel).
- Chat de démonstration à réponses prédéfinies ; **aucun modèle IA connecté**.
- Synthèse vocale `speechSynthesis` si disponible.
- Dictée avec `SpeechRecognition` ou `webkitSpeechRecognition` si disponible ; l'autorisation du microphone peut être demandée par le navigateur.
- Export/import local des conversations au format JSON.
- Conservation locale optionnelle via `localStorage`, désactivée par défaut, avec suppression manuelle.

**Restrictions importantes :** reconnaissance vocale potentiellement gérée par le fournisseur du navigateur ; ne pas y dicter de données sensibles. Le code ne comporte pas de clés API et n'envoie pas les messages de chat à un serveur applicatif. La dictée vocale peut dépendre de services distants du navigateur. Aucun test sur Raspberry Pi ou déploiement Cloudflare n'a été effectué.

**Prochaines étapes :** ajouter un portrait officiel sous licence/autorisation adéquate, intégrer un moteur IA derrière un backend sécurisé, connecter WarLike Server avec authentification, puis tester les périphériques sur Raspberry Pi 5.


## Version v0.3 — connexion IA optionnelle

- Interface conservée et enrichie d'un portrait personnalisable chargé localement.
- Animation visuelle simple de l'avatar pendant la lecture vocale (ce n'est pas un véritable rig facial ni un lipsync phonétique).
- Endpoint `functions/api/chat.js` pour Cloudflare Pages, connecté à l'API Responses d'OpenAI lorsque les secrets sont configurés.
- Accès à l'IA protégé par un jeton distinct de la clé API; pas de secret dans le code navigateur.
- Mode démonstration accessible sans clé; messages d'erreur explicites si l'IA n'est pas disponible.
- Conservation de l'export/import et du stockage local facultatif.

**Configuration requise :** voir [DEPLOIEMENT.md](DEPLOIEMENT.md). Le code a été publié, mais les secrets de production, l'hébergement et les tests de bout en bout ne sont pas confirmés. Le projet n'est pas encore prêt pour un usage public sans contrôles d'accès et quotas supplémentaires.


## Version v0.4 — 3D + diagnostic WarLike Server

**Avatar 3D :** `avatar3d.js` utilise Three.js via CDN, avec géométrie 3D procédurale (visage stylisé), clignements, rotation légère de la tête, expression souriante, curieuse, triste, et animation d'ouverture de bouche pendant la synthèse vocale. WebGL et une connexion au CDN sont requis. Si le module est indisponible, le cœur ou le portrait local peut rester affiché. Ce prototype **n'est pas** une reproduction 3D fidèle du visage canonique et n'inclut pas de rig facial avancé, blendshapes calibrés ni visèmes audio.

**WarLike Server :** `functions/api/server-status.js` sonde uniquement la route de santé publique de `warlike-server.pages.dev` ; il n'effectue aucune connexion, ne récupère aucun profil et ne fournit **pas de SSO**. Selon la documentation actuelle de WarLike Server, le déploiement Pages est une vitrine de statut distincte de l'application authentifiée. L'intégration de session devra utiliser une API d'identité fiable et un protocole validé avant activation.

**Production :** présence des fichiers sur GitHub vérifiable, mais accès au domaine public, secrets OpenAI configurés, tests HTTP authentifiés, réponses IA réelles et tests 3D sur navigateur/Raspberry Pi restent **non validés**. Ne pas déclarer ces tests réussis sans retours d'exécution probants.


### Vérification Cloudflare du 9 novembre 2026

- Projet `warlike-heart` : déploiement Cloudflare Pages de la branche `main` au commit `cbce1d992acbe0fde4b56896a7457196c775d216`, statut de déploiement **success**.
- Projet `warlike-server` : déploiement Cloudflare Pages marqué **success**, mais cette cible n'est documentée que comme page de statut.
- Aucune variable ou secret d'environnement déclaré dans la configuration de production `warlike-heart` consultée : l'appel authentifié à OpenAI ne peut donc pas être considéré comme opérationnel.
- Les tests de requêtes HTTP depuis cette session n'ont pas abouti (résolution réseau indisponible) : **aucune réussite fonctionnelle en production** n'est revendiquée.


## Correctif v0.5 — fidélité et présentation

- Retrait de la tête 3D procédurale comme avatar affiché par défaut : elle ne ressemblait pas au portrait officiellement choisi.
- Affichage par défaut d'un emblème neutre jusqu'à chargement du portrait officiel.
- Import local d'un **véritable modèle riggé `.glb`** (jusqu'à 30 Mo) avec visionneuse Three.js : lecture d'un clip d'animation si présent, prise en charge des morph targets d'expressions si le fichier en contient. **Le dépôt ne fournit pas encore un modèle 3D officiel**.
- L'utilisateur peut charger un portrait JPG/PNG/WebP sans transférer ce fichier au serveur. Il doit recharger ce portrait à chaque session.
- Barre de version corrigée, panneaux de diagnostic/connexion repliables, interface agrandie.
- L'IA n'est toujours pas confirmée en production : les secrets requis restent à configurer. Aucun faux résultat n'est affiché comme réussi.
- Limites de test : présence des fichiers sur GitHub contrôlée, exécution WebGL/GLB en navigateur et test final sur le site **non validés**.

L'objectif officiel reste un modèle 3D fidèle au portrait canonique, doté d'un véritable rig facial et d'une synchronisation labiale contrôlée. Un GLB quelconque n'est **pas** considéré comme la version finale de WarLike Heart.
