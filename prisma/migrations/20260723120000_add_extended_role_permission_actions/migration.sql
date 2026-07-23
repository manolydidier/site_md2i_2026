-- Extend the permission action vocabulary beyond the base CRUD set.
ALTER TABLE "role_permissions"
  ADD COLUMN IF NOT EXISTS "canImport" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canPrint" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canValidate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canCancel" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canArchive" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canRestore" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canDownload" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canUpload" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canExecute" BOOLEAN NOT NULL DEFAULT false;

-- Group modules/resources by category for the admin permission matrix UI.
ALTER TABLE "permission_resources"
  ADD COLUMN IF NOT EXISTS "category" VARCHAR(100);

CREATE INDEX IF NOT EXISTS "permission_resources_category_idx" ON "permission_resources"("category");
