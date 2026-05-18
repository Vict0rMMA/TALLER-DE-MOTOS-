-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- CreateTable
CREATE TABLE "WorkshopAppointment" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "motorcycleId" TEXT,
    "notes" TEXT,
    "preferredDate" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "status" "AppointmentStatus" NOT NULL DEFAULT 'pending',
    "confirmedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkshopAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkshopAppointment_workshopId_status_idx" ON "WorkshopAppointment"("workshopId", "status");

-- CreateIndex
CREATE INDEX "WorkshopAppointment_customerId_idx" ON "WorkshopAppointment"("customerId");

-- AddForeignKey
ALTER TABLE "WorkshopAppointment" ADD CONSTRAINT "WorkshopAppointment_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopAppointment" ADD CONSTRAINT "WorkshopAppointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopAppointment" ADD CONSTRAINT "WorkshopAppointment_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "Motorcycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopAppointment" ADD CONSTRAINT "WorkshopAppointment_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
