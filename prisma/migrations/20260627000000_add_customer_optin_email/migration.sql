-- Default true: hoy cualquier cliente con correo recibe notificaciones,
-- asi que esto preserva el comportamiento actual para los que ya existen.
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "optInEmail" BOOLEAN NOT NULL DEFAULT true;
