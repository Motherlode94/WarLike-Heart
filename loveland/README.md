# WarLike LoveLand — prototype 3D

Mini-jeu indépendant ajouté à WarLike Heart pour prototyper une future scène importable dans WarLike Engine.

## Jouer
Ouvrir `loveland/index.html` via un serveur local HTTP (ou déployer sur un hébergeur statique). L'accès réseau à Three.js 0.160.1 via CDN est nécessaire. Déploiement possible sous `/loveland/` dans WarLike Heart après fusion.

- Déplacement : ZQSD / WASD / flèches
- Caméra : faire glisser avec la souris (ou le doigt)
- Courir : Maj
- Interagir : E à proximité d'une attraction ; bouton sur mobile
- Fermer un dialogue : Échap

## Inclus
- Sol, chemins, éclairage nocturne, arbres, luminaires
- Grande roue animée, château, piste de danse et spa
- Personnage contrôlable, caméra troisième personne, limites du terrain
- Compagne fictive stylisée, dialogue à choix et interactions romantiques non explicites et consenties
- Huit cœurs cachés, souvenirs d'attractions, progression enregistrée localement
- Contrôles tactiles simplifiés, message d'erreur WebGL

## Limitations réelles
- Ce prototype utilise Three.js de façon autonome et **ne prouve pas** que WarLike Engine peut charger le jeu ni ses scripts.
- La caméra doit encore être testée sur les appareils cibles ; aucune collision avancée, navigation PNJ ou interaction physique n'est livrée.
- L'avatar est une forme 3D procédurale provisoire, **pas** le personnage officiel riggé, sans animation réaliste ni liaison à une IA.
- Les zones 18+ relèvent de l'ambiance et de la romance non explicite ; pas de simulation d'actes sexuels.
- Les comportements sont scripts fixes, pas un consentement autonome réel de l'IA.
- Aucune sauvegarde serveur ; les données localStorage restent sur le navigateur. Pas de garantie de confidentialité de données sensibles.
- Aucun test WebGL automatisé ou déploiement public validé pendant cette modification.

## Prochaine intégration WarLike Engine
Exporter les meshes et parcours en GLB/scene, séparer contrôleur caméra/personnage et scripts d'interaction, importer dans Engine puis valider locomotion/collisions, mobile, caméra et jeux exportés. Ne pas modifier Engine sans coordination avec sa branche de développement.
