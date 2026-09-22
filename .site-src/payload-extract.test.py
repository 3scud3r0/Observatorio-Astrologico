"""The externalizer preserves script order, data and ECLIPSE_DATA declarations."""
from pathlib import Path
import importlib.util
import json
import tempfile

spec=importlib.util.spec_from_file_location("payload_extract",".site-src/payload-extract.py")
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

with tempfile.TemporaryDirectory() as folder:
    root=Path(folder)
    page=root/"app.html"
    fake='''<html><script id="base" type="application/json">{"meta":{"source":"local"},"numbers":[1,2]}</script>
<script>const BASE=window.OBS_BASE; window.read=BASE.meta;</script>
<script>const PDF_FONT="QQ==";</script>
<script>const CITY_DATA=[["X",0],["Y",1]];const ECLIPSE_DATA={"events":[]}; window.cities=CITY_DATA;</script></html>'''
    page.write_text(fake,"utf-8")
    manifest=module.extract(page,root,production=False)
    html=page.read_text("utf-8")
    for name in ("base-data.js","city-data.js","pdf-font.js"):
        assert f'<script src="./{name}"></script>' in html
        assert (root/name).is_file()
        assert manifest["files"][name]["bytes"]==(root/name).stat().st_size
    assert html.index("base-data.js") < html.index("const BASE")
    assert html.index("city-data.js") < html.index("const ECLIPSE_DATA")
    assert "const CITY_DATA=" not in html
    assert "const PDF_FONT=" not in html
    assert "const ECLIPSE_DATA=" in html
    assert json.loads((root/"base-data.js").read_text("utf-8").removeprefix("window.OBS_BASE=").removesuffix(";\n"))["meta"]["source"]=="local"
    assert "QQ==" in (root/"pdf-font.js").read_text("utf-8")
    try:
        module.extract(page,root,production=False)
    except RuntimeError as error:
        assert "base JSON script" in str(error)
    else:
        raise AssertionError("A second/destructive extraction must fail")
print("Payload extractor tests: OK (order, data, validation, idempotency refusal)")
