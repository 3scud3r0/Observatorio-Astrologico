"""Extract the large retrospective catalog from assembled HTML into a validated JSON asset."""
from pathlib import Path
import json
import re
import sys

PATTERN=re.compile(
    r'<script\b(?=[^>]*\bid=["\']catalogdata["\'])[^>]*>([\s\S]*?)</script>',
    re.IGNORECASE
)

def extract(page: Path, output: Path):
    text=page.read_text("utf-8")
    matches=list(PATTERN.finditer(text))
    if len(matches)!=1:
        raise RuntimeError(f"Expected exactly one catalogdata script, found {len(matches)}")
    payload=matches[0].group(1).strip()
    data=json.loads(payload)
    if not isinstance(data,dict) or not isinstance(data.get("facts"),list) or not isinstance(data.get("entities"),dict):
        raise RuntimeError("Catalog payload must contain facts[] and entities{}")
    if len(data["facts"])<1000:
        raise RuntimeError("Catalog unexpectedly small; refusing destructive extraction")
    output.write_text(json.dumps(data,ensure_ascii=False,separators=(",",":"))+"\n","utf-8")
    placeholder='<script id="catalogdata" type="application/json">{"facts":[],"entities":{}}</script>'
    page.write_text(text[:matches[0].start()]+placeholder+text[matches[0].end():],"utf-8")
    return len(payload.encode("utf-8")),output.stat().st_size,len(data["facts"])

if __name__=="__main__":
    page=Path(sys.argv[1] if len(sys.argv)>1 else "_site/app.html")
    output=Path(sys.argv[2] if len(sys.argv)>2 else "_site/catalog-data.json")
    try:
        source_bytes,asset_bytes,facts=extract(page,output)
    except (OSError,ValueError,RuntimeError) as error:
        raise SystemExit(str(error))
    print(f"Catalog externalized: {facts} facts; {source_bytes} embedded bytes -> {asset_bytes} JSON bytes")
