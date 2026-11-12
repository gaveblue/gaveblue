# Intervalo — arquitetura de interfaces, PWA Garçom e Cardápio Digital
**Versão de referência:** 0.9.7 · 12/11/2026 · `gaveblue/gaveblue` / Supabase `fynaaiazebydorzllwip`  
**Status:** interfaces e APIs preparadas; homologação E2E no domínio ainda pendente. Alvo comercial: 1.0.0.

## 1. Direção visual — referências fornecidas pelo produto

- **Marca:** Intervalo com tipografia forte azul-marinho e detalhe/traço laranja; fundo branco/quase branco; laranja para ações primárias, verde para concluído, vermelho apenas para urgências/erros e cartões arredondados.
- **Garçom:** referência do celular enviada: mesas em primeiro plano, categorias e produtos com fotos, comanda sempre acessível, poucos passos e botões grandes para operar em pé.
- **Cozinha KDS:** referência com três colunas `Novos`, `Em preparo` e `Prontos`, tempo de espera e prioridades. A versão atual tem fila operacional com atualização periódica; o painel Kanban completo da referência será etapa independente, sem inventar eventos de pedido que o backend ainda não possui.
- **Caixa:** referência com fila, mesa, resumo e recebimento; fase inicial com comprovante não fiscal e Pix/cartão apenas registrados após confirmação externa.
- **Super Admin:** referência com navegação lateral, indicadores e estabelecimentos. Usar somente métricas calculadas do banco real, nunca os números fictícios da imagem.
- **Comanda:** referência com resumo, itens, observações, status, valores e marca; QR de *consulta* pode ser adicionado futuramente sem criar cobrança QR inexistente.
- Imagens do briefing são **inspiração de layout**, não dados fictícios de pedidos, números operacionais, fotografias do catálogo real ou um protótipo funcional conectado.

## 2. URLs e perfis

| Rota | Acesso | Responsabilidade |
|---|---|---|
| `/intervalo/` | Público | Site de entrada do Intervalo |
| `/intervalo/login` | Público | Acesso por e-mail/CPF com senha |
| `/intervalo/admin` | Super Admin | Restaurantes, usuários, módulos |
| `/intervalo/inicio` | Usuário autenticado | Escolha de restaurantes e módulos permitidos |
| `/intervalo/garcom` | Garçom/Master/Gerente autorizado | **Launcher instalável do PWA Garçom** |
| `/intervalo/{slug}/garcom` | Garçom/Master/Gerente autorizado | Mesas, catálogo, comanda |
| `/intervalo/{slug}/cardapio` | Público somente se publicado | **Cardápio de consulta** |
| `/intervalo/{slug}/catalogo` | Master/Gerente autorizado | Categorias, produtos, fotos HTTPS, publicação, QR do link |
| `/intervalo/{slug}/cozinha` | Cozinha ou papel autorizado | Fila de produção |
| `/intervalo/{slug}/caixa` | Caixa ou papel autorizado | Registro de pagamentos e comanda |
| `/intervalo/{slug}/estoque` | Gestão autorizada | Fichas técnicas, saldos e movimentos |

Identidade de PWA separada (`/intervalo/garcom-pwa` no Manifest ID). O manifesto é selecionado para o launcher e as telas do garçom. A instalação não substitui nem altera o PWA geral do Intervalo.

## 3. PWA Garçom: fluxo e limites

```text
Instalação /intervalo/garcom (PWA)
      │
      ▼
Sessão Supabase Auth?
   ├─ não → /intervalo/login?destino=garcom
   └─ sim → consulta memberships + módulos + overrides
                      │
                      ▼
      um restaurante autorizado? → abrir seu /{slug}/garcom
      vários restaurantes?       → tela de escolha
      nenhum?                    → orientação para solicitar permissão
                      │
                      ▼
    Mesas → selecionar mesa → abrir comanda
             │
             ▼
    Cardápio → buscar/filtrar → produto → quantidade/observação
             │
             ▼
    Comanda → conferir → enviar para cozinha
             │                         │
             ▼                         ▼
    cozinha atualiza status       baixa estoque transacional
             │
             ▼
    Garçom marca servido → Caixa registra recebimento → fecha comanda
```

