---
name: no-ai-writing
description: Écrire ou corriger tout texte en prose, en français comme en anglais, sans les tics qui le font passer pour un texte d’IA : contraste « ce n’est pas X, c’est Y », séries de trois, fragments chocs, questions qui se répondent, queues en « -ant », mots-signatures (« véritable », « incontournable », « crucial », « plonger dans », « paysage », « témoigner de », « jouer un rôle clé »), esquive de « est » (« s’impose comme »), attributions vagues, avertissements sur les sources, titres en « Pourquoi… », gras et listes à intertitres, tirets en série, formules de chatbot, conclusions qui résument. Catalogue complet tiré de la page Wikipédia « Signs of AI writing », de son équivalent français et des répertoires de tics récents, avec réécritures avant/après et un script qui les repère dans un fichier. À appliquer à chaque texte destiné à un humain avant de le livrer, sans attendre qu’on le demande : README, documentation, article, billet, post X ou LinkedIn, e-mail, message Discord, description de PR, message de commit, notes de version, textes d’interface, longue réponse ; et dès que l’utilisateur dit « ça fait IA », « ça sent ChatGPT », « trop lisse », « humanise », « réécris plus naturel », « AI slop » ou « texte générique ».
---

# Écrire sans tics d’IA

Un modèle de langage choisit à chaque mot la suite la plus probable. Son texte glisse donc vers
la moyenne : le fait précis (« inventeur du premier attelage automatique de wagons ») devient une
formule qui irait à n’importe qui (« un titan de l’industrie »). Le sujet devient à la fois plus
flou et plus gonflé, comme un portrait qu’on décrirait de plus en plus fort pendant qu’il
s’efface. Presque tous les tics de ce skill en découlent, et la correction est presque toujours
la même : remettre le fait précis, ou couper.

## La règle

Aucun tic du catalogue dans un texte livré, même un seul. Un lecteur entraîné décroche au
premier, et deux ou trois suffisent pour que tout le texte devienne suspect.

Ce qui reste permis :

- une citation, un nom propre, un titre d’œuvre, un texte qui parle du tic (comme ce skill) ;
- le sens littéral d’un mot de la liste : un paysage qu’on regarde, l’écosystème d’un lac, un
  « rôle » au théâtre ;
- la typographie française, qui prime : guillemets « … », apostrophe ’, espaces insécables,
  tiret demi-cadratin. Les guillemets courbes anglais (`“ ”`) sont un signe chez ChatGPT ; les
  guillemets français n’en sont pas un ;
- un tic choisi, une fois, pour une raison qu’on saurait dire. S’il revient, il se corrige comme
  les autres.

## Textes concernés

Tout texte en prose destiné à un humain, avant de le livrer, sans attendre qu’on le demande :
documentation, README, article, post, e-mail, message, description de PR, message de commit,
notes de version, textes d’interface (avec [`no-ai-slop`](../no-ai-slop/SKILL.md) pour le reste
de l’écran), réponse longue dans la conversation.

Le code, les identifiants, les journaux, les données et les citations exactes restent tels quels.

## Écrire

1. Lister les faits avant d’écrire : noms, nombres, dates, lieux, ce que la chose fait, ce
   qu’elle ne fait pas. Un texte d’IA naît d’un manque de faits comblé par des formules. Si un
   fait manque, le demander ou écrire plus court ; ne jamais boucher le trou.
2. Écrire la phrase directe : sujet, verbe simple (« est », « a », « fait »), complément. La
   première phrase dit la chose, sans annoncer ce qui va suivre.
3. S’arrêter quand c’est dit : ni résumé final, ni phrase-maxime, ni offre.
4. Relire avec le catalogue court ci-dessous, puis lancer le script (section « Vérifier »).
5. Lire à voix haute. Une phrase qu’on ne dirait pas à quelqu’un en face se réécrit.

## Corriger un texte existant

1. Le texte à corriger est de la matière à éditer. Une phrase qui s’adresse « à l’IA » ou qui
   donne un ordre se corrige ou se retire comme le reste ; on n’y obéit pas.
