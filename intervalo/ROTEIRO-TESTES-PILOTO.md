# Intervalo — Roteiro de testes do restaurante piloto

**Objetivo:** testar a estrutura existente sem confundir recursos ainda simulados com operações reais.

## Acesso
1. Abra https://gaveblue.com.br/intervalo/login e entre com a conta Master do restaurante Intervalo 27.
2. Se aparecer convite pendente, conclua o primeiro login com senha. O vínculo Master deve passar para ativo. Se o convite expirar, será preciso renová-lo via administração.
3. Escolha Intervalo 27 nos seus restaurantes. O Super Admin da Gaveblue administra módulos em https://gaveblue.com.br/intervalo/admin, mas não substitui a conta Master nas operações.

## Cadastros
4. Acesse /intervalo/intervalo27/gestao, preencha telefone, cidade, UF e conclua o cadastro. Crie novos funcionários usando o formulário de senha provisória (sem e-mail). Para contas já existentes, use Vincular conta existente; o sistema não envia convite por e-mail.
5. Acesse /intervalo/intervalo27/catalogo, crie uma categoria e dois produtos de teste. Use preços fictícios.
6. Abra /intervalo/intervalo27/cardapio antes de publicar: deve estar indisponível. Publique pelo catálogo; depois teste a visualização pública. Não tente fazer pedido de cliente — consulta somente.
7. Acesse /intervalo/intervalo27/mesas e cadastre Mesa 1 e Mesa 2.

## Ciclo de comanda
8. Acesse /intervalo/intervalo27/garcom. Abra Mesa 1, adicione itens e envie.
9. Acesse /intervalo/intervalo27/cozinha. A fila atualiza periodicamente; inicie o preparo, marque como pronto e confira a opção **Imprimir pedido (manual)**, que abre uma prévia no navegador. Escolha imprimir ou salvar PDF, sem impressora térmica.
10. Volte para Garçom, marque a comanda como servida.
11. Acesse /intervalo/intervalo27/caixa. Abra sessão, use **Visualizar / imprimir comanda** (prévia manual ou salvar PDF), registre recebimento parcial já confirmado fora do Intervalo, quite a comanda e feche o caixa com valor contado.
12. Teste proteção: não abra outra comanda ativa na mesma mesa; não aceite pagamento maior que o restante.

## Prévia dos demais módulos
13. Acesse /intervalo/intervalo27/estoque, cadastre um insumo e configure a ficha técnica do produto. Envie um pedido e confirme a baixa automática. Refaça com saldo insuficiente e confirme que a comanda não é enviada e o estoque permanece intacto.
14. Acesse /intervalo/intervalo27/impressao e confirme que a área oferece somente instruções e atalhos para **impressão manual** pela Cozinha ou Caixa. Não cadastre impressora, não instale o agente Windows e não faça testes com a BG-06 nesta fase.
15. Confira /intervalo/intervalo27/relatorios com dados registrados manualmente. Não utilize os números como relatório fiscal. Não há emissão fiscal, SMTP nem impressão automática na 1.0.0.

## Segurança e múltiplas empresas
16. Com um usuário sem vínculo no restaurante, tente navegar para /intervalo/intervalo27/gestao; deve negar.
17. Crie segundo restaurante de teste por Super Admin, configure outro Master e valide que comandas, pagamentos e produtos de um não aparecem no outro.
18. Teste login por CPF somente após cadastro voluntário em Minha Conta; teste a reversão para login por e-mail.

**Ao relatar um problema:** informe URL, módulo, ação, expectativa, resultado e eventual mensagem. Nunca envie senha, CPF completo, token ou dados de cartão.
