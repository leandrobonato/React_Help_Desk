/* eslint-disable no-console */
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { PAPEIS, PRIORIDADES, STATUS_TICKET } = require('../src/utils/constantes');

const prisma = new PrismaClient();

const SENHA_PADRAO = 'senha123';

async function upsertUsuario({ nome, email, papel }) {
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);
  return prisma.usuario.upsert({
    where: { email },
    update: {},
    create: { nome, email, senhaHash, papel },
  });
}

async function main() {
  console.log('Semeando banco de dados...');

  const admin = await upsertUsuario({ nome: 'Ana Souza', email: 'admin@helpdesk.local', papel: PAPEIS.ADMIN });
  const atendente1 = await upsertUsuario({ nome: 'Bruno Lima', email: 'bruno@helpdesk.local', papel: PAPEIS.ATENDENTE });
  const atendente2 = await upsertUsuario({ nome: 'Carla Nunes', email: 'carla@helpdesk.local', papel: PAPEIS.ATENDENTE });
  const cliente1 = await upsertUsuario({ nome: 'Diego Alves', email: 'diego@cliente.local', papel: PAPEIS.CLIENTE });
  const cliente2 = await upsertUsuario({ nome: 'Elisa Prado', email: 'elisa@cliente.local', papel: PAPEIS.CLIENTE });

  const ticketsExistentes = await prisma.ticket.count();
  if (ticketsExistentes === 0) {
    await prisma.ticket.create({
      data: {
        titulo: 'Não consigo acessar o sistema',
        descricao: 'Ao tentar logar recebo "credenciais inválidas" mesmo com a senha certa.',
        prioridade: PRIORIDADES.ALTA,
        status: STATUS_TICKET.ABERTO,
        clienteId: cliente1.id,
        atendenteId: atendente1.id,
      },
    });
    await prisma.ticket.create({
      data: {
        titulo: 'Relatório mensal não exporta em PDF',
        descricao: 'O botão de exportar fica carregando e nunca baixa o arquivo.',
        prioridade: PRIORIDADES.MEDIA,
        status: STATUS_TICKET.EM_ATENDIMENTO,
        clienteId: cliente2.id,
        atendenteId: atendente2.id,
      },
    });
    await prisma.ticket.create({
      data: {
        titulo: 'Dúvida sobre plano de assinatura',
        descricao: 'Gostaria de saber se dá para fazer upgrade no meio do ciclo de cobrança.',
        prioridade: PRIORIDADES.BAIXA,
        status: STATUS_TICKET.FECHADO,
        fechadoEm: new Date(),
        clienteId: cliente1.id,
        atendenteId: atendente1.id,
      },
    });
  }

  console.log('Usuários de teste (senha para todos: "senha123"):');
  console.log(`  Admin:      ${admin.email}`);
  console.log(`  Atendente:  ${atendente1.email}`);
  console.log(`  Atendente:  ${atendente2.email}`);
  console.log(`  Cliente:    ${cliente1.email}`);
  console.log(`  Cliente:    ${cliente2.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
