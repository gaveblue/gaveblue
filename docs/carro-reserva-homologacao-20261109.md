# Carro reserva — auditoria do PR #113 (09/11/2026)

## Status: PILOTO EM PRODUÇÃO AUTORIZADO — testes operacionais do usuário pendentes

### Preparação para publicação — 09/11/2026

O responsável autorizou explicitamente colocar o módulo no sistema de produção para testá-lo. Esta liberação é classificada como **piloto operacional**, não como homologação final de sincronização em duas sessões.

- **Supabase de produção:** a migração `wefrotas_reserve_exclusivity_20261109` foi aplicada no projeto correto `wkssfugzghwifaddagfr`. Três gatilhos foram confirmados ativos; funções de gatilho sem execução pública para `anon`/`authenticated`.
- **Regressão SQL pós-migração:** 15/15 cenários de integridade passaram dentro de `BEGIN/ROLLBACK`, sem criar registros fictícios duradouros.
- **Regressão JavaScript:** 21/21 casos do módulo passaram em executor isolado e todos os arquivos JavaScript relevantes passaram pela verificação de sintaxe; testes de navegador com login real continuam pendentes.
- **Confirmação online:** o formulário agora só mostra sucesso se a sincronização retornar `supabase-saved`, `supabase-verified` ou `supabase-rebased`; outros modos são relatados como pendentes.
- **Visual:** contraste do Bottom Sheet, tema escuro explícito, espaçamento móvel e atualização de cache dos 5 recursos ligados ao módulo.
- **Rollback disponível:** `supabase/rollbacks/wefrotas_reserve_exclusivity_rollback.sql` remove apenas gatilhos/funções da proteção; não altera dados; em caso de incidente, primeiro considerar reverter o frontend.
- **GitHub Actions:** workflow específico permanece removido devido ao bloqueio de cobrança. Nunca tratar sua ausência como aprovação de testes.

**O histórico de auditoria abaixo descreve etapas anteriores ao piloto.** Não confundir os bloqueios históricos de acesso ao Supabase com o estado atual. Ainda é necessário validar autenticação de perfis reais, ida/volta de abastecimentos via Central, duas sessões concorrentes e retorno após perda de conexão.



## Revisão complementar — 09/11/2026

**Resultado: 15/15 casos SQL de integridade passaram** no projeto Supabase real `wkssfugzghwifaddagfr`, com DDL e registros fictícios inteiramente dentro de `BEGIN ... ROLLBACK`. Não foi criado projeto nem branch pago, nem implantado gatilho em produção.

**Código:** a migração `supabase/migrations/202611090001_wefrotas_reserve_exclusivity.sql` agora também impede que uma atualização antiga remova silenciosamente eventos do histórico, além de impedir exclusões de titular, reserva e motorista vinculados. A regressão reproduzível está em `tests/wefrotas-reserve-sql-smoke.sql` e pressupõe migração já aplicada num banco de homologação (para teste pré-instalação, concatenar os dois conteúdos dentro da mesma transação).

Casos aprovados: reserva simultânea duplicada; motorista simultâneo; reserva também como titular; conflito inclusivo no mesmo dia; motorista inexistente; KM final inválido; data impossível; período anterior sem sobreposição; edição apagando a propriedade de histórico; edição substituindo histórico por array vazio; exclusão do titular; exclusão do reserva; exclusão do motorista; isolamento entre duas organizações com IDs iguais; encerramento válido preservando o KM original do titular.

**Revisão estática:** 7 arquivos JS relevantes passaram por compilação sintática (`wefrotas.js`, substituições, perfil, lista, Supabase backend/core e relatórios); isto não equivale a executar a suíte Node ou o aplicativo autenticado. Os testes Node e navegador previamente documentados pelo Codex continuam como evidência da execução anterior, não desta revisão.

**Banco e permissões:** RLS está habilitado em veículos, motoristas, financeiro e estado da empresa; as políticas de leitura para `authenticated` usam `wefrotas_can_read(organization_id)`; `authenticated` não tem INSERT direto nesses quatro objetos. Os dados reais permaneceram inalterados; após o teste foram confirmados 14 veículos, zero organizações fictícias e zero triggers de reserva instalados.

**Ambiente isolado:** a conta Supabase não possui branches de desenvolvimento atualmente. Uma tentativa de criar branch foi bloqueada pela exigência de confirmação de custo. Nenhuma cobrança/branch foi criada. NÃO aplicar DDL em produção apenas para substituir essa etapa.

**Bloqueios reais para declarar homologação e publicar:** criar um ambiente isolado autorizado, aplicar a migração ali e realizar dois clientes autenticados gravando eventos concorrentes; conferir envio pendente e reconexão, isolamento entre perfis reais e aprovação de abastecimento pela Central. Os testes SQL sequenciais de rollback comprovam a regra e o efeito atômico por transação, mas não simulam duas conexões simultâneas com autenticação real.

**GitHub Actions:** não utilizar como critério de conclusão enquanto houver bloqueio de cobrança. O workflow específico foi removido da branch. Manter PR draft e sem merge/publicação até os testes integrados.