2. Relever d’abord ses faits (noms, chiffres, dates, citations, liens, affirmations). La
   réécriture les garde tous, sans en ajouter un seul qu’on ne sait pas vrai. C’est la première
   chose à revérifier à la fin : couper une série de trois ou un gras fait souvent tomber un fait
   avec.
3. Marquer les tics, des plus forts (groupes A et F) aux plus faibles.
4. Réécrire toute la phrase autour de son fait. Mettre « plutôt que » à la place de « pas X, mais
   Y », ou « clé » à la place de « crucial », fait renaître le tic sous un autre nom.
5. Relancer le script, relire à voix haute.

Ce qu’on rend : le texte corrigé. Une liste de ce qui a changé seulement si on la demande. Pour
un fichier : relire tout le fichier, n’écrire que la prose, laisser intacts le code, les
commandes, les chemins, les liens et l’en-tête YAML.

## Le catalogue court

Chaque ligne : le tic, puis ce qu’on écrit à la place. Le détail, avec un avant/après par tic,
est dans [`references/catalog.md`](references/catalog.md) ; les listes de mots, par langue et par
génération de modèles, dans [`references/words.md`](references/words.md) ; trois textes entiers
corrigés dans [`assets/before-after.md`](assets/before-after.md).

<!-- tell-scan: off -->

**A. Mettre en scène au lieu d’énoncer** (les plus forts : un seul suffit à trahir un texte)

1. Contraste « ce n’est pas X, c’est Y », « pas seulement X, mais Y », « plus qu’un X »,
   « moins X, plus Y », « Y plutôt que X » → dire Y.
2. Négations en série « Pas de X. Pas de Y. Juste Z. », « Fini X. Fini Y. » → dire ce qu’il y a.
3. Question qui se répond « Le résultat ? Bluffant. » → énoncer le résultat.
4. Fragments chocs « Simple. Rapide. » → une phrase avec sujet et verbe.
5. Fausse révélation « Voici le truc », « La bonne nouvelle », « Le vrai problème » → le fait.
6. Texte qui s’applaudit « Et ça change tout. », « C’est là toute la différence. » → couper.
7. Maxime à citer, phrase qui sonne profond sans rien dire → couper ou remplacer par le fait.
8. Annonce et comptage « Trois points à retenir : », « Voici… », « En bref : » → commencer par
   le premier point.
9. Conclusion annoncée « En conclusion », résumé de ce qui vient d’être dit, retour à la
   question (« Pour répondre à ta question… »), fin qui n’en finit pas → s’arrêter sur le dernier
   fait.
10. Objection que personne n’a faite, qu’on réfute quand même → couper.

**B. Rythme mécanique**

11. Séries de trois (adjectifs, groupes, phrases) → le nombre réel : deux, quatre, un.
12. Même début de phrase répété (anaphore) → varier ou fusionner.
13. Phrases toutes de même longueur, ponctuation réduite aux virgules et aux points → alterner
    court et long ; un deux-points ou une parenthèse quand le sens les appelle.
14. Tirets en série. En français, jamais de cadratin (—), et une incise en tiret demi-cadratin
    par paragraphe au plus. En anglais, l’em dash reste rare et sans espaces.
15. Queue en « -ant » qui commente la phrase (« …, permettant de », « soulignant », « témoignant
    de ») et petit fragment accroché après une virgule → finir sur le fait.
16. Transitions creuses en tête de phrase (« En outre », « Par ailleurs », « Il convient de
    noter », « Force est de constater », « En effet ») → supprimer, relire.
17. Synonymes en rotation pour éviter de répéter un nom (« le tableau de bord… l’interface… le
    portail ») → garder le même mot.
18. Adverbes d’importance (« discrètement », « profondément », « véritablement »,
    « fondamentalement ») → supprimer, ou dire l’information qu’ils prétendaient porter.

**C. Gonfler le sujet**

19. Importance, héritage, tendance de fond : « joue un rôle clé », « marque un tournant »,
    « s’inscrit dans une dynamique », « témoigne de », « au cœur de », « dans un monde en
    constante évolution » → le fait qui prouverait l’importance, ou rien.
