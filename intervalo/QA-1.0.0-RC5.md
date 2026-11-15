# Intervalo — QA 1.0.0-rc.5 · Inclusão automática na comanda

Data: 15/11/2026  
Fonte: `gaveblue/gaveblue`, branch `main`  
Banco: INTERVALO — projeto `fynaaiazebydorzllwip`  
Edge Function: `restaurant-core` v10, `verify_jwt=true`

## Objetivo
Remover a obrigação de abrir uma comanda antes de adicionar o primeiro produto pelo Garçom. Garantir abertura automática somente ao confirmar o primeiro item, reaproveitar comanda aberta e evitar comanda vazia em caso de erro.

## Testes e evidências

| Teste | Resultado | Evidência |
|---|---|---|
| Instalação da migration SQL | PASSOU | `apply_migration` retornou sucesso |
| RPC privada a usuários comuns | PASSOU | `anon=false`, `authenticated=false`, `service_role=true` |
| Criar primeira comanda e produto numa mesa livre | PASSOU em banco | Função retornou `created=true` dentro de transação desfeita por `ROLLBACK` |
| Reutilizar comanda aberta | PASSOU em banco | Função retornou `created=false` dentro de transação desfeita por `ROLLBACK` |
| Produto inexistente não cria comanda | PASSOU em banco | `DO` confirmou exceção esperada e mesma contagem de comandas antes/depois |
| Integridade de dados | PASSOU | Contagem de comandas ativas mantida em 1 após os dois testes transacionais |
| Edge Function ativa | PASSOU | `restaurant-core` v10 com ação `item_add_auto`, JWT obrigatório |
| Sintaxe e referências de frontend | PASSOU | JS válido; botão `+` habilitado sem comanda, operação automática usada e tela permanece no Cardápio |
| Envio à cozinha mantido como ação separada | PASSOU na inspeção | `order_submit` ainda é acionado no botão Enviar para cozinha |
| Uso real por conta Garçom no domínio | PENDENTE | Não foi possível autenticar um navegador nessa sessão |
| Tablet, Android e PWA instalado | PENDENTE | Sem verificação visual real do layout |
| Solicitações simultâneas de dois garçons | PENDENTE | Travamento da mesa e índice único inspecionados, mas teste concorrente real não executado |
| Propagação via HTTP | NÃO VERIFICADA | Domínio não foi resolvido pelos verificadores externos usados |

## Roteiro de teste manual

1. Abra o Garçom e selecione uma mesa livre.
2. Abra o Cardápio: os botões `+` dos produtos disponíveis devem estar ativos.
3. Toque no `+` e cancele: a mesa precisa permanecer livre, sem comanda criada.
4. Toque novamente no `+`, escolha quantidade e observações e confirme.
5. Confira que a comanda foi criada, contém o produto e que o Cardápio permanece aberto.
6. Acrescente outro produto e confirme que foi incluído na MESMA comanda.
7. Abra a aba Comanda e verifique itens, valores e botão Enviar para cozinha.
8. Envie, confira atualização na cozinha e confirme que não é possível acrescentar itens a uma comanda já enviada neste fluxo.
9. Teste uma inclusão com internet instável; não declare sucesso antes do retorno. Se houver resposta perdida, confira a comanda antes de repetir o envio.
10. Repita no PWA instalado e em outro restaurante, validando permissões.

## Limites e riscos
- Não há suporte nesta mudança para novas rodadas após uma comanda enviada: isso exigirá novo fluxo de pedidos.
- Retentativas após perda de resposta de rede exigem verificação prévia da comanda; não há chave idempotente adicional nessa operação.
- Falhas na UI ou no domínio não puderam ser descartadas por teste de ponta a ponta.
- Security Advisor Supabase mostrou um alerta preexistente: `auth_leaked_password_protection` desabilitado. Referência: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

**Homologação:** técnica parcial, não declarar conclusão de testes reais. Código já gravado na `main`, backend SQL e Edge Function ativados. Não houve execução do GitHub Actions.
