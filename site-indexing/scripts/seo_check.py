"""Vérifications d'indexation sans navigateur : une page telle que Googlebot la reçoit, ou
la composition d'un sitemap.

Exemples :
    python -I seo_check.py page https://exemple.com/en
    python -I seo_check.py sitemap https://exemple.com/sitemap.xml

Bibliothèque standard uniquement. Le HTML lu est celui du serveur, avant JavaScript : ce
que Google rend ensuite peut charger davantage (voir page-weight.js pour le poids réel).
"""
import argparse
import collections
import re
import sys
import time
import urllib.error
import urllib.request

GOOGLEBOT_SMARTPHONE = (
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/141.0.7390.122 Mobile Safari/537.36 "
    "(compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    """On veut voir les redirections, pas les suivre en silence."""

    def redirect_request(self, *args, **kwargs):
        return None


def fetch(url):
    """Renvoie (statut, en-têtes, corps, durée en s) sans suivre les redirections."""
    opener = urllib.request.build_opener(NoRedirect)
    request = urllib.request.Request(url, headers={"User-Agent": GOOGLEBOT_SMARTPHONE})
    started = time.monotonic()
    try:
        with opener.open(request, timeout=60) as response:
            body = response.read()
            return response.status, response.headers, body, time.monotonic() - started
    except urllib.error.HTTPError as error:
        return error.code, error.headers, error.read(), time.monotonic() - started


def first(pattern, text):
    match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
    return match.group(1) if match else None


def check_page(url):
    status, headers, body, duration = fetch(url)
    print(f"{url}\n  statut {status} en {duration:.1f} s, HTML {len(body) / 1024:.0f} Ko")
    if status in (301, 302, 307, 308):
        print(f"  → redirige vers {headers.get('Location')}")
        return
    for name in ("X-Robots-Tag", "Content-Type", "Cache-Control"):
        if headers.get(name):
            print(f"  {name}: {headers.get(name)}")

    html = body.decode("utf-8", errors="replace")
    head_end = html.find("</head>")

    def place(index):
        if index < 0:
            return "ABSENT"
        return "head" if index < head_end else "BODY (ignoré par Google pour canonical/hreflang)"

    title = first(r"<title[^>]*>(.*?)</title>", html)
    description = first(r'<meta name="description" content="([^"]*)"', html)
    robots = first(r'<meta name="robots" content="([^"]*)"', html)
    canonical = first(r'<link rel="canonical" href="([^"]*)"', html)
    hreflangs = re.findall(r'<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"', html, re.IGNORECASE)

    print(f"  title        : {title!r}")
    if description is None:
        print("  description  : ABSENTE")
    else:
        verdict = "ok" if 50 <= len(description) <= 160 else "HORS BORNES (50–160 ; normal en CJK si court)"
        print(f"  description  : {len(description)} caractères, {verdict}")
    print(f"  robots       : {robots!r}")
    canonical_place = place(html.find('rel="canonical"'))
    hreflang_place = place(html.lower().find("hreflang="))
    codes = ", ".join(code for code, _ in hreflangs)
    print(f"  canonical    : {canonical} [{canonical_place}]")
    print(f"  hreflang     : {len(hreflangs)} ({codes}) [{hreflang_place}]")
    if hreflangs and not any(code.lower() == "x-default" for code, _ in hreflangs):
        print("  hreflang     : pas de x-default")

    preloads = re.findall(r'<link rel="preload"[^>]*as="image"', html)
    flag = "  ← trop : <img> sans loading=\"lazy\" ? (React 19 les précharge)" if len(preloads) > 10 else ""
    print(f"  préchargements d'image : {len(preloads)}{flag}")
    print(f"  JSON-LD      : {html.count('application/ld+json')} bloc(s)")

    visible = re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", html)
    visible = re.sub(r"(?s)<[^>]+>", " ", visible)
    words = len(visible.split())
    print(f"  texte visible dans le HTML : ~{words} mots (menu compris)")


def check_sitemap(url, depth):
    status, _, body, _ = fetch(url)
    if status != 200:
        print(f"{url} : statut {status}")
        return
    xml = body.decode("utf-8", errors="replace")
    if "<sitemapindex" in xml:
        children = re.findall(r"<loc>([^<]+)</loc>", xml)
        print(f"Index de sitemaps : {len(children)} sitemap(s)")
        for child in children:
            check_sitemap(child, depth)
        return
    locations = re.findall(r"<loc>([^<]+)</loc>", xml)
    counter = collections.Counter()
    for location in locations:
        path = re.sub(r"^https?://[^/]+", "", location).strip("/")
        segments = path.split("/") if path else []
        # Le premier segment est souvent la langue : on le saute s'il fait 2 lettres.
        if segments and len(segments[0]) == 2:
            segments = segments[1:]
        key = "/".join(segments[:depth]) or "(accueil)"
        counter[(key, len(segments))] += 1
    print(f"{url} : {len(locations)} URL, lastmod présent : {'<lastmod>' in xml}")
    for (key, levels), count in counter.most_common(25):
        share = 100 * count / len(locations)
        print(f"  {count:>6}  {share:5.1f} %  {key}  (profondeur {levels})")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    page = sub.add_parser("page", help="une page vue par Googlebot")
    page.add_argument("urls", nargs="+")
    sitemap = sub.add_parser("sitemap", help="composition d'un sitemap par section")
    sitemap.add_argument("url")
    sitemap.add_argument("--depth", type=int, default=1, help="segments de chemin regroupés (1 par défaut)")
    args = parser.parse_args()

    sys.stdout.reconfigure(encoding="utf-8")
    if args.command == "page":
        for url in args.urls:
            check_page(url)
    else:
        check_sitemap(args.url, args.depth)


if __name__ == "__main__":
    main()
