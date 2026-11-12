# robots.txt, robots des moteurs et robots d'IA

Tout ce qui suit a été vérifié dans la documentation des éditeurs le 12/11/2026. Ces pages
changent : relire la source avant d'affirmer un comportement à l'utilisateur.

`scripts/seo_check.py robots <site> [--path /chemin]` lit le fichier, dit quel groupe suit
chaque robot et si le chemin lui est permis.

## Comment Google lit robots.txt

Source : developers.google.com/search/docs/crawling-indexing/robots/robots_txt

- **Un robot ne suit qu'un groupe** : le plus précis qui le nomme. « User agent specific
  groups and global groups (`*`) are not combined. » Un groupe `User-agent: Googlebot` réduit
  à `Allow: /` annule pour lui tous les `Disallow` du groupe `*` (piège 19 du `SKILL.md`).
  Plusieurs groupes qui nomment **le même** robot, eux, se cumulent.
- **Règle la plus longue** : entre `Allow` et `Disallow`, c'est le motif le plus long qui
  l'emporte ; à égalité, `Allow`.
- **Code de réponse du fichier** :

| Réponse | Ce que fait Google |
|---|---|
| 2xx | applique le fichier |
| 4xx (sauf 429) | comme s'il n'y avait pas de fichier : **aucune restriction** |
| 5xx ou 429 | arrête d'explorer le site **12 h** ; ensuite, jusqu'à **30 jours**, applique la dernière version lisible (sans version en cache : aucune restriction) ; au-delà, si le site répond par ailleurs, fait comme s'il n'y avait pas de fichier |

Un `robots.txt` en erreur serveur n'est donc pas un « tout interdit » durable, mais il gèle
l'exploration une demi-journée à chaque fois : à corriger en priorité.

## Ce qui ne sert à rien chez Google

- **L'API d'indexation** : « can only be used to crawl pages with either JobPosting or
  BroadcastEvent embedded in a VideoObject » (quota de 200 par jour). Des outils la
  conseillent pour des pages ordinaires : ne pas suivre. Pour quelques URL, « Demander une
  indexation » dans la Search Console ; pour beaucoup, le sitemap.
- **IndexNow** : Google ne le lit pas (voir `SKILL.md`, piège 12).
- **Le réglage de vitesse d'exploration** de la Search Console : retiré le 8 janvier 2024.
  Google règle seul sa cadence et ralentit quand le serveur répond lentement ou en 5xx.
- **`llms.txt`** : « Google Search ignores them » (guide d'optimisation pour l'IA de Google,
  précision du 15/06/2026). Ni bonus, ni pénalité. Il sert aux agents de code qui lisent une
  documentation technique, pas au référencement.

## Robots d'IA : entraînement, recherche, et visite à la demande

Bloquer le robot d'entraînement d'un éditeur **ne retire pas** le site de ses réponses de
recherche, et inversement. Toujours regarder le bon jeton.

| Éditeur | Jeton | Rôle | robots.txt |
|---|---|---|---|
| Google | `Googlebot` | Recherche, y compris les AI Overviews | respecté |
| Google | `Google-Extended` | Entraînement et ancrage de Gemini. « does not impact a site's inclusion in Google Search nor is it used as a ranking signal » | respecté |
| Google | Fetchers déclenchés par un utilisateur (Google-Agent…) | Visite à la demande | « generally ignore robots.txt rules » |
| OpenAI | `GPTBot` | Entraînement | respecté |
| OpenAI | `OAI-SearchBot` | Apparaître dans la recherche de ChatGPT | respecté |
| OpenAI | `ChatGPT-User` | Visite à la demande d'un utilisateur | « robots.txt rules may not apply » |
| Anthropic | `ClaudeBot` | Entraînement | respecté |
| Anthropic | `Claude-SearchBot` | Recherche de Claude | respecté |
| Anthropic | `Claude-User` | Visite à la demande d'un utilisateur | **respecté** |
| Apple | `Applebot` | Siri, Spotlight, Safari | respecté |
| Apple | `Applebot-Extended` | Refus de l'entraînement ; ne visite rien lui-même, une page qui l'interdit reste dans la recherche | respecté |

Sources : developers.google.com/crawling (common crawlers, user-triggered fetchers),
developers.openai.com/api/docs/bots, support.claude.com (article « What is ClaudeBot »),
support.apple.com/en-us/119829.

Un site qui veut être cité par les assistants sans servir à leur entraînement interdit
`GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, et laisse passer les robots
de recherche. C'est un choix de l'utilisateur : le lui présenter, ne pas le faire d'office.