Branch: `feature/wefrotas-carro-reserva-20261109`. Base auditada do PR: `77bafc92ea9b7844d003b5e93f0af38fb47f11e7`.
Sem merge, publicação, alteração de schema, credenciais, autenticação, RLS, KM ou registros financeiros de produção.
Os testes de interface usam dados fictícios e bloqueiam todas as requisições externas.

## Correções nesta revisão

- Sobreposição também quando um veículo aparece como titular em um evento e reserva em outro.
- Datas reais de calendário; recursos ativos e reserva operacionalmente disponível para novas substituições.
- Proteção do vínculo histórico na edição de abastecimento; motorista obrigatório para o reserva ocupado.
- ID de substituição isolado não permite somar combustível de outro veículo.
- KM de devolução não pode ultrapassar leitura posterior conhecida.
- Bloqueio dos dados de entrega também quando abastecimentos são associados por motorista/veículo/período.
- Apuração reutiliza `WeFrotasVehicleReports.detailRows`: rateio em centavos do valor líquido do grupo, sem somar novamente o pai. Outras despesas entram apenas quando identificadas pelo evento ou pelo motorista. Custos adicionais continuam informativos: NÃO geram lançamento financeiro.
- Repetição de envio usa o mesmo ID após erro/resultado incerto. Sheet não fecha durante gravação; submissão dupla bloqueada; foco de teclado contido e restaurado.
- Validação também na ponte de gravação e na persistência do formulário financeiro.
- Data de lançamento antigo não troca automaticamente a placa.
- Importação automática da Central com substituição ativa passa para revisão de placa/KM, em vez de presumir que a leitura recebida é do reserva.
- Motivo “Outro” imobiliza o titular. Devolução NÃO libera o titular automaticamente; liberação efetiva continua pelo status operacional do cadastro.
- Box sizing no sheet evita transbordamento; versões dos scripts integrados atualizadas para evitar mistura com cache anterior.
- Workflow usa Node 24 e inclui regressão de calendário/odômetro. Isso NÃO resolve o bloqueio de cobrança do GitHub.

## Evidências de testes

Ambiente: Windows, Node v24.22.1, Chrome headless, Playwright disponível no ambiente de auditoria.

| Verificação | Resultado |
|---|---|
| `node --test tests/wefrotas-substitutions.test.cjs` | 21/21; um caso é diagnóstico de vulnerabilidade de concorrência, NÃO aprovação desse requisito |
| `node --test tests/wefrotas-login-calendar-mileage.test.cjs` | 29/29 |
| `node tests/wefrotas-substitutions-browser.cjs` | Ciclo isolado aprovado em 1280×760 e 375×760 |
| Sintaxe: aplicativo, substituições, perfil e lista | Aprovada |
| `git -c core.whitespace=cr-at-eol diff --check` | Aprovado |
| Suíte antiga `wefrotas-supabase-migration.test.cjs` | 83/86; três expectativas estáticas incompatíveis com backend/cutover atual, descritas abaixo |
| Supabase real — auditoria de schema/RPC/RLS | Leitura autorizada na conexão Spba; integração autenticada em duas sessões continua pendente |
| Safari/iPhone e aparelho Android físico | Não executado; viewport móvel não substitui aparelho real |

O ciclo no navegador cobre: entrega, erro de conexão simulado, tentativa de fechar enquanto salva, reenvio com mesmo ID, inclusão fictícia de abastecimento, devolução, preservação dos dois odômetros, despesa única, permissão negada e dimensões do sheet. A persistência é simulada: não comprova entrega/realtime do servidor.

Imagens locais fora do repositório: `../artifacts/reserve-qa-20261109/sheet-1280.png` e `sheet-375.png`. Inspeção visual realizada. Teste de navegador depende da instalação local em `../central-audit-build-tools/node_modules/playwright` e Chrome (ou `CHROME_PATH`); não faz parte do workflow Linux.

As três falhas da suíte antiga são: exigência do antigo `wefrotas-backend.js` antes do Supabase, regex `expected_revision:revision` (implementação atual usa revisão da tentativa), e exigência de `setPending(true)` diretamente em `syncNow` (implementação atual usa journal/stageSnapshot). Não se alterou o backend para satisfazer regex legadas, nem se declarou essas verificações aprovadas.

## Falha do GitHub Actions

Run `42618738623`, job `129165096331`, commit auditado acima. Job sem steps e sem logs: anotação do check informa **“The job was not started because your account is locked due to a billing issue.”**
Não é falha de sintaxe nem de teste. Responsável pela conta precisa regularizar/verificar a cobrança; não foi alterada cobrança nem contratado plano. Após resolução, executar QA novamente. O aviso de migração ubuntu-latest não é a causa desse bloqueio.

## Supabase: acesso de leitura confirmado no projeto correto

