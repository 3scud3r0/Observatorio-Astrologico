"""Move heavyweight inline application data to same-origin assets, preserving synchronous order.

Only recognized, validated data declarations are replaced; there are no blind
generated-HTML text rewrites. The classic script ordering is retained.
"""
from pathlib import Path
import hashlib
import json
import re
import sys

BASE = re.compile(
    r'<script\b(?=[^>]*\bid=["\']base["\'])[^>]*>([\s\S]*?)</script>',
    re.IGNORECASE,
)
CITY = re.compile(r'<script\b[^>]*>\s*const CITY_DATA=', re.IGNORECASE)
FONT = re.compile(
    r'<script\b[^>]*>\s*const PDF_FONT=(?P<literal>"(?:\\.|[^"\\])*");\s*</script>',
    re.IGNORECASE,
)
DECODER = json.JSONDecoder()


def store(out: Path, filename: str, data: str, minimum: int) -> dict:
    data_bytes = data.encode("utf-8")
    if len(data_bytes) < minimum:
        raise RuntimeError(f"{filename}: data unexpectedly small ({len(data_bytes)})")
    destination = out / filename
    destination.write_bytes(data_bytes)
    return {"bytes": len(data_bytes), "sha256": hashlib.sha256(data_bytes).hexdigest()}


def extract(page: Path, out: Path, *, production: bool = True) -> dict:
    text = page.read_text("utf-8")
    if "JSON.parse(document.getElementById('base').textContent)" in text:
        raise RuntimeError("Legacy BASE consumer still expects embedded JSON")
    manifest = {"schema": "oa-data-payload/v1", "files": {}}
    base_matches = list(BASE.finditer(text))
    if len(base_matches) != 1:
        raise RuntimeError(f"Expected one base JSON script, found {len(base_matches)}")
    base_match = base_matches[0]
    base_payload = base_match.group(1).strip()
    base_data = json.loads(base_payload)
    if not isinstance(base_data, dict) or not isinstance(base_data.get("meta"), dict):
        raise RuntimeError("Base ephemeris data must contain meta")
    manifest["files"]["base-data.js"] = store(
        out, "base-data.js", "window.OBS_BASE=" + base_payload + ";\n",
        5_000_000 if production else 1,
    )
    text = text[:base_match.start()] + '<script src="./base-data.js"></script>' + text[base_match.end():]

    city_matches = list(CITY.finditer(text))
    if len(city_matches) != 1:
        raise RuntimeError(f"Expected one city-data declaration, found {len(city_matches)}")
    city = city_matches[0]
    city_payload, consumed = DECODER.raw_decode(text[city.end():])
    if not isinstance(city_payload, list):
        raise RuntimeError("City data must be an array")
    end = city.end() + consumed
    if text[end:end+1] != ";":
        raise RuntimeError("City data must end with a semicolon")
    literal = text[city.end():end]
    manifest["files"]["city-data.js"] = store(
        out, "city-data.js", "const CITY_DATA=" + literal + ";\n",
        2_000_000 if production else 1,
    )
    # The external classic script declares the same global lexical binding
    # before the remaining inline script executes.
    text = (
        text[:city.start()] + '<script src="./city-data.js"></script>' +
        text[city.start():city.end() - len("const CITY_DATA=")] +
        text[end+1:]
    )

    font_matches = list(FONT.finditer(text))
    if len(font_matches) != 1:
        raise RuntimeError(f"Expected one PDF font script, found {len(font_matches)}")
    font = font_matches[0]
    font_payload = json.loads(font.group("literal"))
    if not isinstance(font_payload, str):
        raise RuntimeError("Embedded font must be a string")
    manifest["files"]["pdf-font.js"] = store(
        out, "pdf-font.js", "const PDF_FONT=" + font.group("literal") + ";\n",
        900_000 if production else 1,
    )
    text = text[:font.start()] + '<script src="./pdf-font.js"></script>' + text[font.end():]

    for name in manifest["files"]:
        if f'<script src="./{name}"></script>' not in text:
            raise RuntimeError("Lost external data script: " + name)
    page.write_text(text, "utf-8")
    (out / "payload-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", "utf-8"
    )
    return manifest


if __name__ == "__main__":
    page = Path(sys.argv[1] if len(sys.argv)>1 else "_site/app.html")
    out = Path(sys.argv[2] if len(sys.argv)>2 else "_site")
    try:
        result = extract(page, out)
    except (OSError, ValueError, RuntimeError) as error:
        raise SystemExit(str(error))
    print("External data payloads:",
          ", ".join(f"{name}={meta['bytes']} B" for name, meta in result["files"].items()))
    print("HTML after extraction:", page.stat().st_size, "bytes")
