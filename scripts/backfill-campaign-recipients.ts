// scripts/backfill-campaign-recipients.ts

import "dotenv/config";
import { prisma } from "../src/app/lib/prisma";
import { ensureCampaignRecipients } from "../src/app/lib/email-marketing/campaign-recipients";

async function main() {
  console.log("[backfill-campaign-recipients][START]");

  const campaigns = await prisma.campaign.findMany({
    include: {
      campaignGroups: {
        select: {
          groupId: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log("[backfill-campaign-recipients][FOUND]", {
    count: campaigns.length,
  });

  for (const campaign of campaigns) {
    const result = await ensureCampaignRecipients({
      id: campaign.id,
      userId: campaign.userId,
      groupId: campaign.groupId,
      campaignGroups: campaign.campaignGroups,
    });

    const recipients = await prisma.campaignRecipient.findMany({
      where: {
        campaignId: campaign.id,
      },
      select: {
        id: true,
        email: true,
      },
    });

    for (const recipient of recipients) {
      const log = await prisma.emailLog.findFirst({
        where: {
          campaignId: campaign.id,
          email: recipient.email,
          status: {
            in: ["SENT", "email.sent", "email.delivered"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (log) {
        await prisma.campaignRecipient.update({
          where: {
            id: recipient.id,
          },
          data: {
            sent: true,
            sentAt: log.createdAt,
            delivered: log.status === "email.delivered",
            error: null,
          },
        });
      }
    }

    const [totalRecipients, sentCount, failedCount] = await Promise.all([
      prisma.campaignRecipient.count({
        where: {
          campaignId: campaign.id,
        },
      }),

      prisma.campaignRecipient.count({
        where: {
          campaignId: campaign.id,
          sent: true,
        },
      }),

      prisma.campaignRecipient.count({
        where: {
          campaignId: campaign.id,
          error: {
            not: null,
          },
        },
      }),
    ]);

    await prisma.campaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        totalRecipients,
        sentCount,
        failedCount,
      },
    });

    console.log("[backfill-campaign-recipients][CAMPAIGN_DONE]", {
      campaignId: campaign.id,
      name: campaign.name,
      created: result.created,
      totalRecipients,
      sentCount,
      failedCount,
    });
  }

  console.log("[backfill-campaign-recipients][DONE]");
}

main()
  .catch((error) => {
    console.error("[backfill-campaign-recipients][ERROR]", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });