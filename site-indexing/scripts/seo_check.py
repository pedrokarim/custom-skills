"""Vérifications d'indexation sans navigateur, telles que Googlebot reçoit les fichiers.

Exemples :
    python -I seo_check.py page https://exemple.com/en https://exemple.com/en/about
    python -I seo_check.py hreflang https://exemple.com/en
    python -I seo_check.py robots https://exemple.com
    python -I seo_check.py sitemap https://exemple.com --sample 12
    python -I seo_check.py sitemap https://exemple.com/sitemap.xml --depth 2
    python -I seo_check.py snapshot https://exemple.com/en https://exemple.com/fr -o avant.json
    python -I seo_check.py diff avant.json

Bibliothèque standard uniquement. Le HTML lu est celui du serveur, avant JavaScript : ce
que Google rend ensuite peut différer (voir render-gap.js) et charger davantage (voir
page-weight.js).
"""
import argparse
import collections
import concurrent.futures
import datetime
import gzip
import html
import html.parser
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

GOOGLEBOT_SMARTPHONE = (
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/141.0.7390.122 Mobile Safari/537.36 "
    "(compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
)

# Googlebot ne lit que les 2 premiers Mo d'un fichier HTML, mesurés décompressés, en-têtes
# HTTP compris ; il indexe la partie lue et ignore le reste.
GOOGLEBOT_HTML_LIMIT = 2 * 1024 * 1024
# Un fichier sitemap : 50 000 URL et 50 Mo décompressés au plus.
SITEMAP_MAX_URLS = 50_000
SITEMAP_MAX_BYTES = 50 * 1024 * 1024
# Au-delà, on arrête de lire : un sitemap ne devrait jamais en approcher.
READ_CAP = 80 * 1024 * 1024

# Robots à passer en revue dans robots.txt. Les jetons d'IA ne se valent pas : l'un sert à
# l'entraînement, l'autre à la citation dans les réponses (voir references/crawlers.md).
CRAWLER_TOKENS = [
    "Googlebot", "Googlebot-Image", "Bingbot", "Google-Extended", "Applebot",
    "Applebot-Extended", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot",
    "Claude-SearchBot", "Claude-User", "PerplexityBot", "CCBot", "Bytespider",
]

# Erreurs de codes hreflang vues en vrai : code de pays pris pour une langue, ou région
# qui n'existe pas dans l'ISO 3166-1.
LANGUAGE_MISTAKES = {"jp": "ja", "kr": "ko", "cn": "zh", "gr": "el", "dk": "da", "cz": "cs",
                     "se": "sv (se = sami du Nord)", "ua": "uk", "tc": "zh-Hant", "sc": "zh-Hans"}
# Google : « EU, UN ou UK » n'ont aucun effet ; les codes ne tiennent pas compte de la casse.
REGION_MISTAKES = {"UK": "GB (UK est sans effet)", "EU": "un pays précis (EU est sans effet)",
                   "UN": "un pays précis (UN est sans effet)",
                   "LA": "un pays précis (LA n'en est pas un)"}

W3C_DATETIME = re.compile(
    r"^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?)?)?$"
)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    """On veut voir les redirections, pas les suivre en silence."""

    def redirect_request(self, *args, **kwargs):
        return None


def fetch(url, cap=READ_CAP):
    """Renvoie (statut, en-têtes, corps décompressé, durée en s) sans suivre les redirections.

    Pas d'Accept-Encoding : le corps arrive décompressé, c'est sa taille qui compte pour la
    limite de Googlebot. Un `.gz` (sitemap) est décompressé ici.
    """
    opener = urllib.request.build_opener(NoRedirect)
    request = urllib.request.Request(url, headers={"User-Agent": GOOGLEBOT_SMARTPHONE})
    started = time.monotonic()
    try:
        with opener.open(request, timeout=60) as response:
            status, headers, body = response.status, response.headers, response.read(cap)
    except urllib.error.HTTPError as error:
        status, headers, body = error.code, error.headers, error.read(cap)
    except (urllib.error.URLError, TimeoutError, ConnectionError) as error:
        return None, {}, str(error).encode(), time.monotonic() - started
    if body[:2] == b"\x1f\x8b":
        body = gzip.decompress(body)
    return status, headers, body, time.monotonic() - started


