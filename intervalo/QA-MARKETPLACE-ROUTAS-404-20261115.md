# Intervalo — Correção dos links diretos (404) · 15/11/2026

**Causa identificada:** o arquivo raiz `404.html` possui um script de recuperação das rotas estáticas do Intervalo. A lista de rotas era anterior à introdução do marketplace e **não incluía** `/explorar`, `/loja/:slug`, `/checkout`, `/pedido`, `/cliente` nem `/:slug/vendas-online`. Consequentemente, ao abrir esses links diretamente (Instagram, WhatsApp, nova aba ou reload), o hosting estático exibia a página 404 corporativa em vez de abrir `intervalo/index.html`.

## Correções de código

1. **`/404.html` na raiz:** regras de recuperação do intervalo ampliadas para as rotas atuais, sem interferir em outras páginas corporativas. Validação do slug e exclusão de caminhos desconhecidos.
2. **`/intervalo/index.html`:** interpreta a rota de retorno no parâmetro `intervalo_route`, compara origem, prefixo e whitelist e usa `history.replaceState` para restaurar a URL original **antes do roteador da aplicação**. Mantém compatibilidade com fallback antigo via `sessionStorage`, mas não depende dele.
3. **Entradas estáticas HTTP 200** (arquivos `index.html` próprios) para os links já anunciados, redirecionando ao shell Intervalo sem passar pelo 404:
   - `/intervalo/explorar/`
   - `/intervalo/loja/novo-mundo/`
   - `/intervalo/novo-mundo/vendas-online/`
   - `/intervalo/checkout/`
   - `/intervalo/pedido/`
   - `/intervalo/cliente/`
4. O fallback raiz continua responsável por lojas de novos restaurantes, páginas da Gestão e rotas futuras da lista controlada.

## Testes técnicos

| Cenário | Resultado |
|---|---|
| Link `/intervalo/explorar` | PASSOU em simulação JS |
| Link `/intervalo/loja/novo-mundo` | PASSOU em simulação JS |
| Link `/intervalo/novo-mundo/vendas-online` | PASSOU em simulação JS |
| `/intervalo/checkout`, `/pedido`, `/cliente` | PASSOU em simulação JS |
| Rotas antigas de Gestão, Mesas e Cardápio | PASSOU em simulação JS |
| Rota sem correspondência e URL fora de `/intervalo/` | Não redireciona: PASSOU |
| Parâmetros de origem Instagram e fragmento de URL | Preservados: PASSOU |
| `sessionStorage` indisponível | Recuperação pela query continua: PASSOU |
| 6 entradas estáticas após canonicalização para barra final | PASSOU em simulação JS |
| Código `index.html` continua compilável | PASSOU |
| Hospedagem responde com status HTTP 200 | **NÃO COMPROVADO**: acesso de rede ao domínio indisponível neste ambiente |
| Propagação de `main` ao site/Pages | **NÃO COMPROVADA** |
| iOS, Android/Instagram/WhatsApp em navegador real | **PENDENTE** |

## Limites e segurança

A correção é **de roteamento**, não habilita funcionalidades inacabadas. A vitrine pode mostrar produtos públicos, mas `checkout`, `pedido` e `cliente` ainda são **telas de prévia**, sem pedidos reais. Os dois restaurantes permanecem com `accepts_customer_orders=false`. Não houve alteração em Supabase, caixa, pedidos presenciais, funcionários ou permissões.

**Publicação:** arquivos enviados à branch `main`; nenhuma GitHub Actions foi iniciada. Sem verificação positiva de deploy no domínio, esta correção **não deve ser marcada como homologada em produção**.

## Testes de aceitação após publicação

1. Abrir os seis links de cima diretamente no Android, em nova aba anônima e dentro do Instagram, sem navegar pela home.
2. Confirmar que a página 404 corporativa **não** aparece nos links do Intervalo.
3. Testar voltar, atualizar, parâmetro `?utm_source=instagram` e sessão sem `sessionStorage`.
4. Checar que `/intervalo/loja/novo-mundo` mostra cardápio de consulta, sem botão de compra.
5. Confirmar que `/intervalo/novo-mundo/vendas-online` exige Master/gerente com acesso, sem expor dados ao visitante.
6. Validar que links para outras áreas da GaveBlue continuam exibindo 404 quando realmente inválidos.
7. Se os links continuarem exibindo 404 apesar dos arquivos atualizados no GitHub, verificar **Settings → Pages → Build and deployment → Source**, branch e pasta publicados; sem isso não é possível afirmar que o host recebeu o commit.

**Rollback:** restaurar script de roteamento e retirar entradas estáticas. Não modifica dados.
