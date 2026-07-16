-- CreateTable
CREATE TABLE "collection_point" (
    "id" TEXT NOT NULL,
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_point_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accepted_item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "collectionPointId" TEXT NOT NULL,

    CONSTRAINT "accepted_item_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "accepted_item" ADD CONSTRAINT "accepted_item_collectionPointId_fkey" FOREIGN KEY ("collectionPointId") REFERENCES "collection_point"("id") ON DELETE CASCADE ON UPDATE CASCADE;
