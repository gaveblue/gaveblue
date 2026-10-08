# Sessão com aviso — 08/10/2026

- Contador de sessão de 10 minutos e botão Renovar no cabeçalho.
- Interação mantém a sessão em uso; ao terminar a janela de 10 minutos, outra janela começa automaticamente se a inatividade ainda for menor que 5 minutos.
- Aos 5 minutos sem interação, aviso com 30 segundos e botão explícito para continuar. Ignora interação genérica durante o aviso. Sem confirmação, usa o encerramento existente, preservando o fluxo de persistência pendente.
- Prazos calculados por timestamps, inclusive ao retornar de uma aba suspensa. Atividade compartilhada apenas entre abas do mesmo usuário no mesmo navegador. Outros aparelhos e logins não são bloqueados. O backend continua usando signOut com scope local.
- Sete testes de relógio determinístico passaram: início, aviso, confirmação, encerramento, renovação automática, outra aba, isolamento e suspensão (alguns reunidos no mesmo teste).
- Este contador é a política de inatividade da interface, não o tempo de expiração do JWT. A renovação de autenticação continua sendo feita pelo cliente Supabase existente.
