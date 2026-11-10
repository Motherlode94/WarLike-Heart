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

## Diagnostic WarLike Server — état réel des dépendances

Le bouton « Tester le serveur » appelle depuis la fonction Cloudflare Pages de Heart `https://warlike-server.pages.dev/api/health`. Il distingue maintenant route absente (HTTP 404), application non prête (HTTP 503), erreur réseau, réponse inattendue et santé confirmée (JSON `{service:'warlike-server',ready:true}`). Un simple déploiement Cloudflare réussi ou une page HTML publique **ne confirme pas** que les comptes WarLike sont disponibles. Aucun utilisateur n'est authentifié par ce test. Lier réellement Heart aux comptes exige un flux d'identité sécurisé séparé ; aucun jeton ni clé ne doit apparaître dans le code client.

## Association de compte WarLike Server — intégration en préparation

Un nouveau bouton « Associer mon compte WarLike » et un état de connexion temporaire ont été ajoutés dans les paramètres de Heart. L'association suit un flux d'autorisation explicite **PKCE SHA-256**, sans demander de mot de passe dans Heart :

1. Heart crée un vérificateur secret et un défi PKCE dans la session du navigateur, puis ouvre `https://warlike-server.pages.dev/connect/heart`.
2. Sur WarLike Server, le membre se connecte et accepte explicitement l'association. Un code à usage unique expirant après 2 minutes est enregistré en D1 (`drizzle/0007_heart_pairing.sql`).
3. Le code revient dans le **fragment** de l'URL de Heart et le navigateur le transmet à l'endpoint Heart `POST /api/account` avec le vérificateur original.
4. La fonction Heart échange le code via le serveur et émet un cookie signé `HttpOnly; Secure; SameSite=Lax`, limité à **10 minutes**, qui identifie le compte. `GET /api/account` retourne seulement l'identité affichable de session. `DELETE /api/account` déconnecte Heart.

**Prérequis d'activation** : le runtime WarLike Server doit être reconstruit/déployé avec les routes, sa migration D1 doit être appliquée, et le secret `HEART_SESSION_SECRET` de **32 caractères ou plus** doit être ajouté uniquement dans les secrets du projet Cloudflare Pages WarLike Heart. En l'absence du secret, l'endpoint est fermé par défaut et l'interface indique que l'association n'est pas configurée.

Ce premier niveau associe une identité temporaire, **pas** les comptes ChatGPT ni les cookies du serveur, et **ne synchronise pas encore les messages ni les souvenirs**. La révocation d'une session WarLike Server après émission du cookie Heart n'est pas instantanée : le cookie expire au plus tard après 10 minutes. À compléter par une vérification active et un système de révocation pour toute fonctionnalité sensible. Aucun rôle « admin » hérité ne confère de privilèges sur Heart.

## Version v1.1 — association WarLike (préparée)

Le panneau « État de WarLike Server et association de compte » fournit l'association de compte par autorisation sur WarLike Server. Ce flux reste inactif tant que les secrets, migrations et endpoints du serveur ne sont pas disponibles. Il ne synchronise pas encore les souvenirs. Voir ci-dessus les prérequis d'activation et la limite de session de 10 minutes.

## Correctif : transport interne Cloudflare WarLike Server

Les fonctions `/api/server-status` et `/api/account` utilisent désormais le **service binding** Cloudflare Pages `WARLIKE_SERVER` pointant sur `warlike-server-runtime`. Cet appel interne remplace le `fetch('https://warlike-server.pages.dev/...')` qui pouvait échouer dans le réseau Worker. L'absence du binding est signalée sans repli externe ; une liste blanche limite les routes à `/api/health` et `/api/heart/exchange`. Le secret `HEART_SESSION_SECRET` reste requis.

Les tests de logique ne remplacent pas une vérification réelle du flux de connexion avec un compte WarLike.

## Version v1.2 — Mémoire Cloud privée, synchronisation manuelle

- Cloudflare D1 `warlike-heart-memory` (juridiction **EU**) : binding Cloudflare Pages `HEART_DB`.
- Table `heart_snapshots` isolée par l'identifiant WarLike issu d'une session Heart signée et limitée à dix minutes. **Aucune API de liste globale.**
- `GET /api/memory` : lecture de la seule sauvegarde du compte connecté.
- `PUT /api/memory` : sauvegarde de l'historique local (100 messages max), 40 souvenirs, 500 dialogues, 500 connaissances ; taille maximale 190 Ko ; protection de conflits par révision atomique. Rien n'est transmis sans action explicite.
- `DELETE /api/memory` : suppression de la sauvegarde Cloud après confirmation, sans supprimer les données locales.
- Import manuel de la sauvegarde Cloud **avec confirmation**. Les données locales existantes ne sont jamais fusionnées automatiquement ; exporter un JSON avant restauration évite de perdre une version.
- Les écritures exigent origine HTTPS identique et cookie de session Heart valide et signé. Le serveur ne prend jamais l'identifiant du propriétaire depuis le corps de la requête.
- Aucun chiffrement de bout en bout : Cloudflare et le code serveur disposent du texte des données. Ne pas stocker de secrets personnels.
- La synchronisation n'est **pas automatique** et le cloud ne réplique pas les portraits HD/GLB ni les données des autres applications WarLike. Les sessions Heart expirent après 10 minutes.
- Valider en navigateur réel avec **deux comptes distincts**, puis sur deux appareils ; CI ne garantit pas les autorisations réelles.

## Rafraîchissement CSS v1.2.1

