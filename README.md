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


## Mise à jour v0.6 — identité canonique et transparence

Le portrait officiel a été retrouvé dans les fichiers personnels de l'utilisateur et optimisé pour le web, mais **il n'a pas encore été transféré dans le dépôt GitHub**. La page charge automatiquement `assets/portrait-officiel.webp` lorsqu'il est disponible ; sinon elle affiche un emblème provisoire avec option d'import local. Voir [ASSETS_OFFICIELS.md](ASSETS_OFFICIELS.md).

La planche illustrée retrouvée est une **référence visuelle** : elle n'est pas un véritable modèle 3D. L'import GLB reste disponible, mais aucun avatar 3D canonique fidèle n'est encore livré.

Un diagnostic `GET /api/chat` fournit `aiConfigured` sans révéler les secrets. Il ne remplace pas le test de conversation réelle : les secrets Cloudflare et l'authentification restent nécessaires.

Le workflow [.github/workflows/verify.yml](.github/workflows/verify.yml) vérifie la syntaxe du code et les éléments attendus, lorsqu'il est exécuté par GitHub Actions. Aucun résultat de workflow réussi n'est confirmé ici.


## Version v0.7 — portrait HD local

- Correction de l'agrandissement excessif du portrait miniature public : largeur plafonnée à 320 px et proportion native conservée.
- Bouton `Charger un portrait HD` : affiche une image PNG/JPEG/WebP de 5 Mo maximum sans transfert au serveur.
- Sauvegarde locale du portrait chargé dans IndexedDB avec restauration automatique sur ce même navigateur.
- Bouton `Retirer le portrait HD` : efface cette sauvegarde locale et revient au portrait de secours.
- La miniature **publique** embarquée dans GitHub demeure une image peu définie. Pour une qualité réellement HD sur tous les appareils, le propriétaire doit publier une image source haute résolution dans `assets/` et modifier son chemin ; l'amélioration de CSS seule ne peut pas restaurer les détails perdus.

La version HD a été préparée dans les fichiers du chat à partir du portrait original de 1199 × 1312 px. Sa publication binaire dans GitHub n'a pas encore été réalisée ; ne pas présenter le site public comme automatiquement HD.


## Version v0.8 — inspection du squelette et visèmes événementiels

- `avatar-rig.mjs` inspecte les os humanoïdes principaux et les morph targets présents dans le GLB importé.
- Le chargement affiche un diagnostic : maillages, nombre d'os, animations, os manquants et disponibilité des visèmes de base.
- Les expressions utilisent les morph targets existants du modèle. Aucun visage ni squelette n'est inventé si le fichier ne les contient pas.
- `SpeechSynthesisUtterance.onboundary` aligne approximativement les poses buccales sur la position du texte prononcé lorsque le navigateur fournit des événements. Sans ces événements, la bouche reste neutre au lieu d'afficher une oscillation arbitraire.
- Tests automatisés : `tests/avatar-rig.test.mjs`, exécutés dans GitHub Actions.

**Limites explicites :** les frontières de mots/caractères ne sont ni des timestamps de phonèmes ni une mesure audio. Ce module n'est **pas** un véritable lipsync phonétique avec alignement audio. Il faudra un moteur TTS retournant l'audio accompagné de visèmes horodatés, ou une analyse vocale appropriée. Un modèle GLB est toujours requis pour disposer d'un corps et d'un rig réels ; aucun GLB canonique complet n'est fourni. La validation de ressemblance au portrait officiel reste visuelle et manuelle. Tests WebGL en navigateur et sur Raspberry Pi encore non réalisés.

## Extension facultative — initiatives romantiques (prototype)

Le fichier `heart-initiatives.js` ajoute un panneau dans les paramètres de l'interface existante. L'utilisateur peut activer explicitement des invitations virtuelles spontanées (bisou, câlin, danse, discussion), choisir une fréquence de 2, 5 ou 10 minutes, accepter ou refuser chaque proposition et interrompre immédiatement le mode. Par défaut, **le mode est désactivé**.

