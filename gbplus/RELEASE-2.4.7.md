# GB+ 2.4.7 — Central de atualizações com novidades ilustradas

**Versão do código:** 2.4.7 · **Compilação:** 61 · **Registro:** 05/11/2026

## Novidades implementadas

- **Notas de versão em cartões com ícones.** Cada melhoria pode ter um título, uma descrição curta e um pictograma temático. A paleta é neutra; pequenas áreas de cor distinguem o tipo de novidade sem transformar o aplicativo inteiro em uma cor.
- **Mais informações na atualização.** A lista não corta mais as notas após três itens; exibe até 16 destaques publicados. A central tem rolagem própria no celular.
- **Compatibilidade com versões anteriores.** O formato simples `notes` continua funcionando, com ícone inferido pelo tema do texto. Para versões novas, o manifesto pode fornecer `highlights: [{ icon, title, description }]`.
- **Confira depois de instalar.** Em **Configurações → Atualizações do GB+ → Verificar**, a tela pode apresentar as notas da versão já instalada quando confirmar os dados do site e do repositório.
- **Correção da validação do manifesto.** O aplicativo antigo limitava a verificação a 80 arquivos; a 2.4.6 tinha 139 arquivos por conta do catálogo bancário. A central agora aceita até 500 referências com validações básicas, mantendo a verificação de caminhos dentro do GB+ antes de baixar.
- **Download e dados preservados.** Permanecem o download real por arquivo, a barra de progresso, a opção “Depois”, a confirmação para reiniciar e os avisos de formulário em uso/alterações não salvas.

## Exemplo de atualização ilustrada

```json
{
  "highlights": [
    {
      "icon": "sparkles",
      "title": "Novidades organizadas",
      "description": "As melhorias aparecem com ícone, título e descrição."
    },
    {
      "icon": "shield",
      "title": "Atualização mais confiável",
      "description": "Reconhecimento de versões com mais arquivos e reinicialização confirmada."
    }
  ]
}
```

As descrições vindas do manifesto são inseridas como texto, não como HTML executável. Os ícones são definidos no próprio código e não exigem baixar bibliotecas ou imagens externas.

## Validação

- [x] Código do atualizador alterado e validado sintaticamente.
- [x] Cinco testes novos: manifesto com mais de 80 arquivos, limites, destaques, compatibilidade com notas antigas e inserção segura de texto.
- [x] `version.json`, `index.html`, estilos e cache do PWA atualizados para 2.4.7 / build 61.
- [ ] Confirmar publicação e a leitura das melhorias num aparelho real.
- [ ] Testar download de pacote com os 139 arquivos, instalação e atualização sem perda de dados.

**Observação sobre migração:** se o dispositivo estiver usando uma cópia antiga do próprio atualizador com limite de 80 arquivos, poderá ser necessário atualizar a página uma vez para receber o script corrigido antes de utilizar a central de atualizações.

## Próximas versões

- **2.4.8:** lançamentos automáticos e regras adicionais a definir.
- **2.4.9:** robustez da importação em prévia OFX/CSV.
- **2.5.0:** importação e conciliação financeira.
- **3.0.0:** grande evolução de inteligência artificial com confirmações para mudanças financeiras.

Cronograma completo: [PLANO-VERSOES-2.4.7-A-3.0.0.md](./PLANO-VERSOES-2.4.7-A-3.0.0.md).
