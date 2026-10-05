-- Consentimiento de notificaciones por correo, separado del de WhatsApp.
-- Default true: los clientes existentes ya recibían estos correos.
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "optInEmail" BOOLEAN NOT NULL DEFAULT true;
