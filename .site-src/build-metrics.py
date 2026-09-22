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
    entry=SITE/"entrada.html"
    if html.read_bytes()!=legacy.read_bytes():
        raise SystemExit("The main URL must render the original Observatório.")
    result={
        "schema":"oa-build-metrics/v3",
        "commit":os.getenv("GITHUB_SHA","local-build"),
        "initialHtmlTargetBytes":TARGET,
        "initialHtml":measure(html),
        "initialHtmlTargetMet":html.stat().st_size<TARGET,
        "optionalModularEntry":measure(entry),
        "optionalModularEntryTargetMet":entry.stat().st_size<TARGET,
        "originalHomeRestored":True,
        "lazyLegacyHtml":measure(legacy),
        "catalogData":measure(SITE/"catalog-data.json"),
        "externalPayloads":{},
        "lazyLegacyLoadedInitially":True,
        "assets":{}
    }
    files=(
        "swiss/swisseph-browser.js","swiss/swisseph.js","swiss/swisseph.wasm",
        "swiss/ephe/sepl_18.se1","swiss/ephe/semo_18.se1",
        "swiss/ephe/seas_18.se1","traditional-engine.js",
        "research-core.js","research-analysis.js","research-lab.js",
        "atlas-resume.js","swiss-scan-worker.js"
    )
    for name in ("base-data.js","city-data.js","pdf-font.js"):
        result["externalPayloads"][name]=measure(SITE/name)
    code=json.loads((SITE/"legacy-code-manifest.json").read_text("utf-8"))
    if code["schema"]!="oa-legacy-code/v1" or len(code["files"])<10:
        raise SystemExit("Legacy code manifest invalid")
    code_bytes=sum(value["bytes"] for value in code["files"].values())
    code_gzip=sum(measure(SITE/name)["gzipBytes"] for name in code["files"])
    result["legacyCodeAssets"]={
        "count":len(code["files"]),"bytes":code_bytes,"gzipBytes":code_gzip
    }
    # Conservative sum of parser-loaded code/data; not a measured network waterfall.
    result["declaredInitialPayloadWithoutSwissBytes"]=(
        result["initialHtml"]["bytes"]+code_bytes+
        sum(value["bytes"] for value in result["externalPayloads"].values())
    )
    result["declaredInitialPayloadTargetMet"]=(
        result["declaredInitialPayloadWithoutSwissBytes"]<TARGET
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
    print("Restored original homepage:",initial["bytes"],"bytes; gzip:",
          initial["gzipBytes"],"bytes; target:",TARGET,
          "bytes; target met:",result["initialHtmlTargetMet"])
    print("Optional Vite entry:",result["optionalModularEntry"]["bytes"],"bytes; target met:",
          result["optionalModularEntryTargetMet"])
    print("External data assets:", {key:value["bytes"] for key,value in result["externalPayloads"].items()})
    print("Legacy code assets:",result["legacyCodeAssets"])
    print("Declared initial code/data without Swiss:",
          result["declaredInitialPayloadWithoutSwissBytes"],
          "bytes; 500 KB total target met:",result["declaredInitialPayloadTargetMet"])
    print("Lazy legacy app:",result["lazyLegacyHtml"]["bytes"],
          "bytes; gzip:",result["lazyLegacyHtml"]["gzipBytes"],"bytes")
    print("NOTE: Declared asset bytes are not FCP, TTI, RAM, FPS or a measured network waterfall.")