def site_root(url):
    parts = urllib.parse.urlsplit(url if "://" in url else "https://" + url)
    return f"{parts.scheme}://{parts.netloc}"


def same_url(a, b):
    """Égalité stricte, à la casse du domaine près : un `/` final compte, Google aussi."""
    if not a or not b:
        return False
    pa, pb = urllib.parse.urlsplit(a), urllib.parse.urlsplit(b)
    return (pa.scheme, pa.netloc.lower(), pa.path or "/", pa.query) == \
           (pb.scheme, pb.netloc.lower(), pb.path or "/", pb.query)


# --------------------------------------------------------------------------------------
# Lecture d'une page
# --------------------------------------------------------------------------------------

class PageParser(html.parser.HTMLParser):
    """Relève ce qui compte pour l'indexation, avec la position de chaque élément."""

    SKIPPED = {"script", "style", "noscript", "svg", "template"}

    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.source = source
        self.line_starts = [0] + [m.end() for m in re.finditer("\n", source)]
        self.head_end = source.lower().find("</head>")
        self.elements = []  # (tag, attrs, position en caractères)
        self.titles = []
        self.h1 = []
        self.jsonld = []  # (texte, position)
        self.lang = None
        self.words = 0
        self._stack = []
        self._text_target = None
        self._buffer = []

    def position(self):
        line, column = self.getpos()
        return self.line_starts[line - 1] + column

    def handle_starttag(self, tag, attrs):
        attributes = {name: value or "" for name, value in attrs}
        if tag == "html" and self.lang is None:
            self.lang = attributes.get("lang")
        if tag in ("meta", "link", "base"):
            self.elements.append((tag, attributes, self.position()))
            return
        if tag == "script" and attributes.get("type", "").lower() == "application/ld+json":
            self._text_target = ("jsonld", self.position())
            self._buffer = []
        elif tag == "title" and not self._stack_has("svg"):
            self._text_target = ("title", self.position())
            self._buffer = []
        elif tag == "h1":
            self._text_target = ("h1", self.position())
            self._buffer = []
        self._stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in ("meta", "link", "base") and self._stack and self._stack[-1] == tag:
            self._stack.pop()

    def handle_endtag(self, tag):
        if self._text_target and tag == {"jsonld": "script"}.get(self._text_target[0], self._text_target[0]):
            kind, start = self._text_target
            text = "".join(self._buffer).strip()
            if kind == "jsonld":
                self.jsonld.append((text, start))
            elif kind == "title":
                self.titles.append((text, start))
            else:
                self.h1.append(" ".join(text.split()))
            self._text_target = None
        if tag in self._stack:
            while self._stack and self._stack.pop() != tag:
                pass

    def handle_data(self, data):
        if self._text_target:
            self._buffer.append(data)
        if not any(tag in self.SKIPPED for tag in self._stack):
            self.words += len(data.split())

    def _stack_has(self, tag):
        return tag in self._stack


def jsonld_types(blocks):
    """Types déclarés dans les blocs JSON-LD, et nombre de blocs illisibles."""
    types, invalid = [], 0

    def walk(node):
        if isinstance(node, dict):
            kind = node.get("@type")
            if kind:
                types.extend(kind if isinstance(kind, list) else [kind])
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    for text, _ in blocks:
        try:
            walk(json.loads(text))
        except ValueError:
            invalid += 1
    return types, invalid


