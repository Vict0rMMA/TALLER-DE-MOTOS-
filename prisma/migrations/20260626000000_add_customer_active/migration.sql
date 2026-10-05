-- Borrado suave de clientes: se ocultan de las listas pero conservan su
-- historial de servicios/facturas (igual que Product.active).
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
