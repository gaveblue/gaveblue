# Intervalo 1.1.0-rc.20 — Biblioteca reutilizável de fotos dos produtos

Data de implementação: 2026-11-16
Status: **implementação GitHub + Edge Function Supabase concluídas; QA técnico parcial aprovado; teste visual e funcional Android pendente**.

## Objetivo
Evitar a repetição de uploads: a foto usada por um produto pode ser selecionada novamente para outros produtos do **mesmo restaurante**, sem criar novos arquivos. As fotos já armazenadas e as URL HTTPS que já constam nos produtos são elegíveis para a biblioteca. A biblioteca é isolada por restaurante, preservando a separação multiempresa.

## Funcionalidades
- Em `/intervalo/{restaurante}/estoque?aba=produtos`, dentro do Bottom Sheet de **Cadastrar produto** e **Editar produto**, aparece o botão **Biblioteca**, entre **Enviar foto** e **Câmera**.
- Abre um painel modal móvel em grade de miniaturas, com filtros **Todas**, **Enviadas** e **Em produtos**, campo de busca por nome de produto, quantidade de produtos que usam a mesma imagem e botão **Carregar mais** para paginação.
- Um toque na imagem escolhe seu endereço e retorna ao formulário. O botão **Salvar** do cadastro/edição reutiliza a URL existente; **nenhum segundo arquivo é enviado**.
- O botão **Remover** remove somente a referência daquela ficha de produto. Nenhuma imagem é apagada do Storage por essa ação; assim outros produtos que compartilham a foto não são afetados.
- O envio anterior por **Galeria/Câmera**, conversão JPEG (até 1,5 MB) e alternativa por link HTTPS permanecem como estavam.
- A biblioteca mostra tanto os arquivos já presentes no bucket `intervalo-product-images` quanto os URLs de fotos existentes no campo `menu_products.image_url` daquele restaurante. Fotos externas com link quebrado mostram mensagem e não podem ser escolhidas.
- Botões e galeria visual com layout mobile-first e ícones discretos, sem abrir site externo.

## Segurança e arquitetura
- Extensão da Edge Function **`restaurant-product-photos`**, versão **2** implantada no Supabase com `verify_jwt=true`, acrescentando ação `list`.
- Antes de listar, a função valida token, conta, restaurante ativo, vínculo ativo Master/Gerente, módulo Gestão habilitado e eventuais restrições de permissões.
- A consulta ao Storage usa **apenas o prefixo `{restaurant_id}/`**; a consulta a `menu_products` é filtrada obrigatoriamente pelo mesmo `restaurant_id`. Não é possível informar outro diretório pelo cliente.
- Paginação até 48 miniaturas por requisição; até 500 referências de produtos por consulta (limite conservador inicial). A tela permite carregar páginas adicionais de uploads.
- O browser recebe URLs públicas e metadados suficientes para seleção, **nunca** a service_role ou tokens internos.
- Não foi adicionada policy aberta de escrita no bucket. O processo de criação de fotos permanece via token temporário de upload do rc.19.
- Imagens usadas em vários produtos são referenciadas pela mesma URL. Não existe cópia de arquivo, alteração de tabela de produtos ou sincronização problemática.
- Evita criar uma biblioteca global que inadvertidamente exponha arquivos de outros restaurantes. Compartilhamento entre restaurantes de um mesmo proprietário seria uma função distinta com controle de permissão explícito.

## Arquivos modificados
- `intervalo/source/supabase/functions/restaurant-product-photos/index.ts`: ação list, consulta scoped e deduplicação de referências em produtos.
- `intervalo/product-image-library-rc20.js`: diálogo modal, filtros, busca, cartões, estados vazios e botão para tentar novamente em erros de rede.
- `intervalo/product-photo-rc19.js`: botão Biblioteca integrado às ações do seletor, com callback que reutiliza URL sem novo upload.
- `intervalo/product-photo-rc19.css`: galeria e estilos responsivos.
- `intervalo/support.js`: imports versionados rc.20.
- `intervalo/index.html`: carregamento do módulo Estoque em rc.20.

## Verificações efetuadas
- Supabase Storage: bucket `intervalo-product-images`, leitura pública, limite 1.500.000 bytes, JPEG, confirmado por SQL.
- No momento do QA, bucket possuía **1 imagem** e Novo Mundo possuía **1 imagem vinculada a produto**; biblioteca tem fontes para apresentar uma foto existente.
- Auditoria da Storage: **0 políticas de escrita direta para authenticated/anon/PUBLIC**.
- Edge Function com `verify_jwt=true`, versão 2 implantada com sucesso. A leitura está posicionada **depois** das validações de identidade e escopo de restaurante.
- Sintaxe JS dos módulos novos e alterados e do entrypoint: a verificar na validação final.
- Sem criação de tabela nova e sem ações sobre dados de pedidos/caixa/estoque.
- Não foi possível chamar a nova função com sessão real de Master/gerente nem validar fisicamente a galeria Android nesta etapa. **Não homologar na produção sem essas evidências.**

## Roteiro para homologação Android
1. Entrar em `https://gaveblue.com.br/intervalo/novo-mundo/estoque?aba=produtos` com Master/gerente, atualizar e abrir **Cadastrar produto**.
2. Tocar **Biblioteca**. Confirmar que a foto já enviada aparece na grade; testar abas Todas, Enviadas, Em produtos e a busca.
3. Tocar na foto, observar a prévia no formulário; salvar novo produto. Verificar no banco que o `image_url` é idêntico ao do primeiro produto, sem novos objetos em Storage.
4. Editar outro produto e escolher a mesma imagem; conferir ambos os produtos no Garçom e Cardápio Público.
5. Remover a imagem do segundo produto e salvar. Confirmar que a foto do primeiro continua funcionando e que o arquivo segue disponível na biblioteca.
6. Inserir foto nova via Galeria, salvar e abrir Biblioteca novamente: a nova imagem deve aparecer.
7. Testar lista com muitos itens e **Carregar mais**; testar rede desconectada para mensagem e **Tentar novamente**.
8. Confirmar que usuário de outro restaurante não recebe imagens do Novo Mundo por listagem interna. Os URLs de fotos usadas em cardápio público podem continuar públicos por projeto.
9. Conferir em Android tamanho do modal, teclado na busca, rolagem e retorno ao Bottom Sheet anterior.

## Limites intencionais
- A biblioteca é por restaurante, não por toda a plataforma. O compartilhamento entre empresas distintas não foi habilitado.
- Ainda não existe exclusão permanente, edição do nome do arquivo ou categorias personalizadas na biblioteca.
- Fotos externas vinculadas a produtos aparecem, mas dependem da disponibilidade do host externo.
- A pesquisa por nome funciona para imagens em uso por produtos, não para arquivos recém-enviados com nome aleatório.
- Não foram habilitados serviços pagos ou GitHub Actions. O Storage existente continua consumindo cotas normais do Supabase.
