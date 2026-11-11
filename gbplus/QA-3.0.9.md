# GB+ 3.0.9 — QA: pendentes, grade e origem da importação

Data: 10/11/2026. Mudanças solicitadas após teste real bem-sucedido da importação Sankhya 3.0.8.

## Critérios
- Somente pendentes: filtrar registros sem Data Baixa confirmada ou com data futura; selecionar exclusivamente movimentos **novos**, não baixados, não bloqueados, não importados anteriormente.
- Selecionar baixados e novos: substituem seleção anterior e alternam o filtro da grade para não haver registros ocultos indevidamente marcados.
- As linhas podem ser filtradas por Todos / Pendentes / Baixados / Novos / Conflitos / Já importados; o índice persistido de seleção precisa ser o mesmo índice da planilha mesmo após filtrar ou paginar.
- Categorias: usar Outras receitas / Outras despesas já existentes como padrões; se ausentes, exigir seleção manual. Não misturar origem e categoria.
- Origem: mostrar Via importação em títulos novos ou importados na 3.0.8 (via importKey) nas telas de lançamentos, tabela e detalhes.
- Parceiros: mostrar grade de 75 linhas, nome, código, documento, classificações, situação, ações de histórico/edição; pesquisa e paginação sem perder o foco.
- Movimentação: mesma chave Empresa+Nro Único; notas repetidas com parcelas não são deduplicadas; títulos repetidos não são criados de novo.
- Dados existentes: atualização apenas de UI e novos metadados em novos registros. Não executar migração/destruição.

## Evidências e pendências
- [x] Checagens de sintaxe dos módulos alterados e integridade do CSS.
- [x] Testes sintéticos com pendentes, liquidados e baixa futura: apenas movimentos novos pendentes foram selecionados.
- [x] Categorias Outras receitas/despesas pré-selecionadas em banco de teste.
- [x] Grade de 160 parceiros fictícios: 75 linhas na primeira página, terceira página disponível, pesquisa/código preservados.
- [x] Etiqueta de importação por metadado e fallback para importações antigas.
- [ ] Testes manuais completos no Chrome/Edge desktop com planilha Sankhya integral.
- [ ] Conferir seleção após paginar/filtrar em lotes de 2.000+ títulos.
- [ ] Conferir importação de apenas pendentes, reimportação, baixa posterior e saldos em conta de homologação.
- [ ] Conferir dados em grade no desktop e celular (overflow lateral).
- [ ] Confirmar workflow de CI no runner, merge e GitHub Pages.

Status: QA de código e testes sintéticos; homologação visual/contábil completa pendente.
