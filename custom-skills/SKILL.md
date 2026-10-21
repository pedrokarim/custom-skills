---
name: custom-skills
description: Le dépôt « custom-skills » de l'utilisateur, sa bibliothèque personnelle de skills réutilisables, proposés dans tous les projets. À utiliser dès que l'utilisateur parle de « custom skill(s) », de « mes skills », veut savoir quels skills il a, veut transformer ce qu'on vient de faire en skill (« fais-en un skill », « garde ce procédé », « ajoute-le aux custom skills »), créer, corriger, renommer ou mettre à jour un de ces skills, ou y reporter un piège appris en chemin ; même s'il ne dit que « le dossier des skills » ou « notre truc de skills ».
---

# Custom skills

`custom-skills` est un dépôt git public : un dossier par skill, chacun relié par une jonction
dans `~/.claude/skills` (Claude Code) et `~/.agents/skills` (Codex). Ce qu'on modifie dans le
dépôt est donc immédiatement à jour partout ; il n'y a rien à copier.

## Trouver le dépôt

Le dépôt est le dossier **parent de la cible** de la jonction de ce skill :

```powershell
Split-Path (Get-Item "$HOME\.claude\skills\custom-skills").Target
```

Toujours travailler dans ce dossier, jamais dans `~/.claude/skills` : ce n'est qu'un lien.

Lire son `README.md` pour la liste des skills et ce que fait chacun.

## Ajouter un skill

1. **Partir d'un procédé qui a marché**, pas d'une idée. Un skill écrit avant d'avoir réussi
   décrit ce qu'on croit, pas ce qui fonctionne.
2. Créer `<nom>/SKILL.md`. Le nom : anglais, minuscules, tirets (`site-indexing`), identique
   au champ `name`.
3. Écrire l'en-tête avec soin, c'est **lui seul** qui décide si le skill sera proposé :
   ```yaml
   ---
   name: <nom>
   description: <ce qu'il fait>. À utiliser dès que <situations, mots que l'utilisateur
     emploierait>, même si <la demande ne cite pas les mots évidents>.
   ---
   ```
   Une description vague (« aide pour le SEO ») n'est jamais choisie. Lister les situations
   concrètes et les formulations réelles.
4. Le corps : le procédé, **avec le pourquoi de chaque étape**, et les erreurs déjà commises.
   Ce qui est long va dans `references/`, ce qui doit s'exécuter à l'identique dans `scripts/`,
   les exemples de résultat (bons et mauvais) dans `assets/`.
5. Ne rien publier de privé : le dépôt est public. Pas de nom de client, pas d'adresse, pas de
   clé, pas de chemin personnel ; « le site d'origine » suffit pour raconter une leçon.
6. Ajouter une ligne au tableau du `README.md`.
7. Lancer `./install.ps1` à la racine du dépôt : il crée les jonctions et vérifie l'en-tête.
   Un skill ajouté n'est proposé qu'à partir de la **session suivante**.
8. Commiter et pousser (message en français, aucun co-auteur ni signature d'assistant).

## Mettre à jour un skill

Quand un piège nouveau apparaît en utilisant un skill, l'ajouter **dans le skill**, pas
seulement dans la mémoire du projet : c'est le seul endroit que relira la prochaine session,
quel que soit le projet. Puis commiter et pousser.

Renommer ou supprimer un skill : déplacer ou supprimer son dossier, puis relancer
`./install.ps1`, qui retire les liens devenus orphelins.

## Langue

Prose, commentaires et messages : français. Noms de dossiers, de fichiers, de fonctions et de
variables : anglais, sans exception.
