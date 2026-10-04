-- Campos opcionales nuevos del producto. Idempotente (IF NOT EXISTS).
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl"    TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "supplier"    TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Normaliza strings vacios a NULL para que no choquen contra el unique nuevo
-- (NULL no cuenta como duplicado en un indice unique de Postgres).
UPDATE "Product" SET "barcode" = NULL WHERE "barcode" = '';

-- Un mismo codigo de barras no puede repetirse dentro de un mismo taller.
CREATE UNIQUE INDEX IF NOT EXISTS "Product_workshopId_barcode_key" ON "Product"("workshopId", "barcode");
CREATE INDEX IF NOT EXISTS "Product_workshopId_barcode_idx" ON "Product"("workshopId", "barcode");
