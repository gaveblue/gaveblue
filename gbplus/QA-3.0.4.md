# GB+ 3.0.4 — QA da abertura branca / anel orbital

Data: 10/11/2026. Atualização visual solicitada pelo responsável do produto.

## Entrega
- Cenário de abertura branco, marca GB escura e + azul original.
- Disco elíptico gira 360° em volta da marca GB+ a cada 13 segundos.
- Arco dianteiro, rastro interno e ponto de luz percorrem a órbita, com inspiração em disco de acreção.
- Layout responsivo, preservando o texto inferior separado e o botão Iniciar.
- Sem alteração de dados ou módulos financeiros; callback OAuth e links diretos continuam com proteção já existente.

## Conferência
- [x] Ajustes restritos à abertura e seus arquivos CSS/HTML, sem alteração do financeiro.
- [x] Anel posicionado dentro de `.gbintro-wordmark`, com órbita giratória e trilha.
- [x] Cores do texto e progresso adequadas ao fundo branco.
- [x] Respeita movimento reduzido.
- [ ] Execução confirmada de `node gbplus/tests/gbplus-304-white-orbit.mjs` em checkout integral/CI.
- [ ] Captura visual Android/PWA e desktop para verificar legibilidade e órbita contínua.
- [ ] Conferir estado offline, login, OAuth e retorno de Iniciar.
- [ ] Confirmar GitHub Pages concluído e página servida no domínio próprio.

**Status:** publicação solicitada; homologação visual completa depende de evidências. Não registrar como homologada sem execução confirmada.
