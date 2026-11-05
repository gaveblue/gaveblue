# GB+ — Plano de evolução após a versão 2.0.0

Este arquivo separa o que já entrou no código do que ainda depende de implementação e testes. Não representa homologação de uma versão publicada no servidor.

## Versão 2.1.0 — Acesso e cadastro (código implementado, homologação pendente)

- [x] Tela de confirmação de e-mail com possibilidade de reenvio
- [x] Validação de e-mail e senha e mensagens de feedback mais claras
- [x] Tratamento de retorno cancelado/expirado do login Google
- [x] Prevenção de reloads duplicados ao mudar a sessão
- [x] Diagnóstico de configuração Google e proteção contra espera excessiva
- [x] Checklist de produção em [AUTH-DEPLOY.md](./AUTH-DEPLOY.md)
- [ ] Validar SMTP, URLs permitidas e provedor Google no Supabase e no Google Cloud
- [ ] Homologar cadastro, confirmação, recuperação, login Google e PWA com usuários de teste

## Versão 2.0.0 — Grande Atualização (código concluído)

- [x] Configuração inicial para contas novas, com cadastro opcional de conta e saldo de abertura
- [x] Revisão e confirmação antes de gravar dados financeiros iniciais
- [x] Atalhos móveis personalizáveis: Início e Novo fixos; três posições editáveis
- [x] Tela de abertura com conteúdo em toda a largura, sem margens do painel
- [x] Menu hambúrguer de recolhimento exclusivo do desktop; atalho móvel “Mais” com três pontos
- [x] Bolha de IA móvel: posição inicial visível, arraste, docking lateral e área sempre recuperável
- [x] Preferências preservadas nas estruturas existentes, sem migração destrutiva

## Próxima etapa — Estabilidade e validação em dispositivos

- [ ] Testar a abertura e a autenticação no Android, no iPhone e em navegadores desktop
- [ ] Homologar primeiro acesso, conta com saldo positivo/negativo e opção de pular
- [ ] Testar transição claro/escuro, atualização de PWA, offline e rotação de tela
- [ ] Confirmar visual do menu inferior em aparelhos de diferentes larguras
- [ ] Confirmar persistência das preferências ao entrar na mesma conta em dois dispositivos

## Etapa seguinte — Configuração mais completa

- [ ] Possibilidade de adicionar mais de uma conta no passo a passo
- [ ] Melhor orientação sobre saldo inicial, sem duplicar receitas nem baixas
- [ ] Personalização da barra de ações mais intuitiva, com prévia e reordenação
- [x] Checklist opcional de primeiros passos: conta, saldo inicial e primeiro lançamento, sem gravar movimentações automaticamente

## Etapa seguinte — GB+ AI

- [ ] Comandos em linguagem natural para localizar, filtrar e editar títulos de forma guiada
- [ ] Prévia obrigatória antes de criar, editar, baixar ou excluir lançamentos
- [ ] Histórico de conversas e recuperação de contexto sem ações silenciosas
- [ ] Mensagens de erro claras e acesso seguro aos registros, respeitando o usuário conectado

## Etapa seguinte — Controle e confiabilidade

- [ ] Conferências e alertas para vencimentos, saldos e inconsistências
- [ ] Exportação e restauração verificáveis com versões de backup compatíveis
- [ ] Melhorar relatório do fluxo de caixa e controle de contas a pagar/receber
- [ ] Testes automatizados de regressão antes de cada publicação

**Regra:** alterações financeiras exigem confirmação e persistência validada. Não apagar dados do usuário para corrigir interface, cache ou atualização.

## Arquitetura de longo prazo — GB+ Pessoal e GB+ Empresas

- [x] Projeto de arquitetura definido e documentado em [ARQUITETURA-PF-PJ.md](./ARQUITETURA-PF-PJ.md)
- [~] CPF único e imutável já protegido na tabela `gbplus_profiles` (primeiro cadastro validado, sem alterar registros financeiros); migração completa dos demais dados PF ainda pendente
- [ ] Implementar ambientes financeiros (workspaces) independentes, sem alterar visual de usuários PF
- [ ] Implantar cadastro PJ, CNPJ, matriz, filiais e vínculos de equipe por permissão
- [ ] Evoluir o financeiro para segregação por empresa/filial, com consolidados e trilhas de auditoria

> Plano futuro: o documento é preparatório; não autoriza migração, atualização do banco ou mudança de cadastro sem revisão e testes.

## Interface personalizada — GB+ 2.2.2

- [x] Seletores próprios nos formulários e filtros do GB+, com navegação por toque e teclado e integração com dados existentes.
- [x] Calendário visual do GB+ para os campos de data, com limites de data, confirmação por seleção e fundo desfocado.
- [x] Janela de atualização centralizada, sem simulações de download/instalação e com confirmação própria para reiniciar.
- [x] Convite de instalação PWA no navegador de celular, utilizando o evento real do navegador quando oferecido.
- [x] Menu de Receita e Despesa com setas coloridas (v2.2.1).
- [ ] Continuar refinando outros elementos nativos fora de seletores/calendários (por exemplo: seletor de arquivos, teclado do dispositivo e recursos do sistema). Algumas interfaces do navegador ou sistema operacional não podem ser substituídas pela aplicação; não simular ações do sistema.

> Os elementos de origem dos formulários continuam existentes, mas ficam visualmente ocultos quando substituídos pelos controles GB+, preservando FormData e validações. Nunca alterar dados financeiros apenas ao abrir um seletor ou calendário.

## GB+ 2.3.8 — autenticação e boas-vindas

- [x] Indicador de força da senha (consultivo) e confirmação em tempo real.
- [x] Avisos de sessão encerrada e links de acesso/recuperação inválidos ou expirados.
- [x] Feedback para HTTP 429 e intervalo local de reenvio de e-mails.
- [x] Checklist de conta, saldo inicial e primeiro lançamento.
- [ ] Revisar limites efetivos de Auth no painel Supabase e homologar em dispositivos reais.
- [ ] Auditar avisos do Security Advisor antes de considerar a proteção concluída.

## GB+ 2.3.9 — correções de estabilidade e segurança

- [x] Unificar e persistir na sessão o intervalo de reenvio de e-mails na autenticação.
- [x] Impedir recuperação indiscriminada de recursos não versionados de caches de PWA de outros builds.
- [x] Atualizar versão, build, histórico e testes de regressão (28 verificações em ambiente simulado).
- [x] Inspecionar read-only RLS de documentos/perfis e a autorização básica de `gbplus_save`.
- [ ] Homologar fluxo real em dispositivos, PWA, SMTP e Google.
- [ ] Revisar configurações efetivas de limites de Auth e proteção contra senhas vazadas no painel.
- [ ] Auditar formalmente a função financeira privilegiada antes de qualquer mudança no banco.

O fechamento da 2.3.9 no repositório não equivale à confirmação da implantação no site e nos aplicativos instalados.
