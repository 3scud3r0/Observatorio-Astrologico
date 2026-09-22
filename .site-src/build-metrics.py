"""Reproducible transfer-size metrics; not a browser performance benchmark."""
from pathlib import Path
import gzip
import json
import os

SITE=Path("_site")
TARGET=500_000


def measure(path):
    data=path.read_bytes()
    return {"bytes":len(data),"gzipBytes":len(gzip.compress(data,compresslevel=9))}


def report():
    html=SITE/"index.html"
    legacy=SITE/"app.html"
    result={
        "schema":"oa-build-metrics/v2",
        "commit":os.getenv("GITHUB_SHA","local-build"),
        "initialHtmlTargetBytes":TARGET,
        "initialHtml":measure(html),
        "initialHtmlTargetMet":html.stat().st_size<TARGET,
        "lazyLegacyHtml":measure(legacy),
        "lazyLegacyLoadedInitially":False,
        "assets":{}
    }
    files=(
        "swiss/swisseph-browser.js","swiss/swisseph.js","swiss/swisseph.wasm",
        "swiss/ephe/sepl_18.se1","swiss/ephe/semo_18.se1",
        "swiss/ephe/seas_18.se1","traditional-engine.js",
        "research-core.js","research-analysis.js","research-lab.js",
        "atlas-resume.js","swiss-scan-worker.js"
    )
    for name in files:
        path=SITE/name
        if not path.is_file():raise SystemExit("Missing metric asset: "+name)
        result["assets"][name]=measure(path)
    return result


if __name__=="__main__":
    result=report()
    (SITE/"build-metrics.json").write_text(
        json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8"
    )
    initial=result["initialHtml"]
    print("Initial Vite shell:",initial["bytes"],"bytes; gzip:",
          initial["gzipBytes"],"bytes; target:",TARGET,
          "bytes; target met:",result["initialHtmlTargetMet"])
    print("Lazy legacy app:",result["lazyLegacyHtml"]["bytes"],
          "bytes; gzip:",result["lazyLegacyHtml"]["gzipBytes"],"bytes")
    print("NOTE: Transfer size is not FCP, TTI, RAM, FPS or mobile performance.")
