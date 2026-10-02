"""Executable completion gates for the professional workspace; external audits remain separate."""
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path('.site-src')
MODULES = [
    'chart-core.js', 'interpretation-engine.js', 'forecast-core.js',
    'professional-workspace.js', 'portable-backup.js', 'privacy-controls.js',
    'quality-gates.js', 'core-rpc.js', 'core-worker.js'
]
for name in MODULES:
    text = (ROOT / name).read_text('utf-8')
    assert 'eval(' not in text and 'new Function(' not in text, name
    assert '.innerHTML' not in text and 'insertAdjacentHTML' not in text, name
    assert len(text.encode()) < 100_000, f'{name}: module budget exceeded'

worker = (ROOT / 'core-worker.js').read_text('utf-8')
for method in ('calculatePositions', 'buildTimeline', 'createFacts', 'fingerprint', 'interpret'):
    assert f"message.method==='{method}'" in worker, method
assert "Método RPC não permitido" in worker

backup = (ROOT / 'portable-backup.js').read_text('utf-8')
for contract in ('createComplete', 'validateComplete', 'restoreComplete', 'eraseComplete'):
    assert contract in backup
assert "PREFIXES.some" in backup

class Workspace(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=set(); self.labels=0; self.live=False; self.fieldset=False
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if attrs.get('id'): self.ids.add(attrs['id'])
        if tag=='label': self.labels+=1
        if attrs.get('aria-live'): self.live=True
        if tag=='fieldset': self.fieldset=True

page=Workspace(); page.feed((ROOT/'professional-workspace.html').read_text('utf-8'))
assert page.labels >= 8 and page.live and page.fieldset
for required in ('oa-pw-body','oa-pw-target','oa-pw-days','oa-pw-orb','oa-pw-svg','oa-pw-pdf','oa-pw-notify'):
    assert required in page.ids, required
print('Completion gates: security patterns, module budgets, RPC allowlist, backup and accessible controls OK')