def check_hreflang_code(code):
    """Renvoie un problème lisible, ou None si le code est bien formé."""
    if code.lower() == "x-default":
        return None
    parts = code.split("-")
    language = parts[0].lower()
    if language in LANGUAGE_MISTAKES:
        return f"« {code} » : la langue s'écrit {LANGUAGE_MISTAKES[language]}"
    if not re.fullmatch(r"[a-z]{2}", language):
        return f"« {code} » : langue attendue en ISO 639-1 (deux lettres)"
    for part in parts[1:]:
        if re.fullmatch(r"[A-Za-z]{4}", part):
            continue  # écriture ISO 15924 : zh-Hant, zh-Hans
        if part.upper() in REGION_MISTAKES:
            return f"« {code} » : la région s'écrit {REGION_MISTAKES[part.upper()]}"
        if not re.fullmatch(r"[A-Za-z]{2}", part):
            return f"« {code} » : région attendue en ISO 3166-1 alpha-2"
    return None


def analyze(url):
    """Tout ce qu'on sait d'une page sans exécuter son JavaScript."""
    status, headers, body, duration = fetch(url)
    page = {"url": url, "status": status, "seconds": round(duration, 1), "bytes": len(body)}
    if status is None:
        page["error"] = body.decode(errors="replace")
        return page
    page["location"] = headers.get("Location")
    page["x_robots_tag"] = headers.get("X-Robots-Tag")
    page["content_type"] = headers.get("Content-Type")
    if status in (301, 302, 303, 307, 308) or "html" not in (page["content_type"] or "html"):
        return page

    source = body.decode("utf-8", errors="replace")
    parser = PageParser(source)
    parser.feed(source)
    head_end = parser.head_end if parser.head_end >= 0 else len(source)

    def byte_offset(position):
        return len(source[:position].encode("utf-8"))

    def where(position):
        place = "head" if position < head_end else "BODY"
        if byte_offset(position) > GOOGLEBOT_HTML_LIMIT:
            place += ", APRÈS 2 Mo"
        return place

    def collect(predicate, value):
        return [(value(a), where(p)) for tag, a, p in parser.elements if predicate(tag, a)]

    def rel(attributes, name):
        return name in attributes.get("rel", "").lower().split()

    def meta(attributes, name):
        return attributes.get("name", "").lower() == name

    page["lang"] = parser.lang
    page["title"] = [(" ".join(text.split()), where(p)) for text, p in parser.titles]
    page["description"] = collect(lambda t, a: t == "meta" and meta(a, "description"),
                                  lambda a: a.get("content", ""))
    page["robots"] = collect(lambda t, a: t == "meta" and (meta(a, "robots") or meta(a, "googlebot")),
                             lambda a: f"{a.get('name')}={a.get('content', '')}")
    page["canonical"] = collect(lambda t, a: t == "link" and rel(a, "canonical"),
                                lambda a: urllib.parse.urljoin(url, a.get("href", "")))
    page["hreflang"] = collect(lambda t, a: t == "link" and rel(a, "alternate") and "hreflang" in a,
                               lambda a: (a["hreflang"], urllib.parse.urljoin(url, a.get("href", ""))))
    page["image_preloads"] = len(collect(
        lambda t, a: t == "link" and rel(a, "preload") and a.get("as") == "image", lambda a: 1))
    types, invalid = jsonld_types(parser.jsonld)
    page["jsonld"] = {"blocks": len(parser.jsonld), "invalid": invalid, "types": sorted(set(types)),
                      "after_2mb": sum(byte_offset(p) > GOOGLEBOT_HTML_LIMIT for _, p in parser.jsonld)}
    page["h1"] = parser.h1
    page["words"] = parser.words
    return page


