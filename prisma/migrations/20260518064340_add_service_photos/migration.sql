-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
