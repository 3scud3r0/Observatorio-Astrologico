# Inventário integral de requisitos — três conversas anexadas

Atualizado em 21-09-2026. **Fontes:** C1 = primeira mesa-redonda; C2 = auditoria técnica extensa; C3 = referências de repositórios e serviços. Este inventário consolida requisitos e *não transforma uma sugestão em funcionalidade entregue*. A última coluna registra o estado verificado no código deste repositório ou nesta implementação. “Existente” não significa certificado por uma fonte matemática independente.

Legenda: **E** = existe, **P** = parcial, **N** = não implementado/validado, **A** = acrescentado nesta evolução.

## 1. Infraestrutura, arquitetura, desempenho e segurança (C1+C2+C3)

| ID | Requisito integral | Estado |
|---|---|---|
| AR01 | Manter Swiss Ephemeris WASM local, sem API remota para cálculos | E |
| AR02 | Fixar versão e proveniência dos arquivos .se1 e runtime | P |
| AR03 | Servir JS, WASM e efemérides sob a mesma origem | E |
| AR04 | Manter AGPL-3.0/avisos e auditar licenças antes de copiar dependências | E/P |
| AR05 | Desmembrar o HTML de ~15,8 MB dividido em 18 partes | N |
| AR06 | Migrar progressivamente a Vite + TypeScript e componentes React/Svelte ou equivalentes | N |
| AR07 | Retirar substituições literais frágeis do atlas-release.py | N |
| AR08 | Separar banco de textos e componentes em arquivos modulares | N |
| AR09 | Code-splitting/lazy loading e meta de <500 KB iniciais (sem efemérides) | N; meta não medida |
| AR10 | Isolar Swiss e varreduras pesadas em Web Worker e protocolo RPC cancelável | N |
| AR11 | Limitar memória e preservar responsividade durante consultas longas | P |
| AR12 | Cache local controlado de efemérides em IndexedDB/CacheStorage | P; CacheStorage opt-in com pacote explicitamente preparado |
| AR13 | PWA e modo offline real após o primeiro download completo | P; manifest, Service Worker e preparação explícita; teste offline interativo/terceiros remotos pendentes |
| AR14 | Benchmark FCP, parse, memória, tempo até primeiro mapa e celulares médios | N |
| AR15 | Melhorar CI para extrair scripts HTML, falhar se nenhum e verificar sintaxe | A |
| AR16 | Testar motor, empacotamento, WASM, presença/assinatura/tamanho das efemérides | E/A |
| AR17 | Unificar fonte de progressões/arco solar e firdaria no Pro Studio | A |
| AR18 | Eliminar motor solar aproximado quando precisão Swiss é anunciada | A |
| AR19 | Corrigir duplicações de estações em zero exatamente amostrado | A |
| AR20 | Impedir campos vazios de virarem longitude 0° | A/P |
| AR21 | Tratar hora natal ausente sem inventar meio-dia ou Ascendente exato | A/P |
| AR22 | Mitigar injeções de HTML em nomes/diários/resultados | A/P; exige varredura integral |
| AR23 | Testes de regressão e comparação numérica independente entre versões/motores | P |
| AR24 | Testes de instalações em navegadores, orientação móvel, teclado e acessibilidade | N |
| AR25 | Versionar e identificar parâmetros de cada cálculo e sua fonte | P/A |
| AR26 | Medir limites de intervalo das efemérides, fuso histórico e DST, não prometer 1800–2400 cegamente | P |
| AR27 | Separar matemática determinística de textos gerados por IA; IA só didática e com fontes | N |

## 2. Astrologia astronômica, tradicional e profissional (C1+C2)

