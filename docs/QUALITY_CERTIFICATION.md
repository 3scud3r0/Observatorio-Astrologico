# Qualidade e certificação — fase 8

## O que o CI comprova

O CI verifica sintaxe, contratos de dados, imutabilidade, normalização, incerteza, rastreabilidade editorial, raízes/janelas temporais, progressões, retornos, exportações, backup local/IndexedDB, padrões de segurança, orçamento dos módulos, estrutura acessível, empacotamento e navegação automatizada. `OAQualityGates` gera um laudo legível por máquina para cada mapa e sua leitura.

## O que o CI não comprova

Um resultado verde não é certificação independente da matemática, da validade astrológica, de fusos históricos, de acessibilidade WCAG, de segurança ou de qualidade editorial. Esses itens exigem profissionais e dispositivos externos ao repositório.

## Matriz obrigatória antes de produção profissional

| Gate | Evidência requerida | Estado |
|---|---|---|
| Matemática natal | Golden charts comparados a Swiss nativa e duas ferramentas independentes | Pendente de auditor externo |
| Técnicas temporais | Fixtures de passagens, progressões, direções/retornos e comparação independente | Regressões internas completas; comparação externa pendente |
| Fusos históricos | Base IANA versionada e casos documentais por época/região | Parcial |
| Editorial | Revisão assinada por ao menos dois especialistas e teste com leigos | Pendente |
| Acessibilidade | Auditoria WCAG 2.2 AA com NVDA, VoiceOver e TalkBack | Pendente |
| Segurança | SAST/DAST, CSP e revisão de importação/armazenamento | Gates estáticos internos; auditoria externa pendente |
| Privacidade | Teste RLS real com duas contas, exclusão e restauração | Pendente de Supabase configurado |
| Desempenho | aparelhos físicos médios, rede e CPU limitadas | Pendente |

## Regra de lançamento

O produto pode ser publicado como laboratório local e didático enquanto os gates externos estiverem pendentes, desde que não use os termos “certificado”, “comprovado”, “previsão garantida” ou equivalentes. O modo profissional só pode ser chamado de certificado quando todas as evidências externas estiverem anexadas com versão, data e responsável.
