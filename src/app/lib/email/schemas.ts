// src/app/lib/email/schemas.ts
// Schémas Zod pour validation des formulaires et API

import { z } from "zod";

const optionalCuid = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") return null;
    return value;
  },
  z.string().cuid().optional().nullable()
);

const optionalEmail = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") return null;
    return value;
  },
  z.string().email("Email invalide").optional().nullable()
);

const optionalText = (max = 500) =>
  z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const cleaned = value.trim();
        return cleaned.length > 0 ? cleaned : null;
      }

      if (value === undefined || value === null) {
        return null;
      }

      return value;
    },
    z.string().max(max).optional().nullable()
  );

const optionalBooleanDefault = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (["true", "1", "yes", "on"].includes(normalized)) {
        return true;
      }

      if (["false", "0", "no", "off"].includes(normalized)) {
        return false;
      }
    }

    return value;
  }, z.boolean());

const crmContactStatusSchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") {
      return "NEW";
    }

    return value;
  },
  z.enum([
    "NEW",
    "PROSPECT",
    "HOT_PROSPECT",
    "CUSTOMER",
    "PARTNER",
    "INACTIVE",
    "LOST",
  ])
);

const crmLeadSourceSchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") {
      return "MANUAL";
    }

    return value;
  },
  z.enum([
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
);

const crmStatusKeySchema = z
  .string()
  .trim()
  .min(1, "La clé technique est obligatoire")
  .max(80, "La clé technique est trop longue")
  .regex(
    /^[A-Z0-9_]+$/,
    "La clé technique doit contenir uniquement des lettres majuscules, chiffres et underscores"
  );

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Couleur invalide")
  .default("#EF9F27");

export const contactSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Email invalide")
    .transform((value) => value.toLowerCase()),

  firstName: optionalText(100),
  lastName: optionalText(100),
  phone: optionalText(30),

  groupId: optionalCuid,

  // Champs CRM ajoutés au modèle Contact
  jobTitle: optionalText(150),
  companyName: optionalText(200),
  country: optionalText(100),
  city: optionalText(100),
  notes: optionalText(5000),

  /**
   * Ancien statut enum conservé pour compatibilité.
   * On le garde tant que tout le CRM / automatisations n’utilise pas encore
   * crmStatusOptionId.
   */
  crmStatus: crmContactStatusSchema.default("NEW"),

  /**
   * Nouveau statut CRM dynamique.
   * C’est ce champ que le nouveau ContactModal utilise.
   */
  crmStatusOptionId: optionalCuid,

  crmSource: crmLeadSourceSchema.default("MANUAL"),

  isActive: optionalBooleanDefault(true).default(true),
  unsubscribed: optionalBooleanDefault(false).default(false),
});

export const groupSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(100),
  description: optionalText(500),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(200),
  subject: z.string().trim().min(1, "Le sujet est requis").max(500),
  htmlContent: z.string().trim().min(1, "Le contenu HTML est requis"),

  fromName: z.string().trim().min(1, "Le nom expéditeur est requis").max(100),
  fromEmail: z.string().trim().email("Email expéditeur invalide"),
  replyTo: optionalEmail,

  // Ancien système : un seul groupe.
  // On garde ce champ pour compatibilité avec Campaign.groupId.
  groupId: optionalCuid,

  // Nouveau système : plusieurs groupes.
  // Exemple envoyé par le formulaire :
  // groupIds: ["grp1", "grp2", "grp3"]
  groupIds: z.array(z.string().cuid()).optional().default([]),
});

export const crmStatusOptionSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Le libellé du statut est obligatoire")
    .max(120, "Le libellé est trop long"),

  key: crmStatusKeySchema.optional(),

  color: hexColorSchema,

  description: optionalText(1000),

  sortOrder: z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return 0;

    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return value;
  }, z.number().int().default(0)),

  isDefault: optionalBooleanDefault(false).default(false),
  isActive: optionalBooleanDefault(true).default(true),
});

export const crmStatusOptionUpdateSchema = crmStatusOptionSchema.partial();

export const sendTestSchema = z.object({
  campaignId: z.string().cuid(),
  testEmail: z.string().email("Email de test invalide"),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type GroupInput = z.infer<typeof groupSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type CrmStatusOptionInput = z.infer<typeof crmStatusOptionSchema>;
export type CrmStatusOptionUpdateInput = z.infer<
  typeof crmStatusOptionUpdateSchema
>;
export type SendTestInput = z.infer<typeof sendTestSchema>;