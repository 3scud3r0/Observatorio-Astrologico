# Contas privadas do Atlas

O site permanece no GitHub Pages. O Supabase fornece autenticação e banco privado.
O modo local funciona sem configuração de servidor. O site não simula login.

## Configuração necessária

1. No projeto Supabase destinado ao Observatório, aplicar `supabase/atlas-auth.sql` uma vez.
2. Configurar a Site URL e a URL de redirecionamento de Auth como
   `https://3scud3r0.github.io/Observatorio-Astrologico/`.
3. Habilitar confirmação de e-mail e configurar envio de e-mails de autenticação.
4. Para Google, criar o cliente OAuth no Google Cloud e cadastrar o callback
   indicado pelo Supabase. Colocar o client secret **apenas** nas configurações
   do provedor no Supabase. Para outros provedores, seguir a configuração própria.
5. Preencher `.site-src/atlas-auth.json` com a URL pública do projeto e a chave
   publishable (ou anon). Nunca publicar `service_role`, secret key, senha do banco
   ou segredo OAuth. `providers` lista somente provedores realmente habilitados,
   por exemplo `["google", "github"]`.
6. Publicar e testar criação/confirmação de conta, login, logout, retorno OAuth,
   cópia de um mapa local para a conta e abertura em outro dispositivo.
7. Com duas contas de teste, confirmar que uma não consegue ler ou alterar
   os mapas da outra. RLS deve permanecer habilitado.

## Comportamento

- Perfis são agrupamentos pelo nome da pessoa ou projeto dentro de cada conta.
- Mapas locais permanecem no navegador. A cópia para a conta exige ação explícita.
- Cada mapa da conta tem proprietário verificado por `auth.uid()` nas políticas RLS.
- O cliente usa PKCE. Tokens administrativos nunca são necessários no navegador.
- O código de integração está preparado, mas login só aparece após configuração.

Referências oficiais:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/database/postgres/row-level-security

# Consultas extensas

A duração total não é limitada a 93 dias. Permanecem os limites reais das
efemérides instaladas e a validação do fuso horário. O processamento usa volumes
de até 90 dias locais, armazenados no IndexedDB deste navegador. Cada volume
tem relatório, PDF e JSON próprios. Janelas são explicitamente cortadas nas
bordas de cada volume. Cancelar preserva os volumes já concluídos.
O tempo de processamento e o armazenamento disponível continuam sendo limites
práticos do dispositivo; não se promete processamento instantâneo ou infinito.

# Verificação da versão

O elemento `#oa-atlas` identifica a versão em `data-release`.
Os testes locais verificam sintaxe, consulta de 367 dias, datas invertidas,
datas fora das efemérides e a restrição histórica de óbitos. O PDF é exercitado
com 220 contatos e texto longo para verificar a paginação sem corte de linhas.
