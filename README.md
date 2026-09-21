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

## Validação

O workflow executa os testes do motor tradicional e verifica sintaticamente o JavaScript extraído **de fato** das interfaces tradicional e Pro Studio; a ausência de scripts deve falhar. O build também verifica referências aos ativos locais, tamanhos mínimos e assinatura do binário WASM antes de publicar.

Um CI verde demonstra apenas que essas verificações passaram. Não equivale a certificado independente de direções primárias, precisão de entradas históricas, qualidade da experiência móvel, validade interpretativa ou testes completos de navegação.

## Desenvolvimento local

Como WASM e módulos JavaScript são carregados por URL, sirva a pasta `_site/` por um servidor HTTP estático. Não abra o documento via `file://`. Para executar os testes numéricos diretamente: `node .site-src/traditional-engine.test.js`.

## Dados e critérios

Longitudes em branco não devem ser confundidas com 0°; uma hora natal desconhecida não é meio-dia. Contas, sincronização e compartilhamento não devem ser pressupostos. O SHA-256 de uma hipótese identifica seu conteúdo, mas somente um registro externo pode fornecer evidência independente sobre quando existia.

## Licenciamento

Consulte [LICENSE](LICENSE) e [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). O projeto utiliza a opção AGPL-3.0 declarada para integração da Swiss Ephemeris. Um eventual uso proprietário requer análise específica das licenças de todas as partes e, quando cabível, a Swiss Ephemeris Professional License.
