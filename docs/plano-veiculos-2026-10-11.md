# Evolução da tela de Veículos — checklist de implementação

Status atualizado em 12/10/2026: ficha integrada e atalhos de origem publicados (99c4686 e 2b33b07); fotos otimizadas no WeFrotas (2368883). Lista ampliada implementada e testada, aguardando confirmação do deploy. Os valores e nomes das imagens são exemplos, não dados a importar. Central e Documentos fora do escopo.

## Base confirmada

- Lista, seleção, pesquisa, filtros de cadastro ativo/seguro e ordenação existem.
- Cadastro contém placa, frota, modelo, ano, cor, chassi, seguro, foto, vínculo de motorista e flag de locação.
- Abastecimentos, despesas, OS e motoristas já são sincronizados por empresa.
- Relatórios por veículo já oferecem despesas detalhadas e indicadores com ressalvas de qualidade dos dados.
- Não foi encontrada uma entidade dedicada para documentos de veículos, notas com autoria/anexos ou leituras manuais de hodômetro no modelo operacional atual.

## Entrega 1 — lista e ficha integrada, sem novo histórico

- [ ] Preservar seleção, editar, adicionar, inativar, permissões e pesquisa existentes.
- [x] Acrescentar foto e ação Visualizar na lista, com paginação e estados vazios. Olho na barra superior e duplo clique substituem o link por linha.
- [x] Abrir ficha dentro do módulo, mantendo cabeçalho, sessão e retorno à lista com filtros preservados.
- [ ] Cabeçalho com foto, placa, modelo, frota, cadastro ativo e próprio/locado.
- [x] Indicadores calculados a partir da mesma base dos relatórios, com período/base explicitados. Lista também inclui consumo estimado e custo/km.
- [x] Abas Visão geral, Abastecimentos, Manutenções/OS, Custos e Histórico de KM.
- [x] Reutilizar calendário de período e ações existentes; evitar segundo fluxo de gravação.
- [ ] Abastecimentos: data, KM, litros, valor, preço/L, fornecedor e motorista quando informados.
- [ ] Manutenções: distinguir OS aberta/fechada de manutenção efetivamente realizada. Não tratar toda despesa como manutenção.
- [ ] Custos: detalhamento com agrupamentos sem duplicidade e rastreabilidade até a origem.
- [ ] Histórico de KM inicialmente somente leitura, com origem e alertas de regressão. Não confundir maior KM com leitura mais recente.
- [ ] Gráficos mensais derivados das mesmas séries; lacuna é lacuna, não zero.
- [x] Exportação XLSX da lista respeitando veículos filtrados, período, colunas visíveis e acesso de leitura. Inclui aba de critérios; não exporta as fotos ou URLs privadas. Exportação das abas internas da ficha continua pendente.
- [x] Colunas selecionáveis na sessão; paginação de 10/25/50; seleção em lote limitada à página, limpa ao mudar página/filtro.

## Entrega 2 — ampliar cadastro sem inventar valores

- [ ] Marca, tipo de veículo, unidade, centro de custo e RENAVAM como campos opcionais explícitos.
- [ ] Filtros por marca/tipo/unidade apenas com valores cadastrados, incluindo Não informado.
- [ ] Separar cadastro ativo/inativo da situação operacional (em uso, manutenção etc.).
- [ ] Não inferir marca ou condição operacional por texto livre, nem classificar cadastros antigos como próprios automaticamente.
- [ ] Testar ida e volta dos campos novos pelo Supabase, edição em outra sessão e exportação/importação.

## Documentos — suspenso por decisão do usuário

Não implementar tela, tabelas, anexos ou uploads de documentos nesta entrega. Preservar somente o vencimento de seguro que já existe. Os itens documentais abaixo ficam como referência futura, sem autorização de execução.

## Entrega 3 — observações e KM manual (documentos adiados)

- [ ] Definir entidades por empresa + veículo; ID estável, data, autor e auditoria no servidor.
- [ ] Documentos: tipo, descrição, número, emissão, vencimento, anexo privado e regras de acesso.
- [ ] Situações derivadas de datas: em dia, a vencer, vencido e sem vencimento informado. Definir janela de alerta visível.
- [ ] Preservar vencimento de seguro já existente; não gerar documentos históricos fictícios.
- [ ] Observações: tipo, texto, autoria real, anexos e histórico de alterações; não presumir que motorista é autor.
- [ ] KM manual: validação anterior/posterior por veículo, data/hora, motivo e trilha de correção. Prever troca de hodômetro explicitamente.
- [ ] Migração aditiva, RLS por empresa, anexos privados e teste de concorrência. Não ampliar permissão de consulta para edição.

## Critérios obrigatórios de aceite por entrega

- [ ] Isolamento: usuário de outra empresa não lê ficha nem anexos.
- [ ] Persistência: atualizar página e consultar em segunda sessão sem perder ou duplicar dados.
- [ ] Cálculos: custo detalhado concilia com agrupamentos/OS; consumo não é média simples dos índices; primeiro abastecimento não inventa consumo.
- [ ] Datas: mesmo veículo/período em cards, tabelas, gráficos e exportações.
- [ ] KM inválido/regressivo impede indicador confiável e exibe referência para revisão.
- [ ] Estado vazio, veículo inativo/locado, foto ausente e histórico incompleto são tratados.
- [ ] Responsividade, teclado, foco, contraste, rolagem e menus em telas pequenas.
- [ ] Desempenho com histórico extenso: paginação, agregação reutilizada e imagens leves.
- [ ] Testes de regressão de sessão, OS em lote, financeiro e Central.
- [ ] Revisar prévia antes da publicação; registrar release e caminho de reversão do código, sem restaurar banco por cima de dados recentes.

## Limites dos indicadores

## Registro histórico — prévia local de 11/10/2026 (superado pelas publicações acima)

- Ficha com seis abas implementada localmente, sem Documentos ou uploads.
- Servidor restrito a 127.0.0.1:4317 e quatro arquivos públicos explicitamente permitidos. Nenhum acesso a backend ou dados de clientes.
- Lista demonstrativa separada da lista operacional; não representa conclusão da reformulação completa da lista existente.
- Testes: 25 testes de regras/cálculos existentes passaram; navegação nas seis abas, período, agrupamentos, regressão de KM, estado vazio e ausência de overflow global verificados em 1280 e 375 px.
- Edição bloqueada na demonstração. Observações apenas dos lançamentos existentes. Exportação, campos novos e validação de integração na sessão real ainda pendentes.
- Sem publicação. Aguardar avaliação visual do usuário.

Custo médio por KM exige base de custo e distância claramente declarada. Consumo é estimado enquanto não houver marcação confiável de tanque cheio. Percentuais versus período anterior só aparecem com períodos equivalentes e denominador válido. Última manutenção deve usar data de realização quando disponível, não apenas abertura de OS. Nenhum valor ilustrativo das imagens será copiado.
