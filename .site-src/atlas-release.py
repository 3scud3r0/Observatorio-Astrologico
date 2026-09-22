"""Apply small, asserted compatibility edits before appending the Atlas release."""
from pathlib import Path
import sys

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

    sys_names = "const sysNames={P:'Placidus',K:'Koch',E:'Casas iguais',W:'Signos inteiros',O:'Porfírio',R:'Regiomontanus',C:'Campanus'};"
    expanded_names = "const sysNames={P:'Placidus',K:'Koch',E:'Casas iguais',W:'Signos inteiros',O:'Porfírio',R:'Regiomontanus',C:'Campanus',B:'Alcabitius',M:'Morinus',X:'Meridian',T:'Topocêntrico (Polich/Page)',V:'Vehlow igual',H:'Horizontal/Azimutal'};"
    assert text.count(sys_names) == 1, 'Swiss house system names changed upstream'
    text = text.replace(sys_names, expanded_names)

    house_map = "const houseMap={P:HouseSystem.Placidus,K:HouseSystem.Koch,E:HouseSystem.Equal,W:HouseSystem.WholeSign,O:HouseSystem.Porphyrius,R:HouseSystem.Regiomontanus,C:HouseSystem.Campanus};"
    expanded_map = "const houseMap={P:HouseSystem.Placidus,K:HouseSystem.Koch,E:HouseSystem.Equal,W:HouseSystem.WholeSign,O:HouseSystem.Porphyrius,R:HouseSystem.Regiomontanus,C:HouseSystem.Campanus,B:HouseSystem.Alcabitus,M:HouseSystem.Morinus,X:HouseSystem.Meridian,T:HouseSystem.PolichPage,V:HouseSystem.VehlowEqual,H:HouseSystem.Azimuthal};"
    assert text.count(house_map) == 1, 'Swiss house map changed upstream'
    text = text.replace(house_map, expanded_map)

    wanted = "const hs=E('houseSystem'),wanted=[['P','Placidus'],['K','Koch'],['E','Casas iguais'],['W','Signos inteiros'],['O','Porfírio'],['R','Regiomontanus'],['C','Campanus']];"
    expanded_wanted = "const hs=E('houseSystem'),wanted=[['P','Placidus'],['K','Koch'],['B','Alcabitius'],['R','Regiomontanus'],['C','Campanus'],['T','Topocêntrico (Polich/Page)'],['O','Porfírio'],['M','Morinus'],['X','Meridian'],['E','Casas iguais'],['V','Vehlow igual'],['W','Signos inteiros'],['H','Horizontal/Azimutal']];"
    assert text.count(wanted) == 1, 'House selector list changed upstream'
    text = text.replace(wanted, expanded_wanted)
    order = "const order=['none','P','K','E','W','O','R','C'];"
    expanded_order = "const order=['none','P','K','B','R','C','T','O','M','X','E','V','W','H'];"
    assert text.count(order) == 1, 'House selector order changed upstream'
    text = text.replace(order, expanded_order)
    return text

if __name__ == '__main__':
    page = Path(sys.argv[1] if len(sys.argv) > 1 else '_site/app.html')
    if not page.is_file():
        raise SystemExit('Atlas release target does not exist: ' + str(page))
    page.write_text(
        upgrade(page.read_text('utf-8')) +
        Path('.site-src/atlas-experience.html').read_text('utf-8'),
        'utf-8'
    )
