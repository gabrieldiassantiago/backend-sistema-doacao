/*
  Warnings:

  - You are about to drop the column `imageUrls` on the `Cause` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cause" DROP COLUMN "imageUrls";

-- CreateTable
CREATE TABLE "cause_image" (
    "id" TEXT NOT NULL,
    "causeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cause_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cause_image_causeId_idx" ON "cause_image"("causeId");

-- CreateIndex
CREATE UNIQUE INDEX "cause_image_causeId_position_key" ON "cause_image"("causeId", "position");

-- AddForeignKey
ALTER TABLE "cause_image" ADD CONSTRAINT "cause_image_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE CASCADE ON UPDATE CASCADE;