def page_problems(page):
    """Les défauts d'une page analysée, en phrases."""
    problems = []
    if page.get("status") != 200:
        return problems
    if page["bytes"] > GOOGLEBOT_HTML_LIMIT:
        problems.append(f"HTML de {page['bytes'] / 1048576:.1f} Mo : Googlebot ignore tout ce "
                        "qui suit les 2 premiers Mo")
    if page["x_robots_tag"] and "noindex" in page["x_robots_tag"].lower():
        problems.append(f"en-tête X-Robots-Tag : {page['x_robots_tag']}")
    for value, _ in page["robots"]:
        if "noindex" in value.lower():
            problems.append(f"meta robots : {value}")
    for field in ("title", "description", "canonical"):
        if len(page[field]) > 1:
            problems.append(f"{len(page[field])} balises {field} : laquelle est la bonne ?")
        for _, place in page[field]:
            if place != "head":
                problems.append(f"{field} placé en {place} : Google l'ignore à cet endroit")
    if not page["canonical"]:
        problems.append("pas de canonical")
    for value, _ in page["description"][:1]:
        if not 50 <= len(value) <= 160:
            problems.append(f"description de {len(value)} caractères, hors de 50–160 "
                            "(court est normal en CJK)")
    canonical = page["canonical"][0][0] if page["canonical"] else None
    elsewhere = canonical and not same_url(canonical, page["url"])
    if elsewhere:
        problems.append(f"canonical vers une autre URL : {canonical}")
    if page["hreflang"]:
        if elsewhere:
            problems.append("hreflang sur une page dont le canonical vise une autre URL : "
                            "signaux contradictoires, n'annoncer que des URL canoniques")
        targets = [href for (code, href), _ in page["hreflang"]]
        if not any(same_url(href, canonical or page["url"]) for href in targets):
            problems.append("hreflang sans auto-référence (aucune entrée ne vise cette page)")
        if not any(code.lower() == "x-default" for (code, _), _ in page["hreflang"]):
            problems.append("hreflang sans x-default")
        codes = [code.lower() for (code, _), _ in page["hreflang"]]
        for code in sorted({c for c in codes if codes.count(c) > 1}):
            problems.append(f"hreflang « {code} » déclaré plusieurs fois")
        for (code, _), place in page["hreflang"]:
            issue = check_hreflang_code(code)
            if issue:
                problems.append("hreflang " + issue)
        places = {place for _, place in page["hreflang"]}
        if places != {"head"}:
            problems.append(f"hreflang placés en {', '.join(sorted(places))}")
    if page["jsonld"]["invalid"]:
        problems.append(f"{page['jsonld']['invalid']} bloc(s) JSON-LD illisible(s)")
    if page["jsonld"]["after_2mb"]:
        problems.append(f"{page['jsonld']['after_2mb']} bloc(s) JSON-LD après 2 Mo")
    if page["image_preloads"] > 10:
        problems.append(f"{page['image_preloads']} préchargements d'image : <img> sans "
                        "loading=\"lazy\" ? (React 19 les précharge)")
    return problems


def check_page(url):
    page = analyze(url)
    print(f"{url}\n  statut {page['status']} en {page['seconds']} s, HTML {page['bytes'] / 1024:.0f} Ko")
    if page.get("error"):
        print(f"  erreur : {page['error']}")
        return
    if page.get("location"):
        print(f"  → redirige vers {page['location']}")
        return
    for label, key in (("X-Robots-Tag", "x_robots_tag"), ("Content-Type", "content_type")):
        if page.get(key):
            print(f"  {label}: {page[key]}")
    if "title" not in page:
        return
    print(f"  lang         : {page['lang']!r}")
    print(f"  title        : {page['title'][0][0] if page['title'] else None!r}")
    print(f"  robots       : {[value for value, _ in page['robots']] or 'absent (index, follow)'}")
    print(f"  canonical    : {page['canonical'][0][0] if page['canonical'] else None}")
    codes = [code for (code, _), _ in page["hreflang"]]
    more = f", +{len(codes) - 20}" if len(codes) > 20 else ""
    print(f"  hreflang     : {len(codes)} ({', '.join(codes[:20])}{more})")
    jsonld = page["jsonld"]
    print(f"  JSON-LD      : {jsonld['blocks']} bloc(s) {', '.join(jsonld['types'])}")
    print(f"  H1           : {page['h1'][:2]}")
    print(f"  texte visible dans le HTML : ~{page['words']} mots (menu compris)")
    problems = page_problems(page)
    for problem in problems:
        print(f"  ! {problem}")
    if not problems:
        print("  rien à signaler")


