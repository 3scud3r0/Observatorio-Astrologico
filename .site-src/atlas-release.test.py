"""Regression test: release assembly may append Atlas but must not rewrite legacy HTML."""
from pathlib import Path
import importlib.util
import tempfile

source=Path(".site-src/atlas-release.py").read_text("utf-8")
for forbidden in (".replace(", "text.count(", "Consultation validator", "Swiss house map changed"):
    if forbidden in source:
        raise SystemExit("Fragile release-time rewrite returned: "+forbidden)

spec=importlib.util.spec_from_file_location("atlas_release",".site-src/atlas-release.py")
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
with tempfile.TemporaryDirectory() as tmp:
    page=Path(tmp)/"app.html"
    original="<html><body>sentinel literal must remain unchanged</body></html>\n"
    page.write_text(original,"utf-8")
    module.append_atlas(page)
    result=page.read_text("utf-8")
    assert result.startswith(original)
    assert "sentinel literal must remain unchanged" in result
    assert len(result)>len(original)
print("Atlas release test: OK (append-only, no generated-HTML rewrites)")
