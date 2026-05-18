-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('pending', 'answered');

-- CreateTable
CREATE TABLE "RepairCatalogItem" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "minPrice" DECIMAL(14,2) NOT NULL,
    "maxPrice" DECIMAL(14,2) NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientConsultation" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "motorcycleId" TEXT,
    "symptom" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "aiMinPrice" DECIMAL(14,2),
    "aiMaxPrice" DECIMAL(14,2),
    "mechanicResponse" TEXT,
    "mechanicPrice" DECIMAL(14,2),
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientConsultation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RepairCatalogItem_workshopId_idx" ON "RepairCatalogItem"("workshopId");

-- CreateIndex
CREATE INDEX "RepairCatalogItem_workshopId_category_idx" ON "RepairCatalogItem"("workshopId", "category");

-- CreateIndex
CREATE INDEX "ClientConsultation_workshopId_status_idx" ON "ClientConsultation"("workshopId", "status");

-- CreateIndex
CREATE INDEX "ClientConsultation_customerId_idx" ON "ClientConsultation"("customerId");

-- AddForeignKey
ALTER TABLE "RepairCatalogItem" ADD CONSTRAINT "RepairCatalogItem_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientConsultation" ADD CONSTRAINT "ClientConsultation_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientConsultation" ADD CONSTRAINT "ClientConsultation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientConsultation" ADD CONSTRAINT "ClientConsultation_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "Motorcycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientConsultation" ADD CONSTRAINT "ClientConsultation_respondedBy_fkey" FOREIGN KEY ("respondedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
