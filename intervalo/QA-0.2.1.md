# QA Intervalo 0.2.1 — Login por CPF
Data: 2026-11-12

## Escopo
Funcionalidade opcional: mesmo usuário Auth consegue se autenticar por e-mail ou CPF com a senha; CPF só funciona depois do próprio titular ter associado um CPF à conta.

## Verificações técnicas
| Teste | Resultado | Evidência |
|---|---|---|
| Banco CPF e tentativas | Aprovado | Migração \`intervalo_optional_cpf_login_0_2_1\` aplicada |
| Dados CPF anon/authenticated | Aprovado | RLS, ausência de SELECT e INSERT; políticas explícitas deny all |
| Unicidade CPF | Aprovado (estrutura) | Constraint UNIQUE em HMAC por CPF |
| CPF em claro no banco | Não armazenado no modelo | HMAC keyed e últimos 4 dígitos |
| Validação de CPF | Aprovado | 7 casos: válido formatado, válido sem formatação, dígito errado, repetidos, curto, letras, vazio |
| JS index + conta | Aprovado (sintaxe) | Análise com \`new Function\` após isolar wrapper de módulo |
| Servidor CPF | Ativo | \`cpf-login\` v2, \`verify_jwt=false\` pré-login, throttling e senha validada pelo Supabase Auth |
| Vincular e remover CPF | Ativo | \`account-cpf\` v1, \`verify_jwt=true\` e confirmação de senha |
| Login por e-mail | Preservado | Código original \`signInWithPassword\` continua sendo usado |
| Rotas | Publicadas no GitHub | \`/intervalo/minha-conta\`, login e fallback da 404 |
| Isolamento GB+ | Mantido | Somente novo banco Intervalo e arquivos do diretório Intervalo, mais 404 dedicada |
| Login real com CPF | Pendente | Nenhuma conta foi vinculada a CPF durante o QA |
| Publicação HTTP/dominio | Não comprovada | Ferramenta de verificação externa não conseguiu acessar a URL |
| Load test e antifraude | Pendente | Gate comercial |
| Proteção de senha vazada | Aviso pendente | Security Advisor \`auth_leaked_password_protection\` |

## Cenários E2E obrigatórios antes de homologação final
1. Login por e-mail com usuário já existente (Master/funcionário).
2. Abrir Minha Conta, cadastrar CPF válido confirmando senha.
3. Sair e entrar com CPF formatado e senha correta.
4. Testar CPF sem máscara, dígito inválido e senha errada.
5. Tentar vincular o mesmo CPF a outro usuário: operação deve ser rejeitada.
6. Desvincular CPF com senha e verificar que login por CPF deixa de funcionar, mas e-mail continua.
7. Repetir 5 tentativas erradas para avaliar bloqueio por 15 minutos e reentrada posterior.
8. Testar troca entre dois restaurantes sem alteração de privilégios por login CPF.

## Considerações de segurança e LGPD
- O CPF é um identificador pessoal; guardar o HMAC não torna necessariamente esses dados anônimos. Tratar como dado pessoal pseudonimizado.
- Não utilizar CPF como senha, prova de identidade civil, nem deixar o frontend descobrir o e-mail a partir do CPF.
- Não solicitar CPF de usuários pelo chat nem persistir CPF em logs de rede de aplicativo.
- A chave de serviço Supabase é usada como segredo de HMAC nesta prévia. A rotação dela invalida os digests pré-existentes; preparar segredo de HMAC independente antes de escalar.
- Pendente tratamento formal de retenção dos contadores de tentativa e validação de titularidade se for necessária.
- Não usar em produção comercial sem testes antifraude e revisão do fluxo de identidade.

**Status da versão:** QA parcial; não homologada integralmente.
