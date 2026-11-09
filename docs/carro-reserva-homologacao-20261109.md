# Carro reserva — auditoria do PR #113 (09/11/2026)

## Status: NÃO homologado para produção

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
| Supabase real / duas sessões / RLS ao vivo | Bloqueado por permissão |
| Safari/iPhone e aparelho Android físico | Não executado; viewport móvel não substitui aparelho real |

O ciclo no navegador cobre: entrega, erro de conexão simulado, tentativa de fechar enquanto salva, reenvio com mesmo ID, inclusão fictícia de abastecimento, devolução, preservação dos dois odômetros, despesa única, permissão negada e dimensões do sheet. A persistência é simulada: não comprova entrega/realtime do servidor.

Imagens locais fora do repositório: `../artifacts/reserve-qa-20261109/sheet-1280.png` e `sheet-375.png`. Inspeção visual realizada. Teste de navegador depende da instalação local em `../central-audit-build-tools/node_modules/playwright` e Chrome (ou `CHROME_PATH`); não faz parte do workflow Linux.

As três falhas da suíte antiga são: exigência do antigo `wefrotas-backend.js` antes do Supabase, regex `expected_revision:revision` (implementação atual usa revisão da tentativa), e exigência de `setPending(true)` diretamente em `syncNow` (implementação atual usa journal/stageSnapshot). Não se alterou o backend para satisfazer regex legadas, nem se declarou essas verificações aprovadas.

## Falha do GitHub Actions

Run `42618738623`, job `129165096331`, commit auditado acima. Job sem steps e sem logs: anotação do check informa **“The job was not started because your account is locked due to a billing issue.”**
Não é falha de sintaxe nem de teste. Responsável pela conta precisa regularizar/verificar a cobrança; não foi alterada cobrança nem contratado plano. Após resolução, executar QA novamente. O aviso de migração ubuntu-latest não é a causa desse bloqueio.

## Supabase: identidade confirmada, acesso negado

`wefrotas/supabase-config.js` aponta para `wkssfugzghwifaddagfr.supabase.co`, projeto real esperado do WeFrotas.
O conector disponível listou somente GB+ (`layrxmkosyqurpobzmku`). Consulta somente leitura `select current_database(), now()` dirigida ao projeto correto foi negada por falta de permissão. Não foi usado GB+ como substituto, nem outra credencial para contornar a negativa.
É necessário conectar uma conta autorizada ao projeto correto para inspecionar a função transacional, dependências e RLS. Nenhuma alteração de banco foi feita.

## Bloqueios e riscos antes de qualquer publicação

1. **Concorrência entre veículos diferentes:** o merge atual detecta concorrência na mesma entidade, mas duas sessões podem editar titulares diferentes e atribuir o mesmo reserva/motorista em períodos sobrepostos. O teste diagnóstico reproduz isso usando o core real: `deltasOverlap` retorna falso, e a validação de negócio identifica o estado combinado inválido. Validação apenas no navegador não garante exclusividade.
   - Alternativa segura: revisar a RPC `wefrotas_apply_snapshot_delta` e todos os caminhos de escrita; validar a exclusividade da combinação final de substituições dentro da transação, sob o mesmo bloqueio/revisão da organização, com erro atômico e cópia local preservada. Não aplicar SQL sem examinar o projeto autorizado e testar em homologação.
2. **Confirmação e offline reais:** o bridge mantém alterações locais enquanto o journal tenta sincronizar. O erro é exibido como “não confirmada no servidor”. Não se deve interpretar o cartão local como confirmação remota. Testar perda de resposta, recarga, reconexão, recuperação e duas sessões reais antes da liberação.
3. **Histórico:** período é inclusivo por data, sem hora; duas substituições do mesmo recurso no mesmo dia são bloqueadas. Ausência de KM não deve virar estimativa automática. Ainda requer cenários de movimentações manuais e leituras de entregas anteriores sem abastecimento entre elas.
4. **Custos adicionais informativos:** não possuem vínculo próprio com uma despesa; operador pode informar novamente um valor já presente no combustível/outras despesas e inflar a análise do evento (não o Financeiro). Validar orientação/necessidade de vínculo explícito antes de aprovação final.
5. **Central:** revisão manual é intencional quando há substituição; validar o registro real recebido e confirmação física do carro, inclusive registros antigos, em homologação. Não se modificou a Central dos motoristas.
6. **Permissões/servidor:** autorização local não substitui a política real. RLS/multiempresa e gravação de JSONB precisam de teste com perfis de leitura/gestão no projeto correto.

## Próxima decisão necessária

Reconectar o projeto Supabase correto para leitura/revisão e disponibilizar homologação isolada para testes transacionais. Até resolver concorrência e completar esses testes, manter o PR draft e NÃO publicar. Autorização futura para merge/publicação deve ser expressa, após novas evidências.
