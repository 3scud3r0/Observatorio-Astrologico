"""Move large, synchronous legacy base/city datasets into versioned local JS files.

The output is classic, blocking JS on purpose: the existing monolith reads both
datasets at top-level, so async/defer would produce nondeterministic startup.
This is a *structural* extraction: preserve original data bytes and ordering.
"""
from pathlib import Path
import json
import re
import sys

BASE = re.compile(r'<script\s+id="base"\s+type="application/json">([\s\S]*?)</script>',re.I)
CITY = re.compile(r'<script>(const CITY_DATA=[\s\S]*?)</script>',re.I)

def extract(page:Path, target:Path):
    text=page.read_text('utf-8')
    originals=[]
    for pattern,name,replacement,verify in (
        (BASE,'base-data.js','<script src="./base-data.js"></script>','base'),
        (CITY,'city-data.js','<script src="./city-data.js"></script>','city'),
    ):
        hits=list(pattern.finditer(text))
        if len(hits)!=1:
            raise RuntimeError(f'Expected one {name} script, got {len(hits)}')
        payload=hits[0].group(1)
        if verify=='base':
            data=json.loads(payload)
            if not isinstance(data,dict) or not isinstance(data.get('meta'),dict) or not isinstance(data['meta'].get('bodies'),list) or len(data['meta']['bodies'])<10:
                raise RuntimeError('Base ephemeris schema malformed')
            if len(payload.encode('utf-8'))<5_000_000:
                raise RuntimeError('Base ephemeris unexpectedly small')
            script='window.OBS_BASE='+payload+';\n'
        else:
            if not payload.startswith('const CITY_DATA=') or len(payload.encode('utf-8'))<1_000_000:
                raise RuntimeError('City/eclipses database incomplete')
            if 'ECLIPSE' not in payload:
                raise RuntimeError('Expected eclipse data in the extracted city dataset')
            script=payload+'\n'
        (target/name).write_text(script,'utf-8')
        originals.append((name,len(payload.encode('utf-8')),(target/name).stat().st_size))
        text=text[:hits[0].start()]+replacement+text[hits[0].end():]
    page.write_text(text,'utf-8')
    return originals

if __name__=='__main__':
    page=Path(sys.argv[1] if len(sys.argv)>1 else '_site/app.html')
    target=Path(sys.argv[2] if len(sys.argv)>2 else '_site')
    try:
        rows=extract(page,target)
    except (OSError,ValueError,RuntimeError) as error:
        raise SystemExit(str(error))
    print('Synchronous base/city assets externalized: '+', '.join(
        f'{name} {before}->{after} bytes' for name,before,after in rows))
