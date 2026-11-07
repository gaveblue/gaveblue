# GB+ — Convenção de versões (vigente a partir de 06/11/2026)

## Regra aprovada pelo responsável do produto

O GB+ passa a identificar cada atualização pública por **versão X.Y.Z**, sem expor "compilações" ou "builds" ao usuário final.

- **X — grande atualização:** mudanças estruturais e grandes marcos do produto (ex.: 2.6.0 → 3.0.0).
- **Y — atualização intermediária:** mudanças de escopo expressivo, módulos ou conjunto relevante de funcionalidades (ex.: 2.5.3 → 2.6.0).
- **Z — atualização incremental:** pequenos recursos, correções, ajustes de interface e usabilidade (ex.: 2.5.1 → 2.5.2 → 2.5.3).

Aumentar X ou Y zera os componentes seguintes. A numeração não é uma medida automática da quantidade de arquivos alterados.

## Transição sem apagar o histórico

- A **2.5.1** já possui a compilação interna 2 publicada e a compilação interna 3 **candidata** no PR #82. **Não reescrever** esses registros históricos nem considerá-la publicada antes de homologação.
- **Histórico de transição:** inicialmente se previu 2.5.2 como atualização incremental, mas o responsável consolidou o escopo e autorizou a **2.6.0** em 06/11/2026. A nova versão foi publicada no PR #84. As próximas versões devem respeitar X.Y.Z a partir deste marco.
- O catálogo de 26 serviços planejado anteriormente será avaliado em conjunto com a nova experiência da tela "Novo lançamento" para a versão 2.5.2; nenhuma dessas funcionalidades está entregue enquanto faltar integração e homologação.
- A **2.6.0** permanece reservada às melhorias de interface e organização já planejadas para uma atualização intermediária.
- Identificadores técnicos de cache, commit e artefato podem continuar existindo internamente, quando necessários para distribuir o PWA com segurança, mas não são um segundo número de versão apresentado ao usuário.

## Critério para registrar, homologar e publicar

1. Registrar cada mudança proposta no `CHANGELOG.md` e vinculá-la à versão de entrega.
2. Usar branches/PRs para desenvolver, executar testes e coletar evidências antes de aprovar.
3. Só marcar uma versão como homologada ou publicada com evidência e autorização; um commit ou teste isolado não basta.
4. Publicar a versão somente depois da homologação aplicável, mantendo caminhos de recuperação sem perda de dados.

**Esta decisão não autoriza liberar a PR #82 nem alterar os dados financeiros do usuário.**
