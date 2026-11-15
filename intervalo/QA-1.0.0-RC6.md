# Intervalo — QA 1.0.0-rc.6 · Tela de entrada do Garçom

Data: 15/11/2026. Repo: `gaveblue/gaveblue` · branch `main`.

## Escopo
Reformular exclusivamente o lançador do PWA Garçom após autenticação: saudação, instrução, CTA **Iniciar**, retirada dos links de instalação/módulos, ocultação da submarca sob o logo e do rodapé nessa tela.

## Evidências

| Verificação | Resultado | Método |
|---|---|---|
| Syntax do script principal | PASSOU | Compilação com `new Function`, isolando import ESM |
| Saudação e instrução no carregamento | PASSOU | As duas strings presentes na primeira renderização |
| Saudação e instrução após listar restaurantes | PASSOU | Simulação com um restaurante ativo liberado |
| Botão **Iniciar** mantém a rota do restaurante | PASSOU | Rota simulada `/intervalo/novo-mundo/garcom` |
| Instalar app do garçom e Todos os módulos removidos | PASSOU | Ausentes no HTML do launcher |
| Texto sob o logo e rodapé ocultados na entrada | PASSOU na inspeção CSS | Regras específicas `body.intervalo-waiter-home` |
| Bloqueio de acesso sem vínculo ativo | PASSOU | Simulação sem restaurantes mostrou estado sem acesso e não mostrou **Iniciar** |
| Demais módulos e login preservados | PASSOU na inspeção estática | Mudanças restritas à função `waiterHome` e identificador no rodapé global |
| Navegação com autenticação real | PENDENTE | Não foi realizado teste de navegador autenticado |
| Visibilidade em PWA instalado no Android | PENDENTE | Não foi realizado teste no dispositivo |
| Propagação HTTP da versão no domínio | NÃO VERIFICADO | Verificador externo não conseguiu acessar o domínio |

## Teste manual
1. Abra o PWA Garçom instalado ou `https://gaveblue.com.br/intervalo/?app=garcom`.
2. Faça login. A tela deve dizer **Seja bem-vindo Garçom!** e **Para começar seu atendimento clique em Iniciar.**
3. Confirme ausência de instalação, todos os módulos, submarca Gaveblue e rodapé de versão.
4. Confira o cartão do restaurante, com papel e nome reais, e toque em **Iniciar**.
5. Confirme que abre a tela **Mesas** do restaurante correto e que a inclusão de produtos funciona.
6. Teste com conta sem permissão no módulo para confirmar que a tela não oferece acesso indevido.
7. Reabra o PWA para validar atualização de interface/cache.

**Status final:** homologação técnica parcial. Arquivo `intervalo/index.html` alterado em `519225f`. Não afirmar propagação ou teste completo sem evidência.
