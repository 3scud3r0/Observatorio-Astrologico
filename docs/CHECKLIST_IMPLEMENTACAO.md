# Checklist integral de implementação das três conversas

Estado auditado no repositório em 21-09-2026. Derivado do [inventário integral](INVENTARIO_TRES_CONVERSAS.md), que é a fonte de descrição dos requisitos. **[x]** significa recurso identificado como existente/implementado, não certificação independente; **[ ] parcial** significa código ou infraestrutura ainda insuficiente; **[ ] pendente** significa requisito ainda não entregue. Não afirmar “terminei” enquanto houver caixas abertas.

Atualizações desta execução: scanner Swiss em Worker com cancelamento; PWA opt-in/CacheStorage; manifesto SHA-256 dos seis ativos Swiss; código de cofre cifrado AES-GCM com RLS preparado (sem projeto Supabase conectado); validação de hora natal/coordenadas; testes adicionais de CI.
**Contagem:** 92 requisitos; 26 marcados existentes/implementados; 48 parciais; 18 pendentes. Para cumprir o pedido integral, todas as 66 caixas abertas precisam ser encerradas e verificadas.


## Arquitetura, desempenho e segurança

- [x] existente/implementado — **AR01** Manter Swiss Ephemeris WASM local, sem API remota para cálculos — E.
- [ ] parcial — **AR02** Fixar versão e proveniência dos arquivos .se1 e runtime — A/P; versões fixadas e seis checksums SHA-256 publicados; comparação entre builds pendente.
- [x] existente/implementado — **AR03** Servir JS, WASM e efemérides sob a mesma origem — E.
- [ ] parcial — **AR04** Manter AGPL-3.0/avisos e auditar licenças antes de copiar dependências — E/P.
- [ ] pendente — **AR05** Desmembrar o HTML de ~15,8 MB dividido em 18 partes — N.
- [ ] pendente — **AR06** Migrar progressivamente a Vite + TypeScript e componentes React/Svelte ou equivalentes — N.
- [ ] pendente — **AR07** Retirar substituições literais frágeis do atlas-release.py — N.
- [ ] pendente — **AR08** Separar banco de textos e componentes em arquivos modulares — N.
- [ ] pendente — **AR09** Code-splitting/lazy loading e meta de <500 KB iniciais (sem efemérides) — N; meta não medida.
- [ ] parcial — **AR10** Isolar Swiss e varreduras pesadas em Web Worker e protocolo RPC cancelável — A/P; scanner independente em Worker com Swiss/WASM e cancelamento; motor principal continua na thread da UI.
- [ ] parcial — **AR11** Limitar memória e preservar responsividade durante consultas longas — P.
- [ ] parcial — **AR12** Cache local controlado de efemérides em IndexedDB/CacheStorage — P; CacheStorage opt-in com pacote explicitamente preparado.
- [ ] parcial — **AR13** PWA e modo offline real após o primeiro download completo — P; manifest, Service Worker e preparação explícita; teste offline interativo/terceiros remotos pendentes.
- [ ] pendente — **AR14** Benchmark FCP, parse, memória, tempo até primeiro mapa e celulares médios — N.
- [x] existente/implementado — **AR15** Melhorar CI para extrair scripts HTML, falhar se nenhum e verificar sintaxe — A.
- [x] existente/implementado — **AR16** Testar motor, empacotamento, WASM, presença/assinatura/tamanho das efemérides — E/A.
- [x] existente/implementado — **AR17** Unificar fonte de progressões/arco solar e firdaria no Pro Studio — A.
- [x] existente/implementado — **AR18** Eliminar motor solar aproximado quando precisão Swiss é anunciada — A.
- [x] existente/implementado — **AR19** Corrigir duplicações de estações em zero exatamente amostrado — A.
- [ ] parcial — **AR20** Impedir campos vazios de virarem longitude 0° — A/P.
- [ ] parcial — **AR21** Tratar hora natal ausente sem inventar meio-dia ou Ascendente exato — A/P.
- [ ] parcial — **AR22** Mitigar injeções de HTML em nomes/diários/resultados — A/P; exige varredura integral.
- [ ] parcial — **AR23** Testes de regressão e comparação numérica independente entre versões/motores — P.
- [ ] pendente — **AR24** Testes de instalações em navegadores, orientação móvel, teclado e acessibilidade — N.
- [ ] parcial — **AR25** Versionar e identificar parâmetros de cada cálculo e sua fonte — P/A.
- [ ] parcial — **AR26** Medir limites de intervalo das efemérides, fuso histórico e DST, não prometer 1800–2400 cegamente — P.
- [ ] pendente — **AR27** Separar matemática determinística de textos gerados por IA; IA só didática e com fontes — N.

