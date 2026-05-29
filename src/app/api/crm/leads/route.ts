import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/app/lib/prisma";
import { getCrmOwnerUserId } from "@/app/lib/crm-owner";

type CrmLeadSourceValue =
  | "WEBSITE"
  | "FACEBOOK"
  | "LINKEDIN"
  | "EMAIL_CAMPAIGN"
  | "GOOGLE"
  | "DIRECT"
  | "TENDER"
  | "REFERRAL"
  | "MANUAL"
  | "OTHER";

type CrmRequestTypeValue =
  | "DEMO"
  | "QUOTE"
  | "CONTACT"
  | "CALLBACK"
  | "INFO"
  | "SUPPORT"
  | "TRAINING"
  | "MAINTENANCE"
  | "TENDER"
  | "OTHER";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MIN_SUBMIT_DELAY_MS = 1_800;
const MAX_SUBMIT_AGE_MS = 1000 * 60 * 60 * 24;
const MAX_CONTENT_LENGTH = 32_000;
const MAX_MESSAGE_LINKS = 3;

const globalForRateLimit = globalThis as unknown as {
  crmLeadRateLimit?: Map<string, RateLimitBucket>;
};

const rateLimitStore =
  globalForRateLimit.crmLeadRateLimit ?? new Map<string, RateLimitBucket>();

