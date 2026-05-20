import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { sendAutomationEmail } from "@/app/lib/email/sender";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContactPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  organization?: string;
  subject?: string;
  message?: string;
  website?: string;
  formStartedAt?: number;
};

type FieldErrors = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "organization"
    | "subject"
    | "message"
    | "website"
    | "formStartedAt",
    string
  >
>;

const SUBJECTS = new Set([
  "Demande commerciale",
  "Démonstration",
  "Devis",
  "Support technique",
  "Formation",
  "Partenariat",
  "Recrutement",
  "Autre",
]);

const MAX_CONTENT_LENGTH = 24_000;
const MIN_SUBMIT_TIME_MS = 1500;
const MAX_SUBMIT_TIME_MS = 24 * 60 * 60 * 1000;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const rateLimitStore = new Map<
  string,
  {
    count: number;
    resetAt: number;
  }
>();

function clean(value: unknown, maxLength = 5000) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanMultiline(value: unknown, maxLength = 5000) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
  if (!phone) return true;
  return /^[+()\d\s.-]{6,30}$/.test(phone);
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getAllowedOrigins() {
  return [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_URL,
    process.env.SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]
    .filter(Boolean)
    .map((origin) => String(origin).replace(/\/$/, ""));
}

function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  return getAllowedOrigins().includes(origin.replace(/\/$/, ""));
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

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

function countSuspiciousLinks(value: string) {
  return (
    value.match(/https?:\/\/|www\.|\.com|\.net|\.org|\.io|\.ru|\.cn/gi)
      ?.length || 0
  );
}

function validatePayload(body: ContactPayload) {
  const fieldErrors: FieldErrors = {};

  const firstName = clean(body.firstName, 50);
  const lastName = clean(body.lastName, 50);
  const name = `${firstName} ${lastName}`.trim();

  const email = clean(body.email, 255).toLowerCase();
  const phone = clean(body.phone, 30);
  const organization = clean(body.organization, 120);
  const subject = clean(body.subject, 255);
  const message = cleanMultiline(body.message, 5000);

  const website = clean(body.website, 255);
  const formStartedAt = Number(body.formStartedAt || 0);
  const now = Date.now();

  if (website) {
    fieldErrors.website = "Soumission bloquée.";
  }

  if (!formStartedAt || Number.isNaN(formStartedAt)) {
    fieldErrors.formStartedAt = "Session du formulaire invalide.";
  } else {
    const elapsed = now - formStartedAt;

    if (elapsed < MIN_SUBMIT_TIME_MS) {
      fieldErrors.formStartedAt =
        "Le formulaire a été envoyé trop rapidement.";
    }

    if (elapsed > MAX_SUBMIT_TIME_MS) {
      fieldErrors.formStartedAt =
        "La session du formulaire a expiré. Rechargez la page.";
    }
  }

  if (!firstName) {
    fieldErrors.firstName = "Le prénom est obligatoire.";
  } else if (firstName.length < 2) {
    fieldErrors.firstName = "Le prénom doit contenir au moins 2 caractères.";
  }

  if (!lastName) {
    fieldErrors.lastName = "Le nom est obligatoire.";
  } else if (lastName.length < 2) {
    fieldErrors.lastName = "Le nom doit contenir au moins 2 caractères.";
  }

  if (!email) {
    fieldErrors.email = "L’email est obligatoire.";
  } else if (!isValidEmail(email)) {
    fieldErrors.email = "L’adresse email n’est pas valide.";
  }

  if (phone && !isValidPhone(phone)) {
    fieldErrors.phone = "Le numéro de téléphone n’est pas valide.";
  }

  if (organization.length > 120) {
    fieldErrors.organization =
      "L’organisation ne doit pas dépasser 120 caractères.";
  }

  if (!subject) {
    fieldErrors.subject = "L’objet est obligatoire.";
  } else if (!SUBJECTS.has(subject)) {
    fieldErrors.subject = "L’objet sélectionné n’est pas valide.";
  }

  if (!message) {
    fieldErrors.message = "Le message est obligatoire.";
  } else if (message.length < 10) {
    fieldErrors.message = "Le message doit contenir au moins 10 caractères.";
  } else if (message.length > 5000) {
    fieldErrors.message = "Le message ne doit pas dépasser 5000 caractères.";
  } else if (countSuspiciousLinks(message) > 3) {
    fieldErrors.message = "Le message contient trop de liens.";
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    values: {
      firstName,
      lastName,
      name,
      email,
      phone,
      organization,
      subject,
      message,
    },
  };
}

