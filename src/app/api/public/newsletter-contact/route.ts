// src/app/api/public/newsletter-contact/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/app/lib/prisma";
import { getCrmOwnerUserId } from "@/app/lib/crm-owner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const newsletterContactSchema = z.object({
  email: z.string().trim().email("Email invalide"),

  pageUrl: z.string().trim().optional().nullable(),

  source: z.string().trim().optional().nullable(),

  location: z
    .object({
      latitude: z.number().optional().nullable(),
      longitude: z.number().optional().nullable(),
      accuracy: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),
});

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

    const userId = await getCrmOwnerUserId();

    const source = parsed.data.source || "PUBLIC_FOOTER_NEWSLETTER";
    const pageUrl = parsed.data.pageUrl || null;
    const now = new Date();

    const inferred = inferContactFromEmail(parsed.data.email);

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

            metadata: metadata as any,
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

            metadata: metadata as any,
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