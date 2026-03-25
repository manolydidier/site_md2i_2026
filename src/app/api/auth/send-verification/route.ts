import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.MAIL_HOST,
    port:   Number(process.env.MAIL_PORT ?? 587),
    secure: process.env.MAIL_ENCRYPTION === 'ssl',
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return Response.json({ error: 'Email requis' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user)              return Response.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    if (user.emailVerified) return Response.json({ error: 'Email déjà vérifié' },      { status: 400 })

    // Invalider les anciens tokens
    await prisma.authToken.updateMany({
      where: { userId: user.id, type: 'EMAIL_VERIFICATION', usedAt: null },
      data:  { usedAt: new Date() },
    })

    const code      = String(Math.floor(100000 + crypto.randomInt(900000)))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.authToken.create({
      data: { userId: user.id, token: code, type: 'EMAIL_VERIFICATION', expiresAt },
    })

    await createTransporter().sendMail({
      from:    `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to:      email,
      subject: 'Votre nouveau code de vérification MD2i',
      html:    buildEmailHtml(code, user.firstName ?? 'Utilisateur'),
    })

    return Response.json({ success: true })

  } catch (err) {
    console.error('[send-verification]', err)
    return Response.json({ error: "Erreur lors de l'envoi" }, { status: 500 })
  }
}

function buildEmailHtml(code: string, firstName: string) {
  return `
<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;min-height:100vh;">
    <tr><td align="center" style="padding:48px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="text-align:center;padding-bottom:32px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#EF9F27,#c97d15);border-radius:14px;padding:12px 24px;">
            <span style="color:#fff;font-size:20px;font-weight:800;">MD2i</span>
          </div>
        </td></tr>
        <tr><td style="background:#111118;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:40px 36px;text-align:center;">
          <div style="width:60px;height:60px;background:rgba(239,159,39,.12);border:1.5px solid rgba(239,159,39,.25);border-radius:50%;margin:0 auto 24px;font-size:26px;line-height:60px;">🔐</div>
          <h1 style="color:#f0ede8;font-size:22px;font-weight:700;margin:0 0 8px;">Nouveau code de vérification</h1>
          <p style="color:rgba(255,255,255,.42);font-size:14px;line-height:1.7;margin:0 0 32px;">
            Bonjour <strong style="color:rgba(255,255,255,.7);">${firstName}</strong>,
            voici votre nouveau code. Valable <strong style="color:#EF9F27;">10 minutes</strong>.
          </p>
          <div style="background:rgba(239,159,39,.08);border:1.5px solid rgba(239,159,39,.22);border-radius:16px;padding:28px 20px;">
            <p style="color:rgba(255,255,255,.35);font-size:10px;letter-spacing:2.5px;text-transform:uppercase;margin:0 0 12px;font-weight:600;">Code de vérification</p>
            <div style="letter-spacing:14px;font-size:40px;font-weight:800;color:#EF9F27;font-family:'Courier New',monospace;">${code}</div>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}