# --------------------------------------------------------------------------------------
# Réciprocité des hreflang
# --------------------------------------------------------------------------------------

def check_hreflang(url):
    """Chaque version doit citer toutes les autres, elle-même comprise. Un lien sans
    retour fait ignorer la paire."""
    origin = analyze(url)
    if not origin.get("hreflang"):
        print(f"{url} : aucun hreflang dans la réponse (statut {origin.get('status')})")
        return
    expected = {code.lower(): href for (code, href), _ in origin["hreflang"]}
    print(f"{url} : {len(expected)} version(s) déclarée(s)")
    targets = sorted(set(expected.values()))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        pages = dict(zip(targets, pool.map(analyze, targets)))
    faults = 0
    for code, href in sorted(expected.items()):
        page = pages[href]
        line = f"  {code:<10} {href}"
        if page.get("status") != 200:
            print(f"{line}\n    ! statut {page.get('status')} {page.get('location') or ''}")
            faults += 1
            continue
        canonical = page["canonical"][0][0] if page["canonical"] else None
        found = {c.lower(): h for (c, h), _ in page["hreflang"]}
        issues = []
        if canonical and not same_url(canonical, href):
            issues.append(f"canonical vers {canonical} : la version annoncée n'est pas canonique")
        missing = [c for c, h in expected.items() if not same_url(found.get(c), h)]
        if missing:
            issues.append("ne renvoie pas vers : " + ", ".join(missing))
        extra = sorted(set(found) - set(expected))
        if extra:
            issues.append("déclare en plus : " + ", ".join(extra))
        print(line)
        for issue in issues:
            print(f"    ! {issue}")
        faults += bool(issues)
    print("  ensemble cohérent" if not faults else f"  {faults} version(s) à corriger")


# --------------------------------------------------------------------------------------
# robots.txt
# --------------------------------------------------------------------------------------

def parse_robots(text):
    """Groupes du robots.txt : {agent: [(allow, motif)]}, plus les lignes Sitemap."""
    groups, sitemaps = collections.defaultdict(list), []
    agents, in_rules = [], False
    for raw in text.splitlines():
        line = raw.split("#", 1)[0].strip()
        if ":" not in line:
            continue
        field, value = (part.strip() for part in line.split(":", 1))
        field = field.lower()
        if field == "user-agent":
            if in_rules:
                agents, in_rules = [], False
            agents.append(value.lower())
            groups.setdefault(value.lower(), [])
        elif field in ("allow", "disallow"):
            in_rules = True
            for agent in agents:
                if value or field == "allow":
                    groups[agent].append((field == "allow", value))
        elif field == "sitemap":
            sitemaps.append(value)
    return groups, sitemaps


def group_for(groups, token):
    """Le seul groupe que suit ce robot : le plus précis qui le nomme, sinon `*`.
    Les groupes ne se cumulent pas."""
    token = token.lower()
    if token in groups:
        return token
    prefixes = [agent for agent in groups if agent != "*" and token.startswith(agent)]
    if prefixes:
        return max(prefixes, key=len)
    return "*" if "*" in groups else None


def path_allowed(rules, path):
    """Règle la plus longue qui correspond ; à égalité, Allow l'emporte."""
    best = (-1, True)
    for allow, pattern in rules:
        regex = re.escape(pattern).replace(r"\*", ".*")
        if regex.endswith(r"\$"):
            regex = regex[:-2] + "$"
        if re.match(regex, path):
            candidate = (len(pattern), allow)
            if candidate[0] > best[0] or (candidate[0] == best[0] and allow):
                best = candidate
    return best[1]


