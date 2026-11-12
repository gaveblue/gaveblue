# Intervalo — QA operacional 0.9.5
Data: 12/11/2026 · Supabase: fynaaiazebydorzllwip · Fonte: gaveblue/gaveblue (main)

## Resumo
**Correções e infraestrutura implementadas; homologação de produção completa AINDA NÃO APROVADA.**
Não confundir implantação de backend ou teste SQL com login E2E via navegador ou impressão física.

## Evidências executadas
| Critério | Situação | Evidência |
|---|---|---|
| Baixa automática por ficha técnica em envio de comanda | PASSOU em SQL transacional | `intervalo_submit_order` alterada por migration 0.9.4 |
| Envio duplicado não desconta duas vezes | PASSOU em SQL transacional | Segunda chamada em pedido já enviado é recusada |
| Saldo insuficiente não muda comanda nem estoque | PASSOU em SQL transacional | Transação com insumo abaixo da quantidade necessária foi recusada |
| Entrada e perda de estoque | PASSOU em SQL transacional | `intervalo_stock_adjust` e extrato foram conferidos |
| Criação de insumo com saldo inicial no extrato | PASSOU em SQL transacional | `intervalo_create_stock` produz movimento de entrada quando saldo é maior que zero |
| Sem registros de QA persistentes | PASSOU | `BEGIN ... ROLLBACK`; contagem de restaurante QA temporário = 0 |
| RPCs de estoque sem execução direta por anon/authenticated | PASSOU | `service_role: true`, `anon: false`, `authenticated: false` |
| `restaurant-core` ativo no Supabase | PASSOU implantação | Edge Function v5, JWT obrigatório |
| `restaurant-team` ativo no Supabase | PASSOU implantação | Edge Function v5, JWT obrigatório |
| Criação manual de funcionário pelo Master | IMPLEMENTADO; E2E PENDENTE | Reautenticação Master, role limitada, senha provisória, troca obrigatória, limite 20 contas/h |
| Formulários de estoque e painel Master | PASSOU simulação JS | Renderização com dados simulados |
| Prévia imprimível no Caixa e Cozinha | IMPLEMENTADO; HARDWARE NÃO TESTADO | Impressão pelo navegador, documento interno não fiscal |
| Atualização de comandas no Garçom | IMPLEMENTADO; E2E PENDENTE | Poll de 10s com proteção a formulário ativo |
| Cozinha atualizada automaticamente | IMPLEMENTADO; E2E PENDENTE | Poll de 15s em aba visível |
| Sintaxe JS dos módulos alterados | PASSOU | `new Function` em platform, management, support, waiter, kitchen e cash |
| Domínio real / publicação web | NÃO COMPROVADO | Ferramenta externa não conseguiu acessar URL |
| Login real Master, equipe e fluxo comanda -> caixa | NÃO COMPROVADO | Exige browser autenticado de homologação |
| Impressora B&G BG-06 | NÃO COMPROVADO | Driver USB/Bluetooth e agente seguro ainda não concluídos |
| Pagamentos reais ou conciliação Pix/cartão | NÃO IMPLEMENTADO | Apenas registros manuais após pagamento externo |
| Emissão fiscal | NÃO IMPLEMENTADO | Exige definição fiscal do estabelecimento e integração |

## Regras de negócio
- A baixa é atômica e ocorre **uma vez** no envio da comanda. Se um insumo necessário não tiver saldo ou estiver inativo, a comanda permanece aberta sem baixar parcialmente.
- Sem ficha técnica, não há débito de insumo para o produto. A tela de Estoque avisa quais produtos disponíveis estão sem ficha. Isso é uma pendência operacional, não um erro silencioso de banco.
- Os dados são separados por `restaurant_id`; o acesso ao backend é governado por token JWT, papel ativo e módulos habilitados.
- A senha provisória de funcionários é criada pelo Master sem SMTP e deve ser trocada no primeiro login. O Supabase a marca como confirmada administrativamente **sem comprovação de titularidade do e-mail**. O Master deve verificar a pessoa e entregar credenciais de modo privado.
- Impressão pelo navegador é prévia de comanda, não cupom fiscal, nem prova de envio para térmica.
- Pix e cartão no caixa continuam **recebimentos externos declarados manualmente**.

## Bloqueios para declarar versão 1.0.0 pronta
1. Homologar em navegador no domínio uma conta Super Admin, uma Master e todos os papéis, incluindo ativação, sessão, recuperação e troca de restaurante.
2. Testar ao vivo pedido completo, ficha técnica, estoque e pagamento até fechamento, incluindo concorrência de duas mesas, bloqueio por falta de saldo e rollback.
3. Testar isolamento de dois restaurantes e permissões de acesso em diferentes aparelhos.
4. Equipamento térmico e agente Windows: pareamento com B&G BG-06, autenticação por restaurante/estação, fila com reimpressão segura e testes físicos.
5. Para cobranças automáticas, configurar provedor de pagamento e credenciais de produção, webhooks autenticados, idempotência e conciliação bancária.
6. Se emissão de documento fiscal estiver no escopo comercial, integrar provedor autorizado, CNPJ/credenciais/certificado fiscal e regras vigentes do município/UF.
7. Configurar e validar SMTP transacional, recuperação e alertas; habilitar proteção contra senhas vazadas no Supabase Auth.
8. Executar ensaios de desempenho, segurança, backup/restauração, LGPD e recuperação de indisponibilidade.

## Publicação e rollback
Código versionado na main, sem GitHub Actions (indisponível por cobrança).
As alterações de banco são aditivas ou recriam funções com mesma assinatura, sem apagar dados. Rollback requer migração compensatória deliberada — não apagar tabelas nem contas.
