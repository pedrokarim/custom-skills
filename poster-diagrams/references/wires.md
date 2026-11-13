# Les fils

`wire.js` lit `window.WIRES` et `window.LEGEND` une fois les polices chargées, trace les fils en
SVG au-dessus des nœuds, puis expose `window.checkBoard()` que `render.mjs` appelle.

## Un fil

```js
{
  from: 'api', fs: 'r', fo: 0.5,     // départ : data-id, côté (t r b l), position sur le côté (0 à 1)
  to: 'db',    ts: 'l', to2: 0.5,    // arrivée
  color: 'accent',                    // ink (défaut), accent, accent2, muted, ok
  dash: true,                         // pointillés
  both: true,                         // pointe aux deux bouts
  mid: 0.4,                           // position du coude entre départ et arrivée
  viaX: 958,                          // couloir vertical forcé (x absolu dans la planche)
  viaY: 616,                          // couloir horizontal forcé
  via: [[x, y], [x, y]],              // points de passage exacts
  label: 'deux\nlignes',              // étiquette, « \n » pour aller à la ligne
  lp: 0.5,                            // position de l'étiquette sur le fil (0 à 1)
  lo: [8, 4],                         // décalage de l'étiquette
  la: 'start',                        // ancrage du texte : start, middle (défaut), end
}
```

Les anciens noms `terracotta`, `violet` et `green` restent acceptés (= `accent`, `accent2`, `ok`).

## Le tracé

- Deux côtés horizontaux (`r` → `l`) : horizontale, coude à `mid`, verticale, horizontale. Même
  hauteur aux deux bouts : un trait droit.
- Deux côtés verticaux (`b` → `t`) : la même chose tournée.
- Un côté de chaque : un seul coude, en L.
- `viaX` : départ → couloir vertical → arrivée. Pour contourner une rangée de nœuds par
  l'intervalle qui les sépare.
- `viaY` : départ → couloir horizontal → arrivée. Pour passer sous ou au-dessus d'une rangée
  (`fs: 'b', ts: 'b', viaY` = sous les nœuds).
- Angles arrondis (rayon 12 px), trait arrêté 8 px avant la pointe.

## Placer une étiquette

- Sur un fil vertical : `lo: [8, 4], la: 'start'` (à droite du fil, centrée en hauteur).
- Sur un fil horizontal : `lo: [0, -8]` au-dessus (défaut), `lo: [0, 18]` en dessous.
- Sur un fil à coudes : `lp` choisit le segment (0,1 près du départ, 0,9 près de l'arrivée).
- Un écart de moins de 70 px entre deux nœuds ne porte pas d'étiquette.
- Les étiquettes ont un contour de la couleur du papier : elles restent lisibles sur un trait,
  pas sur un bloc.

## La légende

```js
window.LEGEND = [
  { color: 'ink', label: 'requêtes' },
  { color: 'accent', label: 'messagerie' },
  { color: 'muted', label: 'surveillance', dash: true },
  { color: 'accent2', label: 'production', thick: true },   // trait épais (lignes de métro)
];
```

Rendue dans `.legend` (créée si absente), en bas à gauche. Elle n'annonce que les encres
réellement utilisées ; une planche à une seule encre n'en a pas besoin.

## Le contrôle

`checkBoard()` renvoie `{ issues, notes }` :

| Défaut | Ce qui est mesuré |
|---|---|
| hors planche | un nœud, une zone, une légende qui dépasse la planche |
| contenu qui déborde | un nœud dont le contenu dépasse sa boîte (hauteur fixée trop petite) |
| chevauchement | deux blocs (nœuds, en-tête, légende, signature) qui se recouvrent |
| étiquette sur un bloc | une étiquette de fil ou de zone qui touche un bloc |
| étiquettes superposées | deux étiquettes qui se recouvrent |
| fil à travers un bloc | un segment qui traverse un nœud autre que ses extrémités (et ce qui les contient) |

Note : le nombre de croisements entre fils. Un seul, net, se tolère.

Ce qu'il ne voit pas : un fil qui longe un autre fil de trop près, une étiquette qui croise un
fil, un vide trop grand, un sens faux. D'où l'étape « regarder le PNG ».

Les nœuds `.bare` (texte sans cadre) ne comptent pas comme obstacles pour les fils, mais
comptent pour les chevauchements.