def check_robots(url, path):
    root = site_root(url)
    status, _, body, _ = fetch(root + "/robots.txt")
    print(f"{root}/robots.txt : statut {status}")
    if status is None or status >= 500 or status == 429:
        print("  ! erreur serveur : Google cesse d'explorer le site 12 h, puis s'en tient à la "
              "dernière version lisible jusqu'à 30 jours (voir references/crawlers.md)")
        return
    if status >= 400:
        print("  absent : aucune restriction pour aucun robot")
        return
    groups, sitemaps = parse_robots(body.decode("utf-8", errors="replace"))
    print(f"  groupes : {', '.join(groups) or 'aucun'}")
    print(f"  Sitemap : {', '.join(sitemaps) or 'aucun'}")
    print(f"  accès à {path} :")
    for token in CRAWLER_TOKENS:
        group = group_for(groups, token)
        allowed = path_allowed(groups.get(group, []), path) if group else True
        print(f"    {token:<18} {'autorisé' if allowed else 'INTERDIT':<9} (groupe {group or 'aucun'})")


# --------------------------------------------------------------------------------------
# Sitemaps
# --------------------------------------------------------------------------------------

def discover_sitemaps(url):
    """Les sitemaps déclarés dans robots.txt, sinon les emplacements habituels."""
    if re.search(r"\.xml(\.gz)?($|\?)", url):
        return [url]
    root = site_root(url)
    status, _, body, _ = fetch(root + "/robots.txt")
    declared = parse_robots(body.decode("utf-8", errors="replace"))[1] if status == 200 else []
    if declared:
        print(f"robots.txt déclare {len(declared)} sitemap(s)")
        return declared
    print("robots.txt ne déclare aucun sitemap : essai des emplacements habituels")
    for candidate in ("/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml"):
        if fetch(root + candidate)[0] == 200:
            return [root + candidate]
    return []


def read_sitemap(url, state, nested=False):
    """Lit un fichier (et ses enfants s'il s'agit d'un index), alimente `state`."""
    status, _, body, _ = fetch(url)
    if status != 200:
        state["problems"].append(f"{url} : statut {status}")
        return
    xml = body.decode("utf-8", errors="replace").lstrip("﻿")
    if "<sitemapindex" in xml[:2000]:
        children = [html.unescape(c.strip()) for c in re.findall(r"<loc>\s*(.*?)\s*</loc>", xml, re.S)]
        if nested:
            state["problems"].append(f"{url} : index listé par un autre index (interdit, "
                                     "les moteurs ne le suivent pas)")
            return
        print(f"{url} : index de {len(children)} sitemap(s)")
        for child in children:
            read_sitemap(child, state, nested=True)
        return
    entries = []
    for block in re.findall(r"<url>(.*?)</url>", xml, re.S):
        location = re.search(r"<loc>\s*(.*?)\s*</loc>", block, re.S)
        lastmod = re.search(r"<lastmod>\s*(.*?)\s*</lastmod>", block, re.S)
        if location:
            loc = html.unescape(location.group(1).replace("<![CDATA[", "").replace("]]>", ""))
            entries.append((loc, lastmod.group(1) if lastmod else None))
    host = urllib.parse.urlsplit(url).netloc.lower()
    locations = [loc for loc, _ in entries]
    lastmods = [value for _, value in entries if value]
    problems = state["problems"]
    if len(entries) > SITEMAP_MAX_URLS:
        problems.append(f"{url} : {len(entries)} URL, au-delà de {SITEMAP_MAX_URLS}")
    if len(body) > SITEMAP_MAX_BYTES:
        problems.append(f"{url} : {len(body) / 1048576:.0f} Mo décompressés, au-delà de 50 Mo")
    duplicates = len(locations) - len(set(locations))
    if duplicates:
        problems.append(f"{url} : {duplicates} URL en double dans le fichier")
    across = sum(loc in state["seen"] for loc in set(locations))
    if across:
        problems.append(f"{url} : {across} URL déjà listées par un autre fichier")
    other_hosts = [loc for loc in locations if urllib.parse.urlsplit(loc).netloc.lower() != host]
    if other_hosts:
        problems.append(f"{url} : {len(other_hosts)} URL sur un autre hôte, ex. {other_hosts[0]}")
    insecure = [loc for loc in locations if loc.startswith("http://")]
    if insecure:
        problems.append(f"{url} : {len(insecure)} URL en http://")
    invalid = [value for value in lastmods if not W3C_DATETIME.match(value)]
    if invalid:
        problems.append(f"{url} : {len(invalid)} lastmod hors format W3C, ex. {invalid[0]!r}")
    if len(lastmods) >= 20:
        value, count = collections.Counter(lastmods).most_common(1)[0]
        if count / len(lastmods) >= 0.9:
            problems.append(f"{url} : {count}/{len(lastmods)} lastmod identiques ({value}) : "
                            "horodatage de build ? Google ignore un lastmod qui ment")
    for tag in ("priority", "changefreq"):
        if f"<{tag}>" in xml:
            state["notes"].add(f"<{tag}> présent : Google l'ignore (inoffensif)")
    print(f"{url} : {len(entries)} URL, lastmod sur {len(lastmods)}")
    state["seen"].update(locations)
    state["entries"].extend(locations)


