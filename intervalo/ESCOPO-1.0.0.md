# Intervalo — escopo acordado para a 1.0.0

Data da decisão: 12/11/2026  
Produto: Intervalo, `https://gaveblue.com.br/intervalo/`  
Estado: **escopo definido; versão 1.0.0 ainda NÃO homologada**

## O que fica no lançamento 1.0.0

- Plataforma multi-restaurante: cadastro, suspensão, módulos, Super Admin e Master.
- Login, papéis, permissões e criação de novos funcionários com senha provisória definida manualmente pelo Master ou Super Admin, com troca obrigatória no primeiro acesso.
- Cadastros e operação de restaurante, cardápio, mesas e comandas.
- Garçom, cozinha, baixa de estoque por ficha técnica, entradas/perdas/ajustes e alertas de estoque.
- Caixa: abertura, registros **manuais** de recebimentos já efetuados, pagamentos parciais e fechamento com conferência.
- Impressão **manual**: tela de cozinha -> pedido -> prévia -> comando Imprimir / Salvar PDF do navegador; tela do caixa -> comanda -> prévia -> impressão do navegador/PDF.
- Relatórios gerenciais de operação, com as limitações claramente identificadas.

## Formalmente adiados para versões posteriores

1. **Fiscal:** não emitir NF-e, NFC-e, NFS-e, cupom fiscal ou arquivos fiscais pelo Intervalo 1.0.0. Comanda é documento interno **não fiscal**. Obrigações fiscais existentes seguem responsabilidade do estabelecimento, fora da plataforma.
2. **Envio de e-mails:** sem SMTP transacional, confirmação, convites por e-mail, redefinição por link e notificações por e-mail. Cadastro e acesso por senha provisória administrada. A recuperação da conta **do próprio Super Admin** requer os procedimentos seguros do titular pelo Supabase, não há redefinição por outra conta no aplicativo.
3. **Impressora térmica:** sem integração com B&G BG-06, USB/Bluetooth, agente Windows, fila automática, prova de impressão física ou testes com hardware. Não cadastrar ou habilitar dispositivos no fluxo principal; estruturas existentes ficam inativas para evolução futura.

## Limites e cuidados obrigatórios

- O acesso provisionado administrativamente permite login por e-mail e senha sem recebimento de mensagem, mas isso **não comprova posse do e-mail**. O responsável precisa conferir a identidade e entregar a senha por canal reservado.
- Senhas provisórias nunca devem constar em logs, relatórios, mensagens públicas ou textos persistidos em claro.
- A aplicação não realiza cobrança Pix ou cartão no estado atual: métodos aparecem apenas como recebimentos externos já confirmados pelo estabelecimento. Integração com adquirente, banco ou PSP é projeto separado; **não anunciar cobrança automática como pronta**.
- Na ausência de internet, o funcionamento offline não deve ser presumido. Prévia de impressão requer navegador compatível e permissão de abertura da janela.
- O serviço de autenticação do Supabase poderá, dependendo das configurações de projeto, emitir notificações de segurança próprias; esta decisão remove os fluxos de envio pelo Intervalo, não é uma garantia de ausência total de e-mails da plataforma externa.

## Critérios de homologação 1.0.0 (dentro deste escopo)

- Login real: Super Admin, Master, gerente, garçom, cozinha e caixa; troca de senha provisória e recuperação operacional do funcionário por administrador.
- Criar dois restaurantes, conferir isolamento de produtos, mesas, funcionários, pagamentos e estoque.
- Criar e editar cardápio; abrir mesa, lançar item, enviar à cozinha, iniciar preparo, finalizar, servir, registrar pagamento parcial/total e fechar caixa.
- Verificar concorrência de comandas por mesa e bloqueio de pagamento maior que o saldo.
- Configurar ficha técnica, confirmar baixa atômica e impeditivo por falta de insumo; testar entradas/perdas.
- Visualizar e imprimir manualmente (ou salvar PDF) comanda do caixa e pedido da cozinha **sem equipamento térmico**.
- Verificar permissões, não exposição de segredos, RLS, erros de conexão e navegação por URL direta, desktop e celular.
- Verificar presença da versão publicada em `gaveblue.com.br`, testes E2E no navegador e rollback manual; não utilizar GitHub Actions.
- Relatórios claramente classificados como gerenciais e recibos/comandas como não fiscais.

## Não são critérios de bloqueio para 1.0.0

- Entrega de e-mails por SMTP, impressão física em B&G BG-06, emissão fiscal ou integração de filas de impressão automática.

## Estado técnico atual

- 0.9.6: interface de Impressão manual, recuperação de senha sem SMTP, painel de equipe com vínculo existente sem envio de convite, servidor `restaurant-team` impede convite por e-mail para novos endereços.
- A homologação real, funcional e de produção do escopo escolhido segue pendente; **não renomear 0.9.6 para 1.0.0 sem testes**.
