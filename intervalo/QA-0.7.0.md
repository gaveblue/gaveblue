# Intervalo — QA da estrutura 0.7.0 (12/11/2026)

**Status: homologação técnica parcial.** Os testes no domínio, os fluxos com login real, o hardware, o frontend React original e a infraestrutura de cobrança ainda não foram homologados.

## Evidências executadas
| Componente | Resultado | Observação |
|---|---|---|
| Banco Supabase exclusivo | PASS | Projeto fynaaiazebydorzllwip; GB+ não foi migrado |
| Tabelas | PASS | 26 tabelas no schema public, 26 com RLS |
| Privilégios diretos | PASS | 0 tabelas públicas com SELECT anon ou escrita direta authenticated |
| RPCs transacionais | PASS | 7 RPCs: sem EXECUTE anon/authenticated; service_role com EXECUTE |
| Comanda até fechamento | PASS em SQL | Teste transacional com mesas, itens, estágios, pagamento parcial e total, caixa; ROLLBACK |
| Isolamento entre empresas | PASS em SQL | Produto com categoria de outro restaurante e comanda com mesa de outro tenant rejeitados; ROLLBACK |
| Interfaces JS | PASS sintaxe | 10 módulos de interface e script do index avaliados estaticamente |
| Backend de cardápio | Implantado | Só retorna dados quando restaurante ativo, módulo liberado e publicação explícita |
| Backend de operações | Implantado | restaurant-core v1 com JWT obrigatório, role/override/módulo checados |
| Super Admin de módulos | Implantado | platform-control v1, JWT e permissão de administrador |
| Piloto Intervalo 27 | Configurado | Gestão, garçom, cozinha, caixa e cardápio habilitados para testes, sem cobrança |
| Cardápio público do piloto | Privado | Publicação falsa; nenhum produto publicado |
| Dados artificiais permanentes | Nenhum | Consulta: 0 produtos, 0 pedidos, 0 pagamentos, 0 mesas, 0 impressoras cadastradas |
| Impressão BG-06 | NÃO HOMOLOGADO | Protótipo de formatação offline não envia bytes a hardware |
| Realtime cozinha | NÃO IMPLEMENTADO | Atualização manual na interface |
| Estoque | PARCIAL | Cadastro de insumos e schema; sem baixa automática por venda |
| Pagamentos | PARCIAL | Registros manuais; sem cobrança real, conciliação ou fiscal |
| Planos/assinaturas | PARCIAL | Schema e flags; sem contrato ou cobrança |
| Frontend React original | PENDENTE | Prévia atual é HTML + módulos JS, não build React/TypeScript testado |
| Validação HTTP/domínio | NÃO COMPROVADO | Ferramenta de rede não resolveu gaveblue.com.br; commits confirmados no GitHub |
| E2E com usuários e dois restaurantes | PENDENTE | Master piloto ainda pendente de ativação |

## Avisos de segurança
- Supabase Security Advisor: auth_leaked_password_protection está desativado. Configurar no painel se disponível.
- Banco operacional deny-all para clientes; toda escrita por backend com token e checagem de escopo. Não compartilhar service_role.
- Auth e CPF usam funções próprias. O login CPF ainda não foi ensaiado ponta a ponta com CPF vinculado.
- A função de impressão física e conexão ao agent Windows não devem ser ativadas até autenticação de dispositivo, ensaio de driver e reimpressão segura.
- Dependência CDN do frontend deve ser empacotada e travada em lockfile antes de 1.0.0.
- Pagamentos manuais não comprovam que valores foram efetivamente recebidos. Validar conferência pelo estabelecimento.
- Endpoints públicos precisam de teste de carga, antifraude e monitoramento antes de escalar.

## Regra para homologar
Não marcar 0.7.0 como homologada integralmente sem: login real Master/funcionários, teste de duas empresas distintas, navegação por URL direta, pedidos e transições com tela real, revisão dos limites de autenticação, prova da publicação HTTP e ambiente de impressão antes de declarar impressão pronta.
