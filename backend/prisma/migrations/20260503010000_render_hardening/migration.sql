ALTER TABLE "Metric" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT '2026-05-03 03:12:00';

UPDATE "Order" SET "externalId" = 'legacy-' || "id" WHERE "externalId" = '';
UPDATE "Customer" SET "externalId" = 'legacy-' || "id" WHERE "externalId" = '';

CREATE UNIQUE INDEX IF NOT EXISTS "Order_businessId_externalId_key" ON "Order"("businessId", "externalId");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_businessId_externalId_key" ON "Customer"("businessId", "externalId");
