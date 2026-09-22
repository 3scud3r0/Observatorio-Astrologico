"""Regression tests for safe, ordered extraction of classic and module scripts."""
from pathlib import Path
import hashlib
import importlib.util
import json
import tempfile

spec = importlib.util.spec_from_file_location(
    "legacy_code_extract", ".site-src/legacy-code-extract.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

with tempfile.TemporaryDirectory() as temp:
    root = Path(temp)
    page = root / "app.html"
    original_scripts = [
        f'<script id="test-{i}">const testVar{i}={i};</script>'
        for i in range(9)
    ]
    module_script = '<script type="module" id="module-test">export const answer=42;</script>'
    payload = {"facts": [{"id": "test", "label": "A & B"}] * 250}
    json_string = json.dumps(payload, ensure_ascii=False)
    initial = (
        '<!doctype html><html><head><style id="unchanged">body{color:red}</style>'
        '</head><body><h1 id="original-ui">Observatório original</h1>'
        + "".join(original_scripts)
        + '<script src="./existing.js"></script>'
        + '<script id="sportsdata" type="application/json">'
        + json_string
        + '</script>'
        + module_script
        + '</body></html>'
    )
    page.write_text(initial, encoding="utf-8")
    manifest = module.extract(page, root)
    result = page.read_text(encoding="utf-8")
    assert manifest["schema"] == module.SCHEMA
    assert len(manifest["files"]) == 11
    assert '<h1 id="original-ui">Observatório original</h1>' in result
    assert '<style id="unchanged">body{color:red}</style>' in result
    assert '<script src="./existing.js"></script>' in result
    assert result.index("legacy-inline-001.js") < result.index("legacy-inline-009.js")
    assert 'legacy-inline-010.mjs' in result
    assert '<script type="module" id="module-test" src="./legacy-inline-010.mjs"></script>' in result
    assert '<script id="sportsdata" type="application/json"></script>' in result
    assert '<script src="./legacy-json-001.js"></script>' in result
    assert 'const testVar0=0;' in (root / "legacy-inline-001.js").read_text("utf-8")
    data_loader = (root / "legacy-json-001.js").read_text("utf-8")
    assert data_loader.startswith('document.getElementById("sportsdata").textContent=')
    assert json_string not in result
    assert json.dumps(json_string, ensure_ascii=True) in data_loader
    for name, metadata in manifest["files"].items():
        data = (root / name).read_bytes()
        assert metadata["bytes"] == len(data)
        assert metadata["sha256"] == hashlib.sha256(data).hexdigest()

with tempfile.TemporaryDirectory() as temp:
    root = Path(temp)
    page = root / "app.html"
    page.write_text(
        "<html>" +
        "".join("<script>const n=" + str(n) + ";</script>" for n in range(10)) +
        '<script type="application/json" id="sportsdata">' + "x" * 1500 +
        "</script></html>", encoding="utf-8"
    )
    try:
        module.extract(page, root)
    except json.JSONDecodeError:
        pass
    else:
        raise AssertionError("Malformed externalized JSON was accepted")

print("Legacy code extraction tests: OK (order, modules, DOM, JSON and integrity)")
