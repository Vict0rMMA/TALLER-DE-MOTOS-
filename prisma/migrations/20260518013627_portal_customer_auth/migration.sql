-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "portalActive" BOOLEAN NOT NULL DEFAULT false;
