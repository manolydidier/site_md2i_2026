-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "CrmMarketingCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "CrmPublicationChannel" AS ENUM ('LINKEDIN', 'FACEBOOK', 'INDEED', 'EMAIL', 'WEBSITE', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "CrmPublicationStatus" AS ENUM ('DRAFT', 'READY', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "crm_marketing_campaigns" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "objective" TEXT,
  "audience" TEXT,
  "status" "CrmMarketingCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "budget" DECIMAL(12,2),
  "currency" VARCHAR(10) DEFAULT 'EUR',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "emailCampaignId" TEXT,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "crm_marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "crm_tracked_links" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "destinationUrl" TEXT NOT NULL,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmContent" TEXT,
  "utmTerm" TEXT,
  "clickCount" INTEGER NOT NULL DEFAULT 0,
  "lastClickedAt" TIMESTAMP(3),
  "campaignId" TEXT,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "crm_tracked_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "crm_publications" (
  "id" TEXT NOT NULL,
  "channel" "CrmPublicationChannel" NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "ctaLabel" TEXT,
  "targetUrl" TEXT,
  "status" "CrmPublicationStatus" NOT NULL DEFAULT 'DRAFT',
  "scheduledAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "providerPostId" TEXT,
  "providerUrl" TEXT,
  "failureReason" TEXT,
  "notes" TEXT,
  "campaignId" TEXT NOT NULL,
  "trackedLinkId" TEXT,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "crm_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "crm_tracked_link_clicks" (
  "id" TEXT NOT NULL,
  "linkId" TEXT NOT NULL,
  "referrer" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "crm_tracked_link_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "crm_marketing_campaigns_userId_idx" ON "crm_marketing_campaigns"("userId");
CREATE INDEX IF NOT EXISTS "crm_marketing_campaigns_status_idx" ON "crm_marketing_campaigns"("status");
CREATE INDEX IF NOT EXISTS "crm_marketing_campaigns_emailCampaignId_idx" ON "crm_marketing_campaigns"("emailCampaignId");
CREATE INDEX IF NOT EXISTS "crm_marketing_campaigns_startsAt_idx" ON "crm_marketing_campaigns"("startsAt");
CREATE INDEX IF NOT EXISTS "crm_marketing_campaigns_endsAt_idx" ON "crm_marketing_campaigns"("endsAt");
CREATE INDEX IF NOT EXISTS "crm_marketing_campaigns_userId_status_idx" ON "crm_marketing_campaigns"("userId", "status");
CREATE INDEX IF NOT EXISTS "crm_marketing_campaigns_userId_createdAt_idx" ON "crm_marketing_campaigns"("userId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "crm_tracked_links_slug_key" ON "crm_tracked_links"("slug");
CREATE INDEX IF NOT EXISTS "crm_tracked_links_slug_idx" ON "crm_tracked_links"("slug");
CREATE INDEX IF NOT EXISTS "crm_tracked_links_userId_idx" ON "crm_tracked_links"("userId");
CREATE INDEX IF NOT EXISTS "crm_tracked_links_campaignId_idx" ON "crm_tracked_links"("campaignId");
CREATE INDEX IF NOT EXISTS "crm_tracked_links_utmSource_idx" ON "crm_tracked_links"("utmSource");
CREATE INDEX IF NOT EXISTS "crm_tracked_links_utmCampaign_idx" ON "crm_tracked_links"("utmCampaign");
CREATE INDEX IF NOT EXISTS "crm_tracked_links_userId_createdAt_idx" ON "crm_tracked_links"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "crm_publications_userId_idx" ON "crm_publications"("userId");
CREATE INDEX IF NOT EXISTS "crm_publications_campaignId_idx" ON "crm_publications"("campaignId");
CREATE INDEX IF NOT EXISTS "crm_publications_trackedLinkId_idx" ON "crm_publications"("trackedLinkId");
CREATE INDEX IF NOT EXISTS "crm_publications_channel_idx" ON "crm_publications"("channel");
CREATE INDEX IF NOT EXISTS "crm_publications_status_idx" ON "crm_publications"("status");
CREATE INDEX IF NOT EXISTS "crm_publications_scheduledAt_idx" ON "crm_publications"("scheduledAt");
CREATE INDEX IF NOT EXISTS "crm_publications_publishedAt_idx" ON "crm_publications"("publishedAt");
CREATE INDEX IF NOT EXISTS "crm_publications_userId_status_idx" ON "crm_publications"("userId", "status");
CREATE INDEX IF NOT EXISTS "crm_publications_userId_channel_idx" ON "crm_publications"("userId", "channel");
CREATE INDEX IF NOT EXISTS "crm_publications_userId_scheduledAt_idx" ON "crm_publications"("userId", "scheduledAt");

CREATE INDEX IF NOT EXISTS "crm_tracked_link_clicks_linkId_idx" ON "crm_tracked_link_clicks"("linkId");
CREATE INDEX IF NOT EXISTS "crm_tracked_link_clicks_createdAt_idx" ON "crm_tracked_link_clicks"("createdAt");
CREATE INDEX IF NOT EXISTS "crm_tracked_link_clicks_linkId_createdAt_idx" ON "crm_tracked_link_clicks"("linkId", "createdAt");

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "crm_marketing_campaigns"
    ADD CONSTRAINT "crm_marketing_campaigns_emailCampaignId_fkey"
    FOREIGN KEY ("emailCampaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "crm_marketing_campaigns"
    ADD CONSTRAINT "crm_marketing_campaigns_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "crm_tracked_links"
    ADD CONSTRAINT "crm_tracked_links_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "crm_marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "crm_tracked_links"
    ADD CONSTRAINT "crm_tracked_links_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "crm_publications"
    ADD CONSTRAINT "crm_publications_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "crm_marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "crm_publications"
    ADD CONSTRAINT "crm_publications_trackedLinkId_fkey"
    FOREIGN KEY ("trackedLinkId") REFERENCES "crm_tracked_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "crm_publications"
    ADD CONSTRAINT "crm_publications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "crm_tracked_link_clicks"
    ADD CONSTRAINT "crm_tracked_link_clicks_linkId_fkey"
    FOREIGN KEY ("linkId") REFERENCES "crm_tracked_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
