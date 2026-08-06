# Arquitetura — Central de Ajuda

## Organização das pastas

```
React_Help_Desk/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # modelo de dados (PostgreSQL)
│   │   └── seed.js            # popula admin/atendentes/clientes/tickets de exemplo
│   ├── src/
│   │   ├── routes/            # define URL + middlewares por rota
│   │   ├── schemas/           # validação Zod de body/query
│   │   ├── middleware/        # auth, validate, asyncHandler, errorHandler
│   │   ├── controllers/       # só tradução HTTP (req/res), zero regra de negócio
│   │   ├── services/          # regra de negócio + acesso ao Prisma
│   │   ├── lib/                # clientes (prisma, jwt)
│   │   ├── utils/              # AppError, constantes compartilhadas
│   │   ├── app.js              # monta o Express (middlewares globais + rotas)
│   │   └── server.js           # ponto de entrada (lê .env, sobe o listener)
│   └── tests/                  # Jest + Supertest, contra a API real
├── frontend/
│   └── src/
│       ├── api/client.js       # instância axios (token automático, 401 → logout)
│       ├── store/               # Zustand: authStore, ticketStore
│       ├── components/          # Kanban, cards, modal de detalhe, navbar…
│       └── pages/                # uma página por rota
├── dados/
│   └── emails-enviados/         # e-mails gerados nas demonstrações reais (prova de execução)
└── docs/                        # esta pasta
```

## Fluxo da aplicação

```
Cliente (browser)
   │
   ▼
React (Vite) ──axios──▶ Express API ──▶ Prisma ──▶ PostgreSQL
   │                        │
   │                        └──▶ EmailService (nodemailer)
   ▼
Zustand (authStore, ticketStore) guarda token + estado da UI
```

## Backend — camadas

`routes` → `validate(schema Zod)` → `requireAuth`/`requireRole` → `asyncHandler` → `controllers` (tradução HTTP) → `services` (regra de negócio + Prisma) → `errorHandler` único, que traduz `AppError`, erros conhecidos do Prisma (`P2002` e-mail duplicado, `P2025` não encontrado, `P2003` referência inválida) e erros do JWT para o código HTTP certo.

Essa separação existe para que a regra de negócio (quem pode mover um chamado, como funciona a atribuição automática) viva só em `services/`, testável sem precisar simular uma requisição HTTP inteira, e para que trocar o transporte (por exemplo expor as mesmas regras via um worker/fila no futuro) não exija reescrever a lógica.

### Atribuição automática de atendentes (`services/atribuicao.service.js`)

Ao criar um chamado, `escolherAtendenteMenosOcupado()`:

1. Busca todos os atendentes com `ativo = true`.
2. Conta, para cada um, quantos chamados têm hoje com status `ABERTO` ou `EM_ATENDIMENTO` (chamados fechados não contam como carga).
3. Escolhe o de menor carga; em caso de empate, o que recebeu um chamado novo há mais tempo (round-robin implícito) — evita que o primeiro atendente cadastrado no banco sempre vença o empate.
4. Se não houver nenhum atendente ativo, o chamado é criado sem `atendenteId` (fica disponível para atribuição manual por um admin depois).

### E-mail automático (`services/email.service.js`)

Dispara na criação do chamado: um e-mail de confirmação para o cliente e, se houve atribuição, um e-mail para o atendente. Usa `nodemailer`:

- **Sem `SMTP_HOST` no `.env`** (padrão): usa o transporte `jsonTransport` — monta a mensagem de verdade (headers, corpo, codificação) sem abrir conexão de rede, e cada e-mail é salvo em `dados/emails-enviados/*.json` como prova de execução real do fluxo (não é um mock — é a mensagem real que seria enviada, só sem o transporte de rede). Em modo de teste (`NODE_ENV=test`) a gravação em disco é pulada para não poluir a pasta com ruído da suíte.
- **Com `SMTP_HOST` configurado**: envia de verdade via SMTP (Gmail, SendGrid, Mailtrap etc.).

O envio de e-mail é *best-effort*: uma falha de SMTP é logada mas nunca derruba a criação do chamado, que já está persistida no banco antes do e-mail ser disparado.

### Autenticação e autorização

JWT assinado com `sub` (id do usuário) e `papel`. `requireAuth` não confia cegamente no payload do token — busca o usuário atual no banco a cada requisição, então uma conta desativada perde acesso imediatamente, mesmo com um token ainda dentro da validade (`JWT_EXPIRES_IN`, padrão 8h). `requireRole(...papeis)` faz a checagem de papel; regras mais finas (cliente só vê os próprios chamados, atendente só move os seus) ficam na camada de serviço — ver a matriz completa em [MODELO_DE_DADOS.md](MODELO_DE_DADOS.md).

## Frontend — camadas

- **`api/client.js`**: instância axios única, injeta o `Authorization: Bearer` automaticamente e desloga (limpa token, redireciona para `/login`) em qualquer `401` — nenhum componente trata expiração de sessão manualmente.
- **`store/authStore.js`**: sessão do usuário (login, registro, logout, `carregarSessao` no boot da aplicação).
- **`store/ticketStore.js`**: lista de chamados + filtro de prioridade ativo. `moverStatus` é otimista (move o card na hora para o drag-and-drop parecer instantâneo) e desfaz se a API rejeitar a transição/permissão.
- **`components/KanbanBoard.jsx`**: usa `@hello-pangea/dnd` para as 3 colunas do Kanban; delega a persistência da mudança de coluna para `ticketStore.moverStatus`.
- **`components/TicketDetalheModal.jsx`**: usado tanto pelo Kanban (atendente/admin) quanto pela lista simples do cliente — os botões de mudança de status e o seletor de reatribuição só aparecem quando a API permitiria a ação (a checagem real continua sendo feita no backend).
- **`components/ProtectedRoute.jsx`**: redireciona para `/login` se não autenticado, ou para `/` se o papel não bate com a rota — a UI espelha a mesma matriz de permissões da API, mas quem decide de verdade é sempre o backend.

## Como adicionar uma nova funcionalidade

1. **Novo campo/entidade**: editar `prisma/schema.prisma`, rodar `npm run prisma:migrate` (ou `prisma db push` em dev).
2. **Nova regra de negócio**: adicionar em `services/`, nunca em `controllers/` (controllers só traduzem HTTP).
3. **Novo endpoint**: schema Zod em `schemas/` → função em `services/` → função em `controllers/` → registrar em `routes/`.
4. **Nova tela**: componente em `pages/`, registrar a rota em `App.jsx` (envolvida em `ProtectedRoute` se exigir autenticação/papel específico).
5. **Testes**: todo novo endpoint ganha teste de integração em `backend/tests/` cobrindo o caminho feliz e as permissões negadas — não só "sem erro", mas o código de status e o efeito esperado.

## Como evitar dependências desnecessárias

O projeto deliberadamente **não** usa um ORM state-manager pesado no frontend (Redux, React Query) — Zustand + axios cobrem a necessidade real (poucos recursos, sem cache complexo de servidor) sem a sobrecarga de configuração. No backend, a única dependência de banco é o Prisma; validação é só Zod (sem `express-validator` duplicando a mesma responsabilidade). Antes de adicionar uma biblioteca nova, verifique se a necessidade não é coberta por algo já presente no `package.json`.
