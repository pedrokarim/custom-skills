# Composer les images

## Ordre de travail

1. **Inventaire de l'officiel** : mascotte détourée (PNG/WebP avec alpha), avatar, emblème,
   illustrations existantes, vraies captures. Vérifier le canal alpha avant de s'en servir.
2. **Plan de la composition** : une phrase par calque (fond, lumière, décor, personnage, objets,
   premier plan), avec la place et l'échelle de chacun dans le cadre final.
3. **Pièces manquantes seulement** : générer ce qui n'existe pas, une pièce par image.
4. **Assemblage** : en HTML/CSS (calques positionnés, `object-fit`, masques) quand la page le
   permet ; sinon un script d'empilement (Pillow, sharp) gardé à côté de la maquette.
5. **Contrôle** : la composition à sa vraie taille dans la page, dans les deux thèmes.

## Générer une pièce

- Joindre l'officiel en référence de **style et de palette**, et l'écrire : « pour la palette
  seulement, ne pas dessiner le personnage ».
- Décrire la place que la pièce occupera (« le personnage sera posé devant, au centre, sur 70 % de
  la hauteur : laisser cette zone calme »).
- Toujours : aucun personnage si le personnage vient de l'officiel, aucun texte, chiffre, logo,
  filigrane, interface.
- Fond chroma `#00FF00` pour un objet à détourer ; ombres et particules à l'intérieur du cadre.
- Une famille d'objets homogène : planche 3 × 3 puis découpe, plutôt que neuf générations.

## Erreurs déjà faites

- Une illustration générée d'un bloc, personnage compris, dans un style qui n'était pas celui de
  la mascotte : refusée. Le personnage se pose, il ne se redessine pas.
- Une capture d'écran du site utilisée comme « illustration » d'annonce : refusée. Une
  illustration est une composition ; la capture ne sert que de preuve produit, si on la demande.
- Des décors générés alors que l'utilisateur voulait seulement l'officiel découpé : demander
  avant de générer quand l'officiel suffit.
