# Intervalo — Roteiro de testes do restaurante piloto

**Objetivo:** testar a estrutura existente sem confundir recursos ainda simulados com operações reais.

## Acesso
1. Abra https://gaveblue.com.br/intervalo/login e entre com a conta Master do restaurante Intervalo 27.
2. Se aparecer convite pendente, conclua o primeiro login com senha. O vínculo Master deve passar para ativo. Se o convite expirar, será preciso renová-lo via administração.
3. Escolha Intervalo 27 nos seus restaurantes. O Super Admin da Gaveblue administra módulos em https://gaveblue.com.br/intervalo/admin, mas não substitui a conta Master nas operações.

## Cadastros
4. Acesse /intervalo/intervalo27/gestao, preencha telefone, cidade, UF e conclua cadastro. Convide funcionários somente depois de validar e-mail.
5. Acesse /intervalo/intervalo27/catalogo, crie uma categoria e dois produtos de teste. Use preços fictícios.
6. Abra /intervalo/intervalo27/cardapio antes de publicar: deve estar indisponível. Publique pelo catálogo; depois teste a visualização pública. Não tente fazer pedido de cliente — consulta somente.
7. Acesse /intervalo/intervalo27/mesas e cadastre Mesa 1 e Mesa 2.

## Ciclo de comanda
8. Acesse /intervalo/intervalo27/garcom. Abra Mesa 1, adicione itens e envie.
9. Acesse /intervalo/intervalo27/cozinha, clique Atualizar, iniciar preparo, marcar como pronto.
10. Volte para Garçom, marque a comanda como servida.
11. Acesse /intervalo/intervalo27/caixa. Abra sessão, registre um recebimento parcial já confirmado fora do Intervalo, depois quite a comanda. Feche o caixa com o valor contado.
12. Teste proteção: não abra outra comanda ativa na mesma mesa; não aceite pagamento maior que o restante.

## Prévia dos demais módulos
13. Acesse /intervalo/intervalo27/estoque e crie um insumo. Observe que não existe baixa automática por venda.
14. Acesse /intervalo/intervalo27/impressao e cadastre a BG-06; ela deve permanecer desabilitada. Nenhum ticket será impresso. Para prévia offline, veja print-agent/README.md no GitHub.
15. Confira /intervalo/intervalo27/relatorios, com dados registrados manualmente. Não utilize os números como relatório fiscal.

## Segurança e múltiplas empresas
16. Com um usuário sem vínculo no restaurante, tente navegar para /intervalo/intervalo27/gestao; deve negar.
17. Crie segundo restaurante de teste por Super Admin, configure outro Master e valide que comandas, pagamentos e produtos de um não aparecem no outro.
18. Teste login por CPF somente após cadastro voluntário em Minha Conta; teste a reversão para login por e-mail.

**Ao relatar um problema:** informe URL, módulo, ação, expectativa, resultado e eventual mensagem. Nunca envie senha, CPF completo, token ou dados de cartão.
