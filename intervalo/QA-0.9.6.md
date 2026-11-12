# Intervalo — QA do escopo 1.0.0 e alteração 0.9.6

Data: 12/11/2026 — **homologação parcial; release comercial 1.0.0 ainda pendente**.

## Decisão de produto
Versão 1.0.0 **não exige** emissão fiscal, entrega de e-mails ou impressora física. A impressão é manual pelo navegador/PDF. Consulte [ESCOPO-1.0.0.md](./ESCOPO-1.0.0.md).

## Evidências do código
| Teste | Resultado |
|---|---|
| Tela `/impressao` não mostra formulário de cadastro de impressora | PASSOU na inspeção de código |
| Impressão de cozinha por prévia do navegador | EXISTENTE (sem teste físico) |
| Impressão de comanda do caixa por prévia do navegador | EXISTENTE (sem teste físico) |
| Super Admin e Master continuam podendo criar funcionários com senha provisória | EXISTENTE |
| Convite para conta inexistente no backend `restaurant-team` não chama `inviteUserByEmail` | MUDANÇA PUBLICADA no Supabase — v6 |
| Convite de conta já existente segue vinculando sem SMTP | MUDANÇA PUBLICADA no Supabase — v6; E2E não testado |
| Página de recuperação não chama `resetPasswordForEmail` | PASSOU na inspeção do JS |
| Tela pública de ativação inicial não chama `auth.signUp` | PASSOU na inspeção do JS |
| JS da versão 0.9.6 (incluindo imports e tela de impressão) | TESTE ESTÁTICO |
| Login real no domínio, ciclo real de pedidos e impressão via navegador | **NÃO HOMOLOGADO** |

## Riscos
- A recuperação da senha do próprio Super Admin permanece fora da aplicação e depende do acesso legítimo ao painel Supabase.
- Outros mecanismos operacionais externos ao Intervalo (como notificações configuradas no Supabase Auth) não estão abrangidos por esta alteração.
- Imprimir manualmente depende do navegador permitir janela/pop-up e do usuário escolher o destino; nenhuma fila automática é processada.
- O caixa ainda não comprova pagamentos em bancos ou adquirentes; registra somente recebimentos externos informados pelo operador.
- Comandas não são documentos fiscais e não substituem as obrigações legais dos estabelecimentos.

## Próximos testes obrigatórios para 1.0.0
- Navegação por celular/PC e rotas diretas.
- Login e primeira troca de senha de cada papel.
- Dois restaurantes isolados.
- Ciclo comanda/estoque/cozinha/caixa com erros e concorrência.
- Prévia e salvar PDF/Imprimir pelo navegador, sem necessidade de impressora.
- Recuperação operacional por senha provisória sem SMTP, revisão de RLS e avisos de segurança.

Não marcar 1.0.0 homologada antes de comprovar os itens acima.