globalForRateLimit.crmLeadRateLimit = rateLimitStore;

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} est trop long.`).optional().or(z.literal(""));

const leadSchema = z.object({
  firstName: optionalText(100, "Le prénom"),
  lastName: optionalText(100, "Le nom"),
  email: z
    .string()
    .trim()
    .min(1, "Email requis.")
    .max(254, "Email trop long.")
    .email("Email invalide."),
  phone: optionalText(40, "Le téléphone"),
  jobTitle: optionalText(150, "La fonction"),

  companyName: optionalText(200, "Le nom de l'entreprise"),
  companyType: z
    .enum([
      "COMPANY",
      "NGO",
      "PROJECT",
      "ADMINISTRATION",
      "DONOR",
      "PARTNER",
      "SUPPLIER",
      "OTHER",
    ])
    .optional(),

  country: optionalText(100, "Le pays"),
  city: optionalText(100, "La ville"),

  productId: optionalText(80, "L'identifiant produit"),
  productSlug: optionalText(180, "Le slug produit"),
  productNameFallback: optionalText(200, "Le nom du produit"),

  offerId: optionalText(80, "L'identifiant offre"),

  requestType: z
    .enum([
      "DEMO",
      "QUOTE",
      "CONTACT",
      "CALLBACK",
      "INFO",
      "SUPPORT",
      "TRAINING",
      "MAINTENANCE",
      "TENDER",
      "OTHER",
    ])
    .default("CONTACT"),

  message: optionalText(3000, "Le message"),

  source: z
    .enum([
      "WEBSITE",
      "FACEBOOK",
      "LINKEDIN",
      "EMAIL_CAMPAIGN",
      "GOOGLE",
      "DIRECT",
      "TENDER",
      "REFERRAL",
      "MANUAL",
      "OTHER",
    ])
    .default("WEBSITE"),

  utmSource: optionalText(160, "utmSource"),
  utmMedium: optionalText(160, "utmMedium"),
  utmCampaign: optionalText(220, "utmCampaign"),
  utmContent: optionalText(220, "utmContent"),
  utmTerm: optionalText(220, "utmTerm"),
  trackedLinkSlug: optionalText(180, "trackedLinkSlug"),
  landingPage: optionalText(1000, "landingPage"),
  referrer: optionalText(1000, "referrer"),

  consentEmail: z.boolean().optional().default(false),

  // Sécurité anti-spam côté formulaire
  website: optionalText(200, "website"),
  submittedAt: z.coerce.number().int().positive().optional(),
});

function cleanString(value?: string | null) {
  const cleaned = String(value || "").trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getFullName(firstName?: string, lastName?: string) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function getTaskDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("cf-connecting-ip") ||
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

function getRequestOrigin(request: Request) {
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

function isAllowedOrigin(request: Request) {
  const requestOrigin = getRequestOrigin(request);

  if (!requestOrigin) {
    return true;
  }

  return getAllowedOrigins().includes(requestOrigin);
}

function checkRateLimit(key: string) {
  const now = Date.now();

  for (const [storedKey, bucket] of rateLimitStore.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitStore.delete(storedKey);
    }
  }

  const bucket = rateLimitStore.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return true;
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  bucket.count += 1;
  rateLimitStore.set(key, bucket);

  return true;
}

function countSuspiciousLinks(value: string) {
  return (
    value.match(/https?:\/\/|www\.|\.com|\.net|\.org|\.io|\.ru|\.cn/gi)
      ?.length || 0
  );
}

function resolveLeadSource(source?: string): CrmLeadSourceValue {
  const normalized = String(source || "").trim().toUpperCase();

  if (normalized === "FACEBOOK") return "FACEBOOK";
  if (normalized === "META") return "FACEBOOK";
  if (normalized === "LINKEDIN") return "LINKEDIN";
  if (normalized === "GOOGLE") return "GOOGLE";
  if (normalized === "EMAIL") return "EMAIL_CAMPAIGN";
  if (normalized === "NEWSLETTER") return "EMAIL_CAMPAIGN";
  if (normalized === "EMAIL_CAMPAIGN") return "EMAIL_CAMPAIGN";
  if (normalized === "DIRECT") return "DIRECT";
  if (normalized === "TENDER") return "TENDER";
  if (normalized === "REFERRAL") return "REFERRAL";
  if (normalized === "MANUAL") return "MANUAL";
  if (normalized === "OTHER") return "OTHER";

  return "WEBSITE";
}

async function findProduct(params: {
  productId?: string;
  productSlug?: string;
}) {
  const productId = cleanString(params.productId);
  const productSlug = cleanString(params.productSlug);

  if (productId && isUuid(productId)) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (product) return product;
  }

  if (productSlug) {
    const product = await prisma.product.findFirst({
      where: {
        slug: productSlug,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (product) return product;
  }

  return null;
}

function validateSecurity(data: z.infer<typeof leadSchema>) {
  if (data.website && data.website.trim().length > 0) {
    return {
      status: 400,
      error: "Demande refusée.",
    };
  }

  if (data.submittedAt) {
    const elapsed = Date.now() - data.submittedAt;

    if (elapsed < MIN_SUBMIT_DELAY_MS) {
      return {
        status: 429,
        error: "Envoi trop rapide. Veuillez réessayer.",
      };
    }

    if (elapsed > MAX_SUBMIT_AGE_MS) {
      return {
        status: 400,
        error: "Session de formulaire expirée. Veuillez recharger la page.",
      };
    }
  }

  if (!data.consentEmail) {
    return {
      status: 400,
      error: "Vous devez accepter d'être recontacté.",
    };
  }

  const companyName = cleanString(data.companyName);

  if (!companyName) {
    return {
      status: 400,
      error: "Le nom de l'entreprise ou organisme est requis.",
    };
  }

  const message = cleanString(data.message);

  if (!message || message.length < 12) {
    return {
      status: 400,
      error: "Veuillez décrire votre besoin avec un peu plus de détails.",
    };
  }

  if (countSuspiciousLinks(message) > MAX_MESSAGE_LINKS) {
    return {
      status: 400,
      error: "Le message contient trop de liens.",
    };
  }

  return null;
}

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Origine de la requête non autorisée.",
        },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          error: "Format de requête invalide.",
        },
        { status: 415 }
      );
    }

    const contentLength = Number(request.headers.get("content-length") || 0);

    if (contentLength > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: "La requête est trop volumineuse.",
        },
        { status: 413 }
      );
    }

    const clientIp = getClientIp(request);

    if (!checkRateLimit(`crm-lead:ip:${clientIp}`)) {
      return NextResponse.json(
        {
          success: false,
          error: "Trop de tentatives. Veuillez patienter avant de réessayer.",
        },
        { status: 429 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "JSON invalide.",
        },
        { status: 400 }
      );
    }

    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données invalides.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const securityError = validateSecurity(data);

    if (securityError) {
      return NextResponse.json(
        {
          success: false,
          error: securityError.error,
        },
        { status: securityError.status }
      );
    }

    const email = normalizeEmail(data.email);
    const rateLimitKey = `crm-lead:email:${clientIp}:${email}`;

    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        {
          success: false,
          error: "Trop de tentatives. Veuillez patienter avant de réessayer.",
        },
        { status: 429 }
      );
    }

    const userId = await getCrmOwnerUserId();

    const firstName = cleanString(data.firstName);
    const lastName = cleanString(data.lastName);
    const phone = cleanString(data.phone);
    const jobTitle = cleanString(data.jobTitle);
    const companyName = cleanString(data.companyName);
    const country = cleanString(data.country);
    const city = cleanString(data.city);
    const message = cleanString(data.message);
    const offerId = cleanString(data.offerId);
    const productNameFallback = cleanString(data.productNameFallback);

    const requestType = data.requestType as CrmRequestTypeValue;
    const source = resolveLeadSource(data.source || data.utmSource);
    const fullName = getFullName(firstName, lastName);
    const trackedLinkSlug = cleanString(data.trackedLinkSlug);

    const hasProductReference =
      Boolean(cleanString(data.productId)) || Boolean(cleanString(data.productSlug));

    const product = await findProduct({
      productId: data.productId,
      productSlug: data.productSlug,
    });

    if (hasProductReference && !product && !productNameFallback) {
      return NextResponse.json(
        {
          success: false,
          error: "Produit introuvable ou non publié.",
        },
        { status: 404 }
      );
    }

    const productLabel =
      product?.name || productNameFallback || "Demande commerciale";

    const productGroupName = productLabel
      ? `Prospects - ${productLabel}`
      : "Prospects - Général";

    const trackedLink = trackedLinkSlug
      ? await prisma.crmTrackedLink.findFirst({
          where: {
            slug: trackedLinkSlug,
            userId,
          },
          select: {
            id: true,
            slug: true,
            campaignId: true,
            publications: {
              where: {
                userId,
              },
              take: 1,
              orderBy: {
                createdAt: "desc",
              },
              select: {
                id: true,
                campaignId: true,
              },
            },
          },
        })
      : null;

    const trackedPublication = trackedLink?.publications[0] || null;
    const trackedCampaignId =
      trackedLink?.campaignId || trackedPublication?.campaignId || null;

    const result = await prisma.$transaction(async (tx) => {
      let company = null;

      if (companyName) {
        company = await tx.crmCompany.upsert({
          where: {
            userId_name: {
              userId,
              name: companyName,
            },
          },
          update: {
            type: data.companyType || "COMPANY",
            country,
            city,
          },
          create: {
            userId,
            name: companyName,
            type: data.companyType || "COMPANY",
            country,
            city,
          },
        });
      }

      let productGroup = await tx.contactGroup.findFirst({
        where: {
          userId,
          name: productGroupName,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!productGroup) {
        productGroup = await tx.contactGroup.create({
          data: {
            userId,
            name: productGroupName,
            description: product
              ? `Contacts intéressés par ${product.name}`
              : "Contacts issus des formulaires commerciaux",
          },
          select: {
            id: true,
            name: true,
          },
        });
      }

      const offer = offerId
        ? await tx.crmOffer.findFirst({
            where: {
              id: offerId,
              userId,
            },
            select: {
              id: true,
              title: true,
            },
          })
        : null;

      const contact = await tx.contact.upsert({
        where: {
          email_userId: {
            email,
            userId,
          },
        },
        update: {
          firstName,
          lastName,
          phone,
          jobTitle,
          companyName,
          country,
          city,
          groupId: productGroup.id,
          crmCompanyId: company?.id,
          crmSource: source,
          crmStatus: "PROSPECT",
          consentDate: data.consentEmail ? new Date() : undefined,
          consentSource: data.consentEmail ? "website_form" : undefined,
          metadata: {
            lastLeadSource: source,
            lastRequestType: requestType,
            lastProductId: product?.id || null,
            lastProductSlug:
              product?.slug || cleanString(data.productSlug) || null,
            lastProductName: productLabel,
            utmSource: cleanString(data.utmSource) || null,
            utmMedium: cleanString(data.utmMedium) || null,
            utmCampaign: cleanString(data.utmCampaign) || null,
            utmContent: cleanString(data.utmContent) || null,
            utmTerm: cleanString(data.utmTerm) || null,
            trackedLinkSlug: trackedLink?.slug || trackedLinkSlug || null,
            crmTrackedLinkId: trackedLink?.id || null,
            crmPublicationId: trackedPublication?.id || null,
            crmMarketingCampaignId: trackedCampaignId,
            landingPage: cleanString(data.landingPage) || null,
            referrer: cleanString(data.referrer) || null,
            lastSubmittedAt: new Date().toISOString(),
          },
        },
        create: {
          email,
          firstName,
          lastName,
          phone,
          jobTitle,
          companyName,
          country,
          city,
          userId,
          groupId: productGroup.id,
          crmCompanyId: company?.id,
          crmSource: source,
          crmStatus: "PROSPECT",
          consentDate: data.consentEmail ? new Date() : undefined,
          consentSource: data.consentEmail ? "website_form" : undefined,
          metadata: {
            firstLeadSource: source,
            requestType,
            productId: product?.id || null,
            productSlug:
              product?.slug || cleanString(data.productSlug) || null,
            productName: productLabel,
            utmSource: cleanString(data.utmSource) || null,
            utmMedium: cleanString(data.utmMedium) || null,
            utmCampaign: cleanString(data.utmCampaign) || null,
            utmContent: cleanString(data.utmContent) || null,
            utmTerm: cleanString(data.utmTerm) || null,
            trackedLinkSlug: trackedLink?.slug || trackedLinkSlug || null,
            crmTrackedLinkId: trackedLink?.id || null,
            crmPublicationId: trackedPublication?.id || null,
            crmMarketingCampaignId: trackedCampaignId,
            landingPage: cleanString(data.landingPage) || null,
            referrer: cleanString(data.referrer) || null,
            firstSubmittedAt: new Date().toISOString(),
          },
        },
      });

      await tx.contactGroupMember.upsert({
        where: {
          contactId_groupId: {
            contactId: contact.id,
            groupId: productGroup.id,
          },
        },
        update: {},
        create: {
          contactId: contact.id,
          groupId: productGroup.id,
        },
      });

      const opportunity = await tx.crmOpportunity.create({
        data: {
          userId,
          contactId: contact.id,
          companyId: company?.id,
          productId: product?.id,
          offerId: offer?.id,
          title: `${requestType} - ${productLabel}${
            fullName ? ` - ${fullName}` : ""
          }`,
          description: message,
          requestType,
          stage: "NEW",
          source,
          probability: 10,
          utmSource: cleanString(data.utmSource),
          utmMedium: cleanString(data.utmMedium),
          utmCampaign: cleanString(data.utmCampaign),
          utmContent: cleanString(data.utmContent),
          utmTerm: cleanString(data.utmTerm),
          crmMarketingCampaignId: trackedCampaignId,
          crmPublicationId: trackedPublication?.id || null,
          crmTrackedLinkId: trackedLink?.id || null,
          landingPage: cleanString(data.landingPage),
          referrer: cleanString(data.referrer),
          nextFollowUpAt: getTaskDueDate(),
        },
      });

      const task = await tx.crmTask.create({
        data: {
          userId,
          contactId: contact.id,
          companyId: company?.id,
          opportunityId: opportunity.id,
          title: `Relancer ${fullName || email}`,
          description: `Demande ${requestType} reçue pour ${productLabel}. Source : ${source}.`,
          status: "TODO",
          priority: "HIGH",
          dueDate: getTaskDueDate(),
        },
      });

      const activity = await tx.crmActivity.create({
        data: {
          userId,
          contactId: contact.id,
          companyId: company?.id,
          opportunityId: opportunity.id,
          type: "FORM_SUBMISSION",
          title: `Formulaire reçu : ${requestType}`,
          description: message || `Lead reçu pour ${productLabel}.`,
          metadata: {
            source,
            requestType,
            productId: product?.id || null,
            productSlug:
              product?.slug || cleanString(data.productSlug) || null,
            productName: productLabel,
            offerId: offerId || null,
            groupId: productGroup.id,
            groupName: productGroup.name,
            utmSource: cleanString(data.utmSource) || null,
            utmMedium: cleanString(data.utmMedium) || null,
            utmCampaign: cleanString(data.utmCampaign) || null,
            utmContent: cleanString(data.utmContent) || null,
            utmTerm: cleanString(data.utmTerm) || null,
            trackedLinkSlug: trackedLink?.slug || trackedLinkSlug || null,
            crmTrackedLinkId: trackedLink?.id || null,
            crmPublicationId: trackedPublication?.id || null,
            crmMarketingCampaignId: trackedCampaignId,
            landingPage: cleanString(data.landingPage) || null,
            referrer: cleanString(data.referrer) || null,
            clientIp,
            submittedAt: new Date().toISOString(),
          },
        },
      });

      return {
        contact,
        company,
        product,
        offer,
        opportunity,
        task,
        activity,
        productGroup,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Lead enregistré dans le CRM.",
      data: {
        contactId: result.contact.id,
        companyId: result.company?.id || null,
        productId: result.product?.id || null,
        opportunityId: result.opportunity.id,
        taskId: result.task.id,
        groupId: result.productGroup.id,
      },
    });
  } catch (error) {
    console.error("[CRM_LEAD_POST]", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur pendant la création du lead.",
      },
      { status: 500 }
    );
  }
}
