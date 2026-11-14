#!/usr/bin/env node
// tell-scan : repère dans un texte les tics d'écriture typiques des IA (français et anglais).
//
//   node tell-scan.mjs fichier.md [autre.md…]      un ou plusieurs fichiers
//   node tell-scan.mjs - < texte.txt               le texte sur l'entrée standard
//
// Options :
//   --lang fr|en       force la langue (sinon détectée)
//   --plain            le texte part dans un support sans Markdown (e-mail, post, commit) :
//                      toute syntaxe Markdown est signalée
//   --skip-quoted      ignore ce qui est entre guillemets (« … », “ … ”, " … ")
//   --json             sortie JSON
//   --strict           code de sortie 1 s'il reste un signal
//
// Le code (blocs ``` et `en ligne`) et les adresses web sont ignorés. Une zone peut être exclue
// entre <!-- tell-scan: off --> et <!-- tell-scan: on --> (un catalogue qui cite les tics, par
// exemple).
//
// Un signal est un indice, pas une preuve : chaque entrée se relit, et se corrige en réécrivant
// la phrase autour de son fait, jamais en remplaçant le mot par un synonyme.

import { readFileSync } from 'node:fs';

const APOS = "['’]";
const LETTER = String.raw`\p{L}\p{N}_`;
const START = `(?<![${LETTER}])`;
const END = `(?![${LETTER}])`;
/** Un ou plusieurs motifs entourés de limites de mot compatibles avec les accents. */
const words = (...patterns) => `${START}(?:${patterns.join('|')})${END}`;
/** Début de phrase : début de ligne, ou après une ponctuation finale. */
const SENTENCE_START = String.raw`(?:^|(?<=[.!?…»]\s{1,3}))\s*`;

const GROUPS = {
  staging: 'Mise en scène au lieu d’énoncer',
  rhythm: 'Rythme mécanique',
  inflation: 'Gonflement',
  authority: 'Autorité empruntée et prudence de façade',
  format: 'Mise en forme',
  residue: 'Restes de conversation',
  commit: 'Résumés de modification (commit, PR, journal)',
  typo: 'Typographie',
};

