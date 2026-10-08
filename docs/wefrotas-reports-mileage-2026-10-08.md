# Login, calendários e revisão de KM — 08/10/2026

- Mensagens conhecidas de autenticação traduzidas, erro desconhecido não vaza texto técnico em inglês. Removida pausa artificial de 380 ms após sincronização; autenticação, licença, isolamento e confirmação remota continuam obrigatórios.
- Relatórios com superfícies simples no padrão dos módulos operacionais, calendário de período compartilhado com Financeiro e digitação dd/mm/aaaa. Calendários individuais também aceitam digitação; botão não cobre mais o campo inteiro. Datas impossíveis e período invertido são rejeitados.
- Validação no lançamento manual, na persistência do formulário e na aprovação direta da Central. Verifica KM inteiro não negativo, limites antes/depois da data, exclui o próprio registro na edição e separa veículos.
- Auditoria somente leitura mostra placa, referência, KM lançado e registro anterior de referência. Inclui registros filhos de agrupamento e referências anteriores ao filtro. Sem horário, não presume a sequência intradiária. KM final menor que inicial e dados ausentes são apontados.
- Nenhum registro histórico é corrigido automaticamente. É necessário confrontar os comprovantes para decidir qual dos registros está errado. A validação da interface não substitui uma restrição transacional contra gravações concorrentes por outras versões/clientes.

## Verificação

62 testes direcionados passaram (autenticação, datas, quilometragem, relatórios, custos, vencimentos e filtros). Teste de navegador isolado passou em 375 e 1280 px, incluindo digitação, ano bissexto, rejeição de data impossível, Enter e aplicação do calendário real dos relatórios.

A suíte geral de migração contém duas asserções estáticas preexistentes incompatíveis com a implementação atual de sincronização (esperam padrões antigos de delta e setPending). Os arquivos de backend e dessa suíte não foram modificados nesta entrega; não é alegado que a suíte global esteja aprovada.

Validação com dados reais depende da sessão e do histórico disponível. A recuperação do legado Appwrite não faz parte desta mudança.
