"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
import { prisma } from "@/app/lib/prisma";
import { publishCrmPublication } from "@/app/lib/crm-publication-publisher";

type CrmPublicationChannelInput =
  | "LINKEDIN"
  | "FACEBOOK"
  | "INDEED"
  | "EMAIL"
  | "WEBSITE"
  | "OTHER";

type CrmPublicationStatusInput =
  | "DRAFT"
  | "READY"
  | "SCHEDULED"
  | "PUBLISHED"
  | "FAILED"
  | "CANCELLED";

const CHANNELS = new Set<CrmPublicationChannelInput>([
  "LINKEDIN",
  "FACEBOOK",
  "INDEED",
  "EMAIL",
  "WEBSITE",
  "OTHER",
]);

const PUBLICATION_STATUSES = new Set<CrmPublicationStatusInput>([
  "DRAFT",
  "READY",
  "SCHEDULED",
  "PUBLISHED",
  "FAILED",
  "CANCELLED",
]);

function readText(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);

  if (typeof value !== "string") return fallback;

  return value.trim();
}

function readOptionalText(formData: FormData, key: string) {
  const value = readText(formData, key);

  return value.length > 0 ? value : null;
}

function readIds(formData: FormData, key: string) {
  return Array.from(
    new Set(
      formData
        .getAll(key)
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function parseDateTime(value: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function getUtmMedium(channel: string) {
  if (channel === "EMAIL") return "email";
  if (channel === "INDEED") return "job_board";
  if (channel === "WEBSITE") return "website";
  if (channel === "LINKEDIN" || channel === "FACEBOOK") return "social";

  return "referral";
}

function toChannel(value: string): CrmPublicationChannelInput {
  const normalized = value.toUpperCase();

  return CHANNELS.has(normalized as CrmPublicationChannelInput)
    ? (normalized as CrmPublicationChannelInput)
    : "OTHER";
}

function readChannels(formData: FormData): CrmPublicationChannelInput[] {
  const selectedChannels = formData.getAll("channels");

  const values =
    selectedChannels.length > 0 ? selectedChannels : [formData.get("channel")];

  const channels = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => toChannel(value))
    .filter((value) => value !== "OTHER");

  const uniqueChannels = Array.from(new Set(channels));

  return uniqueChannels.length > 0 ? uniqueChannels : ["LINKEDIN"];
}

function toPublicationStatus(value: string) {
  const normalized = value.toUpperCase();

  return PUBLICATION_STATUSES.has(normalized as CrmPublicationStatusInput)
    ? (normalized as CrmPublicationStatusInput)
    : null;
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

async function createUniqueSlug(name: string, channel: string) {
  const base = slugify(`${channel}-${name}`) || "crm-campaign";

  for (let index = 0; index < 8; index += 1) {
    const suffix =
      index === 0
        ? Math.random().toString(36).slice(2, 7)
        : `${Math.random().toString(36).slice(2, 7)}-${index}`;

    const slug = `${base}-${suffix}`.slice(0, 72);

    const existing = await prisma.crmTrackedLink.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!existing) return slug;
  }

  return `${base}-${Date.now().toString(36)}`.slice(0, 72);
}

export async function createCrmMarketingCampaign(formData: FormData) {
  const userId = await getCrmOwnerUserId();

  const name = readText(formData, "name");
  const objective = readOptionalText(formData, "objective");
  const audience = readOptionalText(formData, "audience");
  const publicationTitle = readText(formData, "publicationTitle");
  const content = readText(formData, "content");
  const destinationUrl = readText(
    formData,
    "destinationUrl",
    "/contact-commercial"
  );
  const ctaLabel = readOptionalText(formData, "ctaLabel");
  const emailCampaignId = readOptionalText(formData, "emailCampaignId");
  const scheduledAt = parseDateTime(readOptionalText(formData, "scheduledAt"));
  const channels = readChannels(formData);

  if (!name || !publicationTitle || !content || !destinationUrl) {
    throw new Error("Nom, publication, contenu et lien cible sont requis.");
  }

  const selectedEmailCampaign = emailCampaignId
    ? await prisma.campaign.findFirst({
        where: {
          id: emailCampaignId,
          userId,
        },
        select: {
          id: true,
        },
      })
    : null;

  const publicationStatus = scheduledAt ? "SCHEDULED" : "DRAFT";
  const utmCampaign = slugify(name) || "crm-campaign";

  const publicationPlans = await Promise.all(
    channels.map(async (channel) => ({
      channel,
      slug: await createUniqueSlug(name, channel),
      utmContent:
        slugify(`${publicationTitle}-${channel}`) || channel.toLowerCase(),
    }))
  );

  await prisma.$transaction(async (tx) => {
    const campaign = await tx.crmMarketingCampaign.create({
      data: {
        name,
        objective,
        audience,
        status: scheduledAt ? "ACTIVE" : "DRAFT",
        emailCampaignId: selectedEmailCampaign?.id || null,
        userId,
      },
      select: {
        id: true,
      },
    });

    for (const publicationPlan of publicationPlans) {
      const trackedLink = await tx.crmTrackedLink.create({
        data: {
          slug: publicationPlan.slug,
          label: `${publicationTitle} - ${publicationPlan.channel}`,
          destinationUrl,
          utmSource: publicationPlan.channel.toLowerCase(),
          utmMedium: getUtmMedium(publicationPlan.channel),
          utmCampaign,
          utmContent: publicationPlan.utmContent,
          campaignId: campaign.id,
          userId,
        },
        select: {
          id: true,
        },
      });

      await tx.crmPublication.create({
        data: {
          campaignId: campaign.id,
          trackedLinkId: trackedLink.id,
          userId,
          channel: publicationPlan.channel,
          title: publicationTitle,
          content,
          ctaLabel,
          targetUrl: destinationUrl,
          scheduledAt,
          status: publicationStatus,
        },
      });
    }

    await tx.crmActivity.create({
      data: {
        type: "CAMPAIGN",
        title: `Campagne marketing creee: ${name}`,
        description:
          objective ||
          `Publications preparees sur ${publicationPlans.length} canal(aux).`,
        metadata: {
          campaignId: campaign.id,
          channels: publicationPlans.map((plan) => plan.channel),
          trackedSlugs: publicationPlans.map((plan) => plan.slug),
        },
        userId,
      },
    });
  });

  revalidatePath("/admin/crm/campaigns");
  revalidatePath("/admin/crm");
}

export async function publishCrmPublicationNow(formData: FormData) {
  const userId = await getCrmOwnerUserId();
  const publicationId = readText(formData, "publicationId");

  if (!publicationId) {
    throw new Error("Publication invalide.");
  }

  const publication = await prisma.crmPublication.findFirst({
    where: {
      id: publicationId,
      userId,
    },
    include: {
      trackedLink: {
        select: {
          slug: true,
          destinationUrl: true,
        },
      },
    },
  });

  if (!publication) {
    throw new Error("Publication introuvable.");
  }

  if (!publication.trackedLink) {
    throw new Error("Lien suivi introuvable pour cette publication.");
  }

  if (
    publication.channel !== "LINKEDIN" &&
    publication.channel !== "FACEBOOK"
  ) {
    throw new Error(
      `Publication automatique non disponible pour ${publication.channel}.`
    );
  }

  const trackedUrl = `${getSiteUrl()}/r/${publication.trackedLink.slug}`;

  let redirectStatus: "success" | "failed" = "success";

  try {
    const result = await publishCrmPublication({
      publicationId: publication.id,
      channel: publication.channel,
      title: publication.title,
      content: publication.content,
      ctaLabel: publication.ctaLabel,
      trackedUrl,
      userId,
    });

    await prisma.$transaction(async (tx) => {
      await tx.crmPublication.update({
        where: {
          id: publication.id,
        },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          providerPostId: result.externalId || null,
          providerUrl: result.externalUrl || null,
          failureReason: null,
        },
      });

      await tx.crmMarketingCampaign.update({
        where: {
          id: publication.campaignId,
        },
        data: {
          status: "ACTIVE",
        },
      });

      await tx.crmActivity.create({
        data: {
          type: "CAMPAIGN",
          title: `Publication ${publication.channel.toLowerCase()} publiee`,
          description: publication.title,
          metadata: {
            publicationId: publication.id,
            campaignId: publication.campaignId,
            channel: publication.channel,
            trackedUrl,
            externalId: result.externalId || null,
            externalUrl: result.externalUrl || null,
          },
          userId,
        },
      });
    });
  } catch (error) {
    redirectStatus = "failed";

    const failureReason =
      error instanceof Error ? error.message : "Erreur inconnue.";

    await prisma.$transaction(async (tx) => {
      await tx.crmPublication.update({
        where: {
          id: publication.id,
        },
        data: {
          status: "FAILED",
          failureReason,
        },
      });

      await tx.crmActivity.create({
        data: {
          type: "CAMPAIGN",
          title: `Echec publication ${publication.channel.toLowerCase()}`,
          description: failureReason,
          metadata: {
            publicationId: publication.id,
            campaignId: publication.campaignId,
            channel: publication.channel,
          },
          userId,
        },
      });
    });
  }

  revalidatePath("/admin/crm/campaigns");
  revalidatePath("/admin/crm");

  const params = new URLSearchParams();

  params.set("publish", redirectStatus);
  params.set("channel", publication.channel);
  params.set("title", publication.title);

  redirect(`/admin/crm/campaigns?${params.toString()}`);
}

export async function updateCrmPublicationStatus(formData: FormData) {
  const userId = await getCrmOwnerUserId();
  const publicationId = readText(formData, "publicationId");
  const nextStatus = toPublicationStatus(readText(formData, "status"));

  if (!publicationId || !nextStatus) {
    throw new Error("Statut de publication invalide.");
  }

  const publication = await prisma.crmPublication.findFirst({
    where: {
      id: publicationId,
      userId,
    },
    select: {
      id: true,
      campaignId: true,
      title: true,
      channel: true,
    },
  });

  if (!publication) {
    throw new Error("Publication introuvable.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.crmPublication.update({
      where: {
        id: publication.id,
      },
      data: {
        status: nextStatus,
        publishedAt: nextStatus === "PUBLISHED" ? new Date() : undefined,
      },
    });

    if (nextStatus === "PUBLISHED") {
      await tx.crmMarketingCampaign.update({
        where: {
          id: publication.campaignId,
        },
        data: {
          status: "ACTIVE",
        },
      });
    }

    await tx.crmActivity.create({
      data: {
        type: "CAMPAIGN",
        title: `Publication ${publication.channel.toLowerCase()} ${nextStatus.toLowerCase()}`,
        description: publication.title,
        metadata: {
          publicationId: publication.id,
          campaignId: publication.campaignId,
          status: nextStatus,
        },
        userId,
      },
    });
  });

  revalidatePath("/admin/crm/campaigns");
  revalidatePath("/admin/crm");
}

