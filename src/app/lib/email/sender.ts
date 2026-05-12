// lib/email/sender.ts
// Logique d'envoi des campagnes avec Resend
// Gestion : rate limiting, erreurs individuelles, logs

import { Resend } from "resend";
import { prisma } from "@/app/lib/prisma"; // Adapte le chemin à ton projet

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Utilitaire : exécute N tâches en parallèle max ───────────────────────────
async function pLimit<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const currentIndex = index++;
      results[currentIndex] = await tasks[currentIndex]();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ─── Délai entre batches ───────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Remplacement de variables dans le HTML ───────────────────────────────────
function personalizeHtml(html: string, contact: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  return html
    .replace(/\{\{firstName\}\}/g, contact.firstName || "")
    .replace(/\{\{lastName\}\}/g, contact.lastName || "")
    .replace(/\{\{email\}\}/g, contact.email)
    .replace(/\{\{fullName\}\}/g, [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.email);
}

// ─── Envoi d'un seul email ────────────────────────────────────────────────────
async function sendSingleEmail(params: {
  to: string;
  subject: string;
  html: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const result = await resend.emails.send({
      from: `${params.fromName} <${params.fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

// ─── FONCTION PRINCIPALE : sendCampaign ───────────────────────────────────────
export async function sendCampaign(campaignId: string): Promise<void> {
  // 1. Récupérer la campagne
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { group: true },
  });

  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);
  if (campaign.status === "SENDING") throw new Error("Campaign already sending");
  if (campaign.status === "SENT") throw new Error("Campaign already sent");

  // 2. Marquer comme SENDING
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "SENDING" },
  });

  try {
    // 3. Récupérer les destinataires
    // Si groupId défini → tous les contacts du groupe actifs et non désabonnés
    // Sinon → les CampaignRecipients déjà créés (sélection manuelle)
    let recipients: { id: string; email: string; firstName?: string | null; lastName?: string | null }[] = [];

    if (campaign.groupId) {
      const contacts = await prisma.contact.findMany({
        where: {
          groupId: campaign.groupId,
          userId: campaign.userId,
          isActive: true,
          unsubscribed: false,
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      });
      recipients = contacts;

      // Créer les CampaignRecipient en bulk
      await prisma.campaignRecipient.createMany({
        data: contacts.map((c) => ({
          campaignId,
          contactId: c.id,
          email: c.email,
        })),
        skipDuplicates: true,
      });
    } else {
      // Sélection manuelle : les recipients existent déjà
      const existing = await prisma.campaignRecipient.findMany({
        where: { campaignId, sent: false },
        include: { contact: { select: { id: true, email: true, firstName: true, lastName: true } } },
      });
      recipients = existing.map((r) => r.contact);
    }

    // 4. Mettre à jour le total
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { totalRecipients: recipients.length },
    });

    let sentCount = 0;
    let failedCount = 0;

    // 5. Créer les tâches d'envoi
    // RATE LIMIT : 5 emails en parallèle, pause 200ms entre chaque batch de 10
    const CONCURRENCY = 5;
    const BATCH_SIZE = 10;
    const BATCH_DELAY_MS = 200; // 200ms entre batches → ~50 emails/sec max

    const batches: (typeof recipients)[] = [];
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      batches.push(recipients.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      const tasks = batch.map((contact) => async () => {
        const personalizedHtml = personalizeHtml(campaign.htmlContent, contact);

        const result = await sendSingleEmail({
          to: contact.email,
          subject: campaign.subject,
          html: personalizedHtml,
          fromName: campaign.fromName,
          fromEmail: campaign.fromEmail,
          replyTo: campaign.replyTo ?? undefined,
        });

        // Mettre à jour le recipient
        await prisma.campaignRecipient.updateMany({
          where: { campaignId, contactId: contact.id },
          data: {
            sent: result.success,
            sentAt: result.success ? new Date() : null,
            error: result.error ?? null,
          },
        });

        // Log
        await prisma.emailLog.create({
          data: {
            campaignId,
            email: contact.email,
            status: result.success ? "sent" : "failed",
            message: result.error ?? result.messageId ?? null,
            provider: "resend",
          },
        });

        if (result.success) sentCount++;
        else failedCount++;

        return result;
      });

      // Exécuter le batch avec concurrence limitée
      await pLimit(tasks, CONCURRENCY);

      // Pause inter-batch
      await sleep(BATCH_DELAY_MS);

      // Mise à jour progressive du compteur
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { sentCount, failedCount },
      });
    }

    // 6. Marquer la campagne comme terminée
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentCount,
        failedCount,
      },
    });
  } catch (err: unknown) {
    // Erreur globale → marquer FAILED
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "FAILED" },
    });
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[sendCampaign] Fatal error for campaign ${campaignId}:`, message);
    throw err;
  }
}

// ─── Envoi de test ────────────────────────────────────────────────────────────
export async function sendTestEmail(params: {
  to: string;
  subject: string;
  html: string;
  fromName: string;
  fromEmail: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendSingleEmail(params);
}
