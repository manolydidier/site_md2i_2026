// test-mail.js
const nodemailer = require('nodemailer')
require('dotenv').config() // charge ton .env

async function test() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),   // 587 pour Gmail
      secure: false,                         // TLS via STARTTLS
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,    // mot de passe d'application Gmail
      },
      tls: { rejectUnauthorized: false },    // utile en dev local
    })

    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: process.env.MAIL_USERNAME,         // envoie à toi-même pour tester
      subject: 'Test SMTP MD2i',
      text: 'Bonjour, test SMTP fonctionnel ✅',
      html: '<p>Bonjour, test SMTP fonctionnel ✅</p>'
    })

    console.log('✅ Message envoyé ! ID :', info.messageId)
  } catch (err) {
    console.error('❌ Erreur SMTP :', err)
  }
}

test()