"""Extract inline executable JavaScript and inert JSON into ordered same-origin assets.

This transform keeps the existing DOM, CSS, script attributes, and synchronous parser
order. It runs after catalog/ephemeris/city/font extraction, never on source fragments.
Generated assets have deterministic names and SHA-256 hashes for optional offline use.
"""
from pathlib import Path
import hashlib
import json
import re
import sys

SCRIPT = re.compile(
    r'<script\b(?P<attributes>[^>]*)>(?P<body>[\s\S]*?)</script\s*>',
    re.IGNORECASE,
)
ATTR = re.compile(
    r'(?<![\w-])(?P<name>[\w-]+)\s*=\s*(?:"(?P<double>[^"]*)"|'
    r"'(?P<single>[^']*)'|(?P<bare>[^\s>]+))",
    re.IGNORECASE,
)
JS_TYPES = {"", "module", "text/javascript", "application/javascript"}
JSON_TYPES = {"application/json", "application/ld+json"}
SCHEMA = "oa-legacy-code/v1"


def attrs(raw: str) -> dict:
    return {
        m.group("name").lower(): next(
            x for x in (m.group("double"), m.group("single"), m.group("bare"))
            if x is not None
        )
        for m in ATTR.finditer(raw)
    }


def safe_data_assignment(element_id: str, value: str) -> str:
    parsed = json.loads(value)
    if not isinstance(parsed, (list, dict)):
        raise ValueError("Inline JSON must have an object or array root.")
    return (
        "document.getElementById(" + json.dumps(element_id) +
        ").textContent=" + json.dumps(value, ensure_ascii=True) + ";\n"
    )


def extract(page: Path, output: Path) -> dict:
    html = page.read_text("utf-8")
    output.mkdir(parents=True, exist_ok=True)
    assets = {}
    js_count = 0
    data_count = 0
    replacements = 0

    def store(filename: str, contents: str) -> None:
        data = contents.encode("utf-8")
        if not data:
            raise ValueError("Empty legacy payload: " + filename)
        if filename in assets:
            raise ValueError("Repeated filename: " + filename)
        (output / filename).write_bytes(data)
        assets[filename] = {
            "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
        }

    def replace(match: re.Match) -> str:
        nonlocal js_count, data_count, replacements
        raw = match.group("attributes")
        attributes = attrs(raw)
        if "src" in attributes or not match.group("body").strip():
            return match.group(0)
        kind = attributes.get("type", "").lower()
        body = match.group("body")
        if kind in JS_TYPES:
            js_count += 1
            suffix = ".mjs" if kind == "module" else ".js"
            filename = f"legacy-inline-{js_count:03d}{suffix}"
            store(filename, body + "\n")
            replacements += 1
            # Only add a local src; do not rewrite type, id, data-* or execution order.
            return f'<script{raw} src="./{filename}"></script>'
        if kind in JSON_TYPES and len(body.encode("utf-8")) > 1000:
            element_id = attributes.get("id")
            if not element_id or not re.fullmatch(r"[A-Za-z][\w:-]{0,90}", element_id):
                raise ValueError("Large inline JSON requires a valid stable id.")
            data_count += 1
            filename = f"legacy-json-{data_count:03d}.js"
            store(filename, safe_data_assignment(element_id, body))
            replacements += 1
            return (
                f'<script{raw}></script>'
                f'<script src="./{filename}"></script>'
            )
        return match.group(0)

    result = SCRIPT.sub(replace, html)
    if js_count < 8 or replacements < 10:
        raise ValueError(
            f"Too few extracted executable scripts ({js_count}) or assets ({replacements})."
        )
    if result == html:
        raise ValueError("No scripts extracted.")
    page.write_text(result, "utf-8")
    manifest = {"schema": SCHEMA, "files": assets}
    (output / "legacy-code-manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", "utf-8"
    )
    return manifest


if __name__ == "__main__":
    page = Path(sys.argv[1] if len(sys.argv) > 1 else "_site/app.html")
    output = Path(sys.argv[2] if len(sys.argv) > 2 else "_site")
    try:
        result = extract(page, output)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        raise SystemExit(str(error))
    print(
        "Legacy scripts externalized:", len(result["files"]),
        "; resulting HTML:", page.stat().st_size, "bytes"
    )
