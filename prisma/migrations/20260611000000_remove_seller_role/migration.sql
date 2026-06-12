-- Convert any existing seller users to mechanic before removing the enum value
UPDATE "User" SET role = 'mechanic' WHERE role = 'seller';

-- PostgreSQL doesn't allow removing enum values directly; recreate the enum
CREATE TYPE "UserRole_new" AS ENUM ('owner', 'mechanic');
ALTER TABLE "User" ALTER COLUMN role TYPE "UserRole_new" USING role::text::"UserRole_new";
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
