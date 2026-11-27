# Changelog

## v1.2.0 — Objetivos e modo escuro

### O que mudou

- **Objetivos** com título, data de início e data de fim. Um deles pode ser marcado como **objetivo em destaque**.
- **Vínculo de tarefas a objetivos** (opcional), no formulário de criar e de editar. A lista do dia mostra o objetivo vinculado discretamente.
- **Progresso do objetivo** calculado a partir das tarefas vinculadas.
- **Mensagem de sucesso**: ao concluir o dia, mostra o objetivo em destaque com o progresso e o tempo restante; sem ele, a frase *"Fazer o mínimo todos os dias é melhor que fazer muito e não acabar nada."*
- **Abas Hoje / Objetivos**, para não poluir a tela principal.
- **Modo escuro** com alternância manual; na primeira visita segue o tema do sistema.

### Decisões técnicas

**Hábitos foram retirados do escopo.** A primeira versão da v1.2 tinha hábitos como entidade separada. Na prática eles duplicavam o papel das tarefas periódicas, então o vínculo ficou só entre tarefa e objetivo.

**Progresso = ocorrências concluídas ÷ ocorrências previstas no período inteiro.**
- Periódicas e "a cada X dias": cada dia em que a tarefa vale, entre o início e o fim do objetivo, é uma ocorrência.
- Normais e agendadas: uma ocorrência cada (agendadas só contam se a data cair até o fim do objetivo).
- A contagem de uma tarefa recorrente começa no dia em que ela foi vinculada (`linkedOn`), e não no início do objetivo. Vincular no meio do período não gera falhas retroativas. Trocar o objetivo de uma tarefa recomeça a contagem.
- O progresso considera o período inteiro, então só chega a 100% se tudo for feito até a data de fim.

**Estados do objetivo.**
- Concluído: todas as ocorrências foram feitas ou o usuário marcou como concluído.
- Não alcançado: passou da data de fim sem estar concluído.
- Em andamento: caso contrário.
- A data de fim pode ser editada para estender o prazo.

**Registro de conclusões (`completions`).** Antes, cada tarefa guardava só a data da última conclusão (`doneOn`), e normais e agendadas concluídas eram removidas na virada do dia. Isso não basta para medir progresso. Agora cada conclusão vira um registro `{ taskId, goalId, day, once }`, adicionado ao marcar e removido ao desmarcar no mesmo dia. O registro sobrevive à remoção da tarefa da lista, o que permite contar tarefas únicas já concluídas. Ele também prepara o histórico da aba de progresso (v1.3).

**Remoção de objetivo.** As tarefas vinculadas continuam existindo, só perdem o vínculo.

**Migração do `localStorage` (v1.1 → v1.2).** A chave continua `nexus:v1`.
- Dados sem `goals` e `completions` são lidos com uma lista vazia de objetivos e tarefas sem vínculo.
- O registro de conclusões começa com as conclusões que já estavam nas tarefas (`doneOn`), para não perder o dia corrente.
- A sequência e as estatísticas não mudam.
- Conclusões anteriores à v1.2 não foram guardadas pela versão antiga, então não entram no progresso.

**Validação ao carregar.**
- Objetivos e registros de conclusão são validados como as tarefas. Se algum dado for inválido, o estado volta ao inicial, mantendo o comportamento das versões anteriores.
- Ao carregar, os dados também são deixados coerentes: só um objetivo em destaque e nenhum vínculo para objetivo inexistente.

**Modo escuro sem "piscar".**
- Um script inline no `<head>` aplica `data-theme` antes da primeira pintura, como recomenda o guia do Next.js *Preventing flash before hydration*. O script é uma constante do código, sem conteúdo do usuário.
- A preferência fica em `nexus:theme`. Sem ela, vale `prefers-color-scheme`.
- O script tem teste: ele é executado com `localStorage` e `matchMedia` simulados e precisa dar o mesmo resultado de `resolveTheme`.

**Paleta escura por variáveis.** Em vez de espalhar `dark:` por todos os componentes, o tema escuro redefine as variáveis de cor do Tailwind (`--color-stone-*`, `--color-white`, `--color-red-*`, `--color-emerald-*`) sob `[data-theme="dark"]`. As ilustrações passaram a usar classes de cor em vez de hexadecimais fixos nos tons neutros.

**Componentes compartilhados.** Checkbox redondo, ações de item, botões de formulário, confirmação de remoção e estilos de card foram extraídos para `ui.tsx` e são usados por tarefas e objetivos.

**Finais de linha.** O repositório passou a ter `.gitattributes` com `eol=lf`, porque edições no Windows estavam misturando CRLF e LF e gerando diffs falsos.

### Testes

Lógica pura com testes em `node:test`:
- `goals.test.ts`: progresso, estados, rótulos, destaque, remoção e mensagem de sucesso.
- `tasks.test.ts`: vínculo e registro de conclusões.
- `storage.test.ts`: migração e validação.
- `theme.test.ts`: tema e script inline.
