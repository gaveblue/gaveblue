# GB+ 3.0.2 — revisão visual da splash screen

Data: 10/11/2026. Estado: candidata, sem publicação.

## Problema
A 3.0.1 não reproduziu fielmente o estudo aprovado pelo responsável: letras reveladas por clipping retangular, sensação de tipografia comum e paleta clara divergente da referência escura.

## Correção
- Arte vetorial SVG embutida de G, B e +, com desenhos progressivos, preenchimentos metálicos sutis e glow azul apenas no símbolo +.
- Mesmo fundo azul-marinho em ambos os temas, como na referência.
- Pequena luz ambiente. Logotipo termina de aparecer antes do fade final; sua saída evita que o conteúdo da tela seguinte apareça por trás das letras.
- Duração 2,12 s, com retirada do elemento após 2,4 s como fallback.
- Sem rede adicional, sem novas fontes, sem alteração nos cálculos ou autenticação.

## Evidências
- [x] Prévia HTML autônoma criada para reprodução e comparação de movimento.
- [x] Captura em Chromium de diferentes instantes (0,4 s; 0,95 s; 1,55 s) e inspeção visual de legibilidade.
- [x] CSS respeita `prefers-reduced-motion` e mantém fallback para não travar abertura.
- [x] Código registrado no CHANGELOG, manifesto da versão e cache SW.
- [ ] Rodar regressões do repositório via Node no checkout completo; GitHub Actions pendente.
- [ ] Validar Android/PWA, iPhone e desktop com login, retorno, perda de rede e atualização de cache.
- [ ] Aprovação visual do responsável e autorização para publicar 3.0.2.

**Importante:** código desenvolvido em PR separado. Não alterar a versão pública até a nova aprovação.
