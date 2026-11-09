# WeFrotas — OS guiada para sinistro, pane e carro reserva

Data: 09/11/2026
Escopo: `wefrotas/` no monorepo `gaveblue/gaveblue`.
Persistência: **mesmas tabelas e RPC de snapshot do WeFrotas; nenhuma migração nova necessária**. A proteção SQL contra substituições simultâneas já está instalada em produção desde o módulo anterior.

## Novo fluxo

1. Abra **Ordens de Serviço > Nova OS**. O formulário possui **3 etapas**: Dados da OS, Ocorrência e Conferência.
2. Tipos existentes permanecem: Avulsa, Revisão, Sinistro e Mensal. Novo tipo: **Manutenção corretiva / pane**.
3. Sinistro: informe se é avaria leve, aguardando avaliação ou **perda total confirmada**. Informe seguradora, protocolo e referência de BO quando relevantes (campos opcionais).
4. Informe se o veículo vai ficar parado. Para perda total confirmada, o veículo fica imobilizado, e o retorno automático é proibido. Sinistro sem imobilização permite continuar operando normalmente.
5. Se indisponível, informe se haverá carro reserva. Pode escolher **Não / definir depois** (OS salva como reserva pendente).
6. Escolha origem do reserva: frota própria, locadora, oficina/concessionária ou seguradora. Na frota própria, selecione veículo já cadastrado; para terceiro, selecione existente ou use **+ Cadastrar novo**. O cadastro rápido é um **Bottom Sheet** e não grava dados antes da OS.
7. Informe data e KM de entrega do **reserva**. OS e atualização operacional do veículo titular, cadastro rápido (quando houver) e registro da substituição são enviados **na mesma gravação**.
8. Em **Veículos** use os filtros **Todos / Frota / Temporários / Parados / Reservas em uso**. A ficha do veículo preserva o histórico e mostra o número da OS vinculada.
9. Ao encerrar uma OS criada nesse fluxo que teve o titular parado, informe se o titular voltou a operar e, se houver reserva ainda em uso, se o reserva foi devolvido. A devolução exige data e KM final, com validação dos abastecimentos. O titular só volta para status disponível mediante resposta afirmativa e nunca automaticamente em PT. Veículos temporários de terceiros devolvidos ficam inativos, mas todo o histórico é preservado.

## Integridade

- Nunca redirecionar KM ou abastecimento para a placa do titular.
- Lançamentos reais do reserva continuam vinculados ao `vehicleId` do reserva. A OS armazena `operationalIncident`; a substituição usa `orderId` e `orderNumber`. Os custos adicionais continuam informativos, sem duplicar pagamentos.
- O fluxo rejeita veículo/motorista inexistentes, datas/quilometragem inválidas, troca da identidade de OS com histórico, reserva já ocupada e a abertura de uma ocorrência indisponível já como fechada.
- A gravação preserva IDs de rascunho quando a resposta do servidor falha, de modo que reenvios não criem a mesma OS novamente.
- A tela só mostra confirmação de salvamento com retorno positivo `supabase-saved`, `supabase-verified` ou `supabase-rebased`.
- OS antigas sem `operationalIncident` não sofrem reclassificação silenciosa ao serem editadas.
- A Central de Registros e o fluxo de abastecimentos anteriores não foram alterados.

## Evidências e limitações

- 15/15 casos de comportamento do novo assistente `tests/wefrotas-os-guided.test.cjs` executados em ambiente JavaScript isolado.
- 21/21 regressões do módulo `tests/wefrotas-substitutions.test.cjs` executadas em ambiente JavaScript isolado.
- Verificação sintática dos arquivos JS e validação estrutural dos arquivos HTML/CSS.
- Proteção Supabase anterior permanece ativa (3 gatilhos, 15 cenários transacionais SQL previamente homologados).
- **Ainda requer teste manual do usuário autenticado no site**, incluindo seleção de reserva, abastecimento, encerramento/devolução e teste concorrente com duas sessões. Isso não deve ser confundido com uma homologação integrada automatizada.
- O GitHub Actions continua excluído por indisponibilidade de cobrança; não depender de seu resultado para homologação.
- Publicação só via merge controlado do PR, preservando GB+ e os demais módulos.