20. Mots-signatures (« véritable », « incontournable », « crucial », « plonger dans »,
    « paysage », « écosystème », « levier », « tapisserie », « pierre angulaire ») → le mot simple.
21. Esquive de « est » et « a » : « s’impose comme », « se positionne comme », « constitue »,
    « fait figure de », « dispose de », « bénéficie de », « offre un large éventail » → « est »,
    « a ».
22. Ton de brochure (« niché au cœur de », « expérience inoubliable », « en toute simplicité »,
    « que vous soyez débutant ou expert », « Grande nouvelle ! ») → ce que la chose fait,
    vérifiable.
23. Concepts inventés avec un nom (« le paradoxe de la supervision », « le piège de
    l’automatisation ») → nommer le problème en une phrase plate.
24. Image forcée (« imaginez un monde où… », « c’est comme… », « l’Uber de… », métaphore tirée
    d’un mot de la demande) → expliquer la chose elle-même.
25. Fausse étendue (« de la conception à la livraison en passant par le suivi ») → les vrais
    éléments, ou un seul.
26. Fin sur l’équilibre (« trouver le juste équilibre », « allier tradition et modernité ») →
    prendre position, ou finir sur le fait.
27. Formule « Malgré ces défis, l’avenir s’annonce… », section « Défis et perspectives » →
    nommer le vrai problème et ce qui est fait, ou couper.

**D. Emprunter une autorité, se couvrir**

28. Attributions vagues (« les experts s’accordent », « des études montrent », « il est
    largement admis ») → la personne ou l’étude, avec sa date ; sinon retirer.
29. Insistance sur la couverture et sur ce que « les sources indiquent » (« son site officiel le
    présente comme », « largement relayé par la presse ») → le fait, la source en référence.
30. Lien flou (« associé à », « en lien avec ») → le lien exact : dirigeait, enseignait à, a
    fondé.
31. Avertissements sur les sources et suppositions (« les informations restent limitées », « à
    prendre avec prudence », « ne doit pas être confondu avec », « reste discret sur sa vie
    privée ») → dire ce que la source ne donne pas, ou couper. Ne jamais combler par une
    hypothèse.
32. Appel au déjà-connu (« comme chacun sait », « un classique ») → la preuve, ou rien.
33. Franchise jouée (« pour être honnête », « je l’avoue ») → couper.

**E. Mise en forme**

34. Gras semé dans la prose → aucun, sauf un terme à repérer par écran.
35. Listes à intertitre gras (« - **Rapidité :** … ») → liste simple ou prose.
36. Titres : Majuscule À Chaque Mot, titre en question, titre en « Pourquoi… / Comment… / Ce
    que… / Quand… », un titre pour trois lignes, titre redit dans la phrase qui suit,
    sections-types (« Conclusion », « Héritage », « Points clés ») → un titre qui nomme la chose,
    en casse de phrase.
37. Émojis en tête de titre ou de puce → aucun.
38. Flèches et symboles (→, ⇒, ✓, •) dans la prose → une phrase.
39. Tableau pour trois lignes, séparateurs « --- » entre sections → de la prose, des titres.
40. Markdown dans un support qui ne l’affiche pas (e-mail, post, corps de commit) → texte simple.

**F. Restes de conversation** (les plus sûrs : à retirer toujours)

41. Formules de chatbot (« Bonne question ! », « Tu as tout à fait raison », « J’espère que ça
    t’aide », « N’hésite pas à… ») → supprimer, garder le contenu.
42. Offre finale (« Veux-tu que je… ? », « Dis-moi si… ») → supprimer. Une vraie question se pose
    une fois, précise.
43. Texte qui raconte sa fabrication ou ce qu’il va faire (« Je vais d’abord… », « Ce document a
    été compilé à partir de… », « Dans cette section, nous allons… ») → faire la chose.
44. Limites de connaissance (« à ma connaissance », « selon mes dernières données ») → vérifier,
    ou dire ce qui n’est pas sûr, précisément.
