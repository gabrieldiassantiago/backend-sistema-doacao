-- CreateEnum
CREATE TYPE "BadgeKey" AS ENUM ('FIRST_DONATION', 'DONOR_5', 'DONOR_10', 'DONOR_20', 'TOTAL_500', 'TOTAL_1000');

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "xpEarned" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_badge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeKey" "BadgeKey" NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_badge_userId_idx" ON "user_badge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_badge_userId_badgeKey_key" ON "user_badge"("userId", "badgeKey");

-- AddForeignKey
ALTER TABLE "user_badge" ADD CONSTRAINT "user_badge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
