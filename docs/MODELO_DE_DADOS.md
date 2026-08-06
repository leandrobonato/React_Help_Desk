# Modelo de Dados e Matriz de Permissões

## Entidades

```
Usuario 1───N Ticket (cliente)
Usuario 1───N Ticket (atendente, opcional)
Ticket  1───N Comentario
Ticket  1───N HistoricoTicket
Usuario 1───N Comentario (autor)
Usuario 1───N HistoricoTicket (autor, opcional)
```

### Usuario

| Campo       | Tipo      | Observações                                             |
|-------------|-----------|-----------------------------------------------------------|
| id          | uuid      | chave primária                                             |
| nome        | string    |                                                             |
| email       | string    | único                                                      |
| senhaHash   | string    | bcrypt, nunca exposto pela API                             |
| papel       | string    | `CLIENTE` \| `ATENDENTE` \| `ADMIN`                        |
| ativo       | boolean   | conta desativada perde acesso imediatamente (ver auth.js)  |
| createdAt   | datetime  |                                                             |

### Ticket

| Campo       | Tipo      | Observações                                                |
|-------------|-----------|--------------------------------------------------------------|
| id          | uuid      |                                                                |
| titulo      | string    |                                                                |
| descricao   | string    |                                                                |
| prioridade  | string    | `BAIXA` \| `MEDIA` \| `ALTA`                                  |
| status      | string    | `ABERTO` \| `EM_ATENDIMENTO` \| `FECHADO`                     |
| clienteId   | uuid      | quem abriu o chamado                                          |
| atendenteId | uuid?     | preenchido pela atribuição automática, pode ser nulo          |
| createdAt   | datetime  |                                                                |
| updatedAt   | datetime  |                                                                |
| fechadoEm   | datetime? | preenchido quando status vira `FECHADO`, limpo se reaberto     |

### Comentario

Mensagens da thread do chamado — qualquer papel com acesso de leitura ao ticket pode comentar (ver matriz abaixo).

### HistoricoTicket

Trilha de auditoria somente-leitura pela API: `CRIADO`, `ATRIBUIDO`, `REATRIBUIDO`, `STATUS_ALTERADO`, cada linha com valor anterior/novo e autor. Só é escrita pela camada de serviço, nunca por um endpoint direto — garante que a auditoria não pode ser forjada pelo cliente da API.

**Por que `papel`/`status`/`prioridade` são `String` e não `enum` do Prisma:** o Prisma não suporta `enum` nativamente em SQLite, só em PostgreSQL/MySQL. Mantendo esses campos como `String` (validados via Zod na borda da API — ver `src/schemas/`), o mesmo `schema.prisma` roda sem alteração contra SQLite (usado para verificação local rápida, sem precisar de um PostgreSQL instalado) ou PostgreSQL (configuração de entrega). Essa técnica é a mesma usada no projeto irmão `NodeJS_API_RestFul_Gerenciamento_Biblioteca`.

---

## Matriz de permissões

| Ação                                   | Cliente                     | Atendente                              | Admin        |
|-----------------------------------------|------------------------------|------------------------------------------|--------------|
| Abrir chamado                           | ✅ (só para si mesmo)         | ❌                                        | ❌           |
| Ver lista de chamados                   | ✅ só os próprios             | ✅ todos                                  | ✅ todos      |
| Ver detalhe de um chamado               | ✅ só se for o dono (senão 404)| ✅ qualquer um                            | ✅ qualquer um|
| Comentar em um chamado                  | ✅ só nos próprios             | ✅ em qualquer um que consiga ver          | ✅            |
| Mover status (Kanban)                   | ❌                            | ✅ só nos atribuídos a si mesmo            | ✅ qualquer um|
| Reatribuir atendente                    | ❌                            | ❌                                        | ✅            |
| Excluir chamado                         | ❌                            | ❌ (deliberadamente sem essa opção)        | ✅            |
| Gerenciar usuários (criar/promover/desativar) | ❌                      | ❌                                        | ✅            |

Pontos que não são óbvios só lendo o código — o *porquê*:

- **Cliente que não é dono recebe `404`, não `403`**, ao tentar abrir um chamado alheio (`GET /tickets/:id`). Um `403` confirmaria "esse ID existe, você só não pode vê-lo"; o `404` não revela nada sobre chamados de terceiros.
- **"Atendente não exclui" é ausência deliberada de rota/função**, não uma checagem de permissão que poderia ser esquecida em algum lugar — não existe nenhum caminho de código que permita a um atendente excluir um ticket, nem por acidente.
- **Auto-cadastro (`POST /auth/registro`) sempre grava `papel = CLIENTE`**, mesmo que o body tente enviar outro papel — só um admin já autenticado, via `POST /usuarios`, pode criar contas `ATENDENTE`/`ADMIN`. Isso fecha o caminho óbvio de escalada de privilégio via cadastro público.
- **Conta desativada perde acesso na próxima requisição, não no próximo login.** `requireAuth` busca o usuário atual no banco a cada requisição (não confia cegamente no papel/status gravado dentro do JWT já emitido) — um admin que desativa um atendente no meio do expediente derruba o acesso dele imediatamente, mesmo com um token ainda dentro da validade.
- **Atendente só move um chamado que já está atribuído a ele.** Isso é decidido na camada de serviço (`ticket.service.js`), não apenas escondendo o botão no front-end — a API rejeita a chamada mesmo que alguém monte a requisição na mão.
- **Transições de status seguem uma máquina de estados fixa** (`TRANSICOES_STATUS` em `src/utils/constantes.js`): `ABERTO → EM_ATENDIMENTO → FECHADO`, com `FECHADO → EM_ATENDIMENTO` para reabertura. Pular direto de `ABERTO` para `FECHADO` é rejeitado com `409`, mesmo para admin — o controle total do admin é sobre *quem* pode mover, não sobre *quais* saltos de estado fazem sentido no fluxo de atendimento.
