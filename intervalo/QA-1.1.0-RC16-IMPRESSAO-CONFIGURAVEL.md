# Intervalo — QA 1.1.0-rc.16 · Impressão configurável / imagem compacta (Android)

Data: 2026-11-16
Status: **Implementado no GitHub main, QA técnico aprovado, teste físico Android pendente.**

## Relato de campo
Na GAO MPT-II (58 mm), após o cupom HTML ter sido ajustado para largura/altura, o serviço de impressão Android "Thermal Printer" continuou apresentando uma página virtual gigantesca com cupom pequeno no meio. A interface do Android Print Service pode impor a dimensão da página e adicionar grandes espaços em branco, mesmo quando a página web solicita `@page` com altura variável.

## Solução
- Criado `thermal-receipt-rc16.js`. Ele substitui o cupom padrão nas rotas Cozinha e Caixa e disponibiliza uma tela de prévia própria, com a imagem na altura real do conteúdo.
- **Compartilhar cupom compacto**: rasteriza texto, separadores, observações e linhas com valores diretamente em Canvas, como PNG de altura variável. A largura é 384 px para a MPT-II/58 mm e 576 px para 80 mm; imprime apenas o conteúdo com margens mínimas, sem uma folha A4 no arquivo.
- Utiliza o recurso nativo de compartilhamento de arquivos do Chrome/Android (`navigator.share`) para enviar a imagem ao app de impressão que aceitar imagens no menu Compartilhar. Quando indisponível, permite **Salvar imagem** para encaminhamento manual. **Impressão do Android** permanece como modo alternativo, com aviso de possível comprimento indevido.
- **Configurações de impressão**, com persistência local neste aparelho: papel (58/80 mm), fonte (Pequeno / Normal / Legível / Grande / Extra grande), margens laterais (mínimas a 4 mm), avanço final (0/2/5/8/12 mm).
- O módulo **Impressão** ganhou o botão **Configurar e imprimir teste**: abre uma comanda fictícia e permite ajustar opções sem criar pedidos ou cobranças.
- Mantido o fluxo existente de impressão da Cozinha/Caixa, conteúdo interno não fiscal e sem impressão automática.
- Atualizado `index.html` para cache rc.16 dos módulos cozinha, caixa e impressão. A configuração salva no navegador não altera preferências de outro celular, projeto Supabase ou outros restaurantes.
- A aplicação não controla o tamanho da tela do diálogo nativo de impressão do Android: o novo fluxo **contorna** essa limitação ao compartilhar PNG recortado. Compatibilidade com o serviço gratuito utilizado deve ser confirmada no aparelho.

## Testes técnicos já executados
- Sintaxe JS de `thermal-receipt-rc16.js`, `kitchen.js`, `cash.js`, `support.js` e script principal em `index.html`: **OK**.
- Simulação Canvas em 58 mm (384 px): 1 pedido curto gerou **384 x 388 px**; pedido com 18 itens extras gerou **384 x 2152 px**, provando altura variável.
- Simulação Canvas em 58 mm com fonte 125% e margem 2 mm: 384 x 462 px (curto), 384 x 2442 px (longo).
- Simulação Canvas em 80 mm: 576 x 414 px (curto), 576 x 1746 px (longo).
- Vínculo de imports e atualização de cache dos módulos: **OK**.
- Nenhum dado, pedido, preço, pagamento ou permissão foi alterado.

## Homologação física necessária
1. Abrir Intervalo → Impressão → **Configurar e imprimir teste** no Android.
2. Confirmar que a nova prévia mostra o comprovante compacto e permite selecionar fonte/margens/papel sem espaço vazio gigante.
3. Com MPT-II emparelhada, tocar em **Compartilhar cupom compacto**, escolher **Thermal Printer** entre apps do menu Compartilhar e imprimir. Anotar comprimento de papel alimentado antes/depois.
4. Se não houver compartilhamento de arquivos disponível, tocar **Salvar imagem** e compartilhar a PNG via Galeria/Arquivos.
5. Repetir na Cozinha e Caixa com pedido curto, comprido e com texto acentuado; observar tipografia, margens e se há corte de texto.
6. Testar mudança de perfil e reabertura para verificar persistência neste celular.
7. Comparar opcionalmente **Impressão do Android**; pode continuar com altura extra por comportamento do serviço, o que NÃO é corrigível inteiramente via CSS.

**Não declarar impressão física homologada sem teste no papel real.**
