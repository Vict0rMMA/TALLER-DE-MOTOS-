-- Campos de factura. Idempotente (IF NOT EXISTS) para no chocar con datos existentes.
ALTER TABLE "Service"  ADD COLUMN IF NOT EXISTS "invoiceNumber"    INTEGER;
ALTER TABLE "Service"  ADD COLUMN IF NOT EXISTS "paymentMethod"    TEXT;
ALTER TABLE "Service"  ADD COLUMN IF NOT EXISTS "paymentReference" TEXT;
ALTER TABLE "Service"  ADD COLUMN IF NOT EXISTS "warranty"         TEXT;
ALTER TABLE "Service"  ADD COLUMN IF NOT EXISTS "notes"            TEXT;
ALTER TABLE "Service"  ADD COLUMN IF NOT EXISTS "discount"         DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "Workshop" ADD COLUMN IF NOT EXISTS "nextInvoiceNumber" INTEGER NOT NULL DEFAULT 1;
