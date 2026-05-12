// lib/email/schemas.ts
// Schémas Zod pour validation des formulaires et API

import { z } from "zod";

export const contactSchema = z.object({
  email: z.string().email("Email invalide"),
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  groupId: z.string().cuid().optional().nullable(),
});

export const groupSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  description: z.string().max(500).optional().nullable(),
});

export const campaignSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(200),
  subject: z.string().min(1, "Le sujet est requis").max(500),
  htmlContent: z.string().min(1, "Le contenu HTML est requis"),
  fromName: z.string().min(1).max(100).default("Mon App"),
  fromEmail: z.string().email("Email expéditeur invalide"),
  replyTo: z.string().email().optional().nullable(),
  groupId: z.string().cuid().optional().nullable(),
});

export const sendTestSchema = z.object({
  campaignId: z.string().cuid(),
  testEmail: z.string().email("Email de test invalide"),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type GroupInput = z.infer<typeof groupSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type SendTestInput = z.infer<typeof sendTestSchema>;