`wefrotas/supabase-config.js` aponta para `wkssfugzghwifaddagfr.supabase.co`, projeto real esperado do WeFrotas.
Em 09/11 foi identificada a segunda conexão autorizada de Supabase (Spba), que lista o projeto correto `wkssfugzghwifaddagfr` (`gaveblue.com`). A conexão GB+ permanece separada e **não foi utilizada**. Foram inspecionados esquema, permissões, políticas, RPCs reais `wefrotas_apply_snapshot_delta`, `wefrotas_apply_table_delta`, `wefrotas_commit_changes`, `wefrotas_import_snapshot`, e aprovação da Central, sempre com leitura. A RPC de snapshot bloqueia `wefrotas_workspace_state` por organização e checa revisão otimista; o merge de sessões distintas aceita deltas de veículos distintos. Não foi alterado banco de produção.

## Continuidade e segurança em 09/11/2026

**GitHub Actions indisponível por problema de cobrança:** removido da branch o workflow específico `.github/workflows/wefrotas-reserve-qa.yml`. Não depender do Actions até normalização de cobrança; usar Node, navegador isolado e testes SQL em transação. O trabalho de homologação não deve ficar bloqueado só pelo CI.

**Migração preparada (NÃO aplicada):** `supabase/migrations/202611090001_wefrotas_reserve_exclusivity.sql`. Define um `CONSTRAINT TRIGGER` adiado por transação na tabela de veículos para conferir todas as substituições **após** upserts, com lock da mesma linha `wefrotas_workspace_state` que a RPC de snapshot já usa. É segregado por organização, rejeita eventos inconsistentes, datas/KM inválidos, IDs repetidos, sobreposições de titular/reserva/motorista e cruzamento entre titular e reserva. Gatilhos de exclusão preservam histórico de titulares, reservas e motoristas e também usam lock da organização. Funções de gatilho são `SECURITY DEFINER` com `search_path` fixo e sem `EXECUTE` público.

**Evidência SQL isolada no banco correto:** a migração foi criada em transação de teste `BEGIN ... ROLLBACK`; um conjunto fictício com quatro veículos e dois motoristas retornou:

| Caso | Resultado |
|---|---|
| Início de substituição válida | Aceito |
| Mesmo reserva com período sobreposto | Rejeitado `PT409` |
| Mesmo motorista com dois veículos simultâneos | Rejeitado `PT409` |
| Reserva usado como titular em período sobreposto | Rejeitado `PT409` |
| Período não sobreposto | Aceito |
| ID de veículo titular divergente | Rejeitado `22023` |
| Excluir carro reserva com histórico | Rejeitado `PT409` |
| Excluir titular com histórico | Rejeitado `PT409` |
| Excluir motorista com histórico | Rejeitado `PT409` |

A última revisão do lock de exclusão foi executada novamente em transação com rollback: conflitos de reserva, exclusão de motorista e exclusão do reserva foram **rejeitados com PT409**. Continua faltando simulação de duas transações simultâneas reais. Após os testes, o banco continuou com 14 veículos, zero eventos de substituição, zero organizações fictícias e **zero gatilhos de reserva implantados**. Nenhum dado financeiro/KM de produção foi modificado.

**Ainda NÃO homologado ao vivo:** faltam testes reais de dois navegadores autenticados, sincronização e offline, comportamento da Central, RLS efetivo por perfis e execução da migração num ambiente de homologação persistente. Não fazer merge ou publicação antes de registrar tais evidências.

## Bloqueios e riscos antes de qualquer publicação

1. **Concorrência entre veículos diferentes:** agora há uma migração SQL com trava no banco e testes transacionais isolados aprovados para rejeitar sobreposição. A proteção ainda NÃO está ativa em produção, e falta o teste real com dois clientes autenticados e ambiente de homologação. A cópia local continua preservada em erro de servidor.
2. **Confirmação e offline reais:** o bridge mantém alterações locais enquanto o journal tenta sincronizar. O erro é exibido como “não confirmada no servidor”. Não se deve interpretar o cartão local como confirmação remota. Testar perda de resposta, recarga, reconexão, recuperação e duas sessões reais antes da liberação.
3. **Histórico:** período é inclusivo por data, sem hora; duas substituições do mesmo recurso no mesmo dia são bloqueadas. Ausência de KM não deve virar estimativa automática. Ainda requer cenários de movimentações manuais e leituras de entregas anteriores sem abastecimento entre elas.
4. **Custos adicionais informativos:** não possuem vínculo próprio com uma despesa; operador pode informar novamente um valor já presente no combustível/outras despesas e inflar a análise do evento (não o Financeiro). Validar orientação/necessidade de vínculo explícito antes de aprovação final.
5. **Central:** revisão manual é intencional quando há substituição; validar o registro real recebido e confirmação física do carro, inclusive registros antigos, em homologação. Não se modificou a Central dos motoristas.
6. **Permissões/servidor:** autorização local não substitui a política real. RLS/multiempresa e gravação de JSONB precisam de teste com perfis de leitura/gestão no projeto correto.

## Próxima decisão necessária

A conexão de leitura do Supabase correto foi recuperada e a migração de integridade preparada. Executar a migração num ambiente de homologação persistente, validar concorrência com duas sessões e perfis reais e só então considerar sua aplicação em produção, merge e publicação. Manter PR draft e NÃO publicar automaticamente. Autorização futura para merge/publicação deve ser expressa, após novas evidências.
