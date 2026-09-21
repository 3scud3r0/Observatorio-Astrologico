"""Smoke-test published PWA and research-vault contracts without a browser or Supabase project."""
from pathlib import Path
import hashlib
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
for reference in (
    './manifest.webmanifest',
    './research-vault.js',
    './research-vault-ui.js',
    './offline-client.js',
):
    assert reference in html, reference
for name in ("service-worker.js", "research-vault.js", "research-vault-ui.js"):
    assert (site / name).is_file(), name

worker = (site / "service-worker.js").read_text("utf-8")
assert "'./ephemeris-provenance.json'" in worker
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

print("Release contracts: PWA assets, SHA-256 ephemerides and encrypted vault SQL OK")
