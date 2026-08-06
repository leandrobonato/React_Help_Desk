// A máquina de desenvolvimento tem uma DATABASE_URL "fantasma" definida no
// ambiente do shell (postgresql://postgres:postgres@localhost:5432/postgres,
// artefato de template não substituído). Como o dotenv padrão não sobrescreve
// variáveis já definidas no processo, ela venceria silenciosamente o
// .env.test — por isso ela é apagada explicitamente antes de carregar o
// .env.test com override.
delete process.env.DATABASE_URL;
require('dotenv').config({ path: '.env.test', override: true });
