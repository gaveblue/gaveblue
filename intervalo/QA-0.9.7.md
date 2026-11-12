# QA — Intervalo 0.9.7 · PWA Garçom e Cardápio Digital
Data: 12/11/2026. Repositório `gaveblue/gaveblue`, branch `main`; banco Supabase `fynaaiazebydorzllwip`.

**Status da versão:** implementação e testes isolados concluídos; **não homologada integralmente em navegador/aparelhos reais**. Não declarar pronta a versão 1.0.0 com base nesta verificação.

## Evidência de implementação

| Recurso | Resultado | Evidência |
|---|---|---|
| Painel garçom: Mesas / Cardápio / Comanda | PASSOU em renderização JS simulada | Três áreas e ações reais de comanda presentes no HTML |
| Ações do garçom | INTEGRADAS ao backend existente | `order_open`, `item_add`, `order_submit`, `order_cancel`, `order_progress`; sem simular sucesso |
| Consulta de itens, preços, mesas | PASSOU em simulação | APIs `tables`, `orders`, `catalog` |
| Cards de produtos com fotos e fallback | IMPLEMENTADO | JS; fotos por HTTPS; fallback emoji quando foto ausente/quebrada |
| Busca e filtro de categorias no Garçom | IMPLEMENTADO | Filtros locais sem alterar dados no servidor |
| Atualização automática do Garçom | IMPLEMENTADO | 10 s, aba visível, ignorando busca/modal ativos; **Realtime não habilitado** |
| Cardápio público responsivo | PASSOU em renderização JS simulada | Foto, preços, categorias, busca, opcionais apenas informativos |
| Cardápio não publicado inacessível | IMPLEMENTADO por contrato no backend | `public-menu` só retorna restaurante ativo + módulo Cardápio + publicação |
| Foto HTTPS em `menu_products` | PASSOU em transação SQL com ROLLBACK | Foto segura aceita; protocolo inseguro rejeitado |
| Resíduos da transação de QA | PASSOU | Zero restaurantes com nome de QA persistidos |
| Cadastro/edição da URL de foto | PASSOU em renderização JS simulada | Gestão `catalog.js` com criação e edição |
| QR Code do cardápio | IMPLEMENTADO, precisa testar carregamento da dependência em navegador | Link gerado pelo slug; cópia alternativa se biblioteca indisponível |
| URL do PWA do Garçom | IMPLEMENTADA | `/intervalo/garcom`; escolha de empresa autorizada |
| PWA com identidade independente | VERIFICADO no manifesto | `id: /intervalo/garcom-pwa`, `start_url: /intervalo/garcom` |
| Ícones PNG | VERIFICADO no repositório | `icon-garcom-192.png` e `icon-garcom-512.png` (tamanhos declarados) |
| Ícone SVG escalável | VERIFICADO no repositório | `icon-garcom.svg` |
| Autenticação no launcher | IMPLEMENTADA | Redirecionamento `/login?destino=garcom`; fluxo de entrada retoma launcher |
| JWT/controle de acesso | CÓDIGO VERIFICADO, E2E PENDENTE | Função `restaurant-core` valida vínculo ativo e módulos |
| Isolamento de dois restaurantes | E2E PENDENTE | Exige testes reais de permissões |
| Instalação Android Chrome e iPhone Safari | **NÃO TESTADA** | Exige acesso real ao domínio em dispositivos |
| Disponibilidade do domínio / GitHub Pages | **NÃO COMPROVADA** | Commits na `main` não são evidência de deploy efetivo |
| Adicionais alterando preço de comanda | **NÃO IMPLEMENTADO** | Adicionais exibidos como informação; não cobrar automaticamente |
| Pedidos diretos de cliente e Pix online | **FORA DE ESCOPO NESTA ETAPA** | Cardápio é consulta, caixa manual |
| Operação sem internet | **NÃO SUPORTADA** | SW não armazena resposta privada nem enfileira pedidos |

## Aceite funcional pendente para avançar à 1.0.0

1. Abrir em `gaveblue.com.br` as rotas `/intervalo/garcom`, `/intervalo/{slug}/garcom` e `/intervalo/{slug}/cardapio` com o fluxo real de login e rede.
2. Instalar o PWA no Android pelo Chrome e testar a abertura em tela cheia sem URL; conferir no iOS via Safari, com ressalvas da plataforma.
3. Selecionar restaurante, listar mesas, abrir pedido, adicionar itens, enviar à cozinha e observar estoque/status.
4. Confirmar que quem não possui vínculo/módulo não entra ou altera o restaurante.
5. Testar cardápio publicado, oculto, busca, categorias, preços, opções, foto válida e foto inexistente, link e QR.
6. Verificar visual e interação em celular pequeno, celular grande, tablet e desktop (inclusive teclado/foco e leitores de tela).
7. Confirmar que nenhum dado privado foi cacheado pelo SW, que perda de conexão não confirma escrita e que logout impede operações.
8. Revisar limites de senha/segurança/Auth e desempenho das consultas periódicas com múltiplos usuários.
9. Validar rollback manual; não usar GitHub Actions.

**Escopo 1.0.0 acordado:** sem fiscal, sem SMTP, sem hardware de impressão; recibos/comandas impressos manualmente pelo navegador. Pagamentos Pix/cartão continuam registros manuais de transações externas.

Consulte `ARQUITETURA-PWA-GARCOM-CARDAPIO-0.9.7.md` e `ESCOPO-1.0.0.md`.
