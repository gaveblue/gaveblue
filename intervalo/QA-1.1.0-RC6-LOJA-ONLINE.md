# Intervalo 1.1.0-rc.6 — QA da Loja Online

**Data:** 16/11/2026
**Repositório:** `gaveblue/gaveblue` · branch `main`
**Escopo:** apenas tela administrativa `/intervalo/:slug/vendas-online` e carregamento inicial desta rota.
**Estado:** **homologação técnica parcial**. Frontend commitado; carregamento pelo domínio e experiência real em celular/PWA não validados.

## Alterações

- Layout da Loja Online reestruturado em quatro áreas: Minha vitrine; Operação e entregas; Recebimento online; Pedidos recebidos.
- Três indicadores compactos (cardápio, busca, pedidos), com valores calculados das configurações retornadas pelo backend, sem rótulos fixos de "desativado".
- Formulários originais `iv-online-draft`, `iv-on-hours`, `iv-on-zone-form` preservados com os mesmos handlers/API, em bottom sheets já utilizados no Intervalo, agora abertos por botões claros da tela.
- Loading estruturado por skeletons da página, sem `iv-loading-inline` antigo; carregamento inicial da rota substitui a abertura genérica do app por skeleton da Loja Online.
- Ao salvar configurações, a tela mantém a estrutura durante a atualização, em vez de remontar o indicador de carregamento antigo.
- Estado vazio e atualização de Pedidos recebidos padronizados, com comando de recarregar.
- CSS responsivo com separação de colunas no desktop e cards empilhados no celular, sem usar emojis e com ícones internos.
- Versionamento de import e CSS alterado para `1.1.0-rc.6` no HTML, evitando carregar código antigo por cache após implantação.

## Evidências

| Verificação | Resultado |
|---|---|
| Sintaxe JavaScript do módulo novo | PASSOU em compilação estática |
| Scripts inline e módulo do `index.html` | PASSOU em compilação sintática |
| Renderização simulada com loja sem pedidos | PASSOU: indicadores e ações esperadas |
| Renderização simulada com loja ativa | PASSOU: status ativo, faixas e região |
| Inicialização de listeners para vitrine/horários/região | PASSOU em DOM simulado |
| Eventos dos botões de visibilidade, ativação e pedidos | PASSOU em DOM simulado (handlers instalados, não executados com dados reais) |
| Pedidos vazios | PASSOU em simulação |
| Carregamento sem spinner legado no módulo | PASSOU em simulação |
| Preservação de chamadas `marketplace-management`/`marketplace-operations` | PASSOU por inspeção |
| HTTP/deploy real no domínio | **NÃO VERIFICADO:** acesso externo indisponível |
| Testes em Android, PWA e navegador autenticado | **PENDENTES** |
| Salvar configurações e transição de pedidos com dados reais | **PENDENTES** |

**Não afirmar homologação comercial.** Nenhuma loja foi ativada ou desativada no backend por esta alteração; as permissões e regras comerciais continuam sendo verificadas no servidor. Gestão, equipe, estoque e comandas não foram alterados.

## Validação manual no site

1. Abrir `https://gaveblue.com.br/intervalo/novo-mundo/vendas-online` como Master/Gerente autorizado.
2. Confirmar skeleton de Loja Online já na abertura, sem o loader inicial genérico.
3. Conferir indicadores reais de cardápio, marketplace e recebimento.
4. Abrir Configurar vitrine, Configurar horários e Nova/Editar região; validar bottom sheets e salvamento.
5. Usar o botão "Ver loja" e conferir visibilidade da vitrine.
6. Ver estado vazio/atualização de pedidos sem mensagem antiga.
7. Validar mobile, teclado e botão voltar; comparar cache instalado e acesso em aba anônima.
