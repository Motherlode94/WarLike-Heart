# WarLike Heart v0.3 — mise en service (Cloudflare Pages)

## Déploiement

Déployer le dépôt `Motherlode94/WarLike-Heart` sur **Cloudflare Pages avec intégration Git**. Conserver la racine du dépôt comme répertoire de sortie statique (pas de commande de build). Les fichiers `functions/api/chat.js` sont automatiquement traités en fonction Pages lorsque le projet est déployé depuis Git.

> Un hébergement statique seul (GitHub Pages, ouverture de `index.html`, etc.) n'exécute pas la fonction `/api/chat`.

## Secrets obligatoires

Dans Cloudflare Dashboard → Workers & Pages → projet Pages → Settings → Variables and Secrets, créer, pour l'environnement de production :

- `OPENAI_API_KEY` : clé API du fournisseur OpenAI, enregistrée comme **Secret**.
- `HEART_ACCESS_TOKEN` : secret d'accès aléatoire d'au moins 20 caractères, distinct de la clé API. Enregistrer comme **Secret**.
- `HEART_MODEL` : variable de texte facultative, valeur par défaut `gpt-4.1-mini`.

Ne jamais déposer ces valeurs sur GitHub ni les ajouter à `app.js`, `index.html` ou à un export JSON. Les secrets ne peuvent pas être générés par le site. Après configuration, redéployer pour garantir leur disponibilité.

## Utilisation

1. Ouvrir le site Pages en HTTPS.
2. Saisir `HEART_ACCESS_TOKEN` dans le champ de connexion privée.
3. Envoyer un message et attendre la réponse IA. Sans jeton, le chat fonctionne uniquement en **mode démo**.
4. Charger éventuellement l'image officielle à partir d'un fichier PNG, JPEG ou WebP (5 Mo maximum) : l'image reste dans cette session du navigateur; elle n'est pas publiée ni synchronisée.
5. Activer la lecture vocale si le navigateur prend en charge `speechSynthesis`. La dictée dépend du support `SpeechRecognition`.

## Confidentialité, sécurité et limites

- Le jeton saisi est **conservé uniquement en mémoire de la page** et envoyé en en-tête HTTPS aux requêtes vers la fonction. Il n'est ni copié dans le dépôt, ni dans `localStorage`, ni dans les exports.
- En mode IA, les **20 derniers messages** au maximum sont envoyés à la fonction et au fournisseur IA. `store:false` est demandé au fournisseur, sans garantie d'absence absolue de conservation ou de journaux selon ses politiques.
- Les conversations ne sont sauvegardées dans le navigateur que si l'option locale est activée. Les exports sont des fichiers non chiffrés; les conserver en lieu sûr.
- La fonction refuse les appels sans jeton; elle n'a pas d'authentification WarLike Keys/Server, de limitation de débit distribuée ni de quotas par utilisateur. **Réserver à un usage personnel ou restreindre l'accès au site et ajouter une limitation de débit Cloudflare avant toute ouverture multi-utilisateurs.**
- La fonction vérifie l'origine des requêtes de navigateur, mais cette vérification n'est pas un mécanisme d'authentification indépendant.
- Ce prototype utilise une synthèse vocale de navigateur; il ne fournit pas une vraie synchronisation lèvres-phonèmes, ni un modèle 3D riggé.
- État vérifié le 11 novembre 2026 : `/api/chat` répond `aiConfigured:false` en production. Les secrets `OPENAI_API_KEY` et `HEART_ACCESS_TOKEN` ne sont donc pas configurés pour l'environnement vérifié; aucune réponse IA distante n'a été testée.
- Le projet Pages Heart a ses fonctions activées, le binding `WARLIKE_SERVER` vers `warlike-server-runtime`, le binding D1 `HEART_DB`, le bucket `HEART_AVATARS` et le secret de session Heart. `GET /api/account` répond `available:true, connected:false`.
- `GET /api/server-status` confirme la santé publique de WarLike Server. Un échange PKCE de test invalide a été refusé en HTTP 401, ce qui confirme que la route d'échange et le transport interne répondent; aucune connexion réelle de compte n'a été tentée.
- Les tests automatisés du dépôt ont passé localement (79/79). Cela ne valide pas l'interface en navigateur réel, l'IA distante, ni le flux complet d'association.
- Aucun Raspberry Pi n'est disponible dans cette session : les essais matériel, micro, haut-parleur et écran restent à faire.

## Test manuel minimal

1. Sans jeton → réponse locale de démonstration.
2. Avec faux jeton et fonction active → HTTP 401 et erreur visible, sans simulation de réponse IA.
3. Avec secrets configurés et jeton exact → réponse IA via `/api/chat`.
4. Charger un portrait → vérifier son affichage et les effets visuels quand la voix parle.
5. Exporter/importer → confirmer la restauration de l'historique sans jeton.
6. Désactiver la mémoire locale puis effacer → confirmer la suppression de l'historique stocké.
7. Tester dictée et lecture vocale sous Chrome/Edge et vérifier les autorisations.


## Mise en service restant à faire

1. Ajouter `OPENAI_API_KEY` comme secret Cloudflare Pages et définir `HEART_ACCESS_TOKEN` comme secret aléatoire distinct d'au moins 20 caractères. Ne pas envoyer ces valeurs dans le chat ni les committer.
2. Redéployer, vérifier `/api/chat` (`aiConfigured:true`), puis tester une réponse avec le jeton exact. Sans ces secrets, le mode IA reste fermé et l'application demeure en mode local.
3. Effectuer une association réelle avec un compte WarLike de test; vérifier consentement, cookie de session, déconnexion, expiration du code, réutilisation refusée et absence de transmission de mot de passe.
4. Tester la navigation, le micro, la synthèse vocale et les panneaux privés dans un navigateur réel.
5. Reprendre la même liste de contrôles sur Raspberry Pi 5 quand l'appareil sera disponible.
