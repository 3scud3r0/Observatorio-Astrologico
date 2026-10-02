# Contrato de produto — fases 0 a 3

## Escopo e escolas

O Observatório calcula fatos astronômicos reproduzíveis e apresenta leituras astrológicas como convenções de estudo. A primeira versão do interpretador cobre os dez planetas, o Ascendente e aspectos maiores no zodíaco tropical, com linguagem não determinista. Regras tradicionais adicionais só entram no texto quando a escola, a fonte e a versão estiverem declaradas.

Não são alegados diagnóstico, causalidade, certeza de acontecimentos ou poder preditivo comprovado. Saúde, finanças, direito, segurança, morte e gravidez nunca recebem recomendações decisórias automatizadas.

## Públicos e profundidade

- **Essencial:** síntese curta, termos explicados e no máximo cinco achados.
- **Intermediário:** mecanismo astrológico, convergências, tensões e dependência do horário.
- **Profissional:** fatos numéricos, regras ativadas, fontes, versão e trilha de evidência.

Trocar a profundidade altera somente a apresentação; o objeto de cálculo permanece imutável.

## Qualidade dos dados

Horários são classificados como `exact`, `documented`, `approximate` ou `unknown`. Ascendente, MC, casas e fatores derivados são suprimidos quando a hora é desconhecida. Horas aproximadas geram aviso e exigem uma margem de incerteza em minutos. Campos ausentes nunca são convertidos em zero.

## Critérios de aceite

1. O mesmo `ChartFacts` produz o mesmo fingerprint e as mesmas regras ativadas.
2. Todo achado interpretativo referencia fatos, regra, escola, versão e fontes.
3. Nenhum texto editorial altera os cálculos.
4. O Worker aceita cancelamento, progresso e erros serializáveis.
5. Entradas e importações são validadas antes do cálculo.
6. Conteúdo dependente da hora respeita a qualidade declarada.
7. A interface oferece os três níveis sem esconder a proveniência profissional.
8. Testes cobrem normalização, incerteza, imutabilidade, rastreabilidade e segurança textual.

## Fora do escopo destas fases

Fusos históricos completos, geocodificação, roda redesenhada, técnicas temporais completas, relatórios finais, sincronização operacional e certificação matemática independente pertencem às fases seguintes. Até sua entrega, a interface deve declarar essas limitações.