def section_of(location, depth):
    path = urllib.parse.urlsplit(location).path.strip("/")
    segments = path.split("/") if path else []
    # Le premier segment est souvent la langue : on le saute s'il fait 2 lettres (ou xx-YY).
    if segments and re.fullmatch(r"[a-z]{2}(-[A-Za-z]{2,4})?", segments[0]):
        segments = segments[1:]
    return "/".join(segments[:depth]) or "(accueil)", len(segments)


def stratified_sample(locations, depth, size):
    """Au moins une URL par section, en commençant par les plus grosses."""
    sections = collections.defaultdict(list)
    for location in locations:
        sections[section_of(location, depth)[0]].append(location)
    queues = sorted(sections.values(), key=len, reverse=True)
    sample, index = [], 0
    while len(sample) < size and any(index < len(q) for q in queues):
        for queue in queues:
            if index < len(queue) and len(sample) < size:
                # On pioche à intervalles réguliers, pas les premières URL de la section.
                sample.append(queue[(index * 7919) % len(queue)])
        index += 1
    return list(dict.fromkeys(sample))


def check_sitemap(url, depth, sample_size):
    state = {"problems": [], "notes": set(), "seen": set(), "entries": []}
    sitemaps = discover_sitemaps(url)
    if not sitemaps:
        print("aucun sitemap trouvé")
        return
    for sitemap in sitemaps:
        read_sitemap(sitemap, state)
    locations = list(dict.fromkeys(state["entries"]))
    counter = collections.Counter(section_of(location, depth) for location in locations)
    print(f"\n{len(locations)} URL distinctes, par section :")
    for (key, levels), count in counter.most_common(25):
        share = 100 * count / max(len(locations), 1)
        print(f"  {count:>6}  {share:5.1f} %  {key}  (profondeur {levels})")
    for problem in state["problems"]:
        print(f"  ! {problem}")
    for note in sorted(state["notes"]):
        print(f"  · {note}")
    if not sample_size or not locations:
        return
    sample = stratified_sample(locations, depth, sample_size)
    print(f"\nÉchantillon de {len(sample)} URL : chacune doit répondre 200, sans noindex, "
          "canonique sur elle-même")
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for page in pool.map(analyze, sample):
            issues = []
            if page.get("status") != 200:
                issues.append(f"statut {page.get('status')}"
                              + (f" → {page['location']}" if page.get("location") else ""))
            else:
                issues = page_problems(page)
            print(f"  {'ok ' if not issues else '!  '} {page['url']}")
            for issue in issues:
                print(f"       {issue}")


# --------------------------------------------------------------------------------------
# Instantané avant / après un déploiement
# --------------------------------------------------------------------------------------

