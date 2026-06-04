ALTER TABLE "Workshop" ADD COLUMN IF NOT EXISTS "inviteCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Workshop_inviteCode_key" ON "Workshop"("inviteCode");

-- Generar códigos únicos para talleres existentes
UPDATE "Workshop" SET "inviteCode" = UPPER(SUBSTRING(MD5(id || 'mb2026'), 1, 8)) WHERE "inviteCode" IS NULL;
