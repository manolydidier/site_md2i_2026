-- CreateEnum
CREATE TYPE "ReferenceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "references" (
    "id" UUID NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "lat" DECIMAL(10,6) NOT NULL,
    "lng" DECIMAL(10,6) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(500) NOT NULL,
    "excerpt" TEXT NOT NULL,
    "image" VARCHAR(500) NOT NULL,
    "details" TEXT NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "client" VARCHAR(200) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "tags" TEXT[],
    "impact" VARCHAR(200),
    "technologies" TEXT[],
    "team" VARCHAR(100),
    "duration" VARCHAR(50),
    "budget" VARCHAR(50),
    "status" "ReferenceStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "authorId" UUID,
    "gjsComponents" JSONB,
    "gjsStyles" JSONB,
    "gjsHtml" TEXT,
    "gjsJs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "references_slug_key" ON "references"("slug");

-- CreateIndex
CREATE INDEX "references_country_idx" ON "references"("country");

-- CreateIndex
CREATE INDEX "references_category_idx" ON "references"("category");

-- CreateIndex
CREATE INDEX "references_date_idx" ON "references"("date");

-- CreateIndex
CREATE INDEX "references_client_idx" ON "references"("client");

-- CreateIndex
CREATE INDEX "references_status_idx" ON "references"("status");

-- CreateIndex
CREATE INDEX "references_slug_idx" ON "references"("slug");