SNAPSHOT_FIELDS = ("status", "location", "x_robots_tag", "lang", "title", "description",
                   "robots", "canonical", "hreflang", "h1", "jsonld")


def summary(page):
    """Ce qu'on compare d'un déploiement à l'autre, sans les positions."""
    def values(items):
        return [value if not isinstance(value, tuple) else list(value) for value, _ in items]
    result = {}
    for field in SNAPSHOT_FIELDS:
        value = page.get(field)
        if field in ("title", "description", "robots", "canonical", "hreflang"):
            value = values(value or [])
        elif field == "jsonld" and value:
            value = {"blocks": value["blocks"], "types": value["types"]}
        result[field] = value
    result["words"] = page.get("words")
    return result


def take_snapshot(urls, output):
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        pages = {page["url"]: summary(page) for page in pool.map(analyze, urls)}
    snapshot = {"taken_at": datetime.datetime.now().isoformat(timespec="seconds"), "pages": pages}
    with open(output, "w", encoding="utf-8") as handle:
        json.dump(snapshot, handle, ensure_ascii=False, indent=1)
    print(f"{len(pages)} page(s) enregistrée(s) dans {output}")


def diff_snapshot(path):
    with open(path, encoding="utf-8") as handle:
        before = json.load(handle)
    print(f"comparaison avec l'instantané du {before['taken_at']}")
    urls = list(before["pages"])
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        after = {page["url"]: summary(page) for page in pool.map(analyze, urls)}
    changed = 0
    for url in urls:
        old, new = before["pages"][url], after[url]
        lines = [f"    {field} : {old.get(field)!r}\n      → {new.get(field)!r}"
                 for field in SNAPSHOT_FIELDS if old.get(field) != new.get(field)]
        old_words, new_words = old.get("words") or 0, new.get("words") or 0
        if old_words and abs(new_words - old_words) / old_words > 0.3:
            lines.append(f"    mots : {old_words} → {new_words}")
        if lines:
            changed += 1
            print(f"  {url}\n" + "\n".join(lines))
    print("aucun changement" if not changed else f"{changed} page(s) modifiée(s) : vérifier "
          "que chaque changement est voulu")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    page = sub.add_parser("page", help="une page vue par Googlebot")
    page.add_argument("urls", nargs="+")
    hreflang = sub.add_parser("hreflang", help="réciprocité des versions linguistiques")
    hreflang.add_argument("url")
    robots = sub.add_parser("robots", help="ce que robots.txt permet à chaque robot")
    robots.add_argument("url")
    robots.add_argument("--path", default="/", help="chemin à tester (/ par défaut)")
    sitemap = sub.add_parser("sitemap", help="sitemaps d'un site, ou un fichier précis")
    sitemap.add_argument("url", help="le site (lit robots.txt) ou l'URL d'un sitemap")
    sitemap.add_argument("--depth", type=int, default=1, help="segments de chemin regroupés (1 par défaut)")
    sitemap.add_argument("--sample", type=int, default=0, help="nombre d'URL à vérifier une à une")
    snapshot = sub.add_parser("snapshot", help="enregistrer l'état de pages avant un déploiement")
    snapshot.add_argument("urls", nargs="+")
    snapshot.add_argument("-o", "--output", required=True)
    diff = sub.add_parser("diff", help="comparer l'état actuel à un instantané")
    diff.add_argument("snapshot")
    args = parser.parse_args()

    sys.stdout.reconfigure(encoding="utf-8")
    if args.command == "page":
        for url in args.urls:
            check_page(url)
    elif args.command == "hreflang":
        check_hreflang(args.url)
    elif args.command == "robots":
        check_robots(args.url, args.path)
    elif args.command == "sitemap":
        check_sitemap(args.url, args.depth, args.sample)
    elif args.command == "snapshot":
        take_snapshot(args.urls, args.output)
    else:
        diff_snapshot(args.snapshot)


if __name__ == "__main__":
    main()
