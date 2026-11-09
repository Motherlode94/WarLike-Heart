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
