// types/email-marketing.ts
// Types partagés pour tout le module email marketing

export type CampaignStatus = "DRAFT" | "SENDING" | "SENT" | "FAILED" | "SCHEDULED";

export interface ContactGroup {
  id: string;
  name: string;
  description?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { contacts: number };
}

export interface Contact {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  metadata?: Record<string, unknown> | null;
  isActive: boolean;
  unsubscribed: boolean;
  groupId?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  group?: ContactGroup | null;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
  groupId?: string | null;
  status: CampaignStatus;
  userId: string;
  sentAt?: Date | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: Date;
  updatedAt: Date;
  group?: ContactGroup | null;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  contactId: string;
  email: string;
  sent: boolean;
  delivered: boolean;
  openedAt?: Date | null;
  error?: string | null;
  sentAt?: Date | null;
}

// Formulaires (React Hook Form + Zod)
export interface ContactFormData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  groupId?: string;
}

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
  groupId?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Import CSV
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
  errors: { row: number; email: string; error: string }[];
}