export async function deleteCrmMarketingCampaign(formData: FormData) {
  const userId = await getCrmOwnerUserId();
  const campaignId = readText(formData, "campaignId");

  if (!campaignId) {
    throw new Error("Campagne invalide.");
  }

  const campaign = await prisma.crmMarketingCampaign.findFirst({
    where: {
      id: campaignId,
      userId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!campaign) {
    throw new Error("Campagne introuvable.");
  }

  const trackedLinks = await prisma.crmTrackedLink.findMany({
    where: {
      campaignId: campaign.id,
      userId,
    },
    select: {
      id: true,
    },
  });

  const trackedLinkIds = trackedLinks.map((link) => link.id);

  await prisma.$transaction(async (tx) => {
    if (trackedLinkIds.length > 0) {
      await tx.crmTrackedLinkClick.deleteMany({
        where: {
          linkId: {
            in: trackedLinkIds,
          },
        },
      });
    }

    await tx.crmPublication.deleteMany({
      where: {
        campaignId: campaign.id,
        userId,
      },
    });

    await tx.crmTrackedLink.deleteMany({
      where: {
        campaignId: campaign.id,
        userId,
      },
    });

    await tx.crmMarketingCampaign.delete({
      where: {
        id: campaign.id,
      },
    });

    await tx.crmActivity.create({
      data: {
        type: "CAMPAIGN",
        title: `Campagne marketing supprimee: ${campaign.name}`,
        description:
          "Campagne, publications, liens suivis et clics associes supprimes.",
        metadata: {
          deletedCampaignId: campaign.id,
          deletedCampaignName: campaign.name,
          trackedLinkCount: trackedLinkIds.length,
        },
        userId,
      },
    });
  });

  revalidatePath("/admin/crm/campaigns");
  revalidatePath("/admin/crm");
}

export async function deleteSelectedCrmMarketingCampaigns(formData: FormData) {
  const userId = await getCrmOwnerUserId();
  const campaignIds = readIds(formData, "campaignIds");

  if (campaignIds.length === 0) {
    throw new Error("Aucune campagne selectionnee.");
  }

  const campaigns = await prisma.crmMarketingCampaign.findMany({
    where: {
      id: {
        in: campaignIds,
      },
      userId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (campaigns.length === 0) {
    throw new Error("Aucune campagne valide a supprimer.");
  }

  const authorizedCampaignIds = campaigns.map((campaign) => campaign.id);

  const trackedLinks = await prisma.crmTrackedLink.findMany({
    where: {
      campaignId: {
        in: authorizedCampaignIds,
      },
      userId,
    },
    select: {
      id: true,
    },
  });

  const trackedLinkIds = trackedLinks.map((link) => link.id);

  await prisma.$transaction(async (tx) => {
    if (trackedLinkIds.length > 0) {
      await tx.crmTrackedLinkClick.deleteMany({
        where: {
          linkId: {
            in: trackedLinkIds,
          },
        },
      });
    }

    await tx.crmPublication.deleteMany({
      where: {
        campaignId: {
          in: authorizedCampaignIds,
        },
        userId,
      },
    });

    await tx.crmTrackedLink.deleteMany({
      where: {
        campaignId: {
          in: authorizedCampaignIds,
        },
        userId,
      },
    });

    await tx.crmMarketingCampaign.deleteMany({
      where: {
        id: {
          in: authorizedCampaignIds,
        },
        userId,
      },
    });

    await tx.crmActivity.create({
      data: {
        type: "CAMPAIGN",
        title: `${campaigns.length} campagne(s) marketing supprimee(s)`,
        description: campaigns.map((campaign) => campaign.name).join(", "),
        metadata: {
          deletedCampaignIds: authorizedCampaignIds,
          deletedCampaignNames: campaigns.map((campaign) => campaign.name),
          trackedLinkCount: trackedLinkIds.length,
        },
        userId,
      },
    });
  });

  revalidatePath("/admin/crm/campaigns");
  revalidatePath("/admin/crm");
}