## Cálculo e astrologia profissional

- [x] existente/implementado — **AS01** Natal, posições, aspectos, casas, roda e estudo guiado — E.
- [x] existente/implementado — **AS02** Casas: Placidus, Signos Inteiros, Koch, Regiomontanus, Campanus, Iguais — E.
- [ ] parcial — **AS03** Alternativas: Alcabitius, Porfírio, Morinus, Meridian, Topocêntrico, Vehlow, Azimutal — E/P.
- [ ] parcial — **AS04** Zodíaco tropical/sideral com parâmetros explicitados — P.
- [x] existente/implementado — **AS05** Domicílio, exaltação, detrimento, queda, pontuação 5/4/3/2/1 — E.
- [ ] parcial — **AS06** Triplicidades Doroteu/Ptolomeu por seita e regente participante — P.
- [ ] parcial — **AS07** Termos/limites ptolemaicos **e** egípcios como tabelas distintas — P; egípcios não certificados.
- [ ] parcial — **AS08** Faces/decanatos, combustão e peregrino; pontuação contextual por escola — P.
- [ ] parcial — **AS09** Orbes por aspecto, corpo, aplicante/separante, maiores e menores — P.
- [x] existente/implementado — **AS10** Lotes Herméticos Fortuna/Espírito e sete lotes por seita — E.
- [x] existente/implementado — **AS11** Profecção anual e mensal; regra de 29/02 explicitada — E.
- [x] existente/implementado — **AS12** Firdaria diurna/noturna e subperíodos caldaicos sem versões contraditórias — A.
- [ ] parcial — **AS13** Zodiacal Releasing L1–L4/Loosing of Bond e limites independentes — P.
- [ ] parcial — **AS14** Direções primárias AR e semi-arcos; direto/converso, zodiacal/in-mundo, geolatitude — P; certificação independente pendente.
- [ ] parcial — **AS15** Sizígia pré-natal e precisão da busca — P.
- [ ] parcial — **AS16** Estrelas fixas: modo aproximado versus efeméride específica (fixstar2) — P.
- [ ] parcial — **AS17** Recepção mútua, midpoints, harmônicos, antiscia, declinações/paralelos — E/P.
- [ ] parcial — **AS18** Laudo técnico do mapa: fuso, local, qualidade da hora, casas, zodíaco, motor, data — A/P.
- [ ] pendente — **AS19** Testes de mapas-referência por escola, época, latitude e circumpolaridade — N.
- [ ] parcial — **AS20** Identidade/proveniência reproduzível e diferenças entre versões do mapa — A/P.
- [x] existente/implementado — **AS21** Não equiparar precisão da efeméride à validade da leitura astrológica — A (documentação/UX).

## Técnicas e investigação temporal

- [ ] parcial — **PR01** Linha do tempo interativa ±minuto/hora/dia/mês/ano, roda atualizável — A/P; relógio Swiss e roda SVG, sem bi-wheel.
- [x] existente/implementado — **PR02** Scanner anual de trânsito com motor suíço, não Sol médio — A.
- [ ] parcial — **PR03** Trânsitos exatos, orbe de entrada/saída, aspectos e agenda — A/P; scanner Swiss em Worker calcula janelas refinadas por bisseção quando detectadas; agenda e garantia de eventos subamostrados pendentes.
- [x] existente/implementado — **PR04** Progressões secundárias com idade fracionária — E/A.
- [ ] pendente — **PR05** Ascendente e MC progredidos: opção arco solar/AR, convenção descrita — N.
- [ ] parcial — **PR06** Direções por arco solar médio e verdadeiro + comparação — P.
- [ ] pendente — **PR07** Roda dupla natal x trânsito/progressão/direção — N/P.
- [ ] pendente — **PR08** Revoluções solar e lunar; correção de precessão opcional — N/P.
- [ ] parcial — **PR09** Firdaria e profecções em linha da vida e senhor do ano — P.
- [ ] parcial — **PR10** Zodiacal Releasing Fortuna/Espírito como cronologia visual — P.
- [ ] pendente — **PR11** Retificação por lista biográfica com função objetivo e incerteza — N.
- [ ] parcial — **PR12** Retornos, estações, ingressos, eclipses, retrogradação — E/P.
- [ ] parcial — **PR13** Volumes de até 90 dias, cancelamento, persistência/retomada — E/P.
- [ ] pendente — **PR14** Retomar sem recalcular volumes concluídos e evitar limites artificiais de janelas — N/P.
- [ ] parcial — **PR15** Comparar técnicas com critérios separados sem aumentar artificialmente “acertos” — A/P.
- [ ] parcial — **PR16** Definir casas/orbes/escolas e origem de cada evento para reprodução — P.

