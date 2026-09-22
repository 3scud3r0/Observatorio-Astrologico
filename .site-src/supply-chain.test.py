"""Fail the build when pinned supply-chain and license declarations drift."""
from pathlib import Path
import json
import re

pkg=json.loads(Path("package.json").read_text("utf-8"))
deps=pkg.get("devDependencies",{})
expected={"vite":"8.3.0","typescript":"7.0.2","@playwright/test":"1.63.0"}
assert deps==expected, f"Unexpected build dependency set/version: {deps}"
for name,version in deps.items():
    assert not re.search(r"[\^~*xX><= ]",version), f"{name} is not exactly pinned"

workflow=Path(".github/workflows/pages.yml").read_text("utf-8")
provenance=Path(".site-src/asset-provenance.py").read_text("utf-8")
notices=Path("THIRD_PARTY_NOTICES.md").read_text("utf-8")
audit=Path("docs/DEPENDENCY_AUDIT.md").read_text("utf-8")
license_text=Path("LICENSE").read_text("utf-8")

assert "@swisseph/browser@1.3.1" in workflow
assert "9083a12d59e98034fb2337061481ac8800c16e64" in workflow
assert 'PKG = "@swisseph/browser@1.3.1"' in provenance
assert 'UPSTREAM_COMMIT = "9083a12d59e98034fb2337061481ac8800c16e64"' in provenance
for required in (
    "Swiss Ephemeris","AGPL","@swisseph/browser","Celestine","MIT",
):
    assert required in notices, required
for required in (
    "Vite","8.3.0","MIT","TypeScript","7.0.2","Apache-2.0",
    "Playwright","1.63.0","Supabase JS","2.57.4",
):
    assert required in audit, required
assert "GNU AFFERO GENERAL PUBLIC LICENSE" in license_text
print("Supply-chain test: OK (exact versions, pinned Swiss source, license declarations)")
