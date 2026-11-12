# Intervalo — QA visual e funcional: 1.0.0 RC.1

Data: 12/11/2026 · Repositório `gaveblue/gaveblue` (`main`) · Projeto Supabase `fynaaiazebydorzllwip`.

**Estado:** implementação visual e homologação técnica de código/simulações **aprovadas para piloto**. **Versão 1.0.0 final não homologada.** Não há prova de publicação viva do domínio, instalação Android/iOS ou sessão real com os perfis.

## Escopo da mudança

- Design System local em `design-system.css` com tokens laranja/branco/carvão, estados, espaçamentos, componentes e media queries.
- Ícones locais em `ui-icons.js`, sem emojis em interfaces e sem dependência externa de fontes de ícones.
- Super Admin em layout lateral com KPIs reais, busca, agrupamento por restaurante, funções administrativas recolhíveis.
- Master com sidebar, resumo real quando as APIs estão acessíveis, atalhos e tabs Dados, Equipe, Permissões.
- KDS em três colunas por estado: `submitted`, `preparing`, `ready`; botões de avanço reais e impressão manual.
- Caixa com fila, detalhe da comanda selecionada e recebimento manual; mantém os métodos externos e sessão.
- Garçom com painel de mesas/cardápio/comanda e acesso direto à comanda no celular; SVG no lugar de emojis e fotos ausentes.
- Cardápio Digital e Gestão de Produtos com ícones SVG, fotos HTTPS, filtros e publicação conforme controle existente.
- Estoque, Mesas, Relatórios e Minha Conta com cabeçalhos, botões e navegação padronizados.
- Logo e cor de instalação do PWA alinhados ao laranja.

## Evidências executadas

| Teste | Resultado | Observação |
|---|---|---|
| Sintaxe JS de `index.html` e 10 módulos `.js` | PASSOU | Compilação estática de funções com import/export neutralizados |
| Emojis nos principais arquivos JS/HTML | PASSOU | Zero ocorrências no intervalo Unicode U+1F300–U+1FAFF |
| Super Admin: renderização com restaurante/usuário/módulos simulados | PASSOU | Sidebar, KPIs e lista de restaurantes presentes |
| Master: renderização com dados reais de contrato simulados | PASSOU | Sidebar, KPIs, pedidos e estoque em alerta presentes |
| Cozinha: renderização com `orders` e `order_progress` | PASSOU | Três colunas, ícones e botão de operação no HTML |
| Caixa: renderização com sessão aberta, comanda e pagamento | PASSOU | Três painéis, formulário e botões de impressão presentes |
| Garçom: renderização com mesa, cardápio e comanda | PASSOU | Atalho da comanda mobile, três áreas, SVG local |
| Cardápio público: renderização e filtro | PASSOU | Busca, categoria, SVG alternativo para foto |
| Gestão do cardápio: renderização | PASSOU | Cadastro de fotos HTTPS e QR existente |
| Estoque e suporte: renderização | PASSOU | Cabeçalho padronizado e ações existentes |
| Novas migrations/schema | NÃO NECESSÁRIO | Redesign não altera regras de banco |
| Edge Functions do pedido/cadastro | NÃO ALTERADAS | Mantidas as regras existentes |
| Teste real em navegador no domínio | **NÃO VERIFICADO** | A consulta externa ao domínio falhou neste ambiente |
| Testes com Master, Super Admin, Garçom, Cozinha, Caixa em contas reais | **NÃO EXECUTADOS** | Exige ambiente publicado e credenciais autorizadas |
| Testes físicos Android/iOS | **NÃO EXECUTADOS** | Exige os aparelhos e a instalação real do PWA |
| Acessibilidade com leitor de tela e teclado em browser | **NÃO EXECUTADOS** | Revisar foco, navegação e contraste no browser |
| Fluxo de caixa completo, estoque, pedidos e permissão multi-restaurante | **E2E PENDENTE** | Devem ser validados antes da 1.0.0 final |

## Regras não alteradas

1. Sem fiscal, sem entrega de e-mails e sem impressão automática/hardware. Impressão manual pelo navegador/PDF.
2. Pix e cartão continuam **registros de pagamentos externos já recebidos**; nenhuma cobrança/banco é integrado.
3. Sem pedidos offline; módulo Garçom exige rede.
4. Permissões, senhas provisórias, isolamento por restaurante, caixa e estoque mantêm autoridade no backend, não no CSS/HTML.
5. Dados de exemplos usados apenas em simulação, sem escrita em tabelas reais.

## Gate de aprovação da 1.0.0

- [ ] Confirmar carregamento do CSS e `ui-icons.js` no domínio em Chrome Android e navegador desktop.
- [ ] Conferir responsividade da navegação lateral e abas em larguras 360, 390, 768 e 1366 px.
- [ ] Super Admin: pesquisar restaurante, expandir equipe, cadastrar usuário manual e redefinir senha.
- [ ] Master: indicadores corretos, navegação em todos os módulos, editar dados e equipe.
- [ ] Garçom: abrir mesa, adicionar produto, observação, consultar comanda e enviar à cozinha.
- [ ] KDS: pedido aparece em Novos, Iniciar preparo, Marcar pronto; sem pedidos cruzados.
- [ ] Caixa: abrir sessão, registrar recebimento parcial já confirmado externamente, quitar e fechar caixa.
- [ ] Impressão manual pela prévia da comanda e do pedido.
- [ ] Estoque: ficha técnica, falta de saldo, entrada, perda e baixa automática; conferir idempotência.
- [ ] Cardápio público: publicado/oculto, foto válida/ausente, QR somente de consulta.
- [ ] Dois restaurantes com perfis diferentes; tentativas de acesso indevido bloqueadas.
- [ ] Sem erros críticos no console, rollback manual possível; verificação em celular.
- [ ] Aprovação visual e funcional do proprietário com evidências.

**Resultado:** `1.0.0-rc.1` enviada à `main` para avaliação visual e piloto. A versão comercial `1.0.0` permanece pendente.

