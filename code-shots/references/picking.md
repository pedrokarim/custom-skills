# Trouver les extraits qui valent une capture

## Ce qui fait une bonne capture

Un extrait mérite une capture quand un lecteur qui ne connaît pas le projet peut, en dix
secondes, comprendre **ce qu'il fait** et **pourquoi c'est malin**. Concrètement :

- **6 à 25 lignes**, une coupure `@@` au plus ;
- **autonome** : les noms suffisent à comprendre, sans aller voir trois autres fichiers ;
- **une idée** que l'on peut dire en une phrase ;
- **une surprise** : on s'attendait à autre chose, ou à plus long.

## Les familles qui marchent

| Famille | Ce qu'on cherche | Exemple d'idée |
|---|---|---|
| L'astuce | une solution courte à un problème qui paraît dur | un verrou distribué en trois lignes de Lua |
| Le contournement | un commentaire qui raconte un bug de bibliothèque ou de plateforme, et la parade | une reconnexion forcée toutes les 30 s parce qu'une socket ne se rouvre pas seule |
| La décision | un choix d'architecture visible dans le code | une chaîne de résolveurs où le premier qui sait répondre garde la demande |
| L'algorithme | un calcul vérifiable, joli à lire | un tirage au sort rejouable : graine, SHA-256, Fisher-Yates |
| La garde | une protection qui évite un vrai problème | un délai de deux secondes avant d'annoncer une musique, pour ne pas annoncer un échec |
| Le détail humain | du code qui pense à l'utilisateur | un alphabet de codes sans I, O, 0 ni 1 pour qu'on ne se trompe pas en les recopiant |
| La parole du code | une contrainte de plateforme expliquée en commentaire | des vérifications lancées en parallèle parce que Discord exige une réponse en trois secondes |
| Le front | une interaction visuelle courte | l'inclinaison 3D d'une carte qui suit le pointeur, en unités de conteneur |

## Ce qui ne marche pas

- Le gros service « central » : important, mais illisible hors contexte.
- La configuration (`tsconfig`, `docker-compose`, variables d'environnement) : rien à raconter,
  et souvent des noms internes.
- Les tests, sauf un test qui raconte à lui seul un bug célèbre.
- Le code générique qu'on trouve partout (un `fetch` avec `try/catch`, un middleware CORS).
- Tout ce qui montre une faiblesse, une clé, un hôte, un identifiant, ou un contournement de
  sécurité.

## Comment chercher

1. **Lire la doc du projet et l'historique** (`git log --oneline`) : les commits « fix » qui
   racontent une histoire pointent souvent vers le meilleur extrait.
2. **Chercher les commentaires qui expliquent un pourquoi** : `rg -n "parce que|because|workaround|contourne|sinon|otherwise|bug|hack|NB|attention" --type ts`.
3. **Chercher les petits algorithmes** : `sha256`, `random`, `seed`, `shuffle`, `Lua`, `eval(`,
   `Promise.all`, `AbortController`, `setTimeout(` avec un commentaire.
4. **Chercher les gardes** : fonctions courtes en tête de traitement (`if (!…) return`), listes
   blanches, limites.
5. Sur un gros dépôt, un agent d'exploration par domaine, avec cette grille et la consigne de
   rapporter : fichier, plages, lignes clés, l'histoire en une phrase, et le texte exact.
6. **Vérifier soi-même chaque extrait retenu** dans le fichier avant d'écrire la capture : les
   numéros de ligne bougent, un agent peut se tromper d'une ligne.

## Trier

Classer les candidats par « effet en article » : la surprise d'abord, la lisibilité ensuite,
la variété enfin (un extrait par domaine du projet). Huit à douze captures suffisent pour un
article ; au-delà, elles se répètent.