// Chaque règle : id, groupe, langue (fr, en, any), libellé, correction, motifs.
// min : nombre d'occurrences à partir duquel on signale (1 par défaut : un seul suffit).
// countOnly : on donne le total et trois exemples au plus, sans lister chaque ligne.
const RULES = [
  // ── Mise en scène ────────────────────────────────────────────────────────────────────────
  {
    id: 'contrast', group: 'staging', lang: 'fr',
    label: 'Contraste « ce n’est pas X, c’est Y » (toutes ses formes)',
    fix: 'Dire Y directement. Un contraste réel se garde s’il corrige une erreur que le lecteur fait vraiment.',
    patterns: [
      String.raw`ce n${APOS}est pas[^.!?\n]{1,80}?[,;:–—-]\s*(?:c${APOS}est|mais)${END}`,
      String.raw`ce ne sont pas[^.!?\n]{1,80}?[,;:–—-]\s*(?:ce sont|mais)${END}`,
      String.raw`${START}(?:il|elle|ça|cela|on) n${APOS}(?:est|était|a|s${APOS}agit) pas[^.!?\n]{1,60}?[,;–—]\s*(?:il|elle|ça|cela|c${APOS}|mais)`,
      words(String.raw`pas (?:seulement|uniquement|juste|simplement|qu${APOS}une?)`, 'non (?:pas|seulement)'),
      words(String.raw`n${APOS}(?:est|était|sont|a) pas qu${APOS}une?`),
      words(String.raw`plus qu${APOS}une? (?:simple )?\p{L}+[^.!?\n]{0,30}?[,;:–—]`),
      words('plutôt que', 'au lieu de', String.raw`loin d${APOS}(?:être|un|une)`),
      String.raw`${START}moins (?:un|une|de|d${APOS})[^.!?,\n]{1,30}, plus `,
      String.raw`${START}pas [^.!?\n]{1,50}?,\s*mais${END}`,
    ],
  },
  {
    id: 'contrast', group: 'staging', lang: 'en',
    label: 'Contrast "it’s not X, it’s Y" (every form)',
    fix: 'Say Y. Keep a contrast only when it corrects a mistake the reader actually makes.',
    patterns: [
      String.raw`${START}it${APOS}?s not[^.!?\n]{1,80}?[,;:—–-]\s*(?:it${APOS}?s|but)${END}`,
      String.raw`${START}(?:is|are|was|were)n${APOS}t[^.!?\n]{1,60}?[,;—–]\s*(?:it${APOS}?s|they${APOS}re|but)${END}`,
      words('not (?:just|only|merely|simply)', 'rather than', 'instead of', 'more than (?:just )?an?', 'not because[^.!?\\n]{1,60}but because'),
      String.raw`${START}less [^.!?,\n]{1,30}, more `,
    ],
  },
  {
    id: 'negation-list', group: 'staging', lang: 'any',
    label: 'Liste de négations « Pas de X. Pas de Y. »',
    fix: 'Dire ce qu’il y a.',
    patterns: [
      String.raw`${SENTENCE_START}(?:pas de |pas d['’]|pas un |aucune? |sans |fini (?:les? |la |l['’])|no |not |zero )[^.!?\n]{1,40}\.\s+(?:pas de |pas d['’]|pas un |aucune? |sans |fini (?:les? |la |l['’])|place à |no |not |zero |juste |just |only |seulement )[^.!?\n]{1,40}\.`,
    ],
  },
  {
    id: 'reveal', group: 'staging', lang: 'fr',
    label: 'Révélation mise en scène, texte qui s’applaudit',
    fix: 'Énoncer le fait sans l’annoncer. Couper la phrase qui commente la précédente.',
    patterns: [
      String.raw`${START}(?:le|la) (?:résultat|hic|secret|problème|truc|piège|plus beau|pire|meilleur|verdict|bilan|constat|clé|réponse)\s?\?`,
      words('la (?:bonne|mauvaise) nouvelle', String.raw`voici (?:pourquoi|le truc|le hic|le secret|ce qui change|la vraie)`, 'spoiler'),
      words('le vrai (?:sujet|problème|enjeu|piège|travail|coût|défi|secret)', 'la vraie (?:question|raison|difficulté|force|valeur)'),
      words(String.raw`c${APOS}est (?:là|exactement|précisément) (?:que|tout|le point|ce qui)`, String.raw`c${APOS}est (?:toute )?la (?:différence|clé)`),
      words('et (?:ça|cela) change tout', 'soyons (?:clairs|honnêtes|francs)', String.raw`la vérité,? c${APOS}est`),
      words(String.raw`ce qui compte(?: vraiment)?(?:,|\s?:| c${APOS}est)`, 'et (?:ça|cela) compte', String.raw`personne n${APOS}en parle`, 'la partie que (?:tout le monde|personne)'),
    ],
  },
  {
    id: 'reveal', group: 'staging', lang: 'en',
    label: 'Staged reveal, self-applause',
    fix: 'State the fact without announcing it. Cut the sentence that praises the previous one.',
    patterns: [
      words(String.raw`here${APOS}s (?:the|a) (?:thing|kicker|catch|deal|truth|twist|secret)`, String.raw`here${APOS}s why`, 'the good news', 'spoiler'),
      String.raw`${START}the (?:result|catch|kicker|answer|twist|verdict|problem|secret)\s?\?`,
      words('the real (?:problem|issue|question|work|story|cost|reason)', String.raw`and that${APOS}s (?:the point|exactly|what|why)`, '(?:this|that|it) matters', String.raw`that${APOS}s the (?:difference|point|key)`),
      words('nobody talks about', String.raw`let${APOS}s be (?:clear|honest)`, 'the truth is'),
    ],
  },
  {
    id: 'preamble', group: 'staging', lang: 'fr',
    label: 'Préambule ou annonce de ce qui suit (« Voici… », « Trois points : »)',
    fix: 'Commencer par le premier point. Ne pas annoncer combien il y en a.',
    patterns: [
      String.raw`^\s*(?:voici|voilà)${END}`,
      String.raw`${START}(?:deux|trois|quatre|cinq|six|sept|\d+) (?:choses|points|raisons|leçons|constats|éléments|étapes|piliers|clés|questions|pistes|axes|contraintes|enseignements|idées|règles|erreurs|signes|façons|manières)${END}[^.!?\n]{0,50}?\s?:`,
      words('en (?:bref|clair)\\s?:', 'réponse courte\\s?:', 'concrètement\\s?[:,]', 'pour faire court', 'tl;dr'),
    ],
  },
  {
    id: 'preamble', group: 'staging', lang: 'en',
    label: 'Preamble, announcing what follows',
    fix: 'Start with the first point. Do not announce how many there are.',
    patterns: [
      String.raw`^\s*here(?:${APOS}s| is| are)${END}`,
      String.raw`${START}(?:two|three|four|five|six|\d+) (?:things|points|reasons|lessons|steps|pillars|takeaways|constraints|ideas|rules|mistakes|signs|ways)${END}[^.!?\n]{0,50}?\s?:`,
      words('short answer\\s?:', 'bottom line\\s?:', 'tl;dr', 'in short\\s?:'),
    ],
  },
  {
    id: 'conclusion', group: 'staging', lang: 'fr',
    label: 'Conclusion annoncée, résumé de ce qui vient d’être dit',
    fix: 'Finir sur le dernier fait concret. Pas de récapitulatif.',
    patterns: [
      String.raw`${SENTENCE_START}(?:en (?:conclusion|résumé|somme|bref|définitive|fin de compte)|pour (?:conclure|résumer|finir)|au final|bref|finalement|pour répondre à (?:ta|votre) question)${END}\s?[,:]?`,
    ],
  },
  {
    id: 'conclusion', group: 'staging', lang: 'en',
    label: 'Signposted conclusion, summary of what was just said',
    fix: 'End on the last concrete fact.',
    patterns: [
      String.raw`${SENTENCE_START}(?:in conclusion|in summary|to sum up|to summarize|overall|ultimately|all in all|at the end of the day|so,? to answer your question)${END}`,
    ],
  },

  // ── Rythme ───────────────────────────────────────────────────────────────────────────────
  {
    id: 'em-dash', group: 'rhythm', lang: 'fr',
    label: 'Tiret cadratin (—) en français',
    fix: 'Virgules, parenthèses, deux-points ou nouvelle phrase. Pas un tiret demi-cadratin à chaque fois : ce serait le même tic.',
    patterns: ['—', String.raw`(?<=\s)--(?=\s)`],
  },
  {
    id: 'em-dash', group: 'rhythm', lang: 'en',
    label: 'Spaced em dash ( — ) or double hyphen',
    fix: 'Use a comma, parentheses, a colon or a new sentence. An em dash, if any, takes no spaces.',
    patterns: [String.raw`\s—\s`, String.raw`(?<=\s)--(?=\s)`],
  },
  {
    id: 'ant-tail', group: 'rhythm', lang: 'fr',
    label: 'Queue en « -ant » qui commente la phrase (« …, permettant de »)',
    fix: 'Finir la phrase sur son fait. Si la conséquence compte, en faire une phrase avec son sujet.',
    patterns: [
      String.raw`,\s+(?:tout en |en )?` + words('permettant', 'garantissant', 'offrant', 'renforçant', 'soulignant', 'illustrant', 'reflétant', 'témoignant', 'contribuant', 'favorisant', 'marquant', 'consolidant', 'assurant', 'mettant en (?:lumière|avant|évidence|valeur)', String.raw`faisant (?:de|d${APOS}|ainsi)`, 'ouvrant la voie', 'posant les bases', 'incarnant', 'symbolisant', 'démontrant', 'révélant', 'traduisant', 'confirmant', 'valorisant', 'enrichissant', 'façonnant', 'redéfinissant', 'consacrant', 'cimentant', 'affirmant'),
    ],
  },
  {
    id: 'ant-tail', group: 'rhythm', lang: 'en',
    label: 'Trailing "-ing" analysis (", highlighting…")',
    fix: 'End the sentence on its fact. If the consequence matters, give it its own sentence.',
    patterns: [
      String.raw`,\s+` + words('highlighting', 'underscoring', 'emphasizing', 'ensuring', 'reflecting', 'symbolizing', 'contributing to', 'fostering', 'showcasing', 'cementing', 'solidifying', 'making it', 'paving the way', 'setting the stage', 'marking', 'demonstrating', 'illustrating', 'enhancing', 'reinforcing', 'signaling', 'positioning'),
    ],
  },
  {
    id: 'filler-transition', group: 'rhythm', lang: 'fr',
    label: 'Transition creuse ou ouverture pompeuse',
    fix: 'Supprimer et relire : si le sens tient, le connecteur était inutile. Sinon, un lien précis (« trois jours plus tard »).',
    patterns: [
      String.raw`${SENTENCE_START}(?:en outre|de plus|par ailleurs|d${APOS}autre part|qui plus est|de surcroît|à cet égard|en effet|effectivement|notons que|rappelons que|à noter(?: que)?)${END}`,
      words(String.raw`il convient de`, 'force est de constater', String.raw`il est à noter`, String.raw`il est (?:donc )?(?:important|essentiel|crucial|primordial|intéressant|utile|bon) de (?:noter|souligner|rappeler|comprendre|préciser|mentionner|garder à l${APOS}esprit)`, String.raw`il s${APOS}agit (?:ici )?de (?:comprendre|noter|souligner)`),
    ],
  },
  {
    id: 'filler-transition', group: 'rhythm', lang: 'en',
    label: 'Filler transition',
    fix: 'Delete it and reread. If a link is needed, make it specific.',
    patterns: [
      String.raw`${SENTENCE_START}(?:additionally|furthermore|moreover|importantly|notably|interestingly|in addition)${END}`,
      words(String.raw`it${APOS}?s worth noting`, 'it is worth noting', String.raw`it(?:${APOS}s| is) important to (?:note|remember|understand|recognize)`, 'it bears mentioning'),
    ],
  },
  {
    id: 'weak-transition', group: 'rhythm', lang: 'fr', min: 3, countOnly: true,
    label: 'Connecteurs en série (ainsi, toutefois, néanmoins, notamment…)',
    fix: 'Un connecteur par paragraphe au plus ; le plus souvent, l’ordre des phrases suffit.',
    patterns: [String.raw`${SENTENCE_START}(?:ainsi|toutefois|néanmoins|dès lors|notamment|par conséquent|cependant|enfin)${END}`, words('notamment')],
  },
  {
    id: 'weak-transition', group: 'rhythm', lang: 'en', min: 3, countOnly: true,
    label: 'Stacked connectors (however, therefore, thus…)',
    fix: 'One connector per paragraph at most.',
    patterns: [String.raw`${SENTENCE_START}(?:however|consequently|therefore|thus|hence|ultimately)${END}`],
  },
  {
    id: 'magic-adverb', group: 'rhythm', lang: 'fr',
    label: 'Adverbe d’importance (discrètement, profondément, véritablement…)',
    fix: 'Supprimer l’adverbe ; s’il portait une information, la dire (un chiffre, un exemple).',
    patterns: [words('discrètement', 'profondément', 'fondamentalement', 'véritablement', 'réellement', 'littéralement', 'résolument', 'intrinsèquement', 'incroyablement', 'remarquablement', 'indéniablement', 'assurément', 'sans conteste', 'considérablement', 'infiniment', 'pleinement')],
  },
  {
    id: 'magic-adverb', group: 'rhythm', lang: 'en',
    label: 'Magic adverb (quietly, deeply, genuinely…)',
    fix: 'Delete the adverb; if it carried information, state it.',
    patterns: [words('quietly', 'deeply', 'fundamentally', 'genuinely', 'truly', 'remarkably', 'arguably', 'seamlessly', 'incredibly', 'profoundly', 'unusually well', 'effortlessly')],
  },

  // ── Gonflement ───────────────────────────────────────────────────────────────────────────
  {
    id: 'significance', group: 'inflation', lang: 'fr',
    label: 'Importance, héritage, tendance de fond',
    fix: 'Remplacer par le fait précis qui montrerait l’importance (date, chiffre, conséquence nommée), ou couper.',
    patterns: [
      words('jou(?:e|ent|er|era|ait|ant) un rôle (?:clé|crucial|essentiel|central|majeur|déterminant|important|prépondérant|fondamental|décisif|de premier plan|moteur)'),
      words('(?:marque|marquent|marquant|a marqué|marquera) (?:un |une )?(?:tournant|étape|jalon|virage|nouvelle ère)', '(?:un |une )?(?:tournant|moment|étape) (?:majeure?|décisif|décisive|clé|charnière|historique)'),
      words(String.raw`témoign\p{L}* (?:de|d${APOS}|du|des)`, String.raw`(?:laisse|laissé|laissera|laisser) (?:une|son|sa) (?:empreinte|trace|marque) (?:durable|indélébile|profonde)?`),
      words(String.raw`s${APOS}inscri\p{L}* dans (?:une|un|le|la) (?:dynamique|démarche|logique|mouvement|tendance|contexte|cadre|continuité)`),
      words('pierre angulaire', 'fer de lance', 'au cœur (?:de|du|des)', 'à la croisée (?:des|de|du)', 'dans un monde (?:où|en)', String.raw`à l${APOS}ère (?:du|de la|des|de l${APOS})`, 'en (?:constante|perpétuelle|pleine) (?:évolution|mutation)'),
      words(String.raw`(?:souligne|soulignant|soulignent|met en lumière|mettant en lumière|met en évidence|illustre|rappelle) (?:l${APOS}importance|le rôle|la place|la portée|la valeur|la pertinence)`),
      words(String.raw`(?:profondément )?(?:ancré|enraciné)e?s? (?:dans|profondément)`, 'héritage durable', 'impact (?:durable|profond|significatif|considérable|majeur)'),
      words(String.raw`(?:façonn|redéfini|réinvent)\p{L}* (?:le|la|les|l${APOS}) (?:avenir|paysage|façon|manière|monde)`, 'ouvr\\p{L}* la voie', 'pos\\p{L}* les (?:bases|jalons|fondations)'),
      words('(?:a|ont) (?:nourri|alimenté|suscité) (?:le|les|de nombreux) débats?', 'au centre des (?:débats|discussions)'),
    ],
  },
  {
    id: 'significance', group: 'inflation', lang: 'en',
    label: 'Undue significance, legacy, broader trends',
    fix: 'Replace with the precise fact that would show the importance, or cut.',
    patterns: [
      words('stands as', 'serves as a (?:testament|reminder)', 'is a testament', '(?:a|the) (?:pivotal|crucial|vital|key|significant|central) (?:role|moment|step)'),
      words('underscor\\p{L}* (?:its|the|their) (?:importance|significance)', 'reflects broader', '(?:enduring|lasting) (?:legacy|impact|influence)', 'setting the stage', 'marking a (?:shift|turning point|new era)', 'key turning point'),
      words('evolving landscape', 'focal point', 'indelible mark', 'deeply rooted', 'shaped (?:the )?(?:conversations?|discussions?|debates?)', 'broader (?:trends?|movement|context|shift)'),
    ],
  },
  {
    id: 'ai-vocabulary', group: 'inflation', lang: 'fr',
    label: 'Mot-signature des IA',
    fix: 'Le mot simple, ou le fait que le mot prétendait résumer. Un sens littéral (un paysage réel, un écosystème biologique) se garde.',
    patterns: [words(
      'véritables?', 'incontournables?', String.raw`indéniable(?:s|ment)?`, 'primordiale?s?', 'holistiques?', 'synergies?', 'tapisseries?',
      'plong(?:er|eons|ez|e) (?:dans|au cœur)', 'se plonger', String.raw`paysages? (?:numérique|technologique|actuel|médiatique|concurrentiel|économique|culturel|musical|politique|éditorial)s?`,
      String.raw`écosystèmes? (?:numérique|digital|technologique|de (?:l${APOS}|la )?(?:innovation|startup))s?`, 'leviers?', 'catalyseurs?', 'booster', 'sublimer', String.raw`libér\p{L}* (?:le|son|tout|leur) potentiel`,
      'révolution(?:naire|ner|ne|nent)s?', 'sans précédent', 'de pointe', 'à la pointe', 'novat(?:eur|rice)s?', 'innovante?s?', 'multifacettes?', 'foisonnante?s?',
      'vibrante?s?', 'fluides?', 'robustes?', 'quintessence', 'symbiose', 'alchimie', 'boussole', 'odyssée', 'épopée', 'harmonieu(?:x|se|ses)', 'inestimables?', 'cruciale?s?', 'cruciaux',
      'fascinante?s?', 'captivante?s?', 'époustouflante?s?', 'unique en son genre', 'sans effort', 'en toute simplicité', 'clé en main', 'nouvelle génération', 'game[- ]changer',
      'mettre en lumière', 'mise en lumière', 'riche (?:patrimoine|histoire|héritage|tradition|palette)', 'large éventail', 'vaste éventail', 'éventail de',
    )],
  },
  {
    id: 'ai-vocabulary', group: 'inflation', lang: 'en',
    label: 'AI signature word',
    fix: 'Use the plain word, or the fact the word was summarizing. Literal senses are fine.',
    patterns: [words(
      'delv\\p{L}*', 'tapestry', 'testament', 'pivotal', 'intricate', 'intricacies', 'interplay', 'meticulous(?:ly)?', 'bolster(?:ed|s)?', 'garner(?:ed|s)?',
      'showcas(?:e|es|ed|ing)', 'vibrant', 'boasts?', 'underscor(?:e|es|ed|ing)', 'seamless(?:ly)?', 'robust', 'leverag(?:e|es|ed|ing)', 'multifaceted', 'realm', 'embark(?:s|ed)?',
      'navigat\\p{L}* the', 'game[- ]changer', 'cutting[- ]edge', 'groundbreaking', 'unparalleled', 'unlock(?:s|ed|ing)?', 'elevat(?:e|es|ed|ing)', 'empower(?:s|ed|ing)?', 'harness(?:es|ed|ing)?',
      'nestled', 'in the heart of', 'ever[- ]evolving', '(?:digital|tech|technological|competitive|media|current) landscape', 'paradigm', 'synergy', 'holistic', 'load[- ]bearing',
    )],
  },
  {
    id: 'ai-vocabulary-density', group: 'inflation', lang: 'fr', min: 4, countOnly: true,
    label: 'Vocabulaire générique en grappe (essentiel, clé, enjeu, optimiser, permettre de…)',
    fix: 'Pris un par un, ces mots sont normaux ; quatre ou plus dans un texte court signalent un texte qui résume au lieu de dire. Remplacer les plus vagues par leur fait.',
    patterns: [words('essentiel(?:le)?s?', 'majeure?s?', 'clés?', 'enjeux?', 'défis?', 'optimis\\p{L}*', 'favoris\\p{L}*', 'renforc\\p{L}*', 'garanti\\p{L}*', 'facilit\\p{L}*', 'permett(?:re|ant|ent) de', String.raw`permet d(?:e|${APOS})`, 'mettre en œuvre', 'dynamiques?', 'riches?', 'précieu(?:x|se|ses)', 'approfondie?s?', 'exhaustive?s?', 'nuancée?s?', 'pertinente?s?', 'significati(?:f|ve|fs|ves)', 'considérables?', 'diverse?s?', 'nombreu(?:x|se|ses)', 'multiples', 'particulièrement')],
  },
  {
    id: 'ai-vocabulary-density', group: 'inflation', lang: 'en', min: 4, countOnly: true,
    label: 'Generic vocabulary in clusters (crucial, enhance, foster, key…)',
    fix: 'Each is fine alone; four or more in a short text means it summarizes instead of saying.',
    patterns: [words('crucial', 'enhanc\\p{L}*', 'foster\\p{L}*', 'align(?:s|ed)? with', 'highlight(?:s|ed|ing)?', 'emphasiz\\p{L}*', 'key', 'valuable', 'notable', 'significant', 'ensur\\p{L}*', 'comprehensive', 'insights?', 'journey', 'dynamic', 'clearer', 'practical', 'prioritiz\\p{L}*', 'steady', 'matters', 'echo(?:es|ed)?', 'dependable', 'universally')],
  },
  {
    id: 'copula-dodge', group: 'inflation', lang: 'fr',
    label: 'Esquive de « est » et « a » (« constitue », « se positionne comme », « dispose de »)',
    fix: 'Écrire « est » ou « a ».',
    patterns: [words(
      String.raw`s${APOS}impos\p{L}* comme`, 'se positionn\\p{L}* comme', 'se veu(?:t|lent)', 'fait figure de', 'fai(?:t|saient|sait) office de',
      '(?:sert|servent|servant) de (?:point|pilier|socle|base|référence|vitrine|tremplin|rappel|témoin)', 'agi(?:t|ssent) comme', 'incarn(?:e|ent|ait|ant)',
      String.raw`constitu(?:e|ent|ait) (?:un|une|le|la|l${APOS}|des)`, String.raw`représent(?:e|ent|ait) (?:un|une) (?:véritable|vrai|nouveau|nouvelle|tournant|étape|pas|avancée|enjeu)`,
      'se distingu\\p{L}* par', 'se dress\\p{L}*', String.raw`dispos(?:e|ent|ait) d(?:e|${APOS}|u|es)`, String.raw`bénéfici(?:e|ent|ait) d(?:e|${APOS}|u|es)`,
      '(?:propose|offre)(?:nt)? (?:un|une|des) (?:large|vaste|riche|grande?) (?:éventail|gamme|palette|choix|variété)', 'arbor(?:e|ent)', 'se targu\\p{L}*',
    )],
  },
  {
    id: 'copula-dodge', group: 'inflation', lang: 'en',
    label: 'Avoiding "is" and "has" ("serves as", "boasts", "features")',
    fix: 'Write "is" or "has".',
    patterns: [words('serv(?:es|ed) as', 'stand(?:s|ing) as', 'acts as an?', 'functions as', 'represents an? (?:shift|turning|new|major|significant)', 'features an?', 'offers an? (?:wide|range|variety|rich)', 'refers to')],
  },
  {
    id: 'promo', group: 'inflation', lang: 'fr',
    label: 'Ton de brochure',
    fix: 'Décrire ce que la chose fait, avec un fait vérifiable.',
    patterns: [words(
      'à couper le souffle', 'niché\\p{L}* (?:au|dans|en)', 'écrin', 'havre de paix', 'cadre (?:idyllique|exceptionnel|enchanteur|privilégié)',
      'expérience (?:unique|inoubliable|immersive|exceptionnelle|inédite)', String.raw`en un clin d${APOS}œil`, String.raw`n${APOS}attendez plus`, 'sans plus attendre',
      'prête?s? à (?:découvrir|plonger|vous lancer|passer|transformer)', 'que (?:vous soyez|tu sois)', String.raw`tout ce qu${APOS}il (?:faut|vous faut) savoir`, 'le guide (?:ultime|complet|définitif)',
      'ne cherchez plus', 'au niveau supérieur', 'à portée de (?:main|clic)', 'en quelques clics',
      'grande nouvelle', '(?:est|sont) enfin (?:là|arrivée?s?|disponibles?)', 'pensée?s? pour vous', 'faire part de (?:vos|tes) retours',
    )],
  },
  {
    id: 'promo', group: 'inflation', lang: 'en',
    label: 'Brochure tone',
    fix: 'Describe what it does, with a checkable fact.',
    patterns: [words(String.raw`whether you${APOS}re`, 'look no further', 'to the next level', 'the ultimate guide', 'everything you need to know', 'breathtaking', 'must[- ]visit', 'unlock (?:your|the) (?:potential|power)', 'all[- ]in[- ]one', 'at your fingertips')],
  },
  {
    id: 'figurative', group: 'inflation', lang: 'fr',
    label: 'Image forcée (« imaginez… », « c’est comme… », « l’Uber de… »)',
    fix: 'Expliquer la chose elle-même.',
    patterns: [
      words('imagine[zs]? (?:un monde|que|un instant)', 'imaginez[- ]vous', 'imagine[- ]toi', String.raw`(?:pense|pensez|voyez|vois)[- ](?:le|la|y|ça|cela) comme`, String.raw`c${APOS}est (?:un peu )?comme (?:un|une|si|avoir)`),
      words(String.raw`(?:c${APOS}est|devenir) l${APOS}(?:Uber|Excel|Netflix|Airbnb|iPhone|Tinder|Spotify|Amazon|Google) d(?:e|u|es)`),
    ],
  },
  {
    id: 'figurative', group: 'inflation', lang: 'en',
    label: 'Forced figure ("imagine…", "think of it as…", "the Uber of…")',
    fix: 'Explain the thing itself.',
    patterns: [words('think of it (?:as|like)', 'imagine a world', 'imagine if', String.raw`it${APOS}s like an?`, 'the (?:Uber|Excel|Netflix|Airbnb|iPhone|Tinder|Spotify) of')],
  },
  {
    id: 'concept-label', group: 'inflation', lang: 'fr',
    label: 'Concept inventé (« le paradoxe de… », « le piège de… »)',
    fix: 'Nommer le problème en une phrase plate. Un terme établi et sourcé se garde.',
    patterns: [String.raw`${START}(?:le|la|l${APOS}) (?:paradoxe|piège|fossé|dilemme|spirale|mirage|illusion|angle mort|taxe|plafond) (?:de la |du |de l${APOS}|des |de )\p{L}+`],
  },
  {
    id: 'concept-label', group: 'inflation', lang: 'en',
    label: 'Invented concept label ("the supervision paradox")',
    fix: 'Name the problem in one plain sentence.',
    patterns: [String.raw`${START}the \p{L}+ (?:paradox|trap|gap|tax|creep|divide|vacuum|inversion|cliff|illusion)${END}`],
  },
  {
    id: 'false-range', group: 'inflation', lang: 'any',
    label: 'Fausse étendue (« de X à Y en passant par Z »)',
    fix: 'Lister les vrais éléments, ou en citer un.',
    patterns: [
      String.raw`${START}de (?:la |l${APOS}|le |les )?\p{L}+(?: \p{L}+)? (?:à|aux) (?:la |l${APOS}|le |les )?\p{L}+(?: \p{L}+)?,? en passant par`,
      String.raw`${START}from \p{L}+(?: \p{L}+)? to \p{L}+(?: \p{L}+)?,? (?:to|and everything)`,
    ],
  },
  {
    id: 'balance', group: 'inflation', lang: 'fr',
    label: 'Fin sur l’équilibre (« trouver le juste équilibre », « allier tradition et modernité »)',
    fix: 'Prendre position, ou finir sur le dernier fait.',
    patterns: [words('(?:trouver|atteindre|garder|maintenir) (?:le|un) (?:juste |bon |subtil |fragile )?équilibre', 'concili(?:er|e|ant)', 'entre tradition et modernité', 'le meilleur des deux mondes')],
  },
  {
    id: 'balance', group: 'inflation', lang: 'en',
    label: 'Balance ending ("strike the right balance")',
    fix: 'Take a position, or end on the last fact.',
    patterns: [words('(?:strike|find|strikes|finds) (?:the|a) (?:right |delicate |fine )?balance', 'best of both worlds')],
  },
  {
    id: 'challenges', group: 'inflation', lang: 'fr',
    label: 'Formule « malgré ces défis » / « défis et perspectives »',
    fix: 'Nommer le problème réel et ce qui est fait, avec date ou chiffre ; sinon couper la section.',
    patterns: [words('malgré (?:ces|les|ses|leurs|de nombreux) (?:défis|difficultés|obstacles|limites|enjeux)', '(?:défis|enjeux) et perspectives', String.raw`perspectives d${APOS}avenir`, String.raw`l${APOS}avenir (?:s${APOS}annonce|reste à écrire)`, 'reste(?:nt)? à (?:relever|écrire)', 'fait face à (?:de nombreux|plusieurs|divers) (?:défis|enjeux)')],
  },
  {
    id: 'challenges', group: 'inflation', lang: 'en',
    label: '"Despite these challenges" formula',
    fix: 'Name the actual problem and what is done about it, or cut.',
    patterns: [words('despite (?:these|its|their|the) challenges', 'faces (?:several|many|numerous|significant) challenges', 'future (?:outlook|prospects)', 'challenges and (?:legacy|opportunities)')],
  },

  // ── Autorité empruntée ──────────────────────────────────────────────────────────────────
  {
    id: 'vague-attribution', group: 'authority', lang: 'fr',
    label: 'Attribution vague (« les experts », « des études montrent »)',
    fix: 'Nommer la personne ou l’étude, avec sa date. Sinon, retirer l’affirmation ou la donner comme un avis.',
    patterns: [
      words(String.raw`(?:les|des|de nombreux|certains|plusieurs|beaucoup d${APOS}|nombre d${APOS}) (?:experts|observateurs|spécialistes|analystes|critiques|chercheurs|commentateurs|professionnels|utilisateurs|historiens) (?:s${APOS}accordent|estiment|soulignent|affirment|considèrent|notent|saluent|jugent|pensent|s${APOS}interrogent|y voient|décrivent)`),
      words('selon (?:les|certains|de nombreux|plusieurs) (?:experts|spécialistes|observateurs|analystes|sources)', '(?:des|les|plusieurs|de nombreuses|certaines) études (?:montrent|ont montré|suggèrent|indiquent|révèlent|démontrent)'),
      words('il est (?:largement|généralement|souvent|communément|unanimement) (?:admis|reconnu|considéré|accepté)', '(?:largement|unanimement) (?:salué|reconnu|considéré|cité)e?s?', String.raw`de l${APOS}avis (?:de tous|général)`),
    ],
  },
  {
    id: 'vague-attribution', group: 'authority', lang: 'en',
    label: 'Vague attribution ("experts say", "studies show")',
    fix: 'Name the person or study. Otherwise cut the claim or own it as an opinion.',
    patterns: [words('experts (?:say|argue|agree|believe|note|suggest)', 'observers (?:have|note|say|cite)', 'industry reports', 'studies (?:show|suggest|have shown)', '(?:widely|generally) (?:regarded|considered|recognized|seen|acknowledged)', 'many (?:believe|argue|consider|say)', 'critics (?:argue|say|have noted)', 'several (?:sources|publications) (?:have|note)')],
  },
  {
    id: 'source-emphasis', group: 'authority', lang: 'fr',
    label: 'Insistance sur la couverture ou sur ce que « les sources indiquent »',
    fix: 'Dire le fait, puis citer la source en référence. Ne pas raconter que la source existe.',
    patterns: [
      words('couverture (?:médiatique|presse) (?:importante|large|significative|nationale|internationale|indépendante)', String.raw`(?:relayé|cité|mentionné|présenté|salué)e?s? (?:par|dans) (?:de nombreux|plusieurs|divers|les principaux|des) (?:médias|titres|publications|journaux|outils)`),
      String.raw`${START}(?:son|leur|sa) (?:site (?:officiel|web|internet)|biographie (?:officielle|parlementaire)|profil (?:professionnel|LinkedIn)|page officielle) (?:l${APOS}|le |la |les )?(?:indique|précise|présente|décrit|identifie|mentionne|recense|liste)`,
      words(String.raw`(?:les )?(?:archives|registres|bases de données|annuaires|documents officiels) (?:l${APOS}|le |la |les )?(?:identifient|recensent|répertorient|décrivent|mentionnent)`),
    ],
  },
  {
    id: 'source-emphasis', group: 'authority', lang: 'en',
    label: 'Emphasis on coverage or on what sources "identify"',
    fix: 'State the fact and cite it. Do not narrate that the source exists.',
    patterns: [words('independent coverage', '(?:local|regional|national|trade|major) (?:media|outlets|publications)', '(?:featured|profiled|cited) in', '(?:his|her|their|its) (?:personal website|official (?:site|website|biography)|profile) (?:identifies|lists|describes|records)', '(?:records|databases|filings|listings) (?:identify|list|describe)')],
  },
  {
    id: 'vague-association', group: 'authority', lang: 'fr',
    label: 'Lien flou (« associé à », « en lien avec »)',
    fix: 'Dire le lien exact : « dirigeait », « enseignait à », « a fondé ».',
    patterns: [words('(?:est|était|reste|fut|a été|s’est|s\'est) associée? (?:à|au|aux)', '(?:son|leur) nom (?:est|reste) associé', 'en lien avec', 'en association avec', 'en connexion avec')],
  },
  {
    id: 'vague-association', group: 'authority', lang: 'en',
    label: 'Vague association ("associated with")',
    fix: 'State the relation: led, taught at, founded.',
    patterns: [words('(?:was|is|became|remains) (?:closely |widely |particularly )?associated with', 'in connection with', 'connected (?:with|to) the')],
  },
  {
    id: 'hedge-disclaimer', group: 'authority', lang: 'fr',
    label: 'Avertissement sur les sources, supposition déguisée',
    fix: 'Dire ce que la source ne donne pas (« la source ne date pas la fondation »), ou couper. Ne jamais combler par une hypothèse.',
    patterns: [
      words(String.raw`(?:les )?informations (?:disponibles |publiques )?(?:sont|restent|demeurent) (?:limitées|rares|parcellaires|lacunaires)`, String.raw`peu d${APOS}informations (?:sont )?(?:disponibles|publiques)`),
      words(String.raw`(?:n${APOS}est|ne sont|n${APOS}ont|n${APOS}a) pas (?:été )?(?:publiquement |largement )?(?:documenté|divulgué|communiqué|rendu public)e?s?`, String.raw`d${APOS}après les (?:informations|sources|données) disponibles`),
      words('(?:à|selon) (?:ma|mes) (?:connaissance|données|informations)', 'mise à jour de mes (?:connaissances|données)', 'à prendre avec (?:précaution|prudence|des pincettes|recul)'),
      words(String.raw`(?:ne|n${APOS}) (?:doit|doivent|devrait|devraient) pas être (?:confondu|considéré|interprété|lu|vu)e?s?`, String.raw`ne permet(?:tent)? pas(?:,? (?:à (?:lui|elle|eux|elles) seule?s?|en soi),?)? d${APOS}(?:établir|affirmer|conclure)`),
      words('reste(?:nt)? (?:discret|discrète|discrets|discrètes) sur (?:sa|leur|son|ses)', 'il semblerait que', '(?:pourrait|pourraient|peut|peuvent) potentiellement', '(?:il est|il semble) (?:probable|vraisemblable) que'),
    ],
  },
  {
    id: 'hedge-disclaimer', group: 'authority', lang: 'en',
    label: 'Source disclaimer, disguised guess',
    fix: 'Say what the source does not give, or cut. Never fill the gap with a guess.',
    patterns: [words('as of my (?:last|latest) (?:knowledge|training|update)', 'not (?:publicly|widely) (?:available|documented|disclosed)', 'based on (?:the )?available information', '(?:while|although) (?:specific )?details are (?:limited|scarce)', 'in the (?:provided|available) sources', 'maintains a low profile', 'keeps (?:his|her|their) personal (?:life|details) private', 'should not be confused with', 'should be (?:treated|read|understood|seen) as', 'does not by itself establish', '(?:could|may|might) potentially', 'it is likely that')],
  },
  {
    id: 'familiarity', group: 'authority', lang: 'fr',
    label: 'Appel au déjà-connu (« comme chacun sait », « un classique »)',
    fix: 'Donner la preuve, ou retirer la formule.',
    patterns: [words('comme (?:chacun|tout le monde|on le) sai[ts]', 'un (?:grand )?classique(?: du genre)?', 'notoirement', 'on le sait', String.raw`nul n${APOS}ignore`, '(?:il|cela) va sans dire')],
  },
  {
    id: 'familiarity', group: 'authority', lang: 'en',
    label: 'Appeal to familiarity ("famously", "as we all know")',
    fix: 'Give the evidence or drop it.',
    patterns: [words('as we all know', 'famously', 'notoriously', 'needless to say', 'a classic')],
  },
  {
    id: 'performed-honesty', group: 'authority', lang: 'fr',
    label: 'Franchise jouée (« pour être honnête », « je l’avoue »)',
    fix: 'Supprimer : la phrase suivante dit déjà l’avis.',
    patterns: [words('(?:pour être|soyons|je vais être|sois|soyez) (?:honnête|franc|franche|transparent|transparente)s?', 'honnêtement', 'franchement', String.raw`je l${APOS}avoue`)],
  },
  {
    id: 'performed-honesty', group: 'authority', lang: 'en',
    label: 'Performed honesty ("to be honest")',
    fix: 'Delete it.',
    patterns: [words('to be (?:honest|frank|transparent)', 'honestly', String.raw`I${APOS}ll be honest`, 'full disclosure', 'and yes, I')],
  },

  // ── Restes de conversation ──────────────────────────────────────────────────────────────
  {
    id: 'chatbot-residue', group: 'residue', lang: 'fr',
    label: 'Formule de chatbot (accueil, flatterie, offre, clôture)',
    fix: 'Supprimer la formule, garder le contenu.',
    patterns: [
      words(String.raw`j${APOS}espère que (?:cela|ça|ceci) (?:t${APOS}|vous )?(?:aide|aidera|répond|éclaire|sera utile)`, String.raw`n${APOS}hésite[zs]? pas (?:à|si)`, '(?:bonne|excellente|très bonne) question', '(?:tu as|vous avez) (?:tout à fait |parfaitement |entièrement |complètement |absolument )?raison'),
      String.raw`${SENTENCE_START}(?:absolument|bien sûr|certainement|tout à fait|parfait|excellent|super|génial|avec plaisir)\s?[!.,]`,
      words('(?:veux|voulez|souhaites|souhaitez|aimerais|aimeriez)[- ](?:tu|vous) que je', '(?:dis|dites)[- ]moi si', '(?:fais|faites)[- ]moi savoir', 'je (?:reste|suis) à (?:ta|votre) (?:entière )?disposition'),
      words(String.raw`en tant qu${APOS}(?:IA|intelligence artificielle|assistant|modèle de langage)`, 'je ne (?:peux|suis) pas en mesure de', 'je serais (?:ravie?|heureux|heureuse) de', String.raw`ravie? de (?:t${APOS}|vous )aider`),
      words('voici (?:une|la|ta|votre) (?:version|proposition|réécriture) (?:améliorée|revue|corrigée|complète|retravaillée|plus)', '(?:comme|ainsi que) (?:tu l’as |vous l’avez )?demandé'),
    ],
  },
  {
    id: 'chatbot-residue', group: 'residue', lang: 'en',
    label: 'Chatbot residue (greeting, flattery, offer, sign-off)',
    fix: 'Remove the wrapper, keep the content.',
    patterns: [
      words('I hope this helps', '(?:great|excellent|good) question', String.raw`you(?:${APOS}re| are) (?:absolutely|totally|completely|so) right`, 'would you like me to', String.raw`you${APOS}d like me to`, 'want me to', 'should I (?:continue|go ahead|proceed)', 'let me know if', 'feel free to', 'happy to help'),
      words('as an AI', 'as a (?:large )?language model', 'I cannot (?:provide|offer)', String.raw`here(?:${APOS}s| is) (?:a|an|the|your) (?:revised|improved|updated|polished|refined) (?:version|draft)`),
      String.raw`${SENTENCE_START}(?:certainly|of course|absolutely|great|sure thing)\s?!`,
    ],
  },
  {
    id: 'reasoning-leak', group: 'residue', lang: 'fr',
    label: 'Texte qui raconte sa fabrication ou ce qu’il va faire',
    fix: 'Faire la chose au lieu de l’annoncer. Le texte parle de son sujet, pas de lui-même.',
    patterns: [
      String.raw`${SENTENCE_START}je vais (?:d${APOS}abord|commencer par|maintenant|ici|donc|te |vous )`,
      words('(?:laisse|laissez|permets|permettez)[- ]moi', '(?:dans|au fil de) (?:cette|la) (?:section|partie|article)(?: suivante| qui suit)?,? (?:nous|on|je) (?:allons|va|vais)', String.raw`comme (?:nous l${APOS}avons|on l${APOS}a|je l${APOS}ai) (?:vu|dit|mentionné|évoqué)`),
      words('(?:le|ce) (?:document|texte|tableau|guide|article) (?:ci-dessous|suivant|qui suit) (?:présente|compare|détaille|résume|récapitule)', '(?:a|ont) été (?:compilée?s?|rédigée?s?|générée?s?|établie?s?) à partir', String.raw`(?:rien|aucun élément|aucune donnée) n${APOS}a été inventé`),
    ],
  },
  {
    id: 'reasoning-leak', group: 'residue', lang: 'en',
    label: 'Text narrating itself or what it is about to do',
    fix: 'Do the thing instead of announcing it.',
    patterns: [
      words('let me (?:start|first|walk|explain|break)', String.raw`I${APOS}ll (?:start|begin|now|walk|first)`, String.raw`in this (?:section|article|post),? (?:we|I)(?:${APOS}ll| will)`, String.raw`as (?:we${APOS}ve|we have|I${APOS}ve|I have) (?:seen|discussed|mentioned)`),
      words('(?:compiled|generated|drawn) from', 'the (?:table|section|list) below (?:compares|shows|summarizes)', 'flagged rather than guessed'),
    ],
  },
  {
    id: 'placeholder', group: 'residue', lang: 'any',
    label: 'Bouche-trou non rempli',
    fix: 'Mettre la vraie valeur, ou retirer la ligne.',
    patterns: [
      String.raw`\[(?:[A-ZÀ-Ý][\p{L}'’ .-]{1,40}|nom|prénom|date|lien|url|insérer[^\]\n]{0,40}|à compléter|xx+)\](?![(\[:])`,
      String.raw`${START}20\d\d-[Xx]{2}-[Xx]{2}${END}`, words('INSERT_\\w+', 'lorem ipsum', 'à compléter', 'TBD'),
    ],
    flags: 'gmu',
  },
  {
    id: 'unicode-decoration', group: 'format', lang: 'any',
    label: 'Flèches et puces décoratives (→, ⇒, •, ✓)',
    fix: 'Une phrase, ou une vraie liste.',
    patterns: ['[→⇒➜➔⟶➡↦✓✔✦★]', String.raw`(?<=\s)(?:->|=>)(?=\s)`, String.raw`^\s*[•▪◦‣]\s`],
  },
  {
    id: 'exclamation', group: 'format', lang: 'any', min: 2, countOnly: true,
    label: 'Points d’exclamation',
    fix: 'Aucun dans un texte informatif ; le fait suffit.',
    patterns: ['!(?![=\\[(])'],
  },

  // ── Résumés de modification ─────────────────────────────────────────────────────────────
  {
    id: 'canned-summary', group: 'commit', lang: 'fr',
    label: 'Résumé de modification en formule (« améliore la lisibilité », « tout en préservant »)',
    fix: 'Dire ce qui a changé, concrètement, et pourquoi : « Le cache expire après 10 min ; il gardait des prix périmés ».',
    patterns: [
      words(String.raw`(?:amélior|optimis|renforc|refactoris|harmonis|clarifi|simplifi|enrichi|consolid|fluidifi)\p{L}* (?:la |le |l${APOS}|les )?(?:lisibilité|maintenabilité|clarté|robustesse|cohérence|qualité|expérience utilisateur|performances?|structure)`),
      words(String.raw`(?:amélioration|optimisation|renforcement|refactorisation|harmonisation|consolidation|simplification)s? (?:significative |globale |générale |continue |majeure )?(?:de la |du |des |de l['’])?(?:lisibilité|maintenabilité|clarté|robustesse|cohérence|qualité|performances?|structure|code)`, 'amélioration continue', 'qualité du code', String.raw`(?:amélioration|optimisation)s? significative`),
      words('tout en (?:préservant|conservant|maintenant|garantissant|veillant à)', 'conformément aux (?:bonnes pratiques|conventions|standards|normes)', 'bonnes pratiques', 'pour (?:une )?(?:meilleure|plus grande) (?:lisibilité|maintenabilité|clarté|robustesse|cohérence)'),
    ],
  },
  {
    id: 'canned-summary', group: 'commit', lang: 'en',
    label: 'Canned change summary ("improved readability", "while preserving")',
    fix: 'Say what changed and why, concretely.',
    patterns: [words('improv(?:e|ed|es|ing) (?:readability|maintainability|clarity|robustness|consistency)', 'while (?:preserving|maintaining|keeping|ensuring)', 'ensur(?:e|ed|es|ing) (?:consistency|compliance|clarity|robustness)', 'streamlin(?:e|ed|es|ing)', 'in (?:line|compliance) with (?:best practices|conventions)', 'best practices', 'comprehensive (?:update|overhaul|refactor)')],
  },

  // ── Typographie ─────────────────────────────────────────────────────────────────────────
  {
    id: 'quotes', group: 'typo', lang: 'fr', countOnly: true,
    label: 'Guillemets anglais ou droits dans un texte français',
    fix: 'Guillemets français « … » avec espaces insécables.',
    patterns: ['[“”]', String.raw`(?<![=\w])"[^"\n]{1,80}"`],
  },
  {
    id: 'nbsp', group: 'typo', lang: 'fr', countOnly: true,
    label: 'Espace ordinaire avant ; : ! ? » ou après «',
    fix: 'Espace insécable (U+00A0) à ces endroits.',
    patterns: [String.raw`(?<=[\p{L}\p{N})»*_]) [;:!?»]`, '« '],
  },
  {
    id: 'ellipsis', group: 'typo', lang: 'fr', countOnly: true,
    label: 'Trois points au lieu de « … »',
    fix: 'Le caractère … .',
    patterns: [String.raw`(?<!\.)\.\.\.(?!\.)`],
  },
  {
    id: 'quotes', group: 'typo', lang: 'en', countOnly: true,
    label: 'Curly quotes (a ChatGPT habit; straight quotes in plain text)',
    fix: 'Straight quotes, consistently.',
    patterns: ['[“”‘]', String.raw`(?<=\p{L})’(?=\p{L})`],
  },
];