- **Sempre online para escrita:** o Service Worker atual não armazena tokens, respostas autenticadas, filas de escrita ou pedidos; nenhuma ação de comanda é confirmada offline. Se cair a conexão, o operador deve reconectar e atualizar antes de tentar novamente.
- **Atualização periódica:** garçom a cada 10 segundos, preservando campos e modal ativo; cozinha a cada 15 segundos. Não afirmar WebSocket/Realtime quando não usado.
- **Acesso controlado no servidor:** `restaurant-core` valida JWT, usuário, vínculo ativo com restaurante, papel, módulo habilitado e overrides individuais antes das operações.
- **Operações existentes:** `order_open`, `item_add`, `order_submit`, `order_cancel` (somente antes do envio), `order_progress` para servido. Itens não são removidos/alterados após inclusão porque falta RPC específica; não exibir controles enganadores.
- **Adicionais de produto:** cadastrados e exibíveis no menu, mas ainda não aumentam o valor da comanda no backend. Na etapa atual o garçom usa observações e a UI informa o limite. A integração segura de adicionais será requisito funcional futuro antes de prometer escolha/preço automático.

## 4. Cardápio digital

- O mesmo banco de `menu_categories`, `menu_products` e `menu_product_options` alimenta Gestão e visualização pública.
- `menu_products.image_url`: foto opcional por URL HTTPS. Sem foto, apresenta ilustração/emoji de categoria — não copiar imagens fictícias das referências para pedidos reais.
- Master/Gerente define categorias, preços, disponibilidade, descrições e imagens; publica/despublica explicitamente em `restaurant_publication`.
- `public-menu` funciona sem JWT, mas retorna dados somente quando **restaurante ativo + módulo Cardápio habilitado + publicação ativa**. Categorias inativas e produtos indisponíveis são excluídos.
- Visual responsivo com busca, filtros de categoria, fotos, preços, opcionais informativos, copiar link e compartilhamento nativo.
- Na Gestão, o QR Code codifica **somente a URL pública do cardápio**, sem Pix, pagamento, cliente ou autenticação; requer conexão para a biblioteca client-side de QR (fallback: copiar link).
- Sem pedido direto por cliente, carrinho, checkout ou armazenamento de dados do consumidor nesta etapa. Nenhum botão `Pedir` deve simular transações inexistentes.
- Fotografia deve ter permissão de uso; a URL pode depender da disponibilidade do host e deve apontar diretamente para a imagem. Upload autenticado para Storage com limites e transformação pode ser implementado depois.

## 5. Modelo de dados / autoridade

```text
auth.users
   │
   └── restaurant_members  <──── restaurants ───── restaurant_modules
           │                      │
           └── module_access      ├── menu_categories ── menu_products ── menu_product_options
                                  │                              │
                                  ├── restaurant_tables          └── recipe_components ── stock_items
                                  │             │                                        │
                                  ├── orders ───┘──────────────── order_items          └── stock_movements
                                  │   └── order_events
                                  ├── cash_sessions ─── payments
                                  └── restaurant_publication
```

**Invariantes:** tenant `restaurant_id` em dados operacionais e chaves estrangeiras compostas; funções de mutação no banco com `EXECUTE` restrito a `service_role`; frontend nunca usa service key; auditoria de alterações administrativas. Dados simulados não devem ser gravados em contas reais.

## 6. Escopo 1.0.0 que continua valendo

- Não inclui emissão fiscal, SMTP de convites/recuperação, impressora térmica automática ou testes de hardware. Impressão de cozinha e caixa é via prévia do navegador/PDF.
- Pagamentos Pix/cartão são **registros manuais de recebimentos externos**, não cobranças processadas pelo Intervalo.
- O app deve funcionar bem no celular Android e iPhone via navegador; instalação PWA depende de compatibilidade do navegador/dispositivo. O iOS usa Safari → Compartilhar → Adicionar à Tela de Início.
- Sem promessa de funcionamento offline de comandas ou cardápio salvo.
- Não usar GitHub Actions (indisponível por cobrança), deployment manual e registro no CHANGELOG.

## 7. Critérios de aceite antes de homologar o pacote 0.9.7/1.0.0

1. Validar no navegador público os caminhos profundos, login, troca de senha e abertura do launcher PWA.
2. Testar instalação em Android Chrome e iPhone Safari; confirmar nome, ícone, tela inicial e retorno ao garçom.
3. Testar dois restaurantes e papéis diferentes, incluindo conta sem acesso e desativação de módulo.
4. Abrir, enviar e servir pedidos reais, observar cozinha e estoque, verificar duplicidade e falta de saldo.
5. Publicar/despublicar cardápio e testar link direto/QR a partir de celular sem login.
6. Testar categoria vazia, busca, foto inválida/ausente, preço real, disponibilidade, responsividade e acessibilidade.
7. Conferir que o SW não armazena respostas privadas e que offline não permite confirmar novas comandas.
8. Conferir logs, segurança/RLS, bundle e reversão manual.

**Status correto:** código e contratos podem estar prontos, mas sem E2E de navegador e instalação nos dispositivos reais não se deve rotular o recurso como homologado para produção.
