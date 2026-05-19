// src/app/types/email-marketing.ts
// Types partagés pour tout le module email marketing

import type { ContactInput } from "@/app/lib/email/schemas";

export type CampaignStatus =
  | "DRAFT"
  | "SENDING"
  | "SENT"
  | "FAILED"
  | "SCHEDULED"
  | "CANCELLED";

export type DateLike = string | Date;

export type CrmContactStatus =
  | "NEW"
  | "PROSPECT"
  | "HOT_PROSPECT"
  | "CUSTOMER"
  | "PARTNER"
  | "INACTIVE"
  | "LOST";

export type CrmLeadSource =
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

export interface CrmCompanyPreview {
  id: string;
  name: string;
  type?: string | null;
  country?: string | null;
  city?: string | null;
}

export interface CrmStatusOption {
  id: string;
  userId?: string;

  key: string;
  label: string;
  color: string;
  description?: string | null;

  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;

  createdAt?: DateLike;
  updatedAt?: DateLike;

  _count?: {
    contacts?: number;
  };
}

export interface CrmStatusOptionFormData {
  label: string;
  key?: string;
  color: string;
  description?: string | null;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface ContactGroup {
  id: string;
  name: string;
  description?: string | null;
  userId: string;
  createdAt: DateLike;
  updatedAt: DateLike;

  _count?: {
    contacts: number;
  };
}

export interface Contact {
  id: string;
  email: string;

  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;

  jobTitle?: string | null;
  companyName?: string | null;
  country?: string | null;
  city?: string | null;
  notes?: string | null;

  metadata?: Record<string, unknown> | null;

  isActive: boolean;
  unsubscribed: boolean;

  /**
   * Ancien statut enum conservé pour compatibilité.
   */
  crmStatus?: CrmContactStatus | null;

  /**
   * Nouveau statut dynamique.
   */
  crmStatusOptionId?: string | null;
  crmStatusOption?: CrmStatusOption | null;

  crmSource?: CrmLeadSource | null;

  consentDate?: DateLike | null;
  consentSource?: string | null;

  groupId?: string | null;
  crmCompanyId?: string | null;
  userId: string;

  createdAt: DateLike;
  updatedAt: DateLike;

  group?: ContactGroup | null;
  crmCompany?: CrmCompanyPreview | null;
}

export interface CampaignGroup {
  id: string;
  campaignId: string;
  groupId: string;
  createdAt: DateLike;

  group: ContactGroup;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;

  /**
   * Ancien champ conservé pour compatibilité.
   * Il peut contenir le premier groupe sélectionné.
   */
  groupId?: string | null;

  status: CampaignStatus;
  userId: string;

  sentAt?: DateLike | null;
  scheduledAt?: DateLike | null;

  totalRecipients: number;
  sentCount: number;
  failedCount: number;

  createdAt: DateLike;
  updatedAt: DateLike;

  /**
   * Ancienne relation groupe unique.
   */
  group?: ContactGroup | null;

  /**
   * Nouvelle relation : une campagne peut avoir plusieurs groupes.
   */
  campaignGroups?: CampaignGroup[];

  recipients?: CampaignRecipient[];
  logs?: EmailLog[];

  _count?: {
    recipients?: number;
  };
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  contactId: string;
  email: string;

  sent: boolean;
  delivered: boolean;

  openedAt?: DateLike | null;
  clickedAt?: DateLike | null;
  error?: string | null;
  sentAt?: DateLike | null;
  createdAt?: DateLike;
}

export interface EmailLog {
  id: string;
  campaignId: string;
  email: string;
  status: string;
  message?: string | null;
  provider?: string | null;
  createdAt: DateLike;
}

// Formulaires React Hook Form + Zod

export type ContactFormData = ContactInput;

export interface GroupFormData {
  name: string;
  description?: string;
}

export interface CampaignFormData {
  name: string;
  subject: string;
  htmlContent: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;

  /**
   * Ancien champ conservé pour compatibilité.
   */
  groupId?: string;

  /**
   * Nouveau champ pour sélectionner plusieurs groupes.
   */
  groupIds?: string[];
}

// Pagination

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Import CSV / Excel

export interface ImportRow {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  [key: string]: string | undefined;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: {
    row: number;
    email: string;
    error: string;
  }[];
}