/*
  Warnings:

  - You are about to drop the column `isActive` on the `Cause` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropIndex
DROP INDEX "Cause_isActive_idx";

-- AlterTable
ALTER TABLE "Cause" DROP COLUMN "isActive";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "collection_point_suggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Brasil',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "suggestedItems" TEXT[],
    "reason" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedPointId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_point_suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestion_image" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggestion_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collection_point_suggestion_approvedPointId_key" ON "collection_point_suggestion"("approvedPointId");

-- CreateIndex
CREATE INDEX "collection_point_suggestion_userId_idx" ON "collection_point_suggestion"("userId");

-- CreateIndex
CREATE INDEX "collection_point_suggestion_status_idx" ON "collection_point_suggestion"("status");

-- CreateIndex
CREATE INDEX "suggestion_image_suggestionId_idx" ON "suggestion_image"("suggestionId");

-- CreateIndex
CREATE UNIQUE INDEX "suggestion_image_suggestionId_position_key" ON "suggestion_image"("suggestionId", "position");

-- AddForeignKey
ALTER TABLE "collection_point_suggestion" ADD CONSTRAINT "collection_point_suggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_image" ADD CONSTRAINT "suggestion_image_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "collection_point_suggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
