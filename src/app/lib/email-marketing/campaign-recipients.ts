// src/app/lib/email-marketing/campaign-recipients.ts

import { prisma } from "@/app/lib/prisma";

type CampaignWithGroups = {
  id: string;
  userId: string;
  groupId: string | null;
  campaignGroups: {
    groupId: string;
  }[];
};

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || "";
}

export async function ensureCampaignRecipients(campaign: CampaignWithGroups) {
  const groupIds = Array.from(
    new Set([
      ...(campaign.groupId ? [campaign.groupId] : []),
      ...campaign.campaignGroups.map((item) => item.groupId),
    ])
  );

  if (groupIds.length === 0) {
    const totalRecipients = await prisma.campaignRecipient.count({
      where: {
        campaignId: campaign.id,
      },
    });

    await prisma.campaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        totalRecipients,
      },
    });

    return {
      created: 0,
      totalRecipients,
    };
  }

  const contacts = await prisma.contact.findMany({
    where: {
      userId: campaign.userId,
      isActive: true,
      unsubscribed: false,
      email: {
        not: "",
      },
      OR: [
        {
          groupId: {
            in: groupIds,
          },
        },
        {
          groupMemberships: {
            some: {
              groupId: {
                in: groupIds,
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      email: true,
    },
  });

  const uniqueContactsMap = new Map<
    string,
    {
      id: string;
      email: string;
    }
  >();

  for (const contact of contacts) {
    const email = normalizeEmail(contact.email);

    if (!email) continue;

    if (!uniqueContactsMap.has(email)) {
      uniqueContactsMap.set(email, {
        id: contact.id,
        email,
      });
    }
  }

  const uniqueContacts = Array.from(uniqueContactsMap.values());

  if (uniqueContacts.length === 0) {
    await prisma.campaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        totalRecipients: 0,
      },
    });

    return {
      created: 0,
      totalRecipients: 0,
    };
  }

  const result = await prisma.campaignRecipient.createMany({
    data: uniqueContacts.map((contact) => ({
      campaignId: campaign.id,
      contactId: contact.id,
      email: contact.email,
    })),
    skipDuplicates: true,
  });

  const totalRecipients = await prisma.campaignRecipient.count({
    where: {
      campaignId: campaign.id,
    },
  });

  await prisma.campaign.update({
    where: {
      id: campaign.id,
    },
    data: {
      totalRecipients,
    },
  });

  return {
    created: result.count,
    totalRecipients,
  };
}