function jsonError(
  status: number,
  payload: {
    error: string;
    fieldErrors?: FieldErrors;
    id?: string;
    emailError?: string;
  }
) {
  return NextResponse.json(
    {
      ok: false,
      ...payload,
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!isAllowedOrigin(request)) {
      return jsonError(403, {
        error: "Origine de la requête non autorisée.",
      });
    }

    const contentType = request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonError(415, {
        error: "Format de requête non supporté.",
      });
    }

    const contentLength = Number(request.headers.get("content-length") || 0);

    if (contentLength > MAX_CONTENT_LENGTH) {
      return jsonError(413, {
        error: "Le message est trop volumineux.",
      });
    }

    const ipAddress = getClientIp(request);
    const rateLimit = checkRateLimit(`contact:${ipAddress}`);

    if (!rateLimit.allowed) {
      return jsonError(429, {
        error: `Trop de tentatives. Réessayez dans ${rateLimit.retryAfterSeconds} secondes.`,
      });
    }

    const body = (await request.json()) as ContactPayload;
    const validation = validatePayload(body);

    if (!validation.valid) {
      return jsonError(400, {
        error: "Certains champs doivent être corrigés.",
        fieldErrors: validation.fieldErrors,
      });
    }

    const { name, email, phone, organization, subject, message } =
      validation.values;

    const messageToStore = [
      organization ? `Organisation : ${organization}` : null,
      message,
    ]
      .filter(Boolean)
      .join("\n\n");

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject,
        message: messageToStore,
        ipAddress: ipAddress === "unknown" ? null : ipAddress,
      },
    });

    const inboxEmail = process.env.CONTACT_INBOX_EMAIL;

    if (!inboxEmail || !isValidEmail(inboxEmail)) {
      console.error("[contact] CONTACT_INBOX_EMAIL manquant ou invalide");

      return jsonError(500, {
        id: contactMessage.id,
        error:
          "Le message a été enregistré, mais l’adresse de réception n’est pas configurée.",
      });
    }

    const safeId = escapeHtml(contactMessage.id);
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || "Non renseigné");
    const safeOrganization = escapeHtml(organization || "Non renseignée");
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");
    const safeIpAddress = escapeHtml(
      ipAddress === "unknown" ? "Non disponible" : ipAddress
    );

    const emailResult = await sendAutomationEmail({
      to: inboxEmail,
      subject: `[Contact MD2I] ${subject}`,
      replyTo: email,
      html: `
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <title>Nouveau message de contact</title>
          </head>

          <body>
            <div class="email-shell">
              <div class="email-hero">
                <span class="email-eyebrow">Nouveau contact</span>
                <h1 class="email-title">Nouveau message depuis le site MD2I</h1>
                <p class="email-text">
                  Un visiteur a envoyé une demande depuis le formulaire de contact.
                  Le message a été enregistré dans la table contact_messages.
                </p>
              </div>

              <div class="email-section">
                <div class="email-card">
                  <h2 style="margin:0 0 18px;font-size:20px;">
                    Informations du contact
                  </h2>

                  <table style="width:100%;border-collapse:collapse;">
                    <tbody>
                      <tr>
                        <td style="width:160px;padding:10px 0;border-bottom:1px solid rgba(15,23,42,.10);color:rgba(15,23,42,.58);font-size:13px;">ID</td>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(15,23,42,.10);font-size:13px;">
                          <strong>${safeId}</strong>
                        </td>
                      </tr>

                      <tr>
                        <td style="width:160px;padding:10px 0;border-bottom:1px solid rgba(15,23,42,.10);color:rgba(15,23,42,.58);font-size:13px;">Nom</td>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(15,23,42,.10);font-size:13px;">
                          <strong>${safeName}</strong>
                        </td>
                      </tr>

                      <tr>
                        <td style="width:160px;padding:10px 0;border-bottom:1px solid rgba(15,23,42,.10);color:rgba(15,23,42,.58);font-size:13px;">Email</td>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(15,23,42,.10);font-size:13px;">
                          <a href="mailto:${safeEmail}" style="color:#ef9f27;text-decoration:none;">
                            ${safeEmail}
                          </a>
                        </td>
                      </tr>

                      <tr>
                        <td style="width:160px;padding:10px 0;border-bottom:1px solid rgba(15,23,42,.10);color:rgba(15,23,42,.58);font-size:13px;">Téléphone</td>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(15,23,42,.10);font-size:13px;">
                          ${safePhone}
                        </td>
                      </tr>

                      <tr>
                        <td style="width:160px;padding:10px 0;border-bottom:1px solid rgba(15,23,42,.10);color:rgba(15,23,42,.58);font-size:13px;">Organisation</td>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(15,23,42,.10);font-size:13px;">
                          ${safeOrganization}
                        </td>
                      </tr>

                      <tr>
                        <td style="width:160px;padding:10px 0;border-bottom:1px solid rgba(15,23,42,.10);color:rgba(15,23,42,.58);font-size:13px;">Objet</td>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(15,23,42,.10);font-size:13px;">
                          <strong>${safeSubject}</strong>
                        </td>
                      </tr>

                      <tr>
                        <td style="width:160px;padding:10px 0;color:rgba(15,23,42,.58);font-size:13px;">Adresse IP</td>
                        <td style="padding:10px 0;font-size:13px;">
                          ${safeIpAddress}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div class="email-divider"></div>

                  <h2 style="margin:0 0 12px;font-size:18px;">Message</h2>

                  <div style="padding:18px;border-radius:14px;background:#f8fafc;border:1px solid rgba(15,23,42,.08);font-size:14px;line-height:1.7;color:#334155;">
                    ${safeMessage}
                  </div>

                  <a class="email-btn" href="mailto:${safeEmail}">
                    Répondre au contact
                  </a>
                </div>
              </div>

              <div class="email-footer">
                Cet email a été envoyé automatiquement par le site MD2I.
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (!emailResult.success) {
      console.error("[contact] email send failed", emailResult.error);

      return jsonError(502, {
        id: contactMessage.id,
        emailError: emailResult.error,
        error:
          "Le message a été enregistré, mais l’email n’a pas pu être envoyé.",
      });
    }

    return NextResponse.json(
      {
        ok: true,
        id: contactMessage.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[contact] fatal error", error);

    return jsonError(500, {
      error: "Impossible d’envoyer le message pour le moment.",
    });
  }
}