// Motifs repérés dans le texte brut, avant tout nettoyage (ils vivent dans les adresses).
const RAW_RULES = [
  {
    id: 'artifact', group: 'residue', label: 'Artefact laissé par un assistant (paramètre de suivi, balise de citation)',
    fix: 'Retirer : `utm_source=chatgpt.com`, `:contentReference[oaicite:…]`, `turn0search0`, `【1†source】`, `↩`.',
    patterns: [String.raw`utm_source=(?:chatgpt\.com|openai|copilot\.com)`, String.raw`referrer=grok\.com`, String.raw`contentReference\[`, 'oaicite', String.raw`turn\d+(?:search|view|news|fetch)\d+`, String.raw`【\d+[†:]`, '↩'],
  },
  {
    id: 'invisible', group: 'residue', label: 'Caractère invisible (espace de largeur nulle, trait d’union conditionnel…)',
    fix: 'Supprimer ces caractères.',
    patterns: ['(?<!^)[\\u200B-\\u200D\\u2060\\u00AD\\uFEFF]'],
  },
];

// ── Lecture et nettoyage ───────────────────────────────────────────────────────────────────
const blank = (s) => s.replace(/[^\n]/g, ' ');

function clean(raw, { isHtml, skipQuoted }) {
  let text = raw.replace(/\r\n?/g, '\n');
  if (isHtml) {
    text = text.replace(/<(script|style)[\s\S]*?<\/\1>/gi, blank).replace(/<[^>]+>/g, blank)
      .replace(/&nbsp;/g, ' ').replace(/&[a-z]+;|&#\d+;/gi, (m) => ' '.repeat(m.length));
  }
  text = text.replace(/<!--\s*tell-scan:\s*off\s*-->[\s\S]*?(?:<!--\s*tell-scan:\s*on\s*-->|$)/g, blank);
  // Blocs de code, puis code en ligne, puis adresses.
  text = text.replace(/^([ \t]*)(```|~~~)[^\n]*\n[\s\S]*?(?:^\1?\2[^\n]*$|(?![\s\S]))/gm, blank);
  text = text.replace(/`[^`\n]+`/g, blank);
  text = text.replace(/\bhttps?:\/\/[^\s)>\]]+/g, blank);
  if (skipQuoted) text = text.replace(/«[^»]*»|“[^”]*”|"[^"\n]*"/g, blank);
  return text;
}

function detectLanguage(text) {
  const count = (re) => (text.match(re) || []).length;
  const fr = count(/(?<![\p{L}])(?:le|la|les|des|est|une|pour|que|qui|dans|pas|avec|sur|du|au|ce|il|elle|ne)(?![\p{L}])/giu);
  const en = count(/(?<![\p{L}])(?:the|and|is|are|of|to|with|that|this|for|it|on|was|be|not|you)(?![\p{L}])/giu);
  return fr >= en ? 'fr' : 'en';
}

function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return (offset) => {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= offset) lo = mid; else hi = mid - 1; }
    return lo + 1;
  };
}

