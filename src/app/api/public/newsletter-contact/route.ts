// src/app/api/public/newsletter-contact/route.ts

import { NextRequest, NextResponse } from "next/server";

        import { Prisma } from '../../../../generated/prisma/client'

import { z } from "zod";

import { prisma } from "@/app/lib/prisma";
import { getCrmOwnerUserId } from "@/app/lib/crm-owner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const newsletterContactSchema = z.object({
  email: z.string().trim().max(254, "Email trop long").email("Email invalide"),

  pageUrl: z.string().trim().max(1000).optional().nullable(),

  source: z.string().trim().max(120).optional().nullable(),

  website: z.string().trim().max(200).optional().nullable(),

  submittedAt: z.coerce.number().int().positive().optional().nullable(),

  location: z
    .object({
      latitude: z.number().min(-90).max(90).optional().nullable(),
      longitude: z.number().min(-180).max(180).optional().nullable(),
      accuracy: z.number().min(0).max(100000).optional().nullable(),
    })
    .optional()
    .nullable(),
});

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const MAX_CONTENT_LENGTH = 10_000;
const MIN_SUBMIT_DELAY_MS = 1_200;
const MAX_SUBMIT_AGE_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 6;

const globalForNewsletterSecurity = globalThis as unknown as {
  publicNewsletterRateLimit?: Map<string, RateLimitBucket>;
};

const rateLimitStore =
  globalForNewsletterSecurity.publicNewsletterRateLimit ??
  new Map<string, RateLimitBucket>();

globalForNewsletterSecurity.publicNewsletterRateLimit = rateLimitStore;

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getAllowedOrigins() {
  const envOrigins = process.env.PUBLIC_ALLOWED_ORIGINS
    ? process.env.PUBLIC_ALLOWED_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

  return [
    ...envOrigins,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_URL,
    process.env.SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.2:3000",
  ]
    .filter(Boolean)
    .map((origin) => String(origin).replace(/\/$/, ""));
}

function getRequestOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) {
    return origin.replace(/\/$/, "");
  }

  if (referer) {
    try {
      return new URL(referer).origin.replace(/\/$/, "");
    } catch {
      return "";
    }
  }

  return "";
}

function isAllowedOrigin(request: NextRequest) {
  const requestOrigin = getRequestOrigin(request);

  if (!requestOrigin) {
    return true;
  }

  return getAllowedOrigins().includes(requestOrigin);
}

function checkRateLimit(key: string) {
  const now = Date.now();

  for (const [storedKey, record] of rateLimitStore.entries()) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(storedKey);
    }
  }

  const record = rateLimitStore.get(key);

  if (!record || record.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count += 1;
  rateLimitStore.set(key, record);

  return true;
}

function validateSubmissionTiming(submittedAt?: number | null) {
  if (!submittedAt) {
    return "Session du formulaire invalide.";
  }

  const elapsed = Date.now() - submittedAt;

  if (elapsed < MIN_SUBMIT_DELAY_MS) {
    return "Envoi trop rapide. Veuillez réessayer.";
  }

  if (elapsed > MAX_SUBMIT_AGE_MS) {
    return "Session expirée. Veuillez recharger la page.";
  }

  return null;
}

function titleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function inferContactFromEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const [rawLocal = "", rawDomain = ""] = normalizedEmail.split("@");

  const local = rawLocal.split("+")[0] || rawLocal;
  const domain = rawDomain.toLowerCase();

  const nameParts = local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^\d+$/.test(part));

  const firstName = nameParts[0] ? titleCase(nameParts[0]) : null;

  const lastName =
    nameParts.length > 1 ? titleCase(nameParts.slice(1).join(" ")) : null;

  const publicDomains = new Set([
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.fr",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "live.com",
    "msn.com",
    "proton.me",
    "protonmail.com",
    "orange.fr",
    "laposte.net",
    "free.fr",
    "wanadoo.fr",
  ]);

  const domainRoot = domain.split(".")[0] || "";

  const companyName =
    domain && !publicDomains.has(domain) && domainRoot
      ? titleCase(domainRoot.replace(/[._-]+/g, " "))
      : null;

  return {
    email: normalizedEmail,
    firstName,
    lastName,
    companyName,
    inferredFromDomain: domain,
  };
}

async function getDefaultCrmStatusOptionId(userId: string) {
  const defaultStatus = await prisma.crmStatusOption.findFirst({
    where: {
      userId,
      isActive: true,
      isDefault: true,
    },
    select: {
      id: true,
    },
  });

  if (defaultStatus) {
    return defaultStatus.id;
  }

  const newStatus = await prisma.crmStatusOption.findFirst({
    where: {
      userId,
      isActive: true,
      key: "NEW",
    },
    select: {
      id: true,
    },
  });

  return newStatus?.id || null;
}

