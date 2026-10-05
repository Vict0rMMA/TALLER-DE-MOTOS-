-- Convert any existing seller users to mechanic before removing the enum value
UPDATE "User" SET role = 'mechanic' WHERE role = 'seller';

-- El default de la columna ("mechanic") queda atado al tipo viejo y Postgres no
-- lo puede recastear automaticamente al cambiar el tipo en el mismo paso.
-- Hay que quitarlo antes y volverlo a poner despues (esto fue lo que hizo
-- fallar esta migracion la primera vez).
ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT;

-- PostgreSQL doesn't allow removing enum values directly; recreate the enum
CREATE TYPE "UserRole_new" AS ENUM ('owner', 'mechanic');
ALTER TABLE "User" ALTER COLUMN role TYPE "UserRole_new" USING role::text::"UserRole_new";
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'mechanic'::"UserRole";
