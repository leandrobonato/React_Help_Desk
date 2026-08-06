# 🎫 Central de Ajuda — Sistema de Tickets

Um Helpdesk completo full-stack: clientes abrem chamados, um algoritmo de
atribuição automática distribui cada chamado para o atendente ativo com
menor carga de trabalho, e um Kanban com drag-and-drop leva o chamado de
"Aberto" a "Fechado" — com três papéis (Cliente, Atendente, Admin) e uma
matriz de permissões aplicada de verdade no backend, não só escondida na
interface.

> Projeto de portfólio construído para demonstrar arquitetura full-stack
> React + Node.js com regras de negócio não triviais: atribuição automática
> por carga, máquina de estados de chamado, controle de acesso por papel e
> e-mail transacional — com testes de integração cobrindo cada uma dessas
> regras, não só o caminho feliz.

---

## ✨ Funcionalidades

### 🙋 Cliente

- Cadastro e login (JWT)
- Abrir chamado com título, descrição e prioridade (Alta/Média/Baixa)
- Acompanhar os próprios chamados — nunca vê chamados de outro cliente
- Comentar no chamado e acompanhar a conversa com o atendente
- Recebe e-mail de confirmação assim que o chamado é aberto

### 🧑‍💻 Atendente

- Painel Kanban: colunas **Aberto → Em Atendimento → Fechado**, com
  drag-and-drop entre colunas (`@hello-pangea/dnd`)
- Filtro por prioridade (Alta/Média/Baixa/Todas)
- Recebe automaticamente os chamados atribuídos a ele — e só pode mover os
  que são seus
- Recebe e-mail assim que um chamado novo é atribuído

### 🛡️ Admin

- Controle total: move, reatribui e exclui qualquer chamado
- Gestão de usuários — cria atendentes, promove/rebaixa papéis, ativa e
  desativa contas (desativar corta o acesso na próxima requisição, não
  precisa esperar o token expirar)

---

## 🏗️ Arquitetura

```
┌──────────────────────┐        REST (JWT)         ┌───────────────────────┐
│   Frontend (React)     │ ─────────────────────────▶ │   Backend (Express)    │
│  Kanban, filtros,       │ ◀───────────────────────── │  Regras de negócio,     │
│  telas por papel        │                            │  atribuição automática, │
└──────────────────────┘                            │  auth por papel          │
                                                       └────────────┬──────────┘
                                                                    │
                                                     ┌──────────────┼───────────────┐
                                                     ▼                              ▼
                                          ┌────────────────────┐      ┌──────────────────────┐
                                          │  PostgreSQL (Prisma) │      │  E-mail (nodemailer)   │
                                          └────────────────────┘      └──────────────────────┘
```

Documentação técnica completa em [`docs/`](docs/) — arquitetura em camadas,
modelo de dados com a matriz de permissões completa (e o *porquê* de cada
regra), e todos os endpoints da API.

---

## 🛠️ Stack

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend | React 19 + Vite | build rápido, HMR, sem boilerplate desnecessário |
| Roteamento | React Router | rotas protegidas por papel (`ProtectedRoute`) |
| Estado global | Zustand | sessão e lista de chamados, sem a sobrecarga de configuração do Redux |
| Drag-and-drop | `@hello-pangea/dnd` | Kanban acessível, mesma API do react-beautiful-dnd mantida ativamente |
| Backend | Node.js + Express | camadas explícitas: routes → validate → controllers → services |
| Validação | Zod | mesmo schema valida e tipa o body na borda da API |
| ORM / Banco | Prisma + PostgreSQL | migrations versionadas, queries type-safe |
| Autenticação | JWT + bcrypt | conta desativada perde acesso imediato (checado a cada requisição, não só no login) |
| E-mail | Nodemailer | SMTP real se configurado; sem configuração, monta o e-mail de verdade e salva em `dados/emails-enviados/` como prova de execução |
| Testes | Jest + Supertest | 32 testes de integração contra a API real (SQLite local), cobrindo permissão negada tanto quanto caminho feliz |

---

## 🚀 Como rodar localmente

Pré-requisitos: **Node.js 18+** e um **PostgreSQL** (local ou gerenciado).

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:migrate
npm run seed      # cria admin, 2 atendentes, 2 clientes e chamados de exemplo
npm run dev        # http://localhost:4400
```

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev         # http://localhost:5173
```

### 3. Acessar

Contas criadas pelo seed (senha `senha123` para todas): `admin@helpdesk.local`,
`bruno@helpdesk.local` (atendente), `diego@cliente.local` (cliente).

Guia completo, incluindo como rodar os testes sem precisar de um PostgreSQL
instalado, em [`docs/GUIA_INSTALACAO.md`](docs/GUIA_INSTALACAO.md).

---

## 📁 Estrutura do projeto

```
React_Help_Desk/
├── backend/
│   ├── prisma/                # schema.prisma + seed.js
│   ├── src/
│   │   ├── routes/             # endpoints (auth, tickets, usuarios)
│   │   ├── schemas/            # validação Zod
│   │   ├── middleware/         # auth, validate, errorHandler
│   │   ├── services/           # regra de negócio (atribuição, e-mail, tickets)
│   │   └── controllers/        # tradução HTTP
│   └── tests/                  # Jest + Supertest
├── frontend/
│   └── src/
│       ├── store/               # Zustand (authStore, ticketStore)
│       ├── components/          # KanbanBoard, TicketDetalheModal, PriorityFilter...
│       └── pages/                # LoginPage, DashboardPage, UsuariosPage...
├── dados/emails-enviados/       # e-mails reais gerados nas demonstrações
└── docs/                        # arquitetura, modelo de dados, API, instalação
```

---

## 🔮 Possíveis evoluções

- Anexar arquivos aos chamados (prints de erro, documentos)
- Notificações em tempo real (WebSocket) em vez de exigir recarregar a lista
- SLA por prioridade, com alerta quando um chamado passa do tempo esperado
- Relatórios de desempenho por atendente (tempo médio de resolução, volume)
- Reabertura de chamado pelo próprio cliente (hoje só atendente/admin reabrem)

---

## 👤 Autor

**Leandro Miozzo Bonato**
Desenvolvedor sênior com 14 anos em sistemas empresariais e bancos de dados,
hoje também em Ciência de Dados/ML (pós-graduação PUC-Rio). Nas APIs REST
que desenvolve, a mesma disciplina de 14 anos com dados críticos (fiscal,
tributário) se traduz em regras de negócio explícitas e testadas — como a
matriz de permissões e a máquina de estados deste projeto.

- GitHub: [github.com/leandrobonato](https://github.com/leandrobonato)
- LinkedIn: [linkedin.com/in/leandro-miozzo-bonato](https://linkedin.com/in/leandro-miozzo-bonato)

---

*Projeto desenvolvido para fins de portfólio.*