| ID | Requisito | Estado |
|---|---|---|
| AS01 | Natal, posições, aspectos, casas, roda e estudo guiado | E |
| AS02 | Casas: Placidus, Signos Inteiros, Koch, Regiomontanus, Campanus, Iguais | E |
| AS03 | Alternativas: Alcabitius, Porfírio, Morinus, Meridian, Topocêntrico, Vehlow, Azimutal | E/P |
| AS04 | Zodíaco tropical/sideral com parâmetros explicitados | P |
| AS05 | Domicílio, exaltação, detrimento, queda, pontuação 5/4/3/2/1 | E |
| AS06 | Triplicidades Doroteu/Ptolomeu por seita e regente participante | P |
| AS07 | Termos/limites ptolemaicos **e** egípcios como tabelas distintas | P; egípcios não certificados |
| AS08 | Faces/decanatos, combustão e peregrino; pontuação contextual por escola | P |
| AS09 | Orbes por aspecto, corpo, aplicante/separante, maiores e menores | P |
| AS10 | Lotes Herméticos Fortuna/Espírito e sete lotes por seita | E |
| AS11 | Profecção anual e mensal; regra de 29/02 explicitada | E |
| AS12 | Firdaria diurna/noturna e subperíodos caldaicos sem versões contraditórias | A |
| AS13 | Zodiacal Releasing L1–L4/Loosing of Bond e limites independentes | P |
| AS14 | Direções primárias AR e semi-arcos; direto/converso, zodiacal/in-mundo, geolatitude | P; certificação independente pendente |
| AS15 | Sizígia pré-natal e precisão da busca | P |
| AS16 | Estrelas fixas: modo aproximado versus efeméride específica (fixstar2) | P |
| AS17 | Recepção mútua, midpoints, harmônicos, antiscia, declinações/paralelos | E/P |
| AS18 | Laudo técnico do mapa: fuso, local, qualidade da hora, casas, zodíaco, motor, data | A/P |
| AS19 | Testes de mapas-referência por escola, época, latitude e circumpolaridade | N |
| AS20 | Identidade/proveniência reproduzível e diferenças entre versões do mapa | A/P |
| AS21 | Não equiparar precisão da efeméride à validade da leitura astrológica | A (documentação/UX) |

## 3. Técnicas temporais e consultas (C1+C2+C3)

| ID | Requisito | Estado |
|---|---|---|
| PR01 | Linha do tempo interativa ±minuto/hora/dia/mês/ano, roda atualizável | A/P; relógio Swiss e roda SVG, sem bi-wheel |
| PR02 | Scanner anual de trânsito com motor suíço, não Sol médio | A |
| PR03 | Trânsitos exatos, orbe de entrada/saída, aspectos e agenda | E/P |
| PR04 | Progressões secundárias com idade fracionária | E/A |
| PR05 | Ascendente e MC progredidos: opção arco solar/AR, convenção descrita | N |
| PR06 | Direções por arco solar médio e verdadeiro + comparação | P |
| PR07 | Roda dupla natal x trânsito/progressão/direção | N/P |
| PR08 | Revoluções solar e lunar; correção de precessão opcional | N/P |
| PR09 | Firdaria e profecções em linha da vida e senhor do ano | P |
| PR10 | Zodiacal Releasing Fortuna/Espírito como cronologia visual | P |
| PR11 | Retificação por lista biográfica com função objetivo e incerteza | N |
| PR12 | Retornos, estações, ingressos, eclipses, retrogradação | E/P |
| PR13 | Volumes de até 90 dias, cancelamento, persistência/retomada | E/P |
| PR14 | Retomar sem recalcular volumes concluídos e evitar limites artificiais de janelas | N/P |
| PR15 | Comparar técnicas com critérios separados sem aumentar artificialmente “acertos” | A/P |
| PR16 | Definir casas/orbes/escolas e origem de cada evento para reprodução | P |

## 4. Pesquisa empírica, hipóteses e dados pessoais (C1+C2+C3)

| ID | Requisito | Estado |
|---|---|---|
| PE01 | Diário prospectivo que fecha pergunta, janela, hipótese e critério antes do evento | A |
| PE02 | Registrar técnicas, configurações, orbes e referencial sem astrologia | A |
| PE03 | Critérios separados de acerto, falha, inconclusão, falsos positivos e negativos | A |
| PE04 | Hash SHA-256 sobre registro canônico e verificação posterior | A |
| PE05 | Distinguir hash de carimbo temporal externo confiável | A |
| PE06 | Anexar avaliações sem sobrescrever protocolo selado | A |
| PE07 | TP/FP/FN/TN, precisão, sensibilidade, especificidade, taxa falso positivo | A |
| PE08 | Denominador/oportunidades e taxa-base; controle sem astrologia | P |
| PE09 | Preservar não confirmações e histórico de revisões | A |
| PE10 | Estatística por técnica/protocolo e correção por múltiplas comparações | N |
| PE11 | Evitar inferir causalidade ou poder preditivo de coincidências | A |
| PE12 | Dados locais sem cadastro obrigatório; backups JSON | E/A |
| PE13 | Exportação/restauração integrais e exclusão explícita | A/P |
| PE14 | Sincronização opcional Supabase privada sob RLS e teste com duas contas | N; configuração vazia |
| PE15 | Cifrar/sincronizar dados pessoais mediante consentimento, jamais torná-los públicos por padrão | N |
| PE16 | Relatórios PDF de auditoria e identidade técnica | P |
| PE17 | Importação opcional de mapas de referência com qualidade do horário/Rodden Rating | N |
| PE18 | Registro observacional com janela encerrada por evento, não por volume computacional | N |

