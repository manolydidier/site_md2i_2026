-- Add PUBLISHING status for in-flight CRM publication locks.
ALTER TYPE "CrmPublicationStatus" ADD VALUE IF NOT EXISTS 'PUBLISHING';

-- Publication retry / lock fields.
ALTER TABLE "crm_publications"
  ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "maxRetries" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "lastAttemptAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nextRetryAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lockToken" TEXT;

-- Click attribution enrichment.
ALTER TABLE "crm_tracked_link_clicks"
  ADD COLUMN IF NOT EXISTS "ipAddress" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "isBot" BOOLEAN NOT NULL DEFAULT false;

-- CRM campaign attribution on opportunities created after tracked visits.
ALTER TABLE "crm_opportunities"
  ADD COLUMN IF NOT EXISTS "crmMarketingCampaignId" TEXT,
  ADD COLUMN IF NOT EXISTS "crmPublicationId" TEXT,
  ADD COLUMN IF NOT EXISTS "crmTrackedLinkId" TEXT;

-- Publication audit log.
CREATE TABLE IF NOT EXISTS "crm_publication_logs" (
  "id" TEXT NOT NULL,
  "publicationId" TEXT,
  "campaignId" TEXT,
  "userId" UUID NOT NULL,
  "channel" "CrmPublicationChannel",
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "message" TEXT,
  "error" TEXT,
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "requestPayload" JSONB,
  "providerResponse" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "crm_publication_logs_pkey" PRIMARY KEY ("id")
);

-- Keep dynamic CRM status labels resilient for older seed/import paths.
DO $$
BEGIN
  ALTER TABLE "crm_status_options"
    ALTER COLUMN "label" SET DEFAULT '';
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Indexes for retry scheduling, attribution, and logs.
CREATE INDEX IF NOT EXISTS "crm_publications_retryCount_idx" ON "crm_publications"("retryCount");
CREATE INDEX IF NOT EXISTS "crm_publications_nextRetryAt_idx" ON "crm_publications"("nextRetryAt");
CREATE INDEX IF NOT EXISTS "crm_publications_lockedAt_idx" ON "crm_publications"("lockedAt");
CREATE INDEX IF NOT EXISTS "crm_publications_lockToken_idx" ON "crm_publications"("lockToken");
CREATE INDEX IF NOT EXISTS "crm_publications_status_scheduledAt_idx" ON "crm_publications"("status", "scheduledAt");
CREATE INDEX IF NOT EXISTS "crm_publications_status_nextRetryAt_idx" ON "crm_publications"("status", "nextRetryAt");
CREATE INDEX IF NOT EXISTS "crm_publications_userId_status_scheduledAt_idx" ON "crm_publications"("userId", "status", "scheduledAt");

CREATE INDEX IF NOT EXISTS "crm_tracked_links_utmMedium_idx" ON "crm_tracked_links"("utmMedium");
CREATE INDEX IF NOT EXISTS "crm_tracked_links_utmContent_idx" ON "crm_tracked_links"("utmContent");

CREATE INDEX IF NOT EXISTS "crm_tracked_link_clicks_isBot_idx" ON "crm_tracked_link_clicks"("isBot");
CREATE INDEX IF NOT EXISTS "crm_tracked_link_clicks_ipAddress_idx" ON "crm_tracked_link_clicks"("ipAddress");
CREATE INDEX IF NOT EXISTS "crm_tracked_link_clicks_linkId_isBot_idx" ON "crm_tracked_link_clicks"("linkId", "isBot");

CREATE INDEX IF NOT EXISTS "crm_opportunities_crmMarketingCampaignId_idx" ON "crm_opportunities"("crmMarketingCampaignId");
CREATE INDEX IF NOT EXISTS "crm_opportunities_crmPublicationId_idx" ON "crm_opportunities"("crmPublicationId");
CREATE INDEX IF NOT EXISTS "crm_opportunities_crmTrackedLinkId_idx" ON "crm_opportunities"("crmTrackedLinkId");
CREATE INDEX IF NOT EXISTS "crm_opportunities_userId_crmMarketingCampaignId_idx" ON "crm_opportunities"("userId", "crmMarketingCampaignId");
CREATE INDEX IF NOT EXISTS "crm_opportunities_userId_crmPublicationId_idx" ON "crm_opportunities"("userId", "crmPublicationId");
CREATE INDEX IF NOT EXISTS "crm_opportunities_userId_crmTrackedLinkId_idx" ON "crm_opportunities"("userId", "crmTrackedLinkId");
CREATE INDEX IF NOT EXISTS "crm_opportunities_userId_utmSource_idx" ON "crm_opportunities"("userId", "utmSource");
CREATE INDEX IF NOT EXISTS "crm_opportunities_userId_utmCampaign_idx" ON "crm_opportunities"("userId", "utmCampaign");
CREATE INDEX IF NOT EXISTS "crm_opportunities_userId_utmSource_createdAt_idx" ON "crm_opportunities"("userId", "utmSource", "createdAt");
CREATE INDEX IF NOT EXISTS "crm_opportunities_userId_utmCampaign_createdAt_idx" ON "crm_opportunities"("userId", "utmCampaign", "createdAt");

CREATE INDEX IF NOT EXISTS "crm_publication_logs_publicationId_idx" ON "crm_publication_logs"("publicationId");
CREATE INDEX IF NOT EXISTS "crm_publication_logs_campaignId_idx" ON "crm_publication_logs"("campaignId");
CREATE INDEX IF NOT EXISTS "crm_publication_logs_userId_idx" ON "crm_publication_logs"("userId");
CREATE INDEX IF NOT EXISTS "crm_publication_logs_channel_idx" ON "crm_publication_logs"("channel");
CREATE INDEX IF NOT EXISTS "crm_publication_logs_action_idx" ON "crm_publication_logs"("action");
CREATE INDEX IF NOT EXISTS "crm_publication_logs_status_idx" ON "crm_publication_logs"("status");
CREATE INDEX IF NOT EXISTS "crm_publication_logs_createdAt_idx" ON "crm_publication_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "crm_publication_logs_publicationId_createdAt_idx" ON "crm_publication_logs"("publicationId", "createdAt");
CREATE INDEX IF NOT EXISTS "crm_publication_logs_campaignId_createdAt_idx" ON "crm_publication_logs"("campaignId", "createdAt");
CREATE INDEX IF NOT EXISTS "crm_publication_logs_userId_createdAt_idx" ON "crm_publication_logs"("userId", "createdAt");

-- Foreign keys, guarded for repeatable local development.
DO $$
BEGIN
  ALTER TABLE "crm_opportunities"
    ADD CONSTRAINT "crm_opportunities_crmMarketingCampaignId_fkey"
    FOREIGN KEY ("crmMarketingCampaignId") REFERENCES "crm_marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "crm_opportunities"
    ADD CONSTRAINT "crm_opportunities_crmPublicationId_fkey"
    FOREIGN KEY ("crmPublicationId") REFERENCES "crm_publications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "crm_opportunities"
    ADD CONSTRAINT "crm_opportunities_crmTrackedLinkId_fkey"
    FOREIGN KEY ("crmTrackedLinkId") REFERENCES "crm_tracked_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "crm_publication_logs"
    ADD CONSTRAINT "crm_publication_logs_publicationId_fkey"
    FOREIGN KEY ("publicationId") REFERENCES "crm_publications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "crm_publication_logs"
    ADD CONSTRAINT "crm_publication_logs_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "crm_marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "crm_publication_logs"
    ADD CONSTRAINT "crm_publication_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;
