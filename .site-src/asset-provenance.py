"""Generate verifiable asset provenance for the published browser ephemeris."""
import hashlib
import json
import os
from pathlib import Path

SITE = Path("_site")
FILES = (
    "swiss/swisseph-browser.js",
    "swiss/swisseph.js",
    "swiss/swisseph.wasm",
    "swiss/ephe/sepl_18.se1",
    "swiss/ephe/semo_18.se1",
    "swiss/ephe/seas_18.se1",
)
UPSTREAM_COMMIT = "9083a12d59e98034fb2337061481ac8800c16e64"
PKG = "@swisseph/browser@1.3.1"


def inspect():
    result = {}
    for name in FILES:
        path = SITE / name
        if not path.is_file() or path.stat().st_size < 1000:
            raise SystemExit("Missing/empty astronomy asset: " + name)
        sha = hashlib.sha256()
        with path.open("rb") as file:
            for block in iter(lambda: file.read(1024 * 1024), b""):
                sha.update(block)
        result[name] = {
            "sha256": sha.hexdigest(),
            "bytes": path.stat().st_size,
            "source": (
                "aloistr/swisseph@" + UPSTREAM_COMMIT
                if name.endswith(".se1") else PKG
            ),
        }
    if (SITE / "swiss/swisseph.wasm").read_bytes()[:4] != b"\\x00asm":
        raise SystemExit("Invalid WASM magic")
    return {
        "schema": "oa-asset-provenance/v1",
        "repository": "3scud3r0/Observatorio-Astrologico",
        "sourceCommit": os.getenv("GITHUB_SHA", "local-build"),
        "browserPackage": PKG,
        "ephemerisUpstreamCommit": UPSTREAM_COMMIT,
        "assets": result,
    }


if __name__ == "__main__":
    manifest = inspect()
    (SITE / "ephemeris-provenance.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("Astronomy assets checksum manifest:", len(manifest["assets"]), "files")
