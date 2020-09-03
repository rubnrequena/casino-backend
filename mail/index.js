const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USUARIO,
    pass: process.env.SMTP_CLAVE,
  },
});

async function enviarCorreo(para, msg, sujeto) {
  // TODO: capturar posibles errores con catch
  let info = await transport.sendMail({
    from: '"FullApuesta" <no-responder@sistemasrq.com>',
    to: para,
    subject: sujeto,
    html: msg,
  });
  console.log("Message sent to:", para, info.messageId);
  return info;
}

module.exports = enviarCorreo;
