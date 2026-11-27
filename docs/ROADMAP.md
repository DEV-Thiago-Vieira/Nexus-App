# Roadmap — Nexus

O Nexus centraliza a vida produtiva em um só lugar: as atividades do dia, o que está planejado e o registro do que já foi feito, ligados aos objetivos de longo prazo.

**Princípio:** menos, porém melhor. Cada versão tem escopo fechado e critérios de pronto. Ideias novas entram na seção [Backlog](#backlog) e só sobem para uma versão quando atendem a uma necessidade real de uso.

**Prazo:** 05/12/2026. Mínimo obrigatório: v2.0. Versões seguintes são bônus.

| Versão | Tema | Status |
| --- | --- | --- |
| v1.0 | Tarefas e sequência | ✅ Entregue |
| v1.1 | Agendamento e regra de dia feito | ✅ Entregue |
| v1.2 | Objetivos, horários e modo escuro | ✅ Entregue |
| v1.3 | Aba de progresso | ⏳ Próxima |
| v2.0 | Conta e sincronização | Planejada (mínimo) |
| v2.1 | Pomodoro | Planejada |
| v2.2 | Escrita e galeria | Planejada |
| v2.3 | Agenda e notificações | Planejada |
| v3.0 | Integrações | Planejada |

---

## v1.0 — Tarefas e sequência ✅

- Criar, editar e remover tarefas.
- Tipos: **normal** (permanece até ser concluída) e **recorrente** (volta desmarcada no dia seguinte).
- Medidor de sequência: meta inicial de 3 dias, seguida de ciclos de 7 dias repetidos indefinidamente.
- Falhar um dia zera a sequência.
- Dados salvos no `localStorage`.
- Deploy na Vercel com domínio próprio.

## v1.1 — Agendamento e regra de dia feito ✅

- **Periódica:** aparece apenas nos dias da semana selecionados.
- **Intervalo:** aparece a cada X dias (2 a 30) a partir de uma data inicial.
- **Agendada:** aparece a partir de uma data e se comporta como normal.
- **Prioritária:** marcação que define quais tarefas decidem se o dia conta.
- **Regra de dia feito:**
  - dia com prioritárias aplicáveis → todas concluídas;
  - dia sem prioritárias → ao menos uma tarefa concluída;
  - caso contrário → a sequência zera.
- Avaliação retroativa dos dias em que o app não foi aberto.
- Registro da data de conclusão de cada tarefa.
- Migração dos dados da v1.0 sem perda.
- PWA: manifesto, ícones e convite de instalação.
- 45 testes automatizados.

---

## v1.2 — Objetivos, horários e modo escuro ✅

- **Objetivos** com título, data de início e data de fim (o fim pode ser estendido); um deles pode ficar em **destaque**.
- Vínculo opcional de tarefas a um objetivo.
- **Progresso do objetivo**: ocorrências concluídas das tarefas vinculadas ÷ ocorrências previstas no período. Concluído quando tudo é feito ou marcado manualmente; não alcançado depois do fim.
- Registro de cada conclusão de tarefa (base para a aba de progresso).
- Mensagem de sucesso com o objetivo em destaque (progresso e tempo restante) ou a frase padrão: *"Fazer o mínimo todos os dias é melhor que fazer muito e não acabar nada."*
- **Horário opcional** em agendadas e periódicas, com aviso por notificação enquanto o app está aberto.
- Abas Hoje / Objetivos.
- **Modo escuro** (alternância manual, preferência salva, padrão do sistema na primeira visita).
- Migração dos dados da v1.1 sem perda.
- Hábitos foram planejados, mas saíram do escopo: duplicavam o papel das tarefas periódicas.

---

## v1.3 — Aba de progresso

**Objetivo:** tornar o histórico visível.

**Funcionalidades**
- Totais: dias concluídos, melhor sequência, ciclos completos.
- Frequência das tarefas periódicas (por semana e por mês).
- Objetivos concluídos.
- **Mapa de calor anual** (um quadrado por dia, intensidade proporcional ao que foi concluído), no estilo do gráfico de contribuições do GitHub.

**Critérios de pronto**
- Métricas calculadas a partir do registro de conclusões, mantido desde a v1.2.
- Funções de agregação puras e testadas.
- Visualização legível no celular.

---

## v2.0 — Conta e sincronização 🎯 (mínimo até 05/12)

**Objetivo:** transformar o Nexus em um projeto full-stack, com dados sincronizados entre aparelhos.

**Funcionalidades**
- Cadastro, login e logout.
- Dados armazenados em banco de dados no servidor.
- API para tarefas, objetivos e sequência.
- Sincronização entre celular e computador.
- Migração dos dados do `localStorage` para a conta no primeiro login.
- Funcionamento básico offline, com sincronização ao reconectar (desejável).

**Notas técnicas**
- Autenticação com biblioteca consolidada; senhas nunca armazenadas em texto puro.
- Modelagem relacional sugerida: `users`, `tasks`, `task_completions`, `goals`.
- Regras de negócio (agendamento, sequência) continuam em funções puras, reaproveitadas no servidor.
- Cada usuário acessa apenas os próprios dados (verificação em toda rota da API).
- Segredos apenas em variáveis de ambiente.

**Critérios de pronto**
- Mesma conta mostra os mesmos dados no celular e no computador.
- Dados antigos migrados sem perda.
- Testes da API e das regras de acesso.
- README com as decisões técnicas (por que esse banco, esse modelo de autenticação, essa estratégia de sincronização).

---

## v2.1 — Pomodoro

- Cronômetro com foco de 25 min e pausas de 5/15 min (todos ajustáveis).
- Vínculo opcional com uma tarefa.
- Pausar, retomar e encerrar antes do fim.
- Tempo total registrado por tarefa e por objetivo, exibido na aba de progresso.

## v2.2 — Escrita e galeria

- **Aba de escrita privada**, com dois usos:
  - diário do dia (o que foi feito, como foi o dia);
  - artigos (ex.: documentação de desenhos e do processo artístico).
- **Galeria de imagens** (ex.: evolução dos desenhos), com data e descrição.
- Compressão e redimensionamento no navegador antes do envio (ex.: WebP, ~1200 px).
- Cotas por plano: limite no plano gratuito, conta do administrador sem limite.
- Conteúdo visível apenas ao próprio usuário.

## v2.3 — Agenda e notificações

- Visões de dia, mês e ano com as atividades planejadas.
- Notificações via push, mesmo com o app fechado (lembretes de tarefas com horário e do fim do dia). A v1.2 já avisa enquanto o app está aberto.
- Preferências de notificação por usuário.

---

## v3.0 — Integrações

- **Google Calendar:** sincronizar eventos e tarefas agendadas.
- **Integração com IA via MCP:** servidor MCP do Nexus, conectável a assistentes de IA. O usuário escolhe o que compartilhar (tarefas, progresso, diário, galeria).
- **Análise de padrões do diário:** identificar relações entre hábitos, humor e produtividade, com consentimento explícito.

---

## Backlog

Ideias registradas, sem versão definida:

- Mensagens de sucesso personalizáveis.
- App nativo (avaliar apenas se o PWA não atender).

**Descartadas:** monitoramento de sono por smartwatch.

## Processo por versão

1. Branch `feature/vX.Y` a partir da `main`.
2. Implementação com commits pequenos e descritivos.
3. Testes passando.
4. Pull request com descrição do que mudou e por quê.
5. Merge, atualização da versão no `package.json` e tag `vX.Y.Z` (ex.: `v1.2.0`).
