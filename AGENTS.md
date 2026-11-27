<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Regras para agentes



## Qualidade e Testes
- Siga o modelo TDD.
- Ao final de cada implementação veja o que pode ser reaproveitado, se há código morto e se está com boa qualidade.
- Em docs há um roadmap que pode ser usado de referência.

## Privacidade do usuário

- Não coloque dados pessoais (nomes, e-mails, contas, caminhos da máquina) em código, commits, mensagens, logs ou requisições a serviços externos.
- O app guarda tudo apenas no `localStorage` do navegador. Não adicione telemetria, analytics, rastreamento nem envio de dados a servidores.
- Não leia nem exponha arquivos fora do projeto (por exemplo `~/.ssh`, configurações do sistema) sem necessidade clara e sem avisar o usuário.

## Nada sobe sem perguntar

- Nunca faça commit, push, deploy, PR, publicação de pacote ou envio de qualquer conteúdo para serviços externos sem confirmação explícita do usuário naquele momento. Uma aprovação anterior não vale para a próxima ação.
- Nunca use force push nem reescreva histórico já publicado sem pedir antes, explicando o impacto.
- Antes de qualquer ação difícil de desfazer (apagar arquivos, sobrescrever configurações), mostre o que será afetado e pergunte.

## Segurança básica

- Nunca versionar segredos: `.env*`, chaves, tokens e credenciais ficam fora do git (já cobertos pelo `.gitignore`). Se encontrar um segredo no código, avise em vez de commitar.
- Trate dados do `localStorage` como não confiáveis: valide ao carregar, como em `src/lib/storage.ts`.
- Não use `dangerouslySetInnerHTML`, `eval` ou similares com conteúdo vindo do usuário.
- Adicione dependências só quando necessário, prefira pacotes conhecidos e instale com `pnpm`.
- Não execute scripts ou binários baixados da internet sem revisar o conteúdo antes.
