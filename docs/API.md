# API — Central de Ajuda

Base URL local: `http://localhost:4400/api`

Autenticação: `Authorization: Bearer <token>` (JWT emitido em `/auth/login` ou `/auth/registro`, expira conforme `JWT_EXPIRES_IN`, padrão 8h).

Formato de erro padronizado em toda a API: `{ "erro": "mensagem" }`.

---

## Autenticação

### `POST /auth/registro`

Cadastro público — sempre cria a conta como `CLIENTE`, mesmo que o body envie outro papel.

**Body:** `{ "nome": "string", "email": "string", "senha": "string (min 6)" }`

**201:** `{ "usuario": {...}, "token": "..." }`
**409:** e-mail já cadastrado · **400:** dados inválidos

### `POST /auth/login`

**Body:** `{ "email": "string", "senha": "string" }`

**200:** `{ "usuario": {...}, "token": "..." }`
**401:** credenciais inválidas ou conta desativada

### `GET /auth/me`

Retorna o usuário autenticado atual. **Requer token.**

**200:** `{ "usuario": {...} }` · **401:** token ausente/inválido/expirado ou conta desativada

---

## Tickets

Todas as rotas abaixo exigem autenticação. O escopo de visibilidade (o que cada papel enxerga) está documentado na íntegra em [MODELO_DE_DADOS.md](MODELO_DE_DADOS.md).

### `GET /tickets`

Lista chamados no escopo do usuário autenticado (cliente: só os próprios; atendente/admin: todos).

**Query params:** `status` (`ABERTO`\|`EM_ATENDIMENTO`\|`FECHADO`), `prioridade` (`BAIXA`\|`MEDIA`\|`ALTA`) — ambos opcionais, combináveis.

**200:** `{ "tickets": [ { id, titulo, descricao, prioridade, status, clienteId, atendenteId, cliente, atendente, createdAt, updatedAt, fechadoEm } ] }`

### `POST /tickets`

Abre um novo chamado. **Só `CLIENTE`.** Dispara a atribuição automática ao atendente ativo com menor carga e o e-mail de notificação (cliente + atendente, se houver um disponível).

**Body:** `{ "titulo": "string (3-150)", "descricao": "string (min 10)", "prioridade": "BAIXA|MEDIA|ALTA (default MEDIA)" }`

**201:** `{ "ticket": {...} }` · **403:** papel diferente de CLIENTE · **400:** dados inválidos

### `GET /tickets/:id`

Detalhe do chamado, incluindo comentários (com autor). Cliente que não é dono recebe **404** (não 403 — ver justificativa no modelo de dados).

**200:** `{ "ticket": { ...campos de listagem, comentarios: [...] } }`

### `PATCH /tickets/:id/status`

Move o chamado no Kanban. **Atendente/Admin.** Atendente só move chamados atribuídos a ele mesmo. Respeita a máquina de estados (`ABERTO ⇄ EM_ATENDIMENTO ⇄ FECHADO`, nunca `ABERTO → FECHADO` direto).

**Body:** `{ "status": "ABERTO|EM_ATENDIMENTO|FECHADO" }`

**200:** `{ "ticket": {...} }` · **403:** sem permissão · **409:** transição inválida para o status atual · **404:** chamado não existe

### `PATCH /tickets/:id/atribuir`

Reatribui o chamado a outro atendente. **Só `ADMIN`.**

**Body:** `{ "atendenteId": "uuid" }`

**200:** `{ "ticket": {...} }` · **400:** atendenteId não é um atendente válido · **403:** sem permissão

### `DELETE /tickets/:id`

Exclui o chamado definitivamente. **Só `ADMIN`** — não existe essa opção para atendente (ver modelo de dados).

**204:** sem corpo · **403:** sem permissão · **404:** chamado não existe

### `POST /tickets/:id/comentarios`

Adiciona um comentário ao chamado (qualquer papel com acesso de leitura ao ticket).

**Body:** `{ "mensagem": "string (1-2000)" }`

**201:** `{ "comentario": { id, mensagem, createdAt, autor: { id, nome, papel } } }`

---

## Usuários (administração)

Todas as rotas abaixo exigem papel `ADMIN`.

### `GET /usuarios`

**Query params:** `papel` (opcional, filtra por `CLIENTE`\|`ATENDENTE`\|`ADMIN`)

**200:** `{ "usuarios": [ { id, nome, email, papel, ativo } ] }`

### `POST /usuarios`

Cria um usuário com qualquer papel — é o único jeito de existir uma conta `ATENDENTE`/`ADMIN` fora de uma promoção manual.

**Body:** `{ "nome": "string", "email": "string", "senha": "string (min 6)", "papel": "CLIENTE|ATENDENTE|ADMIN" }`

**201:** `{ "usuario": {...} }`

### `PATCH /usuarios/:id/papel`

**Body:** `{ "papel": "CLIENTE|ATENDENTE|ADMIN" }`

**200:** `{ "usuario": {...} }`

### `PATCH /usuarios/:id/status`

Ativa/desativa a conta — desativar corta o acesso na próxima requisição (não precisa esperar o token expirar).

**Body:** `{ "ativo": true|false }`

**200:** `{ "usuario": {...} }`

---

## Diagnóstico

### `GET /saude`

Sem autenticação. **200:** `{ "status": "ok" }`

---

## Convenções

- Todas as respostas são JSON; erros sempre no formato `{ "erro": "..." }`.
- Rate limit de 30 requisições/15min em `/auth/login` e `/auth/registro` (produção) — desativado automaticamente quando `NODE_ENV=test`.
- CORS restrito à origem configurada em `CORS_ORIGIN` (o frontend em desenvolvimento roda em `http://localhost:5173`).
