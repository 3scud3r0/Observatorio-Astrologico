# Auditoria de dependências e licenças

Atualizada em 21-09-2026. Esta lista cobre dependências introduzidas ou empacotadas pelo build atual. O deploy público permanece AGPL-3.0 e publica `LICENSE.txt` e `THIRD_PARTY_NOTICES.md`.

| Dependência | Versão/origem fixada | Uso | Licença verificada no upstream |
|---|---|---|---|
| Swiss Ephemeris | `aloistr/swisseph@9083a12d59e98034fb2337061481ac8800c16e64` | efemérides e cálculo astronômico | dual: AGPL / licença profissional; este repositório usa a opção AGPL |
| `@swisseph/browser` | `1.3.1` | wrapper WASM/VFS | AGPL-3.0 |
| Celestine | `0.2.1` (código adaptado já documentado) | matemática fallback de casas | MIT |
| Vite | `8.3.0` | build da entrada modular | MIT |
| TypeScript | `7.0.2` | compilação/checagem estática | Apache-2.0 |
| Playwright | `1.63.0` | testes de release; não é enviado ao navegador | Apache-2.0 |
| Supabase JS | `2.57.4`, importação dinâmica opcional | conta/cofre opcional | dependência remota opcional; não entra no bundle inicial |

## Regras de atualização

1. Não aceitar intervalos semver (`^`, `~`, `*`) nas dependências de build.
2. Alterar a versão Swiss ou o commit dos arquivos `.se1` exige atualizar o manifesto de proveniência e executar novamente todos os testes numéricos.
3. Uma nova biblioteca só pode ser copiada/empacotada após registrar origem, versão e licença aqui ou em `THIRD_PARTY_NOTICES.md`.
4. Ferramentas de teste/build não são apresentadas como parte do motor matemático.
5. Nenhum segredo ou chave `service_role` pode ser enviado ao cliente.
