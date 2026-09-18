# Observatório pessoal

Aplicação web estática para cálculo astrológico, estudo guiado e registro/auditoria de hipóteses.

## Publicação

O site é publicado pelo GitHub Pages via GitHub Actions. O workflow monta uma pasta `_site/`
e baixa, em tempo de build, os arquivos de runtime necessários para que o navegador use a
Swiss Ephemeris a partir do **mesmo domínio** do site:

- `swiss/swisseph-browser.js`
- `swiss/swisseph.js`
- `swiss/swisseph.wasm`
- `swiss/ephe/sepl_18.se1`
- `swiss/ephe/semo_18.se1`
- `swiss/ephe/seas_18.se1`

Depois do deploy, o usuário final não depende de CDN para os cálculos.

## Desenvolvimento local

Como WebAssembly e módulos ES são carregados por URL, não abra apenas por `file://`.
Sirva a pasta gerada por um servidor HTTP estático.

## Licença

Este repositório está preparado para a opção AGPL-3.0 por integrar Swiss Ephemeris em uma
aplicação web pública. Consulte `LICENSE` e `THIRD_PARTY_NOTICES.md`.
Se o projeto precisar ser proprietário/fechado, obtenha a Swiss Ephemeris Professional License
antes da publicação e revise a licença do projeto.

## Estrutura do fonte grande

O `index.html` publicado tem aproximadamente 15,8 MB. Para evitar limites de transporte da integração,
o fonte está dividido em 18 partes ordenadas em `.site-src/index/`.
O workflow concatena essas partes e valida **15.779.043 bytes** antes de publicar.
O navegador recebe um único `index.html` normal.
