-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "emailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
