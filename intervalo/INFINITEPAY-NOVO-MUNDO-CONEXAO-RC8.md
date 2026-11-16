# Intervalo — InfinitePay | Conectar Novo Mundo (rc.8)

## Estado
- Estrutura Supabase instalada: restaurant_payment_gateways, online_payment_attempts e online_payment_events. RLS ativo e sem acesso direto de usuários/visitantes.
- Edge Function marketplace-payments-admin com JWT: apenas Master altera a InfiniteTag; Master e Gerente de Gestão podem consultar o estado.
- A tela Gestão → Loja Online possui card InfinitePay e formulário de configuração em bottom sheet.
- **Novo Mundo está preparado, porém com InfinitePay desativada.** Nenhuma chave, handle ou cobrança foi inserida.
- **Esta versão não gera links de pagamento e não usa webhook.** É uma preparação para conexão. O checkout permanece com as modalidades atuais.

## Como conectar a conta do Novo Mundo
1. Abra https://gaveblue.com.br/intervalo/novo-mundo/vendas-online e entre como Master do Novo Mundo.
2. Na seção Pagamento online · InfinitePay, clique em Configurar InfinitePay. Informe a InfiniteTag da conta do restaurante, sem o símbolo $, e salve.
3. No App ou Conta Web InfinitePay: Vendas → Checkout → Configurações → Habilitar Checkout Integrado. Gere uma API Key na conta **do Novo Mundo**, e não na conta da plataforma.
4. No painel do Supabase, abra Edge Functions → Secrets e crie um segredo com o nome exato **INFINITEPAY_NOVO_MUNDO_API_KEY**. Insira o valor da API Key somente lá.
5. Atualize a Loja Online. Após propagação da configuração aos Edge Functions, o status deve indicar **Chave no servidor: Presente**. Isso indica presença, não validação transacional.
6. Para desconectar a InfiniteTag, use Desconectar. A chave ainda precisa ser apagada no Supabase e revogada na InfinitePay separadamente.

**Jamais compartilhe API Key, senha ou credenciais no chat, no GitHub, em SQL ou na tela de perfil.**

## Próxima etapa após conectar
Preparar a ação de geração de link InfinitePay na API, vincular pedido por order_nsu, configurar link de pagamento único com validade curta, receber webhook e validar valor/pagamento com payment_check antes de liberar o pedido. Não liberar pedidos reais sem essa confirmação.

API oficial: https://www.infinitepay.io/checkout-documentacao

A InfinitePay não possui sandbox. Os testes de pagamento usam cobranças reais.
