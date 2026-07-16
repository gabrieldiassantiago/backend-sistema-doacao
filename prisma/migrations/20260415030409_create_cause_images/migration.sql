/*
  Warnings:

  - You are about to drop the column `url` on the `cause_image` table. All the data in the column will be lost.
  - Added the required column `key` to the `cause_image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cause_image" DROP COLUMN "url",
ADD COLUMN     "key" TEXT NOT NULL;
