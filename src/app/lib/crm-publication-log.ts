// src/app/lib/crm-publication-log.ts

import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/app/lib/prisma";

type CrmPublicationChannelValue =
  | "LINKEDIN"
  | "FACEBOOK"
  | "INDEED"
  | "EMAIL"
  | "WEBSITE"
  | "OTHER";

type CreateCrmPublicationLogInput = {
  publicationId?: string | null;
  campaignId?: string | null;
  userId: string;
  channel?: CrmPublicationChannelValue | null;
  action: string;
  status: string;
  message?: string | null;
  error?: string | null;
  attempt?: number;
  requestPayload?: Prisma.InputJsonValue | null;
  providerResponse?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue | null;
};

export async function createCrmPublicationLog({
  publicationId,
  campaignId,
  userId,
  channel,
  action,
  status,
  message,
  error,
  attempt = 1,
  requestPayload,
  providerResponse,
  metadata,
}: CreateCrmPublicationLogInput) {
  try {
    await prisma.crmPublicationLog.create({
      data: {
        publicationId: publicationId || null,
        campaignId: campaignId || null,
        userId,
        channel: channel || null,
        action,
        status,
        message: message || null,
        error: error || null,
        attempt,
        requestPayload: requestPayload ?? undefined,
        providerResponse: providerResponse ?? undefined,
        metadata: metadata ?? undefined,
      },
    });
  } catch (logError) {
    console.error("[crm-publication-log][CREATE_ERROR]", {
      action,
      status,
      publicationId,
      campaignId,
      userId,
      error: logError,
    });
  }
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur inconnue.";
}

export function getErrorPayload(error: unknown): Prisma.InputJsonValue {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack || null,
    };
  }

  return {
    message: String(error || "Erreur inconnue."),
  };
}