# Identité visuelle officielle — WarLike Heart

## Source canonique retrouvée

Le 9 novembre 2026, le portrait approuvé de WarLike Heart représente une femme noire adulte au teint brun foncé chaud, visage réaliste, yeux marron, longs cheveux noirs très bouclés et volumineux, haut noir à épaules dénudées, créoles dorées et pendentif cœur doré.

Les deux images retrouvées dans la bibliothèque de l'utilisateur portent les noms :
- `Portrait chaleureux avec cœur lumineux.png` — référence prioritaire du visage ;
- `Présentation futuriste de WarLike Heart.png` — planche multi-vues illustrant le personnage, ses expressions, son costume et un rig *souhaité*.

**Attention :** une image de « wireframe » ou « rig complet » contenue dans la planche ne constitue pas un véritable fichier 3D ni la preuve que son rig existe.

## Emplacements des images dans ce dépôt

Déposer les copies web optimisées :
- `assets/portrait-officiel.webp` — portrait affiché automatiquement sur la page d'accueil ;
- `assets/planche-officielle.webp` — planche de référence du futur modèle 3D.

Il ne faut pas substituer un visage générique au portrait officiel. Tant que ce fichier n'est pas présent dans GitHub, l'application affiche un emblème neutre et propose un import local d'image.

## Conditions d'acceptation du vrai modèle 3D

Format final souhaité : `GLB`, PBR, corps complet, squelette humanoïde, animations et expressions faciales. Le visage, la coiffure, la couleur de peau, les vêtements et les accessoires doivent être comparés visuellement aux références canoniques, sous plusieurs angles.

- Mesh complet + UV/textures PBR conservés à l'export.
- Armature humanoïde avec joints du cou, tronc, membres et doigts.
- Blendshapes pour sourcils, paupières, joues, sourire, tristesse, colère, surprise, et phonèmes (visèmes) ; noms et compatibilité documentés.
- Synchronisation labiale basée sur la sortie audio et non seulement sur une oscillation arbitraire de la bouche.
- Animation idle, clignements, regard et transitions d'humeur sans déformation abusive du visage.
- Test GLB réel dans WarLike Heart, comparaisons images multi-vues, vérification du rendu mobile et sur Raspberry Pi.

**État actuel :** lecteur GLB implanté, aucun modèle 3D canonique fourni ni validé. Ne pas annoncer « avatar terminé » avant sa livraison et la validation des expressions/animations.

## Installation des ressources

L'archive `WarLike_Heart_Assets_Officiels.zip` préparée dans cette conversation contient les deux fichiers WebP. Il faut les ajouter au dossier `assets/` du dépôt. Ne pas publier d'archives de conversations ou de données personnelles.