Thème responsive dans `heart-design.css` (chargé après les anciens styles intégrés pour éviter de toucher au comportement). Harmonisation des couleurs rose/prune, contraste du chat, du portrait, des paramètres, de Learning Brain et de la mémoire Cloud. Mise en page tablette et téléphone, états de survol/clavier, mouvements réduits et messages longs mieux adaptés. Aucune modification des données, identifiants ou API. Le titre reste v1.2 : cette mise à jour est visuelle.

## Version v1.3 — Navigation et niveaux d'accès

L'interface n'affiche plus tous les panneaux d'un coup : elle comprend les sections **Conversation**, **Mon compte**, **Cerveau**, **Mémoire Cloud** et **Atelier privé**. Les onglets s'adaptent à la session WarLike autorisée par `GET /api/account`.

- **Public** : portrait et conversation locale de démonstration, accès à Mon compte pour se connecter et consulter les options générales. Aucune sauvegarde Cloud ni information d'un compte tiers.
- **Compte associé (owner, referent ou member)** : Cerveau personnel et Mémoire Cloud, sauvegardes manuelles, paramètres du compte.
- **Opérateur (owner ou referent)** : Atelier privé, import et suppression du portrait HD, import de modèles GLB, champ de jeton API facultatif.
- Les onglets réservés sont masqués tant que le serveur ne confirme pas la session ; une session expirée retire l'accès aux écrans privés au prochain contrôle. Le navigateur recontrôle à chaque retour sur l'onglet.
- **Sécurité** : masquer un panneau n'est pas une autorisation ! Les fichiers CSS/JS restent publics ; `/api/memory` continue à vérifier le cookie signé, le compte et l'origine sur le serveur. `/api/chat` exige toujours le jeton serveur privé. Les outils locaux de l'Atelier ne publient pas d'API de modification distante.
- Si l'utilisateur utilise le moteur local sans compte, les données restent uniquement dans le navigateur, sous son contrôle. Les fonctions privées nécessitent une session WarLike.

### Correctif d'espacement 1.3.1
La mise en page initiale laissait des hauteurs minimum de 730 à 800 px et trop d'espaces vides autour du portrait et du chat. Le fichier `compact-layout.css` chargé en dernier supprime ces hauteurs contraintes, réduit la navigation, les marges, le portrait, les panneaux et les formulaires ; à largeur tablette/mobile, le portrait devient une vignette à gauche de la présentation. Le chat garde une zone défilante. Les menus et contrôles d'accès existants restent inchangés.

## Version v1.4 — Espace 3D glamour

- Onglet public **Espace 3D** : scène WebGL indépendante du chat, couleurs prune et or rose, éclairage cinématique et socle 3D, contrôle OrbitControls (souris/tactile), zoom, recentrage, visage/en pied, rotation automatique, animation idle et plein écran.
- **Un seul moteur 3D** : le visualiseur existant `avatar3d.js` est déplacé entre le portrait de l'accueil et l'Espace 3D lorsqu'on change de menu ; pas de double rendu ni de copie d'avatar. Les réglages d'import GLB restent dans **Atelier privé** réservé aux comptes owner/referent.
- Aucun fichier GLB/VRM officiel n'est fourni par le dépôt. Tant qu'un véritable GLB n'est pas importé, l'espace montre **le portrait canonique 2D explicitement identifié comme tel**, avec un décor 3D derrière. Il ne faut pas présenter cette image comme un avatar 3D riggé.
- Import GLB temporaire dans la session du navigateur : les fichiers 3D ne sont pas automatiquement publiés, synchronisés ni conservés entre sessions ; le visualiseur refuse les GLB de plus de 30 Mo.
- Navigation publique `#space3d` et interface responsive ; des dépendances Three.js externes sont nécessaires pour le WebGL. En cas de chargement impossible, le portrait 2D reste affiché.

## Version v1.5 — Publication durable de l'avatar officiel 3D

Un dépôt R2 privé `warlike-heart-avatar`, lié au projet Pages via `HEART_AVATARS`, stocke le modèle officiel sous la clé fixe `official/avatar.glb`. `GET /api/avatar` sert le GLB en lecture seule aux visiteurs. `PUT /api/avatar` et `DELETE /api/avatar` nécessitent une session Heart signée, non expirée et un rôle WarLike `owner` ou `referent`, avec contrôle de l'origine HTTPS. Les GLB dépassant 30 Mo et les entêtes GLB invalides sont rejetés ; l'origine n'est jamais une simple autorisation d'écriture.

Dans **Atelier privé**, le responsable sélectionne un fichier GLB (30 Mo maximum), puis confirme **Publier l'avatar 3D**. Cette action le rend visible à tous dans **Espace 3D**. Les visiteurs ne peuvent pas publier de modèle. Le visualiseur charge automatiquement la version publiée lorsqu'on ouvre Espace 3D.

Le modèle Meshy reçu le 10 novembre 2026 a été étudié : original de 102 Mo, environ 1,88 M de sommets, trois textures intégrées, **sans skin ni animations**. Une version Web optimisée de 23,5 Mo a été préparée hors dépôt et doit être importée dans l'Atelier privé par un responsable ; aucun fichier binaire n'est intégré au dépôt GitHub. Ne pas affirmer que cet avatar est déjà publié ou animé tant que l'import R2 n'a pas été effectué et vérifié.

R2 n'est pas exposé directement sur un domaine public ; seule la lecture du modèle officiel est accessible via le site Heart. L'URL publique donne accès au modèle à tout visiteur : ne pas publier un GLB contenant des secrets ou des éléments privés.
