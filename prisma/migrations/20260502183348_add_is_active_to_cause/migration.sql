-- AlterTable
ALTER TABLE "Cause" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Cause_isActive_idx" ON "Cause"("isActive");