## 5. UX, didática e qualidade de dados (C1+C2+C3)

| ID | Requisito | Estado |
|---|---|---|
| UX01 | Entrada por objetivo: começar, investigar, aprender e especialista | A/P; painel complementar, não entrada principal |
| UX02 | Alternador leigo/observatório profissional | A/P; explicação simples/técnica no estudo guiado |
| UX03 | Big 3 em linguagem direta, contexto sobre graus e signos | A/P; painel natal de três etapas |
| UX04 | Missões de estudo que iluminam casas/planetas | N |
| UX05 | Ajuda contextual “explique de forma simples” sem mudar fórmulas | A/P; painel básico/técnico sem IA |
| UX06 | Mostrar horas documentadas/aproximadas/desconhecidas, fuso incerto e geolocalização | A/P |
| UX07 | Impedir resultados dependentes da hora sem horário confiável | A/P |
| UX08 | Explicitar local vs conta vs arquivo exportado | A/P |
| UX09 | Interfaces acessíveis, responsivas, sem anúncios ou conta obrigatória | P |
| UX10 | Diferenciar interpretação tradicional, posição astronômica e evidência empírica | A/P |

## 6. Repositórios e referências citados na terceira conversa

Usar como candidatos e gabaritos, **não copiar código sem verificar versões, licença, compatibilidade de API e resultados matemáticos**.

| Fonte citada | Papel | Situação |
|---|---|---|
| [PtPrashantTripathi/sweph-wasm](https://github.com/PtPrashantTripathi/sweph-wasm) e `@swisseph/browser` | WASM + VFS de efemérides | O pacote browser já integra o Observatório |
| fusionstrings/swisseph-wasm | Alternativa WASM/Rust | Não migrado |
| AstroDraw / AstroChart (identidade exata a confirmar) | Renderização SVG | Não integrado |
| [0xStarcat/CircularNatalHoroscopeJS](https://github.com/0xStarcat/CircularNatalHoroscopeJS) | Roda circular JS | Não integrado |
| [g-battaglia/AstrologerStudio](https://github.com/g-battaglia/AstrologerStudio) | Referência de workspace | Não integrado |
| web-lizard/gnosis (identidade exata a confirmar) | Referência local-first | Não integrado |
| Morinus / pyswisseph | Gabarito de cálculos tradicionais | Comparação independente pendente |
| Astrolog (Walter D. Pullen) | Gabarito de cálculos e técnicas | Comparação independente pendente |
| Astro-Seek | Referência de busca temporal, progressões e experiência web | Benchmark, não dependência |
| Astrodienst / astro.com | Referência Swiss e sistemas de casas | Fonte já relevante |
| Astro-Databank / Rodden Rating | Qualidade de dados natais | Integração não feita |

## 7. Critérios para encerrar cada requisito

1. Um requisito sai de **N/P** somente quando existe código executável conectado ao site e provas de comportamento correspondentes.
2. A mesma técnica, na mesma convenção, precisa produzir resultados idênticos em todas as interfaces.
3. Fórmulas sem gabarito independente são “implementadas”, nunca “certificadas”.
4. Funcionalidade remota sem configuração Supabase, RLS e teste de isolamento não é “sincronização pronta”.
5. PWA sem recarga offline realmente testada não é “offline completo”.
6. Redução de tamanho ou aceleração depende de métricas medidas em builds e dispositivos, não de estimativas.
7. Auditoria científica registra todas as oportunidades, referência, inconclusivos e critérios prospectivos; um hash local não comprova horário.
