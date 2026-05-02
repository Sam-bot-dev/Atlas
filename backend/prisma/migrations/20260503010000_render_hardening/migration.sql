ALTER TABLE "Metric" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00';

UPDATE "Order" SET "externalId" = 'legacy-' || "id" WHERE "externalId" = '';
UPDATE "Customer" SET "externalId" = 'legacy-' || "id" WHERE "externalId" = '';

CREATE UNIQUE INDEX IF NOT EXISTS "Order_businessId_externalId_key" ON "Order"("businessId", "externalId");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_businessId_externalId_key" ON "Customer"("businessId", "externalId");
