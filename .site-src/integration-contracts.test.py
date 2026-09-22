"""Smoke-test published PWA and research-vault contracts without a browser or Supabase project."""
from pathlib import Path
import hashlib
import gzip
import json

site = Path("_site")
sources = Path(".site-src")
manifest = json.loads((site / "manifest.webmanifest").read_text("utf-8"))
assert manifest["start_url"] == "./" and manifest["scope"] == "./"
assert manifest["display"] == "standalone"
for icon in manifest["icons"]:
    assert (site / icon["src"].removeprefix("./")).is_file()

checks = json.loads((site / "ephemeris-provenance.json").read_text("utf-8"))
assert checks["schema"] == "oa-asset-provenance/v1"
assert len(checks["assets"]) == 6
for name, metadata in checks["assets"].items():
    path = site / name
    assert path.stat().st_size == metadata["bytes"], name
    assert hashlib.sha256(path.read_bytes()).hexdigest() == metadata["sha256"], name

html = (site / "index.html").read_text("utf-8")
app = (site / "app.html").read_text("utf-8")
assert './app.html' in html
assert './manifest.webmanifest' in html
for reference in (
    './research-vault.js',
    './research-vault-ui.js',
    './offline-client.js',
):
    assert reference in app, reference
for name in ("service-worker.js", "research-vault.js", "research-vault-ui.js"):
    assert (site / name).is_file(), name

worker = (site / "service-worker.js").read_text("utf-8")
assert "'./ephemeris-provenance.json'" in worker
assert "'./swiss-scan-worker.js'" in worker
assert "crypto.subtle.digest('SHA-256'" in worker, "Check checksums before declaring offline readiness"
assert "SHA-256 divergiu do manifesto" in worker
assert "'oa-data-payload/v1'" in worker
assert "payloadManifest.files[assetName]" in worker
assert "const path=url.pathname;" in worker, "Offline iframe and shell require independent keys"
assert "'./atlas-auth.json'" not in worker, "Auth configuration must not be precached"
assert "request.method!=='GET'" in worker, "Never cache mutation responses"
assert "url.origin!==self.location.origin" in worker, "Never cache external requests"

config = json.loads((site / "atlas-auth.json").read_text("utf-8"))
assert "service_role" not in config and "secret" not in config
sql = (sources.parent / "supabase/research-vault.sql").read_text("utf-8")
for expected in ("enable row level security", "to authenticated",
                 "(select auth.uid()) = owner_id", "revoke all", "for insert",
                 "for select", "for delete"):
    assert expected in sql, expected
assert "grant select, insert, delete" in sql
assert "grant select, insert, update" not in sql

metrics=json.loads((site/"build-metrics.json").read_text("utf-8"))
assert metrics["schema"]=="oa-build-metrics/v2"
initial=(site/"index.html").read_bytes()
assert metrics["initialHtml"]["bytes"]==len(initial)
assert metrics["initialHtml"]["gzipBytes"]==len(gzip.compress(initial,compresslevel=9))
assert metrics["initialHtmlTargetMet"]==(len(initial)<metrics["initialHtmlTargetBytes"])
assert metrics["initialHtmlTargetMet"] is True
legacy=(site/"app.html").read_bytes()
assert metrics["lazyLegacyHtml"]["bytes"]==len(legacy)
catalog=(site/"catalog-data.json").read_bytes()
assert metrics["catalogData"]["bytes"]==len(catalog)
catalog_obj=json.loads(catalog.decode("utf-8"))
assert len(catalog_obj["facts"])>=1000 and isinstance(catalog_obj["entities"],dict)
assert '"facts":[]' in app, "embedded catalog placeholder should be empty after extraction"
payload=json.loads((site/"payload-manifest.json").read_text("utf-8"))
assert payload["schema"]=="oa-data-payload/v1"
assert set(payload["files"])=={"base-data.js","city-data.js","pdf-font.js"}
for name, metadata in payload["files"].items():
    binary=(site/name).read_bytes()
    assert metadata["bytes"]==len(binary), name
    assert metadata["sha256"]==hashlib.sha256(binary).hexdigest(), name
    assert metrics["externalPayloads"][name]["bytes"]==len(binary), name
    assert f'<script src="./{name}"></script>' in app, name
assert "window.OBS_BASE=" in (site/"base-data.js").read_text("utf-8")
assert "const CITY_DATA=" in (site/"city-data.js").read_text("utf-8")
assert "const PDF_FONT=" in (site/"pdf-font.js").read_text("utf-8")
assert "const PDF_FONT=" not in app, "PDF font must not be embedded in HTML"
assert len(legacy)<5_000_000, "lazy app HTML should stay modular after externalizing heavy data"
assert metrics["lazyLegacyLoadedInitially"] is False
assert "swiss/swisseph.wasm" in metrics["assets"]
print("Release contracts: PWA assets, SHA-256 ephemerides, gzip metrics and encrypted vault SQL OK")
