-- AlterTable
ALTER TABLE "Cause" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationName" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "state" TEXT;

-- CreateIndex
CREATE INDEX "Cause_city_idx" ON "Cause"("city");

-- CreateIndex
CREATE INDEX "Cause_status_idx" ON "Cause"("status");

-- CreateIndex
CREATE INDEX "Cause_status_city_idx" ON "Cause"("status", "city");
