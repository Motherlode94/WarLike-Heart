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

## Extension GLB et chat IA (branche LoveLand)

- `extras.js` permet d'importer localement un GLB de 30 Mo maximum. Le fichier doit avoir un `SkinnedMesh` et des os ; les clips d'animation embarqués sont lus. Un GLB quelconque n'est pas certifié comme avatar officiel et aucune validation du visage canonique n'est faite automatiquement.
- Le bouton « Parler avec Heart (IA) » accède au même `/api/chat` que WarLike Heart. Configurer les secrets Cloudflare `OPENAI_API_KEY` et `HEART_ACCESS_TOKEN` (20 caractères minimum) **côté serveur**. Fournir seulement le jeton privé dans l'interface, jamais la clé OpenAI. Le jeton est conservé uniquement en mémoire JS de la page. Les messages de cette session sont conservés seulement en mémoire et ne sont pas enregistrés localement par LoveLand.
- Les dialogues de démonstration restent disponibles sans serveur IA. L'interface refuse de présenter une réponse prédéfinie comme une réponse IA.
- Les importations GLB ne sont pas sauvegardées ; il faut recharger le fichier à chaque visite. Le module ne retargete pas les animations, ne confirme pas la compatibilité des morph targets et ne transforme pas l'IA en être conscient.

## Validation technique

La branche est vérifiée par le workflow GitHub « Verify WarLike Heart », mais celui-ci ne prouve ni le rendu de LoveLand, ni les animations GLB, ni l'accès authentifié à l'API. Un **test manuel réel dans Chrome/Edge** reste nécessaire.

### WarLike Engine

Le jeu est actuellement un prototype Three.js distinct. Le moteur WarLike utilise ses propres documents de scènes, son runtime et Rapier ; une compatibilité native ne doit pas être revendiquée sans conversion de la scène et tests du format exporté. Conserver les modifications sur WarLike Heart jusqu'à cette validation et ne pas toucher au code de WarLike Engine.