const excerpt = (s) => { const t = s.replace(/\s+/g, ' ').trim(); return t.length > 80 ? `${t.slice(0, 77)}…` : t; };

// ── Contrôles qui ne tiennent pas dans une expression régulière ─────────────────────────────
function structuralChecks(text, lang, toLine, plain) {
  const out = [];
  const add = (id, group, label, fix, hits, opts = {}) => { if (hits.length >= (opts.min || 1)) out.push({ id, group, label, fix, hits, countOnly: !!opts.countOnly }); };
  const lines = text.split('\n');
  let offset = 0;
  const lineOffsets = lines.map((l) => { const o = offset; offset += l.length + 1; return o; });

  // Paragraphes de prose (ni titres, ni lignes de tableau).
  const paragraphs = [];
  let current = null;
  lines.forEach((line, i) => {
    const t = line.trim();
    const isProse = t && !/^(#{1,6}\s|\||<|[-*_]{3,}$)/.test(t);
    if (isProse) {
      const body = t.replace(/^(?:[-*+]|\d+[.)])\s+/, '');
      if (!current) { current = { start: i + 1, text: body }; paragraphs.push(current); } else current.text += ` ${body}`;
      if (/^(?:[-*+]|\d+[.)])\s/.test(t)) current = null; // un élément de liste = un paragraphe
    } else current = null;
  });

  const wordCount = (s) => (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
  const sentencesOf = (p) => p.text.split(/(?<=[.!?…])\s+(?=[\p{Lu}«"“(\d])/u).map((s) => s.trim()).filter(Boolean);

  // Fragments chocs et question-réponse.
  const fragments = [], qa = [];
  for (const p of paragraphs) {
    const s = sentencesOf(p);
    for (let i = 0; i + 1 < s.length; i++) {
      if (wordCount(s[i]) <= 3 && wordCount(s[i + 1]) <= 3 && /[.!]$/.test(s[i]) && /[.!]$/.test(s[i + 1])) fragments.push({ line: p.start, text: excerpt(`${s[i]} ${s[i + 1]}`) });
      if (/\?$/.test(s[i]) && wordCount(s[i]) <= 8 && wordCount(s[i + 1]) <= 8 && !/\?$/.test(s[i + 1])) qa.push({ line: p.start, text: excerpt(`${s[i]} ${s[i + 1]}`) });
    }
  }
  add('fragments', 'staging', lang === 'fr' ? 'Fragments chocs (« Simple. Rapide. »)' : 'Punchy fragments ("Simple. Fast.")', 'Une phrase entière, avec sujet et verbe.', fragments);
  add('rhetorical-qa', 'staging', lang === 'fr' ? 'Question posée puis résolue (« Le résultat ? Bluffant. »)' : 'Self-answered question ("The result? Stunning.")', 'Énoncer la réponse.', qa);

  // Anaphore : trois phrases de suite qui commencent par les deux mêmes mots.
  const anaphora = [];
  for (const p of paragraphs) {
    const heads = sentencesOf(p).map((s) => s.toLowerCase().split(/\s+/).slice(0, 2).join(' '));
    for (let i = 0; i + 2 < heads.length; i++) if (heads[i] && heads[i] === heads[i + 1] && heads[i] === heads[i + 2]) { anaphora.push({ line: p.start, text: `« ${heads[i]}… » ×3` }); break; }
  }
  add('anaphora', 'rhythm', lang === 'fr' ? 'Même début de phrase répété (anaphore)' : 'Repeated sentence openings', 'Varier, ou fusionner en une phrase.', anaphora);

  // Séries de trois.
  // Exactement trois éléments courts : la fin d'une énumération plus longue n'est pas une triade.
  const item = String.raw`[\p{L}'’-]+(?: [\p{L}'’-]+){0,2}`;
  const conj = lang === 'fr' ? '(?:et|ou)' : '(?:and|or)';
  const triadRe = new RegExp(String.raw`(?<!,\s?)(?<![\p{L}'’-])(?!${conj}\s)${item}, (?!${conj}\s)${item},? ${conj} ${item}(?![\p{L}'’-]|,\s)`, 'gu');
  const triads = [];
  for (const p of paragraphs) for (const m of p.text.matchAll(triadRe)) triads.push({ line: p.start, text: excerpt(m[0]) });
  const total = wordCount(paragraphs.map((p) => p.text).join(' '));
  if (triads.length >= 2 && triads.length * 150 > total) add('triad', 'rhythm', lang === 'fr' ? 'Séries de trois en grappe' : 'Clustered triads', 'Garder le nombre réel d’éléments : deux, quatre, un seul.', triads);

  // Longueurs de phrase uniformes, ponctuation réduite aux virgules et aux points.
  const allSentences = paragraphs.flatMap(sentencesOf).filter((s) => wordCount(s) >= 3);
  if (allSentences.length >= 8) {
    const lens = allSentences.map(wordCount);
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length);
    if (sd / mean < 0.3) add('uniform-length', 'rhythm', lang === 'fr' ? 'Phrases de longueur uniforme' : 'Uniform sentence length', 'Alterner des phrases courtes et des phrases longues, selon ce qu’elles portent.', [{ line: paragraphs[0].start, text: `${allSentences.length} phrases, ${mean.toFixed(0)} mots en moyenne, écart ${sd.toFixed(1)}` }]);
    const prose = paragraphs.map((p) => p.text).join(' ');
    if (allSentences.length >= 12 && !/[;:()–—]/.test(prose)) add('flat-punctuation', 'rhythm', lang === 'fr' ? 'Ponctuation réduite aux virgules et aux points' : 'Only commas and periods', 'Un deux-points, une parenthèse ou un point-virgule là où le sens les appelle.', [{ line: paragraphs[0].start, text: `${allSentences.length} phrases sans ; : ( ) ni tiret` }]);
  }

  // Tirets d'incise en série dans un paragraphe.
  const dashHits = [];
  for (const p of paragraphs) {
    const n = (p.text.match(lang === 'fr' ? /\s–\s/g : /—/g) || []).length;
    if (n > 1) dashHits.push({ line: p.start, text: `${n} ${lang === 'fr' ? 'tirets d’incise ( – )' : 'em dashes'} dans le paragraphe` });
  }
  add('dash-series', 'rhythm', lang === 'fr' ? 'Plusieurs incises en tiret dans un paragraphe' : 'Several em dashes in one paragraph', 'Une incise en tiret par paragraphe au plus ; les autres en virgules ou en parenthèses.', dashHits);

  // Gras semé et listes à intertitre gras.
  const boldHits = [], boldLead = [];
  lines.forEach((line, i) => {
    if (/^\s*(?:[-*+]|\d+[.)])\s+\*\*[^*]+\*\*/.test(line)) boldLead.push({ line: i + 1, text: excerpt(line) });
    for (const m of line.matchAll(/\*\*[^*\n]+\*\*|__[^_\n]+__/g)) boldHits.push({ line: i + 1, text: excerpt(m[0]) });
  });
  if (boldLead.length >= 3) add('bold-lead-list', 'format', lang === 'fr' ? 'Liste à intertitres en gras (« - **Mot :** phrase »)' : 'Bold inline-header list', 'Une liste simple, ou de la prose. Le gras sert à repérer, pas à scander.', boldLead);
  const nonLeadBold = boldHits.length - boldLead.length;
  if (nonLeadBold >= 2 && nonLeadBold * 120 > total) add('bold', 'format', lang === 'fr' ? 'Gras semé dans la prose' : 'Bold sprinkled in prose', 'Retirer le gras ; un seul terme par écran au plus, s’il doit être repéré.', boldHits.filter((h) => !boldLead.some((b) => b.line === h.line)), { countOnly: true });

  // Titres.
  const headingHits = { wh: [], question: [], titleCase: [], stock: [], emoji: [] };
  lines.forEach((line, i) => {
    const m = line.match(/^#{1,6}\s+(.*)$/);
    if (!m) return;
    const h = m[1].trim();
    if (lang === 'fr' ? /^(?:pourquoi|comment|ce que|ce qui|où|quand|quoi)(?![\p{L}])/iu.test(h) : /^(?:why|how|what|where|when)\b/i.test(h)) headingHits.wh.push({ line: i + 1, text: h });
    if (/\?\s*$/.test(h)) headingHits.question.push({ line: i + 1, text: h });
    const ws = h.split(/\s+/).filter((x) => /^\p{L}/u.test(x));
    const caps = ws.slice(1).filter((x) => x.length > 3 && /^\p{Lu}\p{Ll}/u.test(x));
    if (ws.length >= 3 && caps.length >= (lang === 'fr' ? 2 : Math.max(2, ws.length - 2))) headingHits.titleCase.push({ line: i + 1, text: h });
    if (/^(?:conclusion|en (?:bref|résumé)|ce qu.il faut retenir|points? clés?|à retenir|héritage|distinctions et reconnaissance|défis et perspectives|perspectives|key takeaways|in summary|conclusion|legacy|awards and recognition|challenges and legacy|future outlook|tl;dr)\b/iu.test(h)) headingHits.stock.push({ line: i + 1, text: h });
    if (/\p{Extended_Pictographic}/u.test(h)) headingHits.emoji.push({ line: i + 1, text: h });
  });
  add('heading-wh', 'format', lang === 'fr' ? 'Titre en « Pourquoi… / Comment… / Ce que… »' : 'Wh- heading', 'Un titre qui nomme la chose (« Le cache des prix »).', headingHits.wh);
  add('heading-question', 'format', lang === 'fr' ? 'Titre en question' : 'Question heading', 'Un titre qui nomme la chose (une FAQ excepté).', headingHits.question);
  add('heading-case', 'format', lang === 'fr' ? 'Majuscules superflues dans un titre' : 'Title Case heading', lang === 'fr' ? 'Majuscule au premier mot et aux noms propres seulement.' : 'Sentence case.', headingHits.titleCase);
  add('heading-stock', 'format', lang === 'fr' ? 'Section-type (« Conclusion », « Héritage », « Points clés »)' : 'Stock section ("Conclusion", "Legacy", "Key takeaways")', 'Supprimer la section, ou la nommer d’après son contenu réel.', headingHits.stock);
  add('heading-emoji', 'format', lang === 'fr' ? 'Émoji dans un titre' : 'Emoji in heading', 'Retirer l’émoji.', headingHits.emoji);

  // Émojis en tête de ligne de liste, et dans la prose.
  const emoji = [];
  lines.forEach((line, i) => { if (!/^#/.test(line) && /\p{Extended_Pictographic}/u.test(line)) emoji.push({ line: i + 1, text: excerpt(line) }); });
  add('emoji', 'format', lang === 'fr' ? 'Émoji dans le texte' : 'Emoji in text', 'Retirer, sauf réaction voulue dans une conversation.', emoji);

  // Séparateurs horizontaux et Markdown dans un support qui ne l'affiche pas.
  const rules = [];
  const fmEnd = lines[0] === '---' ? lines.indexOf('---', 1) : -1;
  lines.forEach((line, i) => { if (i > fmEnd && /^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)) rules.push({ line: i + 1, text: line.trim() }); });
  add('horizontal-rule', 'format', lang === 'fr' ? 'Séparateur horizontal (---) entre des sections' : 'Horizontal rule between sections', 'Les titres suffisent à séparer.', rules);
  if (plain) {
    const md = [];
    lines.forEach((line, i) => { if (/^#{1,6}\s|\*\*|__|^\s*[-*+]\s|\[[^\]]+\]\([^)]+\)|^\s*>\s/.test(line)) md.push({ line: i + 1, text: excerpt(line) }); });
    add('markdown-in-plain', 'format', lang === 'fr' ? 'Markdown dans un support sans Markdown' : 'Markdown in a plain-text medium', 'Du texte simple : phrases, paragraphes, retours à la ligne.', md);
  }
  return out;
}

// ── Analyse ───────────────────────────────────────────────────────────────────────────────
function scan(raw, { name, lang: forcedLang, plain, skipQuoted }) {
  const isHtml = /\.html?$/i.test(name || '');
  const text = clean(raw, { isHtml, skipQuoted });
  const lang = forcedLang || detectLanguage(text);
  const toLine = lineIndex(text);
  const findings = [];

  const run = (rule, source) => {
    const hits = [];
    for (const pattern of rule.patterns) {
      const re = new RegExp(pattern, rule.flags || 'gimu');
      for (const m of source.matchAll(re)) {
        if (!m[0].trim()) continue;
        hits.push({ line: toLine(m.index + (m[0].length - m[0].trimStart().length)), text: excerpt(m[0]) });
      }
    }
    hits.sort((a, b) => a.line - b.line);
    const unique = hits.filter((h, i) => i === 0 || h.line !== hits[i - 1].line || h.text !== hits[i - 1].text);
    if (unique.length >= (rule.min || 1)) findings.push({ id: rule.id, group: rule.group, label: rule.label, fix: rule.fix, hits: unique, countOnly: !!rule.countOnly });
  };

  // Le Markdown est souvent coupé à 80 ou 100 colonnes : on recolle les lignes d'un même
  // paragraphe (même longueur de texte, donc mêmes positions et mêmes numéros de ligne), sinon
  // un tic à cheval sur deux lignes passe inaperçu.
  const flowing = text.replace(/[^\S\n]*\n(?![^\S\n]*(?:\n|[-*+]\s|\d+[.)]\s|#|>|\||<|```|~~~|$))/g, (m) => ' '.repeat(m.length));
  for (const rule of RULES) if (rule.lang === 'any' || rule.lang === lang) run(rule, flowing);
  const rawNormalized = raw.replace(/\r\n?/g, '\n')
    .replace(/<!--\s*tell-scan:\s*off\s*-->[\s\S]*?(?:<!--\s*tell-scan:\s*on\s*-->|$)/g, blank);
  for (const rule of RAW_RULES) run(rule, rawNormalized);
  findings.push(...structuralChecks(text, lang, toLine, plain));

  const order = Object.keys(GROUPS);
  findings.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
  const wordTotal = (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
  return { name, lang, words: wordTotal, findings };
}

function report(result) {
  const { name, lang, words: total, findings } = result;
  const signals = findings.reduce((n, f) => n + f.hits.length, 0);
  const out = [`tell-scan : ${name} (${lang}, ${total} mots)`];
  if (!findings.length) { out.push('  Aucun signal.'); return out.join('\n'); }
  let group = null;
  for (const f of findings) {
    if (f.group !== group) { group = f.group; out.push('', `■ ${GROUPS[group]}`); }
    out.push(`  [${f.id}] ${f.label} (${f.hits.length})`);
    const shown = f.countOnly ? f.hits.slice(0, 3) : f.hits.slice(0, 12);
    for (const h of shown) out.push(`    L${h.line}  ${h.text}`);
    if (f.hits.length > shown.length) out.push(`    … et ${f.hits.length - shown.length} de plus`);
    out.push(`    ⮑ ${f.fix}`);
  }
  out.push('', `${signals} signaux, ${findings.length} motifs. Un signal est un indice : relire, puis réécrire la phrase autour de son fait.`);
  return out.join('\n');
}

// ── Ligne de commande ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (f) => { const i = args.indexOf(f); if (i >= 0) { args.splice(i, 1); return true; } return false; };
const option = (f) => { const i = args.indexOf(f); if (i >= 0) { const v = args[i + 1]; args.splice(i, 2); return v; } return undefined; };
const json = flag('--json'), strict = flag('--strict'), plain = flag('--plain'), skipQuoted = flag('--skip-quoted');
const lang = option('--lang');
if (!args.length || flag('--help') || flag('-h')) {
  console.log('Usage : node tell-scan.mjs [--lang fr|en] [--plain] [--skip-quoted] [--json] [--strict] fichier… | -');
  process.exit(args.length ? 0 : 2);
}
const results = args.map((file) => scan(readFileSync(file === '-' ? 0 : file, 'utf8'), { name: file === '-' ? 'entrée standard' : file, lang, plain, skipQuoted }));
console.log(json ? JSON.stringify(results, null, 2) : results.map(report).join('\n\n'));
if (strict && results.some((r) => r.findings.length)) process.exit(1);