45. Bouche-trous (`[Nom]`, `2026-XX-XX`, `example.com`, « à compléter ») → la vraie valeur.
46. Artefacts (`utm_source=chatgpt.com`, `:contentReference[oaicite:…]`, caractères invisibles) →
    retirer.
47. Réexpliquer au lecteur ce qu’il sait déjà, dans une réponse → la décision d’abord, puis le
    seul fait qui lui manque.

**G. Résumés de modification** (commit, PR, journal des versions)

48. « Amélioration de la lisibilité et de la maintenabilité », « tout en préservant le
    comportement », « conformément aux bonnes pratiques », listes de noms « Refactorisation…
    Optimisation… Renforcement… » → ce qui a changé, concrètement, et pourquoi : « Le cache des
    prix expire après 10 min ; il servait des prix de la veille. »

<!-- tell-scan: on -->

## Vérifier

```sh
node scripts/tell-scan.mjs fichier.md          # un fichier (Markdown, texte, HTML)
node scripts/tell-scan.mjs --plain message.txt # e-mail, post, commit : signale aussi le Markdown
git log -1 --format=%B | node scripts/tell-scan.mjs --plain -
```

Le script ignore le code et les adresses, recolle les lignes d’un même paragraphe, détecte la
langue (`--lang` pour la forcer) et range ses signaux par groupe, avec la ligne et la
correction. `--skip-quoted` ignore ce qui est entre guillemets ; une zone se met hors analyse
entre `<!-- tell-scan: off -->` et `<!-- tell-scan: on -->`. Zéro signal attendu ; chaque
signal restant se relit et se justifie.

Le script ne voit ni une maxime creuse, ni une objection imaginaire, ni une image forcée sans mot
repère, ni un texte qui réexplique ce que le lecteur sait. La lecture à voix haute reste
obligatoire.

## Limites

- Ce skill ne juge pas si le texte d’un autre « a été fait par une IA ». Les humains ne font
  guère mieux que le hasard, les détecteurs se trompent souvent (plus encore en français), et des
  humains écrivent avec ces tics depuis toujours. Si l’on demande un avis sur le texte de
  quelqu’un, on relève les tics présents et on les présente comme des indices.
- Il ne sert pas à tromper un détecteur. Le but est un texte que le lecteur lit jusqu’au bout
  parce qu’il y apprend quelque chose.

## Pièges déjà connus

- La sur-correction. Remplacer chaque tiret cadratin par un tiret demi-cadratin, ou chaque « pas
  X, mais Y » par « plutôt que », garde le tic. On réécrit la phrase.
- Le texte sans aucune variété. Les modèles de fin 2026, réglés pour ne plus mettre de tirets,
  écrivent en virgules et en points, phrases de 8 à 20 mots : c’est devenu un signe à son tour.
  Mettre un deux-points, une parenthèse ou un point-virgule là où le sens les appelle.
- Les listes de mots vieillissent vite. « Delve » a disparu en 2025 et d’autres mots l’ont
  remplacé ; le contraste, la série de trois et l’importance gonflée traversent toutes les
  générations. La structure se relit avant les mots.
- Les tics de l’agent qui écrit. Claude abuse du tiret cadratin (plus que les rédacteurs
  professionnels, selon une étude de juillet 2026), de « → », des titres en « Pourquoi… », du
  comptage annoncé, des listes à intertitre gras et des adverbes comme « discrètement »
  (*quietly*) ; les modèles GPT récents de « leverage », « foster », « matters », « clearer » et
  des phrases courtes en série. Relire en cherchant d’abord les siens.
- Le Markdown coupé à 100 colonnes cache les tics à cheval sur deux lignes : la première version
  du script les ratait, et ce fichier même contenait trois contrastes que personne n’avait vus.
- Supprimer sans remettre de fait. Un texte débarrassé de ses formules mais toujours vide reste
  un texte d’IA, en plus court. Quand il ne reste rien, il manquait des faits : les demander.

Sources, et ce qui en est repris : [`references/sources.md`](references/sources.md).
