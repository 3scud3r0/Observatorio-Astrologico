"""Apply small, asserted compatibility edits before appending the Atlas release."""
from pathlib import Path

def upgrade(text):
    old = "||end-start>93)throw Error('Escolha um período de 1 a 93 dias.');"
    new = ")throw Error('Escolha um período válido, com início anterior ou igual ao fim.');"
    assert text.count(old) == 1, 'Consultation validator changed upstream'
    text = text.replace(old, new)
    text = text.replace('período de até 93 dias', 'período dentro das efemérides disponíveis')
    text = text.replace('Máximo de 93 dias', 'Períodos longos são divididos em volumes')
    text = text.replace('Até 93 dias por consulta.', 'Sem limite de dias por consulta dentro das efemérides de 1800–2100. Períodos longos são organizados em volumes de até 90 dias.')
    needle = 'for(let j=start,count=0;j<end;j+=step,count++){'
    assert text.count(needle) == 1, 'Transit scanner changed upstream'
    text = text.replace(needle, needle + "\nif(window.atlasScanCancelled)throw new Error('Consulta cancelada; os volumes concluídos foram preservados.');")
    latest = 'for(let j=start;j<end;j+=step,count++){const ps='
    assert text.count(latest) == 1, 'Refined transit scanner changed upstream'
    text = text.replace(latest, "for(let j=start;j<end;j+=step,count++){if(window.atlasScanCancelled)throw new Error('Consulta cancelada; os volumes concluídos foram preservados.');const ps=")
    default_houses = "const hs=document.getElementById('houseSystem');if(hs&&hs.value==='none'&&document.getElementById('precision')?.value!=='desconhecida')hs.value='P';"
    assert text.count(default_houses) == 1, 'Swiss bootstrap changed upstream'
    text = text.replace(default_houses, '// Preserve the selected house system, including explicit no-houses charts.')
    auto_recalc = "if(Number.isFinite(lat)&&Number.isFinite(lon)&&typeof window.makeMap==='function')try{window.makeMap()}catch(_){ }"
    assert text.count(auto_recalc) == 1
    text = text.replace(auto_recalc, "if(typeof window.makeMap==='function')try{window.makeMap()}catch(_){ }")
    return text

if __name__ == '__main__':
    page = Path('_site/index.html')
    page.write_text(upgrade(page.read_text('utf-8')) + Path('.site-src/atlas-experience.html').read_text('utf-8'), 'utf-8')
