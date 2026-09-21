# Observatório Astrológico

Aplicação web estática para cálculo astronômico e astrológico, estudo guiado e registro/auditoria de hipóteses. **Precisão astronômica não demonstra validade empírica de interpretações ou previsões astrológicas.**

## Execução e fontes existentes

O [GitHub Actions](.github/workflows/pages.yml) monta `_site/` e publica pelo GitHub Pages. A aplicação mantém o motor e os dados astronômicos **no mesmo domínio**, sem API remota obrigatória para calcular mapas:

- `@swisseph/browser@1.3.1`, executando Swiss Ephemeris em WebAssembly;
- `swiss/swisseph-browser.js`, `swiss/swisseph.js`, `swiss/swisseph.wasm`;
- `swiss/ephe/sepl_18.se1`, `semo_18.se1`, `seas_18.se1`, provenientes de [aloistr/swisseph](https://github.com/aloistr/swisseph), no commit fixado pelo workflow;
- [motor tradicional compartilhado](.site-src/traditional-engine.js), com [testes numéricos](.site-src/traditional-engine.test.js).

A integração opcional de contas está preparada em `supabase/atlas-auth.sql` e `.site-src/atlas-auth.json`, mas **não está operacional enquanto as configurações públicas do projeto Supabase não forem preenchidas e o isolamento RLS não for testado**. O uso local não depende de cadastro.

## Organização atual do fonte

O documento principal, de cerca de 15,8 MB antes dos módulos adicionais, ainda é montado a partir das 18 partes de `.site-src/index/`. O workflow acrescenta os módulos de ferramentas, a interface tradicional e o Atlas. **Ainda não há migração concluída para Vite/TypeScript, Web Workers ou PWA offline**; não se deve anunciar redução para 500 KB ou funcionamento offline integral.

Os arquivos usados pelo site devem ser alterados em `.site-src/`, e não em `_site/` (artefato descartável). O script `.site-src/atlas-release.py` mantém modificações de compatibilidade com verificações explícitas. As atualizações de setembro de 2026 consolidam os cálculos solares do Pro Studio na Swiss Ephemeris e reutilizam `OATraditionalEngine` para arco solar, firdaria e Zodiacal Releasing.

## Laboratório prospectivo e relógio de trânsitos

O [inventário das três conversas](docs/INVENTARIO_TRES_CONVERSAS.md) identifica requisitos existentes, parcialmente implementados e pendentes. A primeira implementação dessa consolidação acrescentou:

- `.site-src/research-core.js` — protocolo prospectivo canônico, selo SHA-256, verificação do conteúdo, critérios prévios, matriz TP/FP/FN/TN e identidade técnica do mapa.
- `.site-src/research-lab.html` e `.site-src/research-lab.js` — formulário de investigação, avaliações append-only, exportação/importação JSON, exclusão local e laudo de proveniência. **Nenhum dado é enviado automaticamente à nuvem.**
- `.site-src/timeline-core.js`, `.site-src/timeline.html`, `.site-src/timeline-ui.js` — relógio UTC com saltos de minuto/hora/dia/mês/ano, consulta pontual da Swiss Ephemeris, roda SVG e aspectos/orbes configuráveis. É um cálculo instantâneo; **a Swiss ainda não foi transferida para um Web Worker**.
- `.site-src/guided-study.html` e `.site-src/guided-study.js` — entrada complementar por objetivos, estudo de Sol/Lua/Ascendente e escolha entre linguagem simples e coordenadas técnicas; hora natal desconhecida bloqueia um Ascendente supostamente exato.
- `.site-src/service-worker.js`, `.site-src/offline-client.js` e `manifest.webmanifest` — PWA incremental e preparação **voluntária** do cache de arquivos astronômicos. A preparação só é confirmada se todos os arquivos forem obtidos; bibliotecas externas ainda impedem prometer 100% offline.
- `.site-src/swiss-scan-worker.js` e `.site-src/swiss-scan-ui.js` — scanner Swiss WASM em Worker separado, com arquivos `.se1` autohospedados, cancelamento, status e saída JSON. A bisseção refina apenas transições detectadas por amostragem: não garante localizar janelas menores que o passo escolhido; o motor principal ainda não roda em Worker.
- `.site-src/asset-provenance.py` — publica SHA-256, tamanho e origem de seis arquivos Swiss usados no build, associados ao commit da publicação.
- `.site-src/research-vault.js`, `.site-src/research-vault-ui.js` e `supabase/research-vault.sql` — snapshots de pesquisa cifrados no dispositivo com AES-GCM, RLS por usuário e envio explícito. **Sem projeto Supabase vinculado, o cofre remoto permanece não operacional.** Veja [guia operacional](docs/OFFLINE_COFRE_OPERACAO.md).

O selo protege o conteúdo, mas **não comprova sozinho a data de criação**; para protocolo verificável por terceiros, publique o hash em um registro externo com data independente. O laboratório exige que o registro seja selado antes do início da janela em UTC. Os resultados estatísticos só têm significado com denominadores, população e taxa-base definidos antecipadamente; coincidências não demonstram causalidade.

## Validação

O workflow executa os testes do motor tradicional e verifica sintaticamente o JavaScript extraído **de fato** das interfaces tradicional e Pro Studio; a ausência de scripts deve falhar. O build também verifica referências aos ativos locais, tamanhos mínimos e assinatura do binário WASM antes de publicar.

Um CI verde demonstra apenas que essas verificações passaram. Não equivale a certificado independente de direções primárias, precisão de entradas históricas, qualidade da experiência móvel, validade interpretativa ou testes completos de navegação.

## Desenvolvimento local

Como WASM e módulos JavaScript são carregados por URL, sirva a pasta `_site/` por um servidor HTTP estático. Não abra o documento via `file://`. Para executar os testes numéricos diretamente: `node .site-src/traditional-engine.test.js`.

## Dados e critérios

Longitudes em branco não devem ser confundidas com 0°; uma hora natal desconhecida não é meio-dia. Contas, sincronização e compartilhamento não devem ser pressupostos. O SHA-256 de uma hipótese identifica seu conteúdo, mas somente um registro externo pode fornecer evidência independente sobre quando existia.

## Licenciamento

Consulte [LICENSE](LICENSE) e [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). O projeto utiliza a opção AGPL-3.0 declarada para integração da Swiss Ephemeris. Um eventual uso proprietário requer análise específica das licenças de todas as partes e, quando cabível, a Swiss Ephemeris Professional License.
