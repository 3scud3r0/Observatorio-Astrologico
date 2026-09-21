"""Static integration guards for optional modules; no third-party Python dependency."""
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(".site-src")

class IdParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "script" and "src" in attrs:
            self.scripts.append(attrs["src"])

def verify(html_name, js_name, prefix, extract):
    html = (ROOT / html_name).read_text("utf-8")
    js = (ROOT / js_name).read_text("utf-8")
    page = IdParser()
    page.feed(html)
    if len(page.ids) != len(set(page.ids)):
        raise SystemExit(f"Duplicate ids in {html_name}")
    if not page.ids:
        raise SystemExit(f"No controls in {html_name}")
    used = set(re.findall(extract, js))
    missing = sorted(name for name in used if prefix + name not in page.ids)
    if missing:
        raise SystemExit(f"{js_name} references missing {prefix} controls: {missing}")
    if "./" + js_name not in page.scripts:
        raise SystemExit(f"Missing script reference in {html_name}")
    if ".innerHTML=" in js or ".insertAdjacentHTML(" in js:
        raise SystemExit(f"Untrusted HTML rendering pattern in {js_name}")
    print(f"{html_name}: {len(page.ids)} ids; {len(used)} literal script references verified")

verify("research-lab.html", "research-lab.js", "oa-r-", r"byId\('([^']+)'\)")
verify("timeline.html", "timeline-ui.js", "oa-t-", r"\$\('([^']+)'\)")

for html_name, core in [
    ("research-lab.html", "research-core.js"),
    ("timeline.html", "timeline-core.js"),
]:
    html = (ROOT / html_name).read_text("utf-8")
    if f'src="./{core}"' not in html:
        raise SystemExit(f"{core} not referenced from {html_name}")

print("UI contracts: OK")
