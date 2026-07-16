/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Cause` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cause" DROP COLUMN "imageUrl",
ADD COLUMN     "imageUrls" TEXT[];