Les propositions sont des scripts locaux et non des désirs autonomes de l'IA. Aucun mouvement de robot, appareil tactile, moteur ou capteur n'est commandé. Il n'y a pas de mémoire durable du réglage : le mode repart désactivé au rechargement. Le code ne déclenche pas de conversation distante. Test de structure et de sécurité : `tests/heart-initiatives.test.mjs`. Le comportement en vrai navigateur reste à vérifier.

## Moteur conversationnel local — première implémentation (PR #6)

Le script `local-brain.js` est exécuté dans le navigateur avant `app.js`. **Sans jeton d'accès à l'API**, il remplace les anciennes réponses génériques par des intentions reconnues (salutations, projets WarLike, affection fictive, voix, identité, mémoire) et un message explicite lorsqu'il ignore la réponse. Il ne nécessite pas de connexion IA pour **générer une réponse locale**, même s'il faut encore charger le site ou le conserver localement pour une utilisation hors ligne complète.

L'option « Conserver cette conversation et les souvenirs explicites sur cet appareil » est **désactivée par défaut**. Après activation, saisir :
- `Souviens-toi que je préfère la guitare` pour ajouter un souvenir explicite (40 maximum, 300 caractères chacun).
- `Que sais-tu de moi ?` pour afficher les souvenirs.
- `Oublie que je préfère la guitare` pour supprimer un souvenir exact.
- `Efface tes souvenirs` pour supprimer toute la mémoire explicite.

Ces souvenirs sont stockés dans `localStorage` sur **cet appareil uniquement** : aucun chiffrement n'est garanti, ils sont accessibles au profil local du navigateur, et ils ne sont pas synchronisés avec WarLike Server. Ne pas y enregistrer de secrets. La désactivation de l'option de conservation supprime l'historique et la mémoire explicite. L'export JSON contient désormais les souvenirs et doit être conservé en lieu sûr. L'import ne restaure les souvenirs que si la conservation est préalablement autorisée.

Ce module **n'est ni un LLM, ni un apprentissage neuronal, ni une base sémantique** : il n'invente pas de nouvelles connaissances et n'entraîne aucun modèle. Les réponses locales sont déterministes avec plusieurs variantes. La connexion à l'API distante reste facultative. Les notifications Web Push et le modèle local génératif nécessitent des développements séparés.

## Version v0.9 — visibilité du moteur local et actualisation du navigateur

- L'interface affiche explicitement le statut du moteur local et le numéro de version **v0.9** ; la page d'accueil du chat ne prétend plus être une démonstration dépourvue de moteur.
- Les scripts JS utilisent une URL versionnée (`?v=0.9`) afin d'éviter l'utilisation d'une ancienne version conservée en cache.
- `_headers` demande aux navigateurs et aux caches de revalider les pages HTML, et autorise un cache court et revalidable pour les scripts.
- En cas d'échec du chargement du moteur, l'interface affiche un diagnostic au lieu de laisser supposer qu'il fonctionne.
- Le moteur est à règles prédéfinies ; aucune conversation générative locale, aucune synchronisation cloud et aucun push réel ne sont ajoutés ici.
- Vérifier manuellement le chargement des scripts, la version et les réponses sur le domaine de production après le prochain déploiement.

## Version v1.0 — Learning Brain (local)

La page comporte un panneau **Cerveau & apprentissage**. Après activation explicite du stockage local, l'utilisateur peut enseigner des associations question/réponse et des fiches sujet/contenu, les consulter, supprimer des entrées, les exporter/importer au format JSON. Le chat consulte ces entrées en priorité avant les règles existantes, avec un rapprochement lexical simple et un rappel limité du dernier sujet. Les réponses inconnues restent signalées comme inconnues. La bibliothèque est limitée à 500 dialogues et 500 fiches, non chiffrée, locale au navigateur et supprimée avec les données personnelles de l'application ou lors de la désactivation du stockage. Ne pas stocker de secrets. Le dialogue local fonctionne sans appel au fournisseur IA, mais cela **n'est pas** un réseau neuronal entraîné, une compréhension sémantique profonde ou une synchronisation entre appareils. Les contenus appris sont saisis et validés volontairement, jamais capturés silencieusement. L'option de connexion distante reste présente.
