"use server";

import { revalidatePath } from "next/cache";

import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
import { prisma } from "@/app/lib/prisma";

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