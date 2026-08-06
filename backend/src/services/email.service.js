const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const PASTA_EMAILS = path.join(__dirname, '..', '..', '..', 'dados', 'emails-enviados');

// Sem SMTP configurado no .env, usamos o transporte "jsonTransport" do
// próprio nodemailer: ele monta a mensagem de verdade (headers, corpo,
// codificação) mas não abre conexão de rede — devolve o JSON da mensagem
// pronta em vez de simular envio com um mock nosso. Cada e-mail "enviado"
// é salvo em dados/emails-enviados/ como prova de execução real do fluxo.
function criarTransportador() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }
  return nodemailer.createTransport({ jsonTransport: true });
}

const transportador = criarTransportador();
const modoDev = !process.env.SMTP_HOST;

function salvarEmailLocal(info, mensagem) {
  // A suíte de testes cria dezenas de tickets por execução — gravar cada
  // e-mail em disco poluiria dados/emails-enviados/ com ruído de teste em
  // vez de exemplos reais de uso. O jsonTransport ainda monta a mensagem
  // de verdade nos testes; só a cópia em disco é pulada.
  if (process.env.NODE_ENV === 'test') return;
  try {
    fs.mkdirSync(PASTA_EMAILS, { recursive: true });
    const nomeArquivo = `${Date.now()}_${mensagem.to.replace(/[^a-z0-9@.]/gi, '_')}.json`;
    fs.writeFileSync(
      path.join(PASTA_EMAILS, nomeArquivo),
      JSON.stringify({ ...mensagem, enviadoEm: new Date().toISOString(), info }, null, 2),
    );
  } catch (err) {
    // Falha ao salvar cópia local não pode derrubar o fluxo de negócio.
    // eslint-disable-next-line no-console
    console.error('Falha ao salvar cópia local do e-mail:', err.message);
  }
}

async function enviarEmail({ to, subject, text, html }) {
  const mensagem = {
    from: process.env.EMAIL_REMETENTE || 'Central de Ajuda <nao-responda@helpdesk.local>',
    to,
    subject,
    text,
    html,
  };

  const info = await transportador.sendMail(mensagem);

  if (modoDev) {
    salvarEmailLocal(info, mensagem);
  }

  return info;
}

async function notificarNovoChamado({ ticket, cliente, atendente }) {
  await enviarEmail({
    to: cliente.email,
    subject: `Chamado #${ticket.id.slice(0, 8)} recebido — ${ticket.titulo}`,
    text: `Olá ${cliente.nome},\n\nRecebemos seu chamado "${ticket.titulo}" (prioridade ${ticket.prioridade}).\n${
      atendente
        ? `Ele já foi atribuído a ${atendente.nome}, que vai te atender em breve.`
        : 'Assim que um atendente estiver disponível, seu chamado será atribuído.'
    }\n\nEquipe de Suporte`,
    html: `<p>Olá ${cliente.nome},</p><p>Recebemos seu chamado <strong>"${ticket.titulo}"</strong> (prioridade ${ticket.prioridade}).</p><p>${
      atendente
        ? `Ele já foi atribuído a <strong>${atendente.nome}</strong>, que vai te atender em breve.`
        : 'Assim que um atendente estiver disponível, seu chamado será atribuído.'
    }</p><p>Equipe de Suporte</p>`,
  });

  if (atendente) {
    await enviarEmail({
      to: atendente.email,
      subject: `Novo chamado atribuído a você — ${ticket.titulo}`,
      text: `Olá ${atendente.nome},\n\nUm novo chamado foi atribuído a você:\n\n"${ticket.titulo}" (prioridade ${ticket.prioridade})\nCliente: ${cliente.nome}\n\n${ticket.descricao}`,
      html: `<p>Olá ${atendente.nome},</p><p>Um novo chamado foi atribuído a você:</p><p><strong>${ticket.titulo}</strong> (prioridade ${ticket.prioridade})<br/>Cliente: ${cliente.nome}</p><p>${ticket.descricao}</p>`,
    });
  }
}

module.exports = { enviarEmail, notificarNovoChamado };
