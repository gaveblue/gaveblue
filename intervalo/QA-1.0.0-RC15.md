# Intervalo — QA 1.0.0-rc.15 · Padronização visual integral dos módulos

**Data:** 15/11/2026  
**Repositório:** `gaveblue/gaveblue`, branch `main`  
**Escopo:** interface das áreas de operação e administração, preservando APIs e dados. Não contempla alterações funcionais em Equipe, Permissões, senhas provisórias, recuperação de acesso e provisionamento de funcionários.

## Implementação

| Tela | Aplicação | Limite deliberado |
|---|---|---|
| Gestão principal | Design rc11/rc12 preservado, recebe acabamento compartilhado onde aplicável | Não mexer em Equipe/Permissões |
| Mesas | Bottom Sheet rc14 preservado | Sem alteração da API |
| Cardápio administrativo | Cards mais compactos, categorias e adicionais em Bottom Sheets | Publicar/despublicar continua sendo ação direta |
| Estoque/Insumos | Novo insumo e movimentação em Bottom Sheets | Sem alterar receitas, movimentos ou estoque |
| Estoque/Produtos | Novo produto e edição por produto em Bottom Sheets; chave de disponibilidade preservada | Sem alterar preços ou flags no backend |
| Estoque/Fichas técnicas | Vínculo de ingredientes em Bottom Sheet | Sem alterar cálculo de baixa por rodada |
| Estoque/Histórico | Espaçamento e cartões uniformizados | Sem novos filtros de API |
| Caixa | Abrir/fechar sessão e registrar recebimento em Bottom Sheets | Pagamentos continuam apenas registros de confirmação externa |
| Cozinha | Tickets, botões e espaçamentos padronizados em branco/laranja | Sem alterar status de rodadas ou fila |
| Relatórios | KPIs reais apresentados em cards e indicação do alcance dos dados consultados | Sem inventar filtro por período ou dados que a API não fornece |
| Impressão | Cards operacionais compactos e botões uniformizados | Impressão continua manual, sem integração térmica automática |
| Meus restaurantes | Lista por cards responsivos e atalhos com hierarquia | Verificação de módulos/papéis preservada |
| Login | Formulário central e componentes visuais padronizados | CPF/e-mail, recuperação e sessões preservados |
| Minha Conta | Informações mantidas visíveis; formulário de CPF abre em Bottom Sheet | Mesma função `account-cpf`, requer senha |
| Super Admin | Novo restaurante em Bottom Sheet e cards operacionais padronizados | Não alterar funcionários, senhas, Master, autorizações ou permissões |
| Cardápio público | Identidade própria do consumidor preservada | Sem converter a vitrine em gestão |
| Equipe/Permissões | **Não alteradas** na Gestão; CSS do Super Admin limitado aos cards do restaurante | Fora do escopo por decisão do projeto |

### Componente reutilizável de Bottom Sheet

- Novo `operational-sheets-rc15.js` move o formulário existente para um `dialog`, preservando seu `onsubmit` e dados da chamada original.
- Botão contextual substitui formulário fixo, com alça de expansão/fechamento, foco inicial no botão Fechar, ajuste via `visualViewport`, cancelamento e clique fora.
- `noValidate=true` com validação JavaScript de restrições HTML (`required`, limites, tipos, padrão), eliminando os popups nativos das telas convertidas.
- Os erros de cadastro são mostrados dentro do sheet, sem perder valores; ao atualizar a tela, um observador único remove folhas antigas para evitar vazamento de DOM.
- Novo `visual-unified-rc15.css` concentra padrões branco/laranja, ícones e cards em vez de duplicar estilos em cada módulo.
- `index.html` ativa a folha comum, organiza a seleção de restaurantes e atualiza o cache dos scripts operacionais para `rc.15`. Mesas mantém seu arquivo rc.14; Gestão mantém seu módulo rc.12.

## Testes técnicos efetuados

| Cenário | Resultado | Evidência |
|---|---|---|
| Sintaxe JavaScript dos arquivos JS alterados e index HTML | PASSOU | Compilação com `new Function`, ignorando apenas sintaxe ESM |
| Importações de helper nos cinco módulos | PASSOU | Support, Catalog, Cash, Platform, Account |
| Preservação de handlers de submit | PASSOU na simulação DOM | Formulário é movido ao dialog, mas função `onsubmit` original continua executável |
| Modal, fechamento e foco correto | PASSOU na simulação DOM | `showModal`, foco no fechamento, `close` e descarte do diálogo |
| Campo obrigatório vazio | PASSOU na simulação DOM | Impede continuação, marca `aria-invalid`, mostra aviso de campo |
| Erro do servidor dentro do sheet | PASSOU na simulação DOM | `showFormSheetError` escreve a mensagem do erro no mesmo modal |
| Sem chamadas novas ou migração SQL | PASSOU por inspeção | Ações originais do backend permanecem em cada módulo |
| Cadastro de produtos e edição | PASSOU por inspeção | Modais são criados por ID, mantendo `data-edit-product` para atualização |
| Caixa | PASSOU por inspeção | `cash_open`, `cash_close` e `pay_manual` mantidos |
| Mesas rc14 | PASSOU por inspeção | `openTableSheet` mantido |
| Equipe e permissões | PASSOU por inspeção | Rotinas `create_staff_with_password` e `set_access` seguem existentes |
| CSS para cartões de funcionários no Super Admin | ISOLADO | Regras novas atuam apenas em cards de restaurante, não nos cards internos de funcionários |
| Abertura real em Android/PWA e desktop | PENDENTE | Não houve navegador autenticado com interação |
| Validação real dos formulários com Supabase | PENDENTE | Não gravamos dados reais durante os testes |
| Propagação no domínio | NÃO CONFIRMADA | Commit na `main` não prova deploy do site |
| Impressão térmica, senha e permissões | FORA DO ESCOPO | Sem alterações nesses processos |

## Roteiro manual de homologação

1. Acesse `/intervalo/inicio` e confira os cartões e os links de restaurantes habilitados.
2. Acesse `/novo-mundo/catalogo`, abra **Nova categoria** e **Novo adicional** no Bottom Sheet; valide preenchimento e confirmação.
3. Em `/novo-mundo/estoque`, passe pelas abas **Insumos**, **Produtos**, **Fichas técnicas** e **Movimentações**; abra, cancele e salve cadastros de teste.
4. Na edição de produtos, teste salvar nome/preço e acionar as chaves de disponibilidade. Confira que nada foi duplicado.
5. No Caixa, abra a folha de sessão e a folha de recebimento com comanda realmente servida. **Não registrar recebimentos fictícios em caixa real.**
6. Confira Cozinha, Relatórios e Impressão em celular e computador.
7. Acesse Minha Conta, abra a vinculação de CPF, confira texto e teclado sem executar alterações se não quiser.
8. No Super Admin, abra a ação **Novo restaurante**; não altere funcionários nem permissões.
9. Teste internet lenta, teclado aberto, erro de rede, fechar e reabrir folhas e rolagem em tela estreita.
10. Confirme carregamento da versão rc.15 no PWA instalado e ausência de arquivos antigos em cache.

## Publicação / rollback

Código enviado à `main` do GitHub; **publicação no host não confirmada**. GitHub Actions não foi utilizado. Para rollback visual, restaurar o `index.html` e scripts de interface alterados à rc.14; os novos arquivos CSS/JS podem ficar inativos. Sem rollback de dados ou de migrações SQL.

**Conclusão:** implementação ampla concluída no código e QA técnico parcial. Homologação final requer testes reais por tela e verificação de disponibilidade pública.
