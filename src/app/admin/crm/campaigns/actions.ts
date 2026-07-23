"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
import { prisma } from "@/app/lib/prisma";
import { requirePermission } from "@/(permisionGuard)/lib/permissions";
import { processDueCrmPublications } from "@/app/lib/crm-publication-cron";
import { publishCrmPublication } from "@/app/lib/crm-publication-publisher";
import {
  createCrmPublicationLog,
  getErrorMessage,
  getErrorPayload,
} from "@/app/lib/crm-publication-log";

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
    .map((value) => toChannel(value));

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

function isAutomaticChannel(channel: string) {
  return channel === "LINKEDIN" || channel === "FACEBOOK";
}

function canPublishNow(status: string) {
  return ["DRAFT", "READY", "SCHEDULED", "FAILED"].includes(status);
}

function calculateNextRetryAt(retryCount: number) {
  const minutesByAttempt = [5, 15, 60, 180, 720];
  const minutes =
    minutesByAttempt[Math.min(retryCount - 1, minutesByAttempt.length - 1)] ||
    720;

  return new Date(Date.now() + minutes * 60 * 1000);
}

function redirectWithPublishStatus({
  status,
  channel,
  title,
}: {
  status: "success" | "failed" | "skipped";
  channel: string;
  title: string;
}): never {
  const params = new URLSearchParams();

  params.set("publish", status);
  params.set("channel", channel);
  params.set("title", title);

  redirect(`/admin/crm/campaigns?${params.toString()}`);
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
  await requirePermission("crm_campaigns", "canCreate");
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

      const publication = await tx.crmPublication.create({
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
        select: {
          id: true,
          channel: true,
        },
      });

      await tx.crmPublicationLog.create({
        data: {
          publicationId: publication.id,
          campaignId: campaign.id,
          userId,
          channel: publication.channel,
          action: "CREATE_PUBLICATION",
          status: publicationStatus,
          message: scheduledAt
            ? "Publication planifiée."
            : "Publication créée en brouillon.",
          metadata: {
            trackedLinkId: trackedLink.id,
            slug: publicationPlan.slug,
            destinationUrl,
            utmCampaign,
            utmContent: publicationPlan.utmContent,
          },
        },
      });
    }

    await tx.crmActivity.create({
      data: {
        type: "CAMPAIGN",
        title: `Campagne marketing créée: ${name}`,
        description:
          objective ||
          `Publications préparées sur ${publicationPlans.length} canal(aux).`,
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
  await requirePermission("crm_campaigns", "canExecute");
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

  if (!isAutomaticChannel(publication.channel)) {
    throw new Error(
      `Publication automatique non disponible pour ${publication.channel}.`
    );
  }

  if (!canPublishNow(publication.status)) {
    redirectWithPublishStatus({
      status: "skipped",
      channel: publication.channel,
      title: publication.title,
    });
  }

  const lockToken = randomUUID();
  const now = new Date();
  const attempt = publication.retryCount + 1;

  const reserved = await prisma.crmPublication.updateMany({
    where: {
      id: publication.id,
      userId,
      status: {
        in: ["DRAFT", "READY", "SCHEDULED", "FAILED"],
      },
    },
    data: {
      status: "PUBLISHING",
      lockedAt: now,
      lockToken,
      lastAttemptAt: now,
      failureReason: null,
    },
  });

  if (reserved.count === 0) {
    redirectWithPublishStatus({
      status: "skipped",
      channel: publication.channel,
      title: publication.title,
    });
  }

  const trackedUrl = `${getSiteUrl()}/r/${publication.trackedLink.slug}`;

  await createCrmPublicationLog({
    publicationId: publication.id,
    campaignId: publication.campaignId,
    userId,
    channel: publication.channel,
    action: "PUBLISH_START",
    status: "PUBLISHING",
    attempt,
    requestPayload: {
      publicationId: publication.id,
      channel: publication.channel,
      title: publication.title,
      trackedUrl,
      manual: true,
    },
  });

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
      await tx.crmPublication.updateMany({
        where: {
          id: publication.id,
          userId,
          status: "PUBLISHING",
          lockToken,
        },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          providerPostId: result.externalId || null,
          providerUrl: result.externalUrl || null,
          failureReason: null,
          nextRetryAt: null,
          lockedAt: null,
          lockToken: null,
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
          title: `Publication ${publication.channel.toLowerCase()} publiée`,
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

    await createCrmPublicationLog({
      publicationId: publication.id,
      campaignId: publication.campaignId,
      userId,
      channel: publication.channel,
      action: "PUBLISH_SUCCESS",
      status: "PUBLISHED",
      attempt,
      message: "Publication envoyée avec succès.",
      providerResponse: {
        externalId: result.externalId || null,
        externalUrl: result.externalUrl || null,
      },
    });
  } catch (error) {
    redirectStatus = "failed";

    const failureReason = getErrorMessage(error);
    const nextRetryCount = publication.retryCount + 1;
    const shouldRetry = nextRetryCount < publication.maxRetries;
    const nextRetryAt = shouldRetry
      ? calculateNextRetryAt(nextRetryCount)
      : null;

    await prisma.$transaction(async (tx) => {
      await tx.crmPublication.updateMany({
        where: {
          id: publication.id,
          userId,
          status: "PUBLISHING",
          lockToken,
        },
        data: {
          status: "FAILED",
          failureReason,
          retryCount: {
            increment: 1,
          },
          nextRetryAt,
          lockedAt: null,
          lockToken: null,
        },
      });

      await tx.crmActivity.create({
        data: {
          type: "CAMPAIGN",
          title: `Échec publication ${publication.channel.toLowerCase()}`,
          description: failureReason,
          metadata: {
            publicationId: publication.id,
            campaignId: publication.campaignId,
            channel: publication.channel,
            retryCount: nextRetryCount,
            maxRetries: publication.maxRetries,
            nextRetryAt: nextRetryAt?.toISOString() || null,
          },
          userId,
        },
      });
    });

    await createCrmPublicationLog({
      publicationId: publication.id,
      campaignId: publication.campaignId,
      userId,
      channel: publication.channel,
      action: "PUBLISH_FAILED",
      status: "FAILED",
      attempt,
      error: failureReason,
      providerResponse: getErrorPayload(error),
      metadata: {
        retryCount: nextRetryCount,
        maxRetries: publication.maxRetries,
        nextRetryAt: nextRetryAt?.toISOString() || null,
        willRetry: shouldRetry,
      },
    });
  }

  revalidatePath("/admin/crm/campaigns");
  revalidatePath("/admin/crm");

  redirectWithPublishStatus({
    status: redirectStatus,
    channel: publication.channel,
    title: publication.title,
  });
}

export async function processCrmPublicationQueue(formData: FormData) {
  await requirePermission("crm_campaigns", "canExecute");
  const userId = await getCrmOwnerUserId();
  const rawLimit = Number(readText(formData, "limit", "20"));
  const limit = Number.isFinite(rawLimit)
    ? Math.min(50, Math.max(1, Math.trunc(rawLimit)))
    : 20;

  const params = new URLSearchParams();

  try {
    const result = await processDueCrmPublications({ limit, userId });

    params.set("queue", "success");
    params.set("checked", String(result.checked));
    params.set("published", String(result.published));
    params.set("manualReady", String(result.manualReady));
    params.set("failed", String(result.failed));
    params.set("skipped", String(result.skipped));
  } catch (error) {
    params.set("queue", "failed");
    params.set("message", getErrorMessage(error));
  }

  revalidatePath("/admin/crm/campaigns");
  revalidatePath("/admin/crm");

  redirect(`/admin/crm/campaigns?${params.toString()}`);
}

export async function updateCrmPublicationStatus(formData: FormData) {
  await requirePermission("crm_campaigns", "canUpdate");
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
      retryCount: true,
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
        failureReason:
          nextStatus === "READY" || nextStatus === "DRAFT"
            ? null
            : undefined,
        nextRetryAt:
          nextStatus === "READY" ||
          nextStatus === "DRAFT" ||
          nextStatus === "CANCELLED" ||
          nextStatus === "PUBLISHED"
            ? null
            : undefined,
        lockedAt: null,
        lockToken: null,
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

    await tx.crmPublicationLog.create({
      data: {
        publicationId: publication.id,
        campaignId: publication.campaignId,
        userId,
        channel: publication.channel,
        action: "STATUS_CHANGE",
        status: nextStatus,
        message: `Statut modifié manuellement vers ${nextStatus}.`,
        attempt: Math.max(1, publication.retryCount + 1),
      },
    });
  });

  revalidatePath("/admin/crm/campaigns");
  revalidatePath("/admin/crm");
}

export async function deleteCrmMarketingCampaign(formData: FormData) {
  await requirePermission("crm_campaigns", "canDelete");
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
        title: `Campagne marketing supprimée: ${campaign.name}`,
        description:
          "Campagne, publications, liens suivis et clics associés supprimés.",
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
  await requirePermission("crm_campaigns", "canDelete");
  const userId = await getCrmOwnerUserId();
  const campaignIds = readIds(formData, "campaignIds");

  if (campaignIds.length === 0) {
    throw new Error("Aucune campagne sélectionnée.");
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
    throw new Error("Aucune campagne valide à supprimer.");
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
        title: `${campaigns.length} campagne(s) marketing supprimée(s)`,
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