function buildMetadata({
  existingMetadata,
  source,
  pageUrl,
  location,
  inferred,
  date,
}: {
  existingMetadata: unknown;
  source: string;
  pageUrl: string | null;
  location:
    | {
        latitude?: number | null;
        longitude?: number | null;
        accuracy?: number | null;
      }
    | null
    | undefined;
  inferred: {
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    inferredFromDomain: string;
  };
  date: Date;
}) {
  return {
    ...(isPlainObject(existingMetadata) ? existingMetadata : {}),

    newsletterCapture: {
      source,
      pageUrl,
      capturedAt: date.toISOString(),

      inferredFromEmail: {
        firstName: inferred.firstName,
        lastName: inferred.lastName,
        companyName: inferred.companyName,
        domain: inferred.inferredFromDomain,
      },

      visitorLocation: location
        ? {
            latitude: location.latitude ?? null,
            longitude: location.longitude ?? null,
            accuracy: location.accuracy ?? null,
          }
        : null,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    if (!isAllowedOrigin(req)) {
      return NextResponse.json(
        {
          success: false,
          error: "Origine de la requête non autorisée.",
        },
        { status: 403 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          error: "Format de requête invalide.",
        },
        { status: 415 }
      );
    }

    const contentLength = Number(req.headers.get("content-length") || 0);

    if (contentLength > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: "La requête est trop volumineuse.",
        },
        { status: 413 }
      );
    }

    const ipAddress = getClientIp(req);

    if (!checkRateLimit(`newsletter:ip:${ipAddress}`)) {
      return NextResponse.json(
        {
          success: false,
          error: "Trop de tentatives. Veuillez patienter avant de réessayer.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    const parsed = newsletterContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    if (parsed.data.website?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Demande refusée.",
        },
        { status: 400 }
      );
    }

    const timingError = validateSubmissionTiming(parsed.data.submittedAt);

    if (timingError) {
      return NextResponse.json(
        {
          success: false,
          error: timingError,
        },
        { status: timingError.includes("rapide") ? 429 : 400 }
      );
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();

    if (!checkRateLimit(`newsletter:email:${ipAddress}:${normalizedEmail}`)) {
      return NextResponse.json(
        {
          success: false,
          error: "Trop de tentatives pour cet email.",
        },
        { status: 429 }
      );
    }

    const userId = await getCrmOwnerUserId();

    const source = parsed.data.source || "PUBLIC_FOOTER_NEWSLETTER";
    const pageUrl = parsed.data.pageUrl || null;
    const now = new Date();

    const inferred = inferContactFromEmail(normalizedEmail);

    const crmStatusOptionId = await getDefaultCrmStatusOptionId(userId);

    const existingContact = await prisma.contact.findUnique({
      where: {
        email_userId: {
          email: inferred.email,
          userId,
        },
      },
      select: {
        id: true,
        email: true,

        firstName: true,
        lastName: true,
        phone: true,

        jobTitle: true,
        companyName: true,
        country: true,
        city: true,
        notes: true,

        metadata: true,

        groupId: true,
        crmCompanyId: true,

        crmStatus: true,
        crmStatusOptionId: true,
        crmSource: true,

        isActive: true,
        unsubscribed: true,

        createdAt: true,
        updatedAt: true,
      },
    });

    const metadata = buildMetadata({
      existingMetadata: existingContact?.metadata,
      source,
      pageUrl,
      location: parsed.data.location,
      inferred,
      date: now,
    });

    const contact = existingContact
      ? await prisma.contact.update({
          where: {
            id: existingContact.id,
          },
          data: {
            firstName: existingContact.firstName || inferred.firstName,
            lastName: existingContact.lastName || inferred.lastName,
            companyName: existingContact.companyName || inferred.companyName,

            crmSource: "WEBSITE",

            crmStatusOptionId:
              existingContact.crmStatusOptionId || crmStatusOptionId,

            isActive: true,
            unsubscribed: false,

            consentDate: now,
            consentSource: source,

            metadata: metadata as Prisma.InputJsonValue,
          },
          include: {
            group: true,
            crmCompany: true,
            crmStatusOption: {
              select: {
                id: true,
                key: true,
                label: true,
                color: true,
                description: true,
                sortOrder: true,
                isDefault: true,
                isActive: true,
              },
            },
          },
        })
      : await prisma.contact.create({
          data: {
            userId,

            email: inferred.email,

            firstName: inferred.firstName,
            lastName: inferred.lastName,
            companyName: inferred.companyName,

            crmStatus: "NEW",
            crmStatusOptionId,
            crmSource: "WEBSITE",

            isActive: true,
            unsubscribed: false,

            consentDate: now,
            consentSource: source,

            metadata: metadata as Prisma.InputJsonValue,
          },
          include: {
            group: true,
            crmCompany: true,
            crmStatusOption: {
              select: {
                id: true,
                key: true,
                label: true,
                color: true,
                description: true,
                sortOrder: true,
                isDefault: true,
                isActive: true,
              },
            },
          },
        });

    return NextResponse.json({
      success: true,
      created: !existingContact,
      message: !existingContact
        ? "Votre email a bien été ajouté au CRM MD2I."
        : "Ce contact existe déjà. Ses informations ont été mises à jour.",
      contact: {
        id: contact.id,
        email: contact.email,

        firstName: contact.firstName,
        lastName: contact.lastName,
        companyName: contact.companyName,

        crmStatus: contact.crmStatus,
        crmStatusOption: contact.crmStatusOption,
        crmSource: contact.crmSource,

        isActive: contact.isActive,
        unsubscribed: contact.unsubscribed,
      },
    });
  } catch (error) {
    console.error("[public-newsletter-contact][ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur pendant l’ajout ou la mise à jour du contact.",
      },
      { status: 500 }
    );
  }
}
