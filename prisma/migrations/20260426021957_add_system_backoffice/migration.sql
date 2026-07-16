-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('CNPJ_OR_CPF', 'ADDRESS_PROOF', 'POLICE_REPORT', 'MEDICAL_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Cause" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "cause_document" (
    "id" TEXT NOT NULL,
    "causeId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "docType" "DocType" NOT NULL,
    "status" "DocStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cause_document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cause_document_causeId_idx" ON "cause_document"("causeId");

-- AddForeignKey
ALTER TABLE "cause_document" ADD CONSTRAINT "cause_document_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE CASCADE ON UPDATE CASCADE;
