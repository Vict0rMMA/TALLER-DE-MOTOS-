/*
  Warnings:

  - Added the required column `workshopId` to the `DiagnosisSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ServiceStatus" ADD VALUE 'in_progress';
ALTER TYPE "ServiceStatus" ADD VALUE 'cancelled';

-- DropForeignKey
ALTER TABLE "DiagnosisSession" DROP CONSTRAINT "DiagnosisSession_motorcycleId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_mechanicId_fkey";

-- AlterTable
ALTER TABLE "DiagnosisSession" ADD COLUMN     "workshopId" TEXT NOT NULL,
ALTER COLUMN "motorcycleId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "mechanicId" DROP NOT NULL,
ALTER COLUMN "kmAtService" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "DiagnosisSession_workshopId_idx" ON "DiagnosisSession"("workshopId");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisSession" ADD CONSTRAINT "DiagnosisSession_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "Motorcycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
