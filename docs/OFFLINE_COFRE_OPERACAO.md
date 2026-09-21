# PWA, efemérides e cofre cifrado — guia de operação

## O que foi integrado

O deploy publica `manifest.webmanifest`, `service-worker.js`, `offline-client.js`,
`ephemeris-provenance.json`, o pacote Swiss fixado em `@swisseph/browser@1.3.1`
e os três arquivos `.se1` baixados do commit fixo
`aloistr/swisseph@9083a12d59e98034fb2337061481ac8800c16e64`.

O botão **Offline / Instalar** dá início, por escolha explícita do usuário, ao
cache dos arquivos públicos listados no Service Worker. O uso offline só deve
ser tratado como preparado quando todos os arquivos obrigatórios terminam sem
falha e uma recarga sem rede é testada no dispositivo alvo. Dados privados,
`atlas-auth.json`, solicitações de API e scripts remotos não são precached.
As páginas atuais ainda usam dependências remotas; portanto **não declarar o
site inteiro 100% offline** até removê-las/testá-las. A aplicação principal
continua monolítica; não declarar que o Vite/TypeScript já foi migrado.

O manifesto de proveniência oferece um SHA-256 e o tamanho de cada binário
publicado; a identidade técnica exportada pelo laboratório inclui esse
manifesto, o commit do deploy e os parâmetros informados do nascimento.
Não é uma validação astrológica independente.

## Ativação opcional do Supabase

**Nesta execução, a conta Supabase conectada não possuía projetos. Nenhuma
migração foi aplicada a um banco remoto, nenhum segredo foi acessado e nenhum
teste de isolamento entre duas contas reais foi executado.**

Quando existir um projeto autorizado:

1. Execute `supabase/research-vault.sql` em uma transação nesse projeto. A
   tabela `public.atlas_research_vault` tem RLS, políticas por `owner_id`,
   sem privilégios `anon` e sem permissão de `UPDATE`.
2. Configure `atlas-auth.json` com a URL HTTPS e a **chave publicável**, nunca
   uma chave secreta ou `service_role`. Ative provedores de autenticação
   conforme a política da sua instância.
3. Teste com duas contas **distintas**: selecionar/listar/deletar dados próprios
   deve funcionar; ler, inserir como outro `owner_id` ou apagar dados alheios
   deve ser negado; visitante sem conta não deve acessar a tabela.
4. Faça login pelo painel de contas Atlas. Abra o Laboratório, sele um
   protocolo prospectivo, depois use o botão **Cofre cifrado** para enviar,
   listar, restaurar ou excluir snapshots.
5. Teste no navegador real com frases-senha corretas/incorretas, recarga,
   exclusão, falha de rede, armazenamento cheio e troca de conta.

O backup é cifrado **antes do envio** com PBKDF2-SHA-256 (310.000 iterações;
salt aleatório de 16 bytes) e AES-256-GCM (nonce aleatório de 12 bytes) pelo
WebCrypto. A frase-senha não é enviada nem armazenada; perdê-la impede
recuperação. O servidor vê `record_hash`, `owner_id`, hora de upload e
envelope cifrado, não o texto da hipótese. Cada upload é um novo snapshot
imutável; a cópia local continua soberana.

Um timestamp do banco atesta o horário **do upload**, não comprova que a
hipótese foi formulada antes da janela. Para evidência prospectiva externa,
publique o hash selado antecipadamente em registro independente datado.

## Regra de divulgação

CI verde comprova compilação sintática, contratos estáticos e os testes
automatizados presentes — não substitui teste interativo, auditoria de
privacidade independente, avaliação de quota offline ou comparação matemática
com Morinus/Astrolog. O
[inventário completo](INVENTARIO_TRES_CONVERSAS.md) preserva esses limites.
