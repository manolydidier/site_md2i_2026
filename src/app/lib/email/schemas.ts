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

export const contactSchema = z.object({
  email: z.string().trim().email("Email invalide"),

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

  crmStatus: crmContactStatusSchema.default("NEW"),
  crmSource: crmLeadSourceSchema.default("MANUAL"),

  isActive: optionalBooleanDefault(true).default(true),
  unsubscribed: optionalBooleanDefault(false).default(false),
});

export const groupSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  description: z.string().max(500).optional().nullable(),
});

export const campaignSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(200),
  subject: z.string().min(1, "Le sujet est requis").max(500),
  htmlContent: z.string().min(1, "Le contenu HTML est requis"),

  fromName: z.string().min(1, "Le nom expéditeur est requis").max(100),
  fromEmail: z.string().email("Email expéditeur invalide"),
  replyTo: optionalEmail,

  // Ancien système : un seul groupe.
  // On garde ce champ pour compatibilité avec Campaign.groupId.
  groupId: optionalCuid,

  // Nouveau système : plusieurs groupes.
  // Exemple envoyé par le formulaire :
  // groupIds: ["grp1", "grp2", "grp3"]
  groupIds: z.array(z.string().cuid()).optional().default([]),
});

export const sendTestSchema = z.object({
  campaignId: z.string().cuid(),
  testEmail: z.string().email("Email de test invalide"),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type GroupInput = z.infer<typeof groupSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type SendTestInput = z.infer<typeof sendTestSchema>;