## Pesquisa, privacidade e dados

- [x] existente/implementado — **PE01** Diário prospectivo que fecha pergunta, janela, hipótese e critério antes do evento — A.
- [x] existente/implementado — **PE02** Registrar técnicas, configurações, orbes e referencial sem astrologia — A.
- [x] existente/implementado — **PE03** Critérios separados de acerto, falha, inconclusão, falsos positivos e negativos — A.
- [x] existente/implementado — **PE04** Hash SHA-256 sobre registro canônico e verificação posterior — A.
- [x] existente/implementado — **PE05** Distinguir hash de carimbo temporal externo confiável — A.
- [x] existente/implementado — **PE06** Anexar avaliações sem sobrescrever protocolo selado — A.
- [x] existente/implementado — **PE07** TP/FP/FN/TN, precisão, sensibilidade, especificidade, taxa falso positivo — A.
- [ ] parcial — **PE08** Denominador/oportunidades e taxa-base; controle sem astrologia — P.
- [x] existente/implementado — **PE09** Preservar não confirmações e histórico de revisões — A.
- [ ] pendente — **PE10** Estatística por técnica/protocolo e correção por múltiplas comparações — N.
- [x] existente/implementado — **PE11** Evitar inferir causalidade ou poder preditivo de coincidências — A.
- [x] existente/implementado — **PE12** Dados locais sem cadastro obrigatório; backups JSON — E/A.
- [ ] parcial — **PE13** Exportação/restauração integrais e exclusão explícita — A/P.
- [ ] parcial — **PE14** Sincronização opcional Supabase privada sob RLS e teste com duas contas — P; cofre cifrado e SQL RLS implementados; nenhum projeto Supabase conectado, migração e teste com contas reais pendentes.
- [ ] parcial — **PE15** Cifrar/sincronizar dados pessoais mediante consentimento, jamais torná-los públicos por padrão — A/P; WebCrypto AES-256-GCM, PBKDF2 e upload explícito de snapshots; integração real pendente.
- [ ] parcial — **PE16** Relatórios PDF de auditoria e identidade técnica — P.
- [ ] pendente — **PE17** Importação opcional de mapas de referência com qualidade do horário/Rodden Rating — N.
- [ ] pendente — **PE18** Registro observacional com janela encerrada por evento, não por volume computacional — N.

## Interface e didática

- [ ] parcial — **UX01** Entrada por objetivo: começar, investigar, aprender e especialista — A/P; painel complementar, não entrada principal.
- [ ] parcial — **UX02** Alternador leigo/observatório profissional — A/P; explicação simples/técnica no estudo guiado.
- [ ] parcial — **UX03** Big 3 em linguagem direta, contexto sobre graus e signos — A/P; painel natal de três etapas.
- [ ] pendente — **UX04** Missões de estudo que iluminam casas/planetas — N.
- [ ] parcial — **UX05** Ajuda contextual “explique de forma simples” sem mudar fórmulas — A/P; painel básico/técnico sem IA.
- [ ] parcial — **UX06** Mostrar horas documentadas/aproximadas/desconhecidas, fuso incerto e geolocalização — A/P.
- [ ] parcial — **UX07** Impedir resultados dependentes da hora sem horário confiável — A/P.
- [ ] parcial — **UX08** Explicitar local vs conta vs arquivo exportado — A/P.
- [ ] parcial — **UX09** Interfaces acessíveis, responsivas, sem anúncios ou conta obrigatória — P.
- [ ] parcial — **UX10** Diferenciar interpretação tradicional, posição astronômica e evidência empírica — A/P.

## Dependências de terceiros / gabaritos

As onze fontes citadas constam no [inventário integral](INVENTARIO_TRES_CONVERSAS.md#6-repositórios-e-referências-citados-na-terceira-conversa). Cada uso exige licença, compatibilidade, proveniência e teste. Uma fonte citada **não** vira automaticamente dependência instalada.
