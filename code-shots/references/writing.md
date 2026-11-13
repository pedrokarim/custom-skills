# Les textes d'une capture

## Sur la planche

- **Titre, deux lignes** : la première nomme la chose, la seconde dit ce qu'elle a de
  remarquable. « Un verrou / qui expire tout seul », « Six résolveurs / et le premier gagne ».
  Pas de nom de fonction dans le titre : le code le montre déjà.
- **Chapô, trois lignes au plus** : le problème, puis ce qu'il faut regarder. « Discord exige
  une réponse en trois secondes. Les quatre vérifications partent donc ensemble. »
- **Notes, une à trois** : chacune accrochée à une ligne en avant, une phrase, un mot en gras
  au plus (`**…**`). Une note dit ce que la ligne fait de non évident ; elle ne paraphrase pas
  le code.
- **Pied** : d'où vient le code (« le projet · API »), facultatif.

En français : espace insécable avant `: ; ! ?`, guillemets « » avec espaces insécables, pas de
tiret cadratin. Le code, lui, reste tel quel.

## La fiche d'accompagnement

Un fichier Markdown pour toutes les captures d'un article, une section par capture :

```markdown
## <titre de la capture>

![<texte alternatif court>](exports/<nom>.png)

Source : `<chemin>`, lignes <a> à <b>.

**Légende :** <une phrase>

**Texte alternatif :** <ce que fait le code, en une ou deux phrases, et la ligne mise en avant>

**Paragraphe :** <trois à cinq phrases prêtes à coller : le problème, l'idée, ce qu'elle évite>
```

## Relecture avant publication

- Aucune clé, aucun jeton, aucun mot de passe, aucune adresse, aucun nom de machine, aucun
  identifiant d'utilisateur réel, même en exemple dans un commentaire.
- Aucun défaut connu ni contournement de sécurité.
- Le code est celui du fichier, à la ligne près ; les numéros affichés sont les vrais.
- Le langage annoncé est le bon (un bloc Lua dans une chaîne TypeScript reste du TypeScript).
