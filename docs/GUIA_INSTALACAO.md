# Guia de Instalação

## Pré-requisitos

- Node.js 18+ (testado com Node 24)
- PostgreSQL 14+ (local ou um serviço gerenciado — Supabase, Neon, Railway etc.)

## 1. Backend

```bash
cd backend
npm install
copy .env.example .env      # Windows — use `cp` no Linux/Mac
```

Edite `backend/.env`:

```bash
DATABASE_URL="postgresql://usuario:senha@localhost:5432/helpdesk?schema=public"
JWT_SECRET="troque-por-um-segredo-forte"
CORS_ORIGIN="http://localhost:5173"
```

Aplique o schema e popule dados de exemplo:

```bash
npm run prisma:migrate   # cria as tabelas no PostgreSQL
npm run seed              # cria admin, 2 atendentes, 2 clientes e 3 chamados de exemplo
npm run dev                # http://localhost:4400
```

**Contas criadas pelo seed** (senha para todas: `senha123`):

| Papel      | E-mail                  |
|------------|--------------------------|
| Admin      | admin@helpdesk.local     |
| Atendente  | bruno@helpdesk.local     |
| Atendente  | carla@helpdesk.local     |
| Cliente    | diego@cliente.local      |
| Cliente    | elisa@cliente.local      |

### E-mail (opcional)

Sem configurar SMTP, o sistema já funciona normalmente: os e-mails que seriam enviados na criação de um chamado são montados de verdade e salvos em `dados/emails-enviados/*.json`, além de logados no console. Para enviar de verdade, preencha no `.env`:

```bash
SMTP_HOST=smtp.seuservico.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario
SMTP_PASSWORD=senha
EMAIL_REMETENTE="Central de Ajuda <nao-responda@seudominio.com>"
```

Qualquer provedor SMTP padrão funciona (Gmail com senha de app, SendGrid, Mailtrap para testes, etc.).

## 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
copy .env.example .env      # Windows — use `cp` no Linux/Mac
npm run dev                  # http://localhost:5173
```

`frontend/.env` só precisa apontar para a API:

```bash
VITE_API_URL=http://localhost:4400/api
```

## 3. Rodando os testes do backend

A suíte de testes (`backend/tests/`, Jest + Supertest) roda contra um banco SQLite local — não precisa de um PostgreSQL real disponível para validar a lógica de negócio. O `schema.prisma` do repositório já vem configurado para PostgreSQL (entrega final); para rodar os testes localmente sem um Postgres à mão:

```bash
cd backend
# 1. trocar temporariamente o provider em prisma/schema.prisma para "sqlite"
# 2. gerar e sincronizar o banco de teste
DATABASE_URL="file:./test.db" npx prisma db push
# 3. rodar a suíte (usa automaticamente backend/.env.test)
npm test
# 4. reverter o provider para "postgresql" antes de commitar
```

Essa é a mesma técnica usada no projeto irmão `NodeJS_API_RestFul_Gerenciamento_Biblioteca` — o schema não usa nenhum recurso exclusivo de um provider (sem `enum` nativo do Prisma), então roda sem alteração em ambos.

## 4. Problemas comuns (Windows)

- **`DATABASE_URL` "fantasma"**: algumas máquinas têm uma `DATABASE_URL` já definida no ambiente do shell (resquício de outro projeto). Como o `dotenv` não sobrescreve variáveis já definidas no processo, ela vence silenciosamente o `.env`. Se `npm run dev`/`npm test` parecer estar usando um banco errado, rode `echo $DATABASE_URL` (Bash) ou `$env:DATABASE_URL` (PowerShell) para conferir, e `unset DATABASE_URL` antes de rodar o comando se houver um valor inesperado.
- **Porta em uso**: o backend usa a porta `4400` e o frontend `5173` por padrão — ajuste `PORT` (backend) ou `--port` (Vite) se algo mais já estiver ocupando essas portas na sua máquina.
